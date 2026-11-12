---
name: scobees-lernpfad
description: "Baut Lernsituationen als Lernpfade in der Lernplattform scobees auf – neu aus Thema und Bildungsgang, aus vorhandenen Offline-Unterlagen (PDF, Word, Folien, Arbeitsblätter) oder als Überarbeitung und Erweiterung eines bestehenden scobees-Lernpfads. Verwende diesen Skill immer, wenn die scobees-Werkzeuge (scobees_*) verfügbar sind und es um Lernpfade, Lernsituationen, Unterrichtseinheiten, Gliederungen, Aufgaben, interaktive Arbeitsblätter, Quizze, Abgaben oder Musterlösungen in scobees geht – auch wenn nur „leg das in scobees an“, „mach daraus einen Kurs“, „ergänze den Pfad um …“ oder „überarbeite Aufgabe 3.1“ gesagt wird. Ausgelegt auf berufsbildende Schulen in Niedersachsen: BFS-dual, Fachschule Technik (Technikerschule), Berufliches Gymnasium Technik, Fachoberschule Technik, Berufseinstiegsschule. Nicht für Moodle (eigener Skill) und nicht für Verwaltung, Zuweisung oder Schülerdaten in scobees."
---

# Lernpfad mit scobees aufbauen

Geschrieben für den MCP-Server **scobees-mcp 0.1.12** (Werkzeuge `scobees_*`). Was der Server kann und wie das Markdown der Arbeitsblätter aussieht, steht in `references/werkzeuge.md` und `references/markdown.md`; lies beide, bevor du die erste Aufgabe anlegst. Wie Abbildungen entstehen, steht in `references/abbildungen.md`. Die Schulformen und ihre curricularen Grundlagen stehen in `references/bildungsgaenge.md`.

Grundsätze, die der Server erzwingt und die du nicht umgehen sollst: keine Schüler- oder Personendaten; Lernbereiche und Fächer werden nur gelesen; nichts erreicht Lernende, bevor die Lehrkraft den Pfad in der Weboberfläche zuweist. **Danach gilt das Gegenteil:** In einem zugewiesenen Lernpfad ist alles, was du anlegst, änderst oder löschst, für die Lernenden sofort sichtbar, ohne Veröffentlichen und ohne weiteren Schritt der Lehrkraft. `scobees_get_lernpfad` zeigt das an der Wurzel als `zugewiesen: true`, und jedes schreibende Werkzeug meldet es als `warnung_zugewiesen`.

## Zwei Sperren vor dem ersten Schreibaufruf

Bevor irgendetwas in scobees angelegt oder geändert wird, müssen beide Punkte erfüllt sein. Das gilt auch für eine einzelne Aufgabe, einen Einstiegstext oder eine „kurze Ergänzung“.

- [ ] **Rahmen geklärt** (Schritt 1). Die Frage nach den Kachelbildern wurde wirklich gestellt. Die Rückfallregel „keine Kachelbilder“ gilt nur, wenn gefragt wurde und die Antwort ausblieb, nicht, wenn die Frage übersprungen wurde.
- [ ] **Grobplan gezeigt und danach freigegeben** (Schritt 4). Freigabe ist nur, was die Lehrkraft sagt, nachdem sie den Plan gesehen hat. Ein knappes „mach“, „1“ oder „ja“ davor bezieht sich auf etwas anderes und ersetzt die Freigabe nicht. Bei einer einzelnen neuen Aufgabe genügt als Plan die Aufgabe selbst: Titel, Art, Zeit, Abbildung und der vollständige Text des Arbeitsblatts im Chat.

Ist eine Sperre offen, wird nachgefragt und nichts geschrieben, auch wenn die Lehrkraft es eilig hat.

## Drei Einstiege

| Modus | Auslöser | Besonderheit |
|---|---|---|
| **A – Neu** | Thema, Bildungsgang, ggf. Lernfeld/Modul genannt | Curriculare Grundlage recherchieren, Lernsituation konzipieren |
| **B – Aus Unterlagen** | Dateien hochgeladen oder Pfade genannt (PDF, docx, pptx, Markdown, Bilder, HTML) | Inhalt übernehmen, nicht neu erfinden; Lücken benennen statt füllen |
| **C – Bestehenden Pfad überarbeiten** | „ergänze“, „überarbeite“, „baue um“, Lernpfad-ID oder -Name | Erst `scobees_get_lernpfad` und betroffene `scobees_get_aufgabe` lesen; nur Übergebenes ändern, kleine Textänderungen per `scobees_patch_arbeitsblatt` |

Die Modi mischen sich oft (Unterlagen + Erweiterung eines Pfads). Der Ablauf unten gilt für alle; in Modus C entfallen die Schritte, deren Ergebnis schon im Pfad steht.

## Ablauf

### 1. Rahmen klären (eine kurze Nachfrage, nicht ein Fragebogen)

Du brauchst sieben Dinge, bevor du planst. Was die Lehrkraft schon gesagt hat, fragst du nicht noch einmal.

1. **Bildungsgang** (BFS-dual mit Beruf, Technikerschule mit Fachrichtung, BG Technik mit Schwerpunkt, FOS Technik, BES) und Jahr/Klasse. Daraus folgen Vokabular, Niveau, Sprache und Umfang (`references/bildungsgaenge.md`).
2. **Curriculare Einheit**: Lernfeld, Modul, Lerngebiet oder Kompetenzbereich. Ist sie nicht genannt, recherchiere die gültige Vorgabe (Fundorte in der Referenz) und schlage die passende Einheit vor. Nenne die Quelle und lass bestätigen; Rahmenlehrpläne ändern sich, und die Lehrkraft kennt die schulinterne Umsetzung.
3. **Umfang**: Unterrichtsstunden oder Wochen. Fehlt die Angabe, schlage einen Richtwert vor (Referenz).
4. **Fach in scobees**: Das Fach wird nie geraten und nie aus dem Thema abgeleitet. Immer zuerst `scobees_list_subjects` (bei vielen Fächern vorher `scobees_list_workspaces` und nach dem Lernbereich fragen), dann die in Frage kommenden Fächer mit Namen und ID zeigen und die Lehrkraft wählen lassen. Hat sie ein Fach genannt, den passenden Eintrag aus der Liste nennen und bestätigen lassen; gibt es keinen eindeutigen Treffer, nachfragen statt den ähnlichsten nehmen. Grund: Lernende haben ihr Niveau pro Fach, ein Pfad im falschen Fach lässt sich nicht zuweisen, und Fächer legt nur der Administrator an. Den **Jahrgang** (`jahrgaenge`) ebenfalls erfragen und aus `scobees_list_tags` wählen lassen; er wird nie aus dem Klassennamen abgeleitet, weil die Zuordnung von Klassen zu Jahrgängen in der Klassenverwaltung liegt, auf die der Server nicht zugreift.
5. **Kachelbilder** (optional): Das Titelbild des Lernpfads und die Kachelbilder von Gliederungen und Aufgaben sind Schmuck und Orientierung, kein Lerninhalt, und jedes kostet spürbar Rechenaufwand. Deshalb ausdrücklich fragen, **für welche Ebenen** sie entstehen sollen: Titelbild · Gliederungen · Aufgaben. Die Ebenen einzeln anbieten, nicht „Bilder ja/nein“. Ohne Antwort gilt: keine Kachelbilder.
6. **Abbildungen der Lehrkraft**: Abbildungen im Arbeitsblatt stehen nicht zur Wahl; sie gehören zum Lerninhalt und entstehen immer (Abschnitt 2a). Gefragt wird nur, ob die Lehrkraft Abbildungen mitbringt und wie sie verwendet werden sollen: **übernehmen** (unverändert einbinden), **als Grundlage** (Inhalt übernehmen, im Stil des Lernpfads neu zeichnen) oder **neu erstellen** (nur das Thema ist vorgegeben). Eine Antwort für alle genügt, Ausnahmen für einzelne Abbildungen nennt die Lehrkraft. Ohne Antwort gilt: Abbildungen, die die Lehrkraft selbst erstellt hat, werden übernommen; alles andere wird neu erstellt. Fremde Abbildungen (Lehrbuch, Hersteller, Internet) werden nie übernommen und nicht abgezeichnet; der Sachverhalt wird eigenständig neu dargestellt.
7. **Ablageordner**: Alles, was hochgeladen wird (Abbildungen, Kachelbilder, Vorlagen, Musterlösungen), muss als Datei auf dem Rechner der Lehrkraft liegen. Den Themenordner nennen lassen oder einen vorschlagen und bestätigen lassen; er steht im Grobplan (`ablage`).

Nennt die Lehrkraft einen **Termin** („die Klasse soll am Donnerstag damit arbeiten“), sofort sagen, was bis dahin an ihr selbst hängt: Über die Schnittstelle entstehen Inhalte, und der Lernpfad lässt sich in die schuleigene Bib stellen (`in_bib`). Den Lernpfad einer Lerngruppe zuweisen kann nur die Lehrkraft in der Weboberfläche. Den Zeitbedarf dafür und für die Vorschau (Schritt 8) einplanen.

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

### 2a. Abbildungen (Pflicht) und interaktive Elemente (wo sie tragen)

Der Skill unterscheidet drei Dinge und benutzt für jedes genau ein Wort:

| Begriff | Was es ist | Wozu | Verbindlichkeit |
|---|---|---|---|
| **Fachabbildung** | gezeichnete, beschriftete Abbildung im Arbeitsblatt: Schaltplan, Aufbau, Messanordnung, Ablauf, Blockdiagramm, Diagramm, Kennlinie, Vergleich | trägt den Inhalt | Pflicht (Mindeststandard unten) |
| **Situationsillustration** | gezeichnete Szene aus dem Szenario im Arbeitsblatt: Ort, Rolle, Auftrag | holt die Lernenden in die Situation und hält sie darin | Pflicht (Mindeststandard unten) |
| **Kachelbild** | Titelbild des Lernpfads, Kachel einer Gliederung oder Aufgabe (`cover_image_path`) | Schmuck und Orientierung in der Übersicht | optional, nur nach Rückfrage in Schritt 1 |

„Abbildung“ meint im Folgenden immer Fachabbildung oder Situationsillustration, nie ein Kachelbild. Abbildungen dienen dem Lernfortschritt; sie werden nicht erfragt, nicht aus Aufwandsgründen weggelassen und nicht durch ein Kachelbild ersetzt.

**Mindeststandard (feste Regel):**

1. Die Einstiegsaufgabe (Situation und Auftrag) beginnt mit einer **Situationsillustration**. Ändert sich die Situation im Verlauf deutlich (neuer Ort, neuer Auftrag, eine Störung tritt auf), bekommt die erste Aufgabe dieser Phase eine weitere.
2. Jedes Arbeitsblatt mit Theorie enthält mindestens eine **Fachabbildung**, die seine Kernaussage zeigt.
3. Jede Aufgabe, in der etwas aufgebaut, angeschlossen, gemessen oder konfiguriert wird, zeigt den Aufbau als **Fachabbildung**.
4. Abweichen darf der Skill nur in zwei Fällen: Eine HTML-Simulation oder ein GeoGebra-Applet in derselben Aufgabe zeigt denselben Zusammenhang bereits, oder das Arbeitsblatt enthält nichts, was sich zeichnen lässt (reine Begriffsklärung, Organisatorisches, Reflexion). Die Abweichung steht mit Grund im Grobplan an der Aufgabe (`ohne_abbildung`), damit die Lehrkraft widersprechen kann.

Tabellen, Zahlenbeispiele und Vergleichslisten bleiben sinnvoll, zählen aber nicht als Fachabbildung.

**Was eine Abbildung leisten muss:**

- Eine **Fachabbildung** beantwortet die Frage des Abschnitts auf einen Blick (Welches RAID verliert wie viel Kapazität? Wo liegt die Netzgrenze? Wo wird das Messgerät angeschlossen?), mit den Werten und Bezeichnungen des Szenarios. „Ein Bild zum Thema“ ist keine Fachabbildung.
- Eine **Situationsillustration** zeigt Ort, Rolle und Auftrag dieses Szenarios mit einem konkreten Detail (das Ticket auf dem Monitor, der geöffnete Verteiler, die Kundin am Empfang). Ein beliebiges Themenbild ist keine Situationsillustration. Stil und Figuren bleiben im ganzen Lernpfad gleich.
- Jede Abbildung ist **eingebunden**: Der Text davor oder danach nimmt auf sie Bezug, die Bildunterschrift sagt, was zu sehen ist, und zu jeder Fachabbildung gehört mindestens eine Frage oder ein Arbeitsauftrag, der sich nur mit ihr lösen lässt (Wert ablesen, Bauteil benennen, Fehler finden, Anschluss begründen).
- **Zeigen vor Erklären:** Die Abbildung steht vor der Definition, nicht als Abschluss darunter.
- **Herstellung:** Abbildungen werden gezeichnet (SVG), als PNG gerendert, vor dem Hochladen angesehen und erst dann eingebunden. Zeichenregeln, Rendern, Prüfliste, Stil der Situationsillustrationen und der Umgang mit mitgebrachten Abbildungen stehen in `references/abbildungen.md`; lies die Datei, bevor du die erste Abbildung zeichnest.
- **Schaltpläne und Stromlaufpläne immer mit europäischen Symbolen** (DIN EN 60617 / IEC 60617), nie mit amerikanischen (ANSI/IEEE): Widerstand als Rechteck, nicht als Zickzacklinie. Die vollständige Prüfliste steht in `references/abbildungen.md`. Trägt der Schaltplan die Hauptaufgabe, liest die Lehrkraft ihn vor dem Hochladen kurz gegen.

**Interaktive Elemente.** Lernende sollen Inhalte darüber hinaus nicht nur lesen, sondern erkunden können. Die Lehrkraft erwartet ansprechend aufbereitete Information; das heißt nicht „überall ein Gimmick“, sondern das passende Mittel an der Stelle, an der Text allein nicht reicht. Prüfe für jeden Theorieabschnitt: Lässt sich das Prinzip **ausprobieren**, **beobachten** oder **vergleichen**? Dann lohnt sich ein interaktives Element; eine Definition braucht keins.

| Inhalt | Geeignetes Mittel | Beispiel |
|---|---|---|
| Zusammenhang mit Stellgrößen (Formel, Parameter, Konfiguration) | **HTML-Simulation** als Material: Regler, Eingabefelder, sofortige Anzeige | Ohm-Rechner, Subnetz-Rechner mit Bitdarstellung, RAID-Lab (Platten ausfallen lassen, Kapazität sehen) |
| Ablauf oder Prozess (Schritte, Zustände, Datenfluss) | HTML-Seite mit Schrittfolge oder Animation; Video, wenn ein gutes existiert | Boot-Vorgang, Handshake, Fertigungsablauf |
| Geometrie, Funktionen, Vektoren | **GeoGebra**-Applet per URL-Zeile im Arbeitsblatt | Kennlinien, Kräfte, Winkel |
| Aufbau, Schaltung, Skizze, die Lernende selbst beschriften oder ergänzen | Fachabbildung zusätzlich als **PDF-Vorlage** mit Stift-Abgabe | Netzplan ergänzen, Schaltplan vervollständigen, Bauteile beschriften |
| Begriffe, Zuordnungen, Reihenfolgen | **Drag-and-drop-Lückentext** mit Wortspeicher und Distraktoren | Protokoll ↔ Schicht, Bauteil ↔ Funktion |
| Entscheidung zwischen Varianten | Vergleichstabelle im Arbeitsblatt plus Einfachauswahl mit Rückmeldung je Antwort | RAID 1 oder RAID 5 für diesen Kunden? |
| Vorwissen aktivieren, Gespräch anstoßen | Zitat-Box mit Aussage aus dem Szenario, dann Freitext oder Mehrfachauswahl | „Der Chef sagt: Backup brauchen wir dann nicht mehr.“ |

Regeln für interaktive Elemente und Kontrollen:

- **Ein interaktives Element pro Abschnitt** reicht; es muss direkt mit einer Aufgabe verbunden sein („Stelle im Rechner … ein und trage ab, was passiert“). Ein Element, zu dem keine Frage gehört, wird übersprungen.
- **HTML-Simulationen** sind eine einzige Datei ohne Netzbibliotheken, laufen offline im Browser, haben eine Überschrift, eine Zeile Anleitung und sinnvolle Startwerte. Nicht mehr als drei Stellgrößen; sichtbares Ergebnis innerhalb von zwei Sekunden Bedienung. Vor dem Hochladen im Browser testen. Sie sind als Material an der Aufgabe erreichbar; das Arbeitsblatt verweist mit Namen darauf.
- **Videos** nur mit Zeitangabe („Minute 2:10 bis 4:30“) und einer Beobachtungsfrage; keine Videos als Ersatz für den Theorietext.
- **Kontrollform zum Inhalt**: Zahl → Eingabe mit Einheit; Begriff → Drag-and-drop; Entscheidung → Einfachauswahl; Eigenschaften → Mehrfachauswahl; Begründung → Freitext oder Abgabe. Eine Frage, die man ohne den Abschnitt beantworten kann, ist überflüssig; eine, die Wortlaut abfragt statt Verständnis, wirkt konstruiert.
- **BES und BFS**: mehr Abbildungen und Drag-and-drop, weniger Text; **Technikerschule, BG, FOS**: Simulationen mit Parametern, Diagramme, Datenblätter als Material.
- Simulationen und Videos kosten Zeit: im Grobplan in der Aufgabenzeile nennen („+ Simulation“), damit die Lehrkraft streichen kann. Abbildungen stehen ebenfalls je Aufgabe im Grobplan, aber zum Prüfen und Tauschen, nicht zum Streichen.

### 3. Gliederung bemessen

Gliederungen sind Orientierung, keine Dekoration. Zu viele Ebenen zerstückeln den Pfad, zu wenige machen ihn zur Liste.

- Eine Gliederung ist eine Phase oder ein Themenblock mit **2 bis 5 Aufgaben**. Eine Gliederung mit nur einer Aufgabe gibt es nur für den Einstieg (Situation und Auftrag) oder den Abschluss.
- **Eine Ebene**. Verschachtelte Gliederungen erst ab etwa 12 Aufgaben, und dann nach Phasen, nicht nach Unterthemen.
- Theorie und ihre Kontrolle gehören in **eine** Aufgabe (Arbeitsblatt mit Quiz), nicht in „Lesen“ plus „Quiz“.
- Nummerierung im Aufgabentitel („2.1 IPv4 und Subnetzmaske“) hilft, weil scobees Aufgaben in der Kachelansicht ohne Kontext zeigt. Titel kurz halten: Lernende sehen Aufgaben als kleine Kacheln, in denen der Titel nach wenigen Wörtern umbricht und nach etwa 25 Zeichen endet (lange Wörter werden abgeschnitten), und Lernpfade in der Fachübersicht nur mit den ersten etwa 18 Zeichen. Die Lehrkraft sieht in der Auswertung „Lernergebnisse pro Aufgabe“ von jedem Aufgabentitel nur etwa 13 Zeichen. Nummer und unterscheidendes Wort gehören deshalb an den Anfang („Smart House: Netz verstehen“, nicht „Lernsituation 2 im Lernfeld 11: …“).
- Extra- und Trainingsaufgaben in eine Gliederung „Vertiefung“ oder ans Ende der passenden Phase, nie lose in die Wurzel.
- Wahlpflichtaufgaben nur, wenn echte Wahl besteht (n von m), und nie leer lassen. Unteraufgaben mit `scobees_create_aufgabe` und `parent_id` = Wahlpflicht-ID anlegen, das funktioniert direkt. Eine bestehende Aufgabe lässt sich auch per `scobees_move` in eine Wahlpflichtaufgabe verschieben (ab scobees 94.6); sie verliert dabei ihren Aufgabentyp und kommt nicht wieder heraus. Deshalb vor dem Verschieben mit der Lehrkraft klären, ob die Aufgabe wirklich zur Wahl stehen soll. Lernende sehen eine Wahlpflichtaufgabe immer als eigenen Block **unter** allen anderen Aufgaben ihrer Gliederung, egal wo sie einsortiert ist. Sie gehört deshalb ans Ende der Gliederung und bekommt die letzte Nummer; soll danach noch etwas folgen, kommt es in die nächste Gliederung.

### 4. Grobplan zeigen und freigeben lassen (immer)

Vor dem ersten Schreibaufruf bekommt die Lehrkraft den Plan als **Karten-Ansicht** (Artefakt aus `assets/grobplan.html`) und darunter im Chat zwei Sätze plus die offenen Fragen. Die Ansicht ist für Menschen gemacht: je Gliederung eine Karte mit Zeitbalken (Pflicht grün, freiwillig grau), je Aufgabe eine Zeile mit Klartext-Marken statt Parameterwerten, Kennzahlen oben, Material und Fragen unten. Die technischen Werte (`art`, `aufgabentyp`, `abgabeformen`, Quiz-Typen, Dateinamen) stehen zugeklappt unter jeder Karte und als Tabelle am Ende, damit nichts verloren geht, aber nichts im Weg steht.

So entsteht sie: `assets/grobplan.html` lesen, den Platzhalter `__PLAN_JSON__` durch das Plan-JSON ersetzen (Struktur im Kommentar der Vorlage und in `assets/beispiel-grobplan.json`), als Artefakt ausgeben. Wo kein Artefakt möglich ist, dieselben Daten als gegliederte Liste im Chat (Überschrift je Gliederung mit Minutensumme, eine Zeile je Aufgabe).

Regeln für den Inhalt:

- Marken in Klartext: „Info“ · „Theorie + <Kontrollform>“ · „Abgabe: <Form>“ · „Pflichtabgabe: <Form>“ · „+ Musterlösung“ · „Training, freiwillig“ / „Extra, freiwillig“. Formen heißen Datei, Stift auf PDF, Videolink.
- Eine Frage, die eine Aufgabe oder eine Gliederung betrifft, steht **dort** (`frage` an der Aufgabe oder Gliederung). Unten unter „Vor der Freigabe klären“ nur, was den ganzen Pfad betrifft (Reihenfolge, Umfang, Fach, Niveau-Varianten).
- Der Vorschlag für die praktische Einheit und was an Material entsteht, stehen ausdrücklich dabei.
- **Abbildungen je Aufgabe** (`abbildungen`): Art und was zu sehen ist, z. B. „Situation: Übergabe des Prüfauftrags in der Werkstatt“ oder „Fachabbildung: Messschaltung Schutzleiterwiderstand“. Mitgebrachte Abbildungen tragen den Zusatz „übernommen“ oder „neu gezeichnet nach Vorlage“. Entsteht an einer Aufgabe keine Abbildung, steht dort der Grund (`ohne_abbildung`). Vor der Ausgabe den Plan gegen den Mindeststandard aus 2a halten.
- **Kachelbilder** als eine Zeile zum ganzen Pfad (`kacheln`), so wie in Schritt 1 vereinbart: „Titelbild + 4 Gliederungs-Kacheln“ oder „keine“.
- In Modus C nur die betroffenen Gliederungen, Änderungen als „vorher → nachher“ im Aufgabentext.

Erst nach Freigabe anlegen; Änderungswünsche („2.2 auf 20 min, 5.1 Pflicht“) einarbeiten, nicht diskutieren.

### 5. Zeiten prüfen

`estimated_time` wird je Aufgabe in Minuten gesetzt. Vor der Freigabe die Summe gegen den Umfang halten (Unterrichtsstunde = 45 Minuten) und Phasen auf Plausibilität prüfen. Erfahrungswerte: Lesen und Verstehen eines Arbeitsblatts mit Quiz 20 bis 30 Minuten; Rechnung mit Abgabe 30 bis 45; praktische Durchführung mindestens das Doppelte der reinen Tätigkeit (Rüsten, Material, Fehlersuche); Reflexion nie unter 15. Passt die Summe nicht, erst Inhalte kürzen, dann Umfang anheben, beides im Grobplan ausweisen. Zeiten sind Richtwerte für Lernende und Lehrkraft, keine Vorgabe.

### 6. Material vorbereiten

Alles, was hochgeladen wird, erwartet der Server als **lokalen Pfad auf dem Rechner der Lehrkraft**. Dateien also zuerst in den passenden Themenordner der Lehrkraft schreiben (fragen, wenn kein Ordner genannt ist), dann hochladen.

- **PDF-Vorlagen** für Stift-Abgaben (`abgabeformen: ["pen"]`): ohne PDF als Material ist keine Abgabe möglich. Bei einer Stift-Abgabe sehen Lernende links **das PDF mit den Stiftwerkzeugen, nicht das Arbeitsblatt**; das Arbeitsblatt liegt nur als Kachel „Serlo-Inhalt“ unter den Materialien und wird leicht übersehen. Der vollständige Arbeitsauftrag steht deshalb auf dem PDF selbst und in der Beschreibung der Aufgabe. Theorie und Quiz gehören in eine eigene Aufgabe davor, nicht in das Arbeitsblatt der Stift-Aufgabe.
- **Musterlösungen** als PDF: `scobees_upload_material … als_musterloesung: true`. Ohne sie ist der Reiter Selbstkorrektur leer.
- **HTML-Simulationen**: eine einzige Datei, keine Bibliotheken aus dem Internet, vor dem Hochladen im Browser testen. Sie laufen in scobees direkt als Material in einem abgeschotteten Rahmen: Skripte funktionieren, Speichern im Browser (localStorage, Cookies), Formular-Absenden, neue Fenster und Verweise nach außen nicht.
- **Material verdrängt das Arbeitsblatt.** Hat eine Aufgabe einen Anhang (PDF, Bild, HTML-Simulation), sehen Lernende links zuerst diesen Anhang; das Arbeitsblatt liegt als letzte Kachel „Serlo-Inhalt“ bei den Materialien. Wechseln sie zwischen Anhang und Arbeitsblatt, sind alle Quiz-Eingaben weg. Deshalb: Ein Arbeitsblatt mit Quiz bekommt keinen Anhang. Eine Simulation oder ein Datenblatt, mit dem gearbeitet werden soll, kommt in eine eigene Aufgabe davor (Auftrag in der Beschreibung: „Stelle … ein und notiere …“), das Quiz dazu in die nächste. Abbildungen gehören ins Arbeitsblatt (`scobees_upload_bild`), nicht als Anhang. Lässt sich ein Anhang neben einem Arbeitsblatt nicht vermeiden, beginnt die Beschreibung mit „Öffne zuerst rechts die Kachel Serlo-Inhalt“. `scobees_upload_material` meldet den Fall als `hinweis_ansicht`.
- **Links** an der Aufgabe (`links`) erscheinen als Kachel; ein Klick ersetzt die linke Seite durch die Schaltfläche „Hier weiter zum Link“. Für Quellen, die neben dem Arbeitsblatt gebraucht werden, den Link in den Text des Arbeitsblatts setzen.
- **Abbildungen** fürs Arbeitsblatt: zeichnen, als PNG rendern, ansehen, dann `scobees_upload_bild` → URL → `![Bildunterschrift](URL)` (Vorgehen in `references/abbildungen.md`). Die SVG-Quelldatei bleibt im Themenordner, damit sich die Abbildung später ändern lässt. Die hochgeladenen Bilder liegen öffentlich im Medienspeicher des Serlo-Editors: keine Personenfotos, nichts Vertrauliches, keine Schulgrafiken mit Namen.
- Das Arbeitsblatt nennt Materialien an der Stelle, an der man sie braucht („Öffne die Vorlage im Anhang“). Anhänge ergänzen das Arbeitsblatt, sie ersetzen es nicht. In der Schüler-Kachel heißt das Arbeitsblatt immer „Serlo-Inhalt“; Orientierung geben Aufgabentitel, Beschreibung und die erste Überschrift des Arbeitsblatts, deshalb beginnt jedes Arbeitsblatt mit einer sprechenden Überschrift.

### 7. Anlegen

Reihenfolge: `scobees_create_lernpfad` → je Gliederung `scobees_create_gliederung` → je Aufgabe `scobees_create_aufgabe` → Material. Neue oder unsichere Markdown-Syntax vorher mit `scobees_markdown_vorschau` in kleinen Blöcken testen; eine fehlerhafte Aufgabe kostet mehr Zeit als eine Vorschau.

Jede Aufgabe hat:

- **Beschreibung** (`description_html`), die mit „**Ergebnis:** …“ beginnt: was wird abgegeben, in welcher Form, woran erkennt man, dass man fertig ist. Ohne Abgabe steht das ausdrücklich da („Keine Abgabe. Lies die Situation und mach weiter mit 2.1.“). Danach höchstens zwei Sätze; alles Inhaltliche gehört ins Arbeitsblatt. Lernende sehen sie rechts neben dem Arbeitsblatt unter „Worum geht's“; fehlt sie, steht dort „Keine Beschreibung vorhanden“. Die Beschreibung einer Gliederung erscheint aufgeklappt unter „Was ist zu tun“.
- **Art** nach der Abgabe, nicht nach dem Quiz: `info` (nur lesen), `selbstkontrolle` (Arbeitsblatt mit Quiz, keine Abgabe; Standard für Theorie), `abgabe_optional`, `abgabe_pflicht`, `abgabe_selbstkorrektur`, `abgabe_pflicht_selbstkorrektur`. Selbstkorrektur nur bewusst, mit Musterlösung. Abgeschlossen wird jede Aufgabe, auch Info und Selbstkontrolle, mit der Schaltfläche „Lernergebnis abgeben“ und der Rückfrage „Bist du mit der Aufgabe fertig?“; ob die Quizfragen beantwortet sind, prüft scobees dabei nicht. Danach folgt die Reflexion (Smileys und Freitext).
- **Typ** `aufgabentyp`: ohne Angabe Pflichtaufgabe; `info`, `training`, `extra` gezielt. Lernende sehen den Typ als Symbol auf der Kachel. Nur Pflichtaufgaben und Wahlpflichtaufgaben zählen zum Fortschritt und zur Zeitsumme der Gliederung. Bei `aufgabentyp: info` heißt die Schaltfläche zum Abschließen „Infoinput erledigt“, sonst „Lernergebnis abgeben“.
- **Niveaus** `differenzierungen`: leer = alle. Differenzieren heißt je Variante eine eigene Aufgabe mit ihrem Niveau. Lernende sehen nur die Aufgaben ihres Niveaus im Fach, die anderen fehlen bei ihnen ganz und zählen nicht mit (mit Dummy-Konto geprüft); die Varianten bekommen deshalb dieselbe Nummer und denselben Titel. In Technikerschule, BG und FOS in der Regel leer lassen; in BES und BFS lohnt sich die Unterscheidung.
- **Zeit** `estimated_time` aus dem Grobplan.
- **Erwartungshorizont** in `interne_notiz`, wenn es etwas zu bewerten gibt.

Der Lernpfad: `solve_order` nach Rücksprache (frei oder nach Reihenfolge). Verlass dich nicht darauf, dass „nach Reihenfolge“ sperrt: Im Test mit einem Dummy-Konto (scobees 94.6) ließen sich spätere Aufgaben öffnen und abgeben, bevor die früheren erledigt waren, mit „nach Reihenfolge“ ebenso wie mit „nach Lehrerkorrektur“. Der rote Faden muss aus Nummerierung, Gliederung und den Texten selbst hervorgehen, `jahrgaenge` und `stichwoerter` setzen. Kachelbilder (`cover_image_path`) nur für die Ebenen, die in Schritt 1 vereinbart wurden; quadratisch anlegen, weil scobees die Kachel quadratisch beschneidet, und ein Motiv wählen, das auch klein erkennbar bleibt.

### 8. Zurücklesen und prüfen

Geprüft wird in dieser Reihenfolge; die Zuweisung an die Lerngruppe kommt erst danach.

**1. Zurücklesen über die Schnittstelle.** Nach dem Anlegen `scobees_get_lernpfad` und für jede Aufgabe mit Abgabe oder Quiz `scobees_get_aufgabe`. Prüfe gegen den Grobplan: Art (`art`, `abgabeformen`), Typ (`taskType`), Anhänge und Musterlösungen, Quiz-Typen, Reihenfolge und Abbildungen (jede geplante Abbildung steht als `![Bildunterschrift](URL)` im Arbeitsblatt, mit Bildunterschrift und Bezug im Text). Was nicht stimmt, mit `scobees_update_aufgabe` oder `scobees_move` korrigieren; was sich über die Schnittstelle nicht setzen lässt, kommt in die Checkliste. Liefert ein Werkzeug `warnungen[]` mit (z. B. bei `$…$` in einer Lückenantwort), diese im Abschlussbericht nennen, nicht stillschweigend übergehen. Für eine kleine Korrektur an einem schon bestehenden Arbeitsblatt eignet sich `scobees_patch_arbeitsblatt` (gezielte Textersetzung) besser als `scobees_update_aufgabe` mit komplett neu geschriebenem `arbeitsblatt_markdown`.

**2. Vorschau in der Weboberfläche.** Was Lernende sehen, zeigt nur die Vorschau: `https://teach.scobees.com/library/editor/<Lernpfad-ID>` öffnen (oder Bib → Lernpfad), dort „Ansicht Lernende“, im Dialog „Lernpfad aus Sicht der Lernenden“ ein Niveau wählen und **jede Aufgabe einmal öffnen**. Quizze lassen sich ausprobieren (Antwort eingeben, „Stimmt's?“); Eingaben werden nicht gespeichert, Abgaben lassen sich hier nicht testen. Achten auf: Abbildungen geladen und lesbar, Tabellen ohne seitliches Scrollen, Nummerierung, Kästen, Quiz-Rückmeldungen, Anhänge. Steht ein Browser-Werkzeug zur Verfügung, die Seite öffnen und die Lehrkraft bitten, sich selbst anzumelden; Zugangsdaten gibst du nie ein, und andere Bereiche der Oberfläche (Lerndoku, Klassen, Konfiguration) öffnest du nicht. Ohne Browser-Werkzeug bekommt die Lehrkraft diese Prüfpunkte als Liste.

**3. Durchgang als Test-Lernende/r (optional, Sache der Lehrkraft).** Sollen Abgaben, die Selbstkorrektur oder die Bearbeitungsreihenfolge geprüft werden, weist die Lehrkraft den Lernpfad zuerst nur einem Dummy-Konto zu (im Dialog „Zuweisen“ der Reiter „Lernenden gezielt zuweisen“) und geht ihn in `https://learn.scobees.com` durch. Du schlägst das vor und nennst, worauf zu achten ist (Stift-Abgabe: Auftrag auf dem PDF lesbar? Selbstkorrektur: eigenes Ergebnis links, Musterlösung rechts? Wahlpflicht am Ende der Gliederung?); Zuweisung und Anmeldung macht die Lehrkraft, und du liest dort nur mit, wenn sie ausdrücklich darum bittet und es ein Dummy-Konto ist.

**4. Befundliste.** Was abweicht, was du korrigiert hast, was nur in der Weboberfläche geht. Sie geht in den Abschlussbericht (Schritt 9).

**5. Erst danach** weist die Lehrkraft den Lernpfad der Lerngruppe zu. Mit der Zuweisung ist der ganze Inhalt für die Lernenden sichtbar; ein gesondertes Veröffentlichen der Aufgaben braucht es nicht.

### 9. Abschlussbericht an die Lehrkraft (immer)

Dieselbe Vorlage mit `"modus": "bericht"`: jede Gliederung und Aufgabe mit vollständiger ID (zum Kopieren für Folgeaufträge), Prüfstatus je Aufgabe aus dem Zurücklesen (`status: "ok"` oder `"warn"` mit `hinweis`, was abweicht), Abbildungen je Aufgabe, Dateien mit Zuordnung zur Aufgabe (auch die SVG-Quelldateien der Abbildungen), Checkliste für die Weboberfläche, Vorschläge. Jede Warnung wird automatisch auch ein Punkt der Checkliste. Dazu im Chat drei Sätze: Was ist angelegt, was bleibt von Hand, was schlägst du vor.

Checkliste, immer dabei:

- Lernpfad zuweisen (bis dahin sehen Lernende nichts; Status „inaktiv“ ist normal): an eine Klasse oder Gruppe, nach Differenzierungen oder gezielt an einzelne Lernende; zugewiesen wird immer der ganze Lernpfad, optional mit Wochenfrist. Vorher prüfen, ob die Lernenden im Fach ein Niveau haben
- Vorschau „Ansicht Lernende“ durchgehen, falls in Schritt 8 noch nicht geschehen
- Der Status „Entwurf“ an Gliederungen und Aufgaben ist normal und hindert die Sichtbarkeit nicht: Nach der Zuweisung sehen Lernende alles, was im Lernpfad liegt
- Bearbeitungsreihenfolge und Aufgabenwahl kontrollieren
- Stift-Abgaben und Selbstkorrektur einmal mit einem Dummy-Konto in learn.scobees.com ausprobieren (in der Vorschau nicht testbar)
- alles, was sich über die Schnittstelle nicht setzen ließ

## Modus C: Bestehenden Pfad überarbeiten

- Zuerst lesen: `scobees_get_lernpfad` (Baum mit IDs), dann `scobees_get_aufgabe` für alles, was geändert wird. Das Arbeitsblatt kommt als Markdown zurück und wird beim Ändern über `scobees_update_aufgabe` **komplett ersetzt**; also das gelesene Markdown ändern, nicht neu schreiben. Betrifft die Änderung nur wenige Stellen (ein ausgetauschter Satz, eine neue Bild-URL), stattdessen `scobees_patch_arbeitsblatt` mit den betroffenen Textstellen verwenden – spart das Mitschicken des ganzen, oft langen Markdowns und schlägt kontrolliert fehl, wenn eine Stelle nicht eindeutig ist.
- **Läuft der Lernpfad schon bei einer Lerngruppe?** `scobees_get_lernpfad` zeigt es als `zugewiesen: true`. Dann vorher fragen und so arbeiten, dass nie ein halber Stand sichtbar ist: Jede neue Aufgabe entsteht in einem Aufruf vollständig (Titel, Beschreibung, Arbeitsblatt, Zeit), Material folgt unmittelbar; nichts Unfertiges „erst mal anlegen“. Jede Änderung ist für zugewiesene Lernende sofort wirksam, sobald sie die Aufgabe neu öffnen. Gespeicherte Quiz-Stände gehen dabei nicht verloren, weil scobees keine speichert; wer aber gerade an der Aufgabe sitzt, arbeitet nach dem Neuladen mit geändertem Inhalt und leeren Feldern. Änderungen an laufenden Lernpfaden deshalb nur mit Zustimmung und möglichst außerhalb der Unterrichtszeit. Bereits abgegebene Lernergebnisse bleiben, wie sie sind; soll eine geänderte Aufgabe neu bearbeitet werden, setzt die Lehrkraft sie in der Lerndoku zurück („Lernergebnis zurücksetzen“ oder „Aufgabe komplett zurücksetzen“). Das der Lehrkraft im Abschlussbericht sagen.
- Den Grobplan auf die Änderung beschränken: Tabelle nur mit betroffenen Zeilen und einer Spalte „vorher / nachher“.
- Der Mindeststandard für Abbildungen (2a) gilt für jedes Arbeitsblatt, das neu entsteht oder inhaltlich überarbeitet wird. Fehlen Abbildungen in Aufgaben, die nicht angefasst werden, das im Grobplan als Vorschlag nennen und nicht ungefragt nachrüsten.
- Vor dem Löschen (`scobees_delete`, `confirm: true`) immer ausdrücklich bestätigen lassen. Regeln von scobees: Ein ganzer Lernpfad wird samt Inhalt gelöscht, aber nur solange er nicht zugewiesen ist (sonst muss die Lehrkraft erst die Zuweisung aufheben). Gliederungen und Wahlpflichtaufgaben lassen sich nur leer löschen. Einzelne Aufgaben lassen sich auch in einem zugewiesenen Lernpfad löschen und verschwinden dann sofort bei den Lernenden, selbst wenn schon Lernergebnisse abgegeben sind; das Werkzeug verlangt dafür `auch_wenn_zugewiesen: true`, und das setzt du nur, wenn die Lehrkraft genau diese Aufgabe genannt und dem Löschen trotz Abgaben zugestimmt hat.
- Eine neue Fassung einer Datei ersetzt die alte nicht automatisch: `scobees_upload_material` mit `ersetzt_attachment_id` (ATT-ID der alten Fassung aus `scobees_get_aufgabe`) hochladen, oder erst `scobees_delete_material` (`confirm: true`) und danach neu hochladen. Sonst hängen beide Fassungen nebeneinander an der Aufgabe. Bei einer Stift-Abgabe (`abgabeformen: pen`) warnt `scobees_delete_material`, wenn dabei das letzte PDF-Material wegfällt – das vor dem Löschen beachten.
- Beim Verschieben die `sort_order` der Nachbarn mitdenken; nach dem Umbau Baum zurücklesen.
- Wurde ein Arbeitsblatt in der Weboberfläche mit Bausteinen gebaut, die Markdown nicht kennt (Bild-Zuordnung, interaktives Video), nur über `mit_serlo_json: true` lesen und per `serlo_json` zurückschreiben; sonst gehen diese Bausteine verloren. Markdown-Rückweg vorher mit `scobees_markdown_vorschau` vergleichen.

## Modus B: Aus Unterlagen

- Unterlagen vollständig lesen, bevor der Grobplan entsteht; Aufbau, Reihenfolge und Formulierungen der Lehrkraft übernehmen, wo sie tragen.
- Fehlendes (Szenario, Ergebniszeile, Kontrolle nach Theorie) ergänzen und im Grobplan als Ergänzung markieren, damit die Lehrkraft sieht, was neu ist.
- Aufgaben aus Arbeitsblättern mit Rechnungen werden zu `quiz-input` mit Einheit und typischen Fehlerwerten; Zuordnungen zu `quiz-blanks-dnd`; offene Aufgaben zu Abgaben mit Musterlösung, wenn eine Lösung in den Unterlagen steht.
- Abbildungen aus den Unterlagen so verwenden, wie in Schritt 1 vereinbart (übernehmen, als Grundlage, neu erstellen). Reichen sie für den Mindeststandard aus 2a nicht, die fehlenden ergänzen und im Grobplan als Ergänzung markieren.
- Urheberrecht: fremde Abbildungen und Texte aus Schulbüchern nicht hochladen und nicht abzeichnen; den Sachverhalt eigenständig neu darstellen und das in den Bericht schreiben.

## Qualitätsregeln für Quizze und Eingaben

- Einheit fest neben dem Feld (`= 254 Hosts`), Lernende tippen nur die Zahl.
- scobees vergleicht Eingaben zeichengenau (live geprüft, 94.6): `8.40` ist falsch, wenn nur `8,4` hinterlegt ist. Jede zulässige Schreibweise einzeln hinterlegen (`= 8,4` und `= 8.4`), und in der Frage sagen, wie gerundet wird.
- Typische Fehlerwerte mit Rückmeldung (`≠ 256 :: Netz- und Broadcastadresse abziehen`).
- IP-Adressen, Netzmasken und Bitmuster lassen sich eingeben und prüfen (`= 172.16.40.1`, `= 0100`); führende Nullen bleiben erhalten. Typische Verwechslungen als Fehlerwert hinterlegen (`≠ 172.16.40.0 :: Das ist die Netzadresse.`).
- Tipp-Lückentexte vermeiden, wenn die Schreibweise scheitern kann; Drag-and-drop mit Distraktoren, Ziffern als Lösung oder Wortspeicher sind robuster.
- Rückmeldungen je Antwort bei Auswahlfragen: `- [x] Antwort :: Rückmeldung`.
- Quiz-Eingaben werden nicht gespeichert: Verlassen Lernende die Aufgabe oder laden sie neu, sind alle Felder leer. Erst beim Abgeben legt scobees ein Bild des Arbeitsblatts zum Lernergebnis; nur dieses Bild sieht die Lehrkraft später, eine Auswertung der Quiz-Antworten gibt es nicht. Antworten, auf die es ankommt, gehören deshalb in eine Abgabe (Datei, Stift) oder in eine Freitext-Frage, die beim Abgeben ausgefüllt ist. Ein Arbeitsblatt muss deshalb in einem Zug zu schaffen sein (Richtwert 20 bis 30 Minuten), und die Beschreibung sagt es: „Bearbeite die Fragen und klicke dann auf Lernergebnis abgeben.“
- Die Antworten von Auswahlfragen werden für Lernende gemischt, bei jedem Öffnen neu. Keine Verweise auf „a)“, „die erste Antwort“ oder „alle oben genannten“, weder in der Frage noch in Rückmeldungen.
- Der Satz vor einem Quiz ist ein Hinweis („Prüfe dein Verständnis:“), keine Frage. Steht dort eine Frage, wirkt es, als fehle die Antwortauswahl; die Frage gehört in den Quiz-Block.
- Bei Freitext (`quiz-text`) gibt es keine automatische Prüfung; dann Aufklapp-Block „Lösungshinweis“ darunter.

Weitere Syntax und bekannte Fallen: `references/markdown.md`.
