/**
 * tools.js – MCP-Werkzeuge für den Kursaufbau in scobees
 *
 * Begriffe (scobees-Oberfläche ↔ API):
 *   Lernbereich = workspace (LB-…)   Fach = subject (SUBJ-…/SUB-…)
 *   Lernpfad = Wurzel-Lerninput (LI-…, parentId null)
 *   Gliederungsstruktur = folder     Aufgabe = task     Wahlpflichtaufgabe = choice (Container)
 *
 * Nur Inhalte. Keine Werkzeuge für Klassen, Lernende, Zuweisungen oder Bewertungen.
 * Lernbereiche und Fächer werden nur gelesen (Verwaltung bleibt beim Administrator).
 */

const { api } = require("./api");
const { markdownToSerlo, serloToMarkdown, listPlugins } = require("./serlo");

// ── Hilfen ───────────────────────────────────────────────────────────────────
// taskType laut Frontend-Enum (main-Bundle v93.3): Pflichtaufgabe, Extraaufgabe, Trainingsaufgabe, Wahlpflichtaufgabe (Container),
// Info, Diagnose, Gelingensnachweis, Unterschiedlich, "nicht spezifiziert". Ein „Wahlaufgabe“ gibt es nicht (→ HTTP 500).
const AUFGABENTYP = { pflicht: "Pflichtaufgabe", extra: "Extraaufgabe", training: "Trainingsaufgabe", info: "Info" };
const taskTypeOf = (a) => AUFGABENTYP[a.aufgabentyp] || (a.wahlaufgabe ? "Extraaufgabe" : "Pflichtaufgabe");

// Abgabeform. Logik des Frontends (vZ in main-Bundle): requiredSubmissions (file|pen|link) + submissionRule (all|any)
// bestimmen, was Lernende abgeben MÜSSEN – ist die Liste nicht leer, geht ohne Abgabe nichts („Zum Abgeben musst du eine
// Datei hochladen“). isSelfCorrectionNecessary = scobees-„Selbstkorrektur“: eigener Schritt NACH der Abgabe, Vergleich mit
// der Musterlösung (nicht zu verwechseln mit Serlo-Quiz, das sich im Arbeitsblatt selbst prüft).
const KIND = {
  info:                 { kind: "task",                    isUploadRequired: false, solutionMustBeUploaded: false, isSelfCorrectionNecessary: false, selfCorrectionUploadRequired: false, requiredSubmissions: [] },
  selbstkontrolle:      { kind: "task",                    isUploadRequired: false, solutionMustBeUploaded: false, isSelfCorrectionNecessary: false, selfCorrectionUploadRequired: false, requiredSubmissions: [] },
  abgabe_optional:      { kind: "task+upload-optional",    isUploadRequired: true,  solutionMustBeUploaded: false, isSelfCorrectionNecessary: false, selfCorrectionUploadRequired: false },
  abgabe_pflicht:       { kind: "task+upload-required",    isUploadRequired: true,  solutionMustBeUploaded: true,  isSelfCorrectionNecessary: false, selfCorrectionUploadRequired: false },
  abgabe_selbstkorrektur:{ kind: "task+upload-optional+sc", isUploadRequired: true,  solutionMustBeUploaded: false, isSelfCorrectionNecessary: true,  selfCorrectionUploadRequired: false },
  abgabe_pflicht_selbstkorrektur: { kind: "task+upload-required+sc", isUploadRequired: true, solutionMustBeUploaded: true, isSelfCorrectionNecessary: true, selfCorrectionUploadRequired: false },
};
// Abgabeform aus gespeicherten Flags zurückrechnen (für get_aufgabe)
function artOf(t) {
  const sc = !!t.isSelfCorrectionNecessary, up = !!t.isUploadRequired, must = !!t.solutionMustBeUploaded;
  if (up && must && sc) return "abgabe_pflicht_selbstkorrektur";
  if (up && sc) return "abgabe_selbstkorrektur";
  if (up && must) return "abgabe_pflicht";
  if (up) return "abgabe_optional";
  return t.taskType === "Info" ? "info" : "selbstkontrolle";
}
const ABGABEFORM = ["file", "pen", "link"];
// Abgabeformen für abgabe_*: Standard Datei; mehrere → „mindestens eine reicht“ (any)
function submissionFields(art, abgabeformen) {
  if (!/^abgabe_/.test(art)) return {};
  const kinds = (abgabeformen && abgabeformen.length ? abgabeformen : ["file"]).filter((k) => ABGABEFORM.includes(k));
  return { requiredSubmissions: kinds, submissionRule: kinds.length > 1 ? "any" : "all", isPenEnabled: kinds.includes("pen"), isLinkSubmissionEnabled: kinds.includes("link") };
}

/** Kompakte Baumansicht eines Lerninputs (für get_lernpfad). */
function compact(node, depth = 0) {
  const out = {
    id: node.id, name: node.name, typ: nodeType(node), sortOrder: node.sortOrder,
    state: node.state, isPublished: node.isPublished,
    hat_titelbild: !!node.coverImage,
  };
  if (node.description) {
    // Die Lernpfad-Wurzel speichert reinen Text (siehe htmlToPlainText); hier unverändert zeigen, damit ein
    // versehentlich doch gespeichertes „<p>…</p>“ beim Zurücklesen auffällt, statt von stripHtml verdeckt zu werden.
    out.beschreibung = out.typ === "lernpfad" ? node.description.slice(0, 300) : stripHtml(node.description).slice(0, 200);
  }
  if (node.isLeaf) {
    out.kind = node.kind; out.taskType = node.taskType; out.estimatedTime = node.estimatedTime;
    out.differenzierungen = (node.tags?.differentiations || []).map((d) => d.name);
    out.anhaenge = (node.attachments || []).map((a) => ({ id: a.id, filename: a.filename, type: a.type }));
    out.links = node.links || [];
    out.arbeitsblatt = node.taskDescription ? listPlugins(node.taskDescription) : null;
  } else {
    if (node.solveOrder) out.solveOrder = node.solveOrder;
    if (node.tasksRequiredForCompletion != null) out.mindestAufgaben = node.tasksRequiredForCompletion;
    out.children = (node.children || []).map((c) => compact(c, depth + 1));
  }
  return out;
}

function nodeType(n) {
  if (n.parentId == null && !n.isLeaf) return "lernpfad";
  if (n.isLeaf) return n.taskType === "Wahlpflichtaufgabe" ? "wahlaufgabe" : "aufgabe";
  return n.taskType === "Wahlpflichtaufgabe" ? "wahlpflicht" : "gliederung";
}

const stripHtml = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** Anhang per ID unter anhaenge[]/musterloesungen[] einer Aufgabe suchen (prüft Zugehörigkeit vor dem Löschen). */
function findAttachment(cur, attachmentId) {
  const inAttachments = (cur.attachments || []).find((x) => x.id === attachmentId);
  if (inAttachments) return { list: "attachments", item: inAttachments };
  const inSolutions = (cur.sampleSolutions || []).find((x) => x.id === attachmentId);
  if (inSolutions) return { list: "sampleSolutions", item: inSolutions };
  return null;
}
const isPdfAttachment = (x) => /\.pdf$/i.test(x.filename || "") || x.mimetype === "application/pdf";

/** Warnt, wenn der zu löschende Anhang das letzte PDF-Material einer Stift-Abgabe (abgabeform „pen“) ist. */
// Mit einem Dummy-Konto geprüft (scobees 94.6): Hat eine Aufgabe Material, sehen Lernende links zuerst das erste
// Material und nicht das Arbeitsblatt; dieses liegt als letzte Kachel („Serlo-Inhalt“) bei den Materialien. Beim
// Wechsel zwischen Material und Arbeitsblatt gehen alle Quiz-Eingaben verloren. Musterlösungen betrifft das nicht.
const QUIZ_PLUGINS = ["scMcExercise", "inputExercise", "blanksExercise", "textAreaExercise"];
function anhangAnsichtHinweis(cur, istMusterloesung) {
  if (istMusterloesung || !cur.taskDescription) return undefined;
  const plugins = listPlugins(cur.taskDescription);
  if (!plugins.length) return undefined;
  let h = "Lernende sehen in dieser Aufgabe jetzt zuerst das Material, nicht das Arbeitsblatt; das Arbeitsblatt erreichen sie über die Kachel „Serlo-Inhalt“ bei den Materialien. In der Beschreibung der Aufgabe darauf hinweisen.";
  if (plugins.some((p) => QUIZ_PLUGINS.includes(p))) h += " Das Arbeitsblatt enthält Quizfragen: Wechseln Lernende zwischen Material und Arbeitsblatt, gehen ihre Eingaben verloren. Besser das Material in eine eigene Aufgabe davor legen.";
  return h;
}

function letztesPenPdfWarnung(cur, attachmentId, found) {
  if (found.list !== "attachments" || !(cur.requiredSubmissions || []).includes("pen")) return undefined;
  const otherPdfs = (cur.attachments || []).some((x) => x.id !== attachmentId && isPdfAttachment(x));
  if (isPdfAttachment(found.item) && !otherPdfs) {
    return "Das war das letzte PDF dieser Aufgabe, deren Abgabeform „pen“ (Stift auf PDF) aber ein PDF-Material voraussetzt. Ohne PDF können Lernende nicht mehr abgeben – vor dem Zuweisen ein neues PDF hochladen.";
  }
  return undefined;
}

// Die Lernpfad-Beschreibung zeigt scobees nirgends als HTML (anders als description_html bei Gliederung/Aufgabe) –
// mitgeschicktes HTML landet sonst als sichtbarer Tag-Text in der Oberfläche (live beobachtet 10.11.2026: „<p>…</p>“
// nach create_lernpfad). Deshalb hier immer in reinen Text wandeln: Blockgrenzen werden zu Zeilenumbrüchen,
// übrige Tags fallen weg, Entities werden aufgelöst.
const HTML_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", uuml: "ü", Uuml: "Ü", ouml: "ö", Ouml: "Ö", auml: "ä", Auml: "Ä", szlig: "ß", euro: "€" };
function htmlToPlainText(s) {
  if (!s) return "";
  const t = String(s)
    .replace(/<\/(p|div|li|h[1-6]|tr)\s*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code) => {
      if (code[0] === "#") {
        const cp = /^#x/i.test(code) ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(cp) ? String.fromCodePoint(cp) : m;
      }
      return HTML_ENTITIES[code] ?? HTML_ENTITIES[code.toLowerCase()] ?? m;
    });
  return t.split("\n").map((l) => l.trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
const ok = (msg, data) => ({ ok: true, hinweis: msg, ...data });

// Löschregeln von scobees (HTTP 405, live geprüft v94.6) verständlich machen.
function clarifyDeleteError(e) {
  if (/open assignments/i.test(e.message)) {
    throw new Error("scobees löscht keinen Lernpfad, der noch zugewiesen ist (Meldung von scobees: „Deletion of a learning path with open assignments is not allowed“). " +
      "Die Lehrkraft muss die Zuweisung zuerst in der Weboberfläche aufheben; danach lässt sich der Lernpfad löschen.");
  }
  if (/folder with children/i.test(e.message)) {
    throw new Error("scobees löscht Gliederungen und Wahlpflichtaufgaben nur, wenn sie leer sind (Meldung von scobees: „Deletion of folder with children is not allowed“). " +
      "Zuerst die Aufgaben darin einzeln löschen oder mit scobees_move herausnehmen. Ein ganzer, nicht zugewiesener Lernpfad lässt sich dagegen samt Inhalt löschen.");
  }
  throw e;
}

// Regeln von scobees rund um Wahlpflichtaufgaben („taskgroup“), jeweils HTTP 405 (live geprüft, zuletzt v94.6):
//   „Add or edit as child (task) from taskgroup without type choice …“  Unteraufgabe ohne taskType „Wahlpflichtaufgabe“
//   „Changing the parent of a taskgroup task is not allowed“            Unteraufgabe aus der Wahlpflichtaufgabe heraus
//   „Changing the parent to a taskgroup is not allowed“                 Element in eine Wahlpflichtaufgabe hinein
// Bis v94.5 galt die dritte Regel auch für einzelne Aufgaben; seit v94.6 nimmt scobees Aufgaben an (und stellt
// ihren Typ auf „Wahlpflichtaufgabe“ um), Gliederungen und Wahlpflichtaufgaben weiterhin nicht.
// Statt des rohen HTTP-405 bekommt die Lehrkraft die passende Erklärung samt Abhilfe.
function clarifyTaskgroupError(e) {
  if (/taskgroup/i.test(e.message)) {
    let detail = e.message;
    const m = e.message.match(/\{.*\}/s);
    if (m) { try { detail = JSON.parse(m[0]).message || detail; } catch {} }
    let erklaerung;
    if (/parent of a taskgroup task/i.test(detail)) {
      erklaerung =
        "Eine Unteraufgabe lässt sich nicht aus ihrer Wahlpflichtaufgabe heraus verschieben. " +
        "Abhilfe: Aufgabe am Ziel neu anlegen (Inhalt vorher mit scobees_get_aufgabe lesen) und die Unteraufgabe löschen, oder in der Weboberfläche verschieben.";
    } else if (/parent to a taskgroup/i.test(detail)) {
      erklaerung =
        "Dieses Element lässt sich nicht in eine Wahlpflichtaufgabe verschieben. Einzelne Aufgaben nimmt scobees dort seit Version 94.6 an, " +
        "Gliederungen und Wahlpflichtaufgaben nicht (ältere scobees-Versionen auch keine Aufgaben). " +
        "Abhilfe: Aufgabe mit scobees_create_aufgabe direkt unter der Wahlpflichtaufgabe neu anlegen und die alte löschen, oder in der Weboberfläche verschieben.";
    } else {
      erklaerung =
        "Eine Unteraufgabe einer Wahlpflichtaufgabe braucht den Aufgabentyp „Wahlpflichtaufgabe“; scobees_create_aufgabe setzt ihn selbst, " +
        "wenn parent_id eine Wahlpflichtaufgabe ist. Der Aufgabentyp einer Unteraufgabe lässt sich nicht ändern.";
    }
    throw new Error("scobees lehnt das ab (Meldung von scobees: „" + detail + "“). " + erklaerung);
  }
  throw e;
}

/** Aufgabe laden und in das Formular-Format der Weboberfläche zurückübersetzen. */
function taskToForm(t) {
  return {
    id: t.id,
    name: t.name,
    description: t.description || "",
    internalTeacherNote: t.internalTeacherNote ?? null,
    taskType: t.taskType || "Pflichtaufgabe",
    activityType: t.activityType || "nicht spezifiziert",
    socialType: t.socialType || "nicht spezifiziert",
    licenseType: t.info?.licenseType || "cc0",
    copyrightNotice: t.info?.copyrightNotice ?? null,
    estimatedTime: t.estimatedTime || 0,
    diffs: t.tags?.differentiations || [],
    kind: t.kind || "task",
    isUploadRequired: !!t.isUploadRequired,
    solutionMustBeUploaded: !!t.solutionMustBeUploaded,
    isSelfCorrectionNecessary: !!t.isSelfCorrectionNecessary,
    selfCorrectionUploadRequired: !!t.selfCorrectionUploadRequired,
    requiredSubmissions: t.requiredSubmissions || [],
    removedSampleSolutionIds: [],
    submissionRule: t.submissionRule || "all",
    isPenEnabled: !!t.isPenEnabled,
    isLinkSubmissionEnabled: !!t.isLinkSubmissionEnabled,
    isAiCorrectionEnabled: !!t.isAiCorrectionEnabled,
    lfs: t.lfs || [],
    parentId: t.parentId,
    coverImagePath: t.coverImage?.path,
    attachments: undefined,
    sampleSolutions: undefined,
    links: t.links || [],
    taskDescription: t.taskDescription ?? null,
    taskAudioDescription: null,
  };
}

// Differenzierungen: die Schule definiert Niveaus (school-diffs, z. B. „Hauptschulabschluss“), jedes zeigt auf ein
// Bibliotheks-Tag (defaultTag, z. B. TAG-0060 „Regulär“). Aufgaben tragen das Tag. Lernende sind einem Niveau zugeordnet
// und sehen nur Aufgaben mit passendem Tag (Frontend: DIFFERENTIATION_MISMATCH). Ohne Angabe → alle Niveaus der Schule,
// damit die Aufgabe für alle sichtbar ist; die Weboberfläche verlangt beim Speichern mindestens eine Auswahl.
async function resolveDiffTags(names) {
  const schoolDiffs = await api.schoolDiffs();
  const asTag = (d) => ({ id: d.defaultTag?.id || d.id, name: d.name, type: "differentiation" });
  if (!names || !names.length) return schoolDiffs.map(asTag);
  if (names.length === 1 && /^alle$/i.test(names[0])) return schoolDiffs.map(asTag);
  const tags = (await api.libraryTags()).filter((t) => t.type === "differentiation");
  return names.map((n) => {
    const q = String(n).toLowerCase();
    const sd = schoolDiffs.find((d) => d.id === n || d.name.toLowerCase() === q || d.defaultTag?.id === n);
    if (sd) return asTag(sd);
    const lt = tags.find((t) => t.id === n || t.name.toLowerCase() === q);
    if (lt) return { id: lt.id, name: lt.name, type: "differentiation" };
    throw new Error(`Differenzierung „${n}“ unbekannt. Verfügbar: ${schoolDiffs.map((d) => d.name).join(", ")}`);
  });
}

async function resolveGradeTags(names) {
  if (!names || !names.length) return [];
  const tags = await api.libraryTags();
  const grades = tags.filter((t) => t.type === "grade");
  return names.map((n) => {
    const hit = grades.find((g) => g.id === n || g.name.toLowerCase() === String(n).toLowerCase() || g.name.replace(/\D/g, "") === String(n).replace(/\D/g, ""));
    if (!hit) throw new Error(`Jahrgang „${n}“ unbekannt. Verfügbar: ${grades.map((g) => g.name).join(", ")}`);
    return { id: hit.id };
  });
}

function buildTaskDescription(args) {
  if (args.serlo_json) {
    const doc = typeof args.serlo_json === "string" ? JSON.parse(args.serlo_json) : args.serlo_json;
    if (doc.plugin !== "rows") throw new Error("serlo_json muss ein Dokument mit plugin:\"rows\" an der Wurzel sein.");
    return doc;
  }
  if (args.arbeitsblatt_markdown) return markdownToSerlo(args.arbeitsblatt_markdown);
  return undefined;
}

const COVER_HINT = "Lokaler Pfad zu einem Kachelbild (PNG oder JPG; live geprüft mit PNG bis 1,3 MB). Quadratisch anlegen – scobees beschneidet die Kachel quadratisch – und ein Motiv wählen, das klein noch erkennbar ist.";
const assertCoverImage = (p) => { if (!/\.(png|jpe?g)$/i.test(p)) throw new Error(`Kachelbild muss PNG oder JPG sein: ${p}`); };

/** Kachelbild einer Aufgabe: die Weboberfläche lädt es als Anhang vom Typ „coverimage“ hoch und trägt dessen Pfad
 * beim Speichern als coverImagePath ein (Mitschnitt 11.11.2026). Gliederung, Wahlpflicht und Lernpfad schicken
 * die Datei dagegen direkt als Feld coverImage mit. Ein vorheriges Kachelbild der Aufgabe wird danach entfernt. */
async function uploadTaskCover(taskId, filePath, previous) {
  assertCoverImage(filePath);
  const att = await api.uploadAttachment(taskId, filePath, "coverimage");
  const cleanup = async () => {
    if (previous?.id && previous.type === "coverimage") { try { await api.removeAttachment(previous.id); } catch {} }
  };
  return { path: att.path, cleanup };
}

/** Für scobees_patch_arbeitsblatt: jede Ersetzung muss im Markdown genau einmal passen, alles oder nichts.
 * Wirft bei Bausteinen ohne Markdown-Entsprechung oder bei einer Ersetzung, die nicht genau einmal vorkommt. */
function applyPatches(md, ersetzungen) {
  if (/\(Baustein |\(interaktiver Baustein: /.test(md)) {
    throw new Error("Dieses Arbeitsblatt enthält Bausteine ohne Markdown-Entsprechung (z. B. Bild-Zuordnung) – nicht verlustfrei patchbar. Stattdessen scobees_get_aufgabe(mit_serlo_json: true) lesen und gezielt im Serlo-JSON ändern, dann scobees_update_aufgabe(serlo_json) schreiben.");
  }
  const fehler = [];
  for (const { alt } of ersetzungen) {
    const count = md.split(alt).length - 1;
    if (count !== 1) fehler.push(`„${alt.length > 60 ? alt.slice(0, 60) + "…" : alt}“ kommt ${count}× vor (erwartet: genau 1×)`);
  }
  if (fehler.length) throw new Error("Keine Änderung vorgenommen – jede Ersetzung muss genau einmal passen:\n- " + fehler.join("\n- "));
  let neu = md;
  for (const { alt, neu: ersatz } of ersetzungen) neu = neu.replace(alt, ersatz);
  return neu;
}

/** Warnungen aus der letzten markdownToSerlo-Umwandlung, aber nur wenn args tatsächlich über arbeitsblatt_markdown
 * gelaufen ist (bei serlo_json wurde markdownToSerlo nicht aufgerufen, dessen .warnungen wäre dann veraltet). */
const arbeitsblattWarnungen = (args) => (!args.serlo_json && args.arbeitsblatt_markdown && markdownToSerlo.warnungen?.length) ? markdownToSerlo.warnungen : undefined;

// ── Werkzeugdefinitionen ─────────────────────────────────────────────────────
const TOOLS = [
  // Lesen
  {
    name: "scobees_me",
    description: "Zeigt das eigene scobees-Konto (ID, Rolle, Schule), prüft die Anmeldung und vergleicht die scobees-Version mit der, für die dieser Server geprüft wurde.",
    inputSchema: { type: "object", properties: {} },
    run: async () => {
      const [me, fe] = await Promise.all([api.me(), api.frontendInfo()]);
      const out = { id: me.id, role: me.role, schoolId: me.schoolId, schoolName: me.schoolName,
        scobees: { version: fe.version, bundle: fe.bundle, geprueft_mit: `${fe.known.version} (${fe.known.bundle}, ${fe.known.checked})` } };
      if (fe.error) out.scobees.hinweis = `Version nicht ermittelbar: ${fe.error}`;
      else if (fe.unveraendert) out.scobees.hinweis = "scobees-Oberfläche unverändert seit der letzten Prüfung.";
      else out.scobees.hinweis = `scobees wurde aktualisiert (${fe.version || "Version unbekannt"}, ${fe.bundle}). Die Werkzeuge sollten weiter laufen; bei Fehlern bitte Issue „scobees-Änderung“ im Repo anlegen.`;
      return out;
    },
  },
  {
    name: "scobees_list_workspaces",
    description: "Listet alle Lernbereiche (Kacheln in der Bib) mit ihren Fächern. Nur lesen – Verwaltung bleibt beim Administrator.",
    inputSchema: { type: "object", properties: {} },
    run: async () => (await api.workspaces()).map((w) => ({
      id: w.id, name: w.name, order: w.order,
      faecher: (w.subjects || []).map((s) => ({ id: s.id, name: s.name, color: s.color })),
    })),
  },
  {
    name: "scobees_list_subjects",
    description: "Listet Fächer (Kurse), optional gefiltert auf einen Lernbereich. Die Lehrkraft wählt hieraus das Fach, in dem ein Lernpfad angelegt wird.",
    inputSchema: { type: "object", properties: { workspace_id: { type: "string", description: "Lernbereich-ID (LB-…), optional" } } },
    run: async ({ workspace_id }) => (await api.subjects(workspace_id)).map((s) => ({
      id: s.id, name: s.name, color: s.color, lernbereich: s.workspaceName, workspaceId: s.workspaceId, disabled: s.disabled,
    })),
  },
  {
    name: "scobees_list_tags",
    description: "Listet Jahrgänge und Differenzierungsstufen der Schule (für create_lernpfad / create_aufgabe).",
    inputSchema: { type: "object", properties: {} },
    run: async () => {
      const tags = await api.libraryTags();
      return {
        jahrgaenge: tags.filter((t) => t.type === "grade").map((t) => ({ id: t.id, name: t.name })),
        differenzierungen: (await api.schoolDiffs()).map((d) => ({ id: d.defaultTag?.id || d.id, name: d.name })),
        hinweis_differenzierungen: "Niveaus der Schule. Lernende sind einem Niveau zugeordnet und sehen nur Aufgaben, die dieses Niveau tragen. Der Lernpfad selbst hat kein Niveau; seine Anzeige fasst die Niveaus der enthaltenen Aufgaben zusammen.",
      };
    },
  },
  {
    name: "scobees_list_lernpfade",
    description: "Listet Lernpfade eines Fachs (oder alle) mit ID, Name, Status, Jahrgängen. Zum Finden bestehender Kurse, die erweitert werden sollen.",
    inputSchema: {
      type: "object",
      properties: {
        subject_id: { type: "string", description: "Fach-ID (SUBJ-…/SUB-…), optional" },
        title: { type: "string", description: "Suchbegriff im Titel, optional" },
        page: { type: "number", default: 0 },
        page_size: { type: "number", default: 16 },
      },
    },
    run: async ({ subject_id, title, page = 0, page_size = 16 }) => {
      const r = await api.lerninputs({ subjectId: subject_id, title, page, pageSize: page_size });
      return (r.lerninputs || []).map((l) => ({
        id: l.id, name: l.name, state: l.state, isPublished: l.isPublished,
        faecher: (l.subjects || []).map((s) => s.name),
        jahrgaenge: (l.tags?.grades || []).map((g) => g.name),
        stichwoerter: l.tags?.other || [],
        zuletzt: l.lastModifiedAt,
      }));
    },
  },
  {
    name: "scobees_get_lernpfad",
    description: "Lädt einen Lernpfad mit vollständigem Aufbau (Gliederungen → Aufgaben) als kompakten Baum. IDs daraus werden für Änderungen benötigt. An der Wurzel steht zugewiesen (true = Lernende arbeiten bereits damit, jede Änderung ist für sie sofort sichtbar). Je Element: typ, Status, hat_titelbild (eigenes Kachelbild gesetzt?), bei Aufgaben zusätzlich Art-Kennung, Anhänge und Arbeitsblatt-Bausteine. Die Beschreibung der Lernpfad-Wurzel kommt unverändert zurück.",
    inputSchema: { type: "object", properties: { id: { type: "string", description: "Lernpfad-ID (LI-…)" } }, required: ["id"] },
    run: async ({ id }) => {
      const node = await api.lerninput(id);
      const out = compact(node);
      // Nur die Wurzel trägt den Zustand der Zuweisung (state ACTIVE); bei Unterelementen sagt er nichts aus.
      if (!node.parentId) out.zugewiesen = node.state === "ACTIVE";
      return out;
    },
  },
  {
    name: "scobees_get_aufgabe",
    description: "Lädt eine einzelne Aufgabe: Arbeitsblatt als Markdown, Abgabeform (art, abgabeformen), Links, Anhänge und Musterlösungen mit ihren ATT-IDs (für scobees_delete_material / ersetzt_attachment_id), Kachelbild. Vor jeder Änderung an einer bestehenden Aufgabe aufrufen.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Aufgaben-ID (LI-…)" }, mit_serlo_json: { type: "boolean", default: false, description: "zusätzlich das rohe Serlo-JSON ausgeben" } },
      required: ["id"],
    },
    run: async ({ id, mit_serlo_json }) => {
      const t = await api.lerninput(id);
      const out = {
        id: t.id, name: t.name, parentId: t.parentId, kind: t.kind, taskType: t.taskType, state: t.state,
        art: artOf(t), abgabeformen: t.requiredSubmissions || [], abgabe_regel: t.submissionRule || "all",
        beschreibung_html: t.description, interne_notiz: t.internalTeacherNote, estimatedTime: t.estimatedTime,
        differenzierungen: (t.tags?.differentiations || []).map((d) => d.name),
        links: t.links || [],
        anhaenge: (t.attachments || []).map((a) => ({ id: a.id, filename: a.filename, type: a.type, url: api.attachmentUrl(a.path) })),
        musterloesungen: (t.sampleSolutions || []).map((a) => ({ id: a.id, filename: a.filename })),
        titelbild: t.coverImage ? { filename: t.coverImage.filename, url: api.attachmentUrl(t.coverImage.path) } : null,
        arbeitsblatt_markdown: t.taskDescription ? serloToMarkdown(t.taskDescription) : null,
        arbeitsblatt_bausteine: t.taskDescription ? listPlugins(t.taskDescription) : [],
      };
      if (mit_serlo_json) out.serlo_json = t.taskDescription;
      return out;
    },
  },

  // Schreiben
  {
    name: "scobees_create_lernpfad",
    description: "Legt einen neuen Lernpfad in einem Fach an (Wurzel). Danach Gliederungen und Aufgaben mit den anderen Werkzeugen hinzufügen. Der Pfad erscheint in der schuleigenen Bib (published) und hat Status INACTIVE, bis eine Lehrkraft ihn in der Weboberfläche einer Lerngruppe zuweist.",
    inputSchema: {
      type: "object",
      properties: {
        subject_id: { type: "string", description: "Fach-ID aus scobees_list_subjects" },
        name: { type: "string" },
        description: { type: "string", description: "Beschreibung als reiner Text – scobees zeigt sie hier nicht als HTML gerendert, mitgeschicktes HTML würde als sichtbarer Tag-Text erscheinen und wird deshalb automatisch entfernt." },
        jahrgaenge: { type: "array", items: { type: "string" }, description: "z. B. [\"Jg 1\"] oder Tag-IDs" },
        stichwoerter: { type: "array", items: { type: "string" }, description: "Freie Schlagworte" },
        cover_image_path: { type: "string", description: COVER_HINT },
        solve_order: { type: "string", enum: ["none", "after_solving", "after_selfcorrection", "after_teacher_correction"], default: "none", description: "Aufgabenwahl: none = frei; after_solving = nach Reihenfolge; after_selfcorrection = nach Reihenfolge mit Selbstkorrektur; after_teacher_correction = nach Reihenfolge mit Feedback der Lehrkraft" },
      },
      required: ["subject_id", "name"],
    },
    run: async (a) => {
      const me = await api.me();
      const grades = await resolveGradeTags(a.jahrgaenge);
      const r = await api.createRoot({
        name: a.name,
        subjects: [{ id: a.subject_id }],
        grades,
        editors: [me.id],
        order: a.solve_order || "none",
        published: true,
        isMandatoryProgressVisible: true,
        isExtraTaskCounterVisible: true,
        tags: a.stichwoerter || [],
        id: "",
        coverImagePath: undefined,
        description: htmlToPlainText(a.description),
      }, { coverImage: a.cover_image_path });
      return ok("Lernpfad angelegt. Status INACTIVE bedeutet: noch keiner Lerngruppe zugewiesen – die Zuweisung erfolgt in der Weboberfläche.", { id: r.id, name: r.name, state: r.state, hat_titelbild: !!r.coverImage });
    },
  },
  {
    name: "scobees_update_lernpfad",
    description: "Ändert einen bestehenden Lernpfad (Wurzel): Fach, Name, Beschreibung, Jahrgänge, Stichwörter, Titelbild, Reihenfolge. Nicht angegebene Felder bleiben erhalten. in_bib: Schalter „In schuleigener Bib veröffentlichen“. Fach bleibt beim Administrator, Zuweisung an Lerngruppen in der Weboberfläche.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "LI-ID des Lernpfads" },
        subject_id: { type: "string", description: "Lernpfad in ein anderes Fach verschieben (Fach-ID aus scobees_list_subjects). Achtung: Lernende brauchen im Fach des Pfads ein Niveau, sonst ist keine Zuweisung möglich." },
        name: { type: "string" },
        description: { type: "string", description: "Beschreibung als reiner Text – scobees zeigt sie hier nicht als HTML gerendert, mitgeschicktes HTML würde als sichtbarer Tag-Text erscheinen und wird deshalb automatisch entfernt." },
        jahrgaenge: { type: "array", items: { type: "string" } },
        stichwoerter: { type: "array", items: { type: "string" } },
        cover_image_path: { type: "string", description: "Neues Titelbild (lokaler Pfad), optional" },
        solve_order: { type: "string", enum: ["none", "after_solving", "after_selfcorrection", "after_teacher_correction"] },
        in_bib: { type: "boolean", description: "In schuleigener Bib veröffentlichen (true/false)" },
      },
      required: ["id"],
    },
    run: async (a) => {
      const cur = await api.lerninput(a.id);
      if (cur.parentId) throw new Error(`${a.id} ist kein Lernpfad (Wurzel), sondern hat parentId ${cur.parentId}.`);
      const me = await api.me();
      const grades = a.jahrgaenge ? await resolveGradeTags(a.jahrgaenge) : (cur.tags?.grades || []).map((g) => ({ id: g.id }));
      const editors = Array.isArray(cur.editors) && cur.editors.length ? cur.editors : [me.id];
      const r = await api.createRoot({
        name: a.name ?? cur.name,
        subjects: a.subject_id ? [{ id: a.subject_id }] : (cur.subjects || []).map((s) => ({ id: s.id })),
        grades,
        editors,
        order: a.solve_order ?? cur.solveOrder ?? "none",
        published: a.in_bib ?? cur.isPublished ?? true,
        isMandatoryProgressVisible: cur.isMandatoryProgressVisible ?? true,
        isExtraTaskCounterVisible: cur.isExtraTaskCounterVisible ?? true,
        tags: a.stichwoerter ?? (cur.tags?.other || []).map((t) => (typeof t === "string" ? t : { id: t.id })),
        id: a.id,
        coverImagePath: a.cover_image_path ? undefined : cur.coverImage?.path,
        description: a.description != null ? htmlToPlainText(a.description) : (cur.description ?? ""),
      }, { coverImage: a.cover_image_path });
      return ok("Lernpfad geändert.", { id: r.id, name: r.name, state: r.state, inBib: r.isPublished, faecher: (r.subjects || []).map((s) => s.name), hat_titelbild: !!r.coverImage });
    },
  },
  {
    name: "scobees_create_gliederung",
    description: "Legt eine Gliederungsstruktur (Ordner/Phase) in einem Lernpfad oder einer anderen Gliederung an. Beschreibung ist HTML (h2, p, strong, em, u, a, span style=color). Optional mit eigenem Kachelbild (cover_image_path) und Farbe; ohne Bild zeigt scobees das Standardbild.",
    inputSchema: {
      type: "object",
      properties: {
        parent_id: { type: "string", description: "Lernpfad- oder Gliederungs-ID" },
        name: { type: "string" },
        description_html: { type: "string", default: "" },
        cover_image_path: { type: "string", description: COVER_HINT },
        color: { type: "string", default: "#00838F", description: "Hex-Farbe der Gliederung" },
      },
      required: ["parent_id", "name"],
    },
    run: async (a) => {
      if (a.cover_image_path) assertCoverImage(a.cover_image_path);
      const r = await api.saveFolder(
        { parentId: a.parent_id, name: a.name, description: a.description_html || "", color: a.color || "#00838F", order: "none", coverImagePath: undefined },
        { coverImage: a.cover_image_path });
      return ok("Gliederung angelegt.", { id: r.id, name: r.name, sortOrder: r.sortOrder, parentId: r.parentId, hat_titelbild: !!r.coverImage });
    },
  },
  {
    name: "scobees_update_gliederung",
    description: "Ändert Name, Beschreibung, Kachelbild und/oder Farbe einer Gliederungsstruktur. Nicht angegebene Felder bleiben erhalten (auch ein vorhandenes Kachelbild und die Farbe).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" }, name: { type: "string" }, description_html: { type: "string" },
        cover_image_path: { type: "string", description: COVER_HINT },
        color: { type: "string", description: "Hex-Farbe der Gliederung" },
      },
      required: ["id"],
    },
    run: async (a) => {
      const cur = await api.lerninput(a.id);
      if (cur.isLeaf) throw new Error("Das ist eine Aufgabe, keine Gliederung (→ scobees_update_aufgabe).");
      if (a.cover_image_path) assertCoverImage(a.cover_image_path);
      // color/order/coverImagePath mitschicken wie die Weboberfläche – ohne sie verliert die Gliederung beim Speichern ihre Farbe.
      const r = await api.saveFolder({
        id: a.id, parentId: cur.parentId, name: a.name ?? cur.name, description: a.description_html ?? cur.description ?? "",
        color: a.color ?? cur.color ?? "#00838F", order: cur.solveOrder ?? "none",
        coverImagePath: a.cover_image_path ? undefined : cur.coverImage?.path,
      }, { coverImage: a.cover_image_path });
      return ok("Gliederung geändert.", { id: r.id, name: r.name, hat_titelbild: !!r.coverImage });
    },
  },
  {
    name: "scobees_create_wahlpflicht",
    description: "Legt eine Wahlpflichtaufgabe an: ein Container, aus dem Lernende eine Mindestanzahl an Unteraufgaben lösen. Unteraufgaben danach mit scobees_create_aufgabe (parent_id = diese ID) anlegen. Eine bestehende Aufgabe lässt sich ab scobees 94.6 auch mit scobees_move hineinschieben (sie verliert dabei ihren Aufgabentyp); heraus kommt eine Unteraufgabe nicht mehr.",
    inputSchema: {
      type: "object",
      properties: {
        parent_id: { type: "string" },
        name: { type: "string" },
        description_html: { type: "string", default: "" },
        mindest_aufgaben: { type: "number", default: 1, description: "Wie viele Unteraufgaben müssen gelöst werden" },
        color: { type: "string", default: "#c88503", description: "Hex-Farbe" },
        cover_image_path: { type: "string", description: "Lokales Titelbild, optional" },
      },
      required: ["parent_id", "name"],
    },
    run: async (a) => {
      const r = await api.saveChoice({
        parentId: a.parent_id, id: undefined, name: a.name, description: a.description_html || "",
        minimumAmountOfTasks: String(a.mindest_aufgaben ?? 1), color: a.color || "#c88503",
      }, { coverImage: a.cover_image_path });
      return ok("Wahlpflichtaufgabe angelegt.", { id: r.id, name: r.name, mindestAufgaben: r.tasksRequiredForCompletion, hat_titelbild: !!r.coverImage });
    },
  },
  {
    name: "scobees_update_wahlpflicht",
    description: "Ändert eine Wahlpflichtaufgabe (Name, Beschreibung, Mindestanzahl, Farbe, Titelbild). Nicht angegebene Felder bleiben erhalten.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        description_html: { type: "string" },
        mindest_aufgaben: { type: "number" },
        color: { type: "string" },
        cover_image_path: { type: "string" },
      },
      required: ["id"],
    },
    run: async (a) => {
      const cur = await api.lerninput(a.id);
      if (nodeType(cur) !== "wahlpflicht") throw new Error(`${a.id} ist keine Wahlpflichtaufgabe.`);
      const fields = {
        parentId: cur.parentId, id: a.id, name: a.name ?? cur.name, description: a.description_html ?? cur.description ?? "",
        minimumAmountOfTasks: String(a.mindest_aufgaben ?? cur.tasksRequiredForCompletion ?? 1), color: a.color ?? cur.color ?? "#c88503",
      };
      if (!a.cover_image_path) fields.coverImage = null; // ohne neues Bild schickt die Oberfläche coverImage=null
      const r = await api.saveChoice(fields, { coverImage: a.cover_image_path });
      return ok("Wahlpflichtaufgabe geändert.", { id: r.id, name: r.name, mindestAufgaben: r.tasksRequiredForCompletion, hat_titelbild: !!r.coverImage });
    },
  },
  {
    name: "scobees_upload_bild",
    description: "Lädt ein Bild (png/jpg/gif/webp/svg) für ein interaktives Arbeitsblatt hoch und liefert die URL, die im Markdown als ![Beschreibung](URL) verwendet wird. Das Bild liegt danach öffentlich im Medienspeicher des Serlo-Editors (wie beim Hochladen in der Weboberfläche) – keine Personenfotos oder vertraulichen Inhalte.",
    inputSchema: {
      type: "object",
      properties: { file_path: { type: "string", description: "Lokaler Pfad zur Bilddatei" } },
      required: ["file_path"],
    },
    run: async (a) => {
      const url = await api.uploadSerloImage(a.file_path);
      return ok("Bild hochgeladen. Im Arbeitsblatt-Markdown einbinden mit ![Beschreibung](URL).", { url, markdown: `![Bild](${url})` });
    },
  },
  {
    name: "scobees_create_aufgabe",
    description:
      "Legt eine Aufgabe in einer Gliederung, einer Wahlpflichtaufgabe oder direkt im Lernpfad an. art bestimmt die Abgabe (nicht das Quiz): info, selbstkontrolle (Standard: " +
      "Arbeitsblatt mit sich selbst prüfendem Quiz, keine Abgabe), abgabe_optional, abgabe_pflicht, abgabe_selbstkorrektur, abgabe_pflicht_selbstkorrektur. Das Arbeitsblatt kommt als " +
      "Markdown (arbeitsblatt_markdown; Quiz-Blöcke quiz-sc, quiz-mc, quiz-input, quiz-blanks, quiz-blanks-dnd, quiz-text, dazu math, :::box, :::spoiler) oder als fertiges serlo_json. " +
      "Liegt parent_id in einer Wahlpflichtaufgabe, setzt der Server den dafür nötigen Aufgabentyp selbst. Das Ergebnis kann warnungen[] enthalten (z. B. $…$ in einer Lückenantwort). " +
      "Material und Musterlösungen danach mit scobees_upload_material anhängen.",
    inputSchema: {
      type: "object",
      properties: {
        parent_id: { type: "string" },
        name: { type: "string" },
        description_html: { type: "string", description: "Kurzbeschreibung (HTML), erscheint über dem Arbeitsblatt" },
        art: { type: "string", enum: Object.keys(KIND), default: "selbstkontrolle", description: "Abgabeform. info = Infobaustein ohne Abgabe; selbstkontrolle = Arbeitsblatt mit Serlo-Quiz, prüft sich selbst, keine Abgabe (Standard für Theorie + Quiz); abgabe_optional = Lernende geben ein Ergebnis ab (Datei/Stift-PDF/Link); abgabe_pflicht = Abgabe zwingend; abgabe_selbstkorrektur = Abgabe (optional), danach Vergleich mit der Musterlösung; abgabe_pflicht_selbstkorrektur = Abgabe zwingend + Musterlösungs-Vergleich (scobees-„Selbstkorrektur“; Musterlösung per scobees_upload_material als_musterloesung). Hinweis: selbstkontrolle trägt in scobees bewusst KEIN Selbstkorrektur-Kennzeichen – das Quiz prüft sich im Arbeitsblatt. Wenn ein Ergebnis erwartet wird, abgabe_* wählen und in description_html sagen, WAS abzugeben ist." },
        abgabeformen: { type: "array", items: { type: "string", enum: ABGABEFORM }, description: "Nur für abgabe_*: file (Datei hochladen), pen (PDF mit Stift bearbeiten), link (Videolink). Standard [\"file\"]; mehrere = eine reicht." },
        arbeitsblatt_markdown: { type: "string", description: "Inhalt des interaktiven Arbeitsblatts als Markdown" },
        serlo_json: { type: "string", description: "Alternativ: fertiges Serlo-Dokument (JSON-String, Wurzel plugin rows)" },
        estimated_time: { type: "number", default: 0, description: "Minuten" },
        differenzierungen: { type: "array", items: { type: "string" }, description: "Niveaus der Schule (scobees_list_tags), z. B. [\"Hauptschulabschluss\",\"Realschulabschluss\"]. Leer = alle aktuellen Niveaus der Schule werden explizit eingetragen (scobees kennt kein eigenes „für alle“ – beim Zurücklesen stehen deshalb alle einzeln da, das ist kein Fehler). Kommt später ein neues Niveau hinzu, erscheint es nicht automatisch bei alten Aufgaben; dann erneut mit leerem differenzierungen aktualisieren. Lernende sehen nur Aufgaben ihres Niveaus." },
        links: { type: "array", items: { type: "object", properties: { url: { type: "string" }, name: { type: "string" } }, required: ["url"] } },
        interne_notiz: { type: "string", description: "Nur für Lehrkräfte sichtbar" },
        aufgabentyp: { type: "string", enum: Object.keys(AUFGABENTYP), default: "pflicht", description: "pflicht = zählt zum Fortschritt; extra = freiwillige Zusatzaufgabe; training = freiwillige Übung; info = reiner Informationsbaustein" },
        cover_image_path: { type: "string", description: COVER_HINT },
      },
      required: ["parent_id", "name"],
    },
    run: async (a) => {
      if (a.abgabeform && !a.abgabeformen) a.abgabeformen = [].concat(a.abgabeform);
      const k = KIND[a.art || "selbstkontrolle"];
      const diffs = await resolveDiffTags(a.differenzierungen);
      // Schritt 1: leere Aufgabe anlegen (so macht es die Oberfläche) …
      // Liegt parent_id in einer Wahlpflichtaufgabe, verlangt scobees zwingend taskType "Wahlpflichtaufgabe"
      // (live geprüft per Mitschnitt 04.11.2026) – der gewählte aufgabentyp wird dann wie in der Weboberfläche
      // selbst übergangen, ein normaler taskType scheitert dort mit HTTP 405. Deshalb beim ersten Fehlschlag
      // automatisch mit dem Wahlpflicht-taskType erneut versuchen, statt den Fehler einfach durchzureichen.
      let taskType = taskTypeOf(a);
      const anlegen = (tt) => api.saveTask({
        taskType: tt, name: "", socialType: "nicht spezifiziert", activityType: "nicht spezifiziert",
        diffs: [], licenseType: "cc0", parentId: a.parent_id, sampleSolutions: undefined, attachments: undefined, links: [],
        taskDescription: null, taskAudioDescription: undefined, lfs: [], hintText: "", hintAttachments: undefined, isHintSave: false,
        kind: "task", isUploadRequired: false, isSelfCorrectionNecessary: false, isLinkSubmissionEnabled: false,
      });
      let created;
      try {
        created = await anlegen(taskType);
      } catch (e) {
        if (!/taskgroup/i.test(e.message)) throw e;
        taskType = "Wahlpflichtaufgabe";
        try { created = await anlegen(taskType); } catch (e2) { clarifyTaskgroupError(e2); }
      }
      // … Schritt 2: mit allen Feldern speichern
      const form = taskToForm({ ...created, parentId: a.parent_id });
      Object.assign(form, {
        name: a.name,
        description: a.description_html || "",
        internalTeacherNote: a.interne_notiz ?? null,
        taskType,
        estimatedTime: a.estimated_time || 0,
        diffs,
        ...k,
        ...submissionFields(a.art || "selbstkontrolle", a.abgabeformen),
        links: (a.links || []).map((l) => ({ url: l.url, name: l.name || l.url, type: "url" })),
        taskDescription: buildTaskDescription(a) ?? null,
      });
      if (a.cover_image_path) form.coverImagePath = (await uploadTaskCover(created.id, a.cover_image_path)).path;
      const r = await api.saveTask(form);
      const out1 = ok("Aufgabe angelegt.", { id: r.id, name: r.name, kind: r.kind, parentId: r.parentId, bausteine: r.taskDescription ? listPlugins(r.taskDescription) : [], hat_titelbild: !!r.coverImage });
      const w1 = arbeitsblattWarnungen(a);
      if (w1) out1.warnungen = w1;
      return out1;
    },
  },
  {
    name: "scobees_update_aufgabe",
    description: "Ändert eine bestehende Aufgabe. Nur übergebene Felder werden geändert; ein vorhandenes Kachelbild bleibt erhalten. arbeitsblatt_markdown/serlo_json ersetzen das Arbeitsblatt komplett (vorher mit scobees_get_aufgabe lesen) – für einzelne Textstellen ist scobees_patch_arbeitsblatt der kürzere und sicherere Weg.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        description_html: { type: "string" },
        art: { type: "string", enum: Object.keys(KIND) },
        abgabeformen: { type: "array", items: { type: "string", enum: ABGABEFORM } },
        aufgabentyp: { type: "string", enum: Object.keys(AUFGABENTYP) },
        arbeitsblatt_markdown: { type: "string" },
        serlo_json: { type: "string" },
        estimated_time: { type: "number" },
        differenzierungen: { type: "array", items: { type: "string" }, description: "Siehe scobees_create_aufgabe: leer trägt alle aktuellen Niveaus explizit ein, das ist kein Fehler." },
        links: { type: "array", items: { type: "object", properties: { url: { type: "string" }, name: { type: "string" } }, required: ["url"] } },
        interne_notiz: { type: "string" },
        cover_image_path: { type: "string", description: COVER_HINT },
      },
      required: ["id"],
    },
    run: async (a) => {
      if (a.abgabeform && !a.abgabeformen) a.abgabeformen = [].concat(a.abgabeform);
      const cur = await api.lerninput(a.id);
      if (!cur.isLeaf) throw new Error("Das ist keine Aufgabe (Gliederung/Wahlpflicht → scobees_update_gliederung).");
      const form = taskToForm(cur);
      if (a.name != null) form.name = a.name;
      if (a.description_html != null) form.description = a.description_html;
      if (a.interne_notiz != null) form.internalTeacherNote = a.interne_notiz;
      if (a.estimated_time != null) form.estimatedTime = a.estimated_time;
      if (a.art) Object.assign(form, KIND[a.art], submissionFields(a.art, a.abgabeformen));
      if (a.aufgabentyp) form.taskType = AUFGABENTYP[a.aufgabentyp];
      if (a.differenzierungen) form.diffs = await resolveDiffTags(a.differenzierungen);
      if (a.links) form.links = a.links.map((l) => ({ url: l.url, name: l.name || l.url, type: "url" }));
      const td = buildTaskDescription(a);
      if (td !== undefined) form.taskDescription = td;
      const cover = a.cover_image_path ? await uploadTaskCover(a.id, a.cover_image_path, cur.coverImage) : null;
      if (cover) form.coverImagePath = cover.path;
      const r = await api.saveTask(form);
      if (cover) await cover.cleanup();
      const out2 = ok("Aufgabe geändert.", { id: r.id, name: r.name, kind: r.kind, hat_titelbild: !!r.coverImage });
      const w2 = arbeitsblattWarnungen(a);
      if (w2) out2.warnungen = w2;
      return out2;
    },
  },
  {
    name: "scobees_patch_arbeitsblatt",
    description: "Ändert das Arbeitsblatt einer Aufgabe gezielt, statt es komplett neu zu senden: ersetzt im aktuellen Markdown jede angegebene Zeichenkette durch eine neue. Alles-oder-nichts – jede „alt“-Zeichenkette muss genau einmal vorkommen, sonst wird nichts geändert und die Meldung nennt jede fehlgeschlagene Ersetzung (nicht gefunden/mehrfach gefunden). Nur möglich, wenn das Arbeitsblatt verlustfrei als Markdown darstellbar ist (keine Bausteine wie Bild-Zuordnung ohne Markdown-Entsprechung); sonst Fehlermeldung mit Verweis auf scobees_get_aufgabe(mit_serlo_json) + scobees_update_aufgabe(serlo_json).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Aufgaben-ID (LI-…)" },
        ersetzungen: {
          type: "array",
          items: { type: "object", properties: { alt: { type: "string" }, neu: { type: "string" } }, required: ["alt", "neu"] },
          description: "Je ein Paar alt/neu; „alt“ muss im aktuellen Arbeitsblatt-Markdown genau einmal vorkommen.",
        },
      },
      required: ["id", "ersetzungen"],
    },
    run: async (a) => {
      if (!a.ersetzungen || !a.ersetzungen.length) throw new Error("ersetzungen darf nicht leer sein.");
      if (a.ersetzungen.some((e) => !e.alt)) throw new Error("„alt“ darf nicht leer sein.");
      const cur = await api.lerninput(a.id);
      if (!cur.isLeaf) throw new Error("Das ist keine Aufgabe (Gliederung/Wahlpflicht haben kein Arbeitsblatt).");
      if (!cur.taskDescription) throw new Error("Diese Aufgabe hat noch kein Arbeitsblatt (arbeitsblatt_markdown fehlt bisher).");
      const md = serloToMarkdown(cur.taskDescription);
      const neuesMd = applyPatches(md, a.ersetzungen); // wirft bei verlustbehaftetem Baustein oder nicht genau einem Treffer
      const form = taskToForm(cur);
      form.taskDescription = markdownToSerlo(neuesMd);
      const r = await api.saveTask(form);
      const out3 = ok(`${a.ersetzungen.length} Ersetzung(en) angewendet.`, { id: r.id, bausteine: listPlugins(r.taskDescription) });
      if (markdownToSerlo.warnungen?.length) out3.warnungen = markdownToSerlo.warnungen;
      return out3;
    },
  },
  {
    name: "scobees_upload_material",
    description: "Hängt eine lokale Datei an eine Aufgabe an – als Material (PDF, Bild, HTML-Simulation, interaktive Seite, GeoGebra-Datei …) oder als Musterlösung. ersetzt_attachment_id: nach erfolgreichem Hochladen wird dieser alte Anhang gelöscht (z. B. bei einer neuen Fassung derselben Datei); schlägt der Upload fehl, bleibt der alte unangetastet.",
    inputSchema: {
      type: "object",
      properties: {
        aufgabe_id: { type: "string" },
        file_path: { type: "string", description: "Absoluter lokaler Pfad" },
        als_musterloesung: { type: "boolean", default: false },
        ersetzt_attachment_id: { type: "string", description: "ATT-ID eines bestehenden Anhangs/einer Musterlösung an derselben Aufgabe, der nach erfolgreichem Upload gelöscht wird (aus scobees_get_aufgabe)" },
      },
      required: ["aufgabe_id", "file_path"],
    },
    run: async (a) => {
      const att = await api.uploadAttachment(a.aufgabe_id, a.file_path, a.als_musterloesung ? "samplesolution" : "lerninput_attachment");
      // Die Oberfläche speichert die Aufgabe danach erneut; wir tun dasselbe, damit der Anhang sicher verknüpft ist.
      const cur = await api.lerninput(a.aufgabe_id);
      await api.saveTask(taskToForm(cur));
      const out = ok("Datei hochgeladen und mit der Aufgabe verknüpft.", { attachment_id: att.id, filename: att.filename, url: api.attachmentUrl(att.path) });
      const ansicht = anhangAnsichtHinweis(cur, !!a.als_musterloesung);
      if (ansicht) out.hinweis_ansicht = ansicht;
      if (a.ersetzt_attachment_id) {
        try {
          await api.removeAttachment(a.ersetzt_attachment_id);
          out.hinweis += ` Alter Anhang ${a.ersetzt_attachment_id} wurde gelöscht.`;
        } catch (e) {
          out.warnung = `Neue Datei ist hochgeladen, der alte Anhang ${a.ersetzt_attachment_id} konnte aber nicht gelöscht werden (${e.message}). Bitte mit scobees_delete_material nachholen.`;
        }
      }
      return out;
    },
  },
  {
    name: "scobees_delete_material",
    description: "Löscht genau einen Anhang (Material oder Musterlösung) einer Aufgabe. attachment_id aus scobees_get_aufgabe (anhaenge[].id / musterloesungen[].id). Erfordert confirm=true. Prüft, dass der Anhang wirklich zu dieser Aufgabe gehört, und warnt, wenn es das letzte PDF einer Stift-Abgabe (abgabeformen: pen) ist – ohne PDF ist dort kein Abgeben mehr möglich.",
    inputSchema: {
      type: "object",
      properties: {
        aufgabe_id: { type: "string" },
        attachment_id: { type: "string", description: "ATT-ID des zu löschenden Anhangs" },
        confirm: { type: "boolean", description: "Muss true sein" },
      },
      required: ["aufgabe_id", "attachment_id", "confirm"],
    },
    run: async (a) => {
      if (a.confirm !== true) throw new Error("Löschen abgebrochen: confirm muss true sein.");
      const cur = await api.lerninput(a.aufgabe_id);
      const found = findAttachment(cur, a.attachment_id);
      if (!found) throw new Error(`Anhang ${a.attachment_id} gehört nicht zu Aufgabe ${a.aufgabe_id} (nicht unter anhaenge[] oder musterloesungen[] gefunden).`);
      const warnung = letztesPenPdfWarnung(cur, a.attachment_id, found);
      await api.removeAttachment(a.attachment_id);
      const out = ok(`Anhang „${found.item.filename}“ gelöscht.`, { id: a.attachment_id, aufgabe_id: a.aufgabe_id });
      if (warnung) out.warnung = warnung;
      return out;
    },
  },
  {
    name: "scobees_move",
    description:
      "Verschiebt eine Aufgabe/Gliederung/Wahlpflicht an eine Position (sort_order, 0-basiert) – auch in eine andere Gliederung desselben Lernpfads. " +
      "Eine einzelne Aufgabe lässt sich auch in eine Wahlpflichtaufgabe verschieben (ab scobees 94.6): Sie wird dabei zur Unteraufgabe, verliert ihren " +
      "bisherigen Aufgabentyp (Pflicht/Extra/Training/Projekt) und kommt nicht wieder heraus – das Ergebnis nennt die Umstellung unter warnung. " +
      "Unteraufgaben lassen sich nur innerhalb ihrer Wahlpflichtaufgabe umsortieren.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" }, parent_id: { type: "string", description: "Ziel: Gliederung, Lernpfad oder (nur für einzelne Aufgaben) Wahlpflichtaufgabe" }, sort_order: { type: "number" } },
      required: ["id", "parent_id", "sort_order"],
    },
    run: async (a) => {
      const vorher = await api.lerninput(a.id);
      try { await api.move(a.id, a.parent_id, a.sort_order); } catch (e) { clarifyTaskgroupError(e); }
      const out = ok("Verschoben.", { id: a.id, parentId: a.parent_id, sortOrder: a.sort_order });
      if (vorher.isLeaf && vorher.parentId !== a.parent_id) {
        const nachher = await api.lerninput(a.id);
        if (nachher.taskType !== vorher.taskType) {
          out.aufgabentyp = nachher.taskType;
          out.warnung = `Die Aufgabe ist jetzt Unteraufgabe einer Wahlpflichtaufgabe; ihr Aufgabentyp wurde von „${vorher.taskType}“ auf „${nachher.taskType}“ umgestellt. ` +
            "Zurück in eine Gliederung lässt sie sich nicht mehr verschieben (nur neu anlegen und hier löschen).";
        }
      }
      return out;
    },
  },
  {
    name: "scobees_delete",
    description:
      "Löscht eine Aufgabe, eine leere Gliederung oder Wahlpflichtaufgabe oder einen ganzen Lernpfad. Erfordert confirm=true. Regeln von scobees: " +
      "Ein ganzer Lernpfad wird mit allen Unterelementen gelöscht, aber nur solange er niemandem zugewiesen ist. Gliederungen und Wahlpflichtaufgaben lassen sich " +
      "nur leer löschen (erst die Aufgaben darin löschen). Einzelne Aufgaben lassen sich auch in einem zugewiesenen Lernpfad löschen und verschwinden dann sofort " +
      "bei den Lernenden, auch wenn schon Lernergebnisse abgegeben wurden – deshalb verlangt das Werkzeug dort zusätzlich auch_wenn_zugewiesen=true.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        confirm: { type: "boolean", description: "Muss true sein" },
        auch_wenn_zugewiesen: { type: "boolean", description: "Nur nach ausdrücklicher Zustimmung der Lehrkraft: Löschen in einem Lernpfad erlauben, mit dem Lernende bereits arbeiten" },
      },
      required: ["id", "confirm"],
    },
    run: async (a) => {
      if (a.confirm !== true) throw new Error("Löschen abgebrochen: confirm muss true sein.");
      const cur = await api.lerninput(a.id);
      if (cur.parentId && a.auch_wenn_zugewiesen !== true && (await isAssigned(a.id))) {
        throw new Error(`„${cur.name}“ liegt in einem Lernpfad, der Lernenden zugewiesen ist. Löschen entfernt das Element sofort bei den Lernenden, auch wenn schon Lernergebnisse dazu abgegeben wurden. ` +
          "Nur nach ausdrücklicher Zustimmung der Lehrkraft erneut mit auch_wenn_zugewiesen=true aufrufen.");
      }
      try { await api.remove(a.id); } catch (e) { clarifyDeleteError(e); }
      return ok(`„${cur.name}“ gelöscht.`, { id: a.id, typ: nodeType(cur) });
    },
  },
  {
    name: "scobees_markdown_vorschau",
    description: "Wandelt Markdown testweise in das Serlo-Format um (ohne etwas zu speichern) und zeigt die erzeugten Bausteine.",
    inputSchema: { type: "object", properties: { markdown: { type: "string" } }, required: ["markdown"] },
    run: async ({ markdown }) => {
      const doc = markdownToSerlo(markdown);
      const out = { bausteine: listPlugins(doc), rueckuebersetzung: serloToMarkdown(doc), serlo_json: doc };
      if (markdownToSerlo.warnungen?.length) out.warnungen = markdownToSerlo.warnungen;
      return out;
    },
  },
];

// ── Schutz bei zugewiesenen Lernpfaden ────────────────────────────────────────
// Mit einem Dummy-Konto geprüft (scobees 94.6): Sobald ein Lernpfad einer Lerngruppe zugewiesen ist, sehen Lernende
// jede Änderung über diese Schnittstelle sofort – auch neu angelegte Gliederungen und Aufgaben, ohne dass die
// Lehrkraft etwas veröffentlicht. Ob zugewiesen ist, steht nur an der Wurzel (state "ACTIVE"). Jedes schreibende
// Werkzeug prüft das deshalb vor dem Schreiben und hängt eine Warnung an sein Ergebnis. Ausgegeben wird nur die
// Tatsache der Zuweisung, nie an wen.
const ASSIGNED_WARNING = "Dieser Lernpfad ist Lernenden zugewiesen: Die Änderung ist für sie sofort sichtbar, ohne weiteren Schritt der Lehrkraft.";
const _assignedCache = new Map();
async function isAssigned(id) {
  const hit = _assignedCache.get(id);
  if (hit && Date.now() - hit.t < 30000) return hit.v;
  let cur = await api.lerninput(id);
  for (let i = 0; i < 8 && cur.parentId; i++) cur = await api.lerninput(cur.parentId);
  const v = cur.state === "ACTIVE";
  _assignedCache.set(id, { v, t: Date.now() });
  return v;
}
const ZIEL = {
  scobees_update_lernpfad: (a) => a.id,
  scobees_create_gliederung: (a) => a.parent_id,
  scobees_update_gliederung: (a) => a.id,
  scobees_create_wahlpflicht: (a) => a.parent_id,
  scobees_update_wahlpflicht: (a) => a.id,
  scobees_create_aufgabe: (a) => a.parent_id,
  scobees_update_aufgabe: (a) => a.id,
  scobees_patch_arbeitsblatt: (a) => a.id,
  scobees_upload_material: (a) => a.aufgabe_id,
  scobees_delete_material: (a) => a.aufgabe_id,
  scobees_move: (a) => a.id,
  scobees_delete: (a) => (a.confirm === true ? a.id : null),
};
for (const tool of TOOLS) {
  const ziel = ZIEL[tool.name];
  if (!ziel) continue;
  const run = tool.run;
  tool.run = async (a) => {
    let assigned = false;
    try { const id = ziel(a || {}); if (id) assigned = await isAssigned(id); } catch { /* die Prüfung darf das Werkzeug nie verhindern */ }
    const out = await run(a);
    if (assigned && out && typeof out === "object") { out.zugewiesen = true; out.warnung_zugewiesen = ASSIGNED_WARNING; }
    return out;
  };
}

module.exports = { isAssigned, anhangAnsichtHinweis, clarifyDeleteError, TOOLS, KIND, compact, taskToForm, clarifyTaskgroupError, htmlToPlainText, findAttachment, letztesPenPdfWarnung, applyPatches };
