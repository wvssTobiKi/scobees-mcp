# Werkzeuge des Servers scobees-mcp (Stand 0.1.4)

Parameternamen sind verbindlich; der Server weist unbekannte Namen und ungültige Werte mit einer Fehlermeldung ab (Alias: `abgabeform` → `abgabeformen`). Die Antwort eines Schreibaufrufs enthält die neue `LI-…`-ID, die du für Unterelemente und Material brauchst.

## Lesen

| Werkzeug | Zweck | Wichtige Parameter |
|---|---|---|
| `scobees_me` | Anmeldung prüfen, scobees-Version gegen geprüfte Version | – |
| `scobees_list_workspaces` | Lernbereiche (Kacheln der Bib) mit Fächern | – |
| `scobees_list_subjects` | Fächer; die Lehrkraft wählt das Fach | `workspace_id` |
| `scobees_list_tags` | Jahrgänge und Niveaus der Schule | – |
| `scobees_list_lernpfade` | Bestehende Pfade finden | `subject_id`, `title`, `page`, `page_size` |
| `scobees_get_lernpfad` | Baum Gliederungen → Aufgaben mit IDs | `id` |
| `scobees_get_aufgabe` | Eine Aufgabe mit Arbeitsblatt als Markdown, Links, Anhängen; liefert `art`, `abgabeformen`, `abgabe_regel`, `taskType`, `interne_notiz` | `id`, `mit_serlo_json` |
| `scobees_markdown_vorschau` | Markdown → Serlo-Bausteine ohne Speichern | `markdown` |

## Anlegen und ändern

| Werkzeug | Parameter (Pflicht mit *) |
|---|---|
| `scobees_create_lernpfad` | `subject_id`*, `name`*, `description`, `jahrgaenge` (z. B. `["Jg 1"]`), `stichwoerter`, `cover_image_path`, `solve_order` (`none` frei, `after_solving` nach Reihenfolge, `after_selfcorrection`, `after_teacher_correction`) |
| `scobees_update_lernpfad` | `id`*, dazu dieselben Felder; `in_bib` (Schalter „In schuleigener Bib veröffentlichen“); `subject_id` verschiebt in ein anderes Fach |
| `scobees_create_gliederung` | `parent_id`*, `name`*, `description_html` (h2, p, strong, em, u, a) |
| `scobees_update_gliederung` | `id`*, `name`, `description_html` |
| `scobees_create_wahlpflicht` | `parent_id`*, `name`*, `description_html`, `mindest_aufgaben`, `color`, `cover_image_path`; Unteraufgaben danach mit `scobees_create_aufgabe` und `parent_id` = Wahlpflicht-ID |
| `scobees_update_wahlpflicht` | `id`*, dieselben Felder |
| `scobees_create_aufgabe` | `parent_id`*, `name`*, `description_html`, `art`, `abgabeformen`, `aufgabentyp`, `arbeitsblatt_markdown` oder `serlo_json`, `estimated_time` (Minuten), `differenzierungen`, `links`, `interne_notiz` |
| `scobees_update_aufgabe` | `id`*, dieselben Felder; nur Übergebenes ändert sich, `arbeitsblatt_markdown`/`serlo_json` ersetzen das Arbeitsblatt komplett |
| `scobees_upload_material` | `aufgabe_id`*, `file_path`* (absoluter lokaler Pfad), `als_musterloesung` |
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
