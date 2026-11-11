# Changelog

## Kompatibilität mit scobees

scobees hat keinen Versions-Endpunkt; die Versionsnummer steht unten rechts in der Oberfläche und als Konstante im Frontend-Bundle. `scobees_me` liest sie aus und meldet, ob sich die Oberfläche seit der letzten Prüfung geändert hat (Fingerabdruck: Name des `main-….js`-Bundles). Bei jedem Release wird hier eingetragen, mit welcher scobees-Version live geprüft wurde.

| scobees-mcp | scobees-Oberfläche | Bundle | geprüft am | Umfang |
|---|---|---|---|---|
| 0.1.8 | v94.5 | main-K73FMJMP.js | 2026-11-11 | Bundle seit v94.2 gewechselt (main-LEMTLTST.js → main-K73FMJMP.js, deutlich gewachsen); Lernpfad/Gliederung/Aufgabe/Wahlpflicht-Unteraufgabe anlegen dabei bestätigt unverändert. Neue Werkzeuge live geprüft: Anhang löschen (`DELETE attachments/{id}`), Lernpfad-Beschreibung als reiner Text |
| 0.1.7 | v94.2 | main-LEMTLTST.js | 2026-11-04 | breiter Funktionstest (Lernpfad/Gliederung/Aufgabe mit allen Markdown-Bausteinen, Material-Upload, Löschen – unverändert) plus Browser-Mitschnitt: Wahlpflicht-Unteraufgaben funktionieren jetzt (taskType „Wahlpflichtaufgabe“ nötig, automatisch gesetzt); Verschieben in eine Wahlpflichtaufgabe bleibt gesperrt |
| 0.1.6 | v94.2 | main-LEMTLTST.js | 2026-11-04 | (überholt, siehe 0.1.7) erste Diagnose der Wahlpflicht-Lücke, noch ohne Lösung |
| 0.1.5 | v94.2 | main-LEMTLTST.js | 2026-11-04 | Versions-Fingerabdruck, Serlo-Bild-Upload (Quellcode-Vergleich + Live-Test des `editor.serlo.org`-Aufrufs); eingebetteter Serlo-Editor-Chunk ist gegenüber v93.3 unverändert (gleicher Chunk-Name), daher kein Hinweis auf eine Markdown-/Serlo-Format-Änderung. Die übrigen Werkzeuge wurden für diese Version nicht erneut einzeln live geprüft |
| 0.1.0 – 0.1.4 | v93.3 | main-LKRB3D56.js | 2026-10-27 | alle 20 Werkzeuge live (Testpfad, RAID-Lernpfad, Sichtprüfung Schüler-App) |

## 0.1.8 – 2026-11-11

Zwei Fehlerberichte aus einer anderen Chat-Sitzung zur Unterrichtsmaterial-Erstellung bearbeitet.

- **Neues Werkzeug `scobees_delete_material`** löscht genau einen Anhang (Material oder Musterlösung) einer Aufgabe. Prüft, dass der Anhang wirklich zu der Aufgabe gehört, erfordert `confirm: true`, und warnt, wenn dabei das letzte PDF-Material einer Stift-Abgabe (`abgabeformen: pen`) verschwindet. Gefunden ohne Browser-Mitschnitt, direkt per Sondierung: Weder `removedAttachmentIds` noch `removedSampleSolutionIds` noch ein leeres `attachments`-Array am Aufgaben-Speichern entfernen etwas – der echte Weg ist `DELETE attachments/{id}`, der für Material **und** Musterlösung gleichermaßen funktioniert.
- `scobees_upload_material` bekommt den optionalen Parameter `ersetzt_attachment_id`: lädt erst hoch, löscht bei Erfolg den alten Anhang. Schlägt nur das Löschen des alten fehl, bleibt die neue Datei trotzdem hochgeladen; eine Warnung nennt die alte ID zum manuellen Nachholen.
- **Lernpfad-Beschreibung war nicht reiner Text**: `create_lernpfad` und `update_lernpfad` reichten die Beschreibung unverändert durch (beide identisch, kein Unterschied zwischen Anlegen und Ändern) – scobees zeigt dieses Feld aber nirgends als HTML, mitgeschicktes `<p>…</p>` erschien als sichtbarer Tag-Text. Ursache war die eigene Parameterbeschreibung „Klartext oder einfaches HTML“. Behoben: `htmlToPlainText()` wandelt die Beschreibung jetzt immer in reinen Text (Blockgrenzen → Zeilenumbruch, Entities aufgelöst); Parameterbeschreibung korrigiert.
- `scobees_get_lernpfad` zeigte die Beschreibung der Lernpfad-Wurzel bisher durch `stripHtml` bereinigt zurück, wodurch genau dieser Fehler beim Zurücklesen unsichtbar blieb. Jetzt wird sie roh zurückgegeben (Gliederungen/Aufgaben bleiben wie bisher bereinigt, deren Beschreibung ist legitim HTML).
- 5 neue Tests (28 gesamt, alle grün).

## 0.1.7 – 2026-11-04

Wahlpflicht-Unteraufgaben funktionieren jetzt. Direkte Fortsetzung von 0.1.6: Dort war die Lücke nur diagnostiziert; ein Browser-Mitschnitt (Tobias hat live in der Weboberfläche eine Unteraufgabe hinzugefügt, während mitgelesen wurde) hat die echte Ursache gezeigt.

- Fund: scobees verlangt für eine Aufgabe direkt unter einer Wahlpflichtaufgabe zwingend `taskType: "Wahlpflichtaufgabe"` statt des sonst üblichen Werts – fehlte das, kam HTTP 405 „…without type choice is not allowed“.
- `scobees_create_aufgabe` versucht jetzt beim ersten Fehlschlag automatisch mit diesem `taskType` erneut; Unteraufgaben einer Wahlpflichtaufgabe lassen sich damit wieder ganz normal mit `parent_id` = Wahlpflicht-ID anlegen, ohne dass die Lehrkraft etwas davon merkt.
- Bestätigt bleibt gesperrt: Eine bestehende Aufgabe nachträglich mit `scobees_move` in eine Wahlpflichtaufgabe zu verschieben, geht nicht (auch nicht mit vorher gesetztem `taskType`) – scobees verlangt, dass sie von Anfang an dort entsteht. `scobees_move` erklärt das jetzt statt des rohen HTTP-405.
- Details in `docs/scobees-api-map.md` (Mitschrift 10, aktualisiert).

## 0.1.6 – 2026-11-04 (überholt durch 0.1.7)

Breiter Funktionstest gegen scobees v94.2 (Anlass: Rückfrage, ob sich ein automatisierter Kompatibilitätstest lohnt).

- Lernpfad, Gliederung, Aufgabe mit allen Markdown-Bausteinen auf einmal (Box, mehrzeiliger Spoiler, Gleichungskette, quiz-sc mit Feedback, quiz-input mit Einheit und `≠`, quiz-blanks-dnd), Material-Upload, Löschen – alle live bestätigt, nichts durch v94.2 verändert.
- Neu entdeckt (kein Regressionsfehler, sondern eine nie verifizierte Annahme): Eine Aufgabe ließ sich über diesen Server weder direkt unter einer Wahlpflichtaufgabe anlegen noch nachträglich dorthin verschieben. `scobees_create_aufgabe`/`scobees_move` gaben eine klare deutsche Erklärung statt des rohen Fehlercodes. Das Anlegen ist in 0.1.7 gelöst.

## 0.1.5 – 2026-11-04

### Bild-Upload (`scobees_upload_bild`) schlägt mit HTTP 402 fehl – Ursache gefunden, kein Server-Fehler

Diagnose auf Meldung „Fehler: Serlo presigned-url → HTTP 402“ bei jedem Bild-Upload (Dateigröße/-format als Ursache ausgeschlossen):

- `editor.serlo.org` – der Medienspeicher, in den sowohl dieser Server als auch der **eingebettete Serlo-Editor der scobees-Weboberfläche selbst** Bilder hochladen – ist zurzeit vollständig nicht erreichbar: jeder Aufruf der Domain (nicht nur `/media/presigned-url`) liefert HTTP 402 mit der Antwort „This account has been disabled“ vom Hoster Uberspace. Das ist ein Ausfall auf Serlo-Seite, der **alle** scobees-Lehrkräfte betrifft, nicht nur dieses Konto oder diese Schule, und nichts mit der scobees-Version oder diesem Server zu tun hat.
- Beleg: Der Aufruf unseres Servers ist mit dem des eingebetteten Serlo-Editors identisch (gleicher Chunk `chunk-C_E2ehNR.js`, gleiche URL, gleiche Parameter, beide ohne Anmeldung) – ein eigener Bild-Upload in der Weboberfläche würde also ebenso scheitern. `de.serlo.org` (die normale Serlo-Seite) läuft dagegen.
- **Kein Umgehen gebaut** (kein Fremd-Hoster, keine Data-URI). Fallback bleibt `scobees_upload_material`, das Bild landet dann als gewöhnlicher Anhang an der Aufgabe statt im Arbeitsblatt.
- Server-seitig trotzdem verbessert, weil die Fehlermeldung bisher den Antworttext verwarf und nur „HTTP 402“ ohne jede Erklärung zeigte:
  - Antworttext des fehlgeschlagenen Aufrufs steht jetzt immer (gekürzt) in der Fehlermeldung.
  - Bei HTTP 402 zusätzlich ein erklärender Hinweis (siehe oben) statt reiner Spekulation über Dateigröße/-format.
  - Neuer Diagnose-Modus `SCOBEES_DEBUG=1` zeigt zusätzlich URL und Antwort-Header des fehlgeschlagenen Aufrufs; Signaturen in der URL (`X-Amz-Signature` u. Ä.) und Authorization/Cookie-Header werden dabei maskiert.
  - Neues Skript `scripts/diagnose-serlo-upload.js` prüft die drei Schritte (presigned-url, S3-Upload, voller Server-Weg) einzeln mit einem winzigen Test-Bild und zeigt, wo genau es scheitert – auch ohne scobees-Anmeldung lauffähig.
- **Was nur Serlo klären kann:** den Uberspace-Account für `editor.serlo.org` wieder aktivieren. Weder diese Schule noch scobees können das beheben; sobald der Dienst wieder läuft, sollte `scobees_upload_bild` ohne Codeänderung wieder funktionieren (mit `scripts/diagnose-serlo-upload.js` prüfbar).

### Markdown-Umwandlung

- Variablennamen mit Unterstrich außerhalb von `$…$` (`u_e`, `U_ref`) wurden als Betonung gelesen und verschluckten dabei oft unbeteiligten Text bis zum nächsten Unterstrich in der Zeile; Rundreise machte daraus `*…*`. Behoben: ein Unterstrich öffnet/schließt Betonung nur noch außerhalb eines Worts (wie in CommonMark vorgesehen); Sternchen-Betonung `*…*` ist davon nicht betroffen.
- `quiz-blanks`/`quiz-blanks-dnd`: mehrere Zeilen eines Blocks wurden zu einem Absatz zusammengezogen, Zeilenumbrüche gingen verloren. Behoben: jede Zeile ein eigener Absatz, wie im übrigen Markdown.
- `quiz-blanks`/`quiz-blanks-dnd`: `$…$` in einer Lückenantwort (`[[$U=R\cdot I$]]`) oder einem Distraktor (`+ $5V$`) blieb als Klartext samt Dollarzeichen stehen. Ursache: Lückenantworten sind bei Serlo reine Zeichenketten ohne Formel-Darstellung; `acceptMathEquivalents` vergleicht sie als nackten mathematischen Ausdruck, den die Dollarzeichen ungültig machten. Behoben: `$…$` wird beim Speichern abgeschnitten, der Vergleich funktioniert jetzt; sichtbar bleibt es trotzdem Klartext (Serlo-Grenze, nicht im Server behebbar).

## Unveröffentlicht

- Neuer Skill `skills/scobees-lernpfad` („Lernpfad mit scobees aufbauen“): Modus A neu / B aus Unterlagen / C bestehenden Pfad überarbeiten; Bildungsgänge Niedersachsen (BFS-dual, Fachschule Technik, BG Technik, FOS Technik, BES); Gliederungsregel, Grobplan zur Freigabe, Zeitplausibilität, Abschlussbericht mit Checkliste; Referenzen zu Werkzeugen und Markdown; drei Testfälle. Release hängt den Skill als ZIP an.
- Doku: Sichtprüfung der Schüler-App (Infoinput, Stift auf PDF, Selbstkorrektur), Hinweis „Serlo-Inhalt“ nicht benennbar.

## 0.1.4 – 2026-10-27

Nachschärfung nach Praxislauf 2 („Subnetting-Werkstatt“).

- Server prüft Eingaben gegen das Schema: unbekannte Parameter (z. B. `abgabeform` statt `abgabeformen` – jetzt als Alias erlaubt) und ungültige enum-Werte (z. B. `art: abgabe_pflicht_sc`) werden mit klarer Meldung abgewiesen statt still ignoriert.
- Neue Abgabeform `abgabe_pflicht_selbstkorrektur` (Pflicht-Upload + Musterlösungs-Vergleich).
- `scobees_get_aufgabe` liefert `art`, `abgabeformen`, `abgabe_regel` zurück.
- Markdown: `≠ 256 :: Hinweis` für falsche Antworten mit Rückmeldung in `quiz-input` (Rundreise verlustfrei – vorher wurden falsche Antworten beim erneuten Speichern zu richtigen); `---` wird ausgelassen; jede Zeile ein Absatz (auch in Spoilern/Boxen).

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
