# Werkzeuge des Servers scobees-mcp (Stand 0.1.20)

Parameternamen sind verbindlich; der Server weist unbekannte Namen und ungültige Werte mit einer Fehlermeldung ab (Alias: `abgabeform` → `abgabeformen`). Die Antwort eines Schreibaufrufs enthält die neue `LI-…`-ID, die du für Unterelemente und Material brauchst.

## Lesen

| Werkzeug | Zweck | Wichtige Parameter |
|---|---|---|
| `scobees_me` | Anmeldung prüfen, scobees-Version gegen geprüfte Version; `server.version` = laufende Fassung des Servers (neuer als der Stand dieses Skills → Skill neu laden) | – |
| `scobees_list_workspaces` | Lernbereiche (Kacheln der Bib) mit Fächern | – |
| `scobees_list_subjects` | Fächer; die Lehrkraft wählt das Fach | `workspace_id` |
| `scobees_list_tags` | Jahrgänge und Niveaus der Schule | – |
| `scobees_list_lernpfade` | Bestehende Pfade finden, auch die anderer Lehrkräfte; je Pfad `eigener`, `mitbearbeiter`, `zugewiesen` | `subject_id`, `title`, `page`, `page_size` |
| `scobees_get_lernpfad` | Baum Gliederungen → Aufgaben mit IDs; an der Wurzel `zugewiesen`, `eigener`, `mitbearbeiter`, die vollständige Beschreibung und bei Lücken `warnung_niveaus` mit `aufgaben_ohne_alle_niveaus`; je Element `hat_titelbild`, je Aufgabe `differenzierungen` | `id` |
| `scobees_get_aufgabe` | Eine Aufgabe mit Arbeitsblatt als Markdown, Links, Anhängen; liefert `art`, `abgabeformen` (mit `abgabeformen_hinweis`, wenn abgeleitet), `abgabe_regel`, `taskType`, `interne_notiz`, `titelbild`, `lernpfad_zugewiesen`, ATT-IDs der Anhänge und Musterlösungen | `id`, `mit_serlo_json` |
| `scobees_markdown_vorschau` | Markdown → Serlo-Bausteine ohne Speichern; `warnungen[]` bei Unterstrich-Betonung (wird zu `*…*`) oder `$…$` in einer Lückenantwort (wird abgeschnitten, Serlo zeigt dort nie Formeln) | `markdown` |

## Anlegen und ändern

| Werkzeug | Parameter (Pflicht mit *) |
|---|---|
| `scobees_create_lernpfad` | `subject_id`*, `name`*, `description` (**reiner Text** – scobees rendert hier kein HTML, Tags würden sichtbar; wird notfalls automatisch entfernt), `jahrgaenge` (z. B. `["Jg 1"]`), `stichwoerter`, `cover_image_path`, `solve_order` (wirkt nicht auf Aufgaben in Gliederungen; die Reihenfolge wird an der Gliederung gesetzt) |
| `scobees_update_lernpfad` | `id`*, dazu dieselben Felder; `beschreibung_ersetzungen`; `in_bib` (Schalter „In schuleigener Bib veröffentlichen“); `subject_id` verschiebt in ein anderes Fach |
| `scobees_create_gliederung` | `parent_id`*, `name`*, `description_html` (h2, p, strong, em, u, a), `cover_image_path` (Kachelbild), `color` (Hex), `solve_order` (`none` frei, `after_solving` nach Reihenfolge: jede Aufgabe bleibt gesperrt, bis die davor abgegeben ist; `after_selfcorrection`, `after_teacher_correction`) |
| `scobees_update_gliederung` | `id`*, `name`, `description_html` oder `beschreibung_ersetzungen`, `cover_image_path`, `color`, `solve_order`; nicht Angegebenes bleibt erhalten, auch Bild, Farbe und Reihenfolge |
| `scobees_create_wahlpflicht` | `parent_id`*, `name`*, `description_html`, `mindest_aufgaben`, `color`, `cover_image_path`; Unteraufgaben danach mit `scobees_create_aufgabe` und `parent_id` = Wahlpflicht-ID. Bestehende Aufgaben lassen sich ab scobees 94.6 auch mit `scobees_move` hineinschieben (live geprüft 11.11.2026) |
| `scobees_update_wahlpflicht` | `id`*, dieselben Felder; `beschreibung_ersetzungen` |
| `scobees_create_aufgabe` | `parent_id`*, `name`*, `description_html`, `art`, `abgabeformen`, `aufgabentyp`, `arbeitsblatt_markdown` oder `serlo_json`, `estimated_time` (Minuten), `differenzierungen`, `links`, `interne_notiz`, `cover_image_path` (Kachelbild) |
| `scobees_update_aufgabe` | `id`*, dieselben Felder; nur Übergebenes ändert sich, `arbeitsblatt_markdown`/`serlo_json` ersetzen das Arbeitsblatt komplett. `beschreibung_ersetzungen` (Liste `{alt, neu}`) ändert einzelne Stellen der Beschreibung nach denselben Regeln wie `scobees_patch_arbeitsblatt`: jede `alt` genau einmal, alles oder nichts, leeres `neu` löscht (z. B. einen leeren Listenpunkt `<li></li>`). `alt` muss so dastehen, wie die Beschreibung gespeichert ist (`beschreibung_html` aus `scobees_get_aufgabe`); passt eine Stelle nicht, nennt die Fehlermeldung den gespeicherten Wortlaut. Nicht zusammen mit `description_html` |
| `scobees_patch_arbeitsblatt` | `id`*, `ersetzungen`* (Liste `{alt, neu}`). Ersetzt im aktuellen Arbeitsblatt-Markdown gezielt Zeichenketten statt alles neu zu senden – jede `alt` muss genau einmal vorkommen (alles oder nichts, sonst keine Änderung und Meldung, welche scheiterte). Nur bei verlustfrei als Markdown darstellbarem Arbeitsblatt (sonst Fehler mit Verweis auf `serlo_json`); Werkzeugergebnis kann ebenfalls `warnungen[]` enthalten `alt` und `neu` dürfen mehrzeilig sein (z. B. eine Abbildung nach einer Überschrift einfügen: `alt` = Überschrift, `neu` = Überschrift, Leerzeile, Bildzeile) und in Tabellenzeilen liegen. Ein mehrzeiliges `alt` mit leerem `neu` entfernt ganze Absätze samt Leerzeilen |
| `scobees_upload_material` | `aufgabe_id`*, `file_path`* (absoluter lokaler Pfad), `als_musterloesung`, `ersetzt_attachment_id` (alten Anhang nach erfolgreichem Upload löschen) Liefert `hinweis_ansicht`, wenn der Anhang das Arbeitsblatt aus der Startansicht der Lernenden verdrängt |
| `scobees_delete_material` | `aufgabe_id`*, `attachment_id`* (aus `scobees_get_aufgabe` → `anhaenge[].id`/`musterloesungen[].id`), `confirm`* (muss `true` sein). Löscht genau einen Anhang oder eine Musterlösung; prüft die Zugehörigkeit und warnt, wenn es das letzte PDF einer Stift-Abgabe (`abgabeformen: pen`) ist |
| `scobees_upload_bild` | `file_path`* (PNG, JPG, GIF, WebP, SVG) → URL für `![Bildunterschrift](URL)` im Arbeitsblatt (öffentlich bei Serlo). Für Fachabbildungen und Situationsillustrationen; Herstellung in `references/abbildungen.md` |
| `scobees_move` | `id`*, `parent_id`*, `sort_order`* (0-basiert; auch in andere Gliederung desselben Pfads; Arbeitsblatt, Kachelbild und Anhänge gehen mit). Einzelne Aufgabe in eine Wahlpflichtaufgabe: geht, sie wird Unteraufgabe und verliert ihren Aufgabentyp (`warnung` im Ergebnis). Nicht möglich: Unteraufgabe aus der Wahlpflichtaufgabe heraus, Gliederung oder Wahlpflichtaufgabe in eine Wahlpflichtaufgabe |
| `scobees_copy_aufgabe` | `id`* (Quelle), `parent_id`* (Gliederung oder Lernpfad, auch in einem anderen Lernpfad oder Fach), `sort_order` (ohne Angabe ans Ende), `name`, `description_html`, `ersetzungen` (wie bei `scobees_patch_arbeitsblatt`; passt eine nicht genau einmal, wird gar nicht kopiert). scobees kopiert Beschreibung, Arbeitsblatt, Anhänge, Musterlösungen, Kachelbild und alle Einstellungen; die Kopie ist unabhängig vom Original. Nicht für Unteraufgaben einer Wahlpflichtaufgabe; das Ziel ist nie eine Wahlpflichtaufgabe (erst kopieren, dann `scobees_move`) |
| `scobees_delete` | `id`*, `confirm: true`*, `auch_wenn_zugewiesen`. Ganzer Lernpfad: samt Inhalt, aber nur wenn nicht zugewiesen. Gliederung und Wahlpflichtaufgabe: nur leer. Einzelne Aufgabe: immer; in einem zugewiesenen Lernpfad nur mit `auch_wenn_zugewiesen: true` (verschwindet sofort bei den Lernenden, auch mit Abgaben) |

## Aufgabenart `art` (richtet sich nach der Abgabe)

| `art` | Lernende sehen | Wann |
|---|---|---|
| `info` | keine Abgabe; abgeschlossen mit „Lernergebnis abgeben“ (bei `aufgabentyp: info` mit „Infoinput erledigt“) | Situation, Auftrag, reine Lesebausteine |
| `selbstkontrolle` | „Lernergebnis abgeben – bist du fertig?“ ohne Upload; Quiz prüft sich im Arbeitsblatt | Theorie mit Quiz (Standard) |
| `abgabe_optional` | Abgabe möglich (Datei, Stift-PDF oder Link), nicht erzwungen | Ergebnis erwünscht, aber nicht nötig. Nicht für Aufgaben ohne Arbeitsblatt: Dort bleibt „Lernergebnis abgeben“ gesperrt, bis etwas hochgeladen ist |
| `abgabe_pflicht` | „Zum Abgeben musst du eine Datei hochladen“ bzw. „auf dem PDF schreiben“ | Handlungsergebnis |
| `abgabe_selbstkorrektur` | nach Abgabe Reiter „Selbstkorrektur“: eigene Abgabe neben der Musterlösung | Rechnung oder Skizze mit Musterlösung, Abgabe freiwillig |
| `abgabe_pflicht_selbstkorrektur` | wie oben, Abgabe erzwungen | Standard für Rechnungen und Entwürfe mit Musterlösung |

`abgabeformen`: `file` (Datei), `pen` (Stift auf PDF; braucht ein PDF als Material), `link` (Videolink). Mehrere = eine davon reicht. `pen` allein verlangt mindestens einen Strich mit den Stiftwerkzeugen von scobees; eine hochgeladene Datei zählt dann nicht (so steht es im Code der Schülerseite, und so ist es im Unterricht aufgefallen). Für PDF-Vorlagen deshalb `["file", "pen"]`. Aufgaben aus der Weboberfläche tragen oft keine gespeicherte Liste, obwohl sie eine Abgabe verlangen; `scobees_get_aufgabe` leitet die Formen dann aus den Schaltern der Aufgabe ab und sagt das in `abgabeformen_hinweis`. Mit einem Dummy-Konto geprüft: Lernende sehen dort „Zum Abgeben musst du eine Datei hochladen“. Die Serlo-Quizze haben mit der scobees-„Selbstkorrektur“ nichts zu tun; `selbstkontrolle` trägt deshalb bewusst kein Selbstkorrektur-Kennzeichen.

## Aufgabentyp `aufgabentyp`

`pflicht` (Standard, zählt zum Fortschritt) · `extra` (freiwillige Zusatzaufgabe) · `training` (freiwillige Übung) · `info` (Infobaustein). Andere Werte lehnt scobees ab.

## Status und Sichtbarkeit

- Neuer Pfad: in der schuleigenen Bib (`isPublished: true`), Status INACTIVE. Das ist der Normalzustand, kein Mangel.
- Zugewiesener Pfad: Status ACTIVE an der Wurzel, `zugewiesen: true` in `scobees_get_lernpfad`, `lernpfad_zugewiesen: true` in `scobees_get_aufgabe`.
- Einen eigenen Status haben Gliederungen und Aufgaben nicht; der Server gibt deshalb keinen aus. scobees führt dort zwar Felder (`state`, `isPublished`), sie sagen aber nichts: Im Baum steht der Wert der Wurzel, beim Einzelabruf „DRAFT“, und der Bib-Schalter ist bei Aufgaben immer aus. Die Weboberfläche zeigt „Entwurf“ auch an Aufgaben, mit denen eine Klasse arbeitet.
- Ob Lernende eine Aufgabe sehen, entscheiden zwei Dinge: Der Lernpfad ist zugewiesen, und die Aufgabe trägt das Niveau der Lernenden. Nach der Zuweisung sehen sie alles, was ihr Niveau trägt, auch was danach über die Schnittstelle entsteht. Fehlen Niveaus, meldet `scobees_get_lernpfad` das als `warnung_niveaus`.
- Jedes schreibende Werkzeug meldet bei einem zugewiesenen Pfad `zugewiesen: true` und `warnung_zugewiesen`. An wen zugewiesen ist, gibt der Server nicht aus.
- Sichtbar für Lernende erst nach Zuweisung an eine Lerngruppe in der Weboberfläche; einen Aktivieren-Schalter gibt es nicht.
- Zuweisung scheitert mit „keine passende Fach-Differenzierung“, wenn Lernende im Fach des Pfads kein Niveau haben; Abhilfe: Niveau im Fach setzen oder Pfad in das Fach legen, in dem die Gruppe arbeitet.

## Vorschau und Adressen

- Lehrkräfte: `https://teach.scobees.com`, Lernende: `https://learn.scobees.com`.
- Ein Lernpfad öffnet sich direkt unter `https://teach.scobees.com/library/editor/<Lernpfad-ID>`.
- Vorschau: dort „Ansicht Lernende“ → Niveau wählen → Aufgabe anklicken. Quizze lassen sich ausprobieren, Eingaben werden nicht gespeichert, Abgaben lassen sich nicht testen; die Stiftwerkzeuge einer Stift-Abgabe erscheinen in der Vorschau nicht.
- Anmelden muss sich die Lehrkraft selbst.

## Was Lernende sehen (Dummy-Konto, scobees 94.6)

- Weg: Lernplaner → Lernbereich → Fach → Lernpfad. In der Fachübersicht stehen die Lernpfade als kleine Kacheln mit abgeschnittenem Titel.
- Lernpfad: Titelbild, Titel, Fortschritt, Beschreibung unter „Was ist zu tun“. Darunter je Gliederung eine Karte mit Kachelbild, Zeit und Fortschritt; aufgeklappt zeigt sie ihre Beschreibung und die Aufgaben als kleine Kacheln mit Symbol für Pflicht, Training, Extra oder Wahl.
- Fortschritt zählt Pflichtaufgaben und Wahlpflichtaufgaben (sobald die geforderte Anzahl gelöst ist); Training und Extra zählen nicht.
- Wahlpflichtaufgaben stehen als eigener Block unter den übrigen Aufgaben der Gliederung.
- Aufgabe: links das Arbeitsblatt (bei Stift-Abgabe das PDF), rechts Zeit, „Worum geht's“ (Beschreibung) und Materialien; unten „Lernergebnis abgeben“.
- Abgabe mit Selbstkorrektur: Nach dem Abgeben öffnet sich der Reiter „Selbstkorrektur“ mit dem eigenen Ergebnis links (mit Stift kommentierbar) und der Musterlösung rechts; „Ich habe alles kontrolliert“ schließt ab, danach folgt die Reflexion.
- Bearbeitungsreihenfolge: Steht „nach Reihenfolge“ an der Gliederung, sind alle Aufgaben nach der ersten offenen gesperrt (graue Kachel mit Schloss, ein Klick bewirkt nichts); mit jeder Abgabe wird die nächste frei. Dieselbe Einstellung nur am Lernpfad hat keine Aufgabe in einer Gliederung gesperrt.
- Material: Der erste Anhang steht links statt des Arbeitsblatts; das Arbeitsblatt ist die letzte Kachel („Serlo-Inhalt“). Ein Wechsel zwischen den Kacheln leert die Quizfelder. Bilder öffnen sich in einem Betrachter mit Zoom, HTML-Dateien laufen eingebettet (Skripte ja; Speichern, Formulare, neue Fenster nein), Links zeigen „Hier weiter zum Link“. Eine Aufgabe ohne Arbeitsblatt zeigt nur ihren Anhang; die Kachel „Serlo-Inhalt“ fehlt dann.
- Stift-Abgabe: Stiftwerkzeuge über dem PDF, Hinweis „Zum Abgeben musst du auf dem PDF schreiben“ (mit Datei als zweiter Form: „… oder eine Datei hochladen“). Formularfelder im PDF werden nur als Kästchen dargestellt; tippen lässt sich darin nicht, mit dem Stift hineinschreiben schon.
- Niveaus: Aufgaben mit einem anderen Niveau als dem des Lernenden fehlen in seiner Ansicht.
- Videolink-Abgabe: Eingabefeld „Link zu deinem Ergebnis (Video)“ rechts neben dem Arbeitsblatt.
- Datei-Abgabe: Nach dem Hochladen zeigt nur ein Zähler an der Schaltfläche „Datei hochladen“, dass eine Datei bereitliegt; eine Vorschau gibt es vor der Abgabe nicht. Nach der Abgabe zeigt der Reiter „Aufgabe“ die eigenen Ergebnisse (Bild des Arbeitsblatts und die Datei); erneut abgeben können Lernende nicht.
- Eine vollständig erledigte Gliederung zeigt statt ihres Kachelbilds einen Haken.
- Die Texte der Oberfläche stehen immer in der Du-Form („Hier kannst du dir die Datei herunterladen“), auch wenn der Lernpfad in der Sie-Form geschrieben ist.

## Was eine Änderung an einer laufenden Aufgabe bewirkt (Dummy-Konto, scobees 95.4)

Geprüft an einem zugewiesenen Testpfad: Aufgaben abgegeben, als erledigt markiert und angefangen, danach über die Schnittstelle geändert.

- **Quiz-Eingaben speichert scobees nicht.** Ein Neuladen leert alle Felder, auch ohne jede Änderung der Lehrkraft. Erhalten bleibt nur die Startzeit.
- **Aufgabe gerade geöffnet:** Die Seite ändert sich nicht von selbst. Der neue Stand erscheint beim nächsten Öffnen oder Neuladen, dann mit leeren Feldern.
- **Abgegebene oder erledigte Aufgabe bleibt abgegeben.** Geprüft für: geänderte Textstelle, komplett ersetztes Arbeitsblatt, neue Beschreibung, neuer Name, neue Zeit, anderer Platz in der Gliederung, Umzug in eine andere Gliederung, andere Abgabeform (Link → Datei), andere Art (Info → Pflichtabgabe). Der Fortschritt rechnet mit dem neuen Aufbau weiter.
- **Was Lernende danach sehen:** unter „Aufgabe“ das Bild ihres Arbeitsblatts im Zustand der Abgabe, also den alten Wortlaut mit ihren Antworten; unter „Worum geht's“ die neue Beschreibung. Erneut abgeben können sie nicht.
- **Folge:** Nach einer inhaltlichen Änderung passen Abgabe und Aufgabe nicht mehr zusammen, und nichts weist Lernende darauf hin. Eine als Info erledigte Aufgabe, die nachträglich zur Pflichtabgabe wird, gilt weiter als erledigt, obwohl nie etwas abgegeben wurde. Soll neu bearbeitet werden, setzt die Lehrkraft die Aufgabe in der Lerndoku zurück.
- **Abgabeform gewechselt:** Ein abgegebener Link wird Lernenden nicht mehr angezeigt, sobald die Aufgabe keine Link-Abgabe mehr vorsieht.
- **Niveau entfernt:** Die Aufgabe verschwindet bei Lernenden dieses Niveaus sofort aus der Ansicht, auch wenn sie abgegeben ist; der Fortschritt wird ohne sie berechnet. Trägt man das Niveau wieder ein, ist sie samt Abgabe zurück.
- **Beschreibungen von Lernpfad und Gliederung** („Was ist zu tun“) erscheinen nach dem Neuladen im neuen Wortlaut.
- Nicht geprüft: wie die Lehrkraft eine Abgabe zu einer geänderten Aufgabe in der Lerndoku sieht; dort greifen Server und Skill nie zu.

## Was die Lehrkraft von einer Abgabe sieht (Lerndoku, scobees 94.6)

Der Server und der Skill greifen auf diesen Bereich nie zu; die Angaben stammen von der Lehrkraft und dienen dazu, Aufgaben passend zu bauen.

- Auswertung je Lernender und je Aufgabe. In der Matrix „Lernergebnisse pro Aufgabe“ stehen die Aufgabentitel nur mit etwa 13 Zeichen, Lernpfad und Gliederung ebenfalls gekürzt; filtern lässt sich nach Fach und Niveau.
- Zu jeder abgegebenen Aufgabe: das Bild des Arbeitsblatts im Zustand der Abgabe (auch bei Selbstkontrolle), bei Stift-Abgaben das beschriftete PDF, hochgeladene Dateien, die Selbstkorrektur, das Material der Aufgabe und die Musterlösung („Es wurde keine Musterlösung bereitgestellt“, wenn keine hochgeladen ist).
- Rückmeldung: Text bis 2000 Zeichen, Sprachnachricht, Anmerkungen mit dem Stift direkt im Ergebnis; dazu „Angesehen“ und „Wiederholen“.
- Aufgabenstatus: „Lernergebnis zurücksetzen“, „Lernergebnis ergänzen“, „Aufgabe komplett zurücksetzen“, ebenso für die Selbstkorrektur. Damit kann die Lehrkraft eine Aufgabe nach einer Änderung neu bearbeiten lassen.
- Zuweisen: immer der ganze Lernpfad, an Klasse oder Gruppe, nach Differenzierungen oder gezielt an einzelne Lernende; Fach und optionale Wochenfrist. Eine Einstellung zur Bearbeitungsreihenfolge gibt es dort nicht.

## Kachelbilder (`cover_image_path`)

Lernpfad, Gliederung, Wahlpflichtaufgabe und Aufgabe können ein eigenes Kachelbild tragen; ohne Bild zeigt scobees das Standardbild (Kompass). Kachelbilder sind Schmuck und Orientierung und damit optional – anders als die Abbildungen im Arbeitsblatt, die zum Lerninhalt gehören und immer entstehen (`references/abbildungen.md`). Regeln:

- PNG oder JPG als lokaler Pfad; quadratisch anlegen, weil scobees die Kachel quadratisch beschneidet; Motiv muss klein erkennbar bleiben (keine feinen Details, kein Fließtext im Bild): Lernende sehen das Titelbild in der Fachübersicht und die Aufgaben-Kachel nur etwa daumennagelgroß, die Gliederungs-Kachel etwa briefmarkengroß.
- Nur für die Ebenen erzeugen, die die Lehrkraft in Schritt 1 des Skills freigegeben hat – jedes Bild kostet deutlich mehr Rechenaufwand als Text.
- Der Server liest die Datei von dem Rechner, auf dem er läuft. Aus einer Cloud-Sitzung heraus: Datei in den verbundenen Ordner schreiben und als `cover_image_path` den Pfad angeben, unter dem dieser Ordner auf dem Rechner der Lehrkraft liegt (unter Windows `C:\\…`). Dasselbe gilt für `file_path` bei Material und Bildern. In der Praxis bestätigt.
- Ein gesetztes Bild bleibt bei späteren Änderungen erhalten; ein neues `cover_image_path` ersetzt es (bei Aufgaben wird die alte Bilddatei dabei entfernt).
- Kachelbilder liegen in scobees (nicht öffentlich wie Arbeitsblatt-Bilder bei Serlo), trotzdem keine Personenfotos.
- Alle Anlege- und Änderungswerkzeuge melden `hat_titelbild` im Ergebnis, und `scobees_get_lernpfad` zeigt es je Element; so lässt sich prüfen, ob alle vereinbarten Kachelbilder sitzen.
- Die Icon-Bibliothek der Schule („Icon aus Library auswählen“ in der Weboberfläche) bedient der Server nicht; ein dort gewähltes Icon bleibt aber beim Ändern erhalten.
