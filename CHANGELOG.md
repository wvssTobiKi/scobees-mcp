# Changelog

## Kompatibilität mit scobees

scobees hat keinen Versions-Endpunkt; die Versionsnummer steht unten rechts in der Oberfläche und als Konstante im Frontend-Bundle. `scobees_me` liest sie aus und meldet, ob sich die Oberfläche seit der letzten Prüfung geändert hat (Fingerabdruck: Name des `main-….js`-Bundles). Bei jedem Release wird hier eingetragen, mit welcher scobees-Version live geprüft wurde.

| scobees-mcp | scobees-Oberfläche | Bundle | geprüft am | Umfang |
|---|---|---|---|---|
| 0.1.0 – 0.1.3 | v93.3 | main-LKRB3D56.js | 2026-10-27 | alle 20 Werkzeuge live (Testpfad, RAID-Lernpfad, Sichtprüfung Schüler-App) |

## 0.1.3 – 2026-10-27

- `scobees_me` ermittelt die scobees-Version (ohne Anmeldung aus dem Frontend) und vergleicht sie mit der geprüften; Hinweis, wenn scobees aktualisiert wurde.
- Kompatibilitätstabelle (oben) als feste Rubrik.

## 0.1.2 – 2026-10-27

Sichtprüfung als Schüler (Testpfad, Aufgaben A–D): selbstkontrolle ohne Upload abschließbar; Datei/Link-Abgabe; Pflicht-Upload; Selbstkorrektur-Reiter nach Abgabe – alles wie vorgesehen.

- Fix: Jede Aufgabe erzwang eine Datei-Abgabe (`requiredSubmissions: ["file"]` war ein erfundener Standard) und `selbstkontrolle` war auf scobees-„Selbstkorrektur“ (Musterlösungs-Vergleich nach Abgabe) gemappt. Neu: `info`/`selbstkontrolle` ohne Abgabe; `abgabe_optional`/`abgabe_pflicht` mit `abgabeformen` (file/pen/link); `abgabe_selbstkorrektur` ersetzt `abgabe_optional_sc`.
- `scobees_update_lernpfad subject_id`: Lernpfad in ein anderes Fach verschieben (nötig, wenn Lernende nur im anderen Fach ein Niveau haben).
- `solve_order` vollständig: none, after_solving, after_selfcorrection, after_teacher_correction.

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
