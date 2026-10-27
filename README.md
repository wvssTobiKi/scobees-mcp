# scobees-mcp

MCP-Server, der Claude mit der scobees-Lehrkräfte-App (teach.scobees.com) verbindet. Damit lassen sich aus Offline-Unterlagen, Arbeitsblättern und Ideen **Lernpfade in scobees anlegen und bestehende erweitern** – inklusive interaktiver Arbeitsblätter (Serlo-Editor) mit Quizfragen.

Erster Aufschlag der Werner-von-Siemens-Schule Hildesheim, orientiert am [Moodle-MCP](https://github.com/jtuttas/MoodleMcp) von Dr. Jörg Tuttas (MMBbS).

## Grundsätze

- **Keine Schülerdaten.** Der Server ruft ausschließlich Inhaltsfunktionen auf. Alle Pfade mit Schüler-, Klassen-, Lernstands-, Bewertungs- oder Personendaten stehen auf einer festen Sperrliste (`src/api.js`) und werden nicht aufgerufen – auch nicht auf Wunsch. Personennamen in Antworten werden auf IDs reduziert.
- **Verwaltung bleibt beim Admin.** Lernbereiche und Fächer werden nur gelesen; die Lehrkraft wählt das Fach, in dem ein Lernpfad entsteht.
- **Nichts wird ohne Freigabe veröffentlicht.** Neue Lernpfade sind zunächst nicht für die Zuweisung aktiviert; die Aktivierung erfolgt in der Weboberfläche.
- **Inoffizielle Schnittstelle.** scobees hat keine öffentliche API. Der Server nutzt dieselben Aufrufe wie die Weboberfläche (dokumentiert in [`docs/scobees-api-map.md`](docs/scobees-api-map.md)). Bei Änderungen an scobees muss nachgezogen werden – deshalb liegt das Projekt in Git.

## Begriffe

| scobees-Oberfläche | API | Werkzeug |
|---|---|---|
| Lernbereich (Kachel in der Bib) | workspace `LB-…` | `scobees_list_workspaces` |
| Fach / Kurs | subject `SUBJ-…` | `scobees_list_subjects` |
| Lernpfad | Wurzel-Lerninput `LI-…` | `scobees_create_lernpfad`, `scobees_update_lernpfad`, `scobees_get_lernpfad` |
| Gliederungsstruktur | folder | `scobees_create_gliederung` |
| Aufgabe (Pflicht/Wahl) | task | `scobees_create_aufgabe`, `scobees_update_aufgabe` |
| Wahlpflichtaufgabe | choice (Container) | `scobees_create_wahlpflicht`, `scobees_update_wahlpflicht` |
| Interaktives Arbeitsblatt | Serlo-Dokument in `taskDescription` | Markdown → `src/serlo.js` |
| Material / Musterlösung | attachment | `scobees_upload_material` |
| Bild im Arbeitsblatt | Serlo-Medienspeicher (editor.serlo.org) | `scobees_upload_bild` → `![…](url)` |

## Installation (Claude Desktop)

1. Node.js ≥ 18 installieren.
2. Paket bauen: `npx @anthropic-ai/mcpb pack` im Projektordner → `scobees-mcp.mcpb`.
3. Datei in Claude Desktop per Doppelklick installieren (Einstellungen → Erweiterungen) und scobees-Benutzername/Passwort eintragen. Die Zugangsdaten speichert Claude Desktop verschlüsselt; der Server nutzt sie nur für die Anmeldung bei `auth.scobees.com` und legt danach Tokens unter `~/.scobees-mcp/tokens.json` ab.

Manuell (Claude Code / andere Clients): Umgebungsvariablen `SCOBEES_USERNAME`, `SCOBEES_PASSWORD` setzen und `node src/server.js` als stdio-Server eintragen. Anmeldung testen mit `node src/server.js --login`.

> Hinweis: Konten, die sich nur per Microsoft 365 oder Eduplaces anmelden, werden derzeit nicht unterstützt (kein Passwort-Login bei Keycloak). Übergangsweise kann `SCOBEES_REFRESH_TOKEN` gesetzt werden.

## Typischer Ablauf

1. `scobees_list_subjects` → Fach wählen.
2. `scobees_create_lernpfad` (Name, Beschreibung, Jahrgang, Titelbild).
3. Je Phase `scobees_create_gliederung`.
4. Je Aufgabe `scobees_create_aufgabe` mit `art` (info, selbstkontrolle, abgabe_optional, abgabe_pflicht) und `arbeitsblatt_markdown`.
5. Dateien mit `scobees_upload_material` anhängen (PDF, HTML-Simulationen, interaktive Seiten, GeoGebra-Dateien). Bilder, die *im* Arbeitsblatt erscheinen sollen, vorher mit `scobees_upload_bild` hochladen und die URL per `![…](url)` einbinden.
6. Ergebnis in scobees prüfen, Reihenfolge ggf. mit `scobees_move` anpassen, dann in der Weboberfläche aktivieren.

Bestehende Kurse: `scobees_list_lernpfade` → `scobees_get_lernpfad` (Baum mit IDs) → `scobees_get_aufgabe` (Arbeitsblatt als Markdown) → `scobees_update_aufgabe` / `scobees_update_gliederung` / `scobees_move` / `scobees_delete`.

## Markdown für Arbeitsblätter

```markdown
# Überschrift
Absatz mit **fett**, *kursiv*, `code`, [Link](https://…) und $U = R \cdot I$.

- Aufzählung          1. nummeriert
| Kopf | Kopf |        (Tabellen mit Trennzeile)
> Hinweis-Box          ![Bild](https://…)
https://www.geogebra.org/m/…   (Zeile nur mit URL → GeoGebra-Applet; YouTube/mp4 → Video)

:::spoiler Lösung
…
:::
:::box warning Achtung
…
:::

```cpp
void loop() {}
```

```quiz-sc            (quiz-mc für Mehrfachauswahl)
Frage?
- [x] richtig :: Feedback
- [ ] falsch
```
```quiz-input
Wie viel ist 6 · 7?
unit: Stück
= 42
```
```quiz-blanks        (quiz-blanks-dnd für Drag & Drop, Distraktoren mit „+ …“)
Strom wird in [[Ampere|A]] gemessen.
```
```quiz-text
Freitextaufgabe
```
```math               (Gleichungskette, LaTeX; Text nach „|“ erklärt den Schritt ZUR NÄCHSTEN Zeile)
| Ohmsches Gesetz anwenden
U = R \cdot I | nach I umstellen
I = \frac{U}{R} | Werte einsetzen
= 3\,\mathrm{A}
```
```

Alles, was Markdown nicht abbildet (Bild-Zuordnung, Gleichungen, interaktives Video …), kann als fertiges Serlo-JSON über `serlo_json` übergeben werden – Vorlage: [`docs/serlo-beispiel.json`](docs/serlo-beispiel.json). `scobees_markdown_vorschau` zeigt das Ergebnis, ohne zu speichern.

## Entwicklung

```bash
npm test                    # Konverter- und Sperrlisten-Tests
node src/server.js --tools  # Werkzeugliste
node src/server.js --login  # Anmeldung prüfen
```

Testumgebung in scobees (WvSS): Lernbereich „testbereich“ `LB-9QX4VN79SPUN59XTXC`, Lernpfad „TEST MCP“ `LI-M1SUFLY8QBQBD65MHU`.

Status der Aufrufe: alles in `docs/scobees-api-map.md` mit „Mitschrift“ ist beobachtet. Am 27.10.2026 live geprüft: Anmeldung, Lesen, Gliederung/Aufgabe/Wahlpflicht anlegen, Aufgabe und Gliederung ändern, Material-Upload, Verschieben, Löschen. Nachtrag (2. Mitschnitt): Lernpfad-Wurzel und Wahlpflichtaufgabe ändern sowie Bild-Upload ins Arbeitsblatt ebenfalls live geprüft. Noch offen: das Aktivieren eines Lernpfads (bleibt in der Weboberfläche).

## Lizenz

MIT
