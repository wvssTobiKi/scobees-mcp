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

### Sichtprüfung als Schüler (Subnetting-Werkstatt, 27.10.2026, scobees-mcp 0.1.4)

| Beobachtung | Ort | Stand |
|---|---|---|
| 1.1 `info`: Schaltfläche „Infoinput erledigt“ statt Abgabe | – | wie vorgesehen; reine Lese-Bausteine so anlegen |
| 2.1 `quiz-blanks-dnd`: Wortspeicher mit Distraktoren, Ziehen und Prüfen funktionieren | – | bestätigt |
| 3.1 `abgabeformen: ["pen"]` + PDF-Vorlage: Stiftwerkzeuge über dem PDF, Ausfüllen und Abgabe möglich; Hinweis „Zum Abgeben musst du auf dem PDF schreiben“ | – | bestätigt; `pen` verlangt zwingend ein PDF als Material |
| 4.1 `abgabe_pflicht_selbstkorrektur` + Musterlösung: Reiter „Selbstkorrektur“ zeigt Abgabe und Musterlösung nebeneinander; Lernende können zum Vergleich auch das Auftrags-PDF wählen | – | bestätigt |
| Serlo-Arbeitsblatt heißt in der Materialkachel immer „Serlo-Inhalt“ | – | nicht änderbar: das Arbeitsblatt ist ein einzelnes Feld der Aufgabe (`taskDescription`) ohne Namen, die Beschriftung ist fester Oberflächentext. Orientierung geben daher Aufgabentitel, Beschreibung („Ergebnis: …“) und die erste Überschrift im Arbeitsblatt – Skill: Arbeitsblatt immer mit sprechender H1 beginnen |

## Didaktische Leitplanken (Entwurf)

- **Situationsbeschreibung** als eigene erste Gliederung mit einer `info`-Aufgabe (Auftrag, Rolle, Kunde) und ggf. Material (Ticket, Mail) als Anhang.
- **Theorie in Häppchen**: eine Gliederung pro Thema, Arbeitsblatt mit max. 1–2 Bildschirmseiten Text, dann sofort Kontrolle.
- **Kontrollform passend zum Inhalt**: Begriffe/Zuordnung → `quiz-blanks`/`quiz-blanks-dnd`; Entscheidung → `quiz-sc`; Mehrfacheigenschaften → `quiz-mc`; Rechnung → `quiz-input` mit Einheit; Begründung → `quiz-text` oder Abgabe.
- **Differenzierungen**: ohne Angabe für alle Niveaus; bei getrennten Varianten je Aufgabe ein Niveau. Der Pfad zeigt das Aggregat.
- **Aufgabentyp**: `pflicht` für den roten Faden, `extra`/`training` für Vertiefung und Übung (zählen nicht zum Pflicht-Fortschritt), `info` für Infobausteine.
- **Interaktive Inhalte**: eigenständige HTML-Simulationen als Material anhängen (laufen direkt im Browser, siehe Ohm-Rechner/RAID-Lab); Bilder fürs Arbeitsblatt mit `scobees_upload_bild`; GeoGebra/YouTube per URL-Zeile.
- **Abschlussbericht an die Lehrkraft**: Baum mit IDs, was manuell bleibt (Zuweisung, Sichtprüfung), bekannte Grenzen (keine Bild-Zuordnung per Markdown).

## 12.11.2026: Abbildungen von Kachelbildern getrennt (0.1.11)

Rückmeldung aus der Praxis: Kachelbilder (Titelbild, Gliederung, Aufgabe) entstehen gut, Abbildungen auf den Arbeitsblättern dagegen zu selten oder am Zweck vorbei. Ursache im Skill-Text: Die Rückfrage in Schritt 1 führte „Abbildungen im Arbeitsblatt“ als vierte Bild-Ebene neben den Kacheln und stellte alle unter „teuerster Teil der Arbeit“; die Begriffe Bild, Abbildung, Darstellung, Skizze und Diagramm wechselten; nirgends stand, wie eine Abbildung entsteht und wann sie gut ist.

Entscheidungen der Lehrkraft: Kachelbilder sind Schmuck und optional. Fachabbildungen und Situationsillustrationen dienen dem Lernfortschritt und sind Pflicht, als feste Regel. Für mitgebrachte Abbildungen wird gefragt: übernehmen, als Grundlage, neu erstellen.

Erfahrung beim Ausprobieren des Herstellungswegs: Eine nach den Regeln gezeichnete Messschaltung sah im SVG-Quelltext richtig aus, im gerenderten PNG war die Beschriftung links der Spannungsquelle am Bildrand abgeschnitten. Deshalb ist „rendern und ansehen“ ein fester Schritt und der 40-px-Rand eine Zeichenregel. `scobees_upload_bild` liefert SVG und PNG korrekt aus; PNG ist der Normalfall, weil es auf jedem Gerät gleich aussieht.

Noch offen: ein vollständiger Praxislauf mit der neuen Fassung (Testfall `neu-bfs-dual-subnetting` oder die nächste echte Lernsituation).

## 12.11.2026: Erkenntnisse aus einem Praxislauf (0.1.12)

Beim Aufbau einer Lernsituation wurden die Bilderfrage und der Grobplan übersprungen; eine Aufgabe und ein Einstiegstext gingen ungesehen nach scobees. Der Grobplan war im Skill zwar als „immer“ markiert, stand aber erst in Schritt 4. Deshalb stehen die beiden Bedingungen jetzt als Sperren vor dem Ablauf, mit dem ausdrücklichen Satz, dass eine knappe Zusage vor dem gezeigten Plan keine Freigabe ist.

Die Darstellungsregeln (Etiketten der Kästen, Nummerierung nach Tabellen, Tabellenbreite, Codezeilen, gemischte Antworten, Satz vor dem Quiz) stammen aus der Vorschau „Ansicht Lernende“ und stehen in `references/markdown.md`. Die Bildunterschrift war in 0.1.11 als „ganzer Satz“ beschrieben; weil sie sichtbar unter der Abbildung steht, ist sie jetzt auf einen kurzen Satz begrenzt.

Bewusst nicht im Skill: konkrete Lernpfade, Klassen, Fächer und Jahrgänge einer Schule. Der Skill fragt danach; was für eine bestimmte Lernsituation gilt, gehört in die Unterlagen der Lehrkraft.

## 12.11.2026: Durchgang aus Schülersicht

Mit einem Dummy-Konto der Lehrkraft durchgespielt (Einzelheiten: API-Karte, Mitschrift 16). Drei Befunde haben Regeln des Skills geändert, die bisher auf Annahmen beruhten: (1) „Nach Reihenfolge“ sperrt nicht, der rote Faden muss aus dem Aufbau kommen. (2) Bei Stift-Abgaben sehen Lernende das PDF, nicht das Arbeitsblatt. (3) Quiz-Eingaben werden nicht gespeichert, Arbeitsblätter müssen in einem Zug zu schaffen sein. Die Sorge, beim Überschreiben eines Arbeitsblatts gingen Stände verloren, ist damit erledigt; die Vorsicht bei laufenden Lernpfaden bleibt, weil Änderungen sofort wirken.

Die eigene Test-Abbildung hat nebenbei zwei Zeichenregeln geliefert: Der Satz im Bild stand doppelt (einmal gezeichnet, einmal als Bildunterschrift), und 20 px Schrift waren in der halben Bildschirmbreite knapp.

## 12.11.2026: Zweiter Block mit dem Dummy-Konto

Zwei Befunde mit Folgen für den Aufbau jeder Lernsituation: (1) Ein Anhang verdrängt das Arbeitsblatt aus der Startansicht, und der Wechsel zwischen Anhang und Arbeitsblatt leert die Quizfelder. Das bisherige Muster „Arbeitsblatt mit Quiz plus HTML-Simulation als Material an derselben Aufgabe“ funktioniert für Lernende also schlecht; Simulation und Quiz gehören in zwei aufeinanderfolgende Aufgaben. (2) In einem zugewiesenen Lernpfad gibt es keinen Entwurfszustand: Was über die Schnittstelle entsteht, steht sofort bei den Lernenden. Der Server warnt deshalb jetzt selbst, damit die Regel nicht allein vom Skill abhängt.

## 12.11.2026: Reihenfolge – eine falsche Schlussfolgerung korrigiert (0.1.13)

In 0.1.12 stand im Skill, „nach Reihenfolge“ sperre nicht, und der rote Faden müsse allein aus dem Aufbau kommen. Der Befund war richtig beobachtet, die Erklärung falsch: Die Einstellung saß am falschen Element. Aufgefallen ist das erst beim Zurücklesen eines Lernpfads, den die Lehrkraft in der Weboberfläche gebaut hatte. Lehre für künftige Tests: Wenn sich die Plattform anders verhält als ihre Oberfläche verspricht, zuerst einen in der Oberfläche gebauten Lernpfad über die Schnittstelle lesen und mit dem eigenen vergleichen.

## 16.11.2026: Abgleich mit einem Unterrichts-Repository (0.1.14)

Die Lehrkraft pflegt ihre Lernsituationen in einem eigenen Repository mit einem Ausgabeprofil für scobees. Dort hatten sich allgemeine Regeln angesammelt, die eigentlich in den Skill gehören. Nach dem Abgleich führt das Profil allgemeine Regeln nicht mehr doppelt; was im Skill fehlte, ist mit 0.1.14 übernommen. Aufgefallen ist dabei auch, dass in Claude Desktop tagelang noch der Skill 0.1.9 eingebunden war, während der Server schon 0.1.13 war: Der Skill wird nicht mit der Erweiterung aktualisiert, sondern muss von Hand ersetzt werden, und eine laufende Unterhaltung behält die Fassung, mit der sie begonnen hat.

Zwei Korrekturen an eigenen Festlegungen: Die Du-Form war als allgemeine Regel zu eng (Fachschule Technik: Sie). Und „erst danach weist die Lehrkraft zu“ las sich wie eine Sperre für die Lehrkraft; gemeint ist eine Empfehlung, verbindlich ist die Prüffolge nur für den Skill selbst.

## 16.11.2026: Abstand und ein Hänger im Umwandler (0.1.15)

Die Lehrkraft hatte für Arbeitsschritte eine Form gefunden, die in der Ansicht für Lernende gut aussieht, aber ein unsichtbares Zeichen im Quelltext braucht. Der Wunsch nach einer lesbaren Schreibweise hat nebenbei einen alten Fehler aufgedeckt: Hätte ein Dialog `:::abstand` oder `:::schritt` mit dem Server 0.1.14 ausprobiert, wäre die Umwandlung in einer Endlosschleife hängen geblieben. Der Fehler steckte seit der ersten Fassung in der Absatz-Erkennung und fiel nie auf, weil alle Tests gültiges Markdown verwendeten. Die neuen Tests füttern die Umwandlung deshalb gezielt mit Zeilen, die nur wie ein Blockanfang aussehen.

## 16.11.2026: Prüfung auf interaktive Elemente sichtbar gemacht (0.1.17)

In einem Praxislauf entstanden zu drei Theorie-Aufgaben nur Abbildungen. Der Wortlaut in 2a war eindeutig („Lässt sich das Prinzip ausprobieren, beobachten oder vergleichen?“), aber das Ergebnis der Prüfung musste nirgends stehen. Bei den Abbildungen gibt es diese Stelle (`ohne_abbildung`), bei den interaktiven Elementen fehlte sie.

Entschieden: keine dritte Sperre, sondern eine Pflichtangabe im Grobplan (`interaktiv` / `ohne_interaktiv`), die die Vorlage selbst einfordert. Eine fehlende Angabe ist für die Lehrkraft rot sichtbar; die zweite Sperre nennt sie als Bedingung für die Freigabe. Die Vorlage erkennt Theorie-Aufgaben an der Marke „Theorie …“; das ist eine Konvention, kein Feld, und hängt daran, dass die Marke gesetzt wird.

Dabei aufgefallen: 2a und der Beispielplan hängten die Simulation an die Theorie-Aufgabe, Schritt 6 verbot genau das. Jetzt steht die Regel einmal in Schritt 6, 2a verweist darauf. Die Reihenfolge ist Theorie, dann Simulation, passend zu „erst rechnen, dann prüfen“. Die Tabelle der Mittel ist geteilt, weil sie Kontrollformen (Drag-and-drop, Auswahl) als interaktive Elemente führte.

Offen: ob die Abgrenzung (Video und PDF-Vorlage zählen nicht) im Unterricht trägt; ob eine Simulationsaufgabe mit `aufgabentyp: info` statt Pflicht sinnvoller ist, wenn sie niemanden aufhalten soll.

## 16.11.2026: Rückmeldungen aus einem Lernpfad mit 14 Aufgaben (0.1.18)

Dreizehn Beobachtungen aus dem Aufbau eines Lernpfads. Einsortiert nach der Frage, ob etwas an scobees liegt oder eine didaktische Entscheidung ist, die auch für ein PDF oder Moodle gälte. Ersteres steht hier vollständig; Letzteres (Auftrag oben, Hinweisniveau je Bildungsgang) steht hier nur als kurze Rückfallregel mit dem Vorrang der Quelle, weil der Skill auch ohne Unterlagen der Lehrkraft arbeitet.

Der Wunsch nach einem Kopierwerkzeug hat einen Endpunkt wieder hervorgeholt, der in einer früheren Mitschrift als „für ganze Lernpfade“ abgelegt war: Die damalige Fehlermeldung bezog sich auf das Ziel, nicht auf die Quelle. Eine einzelne Aufgabe lässt sich sehr wohl kopieren, wenn das Ziel die Wurzel ist. Der Wunsch `cover_image_von` (Kachelbild einer anderen Aufgabe wiederverwenden) ist zurückgestellt, weil die Kopie das Kachelbild mitbringt.

Dass ein Skill nach einer Zusammenfassung des Dialogs nur noch gekürzt im Kontext steht, lässt sich im Skill selbst nur ansprechen, nicht verhindern. Ob der Satz am Anfang von `SKILL.md` etwas bewirkt, zeigt erst der nächste lange Dialog.

