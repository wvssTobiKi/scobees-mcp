# scobees – API-Karte (aus Frontend-Code teach.scobees.com, v93.3, 2026-10-27)


## Methode: Mitschneiden

Die Oberfläche (Angular-SPA) spricht `https://platform-api.scobees.com/api` mit einem Bearer-Token. Da die Netzwerk-Ansicht des Browser-Panes keine Cross-Origin-Anfragen zeigt, wird ein Hook auf `fetch`/`XMLHttpRequest` in die Seite gesetzt: [`mitschnitt-hook.js`](mitschnitt-hook.js). Danach die Funktion in der Oberfläche einmal durchklicken (Seite nicht neu laden) und `window.__mcp` auslesen. Der Hook schwärzt Schüler-/Personenpfade sofort und speichert keine Authorization-Header. Jede Beobachtung wird unten als „Mitschrift n“ mit Datum und scobees-Version festgehalten; abgeleitete (nicht beobachtete) Aufrufe sind als solche markiert.

## Infrastruktur
- API-Basis: `https://platform-api.scobees.com/api`  (aus /assets/env.js)
- Auth: Keycloak, `https://auth.scobees.com`, Realm `scobees`, Client `scobees-teachers-app`,
  OIDC Authorization Code + PKCE, response_mode=fragment, redirect `https://teach.scobees.com/home`
- Schüler-App: `https://learn.scobees.com/`
- Frontend: Angular SPA, Requests via HttpClient → `${env.api.serverUrl}/${url}` (Bearer-Token erwartet)
- Impersonation-Endpunkte vorhanden (`impersonation/redeem|end|refresh`) → NICHT nutzen

## Inhaltsbezogen (Kandidaten für MCP-Werkzeuge)
- `workspaces`, `workspaces/{id}`, `workspaces/{id}/restore`
- `workspace/{id}/subjects?withDeleted=`, `workspace/{id}/subject`
- `subject/{id}`, `subject/{id}/cover-image`, `subject/{id}/deactivate`, `subject/{id}/restore?workspaceId=`, `subject/{id}/move?workspaceId=`
- `lerninput/{id}`, `lerninput/changePosition/{id}`, `lerninput/{id}/copy-into/{targetId}`,
  `lerninput/choice/{id}/convert-to-folder`, `lerninput/task/{id}/diffs`,
  `lerninput/{id}/sharings`, `lerninput/{id}/sharings/{sid}`, `lerninput/{id}/actions/export-pdf`
- `lerninput-selector/selector/{id}`, `lerninput-selector/{id}/children`, `lerninput-selector/{id}/siblings`
- `attachments`, `attachments/{id}`, `/attachments/{id}/{name}/download`, `attachment`, `attachment/download`
- `library/{id}`, `library/{id}/lerninput?…`, `library/{id}/lerninput/{lid}/actions/match-diffs`, `library/{id}/lerninput/{lid}/actions/copy`
- `school/learninput-icons/{id}`, `school/{id}/custom-labels`, `school/{id}/features`
- `school-competency-matrices/…` (Kompetenzraster – Inhalt, kein Schülerbezug)
- `school-diffs/{id}` (Differenzierungsstufen)

## Grenzbereich (Zuweisung an Lernende – nur wenn ausdrücklich gewünscht)
- `assignments/…` (`assignments/lerninput/{id}`, `assignments/{id}/visibility`, `/finish`, `/workdays`, `/unrestricted`, `assignments/{id}/group`, `check-assignable-students/{id}`)
- `subject/assignment/{id}`

## Schülerdaten – AUSGESCHLOSSEN (Sperrliste im Server)
students, users, linked-students, solutions, */lernergebnisse/*, learncoaching*, reflections*, reflection-*,
notes, learn-levels, learn-level-assignments, exam, certificate, checkins, attendance-blocks, timetables,
inputs/*/time-slots, input-appointments, invitations, school-classes, school-groups, teachers, school/*/teachers,
student-differentiation-locks, impersonation, learnplanning, subject-assessments, basePath-Gruppen (requests/registrations/…)

## Noch offen (per Mitschrift klären)
- Genaue Methoden/Payloads für: Subject anlegen, Lerninput (Ordner/Aufgabe/Choice) anlegen & bearbeiten,
  Reihenfolge (changePosition), Attachment-Upload (multipart?), Sichtbarkeit/Veröffentlichen
- Begriffe in der UI ↔ API: Workspace = ?, Subject = ?, Lerninput = ?

## Mitschrift 1 – Login, Home, Bibliothek, Workspace anlegen (2026-10-27)
Begriffe: Workspace (LB-…) = „Lernbereich“ (Kachel in Bib); Subject (SUBJ-…) = Fach/Kurs im Lernbereich;
Lerninput (LI-…) = Lernbaustein (Aufgabe/Ordner/Choice); Tags (TAG-…) = Fach- und Differenzierungs-Schlagworte.
IDs der Schule: SCHOOL-944 (WvSS). Rolle Tobias: LEAD_TEACHER. Testbereich: LB-9QX4VN79SPUN59XTXC „testbereich“.

- GET  users/me → {id, username, role, schoolId, userConfig…}   (nur eigenes Profil – erlaubt)
- GET  school/{schoolId}/features, school/{schoolId}/custom-labels
- GET  workspaces  |  workspaces?excludeFromStudentApp=true → [{id, name, order, config, subjects:[…], attachments:[workspace_image]}]
- POST workspaces  {"name":"testbereich"} → 201 {id:"LB-…", name, order, config:{fallbackIcon:1}, subjects:[]}
- PUT  workspaces/{id}  {"name":"…"} → 200
- GET  subjects?withDeleted=false[&withDisabled=false][&workspaceFilter=LB-…] → [{id, name, order, color, workspaceId, defaultTag, excludedGrades, disabled, deleted}]
- GET  subject-default-tags → [{id:"TAG-…", name}]   (Fächer-Schlagworte für neue Subjects)
- GET  lerninput/library/tags → [{id, name, type:"subject"|"differentiation"}]
- GET  lerninput?page=0&pageSize=16 → {lerninputs:[{id:"LI-…", name, activityType, socialType, taskType, solveOrder, description, links:[], attachments:[], subjects:[…], editors:[…]}]}
  ACHTUNG: `editors` enthält Lehrkräfte-Namen → im Server auf id reduzieren oder weglassen.
- Home lädt automatisch GET students?… und teacher-dashboard/counts → im Server NIE aufrufen (Sperrliste), Mitschreiber blendet sie jetzt aus.

## Mitschrift 2 – Bib nach Fach, Lernpfad-Editor (2026-10-27)
UI-Begriffe: Lernpfad (Wurzel-Lerninput) → „Gliederungsstruktur“ (Ordner) → „Aufgabe“ / „Wahlpflichtaufgabe“.
Editor-URL: /library/editor/{LI-id}. Kopfdaten: Beschreibung, Jahrgänge, Aufgabenwahl (Frei/…), Fächer, Differenzierungen, Stichwörter.

- GET lerninput?subject=SUBJ-…&page=0&pageSize=16 → Liste (Filter nach Fach)
- GET lerninput/{id} → VOLLER BAUM: {…Kopf…, tags:{grades,differentiations,subjects,other[]}, lastModifiedAt,
    children:[{ id, name, activityType, socialType ("Einzelarbeit"…), taskType ("Pflichtaufgabe"…), solveOrder ("none"|"after_solving"),
      description (HTML), links[], attachments[], color, subjects[], editors[], tags, isLeaf, isV3, state:"ACTIVE", isPublished,
      isMandatoryProgressVisible, isExtraTaskCounterVisible, sortOrder, parentId, coverImage, displayImageUrl, estimatedTime (min),
      info:{licenseType:"cc0"}, kind:"task+upload-optional", isUploadRequired, solutionMustBeUploaded, isSelfCorrectionNecessary,
      isLinkSubmissionEnabled, sampleSolutions[], sampleSolution, taskDescription:{state:[{id, state:[Rich-Text-Blöcke: {type:"p",children:[{text,strong}]}, href, plugin, table rows/columns/content]}]}, children:[…] }]}
  → Aufgabentext ist ein Slate-ähnliches JSON (taskDescription.state), nicht HTML. Für den Server: HTML/Markdown → Slate-Blöcke konvertieren.
- GET school-diffs/root-lerninput/{id} → Differenzierungen des Pfads; GET school-diffs?withDeleted=true → alle Differenzierungsstufen der Schule
- GET library → [{id:"LIB-1", name:"Scobees-Schulnetzwerk", countLerninputs}]; GET library/categories → CAT-1..4
- GET lerninput/{id}/sharings → []
- Beim Öffnen des Editors ruft die UI assignments/check-assignable-students/{id} auf → Sperrliste (ausgeblendet)

## Erkenntnis: „Interaktives Arbeitsblatt“ = eingebetteter SERLO EDITOR
- Aufgabe → „Interaktives Arbeitsblatt erstellen“ öffnet den Serlo Editor (Open Source, github.com/serlo/frontend, Paket @serlo/editor).
- taskDescription.state ist das Serlo-Dokumentformat: {plugin:"rows", state:[{plugin:"text", state:[Slate-Knoten]}, {plugin:"multimedia"|"box"|"spoiler"|"table"|"scMcExercise"|"inputExercise"|…}]}
- Für den Server: Markdown/HTML → Serlo-JSON erzeugen (Text, Überschriften, Listen, Tabellen, Links, Bilder, Quiz-Plugins). Format-Doku im Serlo-Repo nachschlagen.
- UI-Elemente je Aufgabe in Liste: Differenzierungs-Badges, „1 Material“ (Anhang/Serlo-Dokument), Infoblock-/Quiz-Aufgaben als Muster.

## Mitschrift 3 – Gliederungsstruktur anlegen (2026-10-27)
- POST lerninput/folder  (multipart/form-data! Felder noch zu erfassen) → 200 {
    id:"LI-1GI8DBX6XU4Q6KWWCT", name:"Test MCP", description:"<h2>…</h2><p><span style=color>…</span>…<a href target=_blank>…</a>" (HTML!),
    parentId:"LI-UWJ030WUUGXY5IPN7Q", sortOrder:5, state:"DRAFT", isPublished:false, isLeaf:false, isV3:true, color:"#00838F",
    links:[], attachments:[], subjects:[], info:{}, hint:{attachments:[]}, internalTeacherNote:null, taskAudioDescription:null,
    lfs:[], assignedClassGroupNames:[], rootName, parentName, author:{id,…} }
  → Beschreibung der Gliederung ist HTML (h2, strong, em, u, span color, a). Nach dem Anlegen lädt UI den Baum neu (GET lerninput/{root}).
- Lerninput-Liste zeigt zusätzlich: state "ACTIVE"/"INACTIVE"/"DRAFT", isPublished, coverImage (ATT-… type coverimage), tags.other = Stichwörter.
- Baum von LI-UWJ030WUUGXY5IPN7Q ist > 80 kB; Mitschreiber v3 speichert jetzt bis 3 MB und FormData-Felder.

## Mitschrift 4 – Aufgabe anlegen & bearbeiten (2026-10-27)
Alle Schreibaufrufe für Lerninputs: POST als multipart/form-data, JEDES Feld ist ein JSON-kodierter String
(z. B. name = "\"Testaufgabe MCP\"", diffs = "[{...}]", estimatedTime = "0", attachments = "undefined" wenn leer).
- POST lerninput/task  (Anlegen, ohne id) Felder: taskType "Pflichtaufgabe", name "", socialType, activityType ("nicht spezifiziert"),
    diffs [], licenseType "cc0", parentId, sampleSolutions undefined, attachments undefined, links [], taskDescription null,
    taskAudioDescription undefined, lfs [], hintText "", hintAttachments undefined, isHintSave false, kind "task",
    isUploadRequired false, isSelfCorrectionNecessary false, isLinkSubmissionEnabled false
  → 200 {id:"LI-8P3NWX7R2AKJ7CSHAT", state:"DRAFT", sortOrder:0, parentId, …}
- POST lerninput/task  (Bearbeiten = gleicher Endpunkt MIT id) Felder zusätzlich: id, description (HTML), internalTeacherNote null,
    copyrightNotice null, estimatedTime 0, diffs [{id:"TAG-0060",name,type:"differentiation"}] (Differenzierungs-TAGs, nicht DIFF-IDs!),
    kind "task+upload-optional", isUploadRequired true, solutionMustBeUploaded false, requiredSubmissions ["file"],
    removedSampleSolutionIds [], submissionRule "all", isPenEnabled false, coverImagePath undefined, taskDescription null
  → 200 vollständiges Objekt
- Nach jedem Speichern: GET lerninput/{root} (Baum), school-diffs?withDeleted=true, school-diffs/root-lerninput/{root},
  school-competency-matrices?grades=…&subjectIds=…
- kind-Werte bisher: "task", "task+upload-optional"; taskType: "Pflichtaufgabe" (Wahlpflicht folgt)

## Baumstruktur des Vorbild-Pfads LI-UWJ030WUUGXY5IPN7Q (Skelett)
Root (pub:true) → 6 Gliederungen (isLeaf:false, solveOrder "after_solving" = Aufgaben nacheinander; "none" = frei)
  → Aufgaben (isLeaf:true, taskType "Pflichtaufgabe", kind ∈ {"task","task+sc","task+upload-optional","task+upload-required"})
  Muster: „Infoblock: …“ (kind task+sc = Selbstkontrolle), „Praxisaufgabe: …“ (upload-required), „Planungsaufgabe: …“, Einstiegs-/Abschlussquiz.
  Alle Aufgaben hier: attachments 0, links 0 → Inhalt steckt komplett im Serlo-Dokument (taskDescription).

## Serlo-Dokumentformat (taskDescription) – beobachtete Plugins
taskDescription = {plugin:"rows", state:[ {id:uuid, plugin:"text", state:[Slate-Knoten]}, … ]}   (Wrapper-ids sind UUIDs)
- text:  state = [{type:"p",children:[{text,strong?,em?}]}, {type:"a",href,children}, {type:"ordered-list"|"unordered-list",children:[{type:"list-item",children:[{type:"list-item-child",children:[…]}]}]}]
- serloTable: state:{rows:[{columns:[{content:{id,plugin:"text",state:[…]}}]}]}
- exercise: state:{content:{id,plugin:"rows",state:[text…]}, interactive:{id,plugin:"scMcExercise",state:{answers:[{content:{plugin:"text",…},feedback:{plugin:"text",…},isCorrect:bool}], isSingleChoice?}}}
- scMcExercise: wie oben (Single/Multiple Choice)
- blanksExercise: state:{mode:"drag-and-drop"|"typing", text:{id,plugin:"text",state:[… {type:"textBlank",blankId:uuid,children:[{text:""}],correctAnswers:[{answer}],acceptMathEquivalents:true} …]}}
Referenz: github.com/serlo/frontend (packages/editor), Plugin-Namen identisch.

## Mitschrift 5 – Wahlpflichtaufgabe (Choice-Container) anlegen (2026-10-27)
- POST lerninput/choice (multipart) Felder: parentId, id "undefined" (neu), coverImage = DATEI (image/png, echtes File-Feld!),
    name, description (HTML), minimumAmountOfTasks "\"5\"", color "\"#c88503\""
  → 200 {id:"LI-6ECHTQSVRHKFRXW9QJ", taskType:"Wahlpflichtaufgabe", isLeaf:false, sortOrder:1, state:"DRAFT",
         coverImage:{id:"ATT-…", type:"coverimage", filename, path, thumbnailPath, hash, byteSize, mimetype, uploadedBy, uploadedAt},
         displayImageUrl:"/api/attachment?path=…", tasksRequiredForCompletion:5, color}
  → Wahlpflichtaufgabe = Container (isLeaf:false) mit Mindestanzahl zu lösender Unteraufgaben; Unteraufgaben vermutlich wieder POST lerninput/task mit parentId.
  → Bild-Upload läuft als File-Feld im selben multipart-Request; Bilder abrufbar über GET attachment?path=…

## Mitschrift 6 – Serlo-Arbeitsblatt speichern (2026-10-27)
- Kein eigener Endpunkt: Serlo-Dokument wird als Feld taskDescription (JSON-String) im POST lerninput/task mitgeschickt.
  Wurzel: {"plugin":"rows","state":[{plugin:"text",state:[…],id:uuid}, …]}  (hier liegt "id" NACH state – Reihenfolge egal)
- Weitere Slate-Knoten/Marks: {type:"h",level:2,children}, Mark code:true, {type:"math",src:"a = \frac{c}{d}",inline:true,children:[{text:""}]},
  unordered-list/ordered-list → list-item → list-item-child
- Plugin image: {plugin:"image",state:{src:"",caption:{plugin:"text",state:[…],id}},id}  → src war beim Zwischenspeichern leer; Upload-Weg für Serlo-Bilder noch offen

## Serlo-Plugin-Katalog (aus Tobias' Beispiel-Arbeitsblatt, 2026-10-27) – vollständiges Dokument: serlo-beispiel.json
Jeder Baustein: {plugin, state, id:uuid}. Wurzel rows.state = Liste von Bausteinen.
- text: state=[Slate]; Blöcke p | h(level) | ordered-list/unordered-list>list-item>list-item-child; Inline a(href) | math(src,inline) ; Marks strong, em, code
- image: {src, caption:{text}}            (src beim Speichern leer – Bild-Upload nicht beobachtet; URL-Form noch offen)
- multimedia: {explanation:{rows}, multimedia:{image}, illustrating:true, width:50}
- box: {type:"example"|…, title:{text}, anchorId:"", content:{rows}}
- spoiler: {richTitle:{text}, content:{rows}}
- serloTable: {rows:[{columns:[{content:{text}}]}], tableType:"OnlyColumnHeader"|…}
- highlight: {code, language:"jsx"|…, showLineNumbers}
- equations: {steps:[{left,sign:"equals"|"greater-than-or-equal"…,right,transform,explanation:{text}}], firstExplanation:{text}, transformationTarget:"equation"}
- geogebra: state = URL-String
- video: {src, alt};  interactiveVideo: {video:{video}, marks:[]}
- exercise: {content:{rows}, interactive:<scMcExercise|inputExercise|blanksExercise|dropzoneImage|textAreaExercise>}
  - scMcExercise: {isSingleChoice, answers:[{content:{text}, isCorrect, feedback:{text}}]}
  - inputExercise: {type:"input-number-exact-match-challenge"|…, unit, answers:[{value,isCorrect,feedback:{text}}]}
  - blanksExercise: {text:{text mit textBlank-Knoten}, mode:"drag-and-drop"|"typing"}
  - dropzoneImage: {answerZones:[], canvasShape, canvasDimensions:{w,h}, backgroundType, dropzoneVisibility, extraDraggableAnswers:[]}
  - textAreaExercise: {}
Server-Strategie: Markdown → text/h/list/code(highlight)/table/box/spoiler/image + Quiz-DSL → exercise(scMc|input|blanks).
- image.src wird im Editor als URL eingetragen (externe Bild-URL); ein Upload in scobees aus dem Serlo-Editor heraus wurde nicht beobachtet.
  → Server-Option: Bild als Aufgaben-Attachment hochladen und dessen attachment?path=…-URL als image.src verwenden (zu testen).
- blanksExercise.extraDraggableAnswers:[{answer}] (Distraktoren bei drag-and-drop); textBlank.correctAnswers kann mehrere Varianten enthalten.
- Vollständiges Beispiel-Dokument wird vom Browser-Log in serlo-beispiel.json gesichert (nächster Schritt).

## Mitschrift 7 – Datei, Link, Umbenennen, Verschieben, Löschen (2026-10-27)
- Datei-Upload: POST attachments (multipart) Felder: entityId "LI-…", entityType "Lerninput", type "samplesolution", file=<Datei>
    → 201 {id:"ATT-…", entityId, entityType, hash, path:"SCHOOL-944/general/LI-…/<ts>-<uuid>.<ext>", type, filename, mimetype, byteSize, uploadedAt, uploadedBy}
    Hier wurde type "samplesolution" (Musterlösung) verwendet; Typ für „Material“ vermutlich "attachment" – noch zu verifizieren.
    Danach POST lerninput/task mit sampleSolutions "undefined" → Server verknüpft bereits hochgeladene ATT automatisch über entityId;
    Entfernen über removedSampleSolutionIds ["ATT-…"].  Abruf: GET attachment?path=…[&inline=true]
- Neue Felder beim Speichern: kind "task+upload-optional+sc", isSelfCorrectionNecessary true, selfCorrectionUploadRequired false, estimatedTime 15
- Link: kein eigenes Feld genutzt – als <a href target=_blank> in description (HTML). (Feld links:[] existiert, Format unbekannt.)
- Umbenennen: POST lerninput/task mit id + neuem name (Vollobjekt)
- Verschieben: PUT lerninput/changePosition/{id}  JSON {"parentId":"LI-<Zielordner>","sortOrder":n} → 200 ganzer Baum der Wurzel
- Löschen: DELETE lerninput/{id} → 200 (Choice, Folder, Task gleich). Alle Testelemente wieder entfernt.
- Nebenbei: GET gelingensnachweis/slots (Lernnachweis-Funktion) → Sperrliste

## Mitschrift 8 – Lernpfad (Wurzel) anlegen, Material, Link (2026-10-27)
- POST lerninput  (Wurzel-Lernpfad, multipart) Felder: name, subjects [{id:"SUB-…"}], grades [{id:"TAG-0056"}] (Jahrgangs-TAGs),
    editors ["USER-<eigene id>"], order "none", published true, isMandatoryProgressVisible true, isExtraTaskCounterVisible true,
    tags [] (Stichwörter), id "", coverImage=<Datei> | coverImagePath undefined, description (Klartext/HTML)
  → 200 {id:"LI-M1SUFLY8QBQBD65MHU", state:"INACTIVE", isPublished:true, parentId:null, coverImage:{…}, subjects:[…], tags:{grades:[…]}}
  → Statusmodell: `published`/`isPublished` = Schalter „In schuleigener Bib veröffentlichen“; beim Umschalten wechselt `state` zwischen DRAFT (false) und INACTIVE (true) – live geprüft 27.10.2026. ACTIVE: im Frontend-Bundle nur als Enum-Wert vorhanden, nirgends gesetzt/ausgewertet → Backend-Feld. **Hypothese (unbelegt):** ACTIVE = einer Lerngruppe zugewiesen.
  → UI lädt vorher GET school/{schoolId}/teachers?withDeleted=false (Editor-Auswahl, enthält Lehrkräfte-E-Mails) → Server: nicht abrufen, editors = nur eigene id aus users/me.
- Material: POST attachments mit type "lerninput_attachment" (statt samplesolution) → erscheint nach dem nächsten Speichern in attachments[].
- Link: Feld links = [{"url":"https://…","name":"Aufgabenlink","type":"url"}]
- internalTeacherNote = String (interne Notiz für Lehrkräfte)
- Testpfad LI-M1SUFLY8QBQBD65MHU „TEST MCP“ liegt im Fach SUB-URB8HM4NL45Y623VST (Technische Mathematik (Elektrotechnik)), Testaufgabe wieder gelöscht.

## Noch nicht beobachtet (beim Bau mit Testpfad ausprobieren)
- Fach anlegen: vermutlich POST workspace/{LB-id}/subject {name, color, defaultTag, …}
- ~~Lernpfad aktivieren~~ (erledigt: Status folgt der Zuweisung) · Wurzel bearbeiten: POST lerninput mit id (Mitschrift 9)
- Gliederung bearbeiten (POST lerninput/folder mit id), Wahlpflicht bearbeiten (POST lerninput/choice mit id)
- Bild im Serlo-Dokument: Upload-Weg

## Entscheidungen (2026-10-27, Tobias)
- Fächer und Lernbereiche werden NUR GELESEN (GET workspaces, GET subjects); Lehrkraft wählt das Fach, unter dem der Lernpfad entsteht.
  Anlegen/Verwalten von Lernbereichen und Fächern bleibt beim Administrator in der Weboberfläche → keine Werkzeuge dafür.
- Zuweisung an Lerngruppen (assignments) bleibt gesperrt; dadurch wird ein Pfad ACTIVE – das ist gewollt außerhalb des Servers.
- Testumgebung: Lernbereich „testbereich“ LB-9QX4VN79SPUN59XTXC, Testpfad „TEST MCP“ LI-M1SUFLY8QBQBD65MHU.

## Mitschrift 9 (27.10.2026): Wurzel bearbeiten, Wahlpflicht bearbeiten, Bild im Arbeitsblatt

- **Lernpfad (Wurzel) ändern:** `POST lerninput` (multipart, JSON-kodierte Felder) mit `id:"LI-…"` – gleiche Felder wie beim Anlegen (name, subjects [{id}], grades [{id}], editors, order, published, isMandatoryProgressVisible, isExtraTaskCounterVisible, tags, description). Neues Titelbild: `coverImage=<Datei>` + `coverImagePath:undefined`; ohne neues Bild bleibt das alte erhalten. Antwort: vollständiges Wurzelobjekt (state bleibt unverändert, z. B. INACTIVE).
- **Wahlpflichtaufgabe ändern:** `POST lerninput/choice` mit `id:"LI-…"`, `coverImage:null` (ohne neues Bild), `minimumAmountOfTasks` als String.
- **Bild im Serlo-Arbeitsblatt:** nicht über scobees, sondern über den Medienspeicher des Serlo-Editors:
  1. `GET https://editor.serlo.org/media/presigned-url?mimeType=image/png&editorVariant=unknown&parentHost=teach.scobees.com` (ohne Auth) → `{signedUrl, fileUrl}`
  2. `PUT signedUrl` mit dem Bild als Body (S3, ionoscloud, `editor-media-assets-production/all/<id>/image.png`)
  3. `fileUrl` (`https://editor.serlo.org/media/all/<id>/image.png`) als `image.src` im Dokument. Die Bilder sind öffentlich erreichbar.
- **Geklärt:** Es gibt keinen Aktivieren-Schalter; der einzige Schalter ist „In schuleigener Bib veröffentlichen“ (= `published`, DRAFT ↔ INACTIVE). Wodurch ACTIVE entsteht, ist nicht belegt (Vermutung: Zuweisung; `assignments/*` bleibt gesperrt).
- **Differenzierungen:** `GET school-diffs` liefert die Niveaus der Schule (`DIFF-…`, name z. B. „Hauptschulabschluss“, `defaultTag` → `TAG-…`). Aufgaben speichern `diffs:[{id:TAG-…,name,type:"differentiation"}]` (Tag-ID, nicht DIFF-ID); in Antworten erscheint `tags.differentiations` mit dem Schul-Namen. Die Wurzel hat kein Differenzierungs-Feld; `GET school-diffs/root-lerninput/{id}` fasst die Niveaus der enthaltenen Aufgaben zusammen (so entsteht die Anzeige am Pfad). Frontend-Enum `DIFFERENTIATION_MISMATCH` („keine passenden Aufgaben für das Niveau des Lernenden“) belegt, dass Lernende nur Aufgaben ihres Niveaus sehen.
- Nebenbei gesehen (gesperrt, nicht genutzt): `assignments/check-assignable-students/{id}`, `lerninput/{id}/sharings`, `school-classes`, `school-groups`, `school/{id}/teachers`, `school-competency-matrices?grades=…&subjectIds=…`, `library/categories`, `school/{id}/custom-labels`.

## Abgabe und Selbstkorrektur (Frontend-Logik `vZ`, v93.3)

- `requiredSubmissions` ⊂ {file, pen, link} + `submissionRule` all|any: ist die Liste **nicht leer**, ist die Abgabe Pflicht (Schüler-App: „Zum Abgeben musst du eine Datei hochladen“). Leer → Rückfall: Abgabe nur Pflicht, wenn `isUploadRequired && solutionMustBeUploaded`.
- `isSelfCorrectionNecessary` → Reiter „Selbstkorrektur“ nach der Abgabe (Vergleich mit Musterlösung); `selfCorrectionUploadRequired` → korrigierte Fassung muss hochgeladen werden.
- `kind` ist ein abgeleiteter Anzeige-Wert aus diesen Flags (Funktion `GK`): task, task+sc, task+sc-upload-required, task+upload-optional, task+upload-optional+sc, task+upload-optional+sc-upload-required, task+upload-required, …
- Backend-Standard nach `POST lerninput/task` (leer): `kind:"task"`, `isUploadRequired:false`, **kein** `requiredSubmissions`. Der Server darf hier nichts erfinden (0.1.0/0.1.1 setzten `["file"]` → erzwungene Datei-Abgabe bei jeder Aufgabe).
- `solveOrder` (Aufgabenwahl des Lernpfads): none („Frei“), after_solving („Nach Reihenfolge“), after_selfcorrection („… mit Selbstkorrektur“), after_teacher_correction („… mit Feedback“).

## Aufgabentypen (`taskType`, Frontend-Enum v93.3)

`Pflichtaufgabe`, `Extraaufgabe`, `Trainingsaufgabe`, `Wahlpflichtaufgabe` (nur Container/choice), `Info`, `Diagnose`, `Gelingensnachweis`, `Unterschiedlich`, `nicht spezifiziert`. Ein Wert „Wahlaufgabe“ existiert nicht – `POST lerninput/task` antwortet damit HTTP 500 (27.10.2026). Server-Parameter `aufgabentyp`: pflicht → Pflichtaufgabe, extra → Extraaufgabe, training → Trainingsaufgabe, info → Info (alle live angelegt).

## Serlo-Dokument: Stolperfallen (Live-Test 27.10.2026)

- Die Wurzel `{plugin:"rows",state:[…]}` darf **keine `id`** haben. Mit `id` rendert die Schüleransicht noch, aber der Editor („Interaktives Arbeitsblatt erstellen“) bricht mit `TypeError: Cannot read properties of undefined (reading 'plugin')` ab (Store-Schlüssel der Wurzel ist `root`). Alle inneren Bausteine brauchen eine UUID.
- `equations`: `explanation` eines Schritts beschreibt den Übergang zum **nächsten** Schritt (Pfeil); `firstExplanation` steht vor dem ersten Schritt.
- Frontend-Routen: Bib `/library`, Lernpfad-Editor `/library/editor/{LI-Wurzel}` (Aufgaben werden im Baum aufgeklappt und über „Aufgabe bearbeiten“ geöffnet; die Direkt-URL mit einer Aufgaben-ID zeigt sie fälschlich als Lernpfad).

## Lernplaner (Schüler-App) – Beobachtungen (27.10.2026, v93.3)
- Serlo-Arbeitsblatt = Feld `taskDescription` der Aufgabe; es hat keinen eigenen Namen. Die Materialkachel im Lernplaner zeigt immer „Serlo-Inhalt“ (fester UI-Text; die Oberflächentexte beider Apps liegen nicht im Bundle, sondern werden zur Laufzeit geladen).
- `info`-Aufgaben: Schaltfläche „Infoinput erledigt“; `pen`-Abgabe: Stiftleiste über dem PDF-Material, ohne PDF keine Abgabe möglich; Selbstkorrektur: Abgabe und Musterlösung nebeneinander, Vergleichsdokument wählbar.
- Lernplaner-Bundle: learn.scobees.com `main-XF77SCGY.js` (nur Fingerabdruck, nicht vom Server genutzt).
