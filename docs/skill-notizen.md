# Notizen für den Skill „Lernpfad mit scobees aufbauen“

Gesammelt aus den ersten Praxisläufen (27.10.2026, Lernpfad „Datensicherheit mit RAID“, Fach „PB IT-Systeme kennenlernen und konfigurieren“). Jede Beobachtung ist zugeordnet: **Server** (im MCP-Server geändert) oder **Skill** (gehört in die Anleitung für Claude beim Kursaufbau).

## Aus dem ersten Praxislauf

| Beobachtung | Ort | Stand |
|---|---|---|
| „Wahlaufgabe“ löste HTTP 500 aus | Server | behoben: `aufgabentyp` = pflicht / extra / training / info (so heißen die Typen in scobees; „Wahlaufgabe“ gibt es nicht) |
| Drag-and-drop-Lückentext „brachte den Server zum Absturz“ | Server/Skill | `quiz-blanks-dnd` funktioniert (live geprüft). Der Fehler war vermutlich ein Markdown ohne `[[…]]`-Lücke → Fehlermeldung „keine Lücke gefunden“. Skill: Format `Text [[Antwort]] Text`, Distraktoren je Zeile `+ falsch`; echte Bild-Zuordnung (dropzoneImage) gibt es nur per Serlo-JSON |
| Unklar, was abzugeben ist | Skill | Jede Aufgabe mit Ergebnis braucht `art: abgabe_*` **und** einen Satz in `description_html`: „Gib … als … ab.“ `art: info` hat **kein** Abgabefeld – nur für reine Lese-/Erkundungsbausteine |
| Serlo-Arbeitsblatt sollte zuerst sichtbar sein | Skill | scobees zeigt oben die Beschreibung, darunter Material, dann das Arbeitsblatt. Beschreibung kurz halten (Auftrag in 1–3 Sätzen), alle Inhalte ins Arbeitsblatt; keine langen Theorietexte in `description_html` |
| „Keine Aufgabe zum Abgeben auswählbar“, „Selbstreflexion aktiviert“ | prüfen | Die betroffene Aufgabe war `art: info` (kind `task`) → kein Abgabefeld, korrekt. Woher „Selbstreflexion“ kommt, ist offen (kein Feld des Servers; evtl. Schul-/Fach-Einstellung in scobees) |
| Zahleneingabe soll Einheit tolerieren | Server | behoben: `= 5 GB` setzt Wert 5 und Einheit GB; alternativ `unit: GB`. Lernende tippen nur die Zahl |
| Lernpfad „noch inaktiv, alles Entwurf“ | Skill | Normalzustand: neue Pfade sind in der Bib (INACTIVE), Aufgaben DRAFT; sichtbar für Lernende erst nach Zuweisung in der Weboberfläche. Im Abschlussbericht so erklären, nicht als Mangel |

## Didaktische Leitplanken (Entwurf)

- **Situationsbeschreibung** als eigene erste Gliederung mit einer `info`-Aufgabe (Auftrag, Rolle, Kunde) und ggf. Material (Ticket, Mail) als Anhang.
- **Theorie in Häppchen**: eine Gliederung pro Thema, Arbeitsblatt mit max. 1–2 Bildschirmseiten Text, dann sofort Kontrolle.
- **Kontrollform passend zum Inhalt**: Begriffe/Zuordnung → `quiz-blanks`/`quiz-blanks-dnd`; Entscheidung → `quiz-sc`; Mehrfacheigenschaften → `quiz-mc`; Rechnung → `quiz-input` mit Einheit; Begründung → `quiz-text` oder Abgabe.
- **Differenzierungen**: ohne Angabe für alle Niveaus; bei getrennten Varianten je Aufgabe ein Niveau. Der Pfad zeigt das Aggregat.
- **Aufgabentyp**: `pflicht` für den roten Faden, `extra`/`training` für Vertiefung und Übung (zählen nicht zum Pflicht-Fortschritt), `info` für Infobausteine.
- **Interaktive Inhalte**: eigenständige HTML-Simulationen als Material anhängen (laufen direkt im Browser, siehe Ohm-Rechner/RAID-Lab); Bilder fürs Arbeitsblatt mit `scobees_upload_bild`; GeoGebra/YouTube per URL-Zeile.
- **Abschlussbericht an die Lehrkraft**: Baum mit IDs, was manuell bleibt (Zuweisung, Sichtprüfung), bekannte Grenzen (keine Bild-Zuordnung per Markdown).
