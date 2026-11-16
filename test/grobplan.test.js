// Vorlage des Grobplans (skills/scobees-lernpfad/assets/grobplan.html): Sie muss mit dem Beispielplan
// laufen und eine Theorie-Aufgabe ohne Angabe zum interaktiven Element sichtbar machen.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const A = path.join(__dirname, "..", "skills", "scobees-lernpfad", "assets");
const beispiel = () => JSON.parse(fs.readFileSync(path.join(A, "beispiel-grobplan.json"), "utf8"));

function render(plan) {
  const html = fs.readFileSync(path.join(A, "grobplan.html"), "utf8");
  const js = html
    .slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"))
    .replace("__PLAN_JSON__", () => JSON.stringify(plan));
  const el = {};
  new Function("document", js)({ getElementById: () => el });
  return el.innerHTML;
}

test("Grobplan: Beispielplan läuft durch, jede Theorie-Aufgabe hat ein Prüfergebnis", () => {
  const out = render(beispiel());
  assert.match(out, /◆ HTML-Simulation in 3\.2/);
  assert.match(out, /ohne interaktives Element: /);
  assert.match(out, /jede Theorie versorgt|× Theorie ohne/);
  assert.doesNotMatch(out, /Prüfung auf ein interaktives Element fehlt/);
  assert.doesNotMatch(out, /nicht freigabefähig/);
});

test("Grobplan: Theorie-Aufgabe ohne Angabe wird rot markiert und sperrt die Freigabe", () => {
  const plan = beispiel();
  delete plan.gliederungen[0].aufgaben[0].ohne_interaktiv;
  const out = render(plan);
  assert.match(out, /Prüfung auf ein interaktives Element fehlt/);
  assert.match(out, /Bei 2\.1 fehlt die Prüfung/);
  assert.match(out, /nicht freigabefähig/);
  assert.match(out, /1× Theorie ungeprüft/);
});

test("Grobplan: Aufgaben ohne Theorie-Marke brauchen keine Angabe; im Bericht steht kein Freigabe-Vermerk", () => {
  const plan = beispiel();
  // 5.1 (Training mit Stift-Abgabe) und 6.2 (Extra mit Zahleneingabe) tragen keine Angabe
  assert.doesNotMatch(render(plan), /Prüfung auf ein interaktives Element fehlt/);
  delete plan.gliederungen[0].aufgaben[0].ohne_interaktiv;
  plan.modus = "bericht";
  const out = render(plan);
  assert.match(out, /Prüfung auf ein interaktives Element fehlt/);
  assert.doesNotMatch(out, /nicht freigabefähig/);
});
