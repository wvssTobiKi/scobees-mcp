# Werkzeuge des Servers scobees-mcp (Stand 0.1.12)

Parameternamen sind verbindlich; der Server weist unbekannte Namen und ungültige Werte mit einer Fehlermeldung ab (Alias: `abgabeform` → `abgabeformen`). Die Antwort eines Schreibaufrufs enthält die neue `LI-…`-ID, die du für Unterelemente und Material brauchst.

## Lesen

| Werkzeug | Zweck | Wichtige Parameter |
|---|---|---|
| `scobees_me` | Anmeldung prüfen, scobees-Version gegen geprüfte Version | – |
| `scobees_list_workspaces` | Lernbereiche (Kacheln der Bib) mit Fächern | – |
| `scobees_list_subjects` | Fächer; die Lehrkraft wählt das Fach | `workspace_id` |
| `scobees_list_tags` | Jahrgänge und Niveaus der Schule | – |
| `scobees_list_lernpfade` | Bestehende Pfade finden | `subject_id`, `title`, `page`, `page_size` |
| `scobees_get_lernpfad` | Baum Gliederungen → Aufgaben mit IDs; je Element `hat_titelbild` (eigenes Kachelbild gesetzt?); Beschreibung der Lernpfad-Wurzel unverändert | `id` |
| `scobees_get_aufgabe` | Eine Aufgabe mit Arbeitsblatt als Markdown, Links, Anhängen; liefert `art`, `abgabeformen`, `abgabe_regel`, `taskType`, `interne_notiz`, `titelbild`, ATT-IDs der Anhänge und Musterlösungen | `id`, `mit_serlo_json` |
| `scobees_markdown_vorschau` | Markdown → Serlo-Bausteine ohne Speichern; `warnungen[]` bei Unterstrich-Betonung (wird zu `*…*`) oder `$…$` in einer Lückenantwort (wird abgeschnitten, Serlo zeigt dort nie Formeln) | `markdown` |

## Anlegen und ändern

| Werkzeug | Parameter (Pflicht mit *) |
|---|---|
| `scobees_create_lernpfad` | `subject_id`*, `name`*, `description` (**reiner Text** – scobees rendert hier kein HTML, Tags würden sichtbar; wird notfalls automatisch entfernt), `jahrgaenge` (z. B. `["Jg 1"]`), `stichwoerter`, `cover_image_path`, `solve_order` (`none` frei, `after_solving` nach Reihenfolge, `after_selfcorrection`, `after_teacher_correction`) |
| `scobees_update_lernpfad` | `id`*, dazu dieselben Felder; `in_bib` (Schalter „In schuleigener Bib veröffentlichen“); `subject_id` verschiebt in ein anderes Fach |
| `scobees_create_gliederung` | `parent_id`*, `name`*, `description_html` (h2, p, strong, em, u, a), `cover_image_path` (Kachelbild), `color` (Hex) |
| `scobees_update_gliederung` | `id`*, `name`, `description_html`, `cover_image_path`, `color`; nicht Angegebenes bleibt erhalten, auch Bild und Farbe |
| `scobees_create_wahlpflicht` | `parent_id`*, `name`*, `description_html`, `mindest_aufgaben`, `color`, `cover_image_path`; Unteraufgaben danach mit `scobees_create_aufgabe` und `parent_id` = Wahlpflicht-ID. Bestehende Aufgaben lassen sich ab scobees 94.6 auch mit `scobees_move` hineinschieben (live geprüft 11.11.2026) |
| `scobees_update_wahlpflicht` | `id`*, dieselben Felder |
| `scobees_create_aufgabe` | `parent_id`*, `name`*, `description_html`, `art`, `abgabeformen`, `aufgabentyp`, `arbeitsblatt_markdown` oder `serlo_json`, `estimated_time` (Minuten), `differenzierungen`, `links`, `interne_notiz`, `cover_image_path` (Kachelbild) |
| `scobees_update_aufgabe` | `id`*, dieselben Felder; nur Übergebenes ändert sich, `arbeitsblatt_markdown`/`serlo_json` ersetzen das Arbeitsblatt komplett |
| `scobees_patch_arbeitsblatt` | `id`*, `ersetzungen`* (Liste `{alt, neu}`). Ersetzt im aktuellen Arbeitsblatt-Markdown gezielt Zeichenketten statt alles neu zu senden – jede `alt` muss genau einmal vorkommen (alles oder nichts, sonst keine Änderung und Meldung, welche scheiterte). Nur bei verlustfrei als Markdown darstellbarem Arbeitsblatt (sonst Fehler mit Verweis auf `serlo_json`); Werkzeugergebnis kann ebenfalls `warnungen[]` enthalten `alt` und `neu` dürfen mehrzeilig sein (z. B. eine Abbildung nach einer Überschrift einfügen: `alt` = Überschrift, `neu` = Überschrift, Leerzeile, Bildzeile) und in Tabellenzeilen liegen |
| `scobees_upload_material` | `aufgabe_id`*, `file_path`* (absoluter lokaler Pfad), `als_musterloesung`, `ersetzt_attachment_id` (alten Anhang nach erfolgreichem Upload löschen) Liefert `hinweis_ansicht`, wenn der Anhang das Arbeitsblatt aus der Startansicht der Lernenden verdrängt |
| `scobees_delete_material` | `aufgabe_id`*, `attachment_id`* (aus `scobees_get_aufgabe` → `anhaenge[].id`/`musterloesungen[].id`), `confirm`* (muss `true` sein). Löscht genau einen Anhang oder eine Musterlösung; prüft die Zugehörigkeit und warnt, wenn es das letzte PDF einer Stift-Abgabe (`abgabeformen: pen`) ist |
| `scobees_upload_bild` | `file_path`* (PNG, JPG, GIF, WebP, SVG) → URL für `![Bildunterschrift](URL)` im Arbeitsblatt (öffentlich bei Serlo). Für Fachabbildungen und Situationsillustrationen; Herstellung in `references/abbildungen.md` |
| `scobees_move` | `id`*, `parent_id`*, `sort_order`* (0-basiert; auch in andere Gliederung desselben Pfads). Einzelne Aufgabe in eine Wahlpflichtaufgabe: geht, sie wird Unteraufgabe und verliert ihren Aufgabentyp (`warnung` im Ergebnis). Nicht möglich: Unteraufgabe aus der Wahlpflichtaufgabe heraus, Gliederung oder Wahlpflichtaufgabe in eine Wahlpflichtaufgabe |
| `scobees_delete` | `id`*, `confirm: true`* – löscht mit allen Unterelementen; vorher ausdrücklich bestätigen lassen |

## Aufgabenart `art` (richtet sich nach der Abgabe)

| `art` | Lernende sehen | Wann |
|---|---|---|
| `info` | keine Abgabe; abgeschlossen mit „Lernergebnis abgeben“ (bei `aufgabentyp: info` mit „Infoinput erledigt“) | Situation, Auftrag, reine Lesebausteine |
| `selbstkontrolle` | „Lernergebnis abgeben – bist du fertig?“ ohne Upload; Quiz prüft sich im Arbeitsblatt | Theorie mit Quiz (Standard) |
| `abgabe_optional` | Abgabe möglich (Datei, Stift-PDF oder Link), nicht erzwungen | Ergebnis erwünscht, aber nicht nötig |
| `abgabe_pflicht` | „Zum Abgeben musst du eine Datei hochladen“ bzw. „auf dem PDF schreiben“ | Handlungsergebnis |
| `abgabe_selbstkorrektur` | nach Abgabe Reiter „Selbstkorrektur“: eigene Abgabe neben der Musterlösung | Rechnung oder Skizze mit Musterlösung, Abgabe freiwillig |
| `abgabe_pflicht_selbstkorrektur` | wie oben, Abgabe erzwungen | Standard für Rechnungen und Entwürfe mit Musterlösung |

`abgabeformen`: `file` (Datei), `pen` (Stift auf PDF; braucht ein PDF als Material), `link` (Videolink). Mehrere = eine davon reicht. Die Serlo-Quizze haben mit der scobees-„Selbstkorrektur“ nichts zu tun; `selbstkontrolle` trägt deshalb bewusst kein Selbstkorrektur-Kennzeichen.

## Aufgabentyp `aufgabentyp`

`pflicht` (Standard, zählt zum Fortschritt) · `extra` (freiwillige Zusatzaufgabe) · `training` (freiwillige Übung) · `info` (Infobaustein). Andere Werte lehnt scobees ab.

## Status und Sichtbarkeit

- Neuer Pfad: in der schuleigenen Bib, Status INACTIVE; Aufgaben DRAFT. Das ist der Normalzustand, kein Mangel.
- Zugewiesener Pfad: Status ACTIVE an der Wurzel, `zugewiesen: true` in `scobees_get_lernpfad`. Der Status DRAFT einzelner Gliederungen und Aufgaben bedeutet nichts für die Sichtbarkeit: Nach der Zuweisung sehen Lernende alles, auch was danach über die Schnittstelle entsteht.
- Jedes schreibende Werkzeug meldet bei einem zugewiesenen Pfad `zugewiesen: true` und `warnung_zugewiesen`. An wen zugewiesen ist, gibt der Server nicht aus.
- Sichtbar für Lernende erst nach Zuweisung an eine Lerngruppe in der Weboberfläche; einen Aktivieren-Schalter gibt es nicht.
- Zuweisung scheitert mit „keine passende Fach-Differenzierung“, wenn Lernende im Fach des Pfads kein Niveau haben; Abhilfe: Niveau im Fach setzen oder Pfad in das Fach legen, in dem die Gruppe arbeitet.

## Vorschau und Adressen

- Lehrkräfte: `https://teach.scobees.com`, Lernende: `https://learn.scobees.com`.
- Ein Lernpfad öffnet sich direkt unter `https://teach.scobees.com/library/editor/<Lernpfad-ID>`.
- Vorschau: dort „Ansicht Lernende“ → Niveau wählen → Aufgabe anklicken. Quizze lassen sich ausprobieren, Eingaben werden nicht gespeichert, Abgaben lassen sich nicht testen.
- Anmelden muss sich die Lehrkraft selbst.

## Was Lernende sehen (Dummy-Konto, scobees 94.6)

- Weg: Lernplaner → Lernbereich → Fach → Lernpfad. In der Fachübersicht stehen die Lernpfade als kleine Kacheln mit abgeschnittenem Titel.
- Lernpfad: Titelbild, Titel, Fortschritt, Beschreibung unter „Was ist zu tun“. Darunter je Gliederung eine Karte mit Kachelbild, Zeit und Fortschritt; aufgeklappt zeigt sie ihre Beschreibung und die Aufgaben als kleine Kacheln mit Symbol für Pflicht, Training, Extra oder Wahl.
- Fortschritt zählt Pflichtaufgaben und Wahlpflichtaufgaben (sobald die geforderte Anzahl gelöst ist); Training und Extra zählen nicht.
- Wahlpflichtaufgaben stehen als eigener Block unter den übrigen Aufgaben der Gliederung.
- Aufgabe: links das Arbeitsblatt (bei Stift-Abgabe das PDF), rechts Zeit, „Worum geht's“ (Beschreibung) und Materialien; unten „Lernergebnis abgeben“.
- Abgabe mit Selbstkorrektur: Nach dem Abgeben öffnet sich der Reiter „Selbstkorrektur“ mit dem eigenen Ergebnis links (mit Stift kommentierbar) und der Musterlösung rechts; „Ich habe alles kontrolliert“ schließt ab, danach folgt die Reflexion.
- „Nach Reihenfolge“ und „nach Lehrerkorrektur“ haben im Test keine Aufgabe gesperrt.
- Material: Der erste Anhang steht links statt des Arbeitsblatts; das Arbeitsblatt ist die letzte Kachel („Serlo-Inhalt“). Ein Wechsel zwischen den Kacheln leert die Quizfelder. Bilder öffnen sich in einem Betrachter mit Zoom, HTML-Dateien laufen eingebettet (Skripte ja; Speichern, Formulare, neue Fenster nein), Links zeigen „Hier weiter zum Link“.
- Niveaus: Aufgaben mit einem anderen Niveau als dem des Lernenden fehlen in seiner Ansicht.
- Videolink-Abgabe: Eingabefeld „Link zu deinem Ergebnis (Video)“ rechts neben dem Arbeitsblatt.
- Eine vollständig erledigte Gliederung zeigt statt ihres Kachelbilds einen Haken.

## Kachelbilder (`cover_image_path`)

Lernpfad, Gliederung, Wahlpflichtaufgabe und Aufgabe können ein eigenes Kachelbild tragen; ohne Bild zeigt scobees das Standardbild (Kompass). Kachelbilder sind Schmuck und Orientierung und damit optional – anders als die Abbildungen im Arbeitsblatt, die zum Lerninhalt gehören und immer entstehen (`references/abbildungen.md`). Regeln:

- PNG oder JPG als lokaler Pfad; quadratisch anlegen, weil scobees die Kachel quadratisch beschneidet; Motiv muss klein erkennbar bleiben (keine feinen Details, kein Fließtext im Bild): Lernende sehen das Titelbild in der Fachübersicht und die Aufgaben-Kachel nur etwa daumennagelgroß, die Gliederungs-Kachel etwa briefmarkengroß.
- Nur für die Ebenen erzeugen, die die Lehrkraft in Schritt 1 des Skills freigegeben hat – jedes Bild kostet deutlich mehr Rechenaufwand als Text.
- Ein gesetztes Bild bleibt bei späteren Änderungen erhalten; ein neues `cover_image_path` ersetzt es (bei Aufgaben wird die alte Bilddatei dabei entfernt).
- Kachelbilder liegen in scobees (nicht öffentlich wie Arbeitsblatt-Bilder bei Serlo), trotzdem keine Personenfotos.
- Alle Anlege- und Änderungswerkzeuge melden `hat_titelbild` im Ergebnis, und `scobees_get_lernpfad` zeigt es je Element; so lässt sich prüfen, ob alle vereinbarten Kachelbilder sitzen.
- Die Icon-Bibliothek der Schule („Icon aus Library auswählen“ in der Weboberfläche) bedient der Server nicht; ein dort gewähltes Icon bleibt aber beim Ändern erhalten.
