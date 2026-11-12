#!/usr/bin/env node
/**
 * funktionstest.js – alle Werkzeuge einmal gegen das echte scobees fahren
 *
 * Gedacht für den Moment, in dem scobees_me meldet „scobees wurde aktualisiert“: Das Skript legt in einem Fach
 * einen Test-Lernpfad an, ruft jedes Werkzeug mindestens einmal auf, prüft die Wirkung durch Zurücklesen und
 * löscht den Test-Lernpfad am Ende wieder (auch nach einem Fehlschlag).
 *
 * Aufruf:
 *   node scripts/funktionstest.js <Fach-ID>        z. B. SUBJ-… eines Test- oder eigenen Fachs
 * Anmeldung wie beim Server (Token-Datei oder SCOBEES_USERNAME/SCOBEES_PASSWORD).
 *
 * Es werden nur Inhalte angelegt und gelesen – keine Schüler- oder Personendaten, keine Zuweisung.
 * Ausgabe: je Schritt ✔/✖, am Ende eine Zusammenfassung. Rückgabewert 1, wenn ein Schritt scheitert, der
 * an scobees selbst liegt; der Bild-Upload ins Arbeitsblatt (externer Serlo-Dienst) zählt nur als Hinweis.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const { TOOLS } = require("../src/tools");
const { api } = require("../src/api");

const tool = (name) => {
  const t = TOOLS.find((x) => x.name === name);
  if (!t) throw new Error(`Werkzeug fehlt: ${name}`);
  return t.run;
};

// ── Testdateien ──────────────────────────────────────────────────────────────
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scobees-funktionstest-"));
function png(file, rgb, n = 128) {
  const raw = Buffer.concat(Array.from({ length: n }, () => Buffer.concat([Buffer.from([0]), Buffer.alloc(n * 3, Buffer.from(rgb))])));
  const crcTable = Array.from({ length: 256 }, (_, i) => { let c = i; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(n, 0); ihdr.writeUInt32BE(n, 4); ihdr.set([8, 2, 0, 0, 0], 8);
  const p = path.join(tmp, file);
  fs.writeFileSync(p, Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
  return p;
}
const FILES = {
  bildA: png("kachel-a.png", [0, 131, 143]),
  bildB: png("kachel-b.png", [240, 160, 40]),
  txt: path.join(tmp, "material.txt"),
  pdf: path.join(tmp, "vorlage.pdf"),
};
fs.writeFileSync(FILES.txt, "Testmaterial\n");
fs.writeFileSync(FILES.pdf, "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");

// ── Protokoll ────────────────────────────────────────────────────────────────
const results = [];
async function step(name, fn, { external = false } = {}) {
  try {
    const note = await fn();
    results.push({ name, ok: true, note });
    console.log(`✔ ${name}${note ? "  – " + note : ""}`);
    return true;
  } catch (e) {
    const msg = String(e.message || e).split("\n")[0].slice(0, 220);
    results.push({ name, ok: false, external, note: msg });
    console.log(`${external ? "⚠" : "✖"} ${name}  – ${msg}`);
    return false;
  }
}
const must = (cond, msg) => { if (!cond) throw new Error(msg); };
async function expectError(fn, pattern, what) {
  try { await fn(); } catch (e) { must(pattern.test(e.message), `${what}: unerwartete Meldung „${e.message.slice(0, 120)}“`); return; }
  throw new Error(`${what}: hätte scheitern müssen`);
}

const MARKDOWN = [
  "# Funktionstest", "",
  "Absatz mit **fett**, *kursiv*, `code`, [Link](https://example.org) und $U = R \\cdot I$. Variable u_e bleibt Text.", "",
  "| Größe | Wert |", "| --- | --- |", "| Widerstand | 10 kΩ |", "",
  ":::box note Hinweis", "Kastentext", ":::", "",
  ":::spoiler Lösung", "Zeile eins", "Zeile zwei", ":::", "",
  "```math", "| Einleitung", "U = R \\cdot I | nach I umstellen", "I = \\frac{U}{R}", "```", "",
  "```quiz-sc", "Frage?", "- [x] richtig :: gut", "- [ ] falsch", "```", "",
  "```quiz-mc", "Mehrere?", "- [x] a", "- [x] b", "- [ ] c", "```", "",
  "```quiz-input", "Wie viel?", "= 42 V", "≠ 41 :: knapp daneben", "```", "",
  "```quiz-input", "Gateway?", "= 172.16.40.1", "```", "",
  "```quiz-blanks", "Strom in [[Ampere|A]].", "```", "",
  "```quiz-blanks-dnd", "Spannung in [[Volt]].", "Zweite Zeile ohne Lücke.", "+ Ohm", "```", "",
  "```quiz-text", "Begründe.", "```", "",
  "Einmaliger Platzhalter XYZ.",
].join("\n");

async function main() {
  const subjectId = process.argv[2];
  if (!subjectId) { console.error("Aufruf: node scripts/funktionstest.js <Fach-ID>"); process.exit(2); }
  let rootId, folderId, taskId, choiceId, childId;

  try {
    await step("scobees_me", async () => {
      const me = await tool("scobees_me")({});
      must(me.id && me.scobees, "Konto oder Versionsangabe fehlt");
      return `scobees ${me.scobees.version} (${me.scobees.bundle}); geprüft mit ${me.scobees.geprueft_mit}`;
    });
    await step("scobees_list_workspaces", async () => { const w = await tool("scobees_list_workspaces")({}); must(Array.isArray(w) && w.length, "keine Lernbereiche"); return `${w.length} Lernbereiche`; });
    await step("scobees_list_subjects", async () => { const s = await tool("scobees_list_subjects")({}); must(s.some((x) => x.id === subjectId), `Fach ${subjectId} nicht in der Liste`); return `${s.length} Fächer`; });
    await step("scobees_list_tags", async () => { const t = await tool("scobees_list_tags")({}); must(t.jahrgaenge.length && t.differenzierungen.length, "Jahrgänge oder Niveaus leer"); return `${t.jahrgaenge.length} Jahrgänge, ${t.differenzierungen.length} Niveaus`; });

    const okRoot = await step("scobees_create_lernpfad (Beschreibung wird reiner Text, Titelbild)", async () => {
      const r = await tool("scobees_create_lernpfad")({ subject_id: subjectId, name: "FUNKTIONSTEST scobees-mcp [wird automatisch gelöscht]", description: "<p>Test &amp; Text</p><p>Zweite Zeile</p>", cover_image_path: FILES.bildA });
      rootId = r.id;
      must(r.hat_titelbild === true, "create_lernpfad meldet hat_titelbild nicht");
      const cur = await api.lerninput(rootId);
      must(cur.description === "Test & Text\nZweite Zeile", `Beschreibung gespeichert als ${JSON.stringify(cur.description)}`);
      must(cur.coverImage, "Titelbild fehlt");
      return `${r.id}, Status ${r.state}`;
    });
    if (!okRoot) throw new Error("Ohne Test-Lernpfad kein weiterer Test möglich.");

    await step("scobees_list_lernpfade (Suche)", async () => { const l = await tool("scobees_list_lernpfade")({ subject_id: subjectId, title: "FUNKTIONSTEST" }); must(l.some((x) => x.id === rootId), "Test-Lernpfad nicht gefunden"); });
    await step("scobees_update_lernpfad", async () => {
      const u = await tool("scobees_update_lernpfad")({ id: rootId, stichwoerter: ["funktionstest"], solve_order: "after_solving" });
      must(u.hat_titelbild === true, "update_lernpfad meldet hat_titelbild nicht");
      const cur = await api.lerninput(rootId);
      must(cur.solveOrder === "after_solving", `solveOrder ist ${cur.solveOrder}`);
      must(cur.coverImage, "Titelbild ging beim Ändern verloren");
      must(cur.description === "Test & Text\nZweite Zeile", "Beschreibung ging beim Ändern verloren");
    });

    await step("scobees_create_gliederung (Kachelbild, Farbe)", async () => {
      const g = await tool("scobees_create_gliederung")({ parent_id: rootId, name: "1 · Gliederung", description_html: "<p>Phase</p>", cover_image_path: FILES.bildA, color: "#b71c1c" });
      folderId = g.id; must(g.hat_titelbild, "Kachelbild nicht gesetzt");
    });
    await step("scobees_update_gliederung (Bild und Farbe bleiben)", async () => {
      await tool("scobees_update_gliederung")({ id: folderId, name: "1 · Gliederung (umbenannt)" });
      const cur = await api.lerninput(folderId);
      must(cur.name.endsWith("(umbenannt)"), "Name nicht geändert");
      must(cur.color === "#b71c1c", `Farbe ist ${cur.color}`);
      must(cur.coverImage, "Kachelbild verloren");
    });

    await step("scobees_create_aufgabe (alle Markdown-Bausteine, Kachelbild)", async () => {
      const a = await tool("scobees_create_aufgabe")({ parent_id: folderId, name: "1.1 Bausteine", description_html: "<p><strong>Ergebnis:</strong> Keine Abgabe.</p>", arbeitsblatt_markdown: MARKDOWN, estimated_time: 10, interne_notiz: "Erwartungshorizont", cover_image_path: FILES.bildA });
      taskId = a.id;
      must(a.hat_titelbild === true, "create_aufgabe meldet hat_titelbild nicht");
      for (const p of ["text", "serloTable", "box", "spoiler", "equations", "scMcExercise", "inputExercise", "blanksExercise", "textAreaExercise"]) must(a.bausteine.includes(p), `Baustein ${p} fehlt`);
      return a.bausteine.length + " Bausteintypen";
    });
    await step("scobees_get_aufgabe (Rundreise)", async () => {
      const a = await tool("scobees_get_aufgabe")({ id: taskId, mit_serlo_json: true });
      const md = a.arbeitsblatt_markdown;
      must(a.art === "selbstkontrolle" && a.taskType === "Pflichtaufgabe", `art/taskType: ${a.art}/${a.taskType}`);
      must(md.includes("u_e bleibt Text"), "Unterstrich im Variablennamen verändert");
      must(md.includes("10 kΩ"), "geschütztes Leerzeichen verloren");
      must(md.includes("unit: V") && md.includes("≠ 41 :: knapp daneben"), "quiz-input nicht verlustfrei");
      must(md.includes("Zeile eins\n\nZeile zwei"), "Zeilen im Spoiler zusammengezogen");
      must(md.includes("[[Ampere|A]]") && md.includes("+ Ohm"), "Lückentexte nicht verlustfrei");
      must(md.includes("= 172.16.40.1") && JSON.stringify(a.serlo_json).includes("input-string-normalized-match-challenge"), "IP-Adresse nicht als Texteingabe angelegt");
      must(a.titelbild && a.interne_notiz === "Erwartungshorizont" && a.estimatedTime === 10, "Titelbild, Notiz oder Zeit fehlt");
      must(a.serlo_json && a.serlo_json.plugin === "rows", "serlo_json fehlt");
    });
    await step("scobees_patch_arbeitsblatt", async () => {
      await tool("scobees_patch_arbeitsblatt")({ id: taskId, ersetzungen: [{ alt: "Einmaliger Platzhalter XYZ.", neu: "Ersetzt." }] });
      const a = await tool("scobees_get_aufgabe")({ id: taskId });
      must(a.arbeitsblatt_markdown.includes("Ersetzt.") && !a.arbeitsblatt_markdown.includes("XYZ"), "Ersetzung nicht angekommen");
      await expectError(() => tool("scobees_patch_arbeitsblatt")({ id: taskId, ersetzungen: [{ alt: "gibt es nicht", neu: "x" }] }), /kommt 0× vor/, "Patch ohne Treffer");
    });
    await step("scobees_update_aufgabe (Abgabeform, Typ, Kachelbild ersetzen)", async () => {
      const u = await tool("scobees_update_aufgabe")({ id: taskId, art: "abgabe_pflicht_selbstkorrektur", abgabeformen: ["pen", "file"], aufgabentyp: "training", cover_image_path: FILES.bildB });
      must(u.hat_titelbild === true, "update_aufgabe meldet hat_titelbild nicht");
      const a = await tool("scobees_get_aufgabe")({ id: taskId });
      must(a.art === "abgabe_pflicht_selbstkorrektur", `art ist ${a.art}`);
      must(a.abgabeformen.includes("pen") && a.abgabeformen.includes("file"), `abgabeformen: ${a.abgabeformen}`);
      must(a.taskType === "Trainingsaufgabe", `taskType ist ${a.taskType}`);
      must(a.titelbild && /kachel-b/.test(a.titelbild.filename), "Kachelbild nicht ersetzt");
      must(a.arbeitsblatt_markdown.includes("Ersetzt."), "Arbeitsblatt ging beim Feld-Update verloren");
    });

    await step("scobees_upload_material / ersetzt_attachment_id / scobees_delete_material", async () => {
      const m1 = await tool("scobees_upload_material")({ aufgabe_id: taskId, file_path: FILES.txt });
      const m2 = await tool("scobees_upload_material")({ aufgabe_id: taskId, file_path: FILES.pdf, ersetzt_attachment_id: m1.attachment_id });
      must(!m2.warnung, `Ersetzen meldet: ${m2.warnung}`);
      const sol = await tool("scobees_upload_material")({ aufgabe_id: taskId, file_path: FILES.pdf, als_musterloesung: true });
      let a = await tool("scobees_get_aufgabe")({ id: taskId });
      must(a.anhaenge.length === 1 && a.anhaenge[0].id === m2.attachment_id, `Anhänge: ${a.anhaenge.map((x) => x.filename)}`);
      must(a.musterloesungen.length === 1, "Musterlösung fehlt");
      await tool("scobees_delete_material")({ aufgabe_id: taskId, attachment_id: sol.attachment_id, confirm: true });
      const d = await tool("scobees_delete_material")({ aufgabe_id: taskId, attachment_id: m2.attachment_id, confirm: true });
      must(d.warnung, "Warnung beim letzten PDF einer Stift-Abgabe fehlt");
      a = await tool("scobees_get_aufgabe")({ id: taskId });
      must(a.anhaenge.length === 0 && a.musterloesungen.length === 0, "Anhänge nicht gelöscht");
      await expectError(() => tool("scobees_delete_material")({ aufgabe_id: taskId, attachment_id: "ATT-FREMD", confirm: true }), /gehört nicht zu Aufgabe/, "Fremder Anhang");
    });

    await step("scobees_create_wahlpflicht + Unteraufgabe", async () => {
      const w = await tool("scobees_create_wahlpflicht")({ parent_id: folderId, name: "1.2 Wahlpflicht", mindest_aufgaben: 1 });
      choiceId = w.id;
      must(w.hat_titelbild === false, "create_wahlpflicht meldet hat_titelbild nicht");
      const c = await tool("scobees_create_aufgabe")({ parent_id: choiceId, name: "1.2.1 Wahl A", arbeitsblatt_markdown: "Text." });
      childId = c.id;
      const cur = await api.lerninput(childId);
      must(cur.parentId === choiceId && cur.taskType === "Wahlpflichtaufgabe", `parent/taskType: ${cur.parentId}/${cur.taskType}`);
    });
    await step("scobees_update_wahlpflicht", async () => {
      await tool("scobees_update_wahlpflicht")({ id: choiceId, name: "1.2 Wahlpflicht (geändert)", mindest_aufgaben: 1 });
      const cur = await api.lerninput(choiceId);
      must(cur.name.endsWith("(geändert)"), "Name nicht geändert");
    });
    await step("scobees_move (umhängen zwischen Lernpfad und Gliederung)", async () => {
      const m = await tool("scobees_move")({ id: taskId, parent_id: rootId, sort_order: 0 });
      must(!m.warnung, `unerwartete Warnung: ${m.warnung}`);
      let cur = await api.lerninput(taskId);
      must(cur.parentId === rootId, "Aufgabe hängt nicht am Lernpfad");
      await tool("scobees_move")({ id: taskId, parent_id: folderId, sort_order: 0 });
      cur = await api.lerninput(taskId);
      must(cur.parentId === folderId && cur.taskType === "Trainingsaufgabe", "Aufgabe hängt nicht wieder in der Gliederung oder Typ verändert");
    });
    await step("scobees_move (Regeln rund um Wahlpflichtaufgaben)", async () => {
      // Seit scobees 94.6 nimmt eine Wahlpflichtaufgabe bestehende Aufgaben an und stellt deren Typ um.
      const extra = await tool("scobees_create_aufgabe")({ parent_id: folderId, name: "1.3 wird Wahlaufgabe", arbeitsblatt_markdown: "Text.", aufgabentyp: "extra" });
      const m = await tool("scobees_move")({ id: extra.id, parent_id: choiceId, sort_order: 0 });
      const cur = await api.lerninput(extra.id);
      must(cur.parentId === choiceId && cur.taskType === "Wahlpflichtaufgabe", `nach Verschieben: ${cur.parentId}/${cur.taskType}`);
      must(m.warnung && m.aufgabentyp === "Wahlpflichtaufgabe", "Warnung zur Typumstellung fehlt");
      // Innerhalb der Wahlpflichtaufgabe umsortieren geht, heraus nicht; Gliederungen gehen nicht hinein.
      await tool("scobees_move")({ id: childId, parent_id: choiceId, sort_order: 0 });
      must((await api.lerninput(childId)).sortOrder === 0, "Umsortieren innerhalb der Wahlpflichtaufgabe wirkungslos");
      await expectError(() => tool("scobees_move")({ id: extra.id, parent_id: folderId, sort_order: 0 }), /nicht aus ihrer Wahlpflichtaufgabe heraus/, "Unteraufgabe herausschieben");
      const g2 = await tool("scobees_create_gliederung")({ parent_id: rootId, name: "2 · Zweite Gliederung" });
      await expectError(() => tool("scobees_move")({ id: g2.id, parent_id: choiceId, sort_order: 0 }), /nicht in eine Wahlpflichtaufgabe verschieben/, "Gliederung in Wahlpflicht");
      await tool("scobees_delete")({ id: g2.id, confirm: true });
      await tool("scobees_delete")({ id: extra.id, confirm: true });
    });
    await step("scobees_get_lernpfad (Baum)", async () => {
      const t = await tool("scobees_get_lernpfad")({ id: rootId });
      must(t.typ === "lernpfad" && t.hat_titelbild && t.beschreibung === "Test & Text\nZweite Zeile", "Wurzel stimmt nicht");
      const g = t.children.find((c) => c.id === folderId);
      must(g && g.typ === "gliederung" && g.hat_titelbild, "Gliederung fehlt oder ohne Bild");
      const typen = g.children.map((c) => c.typ).sort().join(",");
      must(typen === "aufgabe,wahlpflicht", `Kinder der Gliederung: ${typen}`);
      must(g.children.find((c) => c.id === choiceId).children[0].typ === "wahlaufgabe", "Unteraufgabe der Wahlpflicht fehlt");
    });
    await step("scobees_markdown_vorschau (Warnungen)", async () => {
      const v = await tool("scobees_markdown_vorschau")({ markdown: "Echte _Betonung_.\n\n```quiz-blanks-dnd\nFormel [[$U=RI$]].\n```" });
      must(v.warnungen && v.warnungen.length === 2, `Warnungen: ${JSON.stringify(v.warnungen)}`);
    });
    await step("scobees_upload_bild (externer Serlo-Medienspeicher)", async () => {
      const b = await tool("scobees_upload_bild")({ file_path: FILES.bildA });
      must(/^https?:\/\//.test(b.url || ""), "keine URL erhalten");
      return b.url;
    }, { external: true });
    await step("scobees_delete (einzelne Aufgabe)", async () => {
      await tool("scobees_delete")({ id: childId, confirm: true });
      await expectError(() => api.lerninput(childId), /HTTP 404/, "Gelöschte Aufgabe");
      await expectError(() => tool("scobees_delete")({ id: taskId, confirm: false }), /confirm muss true sein/, "Löschen ohne confirm");
    });
  } catch (e) {
    console.log(`✖ Abbruch: ${e.message}`);
    results.push({ name: "Abbruch", ok: false, note: e.message });
  } finally {
    if (rootId) {
      await step("Aufräumen: Test-Lernpfad löschen", async () => {
        await tool("scobees_delete")({ id: rootId, confirm: true });
        await expectError(() => api.lerninput(rootId), /HTTP 404/, "Gelöschter Lernpfad");
      });
    }
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  const failed = results.filter((r) => !r.ok && !r.external);
  const external = results.filter((r) => !r.ok && r.external);
  console.log(`\n${results.filter((r) => r.ok).length} von ${results.length} Schritten in Ordnung` +
    (external.length ? `, ${external.length} externer Hinweis` : "") + (failed.length ? `, ${failed.length} FEHLGESCHLAGEN` : "") + ".");
  process.exitCode = failed.length ? 1 : 0;
}

main();
