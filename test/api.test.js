const test = require("node:test");
const assert = require("node:assert/strict");
const { assertAllowed, sanitize, lerninputForm } = require("../src/api");

test("Sperrliste blockiert Schüler- und Personendaten", () => {
  const blocked = [
    "students?withDeleted=false", "users/USER-123", "users", "school/SCHOOL-944/teachers?withDeleted=false", "teachers/USER-1",
    "solutions/SOL-1", "LI-1/lernergebnisse/user/USER-1", "learncoaching-protocols/1", "notes/1", "assignments/lerninput/LI-1",
    "teacher-dashboard/counts", "gelingensnachweis/slots", "exam/1", "checkins/1", "attendance-blocks/1", "impersonation/redeem",
    "school-classes", "school-groups/1/users/bulk", "reflections/1", "learn-levels/1", "subject/assignment/1",
  ];
  for (const p of blocked) assert.throws(() => assertAllowed(p), /Blockiert/, `sollte blockiert sein: ${p}`);
});

test("Sperrliste lässt Inhaltspfade durch", () => {
  const allowed = [
    "users/me", "workspaces", "subjects?withDeleted=false", "lerninput", "lerninput/LI-1", "lerninput/folder", "lerninput/task",
    "lerninput/choice", "lerninput/changePosition/LI-1", "attachments", "attachment?path=x", "lerninput/library/tags",
    "school-diffs", "school/SCHOOL-944/features", "subject-default-tags", "library", "school-diffs/root-lerninput/LI-1",
  ];
  for (const p of allowed) assert.equal(assertAllowed(p), p);
});

test("Filter reduziert Personenobjekte auf IDs", () => {
  const input = {
    id: "LI-1", name: "Pfad",
    editors: [{ id: "USER-A", username: "a.b", firstname: "A", lastname: "B" }],
    author: { id: "USER-A", username: "a.b", firstname: "A", lastname: "B" },
    children: [{ id: "LI-2", editors: [], uploadedBy: "USER-A", email: "x@y.z" }],
  };
  const out = sanitize(input);
  assert.deepEqual(out.editors, ["USER-A"]);
  assert.equal(out.author, "USER-A");
  assert.equal(out.children[0].uploadedBy, "USER-A");
  assert.equal("email" in out.children[0], false);
  assert.equal(out.name, "Pfad");
});

test("Formularfelder werden JSON-kodiert wie in der Weboberfläche", () => {
  const fd = lerninputForm({ name: "Test", diffs: [], estimatedTime: 15, attachments: undefined, taskDescription: null });
  assert.equal(fd.get("name"), '"Test"');
  assert.equal(fd.get("diffs"), "[]");
  assert.equal(fd.get("estimatedTime"), "15");
  assert.equal(fd.get("attachments"), "undefined");
  assert.equal(fd.get("taskDescription"), "null");
});

test("Aufgabentypen entsprechen dem scobees-Enum (kein „Wahlaufgabe“)", () => {
  const { TOOLS } = require("../src/tools");
  const create = TOOLS.find((t) => t.name === "scobees_create_aufgabe");
  assert.deepEqual(create.inputSchema.properties.aufgabentyp.enum, ["pflicht", "extra", "training", "info"]);
  assert.equal("wahlaufgabe" in create.inputSchema.properties, false);
});

test("Abgabeformen: selbstkontrolle ohne Abgabe, abgabe_* mit requiredSubmissions", () => {
  const { KIND } = require("../src/tools");
  assert.equal(KIND.selbstkontrolle.kind, "task");
  assert.deepEqual(KIND.selbstkontrolle.requiredSubmissions, []);
  assert.equal(KIND.selbstkontrolle.isSelfCorrectionNecessary, false);
  assert.equal(KIND.abgabe_selbstkorrektur.isSelfCorrectionNecessary, true);
  assert.equal("abgabe_optional_sc" in KIND, false);
});

test("Server weist unbekannte Parameter und ungültige enum-Werte ab", () => {
  const { spawnSync } = require("node:child_process");
  const run = (args) => {
    const msgs = [
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "t", version: "0" } } },
      { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "scobees_create_aufgabe", arguments: args } },
    ].map((m) => JSON.stringify(m)).join("\n") + "\n";
    const r = spawnSync(process.execPath, ["src/server.js"], { input: msgs, encoding: "utf8", env: { ...process.env, SCOBEES_TOKEN_FILE: "/nonexistent" } });
    const line = r.stdout.split("\n").find((l) => l.includes('"id":2'));
    return JSON.parse(line).result;
  };
  let res = run({ parent_id: "LI-1", name: "x", art: "abgabe_pflicht_sc" });
  assert.equal(res.isError, true); assert.match(res.content[0].text, /abgabe_pflicht_sc.*ungültig/);
  res = run({ parent_id: "LI-1", name: "x", abgabeformen: ["stift"] });
  assert.match(res.content[0].text, /stift.*ungültig/);
  res = run({ name: "x", irgendwas: 1 });
  assert.match(res.content[0].text, /unbekannter Parameter „irgendwas“/); assert.match(res.content[0].text, /Pflichtparameter „parent_id“/);
});
