// Mitschnitt-Hook für teach.scobees.com
// In der Browser-Konsole (oder per Claude-Browser-Pane javascript_tool) auf der scobees-Seite ausführen,
// dann die gewünschte Funktion in der Oberfläche durchklicken – Seite NICHT neu laden.
// Auslesen: window.__mcp  (Array mit {t, method, url, status, body, response}).
// Sperrliste: Aufrufe mit Schüler-/Personendaten werden sofort geschwärzt und nie gespeichert.
// Authorization-Header und Cookies werden grundsätzlich nicht erfasst.
(() => {
  if (window.__mcp) return "Hook bereits aktiv, " + window.__mcp.length + " Einträge";
  const BLOCK = /students|users(?!\/me)|teachers|solutions|lernergebnisse|learncoaching|reflections|notes|learn-levels|exam|certificate|checkins|attendance|timetables|invitations|teacher-dashboard|learnplanning|assignments|subject-assessments|gelingensnachweis|impersonation|school-classes|school-groups/i;
  window.__mcp = [];
  const MAX = 3_000_000;
  const cut = (s) => (typeof s === "string" && s.length > MAX ? s.slice(0, MAX) + "…[gekürzt]" : s);
  const ser = (b) => {
    if (!b) return null;
    if (b instanceof FormData) {
      const o = {};
      for (const [k, v] of b.entries()) o[k] = v instanceof File ? `<File ${v.name} ${v.type} ${v.size}B>` : v;
      return { formData: o };
    }
    if (typeof b === "string") return cut(b);
    if (b instanceof Blob) return `<Blob ${b.type} ${b.size}B>`;
    return String(b);
  };
  const push = (e) => {
    if (BLOCK.test(e.url)) e.body = e.response = "[GESPERRT – Schülerdaten]";
    window.__mcp.push(e);
  };
  const of = window.fetch;
  window.fetch = async function (input, init = {}) {
    const url = typeof input === "string" ? input : input.url;
    const e = { t: Date.now(), method: (init.method || input.method || "GET").toUpperCase(), url, body: ser(init.body) };
    const res = await of.apply(this, arguments);
    try { const c = res.clone(); e.status = c.status; e.response = cut(await c.text()); } catch (x) { e.response = "<" + x + ">"; }
    if (/platform-api|scobees|serlo/.test(url)) push(e);
    return res;
  };
  const oo = XMLHttpRequest.prototype.open, os = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) { this.__e = { t: Date.now(), method: m.toUpperCase(), url: u }; return oo.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function (b) {
    const e = this.__e;
    if (e) {
      e.body = ser(b);
      this.addEventListener("loadend", () => {
        e.status = this.status;
        try { e.response = cut(this.responseText); } catch { e.response = "<binary>"; }
        if (/platform-api|scobees|serlo/.test(e.url)) push(e);
      });
    }
    return os.apply(this, arguments);
  };
  return "Hook installiert";
})();

// Kompakte Übersicht aller Schreibzugriffe:
// window.__mcp.filter(e => e.method !== "GET").map((e,i) => `${i} ${e.method} ${e.status} ${e.url}`).join("\n")
