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
const SERLO_MEDIA_URL = process.env.SERLO_MEDIA_URL || "https://editor.serlo.org/media";
const TEACH_URL = process.env.SCOBEES_TEACH_URL || "https://teach.scobees.com";

// Mit welcher scobees-Oberfläche dieser Server zuletzt geprüft wurde (siehe CHANGELOG „Kompatibilität“).
// scobees hat keinen Versions-Endpunkt; die Version steht als Konstante im Frontend-Bundle, dessen Dateiname
// (main-XXXX.js) sich bei jedem Deploy ändert – ein billiger Fingerabdruck für „hat sich etwas geändert?“.
const KNOWN_SCOBEES = { version: "94.6", bundle: "main-FWSHPEPF.js", checked: "2026-11-11" };

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

// ── Diagnose für den Serlo-Bild-Upload ───────────────────────────────────────
// SCOBEES_DEBUG=1 zeigt bei einem Fehlschlag zusätzlich URL (mit maskierten Signaturen) und
// Antwort-Header; der Antworttext (gekürzt, maskiert) steht immer in der Fehlermeldung – vorher
// wurde er verworfen, sodass z. B. eine HTML-Fehlerseite des Hosters nur als nackter Statuscode
// ankam.
const DEBUG = /^(1|true|ja)$/i.test(process.env.SCOBEES_DEBUG || "");
const SECRET_HEADERS = /^(authorization|cookie|set-cookie)$/i;
const SECRET_QUERY = /^(x-amz-signature|x-amz-credential|x-amz-security-token|signature|token|sig)$/i;

function maskUrl(url) {
  try {
    const u = new URL(url);
    for (const k of [...u.searchParams.keys()]) if (SECRET_QUERY.test(k)) u.searchParams.set(k, "***");
    return u.toString();
  } catch {
    return url;
  }
}

function maskedHeaders(res) {
  const out = {};
  for (const [k, v] of res.headers.entries()) out[k] = SECRET_HEADERS.test(k) ? "***" : v;
  return out;
}

async function uploadErrorMessage(step, url, res) {
  const bodyText = await res.text().catch(() => "");
  const snippet = bodyText.replace(/\s+/g, " ").trim().slice(0, 300);
  let msg = `${step} → HTTP ${res.status}${res.statusText ? " " + res.statusText : ""}`;
  if (snippet) msg += `
Antwort: ${snippet}`;
  if (res.status === 402) {
    msg += `
HTTP 402 (Payment Required) kommt hier nicht von scobees oder diesem Server, sondern direkt vom Medienspeicher ` +
      `des Serlo-Editors (editor.serlo.org) – demselben, den die scobees-Weboberfläche selbst für Bild-Uploads ` +
      `im Arbeitsblatt benutzt. Das betrifft also alle scobees-Lehrkräfte, nicht nur dieses Konto oder diese ` +
      `Schule, und liegt weder an Dateigröße noch an Dateiformat. Ursache ist meist ein Konto-/Kontingentproblem ` +
      `bei Serlo (siehe Antworttext oben). Abhilfe hier nicht möglich; Fallback: scobees_upload_material hängt ` +
      `das Bild stattdessen als gewöhnlichen Anhang an die Aufgabe.`;
  }
  if (DEBUG) {
    msg += `
[Debug] URL: ${maskUrl(url)}`;
    msg += `
[Debug] Antwort-Header: ${JSON.stringify(maskedHeaders(res))}`;
  }
  return msg;
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
  saveFolder: (fields, files) => request("POST", "lerninput/folder", { form: lerninputForm(fields, files) }),
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
  // Einzelnen Anhang (Material oder Musterlösung, beide type-Werte) entfernen – live geprüft 11.11.2026:
  // derselbe Aufruf funktioniert für beide, unabhängig vom lerninput/task-Speichern (removedSampleSolutionIds
  // und ein leeres attachments-Array auf lerninput/task bewirken dagegen nichts).
  removeAttachment: (attachmentId) => request("DELETE", `attachments/${attachmentId}`),

  // Bild für das Serlo-Arbeitsblatt: der eingebettete Serlo-Editor lädt Bilder nicht zu scobees,
  // sondern in Serlos Medienspeicher (Mitschrift 27.10.2026): GET presigned-url (ohne Anmeldung) → PUT zu S3.
  // Rückgabe: öffentliche URL für image.src.
  // Version der scobees-Oberfläche ermitteln (ohne Anmeldung): index.html → main-Bundle-Name → Versionskonstante.
  frontendInfo: async () => {
    const out = { bundle: null, version: null, known: KNOWN_SCOBEES };
    try {
      const html = await (await fetch(`${TEACH_URL}/`)).text();
      out.bundle = (html.match(/main-[A-Za-z0-9_-]+\.js/) || [null])[0];
      if (out.bundle) {
        const js = await (await fetch(`${TEACH_URL}/${out.bundle}`)).text();
        const m = js.match(/=`(\d{2,3}\.\d+(?:\.\d+)?)`;var \w+=t=>\(\{id:t\.id,firstName/) || js.match(/var \w+=`(\d{2,3}\.\d+)`/);
        out.version = m ? m[1] : null;
      }
    } catch (e) {
      out.error = String(e.message || e);
    }
    out.unveraendert = !!out.bundle && out.bundle === KNOWN_SCOBEES.bundle;
    return out;
  },

  // presigned-url ist derselbe unauthentifizierte Aufruf, den der eingebettete Serlo-Editor selbst macht
  // (Mitschrift aus dem Lehrer-Bundle, chunk mit dem @serlo/editor-Paket) – kein Scobees-Token beteiligt.
  // Ein Fehler hier betrifft also auch die Weboberfläche, nicht nur diesen Server.
  uploadSerloImage: async (filePath) => {
    const { blob, type } = fileBlob(filePath);
    if (!type.startsWith("image/")) throw new Error(`Kein Bild: ${filePath}`);
    const q = new URLSearchParams({ mimeType: type, editorVariant: "unknown", parentHost: "teach.scobees.com" });
    const preUrl = `${SERLO_MEDIA_URL}/presigned-url?${q}`;
    const pre = await fetch(preUrl);
    if (!pre.ok) throw new Error(await uploadErrorMessage("Serlo presigned-url", preUrl, pre));
    const { signedUrl, fileUrl } = await pre.json();
    const put = await fetch(signedUrl, { method: "PUT", body: blob, headers: { "Content-Type": type } });
    if (!put.ok) throw new Error(await uploadErrorMessage("Bild-Upload zu Serlo", signedUrl, put));
    return fileUrl;
  },
};

module.exports = {
  api, request, assertAllowed, sanitize, lerninputForm, API_URL, BLOCKED, KNOWN_SCOBEES,
  uploadErrorMessage, maskUrl, SERLO_MEDIA_URL,
};
