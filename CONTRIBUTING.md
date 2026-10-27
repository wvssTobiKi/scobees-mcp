# Mitarbeit und Erweiterung

Dieses Projekt bildet eine **inoffizielle** Schnittstelle nach (die Aufrufe der Weboberfläche teach.scobees.com). Jede Änderung an scobees kann einzelne Werkzeuge brechen. Dieses Dokument beschreibt, wie man das Projekt erweitert und repariert, ohne jedes Mal bei null anzufangen.

## Aufbau

```
src/
  auth.js    Anmeldung (Keycloak), Token-Verwaltung – ändert sich selten
  api.js     HTTP-Client, Sperrliste, Namensfilter, Formularkodierung, alle API-Aufrufe
  serlo.js   Markdown ⇄ Serlo-Editor-Dokument (interaktive Arbeitsblätter)
  tools.js   Die MCP-Werkzeuge (Beschreibung + Eingabeschema + run)
  server.js  MCP-stdio-Protokoll, CLI (--login, --tools)
test/        node --test, ohne Netzwerk lauffähig
docs/
  scobees-api-map.md   Schnittstellenkarte: jede beobachtete Anfrage mit Feldern, Stolperfallen, offene Punkte
  serlo-beispiel.json  Vollständiges Arbeitsblatt aus dem Editor als Referenz für alle Bausteine
manifest.json          Paketbeschreibung für Claude Desktop (.mcpb)
```

Grundregel: **Ein Werkzeug = ein fachlicher Schritt** aus Sicht einer Lehrkraft (Lernpfad anlegen, Aufgabe ändern, Bild hochladen). Die API-Details bleiben in `api.js`, die Werkzeuge in `tools.js` bleiben lesbar.

## Grundsätze, die nicht verhandelbar sind

1. **Keine Schülerdaten.** Die Sperrliste `BLOCKED` in `src/api.js` wird nur erweitert, nie verkürzt. Neue Aufrufe, die Personen betreffen (users, students, teachers, classes, groups, assignments, solutions, Lernstände), werden nicht eingebaut – auch nicht „nur lesend“.
2. **Verwaltung bleibt beim Administrator.** Lernbereiche und Fächer werden gelesen, nicht geschrieben.
3. **Nichts erreicht Lernende ohne Lehrkraft-Handlung.** Die Zuweisung an Lerngruppen erfolgt ausschließlich in der Weboberfläche.
4. **Zugangsdaten** werden nie im Code, in Tests, in Issues oder in Mitschnitten abgelegt. Mitschnitte vor dem Einchecken schwärzen (Authorization-Header, Cookies, Personen).

## Ein neues Werkzeug einbauen (oder ein kaputtes reparieren)

Die Methode, mit der das Projekt entstanden ist, funktioniert auch für jede Erweiterung:

1. **Mitschneiden.** scobees im Browser öffnen (Claude Desktop: Browser-Pane), einen Hook auf `fetch`/`XMLHttpRequest` setzen (Vorlage in `docs/scobees-api-map.md`, Abschnitt „Methode“) und die gewünschte Funktion in der Oberfläche einmal durchklicken. Die Seite dabei nicht neu laden.
2. **Dokumentieren.** Die beobachteten Anfragen als neue „Mitschrift n“ in `docs/scobees-api-map.md` eintragen: Methode, Pfad, Felder (mit Kodierung – Lerninput-Formulare sind multipart mit JSON-kodierten Feldern), Antwort, Besonderheiten.
3. **Client-Aufruf** in `src/api.js` ergänzen (`api.xyz = …`). Pfad gegen die Sperrliste prüfen (`assertAllowed` wirft bei Treffern).
4. **Werkzeug** in `src/tools.js` ergänzen: deutscher Name mit Präfix `scobees_`, verständliche Beschreibung (Claude liest sie – sie entscheidet, ob das Werkzeug richtig benutzt wird), Eingabeschema, `run`. Rückgabe über `ok(hinweis, daten)`.
5. **Test** in `test/`: Alles, was ohne Netz prüfbar ist (Konverter, Sperrliste, Formularkodierung), wird getestet. Live-Tests laufen gegen den Testpfad (siehe README) und werden im Commit-Text beschrieben.
6. **Live prüfen** – auch im Editor der Weboberfläche, nicht nur in der Schüleransicht (der Editor ist strenger, siehe „Stolperfallen“ in der API-Karte).
7. `CHANGELOG.md` ergänzen (inkl. Zeile in der Tabelle „Kompatibilität“: scobees-Version unten rechts in der Oberfläche, Bundle-Name aus `scobees_me`), `KNOWN_SCOBEES` in `src/api.js` auf den geprüften Stand setzen, Version in `package.json` und `manifest.json` anheben, `.mcpb` neu bauen (`npm run pack`).

## Wenn scobees sich geändert hat

Symptome: HTTP 400/404/422 aus `api.js`, leere Antworten, Editor-Fehler bei Arbeitsblättern. Vorgehen:

1. Ein Issue mit der Vorlage „scobees-Änderung“ anlegen (Werkzeug, Fehlermeldung, scobees-Version – steht unten rechts in der Oberfläche, z. B. v93.3).
2. Die betroffene Funktion in der Oberfläche neu mitschneiden (Schritt 1 oben) und mit der Mitschrift in der API-Karte vergleichen.
3. Abweichung in `api.js`/`tools.js` nachziehen, Mitschrift aktualisieren (alte Form durchgestrichen lassen, mit Datum), Version anheben.

## Arbeitsblätter (Serlo-Format) erweitern

Neue Bausteine entstehen immer aus einem echten Beispiel: Den Baustein im Editor anlegen, speichern, das Dokument per `scobees_get_aufgabe` mit `mit_serlo_json: true` holen und die Struktur in `docs/serlo-beispiel.json` oder in die API-Karte übernehmen. Dann in `serlo.js` den Hinweg (`parseBlocks`/`fenceToPlugin`) **und** den Rückweg (`serloToMarkdown`) ergänzen und einen Round-Trip-Test schreiben.

## Versionierung

- `MAJOR.MINOR.PATCH`: PATCH für Reparaturen nach scobees-Änderungen, MINOR für neue Werkzeuge, MAJOR bei geänderten Werkzeugnamen oder -parametern (bricht bestehende Skills).
- Release = Git-Tag `vX.Y.Z` pushen. Der Workflow `release.yml` prüft, dass Tag, `package.json` und `manifest.json` dieselbe Version tragen, baut die `.mcpb` und hängt sie mit dem passenden CHANGELOG-Abschnitt an ein GitHub-Release. Nichts von Hand hochladen.

## Commit-Konvention

Deutsch, eine Zeile Zusammenfassung, dann was und warum. Live-Tests benennen („geprüft am Testpfad LI-…“).
