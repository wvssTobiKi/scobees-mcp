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
    "lerninput/choice", "lerninput/changePosition/LI-1", "attachments", "attachments/ATT-1", "attachment?path=x", "lerninput/library/tags",
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

test("uploadErrorMessage zeigt Statuscode, Antworttext und Hinweis bei 402 (vorher verworfen)", async () => {
  const { uploadErrorMessage } = require("../src/api");
  const fakeRes = {
    status: 402, statusText: "Payment Required",
    headers: new Map([["content-type", "text/html"], ["authorization", "Bearer geheim"], ["set-cookie", "sid=geheim"]]).entries
      ? { entries: () => new Map([["content-type", "text/html"], ["authorization", "Bearer geheim"]]).entries() }
      : {},
    text: async () => "<p>This account has been disabled.</p>",
  };
  const msg = await uploadErrorMessage("Serlo presigned-url", "https://editor.serlo.org/media/presigned-url?mimeType=image/png", fakeRes);
  assert.match(msg, /HTTP 402/);
  assert.match(msg, /This account has been disabled/);
  assert.match(msg, /betrifft also alle scobees-Lehrkräfte/);
  assert.match(msg, /scobees_upload_material/);
});

test("uploadErrorMessage maskiert Secrets nur im Debug-Modus, URL-Signaturen immer", async () => {
  const path = require("node:path");
  const { spawnSync } = require("node:child_process");
  const script = `
    const { uploadErrorMessage, maskUrl } = require(${JSON.stringify(path.resolve(__dirname, "../src/api"))});
    const res = { status: 403, statusText: "Forbidden", headers: { entries: () => [["authorization", "Bearer geheim"]][Symbol.iterator]() }, text: async () => "nope" };
    (async () => {
      const url = "https://s3.example.com/x?X-Amz-Signature=geheim&X-Amz-Credential=geheim2&foo=bar";
      console.log(maskUrl(url));
      console.log(await uploadErrorMessage("PUT", url, res));
    })();
  `;
  const r = spawnSync(process.execPath, ["-e", script], { encoding: "utf8", env: { ...process.env, SCOBEES_DEBUG: "1" } });
  assert.match(r.stdout, /X-Amz-Signature=\*\*\*/);
  assert.match(r.stdout, /X-Amz-Credential=\*\*\*/);
  assert.match(r.stdout, /foo=bar/);
  assert.match(r.stdout, /\[Debug\] Antwort-Header/);
  assert.doesNotMatch(r.stdout, /Bearer geheim/);
});

test("clarifyTaskgroupError übersetzt das scobees-HTTP-405 für Wahlpflicht-Kinder verständlich", () => {
  const { clarifyTaskgroupError } = require("../src/tools");
  const raw = 'scobees-API POST lerninput/task → HTTP 405: {"message":"Add or edit as child (task) from taskgroup without type choice is not allowed","error":"Method Not Allowed","statusCode":405}';
  assert.throws(() => clarifyTaskgroupError(new Error(raw)), (e) => {
    assert.match(e.message, /braucht den Aufgabentyp „Wahlpflichtaufgabe“/);
    assert.match(e.message, /Add or edit as child \(task\) from taskgroup/);
    return true;
  });
  // Die beiden Verschiebe-Regeln bekommen je eine eigene Erklärung (Stand scobees 94.6)
  const move = (msg) => new Error(`scobees-API PUT lerninput/changePosition/LI-1 → HTTP 405: {"message":"${msg}","error":"Method Not Allowed","statusCode":405}`);
  assert.throws(() => clarifyTaskgroupError(move("Changing the parent of a taskgroup task is not allowed")), /nicht aus ihrer Wahlpflichtaufgabe heraus verschieben/);
  assert.throws(() => clarifyTaskgroupError(move("Changing the parent to a taskgroup is not allowed")), /nicht in eine Wahlpflichtaufgabe verschieben.*seit Version 94\.6/s);
  // Andere Fehler bleiben unverändert (kein falsches „Positiv“ auf irgendein Wort)
  assert.throws(() => clarifyTaskgroupError(new Error("scobees-API GET lerninput/LI-1 → HTTP 404: nicht gefunden")), /HTTP 404/);
});

test("htmlToPlainText: Absätze werden Zeilenumbrüche, Tags fallen weg, Entities werden aufgelöst", () => {
  const { htmlToPlainText } = require("../src/tools");
  assert.equal(htmlToPlainText("<p>Grundlagen zum Ohmschen Gesetz</p>"), "Grundlagen zum Ohmschen Gesetz");
  assert.equal(htmlToPlainText("<p>Erste Zeile</p><p>Zweite Zeile</p>"), "Erste Zeile\nZweite Zeile");
  assert.equal(htmlToPlainText("Zeile eins<br>Zeile zwei"), "Zeile eins\nZeile zwei");
  assert.equal(htmlToPlainText("Strom &amp; Spannung, Gr&ouml;&szlig;e &lt;x&gt;"), "Strom & Spannung, Größe <x>");
  assert.equal(htmlToPlainText("Reiner Text ohne HTML"), "Reiner Text ohne HTML");
  assert.equal(htmlToPlainText(""), "");
  assert.equal(htmlToPlainText(undefined), "");
});

test("compact(): Lernpfad-Beschreibung kommt unverändert zurück (Bugs beim Zurücklesen sichtbar), Gliederung/Aufgabe bleiben bereinigt", () => {
  const { compact } = require("../src/tools");
  const root = {
    id: "LI-1", name: "Pfad", sortOrder: 0, state: "INACTIVE", isPublished: true, parentId: null, isLeaf: false,
    description: "<p>versehentlich stehengebliebenes HTML</p>",
    children: [{ id: "LI-2", name: "Gliederung", sortOrder: 0, state: "DRAFT", isPublished: false, parentId: "LI-1", isLeaf: false, description: "<h2>Titel</h2><p>Text</p>", children: [] }],
  };
  const out = compact(root);
  assert.equal(out.typ, "lernpfad");
  assert.match(out.beschreibung, /^<p>versehentlich/);
  assert.equal(out.children[0].typ, "gliederung");
  assert.doesNotMatch(out.children[0].beschreibung, /[<>]/);
});

test("findAttachment / letztesPenPdfWarnung: Zugehörigkeit und Pen-PDF-Warnung", () => {
  const { findAttachment, letztesPenPdfWarnung } = require("../src/tools");
  const cur = {
    requiredSubmissions: ["pen"],
    attachments: [{ id: "ATT-PDF1", filename: "vorlage.pdf" }, { id: "ATT-IMG", filename: "foto.png" }],
    sampleSolutions: [{ id: "ATT-LOES", filename: "loesung.pdf" }],
  };
  assert.deepEqual(findAttachment(cur, "ATT-PDF1"), { list: "attachments", item: cur.attachments[0] });
  assert.deepEqual(findAttachment(cur, "ATT-LOES"), { list: "sampleSolutions", item: cur.sampleSolutions[0] });
  assert.equal(findAttachment(cur, "ATT-FREMD"), null);

  // Nur noch ein PDF vorhanden -> Löschen warnt
  const nurEinPdf = { ...cur, attachments: [cur.attachments[0]] };
  assert.match(letztesPenPdfWarnung(nurEinPdf, "ATT-PDF1", findAttachment(nurEinPdf, "ATT-PDF1")), /letzte PDF/);
  // Zweites PDF bleibt übrig -> keine Warnung
  const zweiPdfs = { ...cur, attachments: [cur.attachments[0], { id: "ATT-PDF2", filename: "zweite.pdf" }] };
  assert.equal(letztesPenPdfWarnung(zweiPdfs, "ATT-PDF1", findAttachment(zweiPdfs, "ATT-PDF1")), undefined);
  // Kein Pen -> keine Warnung, auch wenn es das letzte PDF ist
  const keinPen = { ...nurEinPdf, requiredSubmissions: ["file"] };
  assert.equal(letztesPenPdfWarnung(keinPen, "ATT-PDF1", findAttachment(keinPen, "ATT-PDF1")), undefined);
  // Gelöschter Anhang ist kein PDF -> keine Warnung
  const nichtPdfWirdGeloescht = { ...cur, attachments: [cur.attachments[1]] };
  assert.equal(letztesPenPdfWarnung(nichtPdfWirdGeloescht, "ATT-IMG", findAttachment(nichtPdfWirdGeloescht, "ATT-IMG")), undefined);
  // Musterlösung ist nie von der Pen-Warnung betroffen (zählt nicht als Material)
  assert.equal(letztesPenPdfWarnung(cur, "ATT-LOES", findAttachment(cur, "ATT-LOES")), undefined);
});

test("applyPatches: alles oder nichts, lehnt verlustbehaftete Bausteine ab", () => {
  const { applyPatches } = require("../src/tools");
  assert.equal(applyPatches("Erster Satz. Zweiter Satz.", [{ alt: "Erster", neu: "ERSTER" }]), "ERSTER Satz. Zweiter Satz.");
  assert.equal(
    applyPatches("A B A", [{ alt: "A", neu: "X" }, { alt: "B", neu: "Y" }].slice(1)), // nur B ersetzen, A bleibt zweimal stehen
    "A Y A"
  );
  assert.throws(() => applyPatches("A A B", [{ alt: "A", neu: "X" }]), /kommt 2× vor/);
  assert.throws(() => applyPatches("A B", [{ alt: "C", neu: "X" }]), /kommt 0× vor/);
  // alles oder nichts: eine gültige und eine ungültige Ersetzung -> keine von beiden wird angewendet
  assert.throws(() => applyPatches("A B", [{ alt: "A", neu: "X" }, { alt: "C", neu: "Y" }]), /kommt 0× vor/);
  assert.throws(() => applyPatches("Text (Baustein h5p)", [{ alt: "Text", neu: "Anders" }]), /ohne Markdown-Entsprechung/);
});

test("markdownToSerlo.warnungen: Unterstrich-Rundreise und $…$ in Lückenantwort", () => {
  const { markdownToSerlo } = require("../src/serlo");
  markdownToSerlo("Normaler Text ohne Besonderheiten.");
  assert.equal(markdownToSerlo.warnungen.length, 0);

  markdownToSerlo("Hier steht echte _Betonung_ im Text.");
  assert.match(markdownToSerlo.warnungen[0], /Sternchen/);

  markdownToSerlo("Variable u_e bleibt Text, keine Betonung.");
  assert.equal(markdownToSerlo.warnungen.length, 0, "intraword-Unterstrich löst keine Warnung aus");

  markdownToSerlo("```quiz-blanks-dnd\nFormel [[$U=R\cdot I$]].\n```");
  assert.match(markdownToSerlo.warnungen[0], /nie als Formel dargestellt/);
});

test("Kachelbild: cover_image_path an allen vier Ebenen, hat_titelbild im Baum, Speichern erhält das Bild", () => {
  const { TOOLS, compact, taskToForm } = require("../src/tools");
  for (const n of ["scobees_create_lernpfad", "scobees_update_lernpfad", "scobees_create_gliederung", "scobees_update_gliederung",
    "scobees_create_wahlpflicht", "scobees_update_wahlpflicht", "scobees_create_aufgabe", "scobees_update_aufgabe"]) {
    assert.ok(TOOLS.find((t) => t.name === n).inputSchema.properties.cover_image_path, `${n} braucht cover_image_path`);
  }
  const tree = compact({
    id: "LI-1", name: "Pfad", parentId: null, isLeaf: false, coverImage: { path: "a/b.png" },
    children: [
      { id: "LI-2", name: "Gliederung", parentId: "LI-1", isLeaf: false, coverImage: null, children: [] },
      { id: "LI-3", name: "Aufgabe", parentId: "LI-1", isLeaf: true, coverImage: { path: "c/d.png", id: "ATT-1", type: "coverimage" } },
    ],
  });
  assert.equal(tree.hat_titelbild, true);
  assert.deepEqual(tree.children.map((c) => c.hat_titelbild), [false, true]);
  // Beim erneuten Speichern muss der Pfad des vorhandenen Kachelbilds mitgehen, sonst wäre es Glückssache, ob es bleibt
  const form = taskToForm({ id: "LI-3", name: "Aufgabe", parentId: "LI-1", coverImage: { path: "c/d.png" }, isAiCorrectionEnabled: true });
  assert.equal(form.coverImagePath, "c/d.png");
  assert.equal(form.isAiCorrectionEnabled, true);
  assert.equal(taskToForm({ id: "LI-4", name: "ohne Bild" }).coverImagePath, undefined);
});

test("anhangAnsichtHinweis: Material an einer Aufgabe mit Arbeitsblatt verdrängt das Arbeitsblatt aus der Startansicht", () => {
  const { anhangAnsichtHinweis } = require("../src/tools");
  const { markdownToSerlo } = require("../src/serlo");
  const nurText = { taskDescription: markdownToSerlo("# Titel") };
  const mitQuiz = { taskDescription: markdownToSerlo(["# Titel", "", "```quiz-sc", "Frage?", "- [x] ja", "- [ ] nein", "```"].join(String.fromCharCode(10))) };
  assert.match(anhangAnsichtHinweis(nurText, false), /zuerst das Material/);
  assert.doesNotMatch(anhangAnsichtHinweis(nurText, false), /Eingaben verloren/);
  assert.match(anhangAnsichtHinweis(mitQuiz, false), /Eingaben verloren/);
  assert.equal(anhangAnsichtHinweis(mitQuiz, true), undefined);            // Musterlösung
  assert.equal(anhangAnsichtHinweis({ taskDescription: null }, false), undefined);  // kein Arbeitsblatt
});

test("clarifyDeleteError erklärt die Löschregeln von scobees", () => {
  const { clarifyDeleteError } = require("../src/tools");
  const err = (msg) => new Error(`scobees-API DELETE lerninput/LI-1 → HTTP 405: {"message":"${msg}","statusCode":405}`);
  assert.throws(() => clarifyDeleteError(err("Deletion of a learning path with open assignments is not allowed")), /Zuweisung zuerst in der Weboberfläche aufheben/);
  assert.throws(() => clarifyDeleteError(err("Deletion of folder with children is not allowed")), /nur, wenn sie leer sind/);
  assert.throws(() => clarifyDeleteError(new Error("scobees-API DELETE lerninput/LI-1 → HTTP 404: nicht gefunden")), /HTTP 404/);
});


test("findCopy: die Kopie ist das eine neue Kind des Ziel-Lernpfads", () => {
  const { findCopy } = require("../src/tools");
  const vorher = [{ id: "LI-A" }, { id: "LI-B" }];
  assert.equal(findCopy(vorher, [...vorher, { id: "LI-NEU" }]), "LI-NEU");
  assert.equal(findCopy([], [{ id: "LI-NEU" }]), "LI-NEU");
  assert.equal(findCopy(undefined, [{ id: "LI-NEU" }]), "LI-NEU");
  // kein oder mehrere neue Kinder: nicht raten
  assert.equal(findCopy(vorher, vorher), null);
  assert.equal(findCopy(vorher, [...vorher, { id: "LI-X" }, { id: "LI-Y" }]), null);
  assert.equal(findCopy(vorher, undefined), null);
});

test("scobees_copy_aufgabe ist angemeldet und meldet zugewiesene Ziele", () => {
  const { TOOLS } = require("../src/tools");
  const t = TOOLS.find((x) => x.name === "scobees_copy_aufgabe");
  assert.ok(t, "Werkzeug fehlt");
  assert.deepEqual(t.inputSchema.required, ["id", "parent_id"]);
  for (const p of ["sort_order", "name", "description_html", "ersetzungen"]) assert.ok(t.inputSchema.properties[p], `Parameter ${p} fehlt`);
});

// ── 0.1.19 ───────────────────────────────────────────────────────────────────
test("compact(): Status nur an der Wurzel, Lernpfad-Beschreibung ungekürzt", () => {
  const { compact } = require("../src/tools");
  const lang = "Erster Absatz. ".repeat(40); // 600 Zeichen
  const out = compact({
    id: "LI-R", name: "Pfad", parentId: null, isLeaf: false, state: "ACTIVE", isPublished: true, description: lang,
    children: [
      { id: "LI-G", name: "1 Gliederung", parentId: "LI-R", isLeaf: false, state: "ACTIVE", isPublished: false,
        children: [{ id: "LI-A", name: "1.1", parentId: "LI-G", isLeaf: true, state: "ACTIVE", isPublished: false, taskType: "Pflichtaufgabe" }] },
    ],
  });
  assert.equal(out.state, "ACTIVE");
  assert.equal(out.isPublished, true);
  assert.equal(out.beschreibung, lang, "Beschreibung der Wurzel darf nicht gekürzt werden");
  const g = out.children[0], a = g.children[0];
  for (const n of [g, a]) {
    assert.ok(!("state" in n), `${n.id}: state gehört nur an die Wurzel`);
    assert.ok(!("isPublished" in n), `${n.id}: isPublished gehört nur an die Wurzel`);
  }
});

test("niveauLuecken: meldet Aufgaben, die nicht alle Niveaus der Schule tragen", () => {
  const { niveauLuecken } = require("../src/tools");
  const blatt = (id, niveaus) => ({ id, name: id, isLeaf: true, tags: { differentiations: niveaus.map((name) => ({ name })) } });
  const schule = ["HSA", "RSA", "FHR"];
  const voll = { isLeaf: false, children: [{ isLeaf: false, children: [blatt("LI-1", schule)] }, blatt("LI-2", [...schule].reverse())] };
  assert.equal(niveauLuecken(voll, schule), null);
  const luecke = { isLeaf: false, children: [{ isLeaf: false, children: [blatt("LI-1", ["HSA"])] }, blatt("LI-2", schule), blatt("LI-3", [])] };
  const r = niveauLuecken(luecke, schule);
  assert.match(r.warnung_niveaus, /^2 von 3 Aufgaben/);
  assert.deepEqual(r.aufgaben_ohne_alle_niveaus, [
    { id: "LI-1", name: "LI-1", fehlt: ["RSA", "FHR"] },
    { id: "LI-3", name: "LI-3", fehlt: ["HSA", "RSA", "FHR"] },
  ]);
  assert.equal(niveauLuecken({ isLeaf: false, children: [] }, schule), null);
});

test("abgabeformenOf: ohne gespeicherte Liste aus den Schaltern abgeleitet und gekennzeichnet", () => {
  const { abgabeformenOf } = require("../src/tools");
  assert.deepEqual(abgabeformenOf({ isUploadRequired: true, requiredSubmissions: ["pen", "file"] }), { abgabeformen: ["pen", "file"] });
  assert.deepEqual(abgabeformenOf({ isUploadRequired: false }), { abgabeformen: [] });
  const web = abgabeformenOf({ isUploadRequired: true, solutionMustBeUploaded: true });
  assert.deepEqual(web.abgabeformen, ["file"]);
  assert.match(web.abgabeformen_hinweis, /keine Liste der Abgabeformen gespeichert/);
  assert.deepEqual(abgabeformenOf({ isUploadRequired: true, requiredSubmissions: [], isPenEnabled: true, isLinkSubmissionEnabled: true }).abgabeformen, ["file", "pen", "link"]);
});

test("besitz: eigener und mitbearbeiter nur als Ja/Nein", () => {
  const { besitz } = require("../src/tools");
  assert.deepEqual(besitz({ author: "USER-1", editors: ["USER-1", "USER-2"] }, "USER-1"), { eigener: true, mitbearbeiter: true });
  assert.deepEqual(besitz({ author: "USER-2", editors: ["USER-2", { id: "USER-1" }] }, "USER-1"), { eigener: false, mitbearbeiter: true });
  assert.deepEqual(besitz({ author: { id: "USER-2" } }, "USER-1"), { eigener: false, mitbearbeiter: false });
  assert.deepEqual(Object.keys(besitz({ author: "USER-2", editors: ["USER-3"] }, "USER-1")), ["eigener", "mitbearbeiter"]);
});

test("applyReplacements / patchedDescription: alles oder nichts, Fehlermeldung nennt den gespeicherten Text", () => {
  const { applyReplacements, patchedDescription } = require("../src/tools");
  assert.equal(applyReplacements("<p>Ergebnis: ALT.</p><ul><li></li></ul>", [{ alt: "ALT", neu: "NEU" }, { alt: "<ul><li></li></ul>", neu: "" }], "hier"), "<p>Ergebnis: NEU.</p>");
  // „$“ im Ersatztext ist Text, kein Platzhalter (Formeln)
  assert.equal(applyReplacements("Preis: X", [{ alt: "X", neu: "$$a$& $1" }], "hier"), "Preis: $$a$& $1");
  assert.throws(() => applyReplacements("A A", [{ alt: "A", neu: "B" }], "hier"), /muss hier genau einmal passen[\s\S]*kommt 2× vor/);
  assert.throws(() => applyReplacements("A", [], "hier"), /darf nicht leer sein/);
  assert.throws(() => applyReplacements("A", [{ alt: "", neu: "B" }], "hier"), /„alt“ \(nicht leer\)/);
  assert.equal(patchedDescription({}, "description_html", "<p>x</p>"), undefined);
  assert.equal(patchedDescription({ beschreibung_ersetzungen: [{ alt: "x", neu: "y" }] }, "description_html", "<p>x</p>"), "<p>y</p>");
  assert.throws(() => patchedDescription({ description_html: "<p>z</p>", beschreibung_ersetzungen: [{ alt: "x", neu: "y" }] }, "description_html", "<p>x</p>"), /nicht beides/);
  assert.throws(() => patchedDescription({ beschreibung_ersetzungen: [{ alt: "fehlt", neu: "y" }] }, "description_html", "<p>x</p>"), /kommt 0× vor[\s\S]*Gespeicherte Beschreibung[\s\S]*<p>x<\/p>/);
});

test("beschreibung_ersetzungen ist in allen vier update-Werkzeugen angemeldet; scobees_me nennt die Serverversion", async () => {
  const { TOOLS } = require("../src/tools");
  for (const n of ["scobees_update_lernpfad", "scobees_update_gliederung", "scobees_update_wahlpflicht", "scobees_update_aufgabe"]) {
    const t = TOOLS.find((x) => x.name === n);
    assert.ok(t.inputSchema.properties.beschreibung_ersetzungen, `${n}: Parameter fehlt`);
  }
  const src = require("fs").readFileSync(require("path").join(__dirname, "../src/tools.js"), "utf8");
  assert.match(src, /server: \{ version: pkg\.version/);
});
