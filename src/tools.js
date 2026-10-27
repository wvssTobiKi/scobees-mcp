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
const KIND = {
  info:              { kind: "task",                   isUploadRequired: false, solutionMustBeUploaded: false, isSelfCorrectionNecessary: false },
  selbstkontrolle:   { kind: "task+sc",                isUploadRequired: false, solutionMustBeUploaded: false, isSelfCorrectionNecessary: true },
  abgabe_optional:   { kind: "task+upload-optional",   isUploadRequired: true,  solutionMustBeUploaded: false, isSelfCorrectionNecessary: false },
  abgabe_pflicht:    { kind: "task+upload-required",   isUploadRequired: true,  solutionMustBeUploaded: true,  isSelfCorrectionNecessary: false },
  abgabe_optional_sc:{ kind: "task+upload-optional+sc",isUploadRequired: true,  solutionMustBeUploaded: false, isSelfCorrectionNecessary: true },
};

/** Kompakte Baumansicht eines Lerninputs (für get_lernpfad). */
function compact(node, depth = 0) {
  const out = {
    id: node.id, name: node.name, typ: nodeType(node), sortOrder: node.sortOrder,
    state: node.state, isPublished: node.isPublished,
  };
  if (node.description) out.beschreibung = stripHtml(node.description).slice(0, 200);
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
const ok = (msg, data) => ({ ok: true, hinweis: msg, ...data });

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
    requiredSubmissions: t.requiredSubmissions || ["file"],
    removedSampleSolutionIds: [],
    submissionRule: t.submissionRule || "all",
    isPenEnabled: !!t.isPenEnabled,
    isLinkSubmissionEnabled: !!t.isLinkSubmissionEnabled,
    lfs: t.lfs || [],
    parentId: t.parentId,
    coverImagePath: undefined,
    attachments: undefined,
    sampleSolutions: undefined,
    links: t.links || [],
    taskDescription: t.taskDescription ?? null,
    taskAudioDescription: null,
  };
}

async function resolveDiffTags(names) {
  if (!names || !names.length) return [];
  const tags = await api.libraryTags();
  const diffs = tags.filter((t) => t.type === "differentiation");
  return names.map((n) => {
    const hit = diffs.find((d) => d.id === n || d.name.toLowerCase() === String(n).toLowerCase());
    if (!hit) throw new Error(`Differenzierung „${n}“ unbekannt. Verfügbar: ${diffs.map((d) => d.name).join(", ")}`);
    return { id: hit.id, name: hit.name, type: "differentiation" };
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

// ── Werkzeugdefinitionen ─────────────────────────────────────────────────────
const TOOLS = [
  // Lesen
  {
    name: "scobees_me",
    description: "Zeigt das eigene scobees-Konto (ID, Rolle, Schule) und prüft die Anmeldung.",
    inputSchema: { type: "object", properties: {} },
    run: async () => {
      const me = await api.me();
      return { id: me.id, role: me.role, schoolId: me.schoolId, schoolName: me.schoolName };
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
        differenzierungen: tags.filter((t) => t.type === "differentiation").map((t) => ({ id: t.id, name: t.name })),
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
    description: "Lädt einen Lernpfad mit vollständigem Aufbau (Gliederungen → Aufgaben) als kompakten Baum. IDs daraus werden für Änderungen benötigt.",
    inputSchema: { type: "object", properties: { id: { type: "string", description: "Lernpfad-ID (LI-…)" } }, required: ["id"] },
    run: async ({ id }) => compact(await api.lerninput(id)),
  },
  {
    name: "scobees_get_aufgabe",
    description: "Lädt eine einzelne Aufgabe inkl. Arbeitsblatt (Serlo) als Markdown, Links und Anhängen. Für Änderungen an bestehenden Aufgaben.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Aufgaben-ID (LI-…)" }, mit_serlo_json: { type: "boolean", default: false, description: "zusätzlich das rohe Serlo-JSON ausgeben" } },
      required: ["id"],
    },
    run: async ({ id, mit_serlo_json }) => {
      const t = await api.lerninput(id);
      const out = {
        id: t.id, name: t.name, parentId: t.parentId, kind: t.kind, taskType: t.taskType, state: t.state,
        beschreibung_html: t.description, interne_notiz: t.internalTeacherNote, estimatedTime: t.estimatedTime,
        differenzierungen: (t.tags?.differentiations || []).map((d) => d.name),
        links: t.links || [],
        anhaenge: (t.attachments || []).map((a) => ({ id: a.id, filename: a.filename, type: a.type, url: api.attachmentUrl(a.path) })),
        musterloesungen: (t.sampleSolutions || []).map((a) => ({ id: a.id, filename: a.filename })),
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
    description: "Legt einen neuen Lernpfad in einem Fach an (Wurzel). Danach Gliederungen und Aufgaben mit den anderen Werkzeugen hinzufügen. Der Pfad ist zunächst nicht für die Zuweisung aktiviert.",
    inputSchema: {
      type: "object",
      properties: {
        subject_id: { type: "string", description: "Fach-ID aus scobees_list_subjects" },
        name: { type: "string" },
        description: { type: "string", description: "Beschreibung (Klartext oder einfaches HTML)" },
        jahrgaenge: { type: "array", items: { type: "string" }, description: "z. B. [\"Jg 1\"] oder Tag-IDs" },
        stichwoerter: { type: "array", items: { type: "string" }, description: "Freie Schlagworte" },
        cover_image_path: { type: "string", description: "Lokaler Pfad zu einem Titelbild (png/jpg), optional" },
        solve_order: { type: "string", enum: ["none", "after_solving"], default: "none", description: "none = frei, after_solving = Reihenfolge einhalten" },
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
        description: a.description || "",
      }, { coverImage: a.cover_image_path });
      return ok("Lernpfad angelegt (Status INACTIVE – Aktivierung für die Zuweisung erfolgt in der Weboberfläche).", { id: r.id, name: r.name, state: r.state });
    },
  },
  {
    name: "scobees_create_gliederung",
    description: "Legt eine Gliederungsstruktur (Ordner/Phase) in einem Lernpfad oder einer anderen Gliederung an. Beschreibung ist HTML (h2, p, strong, em, u, a, span style=color).",
    inputSchema: {
      type: "object",
      properties: {
        parent_id: { type: "string", description: "Lernpfad- oder Gliederungs-ID" },
        name: { type: "string" },
        description_html: { type: "string", default: "" },
      },
      required: ["parent_id", "name"],
    },
    run: async (a) => {
      const r = await api.saveFolder({ parentId: a.parent_id, name: a.name, description: a.description_html || "" });
      return ok("Gliederung angelegt.", { id: r.id, name: r.name, sortOrder: r.sortOrder, parentId: r.parentId });
    },
  },
  {
    name: "scobees_update_gliederung",
    description: "Ändert Name und/oder Beschreibung einer Gliederungsstruktur. (Experimentell: gleicher Aufruf wie Anlegen, mit id.)",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" }, name: { type: "string" }, description_html: { type: "string" } },
      required: ["id"],
    },
    run: async (a) => {
      const cur = await api.lerninput(a.id);
      const r = await api.saveFolder({ id: a.id, parentId: cur.parentId, name: a.name ?? cur.name, description: a.description_html ?? cur.description ?? "" });
      return ok("Gliederung geändert.", { id: r.id, name: r.name });
    },
  },
  {
    name: "scobees_create_wahlpflicht",
    description: "Legt eine Wahlpflichtaufgabe an: ein Container, aus dem Lernende eine Mindestanzahl an Unteraufgaben lösen. Unteraufgaben danach mit scobees_create_aufgabe (parent_id = diese ID).",
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
      return ok("Wahlpflichtaufgabe angelegt.", { id: r.id, name: r.name, mindestAufgaben: r.tasksRequiredForCompletion });
    },
  },
  {
    name: "scobees_create_aufgabe",
    description:
      "Legt eine Aufgabe in einer Gliederung/Wahlpflicht/einem Lernpfad an. art: info (nur lesen), selbstkontrolle (Serlo-Quiz mit Selbstkontrolle), " +
      "abgabe_optional, abgabe_pflicht (Datei-Abgabe), abgabe_optional_sc. Das Arbeitsblatt kommt als Markdown (arbeitsblatt_markdown, " +
      "inkl. ```quiz-sc/quiz-mc/quiz-input/quiz-blanks/quiz-text-Blöcken) oder als fertiges serlo_json. Dateien danach mit scobees_upload_material anhängen.",
    inputSchema: {
      type: "object",
      properties: {
        parent_id: { type: "string" },
        name: { type: "string" },
        description_html: { type: "string", description: "Kurzbeschreibung (HTML), erscheint über dem Arbeitsblatt" },
        art: { type: "string", enum: Object.keys(KIND), default: "info" },
        arbeitsblatt_markdown: { type: "string", description: "Inhalt des interaktiven Arbeitsblatts als Markdown" },
        serlo_json: { type: "string", description: "Alternativ: fertiges Serlo-Dokument (JSON-String, Wurzel plugin rows)" },
        estimated_time: { type: "number", default: 0, description: "Minuten" },
        differenzierungen: { type: "array", items: { type: "string" }, description: "Namen/IDs, z. B. [\"Regulär\"]; leer = alle" },
        links: { type: "array", items: { type: "object", properties: { url: { type: "string" }, name: { type: "string" } }, required: ["url"] } },
        interne_notiz: { type: "string", description: "Nur für Lehrkräfte sichtbar" },
        wahlaufgabe: { type: "boolean", default: false, description: "true = Wahl- statt Pflichtaufgabe" },
      },
      required: ["parent_id", "name"],
    },
    run: async (a) => {
      const k = KIND[a.art || "info"];
      const diffs = await resolveDiffTags(a.differenzierungen);
      // Schritt 1: leere Aufgabe anlegen (so macht es die Oberfläche) …
      const created = await api.saveTask({
        taskType: a.wahlaufgabe ? "Wahlaufgabe" : "Pflichtaufgabe", name: "", socialType: "nicht spezifiziert", activityType: "nicht spezifiziert",
        diffs: [], licenseType: "cc0", parentId: a.parent_id, sampleSolutions: undefined, attachments: undefined, links: [],
        taskDescription: null, taskAudioDescription: undefined, lfs: [], hintText: "", hintAttachments: undefined, isHintSave: false,
        kind: "task", isUploadRequired: false, isSelfCorrectionNecessary: false, isLinkSubmissionEnabled: false,
      });
      // … Schritt 2: mit allen Feldern speichern
      const form = taskToForm({ ...created, parentId: a.parent_id });
      Object.assign(form, {
        name: a.name,
        description: a.description_html || "",
        internalTeacherNote: a.interne_notiz ?? null,
        taskType: a.wahlaufgabe ? "Wahlaufgabe" : "Pflichtaufgabe",
        estimatedTime: a.estimated_time || 0,
        diffs,
        ...k,
        links: (a.links || []).map((l) => ({ url: l.url, name: l.name || l.url, type: "url" })),
        taskDescription: buildTaskDescription(a) ?? null,
      });
      const r = await api.saveTask(form);
      return ok("Aufgabe angelegt.", { id: r.id, name: r.name, kind: r.kind, parentId: r.parentId, bausteine: r.taskDescription ? listPlugins(r.taskDescription) : [] });
    },
  },
  {
    name: "scobees_update_aufgabe",
    description: "Ändert eine bestehende Aufgabe. Nur übergebene Felder werden geändert; arbeitsblatt_markdown/serlo_json ersetzen das Arbeitsblatt komplett (vorher mit scobees_get_aufgabe lesen).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        description_html: { type: "string" },
        art: { type: "string", enum: Object.keys(KIND) },
        arbeitsblatt_markdown: { type: "string" },
        serlo_json: { type: "string" },
        estimated_time: { type: "number" },
        differenzierungen: { type: "array", items: { type: "string" } },
        links: { type: "array", items: { type: "object", properties: { url: { type: "string" }, name: { type: "string" } }, required: ["url"] } },
        interne_notiz: { type: "string" },
      },
      required: ["id"],
    },
    run: async (a) => {
      const cur = await api.lerninput(a.id);
      if (!cur.isLeaf) throw new Error("Das ist keine Aufgabe (Gliederung/Wahlpflicht → scobees_update_gliederung).");
      const form = taskToForm(cur);
      if (a.name != null) form.name = a.name;
      if (a.description_html != null) form.description = a.description_html;
      if (a.interne_notiz != null) form.internalTeacherNote = a.interne_notiz;
      if (a.estimated_time != null) form.estimatedTime = a.estimated_time;
      if (a.art) Object.assign(form, KIND[a.art]);
      if (a.differenzierungen) form.diffs = await resolveDiffTags(a.differenzierungen);
      if (a.links) form.links = a.links.map((l) => ({ url: l.url, name: l.name || l.url, type: "url" }));
      const td = buildTaskDescription(a);
      if (td !== undefined) form.taskDescription = td;
      const r = await api.saveTask(form);
      return ok("Aufgabe geändert.", { id: r.id, name: r.name, kind: r.kind });
    },
  },
  {
    name: "scobees_upload_material",
    description: "Hängt eine lokale Datei an eine Aufgabe an – als Material (PDF, Bild, HTML-Simulation, interaktive Seite, GeoGebra-Datei …) oder als Musterlösung.",
    inputSchema: {
      type: "object",
      properties: {
        aufgabe_id: { type: "string" },
        file_path: { type: "string", description: "Absoluter lokaler Pfad" },
        als_musterloesung: { type: "boolean", default: false },
      },
      required: ["aufgabe_id", "file_path"],
    },
    run: async (a) => {
      const att = await api.uploadAttachment(a.aufgabe_id, a.file_path, a.als_musterloesung ? "samplesolution" : "lerninput_attachment");
      // Die Oberfläche speichert die Aufgabe danach erneut; wir tun dasselbe, damit der Anhang sicher verknüpft ist.
      const cur = await api.lerninput(a.aufgabe_id);
      await api.saveTask(taskToForm(cur));
      return ok("Datei hochgeladen und mit der Aufgabe verknüpft.", { attachment_id: att.id, filename: att.filename, url: api.attachmentUrl(att.path) });
    },
  },
  {
    name: "scobees_move",
    description: "Verschiebt eine Aufgabe/Gliederung/Wahlpflicht an eine Position (sort_order, 0-basiert) – auch in eine andere Gliederung desselben Lernpfads.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" }, parent_id: { type: "string", description: "Ziel-Gliederung/-Lernpfad" }, sort_order: { type: "number" } },
      required: ["id", "parent_id", "sort_order"],
    },
    run: async (a) => { await api.move(a.id, a.parent_id, a.sort_order); return ok("Verschoben.", { id: a.id, parentId: a.parent_id, sortOrder: a.sort_order }); },
  },
  {
    name: "scobees_delete",
    description: "Löscht eine Aufgabe, Gliederung, Wahlpflichtaufgabe oder einen ganzen Lernpfad (inkl. Unterelementen!). Erfordert confirm=true.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" }, confirm: { type: "boolean", description: "Muss true sein" } },
      required: ["id", "confirm"],
    },
    run: async (a) => {
      if (a.confirm !== true) throw new Error("Löschen abgebrochen: confirm muss true sein.");
      const cur = await api.lerninput(a.id);
      await api.remove(a.id);
      return ok(`„${cur.name}“ gelöscht.`, { id: a.id, typ: nodeType(cur) });
    },
  },
  {
    name: "scobees_markdown_vorschau",
    description: "Wandelt Markdown testweise in das Serlo-Format um (ohne etwas zu speichern) und zeigt die erzeugten Bausteine.",
    inputSchema: { type: "object", properties: { markdown: { type: "string" } }, required: ["markdown"] },
    run: async ({ markdown }) => { const doc = markdownToSerlo(markdown); return { bausteine: listPlugins(doc), rueckuebersetzung: serloToMarkdown(doc), serlo_json: doc }; },
  },
];

module.exports = { TOOLS, KIND, compact, taskToForm };
