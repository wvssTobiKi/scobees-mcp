# Changelog

## 0.1.1 – 2026-10-27

Nachschärfung nach dem ersten Praxislauf (Lernpfad „Datensicherheit mit RAID“ über Claude Desktop).

- Fix: `wahlaufgabe: true` erzeugte HTTP 500 – scobees kennt keinen Typ „Wahlaufgabe“. Neuer Parameter `aufgabentyp` (pflicht | extra | training | info) nach dem Frontend-Enum; auch in `scobees_update_aufgabe`.
- `quiz-input`: `= 5 GB` trennt die Einheit ab (Wert 5, Einheit GB), Lernende tippen nur die Zahl.
- `art`-Beschreibung stellt klar: `info` hat kein Abgabefeld; Aufgaben mit Ergebnis brauchen `abgabe_*` und einen Abgabesatz in der Beschreibung.
- `docs/skill-notizen.md`: Rückmeldungen aus dem Praxislauf, zugeordnet zu Server bzw. künftigem Skill.

## 0.1.0 – 2026-10-27

Erster Aufschlag, abgeleitet aus einer Mitschrift der Weboberfläche (teach.scobees.com v93.3).

- Anmeldung über Keycloak (Benutzername/Passwort, PKCE), Token-Refresh, lokale Token-Datei
- Sperrliste für Schüler-/Personendaten, Namensfilter in Antworten
- Lesen: Konto, Lernbereiche, Fächer, Tags, Lernpfade, Baum, Aufgabe (Serlo → Markdown)
- Schreiben: Lernpfad, Gliederung, Aufgabe, Wahlpflicht, Material/Musterlösung, Verschieben, Löschen, Aufgabe/Gliederung ändern
- Markdown → Serlo-Editor-Format inkl. Quiz-Blöcken (SC/MC, Eingabe, Lückentext, Freitext), Tabellen, Boxen, Spoiler, Code, Bild, GeoGebra, Video
- Live getestet (27.10.2026, Testpfad „TEST MCP“): Anmeldung, alle Lesewerkzeuge, Gliederung/Aufgabe/Wahlpflicht anlegen, Aufgabe und Gliederung ändern, HTML-Material hochladen, verschieben, löschen
- Fix: `users/me` wurde vom Namensfilter auf die ID reduziert; Spoiler-/Box-Titel mit Umlauten wurden zerlegt
- Neu: ```math-Block → Serlo-Gleichungskette (`equations`); Formeln `$…$` auch in Quizantworten und Tabellen nutzbar
- Fix: Wurzel-`rows` des Serlo-Dokuments ohne `id` – mit `id` zeigte der Editor „Leider ist ein Fehler aufgetreten“ (Schüleransicht war unbetroffen)
- Neu (Mitschnitt 27.10.2026): `scobees_update_lernpfad` (POST lerninput mit id), `scobees_update_wahlpflicht` (POST lerninput/choice mit id), `scobees_upload_bild` (Serlo-Medienspeicher: presigned-url → S3-PUT, URL für `![…](url)`) – alle live geprüft
- Geklärt: Bib-Schalter = `published` (`scobees_update_lernpfad in_bib`); DRAFT ↔ INACTIVE folgt daraus (live geprüft). ACTIVE: vom Backend gesetzt, Auslöser unbelegt (vermutlich Zuweisung).
- Differenzierungen: Auflösung über die Niveaus der Schule (school-diffs → defaultTag); ohne Angabe alle Niveaus. `scobees_list_tags` zeigt die Schul-Niveaus.
- Offen: SSO-Konten
