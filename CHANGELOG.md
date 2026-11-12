# Changelog

## Kompatibilität mit scobees

scobees hat keinen Versions-Endpunkt; die Versionsnummer steht unten rechts in der Oberfläche und als Konstante im Frontend-Bundle. `scobees_me` liest sie aus und meldet, ob sich die Oberfläche seit der letzten Prüfung geändert hat (Fingerabdruck: Name des `main-….js`-Bundles). Bei jedem Release wird hier eingetragen, mit welcher scobees-Version live geprüft wurde.

| scobees-mcp | scobees-Oberfläche | Bundle | geprüft am | Umfang |
|---|---|---|---|---|
| 0.1.13 | v94.6 | main-FWSHPEPF.js | 2026-11-12 | Bearbeitungsreihenfolge an der Gliederung mit einem Dummy-Konto geprüft (Sperre, Freischalten nach Abgabe, freie Gliederung daneben); `scripts/funktionstest.js` prüft das Setzen und Erhalten der Einstellung |
| 0.1.12 | v94.6 | main-FWSHPEPF.js | 2026-11-12 | Eingabefelder in der Vorschau „Ansicht Lernende“ ausprobiert (IP-Adresse, Netzmaske, Bitmuster, Kommazahl; richtige und falsche Eingaben, als Zahlen- und als Texteingabe); `hat_titelbild` in allen Ergebnissen mit `scripts/funktionstest.js` geprüft |
| 0.1.11 | v94.6 | main-FWSHPEPF.js | 2026-11-12 | nur Skill geändert, Server unverändert gegenüber 0.1.10; Bild-Upload ins Arbeitsblatt mit SVG und PNG live geprüft (beide werden mit richtigem Inhaltstyp ausgeliefert) |
| 0.1.10 | v94.6 | main-FWSHPEPF.js | 2026-11-11 | alle 22 Werkzeuge mit `scripts/funktionstest.js` live geprüft (23 Schritte, jeweils mit Zurücklesen). Einzige Änderung in scobees: eine bestehende Aufgabe lässt sich jetzt in eine Wahlpflichtaufgabe verschieben. Bild-Upload ins Arbeitsblatt (Serlo-Medienspeicher) funktioniert wieder |
| 0.1.9 | v94.5 | main-K73FMJMP.js | 2026-11-11 | Kachelbild für Gliederung und Aufgabe per Browser-Mitschnitt ermittelt und live geprüft (anlegen, behalten, ersetzen); `scobees_patch_arbeitsblatt` live geprüft (Erfolg, Mehrfachtreffer, kein Treffer, verlustbehafteter Baustein); Bilder in Box/Spoiler und geschütztes Leerzeichen (U+00A0/U+202F) bestätigt unverändert erhalten |
| 0.1.8 | v94.5 | main-K73FMJMP.js | 2026-11-11 | Bundle seit v94.2 gewechselt (main-LEMTLTST.js → main-K73FMJMP.js, deutlich gewachsen); Lernpfad/Gliederung/Aufgabe/Wahlpflicht-Unteraufgabe anlegen dabei bestätigt unverändert. Neue Werkzeuge live geprüft: Anhang löschen (`DELETE attachments/{id}`), Lernpfad-Beschreibung als reiner Text |
| 0.1.7 | v94.2 | main-LEMTLTST.js | 2026-11-04 | breiter Funktionstest (Lernpfad/Gliederung/Aufgabe mit allen Markdown-Bausteinen, Material-Upload, Löschen – unverändert) plus Browser-Mitschnitt: Wahlpflicht-Unteraufgaben funktionieren jetzt (taskType „Wahlpflichtaufgabe“ nötig, automatisch gesetzt); Verschieben in eine Wahlpflichtaufgabe bleibt gesperrt |
| 0.1.6 | v94.2 | main-LEMTLTST.js | 2026-11-04 | (überholt, siehe 0.1.7) erste Diagnose der Wahlpflicht-Lücke, noch ohne Lösung |
| 0.1.5 | v94.2 | main-LEMTLTST.js | 2026-11-04 | Versions-Fingerabdruck, Serlo-Bild-Upload (Quellcode-Vergleich + Live-Test des `editor.serlo.org`-Aufrufs); eingebetteter Serlo-Editor-Chunk ist gegenüber v93.3 unverändert (gleicher Chunk-Name), daher kein Hinweis auf eine Markdown-/Serlo-Format-Änderung. Die übrigen Werkzeuge wurden für diese Version nicht erneut einzeln live geprüft |
| 0.1.0 – 0.1.4 | v93.3 | main-LKRB3D56.js | 2026-10-27 | alle 20 Werkzeuge live (Testpfad, RAID-Lernpfad, Sichtprüfung Schüler-App) |

## 0.1.13 – 2026-11-12

- **Bearbeitungsreihenfolge funktioniert jetzt.** Neuer Parameter `solve_order` an `scobees_create_gliederung` und `scobees_update_gliederung`. Mit einem Dummy-Konto geprüft: Steht „nach Reihenfolge“ an der Gliederung, sind alle Aufgaben nach der ersten offenen für Lernende gesperrt und werden mit jeder Abgabe einzeln frei. Bisher setzte der Server die Reihenfolge nur am Lernpfad und legte Gliederungen immer mit „frei“ an; das hat keine Aufgabe gesperrt. Die Aussage aus 0.1.12, „nach Reihenfolge“ sperre nicht, ist damit überholt.
- `scobees_update_gliederung` erhält die Reihenfolge einer Gliederung beim Ändern anderer Felder (war schon so) und kann sie jetzt gezielt umstellen.
- Skill: Reihenfolge wird je Gliederung vereinbart und steht je Gliederung im Grobplan; freiwillige Aufgaben ans Ende oder in eine freie Gliederung.

## 0.1.12 – 2026-11-12

Erkenntnisse aus dem Aufbau einer Lernsituation im Unterrichtsalltag (18 Punkte), eingearbeitet in Skill und Server.

**Server**

- `quiz-input`: IP-Adressen, Netzmasken, Versionsnummern und Bitmuster mit führender Null werden als Texteingabe angelegt statt als Zahleneingabe. In der Vorschau geprüft: scobees vergleicht in beiden Arten zeichengenau, IP-Adressen und Bitmuster lassen sich also abfragen. Die bisherige Aussage „`0100` wird zu 100“ ließ sich in scobees 94.6 nicht bestätigen und ist entfernt.
- `hat_titelbild` steht jetzt im Ergebnis aller Anlege- und Änderungswerkzeuge (bisher nur bei Gliederungen).

**Skill**

- Zwei Sperren vor dem ersten Schreibaufruf: Rahmen geklärt (Kachelbild-Frage wirklich gestellt) und Grobplan gezeigt und danach freigegeben. Gilt auch für einzelne Aufgaben.
- Schritt 1 fragt zusätzlich nach Jahrgang (nie aus dem Klassennamen abgeleitet) und Ablageordner und sagt bei einem genannten Termin, was nur die Lehrkraft in der Weboberfläche erledigen kann.
- Schritt 8 ist eine feste Prüffolge: Zurücklesen, Vorschau „Ansicht Lernende“ mit jeder Aufgabe, optional Durchgang mit Dummy-Konto durch die Lehrkraft, Befundliste, erst danach Zuweisung.
- Darstellungsregeln aus der Vorschau in `references/markdown.md`: Etiketten der Kastentypen, Bildunterschrift sichtbar und kurz, Nummerierung nach Tabellen, höchstens vier Tabellenspalten, kurze Codezeilen, gemischte Antworten, Hinweissatz vor einem Quiz.
- Modus C: Vor dem Überschreiben eines Arbeitsblatts fragen, ob der Lernpfad schon bei einer Lerngruppe läuft.

**Aus der Schülersicht (Durchgang mit einem Dummy-Konto, Mitschrift 16)**

- Quiz-Eingaben werden nicht gespeichert; erst beim Abgeben legt scobees ein Bild des ausgefüllten Arbeitsblatts zum Lernergebnis. Änderungen an einem Arbeitsblatt sind für zugewiesene Lernende nach dem Neuladen sofort sichtbar. Damit ist die offene Frage beantwortet: Es gehen keine gespeicherten Stände verloren, weil es keine gibt.
- Stift-Abgaben zeigen das PDF statt des Arbeitsblatts: Der Auftrag gehört auf das PDF und in die Beschreibung.
- Wahlpflichtaufgaben stehen für Lernende immer unter den übrigen Aufgaben der Gliederung: ans Ende setzen.
- „Nach Reihenfolge“ hat im Test nichts gesperrt; der Skill verlässt sich nicht mehr darauf.
- Titel kurz und mit dem unterscheidenden Wort vorn; Kachelbilder müssen daumennagelgroß erkennbar sein.
- Abbildungen: Schrift mindestens 22 px, kein Satz im Bild, der auch Bildunterschrift ist. Kasten `warning` hat kein Etikett; für Warnungen `attention`.
- Jede Aufgabe wird mit „Lernergebnis abgeben“ abgeschlossen; „Infoinput erledigt“ heißt die Schaltfläche nur bei `aufgabentyp: info`.

**Zugewiesene Lernpfade (Mitschrift 17)**

- **Neu im Server:** `scobees_get_lernpfad` zeigt an der Wurzel `zugewiesen`. Jedes schreibende Werkzeug prüft vor dem Schreiben, ob der Lernpfad zugewiesen ist, und meldet dann `zugewiesen: true` mit `warnung_zugewiesen`. Hintergrund: In einem zugewiesenen Lernpfad ist jede Änderung über die Schnittstelle sofort für Lernende sichtbar, auch neu angelegte Gliederungen und Aufgaben; ein Veröffentlichen der einzelnen Aufgaben ist dafür nicht nötig. Ausgegeben wird nur die Tatsache der Zuweisung, nicht an wen.
- **Neu im Server:** `scobees_upload_material` liefert `hinweis_ansicht`, wenn der Anhang das Arbeitsblatt aus der Startansicht der Lernenden verdrängt, mit Zusatz, wenn das Arbeitsblatt Quizfragen enthält (beim Wechsel zwischen Anhang und Arbeitsblatt gehen die Eingaben verloren).
- Skill: kein Anhang an einem Arbeitsblatt mit Quiz; Simulationen und Datenblätter in eine eigene Aufgabe davor. In zugewiesenen Lernpfaden entsteht jede Aufgabe in einem Aufruf vollständig. Niveau-Varianten tragen dieselbe Nummer, weil Lernende nur ihre Variante sehen. Der Checklistenpunkt „Gliederungen und Aufgaben veröffentlichen“ entfällt.
- Statusmodell bestätigt: ACTIVE an der Wurzel heißt zugewiesen. Der Status DRAFT an Unterelementen sagt nichts über die Sichtbarkeit.
- **Neu im Server:** `scobees_delete` verlangt in einem zugewiesenen Lernpfad zusätzlich `auch_wenn_zugewiesen: true`, weil scobees einzelne Aufgaben dort ohne Rückfrage löscht, auch wenn schon Lernergebnisse abgegeben sind. Die beiden Löschsperren von scobees (zugewiesener Lernpfad, Gliederung mit Inhalt) werden verständlich erklärt; die Werkzeugbeschreibung behauptet nicht mehr, Gliederungen würden samt Inhalt gelöscht.
- Aus der Lehrersicht (Mitschrift 18, von der Lehrkraft mitgeteilt): Die Lehrkraft sieht von einem Quiz nur das Bild des Arbeitsblatts im Zustand der Abgabe; Aufgabentitel sind in der Auswertung nach etwa 13 Zeichen abgeschnitten; Abgaben lassen sich zurücksetzen; zugewiesen wird immer der ganze Lernpfad, auch gezielt an einzelne Lernende.

## 0.1.11 – 2026-11-12

Nur der Skill `scobees-lernpfad` ändert sich; die Werkzeuge des Servers sind dieselben wie in 0.1.10.

- **Abbildungen und Kachelbilder sind getrennt.** Bisher fragte der Skill nach „Bildern“ für vier Ebenen, darunter die Abbildungen im Arbeitsblatt, und stellte alles unter den Vorbehalt des Aufwands. In der Praxis entstanden Kachelbilder zuverlässig, Abbildungen im Arbeitsblatt aber zu selten. Jetzt gibt es drei feste Begriffe: Fachabbildung, Situationsillustration (beide Pflicht, im Arbeitsblatt) und Kachelbild (optional, nur nach Rückfrage).
- **Mindeststandard als feste Regel:** Situationsillustration in der Einstiegsaufgabe, mindestens eine Fachabbildung je Theorie-Arbeitsblatt und je Aufbau-, Mess- oder Konfigurationsaufgabe. Abweichungen nur in zwei benannten Fällen und mit Grund im Grobplan.
- **Rückfrage zu mitgebrachten Abbildungen:** übernehmen, als Grundlage neu zeichnen oder neu erstellen. Fremde Abbildungen werden weder übernommen noch abgezeichnet.
- **Neue Referenz `references/abbildungen.md`:** Weg von der Idee bis zum Hochladen (als SVG zeichnen, als PNG rendern, ansehen, erst dann hochladen), Zeichenregeln, Prüfliste, Stil der Situationsillustrationen, europäische Schaltsymbole, Einbinden mit Bildunterschrift und zugehöriger Frage.
- **Grobplan und Abschlussbericht** zeigen je Aufgabe die geplanten Abbildungen (`abbildungen`) oder den Grund, warum keine entsteht (`ohne_abbildung`), dazu eine Kennzahl und eine Zeile zu den Kachelbildern (`kacheln`).
- Zurücklesen prüft, ob jede geplante Abbildung mit Bildunterschrift im Arbeitsblatt steht.

## 0.1.10 – 2026-11-11

Anpassung an scobees v94.6 (Bundle main-FWSHPEPF.js). Alle Werkzeuge der 0.1.9 arbeiten mit v94.6 unverändert; dieses Release zieht eine gelockerte scobees-Regel nach und bringt den Funktionstest als Skript mit.

- **`scobees_move` in eine Wahlpflichtaufgabe:** scobees v94.6 nimmt eine bestehende Aufgabe jetzt als Unteraufgabe an (bis v94.5 HTTP 405) und stellt ihren Aufgabentyp dabei auf „Wahlpflichtaufgabe“ um. Das Werkzeug meldet die Umstellung unter `warnung` und `aufgabentyp`. Weiterhin gesperrt: eine Unteraufgabe aus ihrer Wahlpflichtaufgabe heraus verschieben, eine Gliederung oder Wahlpflichtaufgabe in eine Wahlpflichtaufgabe verschieben. Beide Fälle haben jetzt je eine eigene Erklärung mit Abhilfe; die bisherige Sammelmeldung („lässt sich nicht nachträglich verschieben“) war für v94.6 falsch.
- **Neues Skript `scripts/funktionstest.js`** (`npm run test:live -- <Fach-ID>`): legt in einem Fach einen Test-Lernpfad an, ruft jedes Werkzeug mindestens einmal auf, prüft die Wirkung durch Zurücklesen und löscht den Test-Lernpfad wieder, auch nach einem Fehlschlag. Gedacht für den Moment, in dem `scobees_me` eine neue scobees-Version meldet. Der Bild-Upload ins Arbeitsblatt zählt darin nur als Hinweis, weil er an einem externen Dienst hängt.
- Bild-Upload ins Arbeitsblatt (`scobees_upload_bild`): der Medienspeicher des Serlo-Editors antwortet wieder (am 11.11.2026 zeitweise HTTP 402). Am Server wurde dafür nichts geändert.
- Werkzeugbeschreibungen von `scobees_move` und `scobees_create_wahlpflicht`, Skill (`SKILL.md`, `references/werkzeuge.md`) und API-Karte (Mitschrift 14) entsprechend angepasst; Test für die drei Wahlpflicht-Fehlermeldungen erweitert (31 Tests, alle grün).

## 0.1.9 – 2026-11-11

Zweite Anmerkungsrunde aus derselben Chat-Sitzung zur Unterrichtsmaterial-Erstellung (sechs Punkte); Status je Punkt in `docs/scobees-api-map.md` (Mitschrift 12).

- **Kachelbild für Gliederungen und Aufgaben** (`cover_image_path` bei `scobees_create_gliederung`, `scobees_update_gliederung`, `scobees_create_aufgabe`, `scobees_update_aufgabe`), per Browser-Mitschnitt ermittelt: Gliederungen nehmen die Datei direkt als `coverImage`, Aufgaben brauchen einen Anhang vom Typ `coverimage` und dessen Pfad als `coverImagePath`. `scobees_get_lernpfad` zeigt je Element `hat_titelbild`, `scobees_get_aufgabe` das `titelbild`. Beim Ersetzen an einer Aufgabe wird die alte Bilddatei entfernt.
- **Fehler behoben:** `scobees_update_gliederung` löschte bisher stillschweigend die Farbe einer Gliederung, weil `color`/`order` nicht mitgeschickt wurden. Neuer optionaler Parameter `color` an beiden Gliederungs-Werkzeugen.
- **Neues Werkzeug `scobees_patch_arbeitsblatt`**: ersetzt im Arbeitsblatt-Markdown gezielt Textstellen, statt das ganze Arbeitsblatt neu zu senden. Alles-oder-nichts – jede Ersetzung muss genau einmal vorkommen, sonst keine Änderung und eine Meldung, welche fehlschlug. Lehnt Arbeitsblätter mit Bausteinen ohne Markdown-Entsprechung (z. B. Bild-Zuordnung) ab und verweist auf `serlo_json`.
- **Neue Warnungen** (`warnungen[]` in `scobees_markdown_vorschau`, `scobees_create_aufgabe`, `scobees_update_aufgabe`, `scobees_patch_arbeitsblatt`): Unterstrich-Betonung (`_…_`) wird beim Zurücklesen immer als `*…*` angezeigt; `$…$` in einer Lückenantwort/einem Distraktor wird für den Vergleich abgeschnitten und nie als Formel dargestellt.
- Geklärt und dokumentiert statt Code geändert: `differenzierungen` leer trägt alle aktuellen Niveaus explizit ein (scobees kennt kein eigenes „für alle“) – Parameterbeschreibung entsprechend präzisiert. Bilder in `:::box`/`:::spoiler` und geschütztes Leerzeichen (U+00A0/U+202F) funktionieren bereits, nur in `references/markdown.md` ergänzt.
- Werkzeugbeschreibungen und Server-Hinweise überarbeitet (vollständige Liste der Arten und Quiz-Blöcke bei `scobees_create_aufgabe`, Verweis auf `scobees_patch_arbeitsblatt`, Ablauf für bestehende Kurse); `taskToForm` reicht das neue Oberflächen-Feld `isAiCorrectionEnabled` durch.
- Skill: Bei einer neuen Lernsituation wird gefragt, ob und für welche Ebenen Bilder entstehen sollen (Titelbild, Gliederungs-Kacheln, Aufgaben-Kacheln, Abbildungen im Arbeitsblatt); Entscheidung steht im Grobplan.
- 8 neue Tests (31 gesamt, alle grün).

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
