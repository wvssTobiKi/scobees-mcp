# Werkzeuge des Servers scobees-mcp (Stand 0.1.9)

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
| `scobees_create_wahlpflicht` | `parent_id`*, `name`*, `description_html`, `mindest_aufgaben`, `color`, `cover_image_path`; Unteraufgaben danach mit `scobees_create_aufgabe` und `parent_id` = Wahlpflicht-ID. Nur `scobees_move` in eine Wahlpflichtaufgabe bleibt gesperrt (scobees-Grenze, live geprüft 04.11.2026/v94.2) – eine bestehende Aufgabe dafür neu anlegen statt verschieben |
| `scobees_update_wahlpflicht` | `id`*, dieselben Felder |
| `scobees_create_aufgabe` | `parent_id`*, `name`*, `description_html`, `art`, `abgabeformen`, `aufgabentyp`, `arbeitsblatt_markdown` oder `serlo_json`, `estimated_time` (Minuten), `differenzierungen`, `links`, `interne_notiz`, `cover_image_path` (Kachelbild) |
| `scobees_update_aufgabe` | `id`*, dieselben Felder; nur Übergebenes ändert sich, `arbeitsblatt_markdown`/`serlo_json` ersetzen das Arbeitsblatt komplett |
| `scobees_patch_arbeitsblatt` | `id`*, `ersetzungen`* (Liste `{alt, neu}`). Ersetzt im aktuellen Arbeitsblatt-Markdown gezielt Zeichenketten statt alles neu zu senden – jede `alt` muss genau einmal vorkommen (alles oder nichts, sonst keine Änderung und Meldung, welche scheiterte). Nur bei verlustfrei als Markdown darstellbarem Arbeitsblatt (sonst Fehler mit Verweis auf `serlo_json`); Werkzeugergebnis kann ebenfalls `warnungen[]` enthalten |
| `scobees_upload_material` | `aufgabe_id`*, `file_path`* (absoluter lokaler Pfad), `als_musterloesung`, `ersetzt_attachment_id` (alten Anhang nach erfolgreichem Upload löschen) |
| `scobees_delete_material` | `aufgabe_id`*, `attachment_id`* (aus `scobees_get_aufgabe` → `anhaenge[].id`/`musterloesungen[].id`), `confirm`* (muss `true` sein). Löscht genau einen Anhang oder eine Musterlösung; prüft die Zugehörigkeit und warnt, wenn es das letzte PDF einer Stift-Abgabe (`abgabeformen: pen`) ist |
| `scobees_upload_bild` | `file_path`* → URL für `![…](URL)` im Arbeitsblatt (öffentlich bei Serlo) |
| `scobees_move` | `id`*, `parent_id`*, `sort_order`* (0-basiert; auch in andere Gliederung desselben Pfads) |
| `scobees_delete` | `id`*, `confirm: true`* – löscht mit allen Unterelementen; vorher ausdrücklich bestätigen lassen |

## Aufgabenart `art` (richtet sich nach der Abgabe)

| `art` | Lernende sehen | Wann |
|---|---|---|
| `info` | Schaltfläche „Infoinput erledigt“ | Situation, Auftrag, reine Lesebausteine |
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
- Sichtbar für Lernende erst nach Zuweisung an eine Lerngruppe in der Weboberfläche; einen Aktivieren-Schalter gibt es nicht.
- Zuweisung scheitert mit „keine passende Fach-Differenzierung“, wenn Lernende im Fach des Pfads kein Niveau haben; Abhilfe: Niveau im Fach setzen oder Pfad in das Fach legen, in dem die Gruppe arbeitet.

## Kachelbilder (`cover_image_path`)

Lernpfad, Gliederung, Wahlpflichtaufgabe und Aufgabe können ein eigenes Kachelbild tragen; ohne Bild zeigt scobees das Standardbild (Kompass). Regeln:

- PNG oder JPG als lokaler Pfad; quadratisch anlegen, weil scobees die Kachel quadratisch beschneidet; Motiv muss klein erkennbar bleiben (keine feinen Details, kein Fließtext im Bild).
- Nur für die Ebenen erzeugen, die die Lehrkraft in Schritt 1 des Skills freigegeben hat – jedes Bild kostet deutlich mehr Rechenaufwand als Text.
- Ein gesetztes Bild bleibt bei späteren Änderungen erhalten; ein neues `cover_image_path` ersetzt es (bei Aufgaben wird die alte Bilddatei dabei entfernt).
- Kachelbilder liegen in scobees (nicht öffentlich wie Arbeitsblatt-Bilder bei Serlo), trotzdem keine Personenfotos.
- `scobees_get_lernpfad` zeigt je Element `hat_titelbild`, damit sich nach dem Anlegen prüfen lässt, ob alle vereinbarten Bilder sitzen.
- Die Icon-Bibliothek der Schule („Icon aus Library auswählen“ in der Weboberfläche) bedient der Server nicht; ein dort gewähltes Icon bleibt aber beim Ändern erhalten.
