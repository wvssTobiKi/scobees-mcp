# Notizen für den Skill „Lernpfad mit scobees aufbauen“

Gesammelt aus den ersten Praxisläufen (27.10.2026, Lernpfad „Datensicherheit mit RAID“, Fach „PB IT-Systeme kennenlernen und konfigurieren“). Jede Beobachtung ist zugeordnet: **Server** (im MCP-Server geändert) oder **Skill** (gehört in die Anleitung für Claude beim Kursaufbau).

## Aus dem ersten Praxislauf

| Beobachtung | Ort | Stand |
|---|---|---|
| „Wahlaufgabe“ löste HTTP 500 aus | Server | behoben: `aufgabentyp` = pflicht / extra / training / info (so heißen die Typen in scobees; „Wahlaufgabe“ gibt es nicht) |
| Drag-and-drop-Lückentext „brachte den Server zum Absturz“ | Server/Skill | `quiz-blanks-dnd` funktioniert (live geprüft). Der Fehler war vermutlich ein Markdown ohne `[[…]]`-Lücke → Fehlermeldung „keine Lücke gefunden“. Skill: Format `Text [[Antwort]] Text`, Distraktoren je Zeile `+ falsch`; echte Bild-Zuordnung (dropzoneImage) gibt es nur per Serlo-JSON |
| Unklar, was abzugeben ist | Skill | Jede Aufgabe mit Ergebnis braucht `art: abgabe_*` **und** einen Satz in `description_html`: „Gib … als … ab.“ `art: info` hat **kein** Abgabefeld – nur für reine Lese-/Erkundungsbausteine |
| Serlo-Arbeitsblatt sollte zuerst sichtbar sein | Skill | scobees zeigt oben die Beschreibung, darunter Material, dann das Arbeitsblatt. Beschreibung kurz halten (Auftrag in 1–3 Sätzen), alle Inhalte ins Arbeitsblatt; keine langen Theorietexte in `description_html` |
| „Zum Abgeben musst du eine Datei hochladen“ bei Quiz-Aufgaben; Reiter „Selbstkorrektur“ | Server | behoben: Der Server setzte für jede Aufgabe `requiredSubmissions: ["file"]` (das erzwingt in scobees eine Datei-Abgabe) und `selbstkontrolle` auf scobees-„Selbstkorrektur“ (= Vergleich mit Musterlösung nach Abgabe). Jetzt: `selbstkontrolle`/`info` = kind `task` ohne Abgabe; `abgabe_*` mit `abgabeformen` (file/pen/link); neu `abgabe_selbstkorrektur` für den Musterlösungs-Vergleich. Der Reiter „Reflexion“ ist eine scobees-Funktion, kein Feld des Servers |
| Zahleneingabe soll Einheit tolerieren | Server | behoben: `= 5 GB` setzt Wert 5 und Einheit GB; alternativ `unit: GB`. Lernende tippen nur die Zahl |
| Zuweisung scheitert: „Für dieses Fach existiert keine passende Fach-Differenzierung für den Lernenden“ | Skill | Lernende haben ihr Niveau **pro Fach**. Vor dem ersten Zuweisen prüfen, ob die Lerngruppe im Fach des Pfads ein Niveau hat – oder den Pfad in das Fach legen, in dem sie bereits arbeiten (`scobees_update_lernpfad subject_id`). Der Jahrgang spielt dafür keine Rolle |
| Lernpfad „noch inaktiv, alles Entwurf“ | Skill | Normalzustand: neue Pfade sind in der Bib (INACTIVE), Aufgaben DRAFT; sichtbar für Lernende erst nach Zuweisung in der Weboberfläche. Im Abschlussbericht so erklären, nicht als Mangel |

## Aus der Sichtprüfung als Schüler (Aufgaben A–D)

| Beobachtung | Ort | Stand |
|---|---|---|
| A `selbstkontrolle`: „Lernergebnis abgeben – Bist du fertig?“ ohne Upload | – | wie vorgesehen; Quiz prüft sich im Arbeitsblatt |
| B `abgabe_optional` mit file+link: Datei **oder** Link, aber „im Feld skizzieren“ geht nicht | Skill | Skizzieren = Abgabeform `pen` („PDF mit Stift“): Lernende annotieren ein PDF, das als Material an der Aufgabe hängt. Also `abgabeformen: ["pen"]` **und** eine PDF-Vorlage per `scobees_upload_material` |
| D `abgabe_selbstkorrektur`: nach Abgabe Reiter „Selbstkorrektur“, dort „Du bekommst die Musterlösung von deiner Lehrkraft“ | Skill | Musterlösung gehört dazu: `scobees_upload_material … als_musterloesung: true`; ohne sie ist der Schritt leer |
| Reiter „Reflexion“ immer vorhanden (gesperrt bis zur Abgabe) | – | scobees-Funktion des Lernplaners, nicht vom Server beeinflussbar |

## Aus Praxislauf 2 (Subnetting-Werkstatt)

| Beobachtung | Ort | Stand |
|---|---|---|
| `abgabeform: pen` wurde „angenommen“, aber nicht gespeichert | Server | behoben: Parameter werden jetzt gegen das Schema geprüft (unbekannte Namen, ungültige Werte → Fehlermeldung); `abgabeform` ist Alias für `abgabeformen` |
| `art: abgabe_pflicht_sc` ohne Fehler, aber ohne Wirkung | Server | behoben: Validierung; neue Art `abgabe_pflicht_selbstkorrektur` |
| „selbstkontrolle ohne Selbstkontroll-Kennzeichen“ | Skill | gewollt: das Kennzeichen ist scobees-Selbstkorrektur (Musterlösung nach Abgabe); Serlo-Quiz braucht es nicht. Im Bericht nicht als Mangel aufführen |
| Rundreise `quiz-input`: falsche Antworten wurden beim erneuten Speichern richtig | Server | behoben: `≠ Wert :: Hinweis` |
| `---` als Text, Zeilen in Spoiler zusammengezogen | Server | behoben: Trennlinie entfällt, jede Zeile ein Absatz |
| Extraaufgabe lag direkt im Lernpfad statt in einer Gliederung | Skill | Extra-/Trainingsaufgaben in eine Gliederung „Vertiefung“ legen oder gezielt `parent_id` einer Phase wählen |
| PDF-Vorlage für `pen` und Musterlösung wurden korrekt erzeugt und angehängt | – | funktioniert; Vorlage: Claude erzeugt das PDF lokal und übergibt den Pfad |

## Didaktische Leitplanken (Entwurf)

- **Situationsbeschreibung** als eigene erste Gliederung mit einer `info`-Aufgabe (Auftrag, Rolle, Kunde) und ggf. Material (Ticket, Mail) als Anhang.
- **Theorie in Häppchen**: eine Gliederung pro Thema, Arbeitsblatt mit max. 1–2 Bildschirmseiten Text, dann sofort Kontrolle.
- **Kontrollform passend zum Inhalt**: Begriffe/Zuordnung → `quiz-blanks`/`quiz-blanks-dnd`; Entscheidung → `quiz-sc`; Mehrfacheigenschaften → `quiz-mc`; Rechnung → `quiz-input` mit Einheit; Begründung → `quiz-text` oder Abgabe.
- **Differenzierungen**: ohne Angabe für alle Niveaus; bei getrennten Varianten je Aufgabe ein Niveau. Der Pfad zeigt das Aggregat.
- **Aufgabentyp**: `pflicht` für den roten Faden, `extra`/`training` für Vertiefung und Übung (zählen nicht zum Pflicht-Fortschritt), `info` für Infobausteine.
- **Interaktive Inhalte**: eigenständige HTML-Simulationen als Material anhängen (laufen direkt im Browser, siehe Ohm-Rechner/RAID-Lab); Bilder fürs Arbeitsblatt mit `scobees_upload_bild`; GeoGebra/YouTube per URL-Zeile.
- **Abschlussbericht an die Lehrkraft**: Baum mit IDs, was manuell bleibt (Zuweisung, Sichtprüfung), bekannte Grenzen (keine Bild-Zuordnung per Markdown).
