/**
 * auth.js – Anmeldung bei scobees über Keycloak (OpenID Connect, Authorization Code + PKCE)
 *
 * Die Lehrer-App (teach.scobees.com) ist ein öffentlicher Keycloak-Client ohne Secret.
 * Wir bilden den Browser-Login nach:
 *   1. GET  /protocol/openid-connect/auth  → Keycloak-Loginseite (HTML-Formular + Cookies)
 *   2. POST Formular-Action mit Benutzername/Passwort → 302 auf redirect_uri#code=…
 *   3. POST /protocol/openid-connect/token (authorization_code + code_verifier) → access/refresh token
 * Danach wird nur noch das Refresh-Token benutzt; Tokens liegen lokal in einer Datei (nur Nutzer lesbar).
 *
 * Konfiguration über Umgebungsvariablen:
 *   SCOBEES_USERNAME, SCOBEES_PASSWORD  – scobees-Lehrkraft-Login (kein SSO)
 *   SCOBEES_TOKEN_FILE                  – optional, Standard: ~/.scobees-mcp/tokens.json
 *   SCOBEES_REFRESH_TOKEN               – optional, Einstieg ohne Passwort (z. B. bei SSO-Konten)
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const AUTH_URL = process.env.SCOBEES_AUTH_URL || "https://auth.scobees.com";
const REALM = process.env.SCOBEES_REALM || "scobees";
const CLIENT_ID = process.env.SCOBEES_CLIENT_ID || "scobees-teachers-app";
const REDIRECT_URI = process.env.SCOBEES_REDIRECT_URI || "https://teach.scobees.com/home";
const TOKEN_FILE =
  process.env.SCOBEES_TOKEN_FILE || path.join(os.homedir(), ".scobees-mcp", "tokens.json");

const base = () => `${AUTH_URL}/realms/${encodeURIComponent(REALM)}/protocol/openid-connect`;

// ── Token-Datei ──────────────────────────────────────────────────────────────
function loadTokens() {
  try {
    return JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
  } catch {
    return null;
  }
}

function saveTokens(t) {
  fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true, mode: 0o700 });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(t, null, 2), { mode: 0o600 });
}

function clearTokens() {
  try { fs.unlinkSync(TOKEN_FILE); } catch {}
}

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────
const b64url = (buf) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function pkce() {
  const verifier = b64url(crypto.randomBytes(48));
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

/** Set-Cookie-Header einer Antwort in einen Cookie-String für die nächste Anfrage verwandeln. */
function cookieJar(res, jar = {}) {
  const raw = typeof res.headers.getSetCookie === "function"
    ? res.headers.getSetCookie()
    : [res.headers.get("set-cookie")].filter(Boolean);
  for (const c of raw) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    if (i > 0) jar[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
  }
  return jar;
}
const cookieHeader = (jar) => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");

function decodeJwtExp(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return (payload.exp || 0) * 1000;
  } catch {
    return 0;
  }
}

async function tokenRequest(params) {
  const res = await fetch(`${base()}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...params }).toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Keycloak-Token-Fehler (${res.status}): ${data.error_description || data.error || "unbekannt"}`);
  }
  const now = Date.now();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: decodeJwtExp(data.access_token) || now + (data.expires_in || 300) * 1000,
    refresh_expires_at: data.refresh_expires_in ? now + data.refresh_expires_in * 1000 : 0,
    obtained_at: now,
  };
}

// ── Login mit Benutzername/Passwort (Keycloak-Formular) ──────────────────────
async function loginWithPassword(username, password) {
  const { verifier, challenge } = pkce();
  const state = crypto.randomUUID();
  const authUrl = `${base()}/auth?` + new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state,
    response_mode: "fragment",
    response_type: "code",
    scope: "openid",
    nonce: crypto.randomUUID(),
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  // 1. Loginseite holen
  const page = await fetch(authUrl, { redirect: "manual" });
  const jar = cookieJar(page);
  const html = await page.text();
  const m = html.match(/<form[^>]+id="kc-form-login"[^>]+action="([^"]+)"/) || html.match(/action="([^"]+login-actions\/authenticate[^"]*)"/);
  if (!m) {
    throw new Error("Keycloak-Loginformular nicht gefunden – hat sich die Anmeldeseite geändert?");
  }
  const action = m[1].replace(/&amp;/g, "&");

  // 2. Formular absenden
  const post = await fetch(action, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(jar),
    },
    body: new URLSearchParams({ username, password, credentialId: "" }).toString(),
  });
  const location = post.headers.get("location") || "";
  if (!location.startsWith(REDIRECT_URI)) {
    const body = await post.text().catch(() => "");
    const hint = /invalid|ungültig|falsch/i.test(body) ? "Benutzername oder Passwort falsch." : `HTTP ${post.status}`;
    throw new Error(`Anmeldung fehlgeschlagen: ${hint}`);
  }
  const frag = new URLSearchParams(location.split("#")[1] || "");
  const code = frag.get("code");
  if (!code || frag.get("state") !== state) {
    throw new Error("Anmeldung: kein gültiger Authorization-Code erhalten.");
  }

  // 3. Code gegen Tokens tauschen
  const tokens = await tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });
  saveTokens(tokens);
  return tokens;
}

async function refresh(tokens) {
  const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: tokens.refresh_token });
  saveTokens(t);
  return t;
}

/**
 * Liefert ein gültiges Access-Token. Reihenfolge:
 * gespeichertes Token → Refresh → SCOBEES_REFRESH_TOKEN → Benutzername/Passwort.
 */
let inflight = null;
async function getAccessToken() {
  if (inflight) return inflight;
  inflight = (async () => {
    let tokens = loadTokens();
    if (tokens && tokens.access_token && tokens.expires_at - Date.now() > 30_000) {
      return tokens.access_token;
    }
    if (tokens && tokens.refresh_token) {
      try {
        return (await refresh(tokens)).access_token;
      } catch (e) {
        process.stderr.write(`[scobees-mcp] Token-Refresh fehlgeschlagen, melde neu an: ${e.message}\n`);
        clearTokens();
      }
    }
    if (process.env.SCOBEES_REFRESH_TOKEN) {
      return (await refresh({ refresh_token: process.env.SCOBEES_REFRESH_TOKEN })).access_token;
    }
    const u = process.env.SCOBEES_USERNAME, p = process.env.SCOBEES_PASSWORD;
    if (!u || !p) {
      throw new Error(
        "Nicht angemeldet. Bitte SCOBEES_USERNAME und SCOBEES_PASSWORD setzen (Extension-Einstellungen) " +
        "oder einmalig `node src/server.js --login` ausführen."
      );
    }
    return (await loginWithPassword(u, p)).access_token;
  })().finally(() => { inflight = null; });
  return inflight;
}

module.exports = { getAccessToken, loginWithPassword, loadTokens, clearTokens, TOKEN_FILE };
