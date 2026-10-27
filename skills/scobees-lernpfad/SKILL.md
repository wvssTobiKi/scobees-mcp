---
name: scobees-lernpfad
description: "Baut Lernsituationen als Lernpfade in der Lernplattform scobees auf – neu aus Thema und Bildungsgang, aus vorhandenen Offline-Unterlagen (PDF, Word, Folien, Arbeitsblätter) oder als Überarbeitung und Erweiterung eines bestehenden scobees-Lernpfads. Verwende diesen Skill immer, wenn die scobees-Werkzeuge (scobees_*) verfügbar sind und es um Lernpfade, Lernsituationen, Unterrichtseinheiten, Gliederungen, Aufgaben, interaktive Arbeitsblätter, Quizze, Abgaben oder Musterlösungen in scobees geht – auch wenn nur „leg das in scobees an“, „mach daraus einen Kurs“, „ergänze den Pfad um …“ oder „überarbeite Aufgabe 3.1“ gesagt wird. Ausgelegt auf berufsbildende Schulen in Niedersachsen: BFS-dual, Fachschule Technik (Technikerschule), Berufliches Gymnasium Technik, Fachoberschule Technik, Berufseinstiegsschule. Nicht für Moodle (eigener Skill) und nicht für Verwaltung, Zuweisung oder Schülerdaten in scobees."
---

# Lernpfad mit scobees aufbauen

Geschrieben für den MCP-Server **scobees-mcp 0.1.4** (Werkzeuge `scobees_*`). Was der Server kann und wie das Markdown der Arbeitsblätter aussieht, steht in `references/werkzeuge.md` und `references/markdown.md`; lies beide, bevor du die erste Aufgabe anlegst. Die Schulformen und ihre curricularen Grundlagen stehen in `references/bildungsgaenge.md`.

Grundsätze, die der Server erzwingt und die du nicht umgehen sollst: keine Schüler- oder Personendaten; Lernbereiche und Fächer werden nur gelesen; nichts erreicht Lernende, bevor die Lehrkraft den Pfad in der Weboberfläche zuweist.

## Drei Einstiege

| Modus | Auslöser | Besonderheit |
|---|---|---|
| **A – Neu** | Thema, Bildungsgang, ggf. Lernfeld/Modul genannt | Curriculare Grundlage recherchieren, Lernsituation konzipieren |
| **B – Aus Unterlagen** | Dateien hochgeladen oder Pfade genannt (PDF, docx, pptx, Markdown, Bilder, HTML) | Inhalt übernehmen, nicht neu erfinden; Lücken benennen statt füllen |
| **C – Bestehenden Pfad überarbeiten** | „ergänze“, „überarbeite“, „baue um“, Lernpfad-ID oder -Name | Erst `scobees_get_lernpfad` und betroffene `scobees_get_aufgabe` lesen; nur Übergebenes ändern, Arbeitsblätter immer komplett zurückschreiben |

Die Modi mischen sich oft (Unterlagen + Erweiterung eines Pfads). Der Ablauf unten gilt für alle; in Modus C entfallen die Schritte, deren Ergebnis schon im Pfad steht.

## Ablauf

### 1. Rahmen klären (eine kurze Nachfrage, nicht ein Fragebogen)

Du brauchst vier Dinge, bevor du planst. Was die Lehrkraft schon gesagt hat, fragst du nicht noch einmal.

1. **Bildungsgang** (BFS-dual mit Beruf, Technikerschule mit Fachrichtung, BG Technik mit Schwerpunkt, FOS Technik, BES) und Jahr/Klasse. Daraus folgen Vokabular, Niveau, Sprache und Umfang (`references/bildungsgaenge.md`).
2. **Curriculare Einheit**: Lernfeld, Modul, Lerngebiet oder Kompetenzbereich. Ist sie nicht genannt, recherchiere die gültige Vorgabe (Fundorte in der Referenz) und schlage die passende Einheit vor. Nenne die Quelle und lass bestätigen; Rahmenlehrpläne ändern sich, und die Lehrkraft kennt die schulinterne Umsetzung.
3. **Umfang**: Unterrichtsstunden oder Wochen. Fehlt die Angabe, schlage einen Richtwert vor (Referenz).
4. **Fach in scobees**: `scobees_list_subjects` (ggf. nach `scobees_list_workspaces`), die Lehrkraft wählt. Lernende haben ihr Niveau pro Fach; ein Pfad im falschen Fach lässt sich nicht zuweisen.

Zu Beginn einmal `scobees_me`: prüft Anmeldung und meldet, ob scobees sich seit der Prüfung des Servers geändert hat. Bei einer Warnung weiterarbeiten, aber am Ende darauf hinweisen.

### 2. Lernsituation konzipieren

Eine Lernsituation ist eine vollständige berufliche Handlung, kein Kapitel aus dem Lehrbuch. Deshalb:

- **Durchgehendes Szenario** mit anmoderiertem Einstieg: Betrieb oder Einrichtung, Rolle der Lernenden, konkreter Auftrag (Nachricht der Teamleitung, Kundenanfrage, Ticket, Störungsmeldung). Alle Aufgaben beziehen sich darauf. In der Technikerschule und im BG darf das Szenario anspruchsvoller sein (Planung, Bewertung, Begründung), in der BES einfacher und kleinschrittiger.
- **Handlungsergebnis** am Ende, das man abgeben kann: Konzept, Konfiguration, Rechnung, Skizze, Dokumentation, Präsentation.
- **Phasen** der vollständigen Handlung als Leitlinie, nicht als Pflichtschema: Einstieg/Informieren → Grundlagen → Planen/Entscheiden → Durchführen/Anwenden → Kontrollieren/Reflektieren. Nicht jede Lernsituation braucht alle fünf; eine BES-Einheit kommt mit drei aus.
- **Kurze Theorie, sofort Kontrolle**: ein Arbeitsblatt hat höchstens ein bis zwei Bildschirmseiten Text, danach ein Quiz, das den Inhalt wirklich abbildet (Begriffe → Lückentext per Drag-and-drop, Entscheidung → Einfachauswahl, Eigenschaften → Mehrfachauswahl, Rechnung → Zahleneingabe mit Einheit, Begründung → Freitext oder Abgabe). Konstruierte Quizfragen sind schlechter als keine.
- **Entscheidungsaufgaben mit mehreren vertretbaren Lösungen** bevorzugen; bewertet wird die Begründung. Erwartungshorizont in `interne_notiz`, Musterlösung als Datei (`als_musterloesung: true`).
- **Praktische Festigung nach großer Theorie**: Folgen mehr als zwei Theorie-Aufgaben aufeinander, schlage der Lehrkraft eine praktische Anwendungs- oder Festigungseinheit vor (Laboraufgabe, Konfiguration, Messung, Bau, Simulation). Passt sie nicht für alle (Lernort, Zeit, Material), lege sie als Wahlpflichtaufgabe oder `aufgabentyp: training` an. Den Vorschlag im Grobplan ausweisen, nicht stillschweigend weglassen.
- **Du-Form** in allen Texten für Lernende.

### 3. Gliederung bemessen

Gliederungen sind Orientierung, keine Dekoration. Zu viele Ebenen zerstückeln den Pfad, zu wenige machen ihn zur Liste.

- Eine Gliederung ist eine Phase oder ein Themenblock mit **2 bis 5 Aufgaben**. Eine Gliederung mit nur einer Aufgabe gibt es nur für den Einstieg (Situation und Auftrag) oder den Abschluss.
- **Eine Ebene**. Verschachtelte Gliederungen erst ab etwa 12 Aufgaben, und dann nach Phasen, nicht nach Unterthemen.
- Theorie und ihre Kontrolle gehören in **eine** Aufgabe (Arbeitsblatt mit Quiz), nicht in „Lesen“ plus „Quiz“.
- Nummerierung im Aufgabentitel („2.1 IPv4 und Subnetzmaske“) hilft, weil scobees Aufgaben in der Kachelansicht ohne Kontext zeigt.
- Extra- und Trainingsaufgaben in eine Gliederung „Vertiefung“ oder ans Ende der passenden Phase, nie lose in die Wurzel.
- Wahlpflichtaufgaben nur, wenn echte Wahl besteht (n von m), und nie leer lassen.

### 4. Grobplan zeigen und freigeben lassen (immer)

Vor dem ersten Schreibaufruf eine Tabelle im Chat, die die Lehrkraft in einer Minute prüfen kann. Erst nach Freigabe anlegen; Änderungen einarbeiten, nicht diskutieren.

```
Lernpfad: <Name> · Fach: <Fach> · Jahrgang: <…> · Umfang: <h> · Aufgabenwahl: <frei | nach Reihenfolge>

| Nr. | Gliederung / Aufgabe | Art | Typ | Abgabe | Min. | Inhalt in einem Satz |
|-----|----------------------|-----|-----|--------|------|----------------------|
| 1   | Einstieg             |     |     |        |      |                      |
| 1.1 | Der Auftrag          | info | info | – | 10 | Szenario, Auftrag, Ergebnis |
| 2   | Grundlagen           |     |     |        |      |                      |
| 2.1 | …                    | selbstkontrolle | pflicht | – | 25 | Theorie + DnD-Lückentext |
| 3.1 | …                    | abgabe_pflicht_selbstkorrektur | pflicht | file | 45 | Rechnung, Musterlösung |
| Summe |                    |     |     |        | 180 |                      |
```

Darunter in zwei Sätzen: Szenario und Handlungsergebnis; Vorschlag für die praktische Einheit; was an Material entsteht (PDF-Vorlagen, Simulationen, Bilder).

### 5. Zeiten prüfen

`estimated_time` wird je Aufgabe in Minuten gesetzt. Vor der Freigabe die Summe gegen den Umfang halten (Unterrichtsstunde = 45 Minuten) und Phasen auf Plausibilität prüfen. Erfahrungswerte: Lesen und Verstehen eines Arbeitsblatts mit Quiz 20 bis 30 Minuten; Rechnung mit Abgabe 30 bis 45; praktische Durchführung mindestens das Doppelte der reinen Tätigkeit (Rüsten, Material, Fehlersuche); Reflexion nie unter 15. Passt die Summe nicht, erst Inhalte kürzen, dann Umfang anheben, beides im Grobplan ausweisen. Zeiten sind Richtwerte für Lernende und Lehrkraft, keine Vorgabe.

### 6. Material vorbereiten

Alles, was hochgeladen wird, erwartet der Server als **lokalen Pfad auf dem Rechner der Lehrkraft**. Dateien also zuerst in den passenden Themenordner der Lehrkraft schreiben (fragen, wenn kein Ordner genannt ist), dann hochladen.

- **PDF-Vorlagen** für Stift-Abgaben (`abgabeformen: ["pen"]`): ohne PDF als Material ist keine Abgabe möglich.
- **Musterlösungen** als PDF: `scobees_upload_material … als_musterloesung: true`. Ohne sie ist der Reiter Selbstkorrektur leer.
- **HTML-Simulationen**: eine einzige Datei, keine Bibliotheken aus dem Internet, vor dem Hochladen im Browser testen. Sie laufen in scobees direkt als Material.
- **Bilder** fürs Arbeitsblatt über `scobees_upload_bild` → URL → `![…](URL)`. Die Bilder liegen öffentlich im Medienspeicher des Serlo-Editors: keine Personenfotos, nichts Vertrauliches, keine Schulgrafiken mit Namen.
- Das Arbeitsblatt nennt Materialien an der Stelle, an der man sie braucht („Öffne die Vorlage im Anhang“). Anhänge ergänzen das Arbeitsblatt, sie ersetzen es nicht. In der Schüler-Kachel heißt das Arbeitsblatt immer „Serlo-Inhalt“; Orientierung geben Aufgabentitel, Beschreibung und die erste Überschrift des Arbeitsblatts, deshalb beginnt jedes Arbeitsblatt mit einer sprechenden Überschrift.

### 7. Anlegen

Reihenfolge: `scobees_create_lernpfad` → je Gliederung `scobees_create_gliederung` → je Aufgabe `scobees_create_aufgabe` → Material. Neue oder unsichere Markdown-Syntax vorher mit `scobees_markdown_vorschau` in kleinen Blöcken testen; eine fehlerhafte Aufgabe kostet mehr Zeit als eine Vorschau.

Jede Aufgabe hat:

- **Beschreibung** (`description_html`), die mit „**Ergebnis:** …“ beginnt: was wird abgegeben, in welcher Form, woran erkennt man, dass man fertig ist. Ohne Abgabe steht das ausdrücklich da („Keine Abgabe. Lies die Situation und mach weiter mit 2.1.“). Danach höchstens zwei Sätze; alles Inhaltliche gehört ins Arbeitsblatt.
- **Art** nach der Abgabe, nicht nach dem Quiz: `info` (nur lesen, Schaltfläche „Infoinput erledigt“), `selbstkontrolle` (Arbeitsblatt mit Quiz, keine Abgabe; Standard für Theorie), `abgabe_optional`, `abgabe_pflicht`, `abgabe_selbstkorrektur`, `abgabe_pflicht_selbstkorrektur`. Selbstkorrektur nur bewusst, mit Musterlösung.
- **Typ** `aufgabentyp`: ohne Angabe Pflichtaufgabe; `info`, `training`, `extra` gezielt.
- **Niveaus** `differenzierungen`: leer = alle. Differenzieren heißt je Variante eine eigene Aufgabe mit ihrem Niveau. In Technikerschule, BG und FOS in der Regel leer lassen; in BES und BFS lohnt sich die Unterscheidung.
- **Zeit** `estimated_time` aus dem Grobplan.
- **Erwartungshorizont** in `interne_notiz`, wenn es etwas zu bewerten gibt.

Der Lernpfad: `solve_order` nach Rücksprache (frei lässt Lernende springen; nach Reihenfolge erzwingt den roten Faden), `jahrgaenge` und `stichwoerter` setzen, Titelbild nur, wenn eines vorliegt.

### 8. Zurücklesen und prüfen

Nach dem Anlegen `scobees_get_lernpfad` und für jede Aufgabe mit Abgabe oder Quiz `scobees_get_aufgabe`. Prüfe gegen den Grobplan: Art (`art`, `abgabeformen`), Typ (`taskType`), Anhänge und Musterlösungen, Quiz-Typen, Reihenfolge. Was nicht stimmt, mit `scobees_update_aufgabe` oder `scobees_move` korrigieren; was sich über die Schnittstelle nicht setzen lässt, kommt in die Checkliste.

### 9. Abschlussbericht an die Lehrkraft (immer)

```
## <Lernpfad> ist angelegt
Fach, Jahrgang, Umfang, Pfad-ID. Baum: Gliederungen und Aufgaben mit IDs, Art, Typ, Minuten.
Material: welche Dateien liegen wo (lokaler Ordner) und hängen an welcher Aufgabe.

## Noch von Hand (scobees-Weboberfläche)
- [ ] Lernpfad einer Lerngruppe zuweisen (bis dahin sehen Lernende nichts; Status „inaktiv“ ist normal)
- [ ] Gliederungen und Aufgaben veröffentlichen (Status „Entwurf“ ist normal)
- [ ] Prüfen, ob die Lerngruppe im Fach des Pfads ein Niveau hat (sonst scheitert die Zuweisung)
- [ ] Bearbeitungsreihenfolge und Aufgabenwahl kontrollieren
- [ ] Drag-and-drop-Aufgaben, Stift-Abgaben und Anhänge einmal in der Schüleransicht öffnen
- [ ] <alles, was sich nicht setzen ließ>

## Vorschläge
Praktische Einheit, Differenzierung, Erweiterungen – kurz, mit Begründung.
```

## Modus C: Bestehenden Pfad überarbeiten

- Zuerst lesen: `scobees_get_lernpfad` (Baum mit IDs), dann `scobees_get_aufgabe` für alles, was geändert wird. Das Arbeitsblatt kommt als Markdown zurück und wird beim Ändern **komplett ersetzt**; also das gelesene Markdown ändern, nicht neu schreiben.
- Den Grobplan auf die Änderung beschränken: Tabelle nur mit betroffenen Zeilen und einer Spalte „vorher / nachher“.
- Vor dem Löschen (`scobees_delete`, `confirm: true`) immer ausdrücklich bestätigen lassen; Löschen nimmt Unterelemente mit.
- Beim Verschieben die `sort_order` der Nachbarn mitdenken; nach dem Umbau Baum zurücklesen.
- Wurde ein Arbeitsblatt in der Weboberfläche mit Bausteinen gebaut, die Markdown nicht kennt (Bild-Zuordnung, interaktives Video), nur über `mit_serlo_json: true` lesen und per `serlo_json` zurückschreiben; sonst gehen diese Bausteine verloren. Markdown-Rückweg vorher mit `scobees_markdown_vorschau` vergleichen.

## Modus B: Aus Unterlagen

- Unterlagen vollständig lesen, bevor der Grobplan entsteht; Aufbau, Reihenfolge und Formulierungen der Lehrkraft übernehmen, wo sie tragen.
- Fehlendes (Szenario, Ergebniszeile, Kontrolle nach Theorie) ergänzen und im Grobplan als Ergänzung markieren, damit die Lehrkraft sieht, was neu ist.
- Aufgaben aus Arbeitsblättern mit Rechnungen werden zu `quiz-input` mit Einheit und typischen Fehlerwerten; Zuordnungen zu `quiz-blanks-dnd`; offene Aufgaben zu Abgaben mit Musterlösung, wenn eine Lösung in den Unterlagen steht.
- Urheberrecht: fremde Bilder und Texte aus Schulbüchern nicht hochladen; Ersatz vorschlagen oder weglassen und das in den Bericht schreiben.

## Qualitätsregeln für Quizze und Eingaben

- Einheit fest neben dem Feld (`= 254 Hosts`), Lernende tippen nur die Zahl.
- Dezimalzahlen mit Komma und Punkt hinterlegen (`= 8,4` und `= 8.4`).
- Typische Fehlerwerte mit Rückmeldung (`≠ 256 :: Netz- und Broadcastadresse abziehen`).
- Bitmuster wie `0100` werden als Zahl verglichen (führende Nullen verschwinden): anders abfragen (Text in Anführungszeichen, Drag-and-drop) oder im Fragetext darauf hinweisen.
- Tipp-Lückentexte vermeiden, wenn die Schreibweise scheitern kann; Drag-and-drop mit Distraktoren, Ziffern als Lösung oder Wortspeicher sind robuster.
- Rückmeldungen je Antwort bei Auswahlfragen: `- [x] Antwort :: Rückmeldung`.
- Bei Freitext (`quiz-text`) gibt es keine automatische Prüfung; dann Aufklapp-Block „Lösungshinweis“ darunter.

Weitere Syntax und bekannte Fallen: `references/markdown.md`.
