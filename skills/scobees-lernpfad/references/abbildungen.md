# Abbildungen herstellen (scobees-mcp 0.1.11)

Gilt für Fachabbildungen und Situationsillustrationen im Arbeitsblatt. Wann welche Abbildung Pflicht ist, steht in `SKILL.md`, Abschnitt 2a. Kachelbilder sind etwas anderes und stehen in `references/werkzeuge.md`.

## Der Weg, immer in dieser Reihenfolge

1. **Entscheiden, was die Abbildung zeigen soll.** Ein Satz: „Die Abbildung zeigt, …“. Dieser Satz wird später die Bildunterschrift. Fällt dir der Satz nicht ein, fehlt noch die Idee, nicht die Zeichnung.
2. **Als SVG zeichnen** (Regeln unten) und im Themenordner der Lehrkraft speichern, Dateiname mit Aufgabennummer: `2-1_messschaltung.svg`.
3. **Als PNG rendern**, doppelte Auflösung (1600 px breit bei einer 800er Zeichenfläche).
4. **Das PNG ansehen** und gegen die Prüfliste halten. Dieser Schritt entfällt nie; ein SVG, das im Quelltext richtig aussieht, ist gerendert oft fehlerhaft.
5. Fehler im SVG beheben, neu rendern, wieder ansehen.
6. **Hochladen** mit `scobees_upload_bild` (PNG) und die URL als `![Bildunterschrift](URL)` ins Arbeitsblatt setzen.

Rendern, je nachdem was die Umgebung bietet:

```bash
# Edge oder Chrome ohne Fenster; window-size = Breite,Höhe der viewBox
msedge --headless=new --hide-scrollbars --force-device-scale-factor=2 --window-size=800,450 --screenshot=2-1_messschaltung.png file:///C:/…/2-1_messschaltung.svg
```

```python
import cairosvg                      # falls installiert
cairosvg.svg2png(url="2-1_messschaltung.svg", write_to="2-1_messschaltung.png", output_width=1600)
```

Diagramme aus Zahlen (Kennlinie, Balken, Zeitverlauf) dürfen direkt mit matplotlib als PNG entstehen (`dpi=200`, Schrift mindestens 12 pt, deutsche Achsenbeschriftung mit Einheit). Gibt es keinen Renderer, das SVG im Browser oder als Artefakt ansehen und direkt hochladen; `scobees_upload_bild` nimmt auch SVG (live geprüft). PNG bleibt der Normalfall, weil es auf jedem Gerät gleich aussieht.

## Welche Fachabbildung für welchen Inhalt

| Inhalt | Form |
|---|---|
| Schaltung, Verdrahtung, Messanordnung | Schaltplan oder Anschlussbild mit eingezeichnetem Messgerät |
| Aufbau eines Geräts, einer Anlage, eines Netzes | Blockdiagramm, Netzplan, Schnittbild mit Beschriftung am Bauteil |
| Ablauf, Reihenfolge, Zustände | Ablaufdiagramm, Zeitstrahl, Zustandsfolge von links nach rechts |
| Zusammenhang zweier Größen | Kennlinie oder Diagramm mit beschrifteten Achsen und einem markierten Arbeitspunkt aus dem Szenario |
| Mengen, Anteile, Vergleich von Varianten | Balken oder maßstäbliche Flächen (z. B. nutzbare Kapazität je RAID-Level) |
| Adress- oder Bitstruktur, Aufteilung eines Ganzen | Streifen mit Feldern und Grenzen (Netz- und Hostanteil, Rahmenaufbau) |
| Vorher und nachher, richtig und falsch | zwei gleich aufgebaute Teilbilder nebeneinander |

## Zeichenregeln für Fachabbildungen

- Zeichenfläche `viewBox="0 0 800 H"`, Querformat, H zwischen 300 und 500. Hochformate und sehr breite Streifen werden im Arbeitsblatt zu klein.
- Weißer Hintergrund als Rechteck über die ganze Fläche, damit die Abbildung auf jedem Seitenhintergrund lesbar bleibt.
- **Rand von 40 px** rundum bleibt frei. Texte mit `text-anchor="end"` oder `"middle"` laufen sonst über den Rand und werden abgeschnitten.
- Schrift: `font-family="Arial, Helvetica, sans-serif"`, mindestens 18 px, Formelzeichen und Werte 20 px. Kleiner wird auf einem Tablet unlesbar.
- Linien mindestens 2 px, Leiter und Hauptlinien 3 px.
- Höchstens vier Farben, jede mit fester Bedeutung in allen Abbildungen des Lernpfads (z. B. Dunkelgrau für die Schaltung, Rot für Strom, Grün für das Messgerät). Farbe ist nie der einzige Bedeutungsträger; was farbig ist, ist auch beschriftet.
- Beschriftung direkt am Objekt, keine Legende, keine Nummern mit Auflösung im Text.
- Werte, Namen und Bezeichnungen stammen aus dem Szenario und stimmen mit dem Text des Arbeitsblatts überein.
- Höchstens etwa sieben Elemente. Was mehr braucht, wird zu zwei Abbildungen.
- Kein Titel im Bild; die Überschrift steht im Arbeitsblatt, die Aussage in der Bildunterschrift.
- Die Abbildung verrät nicht die Lösung der Frage, die zu ihr gehört. Gesuchte Größen stehen als „I = ?“ im Bild.

## Prüfliste beim Ansehen des PNG

- Nichts ist abgeschnitten, auch nicht am linken und rechten Rand (häufigster Fehler: Beschriftung links von einem Bauteil).
- Keine Beschriftung überdeckt eine Linie, ein Bauteil oder eine andere Beschriftung.
- Leitungen treffen die Bauteile; es gibt keine Lücken und keine überstehenden Enden.
- Pfeile zeigen in die fachlich richtige Richtung.
- Sonderzeichen sind dargestellt (Ω, µ, °, ≥, Indizes).
- Bei halber Größe ist jede Beschriftung noch lesbar.
- Fachlich richtig: Werte, Einheiten, Polung, Symbole. Bei Schaltplänen die Symbol-Prüfliste unten.
- Die Aussage aus Schritt 1 ist ohne den Text erkennbar.

Was die Prüfliste nicht besteht, wird nicht hochgeladen.

## Europäische Schaltsymbole (DIN EN 60617 / IEC 60617)

Selbst gezeichnete Schaltpläne rutschen leicht in die amerikanische Form (ANSI/IEEE). Vor dem Hochladen gegenprüfen:

- Widerstand: Rechteck (nicht die Zickzacklinie)
- Schalter: schräger Strich mit Kontaktpunkt, offen dargestellt (nicht der Knick mit Kreisen)
- Sicherung: Rechteck mit durchgehender Linie durch die Mitte
- Spule, Relais, Schütz: Rechteck (nicht die Schleifenspirale)
- Erdung: drei waagerechte Striche abnehmender Länge; Schutzleiter zusätzlich mit Gehäusesymbol
- Leuchte: Kreis mit Kreuz; Motor: Kreis mit „M“ und Phasenzahl (M 3~)
- Spannungsquelle: Kreis mit „G“ oder die Batterie mit langem und kurzem Strich; Messgeräte: Kreis mit „V“, „A“, „Ω“
- Steckdose, Taster, Transformator: nach DIN EN 60617, wie im Lehrbuch der Lehrkraft

Im Zweifel ein Normsymbol aus einer vorhandenen Schulvorlage als Referenz nehmen statt freihändig zu zeichnen. Trägt der Schaltplan die Hauptaufgabe, liest die Lehrkraft ihn vor dem Hochladen gegen.

## Situationsillustrationen

Eine Situationsillustration zeigt die Szene, in der die Lernenden arbeiten: den Ort, ihre Rolle und den Auftrag. Sie wird wie eine Fachabbildung gezeichnet, gerendert und angesehen, hat aber andere Regeln:

- **Motiv aus dem Szenario, mit einem konkreten Detail**, an dem man den Auftrag erkennt: das Ticket auf dem Monitor, der geöffnete Verteiler mit dem fehlenden Prüfprotokoll, der Serverschrank mit der roten Leuchte. Ein Bild, das zu jedem Lernpfad desselben Themas passen würde, ist zu allgemein.
- **Ein Stil für den ganzen Lernpfad.** Vor der ersten Illustration festlegen und bei allen weiteren wiederverwenden: flächige Vektorzeichnung, vier bis fünf Farben, eine Strichstärke, dieselben Figuren. Den Stil in einem Satz im Themenordner notieren (`abbildungen_stil.txt`), damit spätere Ergänzungen dazu passen.
- **Figuren schlicht**: einfache Formen, keine Porträtähnlichkeit mit echten Personen, keine Klischees. Die Lernenden sind die handelnde Figur, nicht Zuschauer.
- **Kein Fließtext im Bild.** Erlaubt sind kurze Beschriftungen, die in der Szene vorkommen (Firmenschild, Displayanzeige, Betreff des Tickets).
- Keine echten Marken, Logos oder Produktabbildungen.
- Zeichenfläche `viewBox="0 0 800 450"`, Rand und Mindestgrößen wie bei Fachabbildungen.
- Steht in der Umgebung ein Bildgenerator zur Verfügung, darf er für Situationsillustrationen verwendet werden; dann denselben Stilsatz in jeder Anfrage mitgeben und das Ergebnis genauso ansehen und prüfen. Fachabbildungen werden immer gezeichnet, nie generiert.

Eingebunden wird sie am Anfang der Einstiegsaufgabe, vor dem Text der Situation. Die Bildunterschrift nennt Ort und Auftrag in einem Satz, und der erste Arbeitsauftrag greift die Szene auf.

## Abbildungen, die die Lehrkraft mitbringt

In Schritt 1 des Skills wird geklärt, wie sie verwendet werden:

| Vereinbarung | Vorgehen |
|---|---|
| **übernehmen** | Datei unverändert hochladen (PNG, JPG, GIF, WebP, SVG; aus PDF, Word oder Folien vorher als Bild herauslösen). Nur zuschneiden, wenn Ränder oder Seitenzahlen stören. Im Grobplan „übernommen“. |
| **als Grundlage** | Inhalt, Werte und Aussage übernehmen, nach den Zeichenregeln oben im Stil des Lernpfads neu zeichnen. Im Grobplan „neu gezeichnet nach Vorlage“. |
| **neu erstellen** | Nur das Thema ist vorgegeben; die Abbildung entsteht frei nach den Regeln oben. |

Ohne Vereinbarung: selbst erstellte Abbildungen der Lehrkraft übernehmen, alles andere neu erstellen. Ist eine übernommene Abbildung im Arbeitsblatt unleserlich (zu klein, schlechter Scan), das der Lehrkraft im Grobplan als Frage an der Aufgabe sagen und „als Grundlage“ vorschlagen.

Fremde Abbildungen (Lehrbuch, Hersteller, Internet) werden nie hochgeladen und nicht abgezeichnet, auch nicht „als Grundlage“. Übernommen wird der Sachverhalt, die Darstellung entsteht eigenständig. Ausnahme: Die Lehrkraft nennt eine freie Lizenz; dann steht die Quellenangabe in der Bildunterschrift.

Alle hochgeladenen Abbildungen liegen öffentlich im Medienspeicher des Serlo-Editors: keine Personenfotos, nichts Vertrauliches, keine Unterlagen mit Namen.

## Einbinden im Arbeitsblatt

```markdown
Schau dir zuerst an, wo das Messgerät sitzt:

![Messschaltung: Der Strommesser liegt in Reihe zum Widerstand R = 100 Ω.](https://…/image.png)

Der Strommesser wird in den Stromkreis eingeschleift …
```

- Der Text in den eckigen Klammern ist Bildunterschrift und Alternativtext zugleich: ein ganzer Satz, der sagt, was zu sehen ist. Nicht „Abbildung 1“ und nicht der Dateiname.
- Der Text davor oder danach nimmt auf die Abbildung Bezug.
- Zu jeder Fachabbildung gehört mindestens eine Frage, die sich nur mit ihr beantworten lässt: Wert ablesen (`quiz-input`), Bauteil oder Bereich benennen (`quiz-blanks-dnd`), Fehler finden oder Variante wählen (`quiz-sc`), Anschluss begründen (`quiz-text`).
- Abbildungen funktionieren auch in `:::box` und `:::spoiler` (z. B. die Lösungsskizze im Aufklapp-Block).
