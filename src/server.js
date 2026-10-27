#!/usr/bin/env node
/**
 * server.js – MCP-stdio-Server für scobees (Aufbau wie moodle-mcp von Dr. Tuttas)
 *
 * Start:  node src/server.js            (als MCP-Server, z. B. aus Claude Desktop)
 *         node src/server.js --login    (einmalige Anmeldung testen, Token speichern)
 *         node src/server.js --tools    (Werkzeugliste anzeigen)
 */

const { TOOLS } = require("./tools");
const auth = require("./auth");
const pkg = require("../package.json");

// ── CLI-Hilfsmodi ────────────────────────────────────────────────────────────
if (process.argv.includes("--login")) {
  (async () => {
    const { api } = require("./api");
    const me = await api.me();
    console.log(`Angemeldet als ${me.id} (${me.role}) an ${me.schoolName}. Token-Datei: ${auth.TOKEN_FILE}`);
  })().catch((e) => { console.error(e.message); process.exit(1); });
  return;
}
if (process.argv.includes("--tools")) {
  for (const t of TOOLS) console.log(`${t.name}\n  ${t.description}\n`);
  return;
}

// ── MCP-Protokoll über stdin/stdout ──────────────────────────────────────────
const send = (obj) => process.stdout.write(JSON.stringify(obj) + "\n");
const byName = Object.fromEntries(TOOLS.map((t) => [t.name, t]));

async function handle(req) {
  const { id, method, params } = req;

  if (method === "initialize") {
    return send({
      jsonrpc: "2.0", id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "scobees-mcp", version: pkg.version },
        instructions:
          "Kursaufbau in scobees. Reihenfolge: scobees_list_subjects → Fach wählen → scobees_create_lernpfad → scobees_create_gliederung → " +
          "scobees_create_aufgabe (Arbeitsblatt als Markdown). Bestehende Kurse: scobees_list_lernpfade → scobees_get_lernpfad → update/move/delete. " +
          "Dieser Server greift nie auf Schüler- oder Personendaten zu.",
      },
    });
  }

  if (method === "tools/list") {
    return send({ jsonrpc: "2.0", id, result: { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) } });
  }

  if (method === "tools/call") {
    const { name, arguments: args = {} } = params || {};
    const tool = byName[name];
    try {
      if (!tool) throw new Error(`Unbekanntes Werkzeug: ${name}`);
      validateArgs(tool, args);
      const result = await tool.run(args);
      return send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] } });
    } catch (err) {
      return send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: `Fehler: ${err.message}` }], isError: true } });
    }
  }

  if (method === "ping") return send({ jsonrpc: "2.0", id, result: {} });
  if (method && method.startsWith("notifications/")) return;
  if (id !== undefined) send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Methode nicht gefunden: ${method}` } });
}

// Eingaben gegen das Schema prüfen: unbekannte Parameter und ungültige enum-Werte werden abgewiesen statt
// still ignoriert (sonst geht z. B. „abgabeform: pen“ verloren, ohne dass es jemand merkt).
const ALIASES = { abgabeform: "abgabeformen" };
function validateArgs(tool, args) {
  const props = tool.inputSchema?.properties || {};
  const problems = [];
  for (const [k, v] of Object.entries(args)) {
    const key = ALIASES[k] || k;
    const def = props[key];
    if (!def) { problems.push(`unbekannter Parameter „${k}“ – gültig: ${Object.keys(props).join(", ")}`); continue; }
    const en = def.enum || def.items?.enum;
    if (en) for (const x of [].concat(v)) if (!en.includes(x)) problems.push(`„${k}“: „${x}“ ist ungültig – gültig: ${en.join(", ")}`);
  }
  for (const r of tool.inputSchema?.required || []) if (args[r] === undefined) problems.push(`Pflichtparameter „${r}“ fehlt`);
  if (problems.length) throw new Error(problems.join("; "));
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  const lines = buffer.split("\n");
  buffer = lines.pop();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let req;
    try { req = JSON.parse(trimmed); } catch { continue; }
    handle(req).catch((e) => process.stderr.write(`[scobees-mcp] ${e.stack || e}\n`));
  }
});
process.stdin.on("end", () => process.exit(0));
process.stderr.write(`scobees-mcp ${pkg.version} gestartet\n`);
