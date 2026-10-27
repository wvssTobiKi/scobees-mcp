const test = require("node:test");
const assert = require("node:assert/strict");
const { markdownToSerlo, serloToMarkdown, listPlugins } = require("../src/serlo");
const beispiel = require("../docs/serlo-beispiel.json");

const md = `# Einleitung

Das ist **fett**, *kursiv*, \`code\` und ein [Link](https://wvss.de) mit $a=\\frac{c}{d}$.

- Punkt eins
- Punkt zwei

1. erstens
2. zweitens

| Kopf A | Kopf B |
| --- | --- |
| 1 | 2 |

> Merke: Das ist wichtig.

\`\`\`cpp
void loop() {}
\`\`\`

![Ein Bild](https://example.org/bild.png)

https://www.geogebra.org/m/uSRfSJNB

:::spoiler Lösung
Hier steht die Lösung.
:::

:::box warning Achtung
Vorsicht Spannung!
:::

\`\`\`quiz-sc
Was ist 1+1?
- [x] 2 :: Richtig!
- [ ] 3
\`\`\`

\`\`\`quiz-mc
Welche sind Primzahlen?
- [x] 2
- [x] 3
- [ ] 4
\`\`\`

\`\`\`quiz-input
Wie viel ist 6*7?
unit: Stück
= 42
\`\`\`

\`\`\`quiz-blanks-dnd
Der Strom wird in [[Ampere|A]] gemessen.
+ Volt
\`\`\`

\`\`\`quiz-text
Beschreibe den Bootvorgang.
\`\`\`
`;

test("Markdown → Serlo erzeugt alle erwarteten Bausteine", () => {
  const doc = markdownToSerlo(md);
  assert.equal(doc.plugin, "rows");
  const plugins = listPlugins(doc);
  for (const p of ["text", "serloTable", "box", "highlight", "image", "geogebra", "spoiler", "exercise", "scMcExercise", "inputExercise", "blanksExercise", "textAreaExercise"]) {
    assert.ok(plugins.includes(p), `Plugin fehlt: ${p}`);
  }
  // Jeder Baustein hat eine id
  const walk = (x) => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === "object") { if (x.plugin) assert.match(x.id, /^[0-9a-f-]{36}$/); Object.values(x).forEach(walk); } };
  walk(doc);
});

test("Inline-Formatierung", () => {
  const doc = markdownToSerlo("Das ist **fett** und *kursiv* und `code`.");
  const p = doc.state[0].state[0];
  assert.equal(p.type, "p");
  assert.deepEqual(p.children.find((c) => c.strong), { text: "fett", strong: true });
  assert.deepEqual(p.children.find((c) => c.em), { text: "kursiv", em: true });
  assert.deepEqual(p.children.find((c) => c.code), { text: "code", code: true });
});

test("Single Choice mit Feedback", () => {
  const doc = markdownToSerlo("```quiz-sc\nFrage?\n- [x] ja :: super\n- [ ] nein\n```");
  const ex = doc.state[0];
  assert.equal(ex.plugin, "exercise");
  const sc = ex.state.interactive.state;
  assert.equal(sc.isSingleChoice, true);
  assert.equal(sc.answers.length, 2);
  assert.equal(sc.answers[0].isCorrect, true);
  assert.equal(sc.answers[0].feedback.state[0].children[0].text, "super");
});

test("Lückentext mit Varianten und Distraktor", () => {
  const doc = markdownToSerlo("```quiz-blanks-dnd\nStrom in [[Ampere|A]].\n+ Volt\n```");
  const st = doc.state[0].state.interactive.state;
  assert.equal(st.mode, "drag-and-drop");
  assert.deepEqual(st.extraDraggableAnswers, [{ answer: "Volt" }]);
  const blank = st.text.state[0].children.find((c) => c.type === "textBlank");
  assert.deepEqual(blank.correctAnswers, [{ answer: "Ampere" }, { answer: "A" }]);
});

test("Tabelle", () => {
  const doc = markdownToSerlo("| A | B |\n|---|---|\n| 1 | 2 |");
  const t = doc.state[0];
  assert.equal(t.plugin, "serloTable");
  assert.equal(t.state.rows.length, 2);
  assert.equal(t.state.rows[1].columns[1].content.state[0].children[0].text, "2");
});

test("Serlo → Markdown liest das Beispiel aus scobees", () => {
  const out = serloToMarkdown(beispiel);
  assert.match(out, /quiz-sc/);
  assert.match(out, /quiz-mc/);
  assert.match(out, /quiz-blanks/);
  assert.match(out, /Antwort A/);
  assert.match(out, /:::spoiler/);
  assert.match(out, /\| Zelle 1 \|/);
});

test("Roundtrip: Markdown → Serlo → Markdown bleibt inhaltlich stabil", () => {
  const src = "## Titel\n\nText mit **fett**.\n\n- a\n- b\n\n```quiz-sc\nF?\n- [x] ja\n- [ ] nein\n```";
  const back = serloToMarkdown(markdownToSerlo(src));
  assert.match(back, /## Titel/);
  assert.match(back, /\*\*fett\*\*/);
  assert.match(back, /- a\n- b/);
  assert.match(back, /- \[x\] ja/);
});

test("Spoiler- und Box-Titel mit Umlauten bleiben erhalten", () => {
  const doc = markdownToSerlo(":::spoiler Lösungsweg\nText\n:::\n\n:::box warning Äußerste Vorsicht\nText\n:::");
  const md = serloToMarkdown(doc);
  assert.match(md, /:::spoiler Lösungsweg/);
  assert.match(md, /:::box warning Äußerste Vorsicht/);
});

test("```math wird zum equations-Baustein und zurück", () => {
  const md = ["```math", "| Einleitung", "I = \\frac{U}{R} | Ohmsches Gesetz umstellen", "= \\frac{12\\,\\text{V}}{4\\,\\Omega}", "= 3\\,\\text{A}", "```"].join("\n");
  const doc = markdownToSerlo(md);
  const eq = doc.state[0];
  assert.equal(eq.plugin, "equations");
  assert.equal(eq.state.steps.length, 3);
  assert.equal(eq.state.steps[0].left, "I");
  assert.equal(eq.state.steps[0].sign, "equals");
  assert.equal(eq.state.steps[1].left, "");
  assert.equal(eq.state.firstExplanation.state[0].children[0].text, "Einleitung");
  assert.equal(serloToMarkdown(doc), md);
});
