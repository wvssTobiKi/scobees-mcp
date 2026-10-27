/**
 * serlo.js – Markdown ⇄ Serlo-Editor-Dokument
 *
 * scobees speichert „Interaktive Arbeitsblätter“ im Format des Serlo Editors
 * (https://github.com/serlo/frontend). Das Dokument ist ein Baum aus Bausteinen
 * {plugin, state, id}. Dieses Modul übersetzt ein praxisnahes Markdown in dieses Format
 * und kann umgekehrt ein Serlo-Dokument als lesbares Markdown ausgeben (für bestehende Kurse).
 *
 * Unterstütztes Markdown (siehe README „Markdown für Arbeitsblätter“):
 *   # Überschriften, Absätze, **fett**, *kursiv*, `code`, [Link](url), $Formel$
 *   - / * Aufzählung, 1. nummerierte Liste
 *   | Tabellen | (erste Zeile = Kopf)
 *   > Zitat/Hinweis-Box
 *   ```sprache  Codeblock  ```
 *   ![Bild](url)        Bild (Bildunterschrift = Alt-Text)
 *   Zeile nur mit URL:  geogebra.org → GeoGebra-Applet, youtube/vimeo/.mp4 → Video
 *   :::spoiler Titel … :::        aufklappbarer Bereich
 *   :::box typ Titel … :::        Box (typ: blank|example|quote|warning|attention|note|definition|theorem|proof)
 *   ```quiz-sc / ```quiz-mc       Single/Multiple Choice:  Frage, dann „- [x] richtig :: Feedback“ / „- [ ] falsch“
 *   ```quiz-input                 Zahleneingabe: Frage, dann „= 42“ (mehrere erlaubt), optional „unit: V“
 *   ```quiz-blanks / -dnd         Lückentext: Lücken als [[Antwort|Variante]], Distraktoren „+ falsch“
 *   ```quiz-text                  Freitextaufgabe
 *   ```math                       Gleichungskette (LaTeX): je Zeile „I = rac{U}{R} | Erklärung“;
 *                                 erste Zeile mit linker Seite, weitere dürfen mit „= …“ beginnen
 */

const crypto = require("crypto");
const uid = () => crypto.randomUUID();

// ── Bausteine ────────────────────────────────────────────────────────────────
const P = (plugin, state) => ({ plugin, state, id: uid() });
const text = (slate) => P("text", slate.length ? slate : [{ type: "p", children: [{ text: "" }] }]);
const textP = (str) => text([{ type: "p", children: inline(str) }]);
const rows = (items) => P("rows", items.length ? items : [textP("")]);

// ── Inline-Markdown → Slate-Knoten ───────────────────────────────────────────
function inline(src) {
  const out = [];
  let i = 0;
  let buf = "";
  const flush = () => { if (buf) { out.push({ text: buf }); buf = ""; } };
  const re = {
    link: /^\[([^\]]+)\]\(([^)\s]+)\)/,
    strong: /^\*\*(.+?)\*\*/,
    em: /^(?:\*(?!\s)(.+?)\*|_(.+?)_)/,
    code: /^`([^`]+)`/,
    math: /^\$([^$]+)\$/,
  };
  while (i < src.length) {
    const rest = src.slice(i);
    let m;
    if ((m = rest.match(re.link))) {
      flush();
      out.push({ type: "a", href: m[2], children: inline(m[1]) });
      i += m[0].length;
    } else if ((m = rest.match(re.strong))) {
      flush();
      for (const n of inline(m[1])) out.push("text" in n ? { ...n, strong: true } : n);
      i += m[0].length;
    } else if ((m = rest.match(re.em))) {
      flush();
      for (const n of inline(m[1] ?? m[2])) out.push("text" in n ? { ...n, em: true } : n);
      i += m[0].length;
    } else if ((m = rest.match(re.code))) {
      flush();
      out.push({ text: m[1], code: true });
      i += m[0].length;
    } else if ((m = rest.match(re.math))) {
      flush();
      out.push({ text: "" }, { type: "math", src: m[1].trim(), inline: true, children: [{ text: "" }] }, { text: "" });
      i += m[0].length;
    } else {
      buf += src[i++];
    }
  }
  flush();
  return out.length ? out : [{ text: "" }];
}

// ── Block-Parser ─────────────────────────────────────────────────────────────
const isTableLine = (l) => /^\s*\|.*\|\s*$/.test(l);
const isSepLine = (l) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
const isList = (l) => /^\s*([-*+]|\d+[.)])\s+/.test(l);
const isVideo = (u) => /youtube\.com|youtu\.be|vimeo\.com|\.mp4(\?|$)|\.webm(\?|$)/i.test(u);

function markdownToSerlo(md) {
  const lines = String(md || "").replace(/\r\n?/g, "\n").split("\n");
  return rows(parseBlocks(lines));
}

function parseBlocks(lines) {
  const items = [];
  let slate = []; // gesammelte Text-Knoten des aktuellen text-Bausteins
  const flushText = () => { if (slate.length) { items.push(text(slate)); slate = []; } };
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    if (!t) { i++; continue; }

    // Code-/Quiz-Fence
    let m = t.match(/^```\s*([\w-]*)\s*$/);
    if (m) {
      const lang = m[1].toLowerCase();
      const body = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) body.push(lines[i++]);
      i++; // schließende Fence
      flushText();
      items.push(fenceToPlugin(lang, body));
      continue;
    }

    // Container :::spoiler / :::box
    m = t.match(/^:::\s*(spoiler|box)\s*(\S+)?\s*(.*)$/i); // \S statt \w: Umlaute im Titel
    if (m) {
      const kind = m[1].toLowerCase();
      const body = [];
      let depth = 1;
      i++;
      while (i < lines.length) {
        const l = lines[i].trim();
        if (/^:::\s*(spoiler|box)/i.test(l)) depth++;
        else if (l === ":::") { depth--; if (depth === 0) break; }
        body.push(lines[i]);
        i++;
      }
      i++;
      flushText();
      const inner = rows(parseBlocks(body));
      const rest = [m[2], m[3]].filter(Boolean).join(" ");
      if (kind === "spoiler") {
        items.push(P("spoiler", { richTitle: textP(rest || "Mehr anzeigen"), content: inner }));
      } else {
        const BOX = ["blank", "example", "quote", "warning", "attention", "note", "definition", "theorem", "proof"];
        const type = BOX.includes((m[2] || "").toLowerCase()) ? m[2].toLowerCase() : "note";
        const title = BOX.includes((m[2] || "").toLowerCase()) ? m[3] : rest;
        items.push(P("box", { type, title: textP(title || ""), anchorId: "", content: inner }));
      }
      continue;
    }

    // Überschrift
    m = t.match(/^(#{1,6})\s+(.*)$/);
    if (m) {
      slate.push({ type: "h", level: Math.min(m[1].length, 3), children: inline(m[2]) });
      i++;
      continue;
    }

    // Bild
    m = t.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (m) {
      flushText();
      items.push(P("image", { src: m[2], caption: textP(m[1] || "") }));
      i++;
      continue;
    }

    // Reine URL-Zeile → GeoGebra / Video / Link
    if (/^https?:\/\/\S+$/.test(t)) {
      if (/geogebra\.org/i.test(t)) { flushText(); items.push(P("geogebra", t)); }
      else if (isVideo(t)) { flushText(); items.push(P("video", { src: t, alt: "" })); }
      else slate.push({ type: "p", children: [{ type: "a", href: t, children: [{ text: t }] }] });
      i++;
      continue;
    }

    // Tabelle
    if (isTableLine(t) && i + 1 < lines.length && isSepLine(lines[i + 1])) {
      const tbl = [];
      while (i < lines.length && isTableLine(lines[i].trim())) { tbl.push(lines[i].trim()); i++; }
      flushText();
      const cells = (l) => l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const rowsOut = tbl.filter((l, idx) => idx !== 1 || !isSepLine(l)).map((l) => ({ columns: cells(l).map((c) => ({ content: textP(c) })) }));
      items.push(P("serloTable", { rows: rowsOut, tableType: "OnlyColumnHeader" }));
      continue;
    }

    // Zitat → Box
    if (t.startsWith(">")) {
      const body = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) { body.push(lines[i].trim().replace(/^>\s?/, "")); i++; }
      flushText();
      items.push(P("box", { type: "quote", title: textP(""), anchorId: "", content: rows(parseBlocks(body)) }));
      continue;
    }

    // Liste
    if (isList(t)) {
      const ordered = /^\d/.test(t);
      const li = [];
      while (i < lines.length && isList(lines[i].trim())) {
        li.push(lines[i].trim().replace(/^([-*+]|\d+[.)])\s+/, ""));
        i++;
      }
      slate.push({
        type: ordered ? "ordered-list" : "unordered-list",
        children: li.map((s) => ({ type: "list-item", children: [{ type: "list-item-child", children: inline(s) }] })),
      });
      continue;
    }

    // Absatz (bis Leerzeile oder Blockstart)
    const para = [];
    while (i < lines.length) {
      const l = lines[i].trim();
      if (!l || /^(```|:::|#{1,6}\s|!\[|>|\|)/.test(l) || isList(l)) break;
      para.push(l);
      i++;
    }
    slate.push({ type: "p", children: inline(para.join(" ")) });
  }
  flushText();
  return items;
}

// ── Fences: Code & Quiz ──────────────────────────────────────────────────────
function fenceToPlugin(lang, body) {
  const code = body.join("\n");
  if (lang === "quiz-sc" || lang === "quiz-mc") return choiceExercise(body, lang === "quiz-sc");
  if (lang === "quiz-input") return inputExercise(body);
  if (lang === "quiz-blanks" || lang === "quiz-blanks-dnd") return blanksExercise(body, lang.endsWith("dnd"));
  if (lang === "quiz-text") return P("exercise", { content: rows(parseBlocks(body)), interactive: P("textAreaExercise", {}) });
  if (lang === "math") return equations(body);
  return P("highlight", { code, language: lang || "text", showLineNumbers: true });
}

// ```math → Serlo-Baustein „equations“ (mehrzeilige, ausgerichtete Gleichungskette)
const SIGNS = [["<=", "less-than-or-equal"], [">=", "greater-than-or-equal"], ["≤", "less-than-or-equal"], ["≥", "greater-than-or-equal"],
  ["≠", "not-equal-to"], ["≈", "almost-equal-to"], ["=", "equals"], ["<", "less-than"], [">", "greater-than"]];
function equations(body) {
  const steps = [];
  for (const raw of body) {
    if (!raw.trim()) continue;
    const [expr, ...expl] = raw.split("|");
    let left = "", sign = "equals", right = expr.trim();
    for (const [sym, name] of SIGNS) {
      const idx = expr.indexOf(sym);
      if (idx >= 0) { left = expr.slice(0, idx).trim(); sign = name; right = expr.slice(idx + sym.length).trim(); break; }
    }
    steps.push({ left, sign, right, transform: "", explanation: text(expl.length ? [{ type: "p", children: inline(expl.join("|").trim()) }] : []) });
  }
  return P("equations", { steps, firstExplanation: text([]), transformationTarget: "equation" });
}

function splitQuestion(body, answerRe) {
  const q = [], a = [];
  for (const l of body) (answerRe.test(l.trim()) ? a : q).push(l);
  return { question: rows(parseBlocks(q)), answers: a.map((l) => l.trim()) };
}

function choiceExercise(body, single) {
  const { question, answers } = splitQuestion(body, /^- \[[ xX]\]/);
  const parsed = answers.map((l) => {
    const m = l.match(/^- \[([ xX])\]\s*(.*?)(?:\s*::\s*(.*))?$/);
    return { isCorrect: m[1].toLowerCase() === "x", content: textP(m[2]), feedback: textP(m[3] || "") };
  });
  if (!parsed.length) throw new Error("quiz-sc/quiz-mc: keine Antworten im Format „- [x] Antwort“ gefunden.");
  return P("exercise", { content: question, interactive: P("scMcExercise", { isSingleChoice: single, answers: parsed }) });
}

function inputExercise(body) {
  let unit = "";
  const rest = body.filter((l) => { const m = l.trim().match(/^unit:\s*(.*)$/i); if (m) { unit = m[1]; return false; } return true; });
  const { question, answers } = splitQuestion(rest, /^=\s*/);
  const parsed = answers.map((l) => {
    const m = l.match(/^=\s*(.*?)(?:\s*::\s*(.*))?$/);
    return { value: m[1], isCorrect: true, feedback: textP(m[2] || "") };
  });
  if (!parsed.length) throw new Error("quiz-input: keine Lösung im Format „= 42“ gefunden.");
  const numeric = parsed.every((a) => /^-?[\d.,]+$/.test(a.value));
  return P("exercise", {
    content: question,
    interactive: P("inputExercise", { type: numeric ? "input-number-exact-match-challenge" : "input-string-normalized-match-challenge", unit, answers: parsed }),
  });
}

function blanksExercise(body, dnd) {
  const extra = [];
  const textLines = body.filter((l) => { const m = l.trim().match(/^\+\s+(.*)$/); if (m) { extra.push({ answer: m[1] }); return false; } return true; });
  const src = textLines.join("\n");
  // [[Antwort|Variante]] → textBlank-Knoten
  const slateParas = src.split(/\n\s*\n/).map((para) => {
    const children = [];
    let last = 0;
    const re = /\[\[([^\]]+)\]\]/g;
    let m;
    while ((m = re.exec(para))) {
      children.push(...inline(para.slice(last, m.index)));
      children.push({
        type: "textBlank", blankId: uid(), children: [{ text: "" }],
        correctAnswers: m[1].split("|").map((a) => ({ answer: a.trim() })), acceptMathEquivalents: true,
      });
      last = m.index + m[0].length;
    }
    children.push(...inline(para.slice(last)));
    return { type: "p", children };
  });
  if (!/\[\[/.test(src)) throw new Error("quiz-blanks: keine Lücke im Format [[Antwort]] gefunden.");
  const state = { text: text(slateParas), mode: dnd ? "drag-and-drop" : "typing" };
  if (dnd && extra.length) state.extraDraggableAnswers = extra;
  return P("exercise", { content: rows([]), interactive: P("blanksExercise", state) });
}

// ── Serlo → Markdown (zum Lesen bestehender Aufgaben) ────────────────────────
function slateToMd(nodes) {
  const inl = (ch) => (ch || []).map((n) => {
    if (n.type === "a") return `[${inl(n.children)}](${n.href})`;
    if (n.type === "math") return `$${n.src}$`;
    if (n.type === "textBlank") return `[[${(n.correctAnswers || []).map((a) => a.answer).join("|")}]]`;
    let s = n.text ?? inl(n.children);
    if (n.code) s = `\`${s}\``;
    if (n.strong) s = `**${s}**`;
    if (n.em) s = `*${s}*`;
    return s;
  }).join("");
  return (nodes || []).map((b) => {
    if (b.type === "h") return `${"#".repeat(b.level || 2)} ${inl(b.children)}`;
    if (b.type === "ordered-list" || b.type === "unordered-list")
      return (b.children || []).map((li, k) => `${b.type === "ordered-list" ? `${k + 1}.` : "-"} ${inl(li.children?.[0]?.children || li.children)}`).join("\n");
    return inl(b.children);
  }).filter((s) => s !== "").join("\n\n");
}

function serloToMarkdown(doc) {
  if (!doc) return "";
  if (typeof doc === "string") { try { doc = JSON.parse(doc); } catch { return doc; } }
  const walk = (node) => {
    if (!node || typeof node !== "object") return "";
    const s = node.state;
    switch (node.plugin) {
      case "rows": return (s || []).map(walk).filter(Boolean).join("\n\n");
      case "text": return slateToMd(s);
      case "image": return `![${walk(s.caption)}](${s.src})`;
      case "multimedia": return [walk(s.explanation), walk(s.multimedia)].filter(Boolean).join("\n\n");
      case "box": return `:::box ${s.type} ${walk(s.title)}\n${walk(s.content)}\n:::`;
      case "spoiler": return `:::spoiler ${walk(s.richTitle)}\n${walk(s.content)}\n:::`;
      case "highlight": return "```" + (s.language || "") + "\n" + s.code + "\n```";
      case "geogebra": return String(s);
      case "video": return s.src || "";
      case "interactiveVideo": return walk(s.video);
      case "serloTable": {
        const r = (s.rows || []).map((row) => "| " + row.columns.map((c) => walk(c.content).replace(/\n/g, " ")).join(" | ") + " |");
        if (r.length) r.splice(1, 0, "|" + " --- |".repeat(s.rows[0].columns.length));
        return r.join("\n");
      }
      case "equations": {
        const sym = Object.fromEntries(SIGNS.map(([a, b]) => [b, a]));
        return "```math\n" + (s.steps || []).map((st) => {
          const e = walk(st.explanation).trim();
          return `${st.left ? st.left + " " : ""}${sym[st.sign] || "="} ${st.right}${e ? " | " + e : ""}`;
        }).join("\n") + "\n```";
      }
      case "exercise": {
        const q = walk(s.content);
        const it = s.interactive || {};
        const is = it.state || {};
        if (it.plugin === "scMcExercise")
          return "```" + (is.isSingleChoice ? "quiz-sc" : "quiz-mc") + "\n" + q + "\n" +
            (is.answers || []).map((a) => `- [${a.isCorrect ? "x" : " "}] ${walk(a.content)}${walk(a.feedback) ? " :: " + walk(a.feedback) : ""}`).join("\n") + "\n```";
        if (it.plugin === "inputExercise")
          return "```quiz-input\n" + q + (is.unit ? `\nunit: ${is.unit}` : "") + "\n" + (is.answers || []).map((a) => `= ${a.value}`).join("\n") + "\n```";
        if (it.plugin === "blanksExercise")
          return "```quiz-blanks" + (is.mode === "drag-and-drop" ? "-dnd" : "") + "\n" + [q, walk(is.text)].filter(Boolean).join("\n") +
            (is.extraDraggableAnswers || []).map((e) => `\n+ ${e.answer}`).join("") + "\n```";
        if (it.plugin === "textAreaExercise") return "```quiz-text\n" + q + "\n```";
        return `${q}\n(interaktiver Baustein: ${it.plugin})`;
      }
      default: return `(Baustein ${node.plugin})`;
    }
  };
  return walk(doc);
}

/** Alle Plugin-Namen eines Dokuments (für Übersichten). */
function listPlugins(doc) {
  const set = new Set();
  const walk = (x) => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === "object") { if (x.plugin) set.add(x.plugin); Object.values(x).forEach(walk); } };
  walk(doc);
  return [...set];
}

module.exports = { markdownToSerlo, serloToMarkdown, listPlugins, inline };
