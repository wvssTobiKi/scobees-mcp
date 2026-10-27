/**
 * api.js – HTTP-Client für die scobees-Plattform-API
 *
 * Zwei Schutzmechanismen sind hier fest eingebaut:
 *  1. SPERRLISTE: Pfade mit Schüler-/Personendaten werden gar nicht erst aufgerufen
 *     (auch nicht, wenn ein Werkzeug es versehentlich versucht).
 *  2. FILTER: Personennamen in Antworten (editors, author, uploadedBy …) werden auf IDs reduziert.
 *
 * Alle Pfade sind in docs/scobees-api-map.md dokumentiert.
 */

const fs = require("fs");
const path = require("path");
const { getAccessToken } = require("./auth");

const API_URL = (process.env.SCOBEES_API_URL || "https://platform-api.scobees.com/api").replace(/\/$/, "");

// ── Sperrliste (Schülerdaten, Lernstände, Personenlisten) ────────────────────
const BLOCKED = [
  /^students?(\/|\?|$)/, /^users(?!\/me($|\?))/, /^linked-students/, /^teachers/, /\/teachers(\?|$)/,
  /^school-classes/, /^school-groups/, /^solutions/, /lernergebnisse/, /^learncoaching/, /^reflection/,
  /^notes/, /^learn-level/, /^exam/, /^certificate/, /^checkins/, /^attendance/, /^timetables/,
  /^inputs\//, /^input-appointments/, /^invitations/, /^teacher-dashboard/, /^learnplanning/,
  /^assignments/, /^subject-assessments/, /^gelingensnachweis/, /^impersonation/, /^school-year/,
  /^student-differentiation-locks/, /^subject\/assignment/,
];

function assertAllowed(p) {
  const rel = p.replace(/^\/+/, "");
  if (BLOCKED.some((re) => re.test(rel))) {
    throw new Error(`Blockiert: „${rel}“ betrifft Schüler- oder Personendaten und wird von diesem Server nicht aufgerufen.`);
  }
  return rel;
}

// ── Antwort-Filter ───────────────────────────────────────────────────────────
const PERSON_KEYS = new Set(["firstname", "lastname", "username", "email", "birthday"]);

function sanitize(x) {
  if (Array.isArray(x)) return x.map(sanitize);
  if (x && typeof x === "object") {
    // Personenobjekte (editors, author …) auf die ID reduzieren
    // Ausnahme: das eigene Konto (users/me) – hier bleiben Rolle und Schule erhalten, nur Namen fallen weg
    if (typeof x.id === "string" && x.id.startsWith("USER-") && ("firstname" in x || "username" in x) && !("role" in x)) {
      return x.id;
    }
    const out = {};
    for (const [k, v] of Object.entries(x)) {
      if (PERSON_KEYS.has(k)) continue;
      out[k] = sanitize(v);
    }
    return out;
  }
  return x;
}

// ── HTTP ─────────────────────────────────────────────────────────────────────
async function request(method, p, { json, form, query, raw } = {}) {
  const rel = assertAllowed(p);
  const url = new URL(`${API_URL}/${rel}`);
  if (query) for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));

  const headers = { Authorization: `Bearer ${await getAccessToken()}`, Accept: "application/json, text/plain, */*" };
  let body;
  if (form) {
    body = form; // FormData – Content-Type setzt fetch selbst (inkl. boundary)
  } else if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }

  const res = await fetch(url, { method, headers, body });
  if (res.status === 401) {
    throw new Error("scobees meldet 401 (nicht angemeldet). Token abgelaufen? Bitte erneut anmelden.");
  }
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`scobees-API ${method} ${rel} → HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  if (raw) return text;
  if (!text) return null;
  try {
    return sanitize(JSON.parse(text));
  } catch {
    return text;
  }
}

/**
 * scobees erwartet bei Lerninput-Schreibaufrufen multipart/form-data,
 * wobei jedes Feld ein JSON-kodierter String ist (so macht es die Weboberfläche).
 * Dateien werden als echte File-Felder angehängt.
 */
function lerninputForm(fields, files = {}) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    fd.append(k, v === undefined ? "undefined" : JSON.stringify(v));
  }
  for (const [k, filePath] of Object.entries(files)) {
    if (!filePath) continue;
    const { blob, name } = fileBlob(filePath);
    fd.append(k, blob, name);
  }
  return fd;
}

const MIME = {
  pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
  svg: "image/svg+xml", webp: "image/webp", html: "text/html", htm: "text/html", txt: "text/plain",
  md: "text/markdown", csv: "text/csv", json: "application/json", zip: "application/zip", mp4: "video/mp4",
  mp3: "audio/mpeg", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text", ggb: "application/vnd.geogebra.file",
};

function fileBlob(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Datei nicht gefunden: ${filePath}`);
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  return { blob: new Blob([fs.readFileSync(filePath)], { type }), name: path.basename(filePath), type };
}

// ── Fachliche Aufrufe (nur Inhalte) ──────────────────────────────────────────
const api = {
  me: () => request("GET", "users/me"),
  features: (schoolId) => request("GET", `school/${schoolId}/features`),

  workspaces: () => request("GET", "workspaces"),
  subjects: (workspaceId) =>
    request("GET", "subjects", { query: { withDeleted: false, withDisabled: false, workspaceFilter: workspaceId } }),
  subjectDefaultTags: () => request("GET", "subject-default-tags"),
  libraryTags: () => request("GET", "lerninput/library/tags"),
  schoolDiffs: () => request("GET", "school-diffs", { query: { withDeleted: false } }),

  lerninputs: ({ subjectId, page = 0, pageSize = 16, title } = {}) =>
    request("GET", "lerninput", { query: { subject: subjectId, page, pageSize, title } }),
  lerninput: (id) => request("GET", `lerninput/${id}`),
  rootDiffs: (rootId) => request("GET", `school-diffs/root-lerninput/${rootId}`),

  // Schreibaufrufe – Felder exakt wie von der Weboberfläche beobachtet
  createRoot: (fields, files) => request("POST", "lerninput", { form: lerninputForm(fields, files) }),
  saveFolder: (fields) => request("POST", "lerninput/folder", { form: lerninputForm(fields) }),
  saveChoice: (fields, files) => request("POST", "lerninput/choice", { form: lerninputForm(fields, files) }),
  saveTask: (fields, files) => request("POST", "lerninput/task", { form: lerninputForm(fields, files) }),
  move: (id, parentId, sortOrder) =>
    request("PUT", `lerninput/changePosition/${id}`, { json: { parentId, sortOrder } }),
  remove: (id) => request("DELETE", `lerninput/${id}`),

  uploadAttachment: (entityId, filePath, type = "lerninput_attachment") => {
    const fd = new FormData();
    fd.append("entityId", entityId);
    fd.append("entityType", "Lerninput");
    fd.append("type", type);
    const { blob, name } = fileBlob(filePath);
    fd.append("file", blob, name);
    return request("POST", "attachments", { form: fd });
  },
  attachmentUrl: (p) => `${API_URL}/attachment?path=${encodeURIComponent(p)}`,
};

module.exports = { api, request, assertAllowed, sanitize, lerninputForm, API_URL, BLOCKED };
