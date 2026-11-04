#!/usr/bin/env node
/**
 * diagnose-serlo-upload.js – Bild-Upload ins Serlo-Arbeitsblatt Schritt für Schritt prüfen
 *
 * Prüft die drei Schritte von scobees_upload_bild EINZELN und zeigt, wo genau es scheitert:
 *   1. GET  <SERLO_MEDIA_URL>/presigned-url   (unauthentifiziert – derselbe Aufruf wie der
 *      eingebettete Serlo-Editor in der scobees-Weboberfläche selbst macht)
 *   2. PUT  <signedUrl>                        (Bild zu S3 hochladen)
 *   3. api.uploadSerloImage(...)                (derselbe Weg über den MCP-Server)
 *
 * Kein scobees-Login nötig – presigned-url und der S3-Upload laufen ohne Token.
 *
 * Aufruf:
 *   node scripts/diagnose-serlo-upload.js [pfad-zu-einem-bild.png]
 * Ohne Pfad wird ein winziges 1x1-Test-PNG erzeugt.
 * SCOBEES_DEBUG=1 zeigt zusätzlich Antwort-Header.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { api, SERLO_MEDIA_URL, uploadErrorMessage, maskUrl } = require("../src/api");

// 1×1-Pixel-PNG (transparent), 68 Byte – genug, um den Upload-Pfad zu prüfen.
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function tinyPngFile() {
  const p = path.join(os.tmpdir(), `scobees-mcp-diagnose-${Date.now()}.png`);
  fs.writeFileSync(p, Buffer.from(TINY_PNG_BASE64, "base64"));
  return p;
}

async function main() {
  const givenPath = process.argv[2];
  const filePath = givenPath || tinyPngFile();
  console.log(`Testdatei: ${filePath}${givenPath ? "" : "  (automatisch erzeugtes 1×1-PNG, 68 Byte)"}\n`);

  console.log(`── Schritt 1: GET ${SERLO_MEDIA_URL}/presigned-url ──`);
  const q = new URLSearchParams({ mimeType: "image/png", editorVariant: "unknown", parentHost: "teach.scobees.com" });
  const preUrl = `${SERLO_MEDIA_URL}/presigned-url?${q}`;
  const pre = await fetch(preUrl);
  console.log(`Status: ${pre.status} ${pre.statusText}`);
  if (!pre.ok) {
    console.log("\n" + (await uploadErrorMessage("Serlo presigned-url", preUrl, pre.clone ? pre.clone() : pre)));
    console.log("\nAbbruch: Schritt 1 ist bereits fehlgeschlagen, Schritt 2 wird übersprungen.");
    await step3(filePath);
    return;
  }
  const { signedUrl, fileUrl } = await pre.json();
  console.log(`OK – signedUrl erhalten (${maskUrl(signedUrl)})`);

  console.log(`\n── Schritt 2: PUT ${maskUrl(signedUrl)} ──`);
  const blob = new Blob([fs.readFileSync(filePath)], { type: "image/png" });
  const put = await fetch(signedUrl, { method: "PUT", body: blob, headers: { "Content-Type": "image/png" } });
  console.log(`Status: ${put.status} ${put.statusText}`);
  if (!put.ok) {
    console.log("\n" + (await uploadErrorMessage("Bild-Upload zu Serlo", signedUrl, put)));
  } else {
    console.log(`OK – Bild liegt jetzt öffentlich unter: ${fileUrl}`);
  }

  await step3(filePath);
}

async function step3(filePath) {
  console.log(`\n── Schritt 3: api.uploadSerloImage() (voller Weg über den MCP-Server) ──`);
  try {
    const url = await api.uploadSerloImage(filePath);
    console.log(`OK – ${url}`);
  } catch (e) {
    console.log(`Fehlgeschlagen:\n${e.message}`);
  }
}

main().catch((e) => {
  console.error("Unerwarteter Fehler im Diagnose-Skript:", e);
  process.exit(1);
});
