# Markdown für interaktive Arbeitsblätter (scobees-mcp 0.1.13)

Der Server übersetzt Markdown in das Dokumentformat des Serlo-Editors. Was hier steht, ist live geprüft. Unsicheres vorher mit `scobees_markdown_vorschau` testen – das Werkzeug meldet in `warnungen[]`, wenn eine Umwandlung zwar gelingt, aber nicht ganz das zeigt, was der Quelltext nahelegt (siehe unten bei Betonung und bei `quiz-blanks`).

## Grundelemente

```markdown
# Sprechende Überschrift (erste Zeile jedes Arbeitsblatts)
Absatz mit **fett**, *kursiv*, `code`, [Link](https://…) und $U = R \cdot I$ (LaTeX inline). `_kursiv_` mit Unterstrich funktioniert ebenso, außer innerhalb eines Worts (z. B. in `u_e`, `U_ref` bleibt der Unterstrich Text statt Betonung zu werden) – kommt beim Zurücklesen aber immer als `*kursiv*` zurück, gleiche Bedeutung, andere Schreibweise; `scobees_markdown_vorschau` weist darauf hin.

- Aufzählung
1. nummeriert

| Kopf | Kopf |
|---|---|
| Zelle | Zelle |

> Hinweis-Box (Zitat)

![Bildunterschrift als ganzer Satz](URL aus scobees_upload_bild)

https://www.geogebra.org/m/…      (Zeile nur mit URL → GeoGebra-Applet; YouTube/mp4 → Video)
```

Jede Zeile wird ein eigener Absatz; Leerzeilen sind nicht nötig. `---` wird ausgelassen (Serlo hat keine Trennlinie): Abschnitte mit Überschriften trennen. Geschütztes Leerzeichen (U+00A0) und schmales geschütztes Leerzeichen (U+202F), z. B. zwischen Zahl und Einheit (`10 kΩ`), bleiben über die Rundreise erhalten – live geprüft, auch in Tabellenzellen.

## Kästen und Aufklappen

```markdown
:::box note Titel
Text
:::
```
Typen und das Etikett, das Lernende über dem Kasten sehen: `note` „Beachte“, `attention` „Vorsicht“, `example` „Beispiel“, `quote` „Zitat“, `definition` „Definition“, `blank` und `warning` ohne Etikett; außerdem `theorem`, `proof` (nicht geprüft). Für Warnungen `attention` nehmen, weil `warning` wie ein leerer Kasten aussieht. Den Typ nach dem Etikett wählen: Ein Arbeitsauftrag in einem `quote`-Kasten trägt die Überschrift „Zitat“. Aufzählungen im Kasten funktionieren. Gut für „So gehst du vor“, „Beachte“, das Szenario-Zitat der Teamleitung. Bilder funktionieren auch innerhalb einer Box oder eines Spoilers (`![…](URL)`), live geprüft.

```markdown
:::spoiler Lösungshinweis
Text, mehrere Zeilen erlaubt
:::
```

## Code und Gleichungen

````markdown
```cpp
void loop() {}
```

```math
| Ohmsches Gesetz anwenden
U = R \cdot I | nach I umstellen
I = \frac{U}{R} | Werte einsetzen
= 3\,\mathrm{A}
```
````
Im `math`-Block erklärt der Text nach `|` den Schritt **zur nächsten Zeile**; eine Zeile, die nur mit `|` beginnt, ist die Einleitung.

## Quizze

````markdown
```quiz-sc
Welche Adresse ist die Broadcastadresse von 192.168.10.0/25?
- [x] 192.168.10.127 :: Richtig – die letzte Adresse des Subnetzes.
- [ ] 192.168.10.128 :: Das ist schon die Netzadresse des nächsten Subnetzes.
- [ ] 192.168.10.255
```
````
`quiz-mc` gleich, mehrere `[x]`. `:: Text` ist die Rückmeldung je Antwort.

````markdown
```quiz-input
Wie viele Hosts passen in ein /25-Netz?
= 126 Hosts
≠ 128 :: Netz- und Broadcastadresse abziehen.
≠ 127 :: Eine Adresse zu viel – Netz- und Broadcastadresse sind zwei.
```
````
`= Wert Einheit` trennt die Einheit ab und zeigt sie neben dem Feld; alternativ `unit: Hosts`. Mehrere `=` für Komma und Punkt (`= 8,4` und `= 8.4`). `≠ Wert :: Hinweis` ist ein typischer Fehler mit Rückmeldung. Verglichen wird zeichengenau (live geprüft in der Vorschau, scobees 94.6): `8.40` gilt nicht als `8,4`, `100` nicht als `0100`. Jede zulässige Schreibweise braucht deshalb ein eigenes `=`. Echte Zahlen werden als Zahleneingabe angelegt, alles andere als Texteingabe (Groß/Klein egal): IP-Adressen und Netzmasken (`= 172.16.40.1`), Versionsnummern, Bitmuster mit führender Null (`= 0100`) und Wörter. Beides funktioniert für Lernende gleich.

````markdown
```quiz-blanks
Strom wird in [[Ampere|A]] gemessen, Spannung in [[Volt|V]].
```
````
Tippen; `|` trennt zulässige Schreibweisen. Nur, wenn die Schreibweise eindeutig ist.

````markdown
```quiz-blanks-dnd
Eine IPv4-Adresse hat [[32]] Bit, aufgeteilt in vier [[Oktette]].
+ 16
+ Gateway
```
````
Drag-and-drop mit Wortspeicher; `+ …` sind Distraktoren. Robuste Standardform für Begriffe. Jede Zeile bleibt ein eigener Absatz. Eine Lückenantwort oder ein Distraktor als Formel (`[[$U=R\cdot I$]]`) wird als bloßer mathematischer Ausdruck verglichen (Serlo stellt Lückenantworten nicht als gerenderte Formel dar, nur Fließtext außerhalb der Lücke); `$…$` darf geschrieben werden, wird beim Speichern aber abgeschnitten; `scobees_markdown_vorschau` und `scobees_create_aufgabe`/`scobees_update_aufgabe` melden das in `warnungen[]`.

````markdown
```quiz-text
Begründe, warum das Gäste-WLAN ein eigenes Subnetz bekommt.
```
````
Freitext ohne automatische Prüfung; Lösungshinweis als Spoiler darunter oder Abgabe mit Musterlösung.

## So sieht es für Lernende aus (Vorschau und Dummy-Konto, scobees 94.6)

Das Arbeitsblatt belegt nur die linke Hälfte des Bildschirms; rechts stehen Zeit, Beschreibung und Material. Daraus folgt:

- **Tabellen** mit mehr als vier Spalten müssen seitlich gescrollt werden. Höchstens vier Spalten, kurze Zellen; breitere Vergleiche auf zwei Tabellen verteilen oder als Fachabbildung zeichnen.
- **Codeblöcke** haben Zeilennummern; lange Zeilen laufen aus dem sichtbaren Bereich und müssen seitlich gescrollt werden. Zeilen bis etwa 60 Zeichen, längere Befehle umbrechen.
- **Nummerierte Listen** beginnen nach einer Tabelle, einem Kasten, einer Abbildung oder einem Quiz wieder bei 1. Läuft eine Schrittfolge über so ein Element hinweg, die Schritte als Text schreiben: `**Schritt 5:** …`.
- **Bildunterschrift**: Der Text in `![…](URL)` steht sichtbar unter der Abbildung. Ein kurzer Satz, höchstens etwa zwölf Wörter.
- **Kästen** tragen ein Etikett je Typ (siehe oben).
- **Abbildungen** füllen die Breite der Arbeitsblatt-Spalte; die Bildunterschrift steht kursiv darunter. Steht derselbe Satz noch einmal in der Zeichnung, erscheint er doppelt.
- **Aufklapp-Blöcke** sind zugeklappt, zu sehen ist nur der Titel.
- **Eingaben bleiben nicht erhalten**: Nach Neuladen oder Verlassen der Aufgabe sind alle Quizfelder leer und die Antworten neu gemischt. Beim Abgeben speichert scobees ein Bild des ausgefüllten Arbeitsblatts als Teil des Lernergebnisses.
- **Anhänge verdrängen das Arbeitsblatt**: Hat die Aufgabe Material (PDF, Bild, HTML-Datei), steht links zuerst der erste Anhang, bei Stift-Abgaben das PDF mit den Stiftwerkzeugen. Das Arbeitsblatt ist dann nur über die Kachel „Serlo-Inhalt“ rechts erreichbar, und ein Wechsel zwischen den Kacheln leert alle Quizfelder.
- **Videos** (Zeile nur mit YouTube-Adresse) werden über youtube-nocookie.com eingebettet und starten beim Öffnen des Arbeitsblatts.
- **Auswahlfragen**: Die Antworten erscheinen in gemischter Reihenfolge.
- **Quiz prüfen**: Lernende tippen und bestätigen mit „Stimmt's?“; die Rückmeldung erscheint direkt darunter.

## Rundreise (Modus C)

`scobees_get_aufgabe` liefert das Arbeitsblatt als Markdown in genau dieser Syntax zurück (inklusive `≠`, `::`, `|`), `scobees_update_aufgabe` mit `arbeitsblatt_markdown` schreibt es komplett neu. Bausteine ohne Markdown-Entsprechung (Bild-Zuordnung, interaktives Video, H5P-Baustein) gehen dabei verloren: solche Aufgaben nur über `mit_serlo_json: true` lesen und per `serlo_json` zurückschreiben.

## Bekannte Grenzen

- Keine Bild-Zuordnung per Markdown (nur Serlo-JSON).
- Keine Rückmeldung je Lücke bei Lückentexten.
- Bilder liegen öffentlich bei Serlo.
- Das Arbeitsblatt erscheint in der Schüler-Kachel immer als „Serlo-Inhalt“ (kein Namensfeld).
- H5P-Dateien kann scobees nicht abspielen; gehostete H5P-Inhalte als Link an der Aufgabe (`links`) sind noch nicht geprüft.
