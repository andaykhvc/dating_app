# Nutzungsbedingungen: Prüfgrundlage und offene Freigabe

Stand: 8. Oktober 2026 · Version `2026-10-08-draft.1` · Issue #40, Teil von #17.

Die deutsche Ausgabe ist eigenständig als Hauptfassung verfasst, die englische erläutert denselben Regelungsumfang. Beide Seiten sind **DRAFT — pending legal review**, keine rechtlich freigegebenen AGB. Sie haben dieselben 17 Abschnittsanker und fünf Punkte in der Kurzfassung.

## Grundlage und Abhängigkeiten

Diese Änderung baut auf PR [#62](https://github.com/andaykhvc/dating_app/pull/62), Branch `codex/privacy-policy-39`, Commit `530eace` auf. Der PR richtet sich zunächst gegen diesen Branch, damit ausschließlich #40 sichtbar ist. #62 liefert die Betreiberkonfiguration und das gemeinsame Seitenlayout; dieses wird um den Dokumenttyp `terms` erweitert. Nach Integration von #62 ist die Basis auf `main` umzustellen und der dann aktuelle Stand erneut abzugleichen. Die bestehende GitHub-CI läuft nur für PRs gegen `main`; lokale Prüfungen sind daher separat dokumentiert.

Der Betreiber hat Name, Anschrift und E-Mail bestätigt: **Anday Sahin Kahveci, Wundtstr. 5, 01217 Dresden, Deutschland; contact@linguamatch.online**. Am 8. Oktober bestätigte er außerdem: allein betriebener Hobbydienst, kein bestehendes Unternehmen und derzeit keine Nutzungsentgelte. Daraus wird **keine abschließende rechtliche Nicht-Unternehmer-Einstufung** abgeleitet. Keine Gesellschaftsform, Registerangabe, Schlichtungspflicht oder Teilnahmezusage wurde erfunden. Die Aussage „allein“ bestätigt nicht gesondert die gesetzlich relevante Beschäftigtenzahl zum 31. Dezember 2025.

## Abgleich mit dem implementierten Produkt

| Aussage | Geprüfte Grundlage | Grenze / Folgerung für den Entwurf |
| --- | --- | --- |
| Teilnahme ab 18 | `is_18_plus_confirmed`, `enforce_profile_rules` in `supabase/migrations/0011_functions_triggers.sql`, Onboarding und `src/lib/date.ts` | Datumsangabe/Bestätigung, keine amtliche Prüfung; ein Konto ist eine Verhaltensregel, keine technisch garantierte eindeutige Identität. |
| Profile / Fotos | `src/features/onboarding/components/`, `src/features/profile/`, `src/lib/constants.ts`, `src/lib/image/compressImage.ts`, Migration `0013_storage.sql` | Reguläres UI verlangt mindestens ein Foto, höchstens sechs. Eigene Identität und Rechte sind Regeln. Öffentliche Foto-URLs werden durch Blockieren nicht privat. |
| Sprache zuerst, Dating freiwillig | `intentions`, `hide_dating_profiles`, `PreferencesStep.tsx`, Profilabsichten und `0012_read_functions.sql` | Dating-Auswahl ist keine Zustimmung zu sexueller Kommunikation und kein nachgewiesener Art.-9-Einwilligungsnachweis. |
| Matching, Chat, Korrekturen | `record_swipe`, `src/features/chat/`, Matching-/Chat-/Korrekturtabellen | Gegenseitiges Like erzeugt Match; kein garantierter Match-/Lernerfolg, keine bestätigte amtliche Sprachleistung. |
| Lernen, XP und Liga | `grant_xp` in `0011_functions_triggers.sql`, `src/features/learn/`, `src/features/play/`, Fortschrittsanzeigen | Level-basierte Bronze/Silber/Gold-Anzeigen; keine Währung oder zugesagten Preise. Lernbewertung kann Fehler enthalten. |
| Meldung | `src/features/chat/components/ReportBlockMenu.tsx`, `reportUser` in `src/features/chat/api.ts`, Berichtstabelle und RLS | Speichert einen Bericht. UI-Bestätigung beweist keinen menschlichen Review oder automatische Sanktion. Vor dem Match ist auf diesem Stand kein Discover-Meldebutton vorhanden; Kontakt per E-Mail/Post bleibt der Weg. |
| Blockierung | `block_user` in `0011_functions_triggers.sql`, Chat-RLS, `0012_read_functions.sql`, `99996_xp_leaderboard.sql`, `SettingsPanel.tsx` | Beendet aktives Match, unterbindet weitere Nachrichten dort, filtert Discover/Rangliste; löscht weder Verlauf noch öffentliche Fotos. Entblocken stellt das Match nicht wieder her. |
| Suspendierung | `profiles.account_status`, `is_active_match_member`, `record_swipe`, `(app)/layout.tsx` | Status existiert und filtert Vorschläge. Vollständige Sperre eigener Aktionen bzw. bestehender Chats ist auf dieser Basis **nicht umgesetzt**. |
| Beendigung / Löschung | `src/features/profile/SettingsPanel.tsx`, Fremdschlüssel und Storage | Abmelden löscht kein Konto; keine vollständige selbst bedienbare Löschung/Export. #38/#43 und Datei-/Backup-Prozess bleiben offen. |
| Lizenzhinweise | `src/app/licenses/page.tsx`, Content-Quellen | Verlinkt `/licenses`; Rechte aus Drittanbieter-Lizenzen werden nicht durch eine pauschale App-Klausel aufgehoben. |
| Entgelt | Betreiberangabe und geprüfte App ohne Kauf-/Abo-Flow | Derzeit kein Nutzungsentgelt. Keine durch diesen Entwurf eingeführten Preise oder fiktiven Abonnements. |

### Community-Regeln und tatsächliche Meldegründe

Die Oberfläche rendert die Bezeichnungen direkt aus `REPORT_REASON_LABELS`. Die typisierten IDs werden gegen `REPORT_REASONS` geprüft. Die Meldefunktion erlaubt Details zum Vorfall; die Kategorie ist weder ein automatischer Schuldspruch noch eine garantierte Moderationsaktion.

| Regel (DE und EN identisch zugeordnet) | Meldegrund im App-Menü |
| --- | --- |
| Belästigung / Drohungen | Harassment |
| Hass / diskriminierende Angriffe | Harassment / Inappropriate content |
| Nacktheit / sexuelle oder rechtswidrige Inhalte | Inappropriate content |
| Betrug / Phishing / Geldforderungen | Spam or scam |
| Minderjährige / sexuelle Ausbeutung | Appears to be under 18 / Inappropriate content |
| Identitätstäuschung | Fake profile |
| Spam / künstliche Interaktionen oder XP | Spam or scam / Something else |
| Kommerzielle Kontaktwerbung | Spam or scam |
| Rechte Dritter / vertrauliche Angaben | Something else |

### Koordination mit #44 / PR #60

Zum Abgleich wurde der **offene, nicht integrierte** PR [#60](https://github.com/andaykhvc/dating_app/pull/60) gelesen (Head `f4593e3`). Er schlägt Discover-Melden, eine Sperransicht, zusätzliche DB-Prüfungen, `/support`, `/guidelines` und `docs/moderation-runbook.md` vor. Diese Funktionen werden hier nicht als bereits verfügbar ausgegeben.

Die dort vorgeschlagene öffentliche 24-Stunden-Zielzeit setzt einen wirklich betriebenen Prozess voraus. Im aktuellen Basisstand sind kein verifizierter Dienstplan, keine zuverlässige Benachrichtigung des Moderators und kein tatsächlich erreichbarer üblicher Bearbeitungszeitraum nachgewiesen. Der Entwurf benennt diese Lücke, statt einen SLA zu erfinden. Die Übernahme der Funktionen aus #60 allein bestätigt noch keine organisatorische Reaktionszeit. Vor Freigabe sind öffentliche Support-/Guideline-Texte, der Runbook und beide Sprachfassungen miteinander abzugleichen.

Die vorgeschlagenen Maßnahmen sind proportional und fallbezogen beschrieben. Eine bestimmte Zahl von Meldungen führt nach diesen Bedingungen nicht automatisch zu einer Sperre. Noch nicht umgesetzte Maßnahmen sind als vorgesehener Rahmen mit sichtbarem Freigabepunkt gekennzeichnet.

## Rechtsquellen und bewusst offene Entscheidungen

Primärquellen am 8. Oktober 2026 geprüft; dies bestätigt weder die Vertragswirksamkeit noch die abschließende Einordnung des konkreten Dienstes. Die Seiten verlinken die maßgeblichen Quellen und markieren notwendige Einzelfallprüfungen.

- [§ 14 BGB](https://www.gesetze-im-internet.de/bgb/__14.html): Anbieterstatus anhand tatsächlicher Tätigkeit prüfen. „Hobby“ oder „kostenlos“ ersetzt diese Einordnung nicht.
- [§ 305 BGB](https://www.gesetze-im-internet.de/bgb/__305.html), [§ 307 BGB](https://www.gesetze-im-internet.de/bgb/__307.html), [§ 309 BGB](https://www.gesetze-im-internet.de/bgb/__309.html): wirksame Einbeziehung, Verständlichkeit und AGB-Kontrolle. **Keine zusätzliche Haftungshöchstgrenze oder pauschale Freizeichnung**; gesetzliche Ansprüche bleiben bestehen. Vertragsschluss und Inhalt qualifiziert prüfen.
- [§ 314 BGB](https://www.gesetze-im-internet.de/bgb/__314.html): wichtiger Grund und gegebenenfalls Abhilfe/Abmahnung; kein willkürliches jederzeitiges Kündigungsrecht des Anbieters.
- [§ 327 BGB](https://www.gesetze-im-internet.de/bgb/__327.html), [§ 327r BGB](https://www.gesetze-im-internet.de/bgb/__327r.html): digitale Produkte können unter den gesetzlichen Voraussetzungen auch bei Bereitstellung personenbezogener Daten erfasst sein. Dienständerungen und etwaige Widerrufsinformationen gesondert prüfen; keine unbegrenzte einseitige Änderungsbefugnis.
- [§ 31 UrhG](https://www.gesetze-im-internet.de/urhg/__31.html): begrenzte einfache Nutzungsrechte für Speicherung, Übertragung, Empfängeranzeige und Foto-Vorschaubilder. Die technische Unterstützung durch Dienstleister und die Beendigung an den tatsächlichen Datenfluss anpassen; keine eigenständige Werbelizenz oder pauschale Freistellung.
- [DSA, Verordnung (EU) 2022/2065](https://eur-lex.europa.eu/eli/reg/2022/2065/oj/deu): Art. 14, 16 und 17 als Prüfgrundlage für Bedingungen, Meldungen und Begründungen. Anwendbarkeit, notwendige elektronische Meldeangaben, Rückmeldungen und Überprüfungsrechte konkret bewerten und umsetzen. Ein Meldegrund-Dropdown allein wird nicht als vollständige DSA-Erfüllung behauptet.
- [Rom I, Art. 6](https://eur-lex.europa.eu/eli/reg/2008/593/oj), [Brüssel Ia, Art. 17–19](https://eur-lex.europa.eu/eli/reg/2012/1215/oj): zwingenden Verbraucherschutz und gesetzliche Verbrauchergerichtsstände wahren. Deutsche Rechtswahl nur soweit wirksam; kein pauschaler ausschließlicher Gerichtsstand Dresden.
- [Verordnung (EU) 2024/3228](https://eur-lex.europa.eu/eli/reg/2024/3228/oj): Aufhebung der früheren OS-Verordnung mit Wirkung zum **20. Juli 2025**. Die alte OS-Plattform wird nicht als weiter betriebener Beschwerdeweg verlinkt.
- [§ 36 VSBG](https://www.gesetze-im-internet.de/vsbg/__36.html): allgemeine Information abhängig von Anbieterstellung und tatsächlichen Voraussetzungen; Abs. 3 betrifft bei höchstens zehn Beschäftigten am 31. Dezember des Vorjahres **nur Abs. 1 Nr. 1**. Keine ungeprüfte umfassende Ausnahme aus dem heutigen Alleinbetrieb ableiten. Bereitschaft, bestehende Verpflichtung und gegebenenfalls Stelle/Adresse/Website klären.
- [§ 37 VSBG](https://www.gesetze-im-internet.de/vsbg/__37.html): gesonderter Hinweis in Textform bei nicht beigelegter Verbrauchervertragsstreitigkeit, soweit anwendbar. Die Ausnahme in § 36 Abs. 3 beseitigt diese Pflicht nicht. Keine unbestätigte Erklärung „nicht bereit und nicht verpflichtet“.

## Vor endgültiger Freigabe

- Anbieterstatus, wirksamen Vertragsschluss, etwaige Verbraucherinformationen und beide Sprachfassungen rechtlich prüfen.
- #42 muss eine erforderliche, rechtzeitige Kenntnisnahme/Annahme und den Versionsnachweis umsetzen; AGB-Annahme und Datenschutz-Einwilligung unterscheiden. `TERMS_VERSION` und Datum allein sind kein Nachweis.
- Tatsächlich betriebenen Moderationsprozess mit Verantwortlichkeit, üblichen realistischen Zeiten, Begründungen, Überprüfung und vollständiger Sperrwirkung bestätigen; mit #44/#60 abgleichen.
- Löschung/Export, Foto-/Datei-/Backup-Aufbewahrung und Ende der Inhaltslizenz mit #38/#43 und der Datenschutzerklärung abstimmen.
- Verbraucherschlichtung klären; keine Betreiberzusage aus einer unvollständigen Antwort konstruieren.
- Änderungen des Texts parallel DE/EN pflegen, Version/Datum erhöhen. `LEGAL_DRAFT_MODE` ist gemeinsam mit Datenschutz; beide Dokumente müssen vor seinem Abschalten freigegeben sein.

## Technische Verifikation

Die Seiten liefern statische Inhalte, benötigen keine Sitzung und keine API-/DB-Abfrage. Nur die vier exakten Pfade aus `LEGAL_DOCUMENT_PATHS` umgehen den Auth-Refresh; verschachtelte oder ähnlich benannte App-Pfade bleiben geschützt. `LegalLinks` wird in Landeseite, Auth-Layout und Settings verwendet. Provider-Kontakt und `mailto:` kommen aus `LEGAL_ENTITY`, ohne doppelte Betreiberkonfiguration. Jede Edition hat einen eigenen Canonical, reziproke DE/EN-Alternativen und deutsches `x-default`; die gemeinsame Entwurfsprüfung ergibt `noindex, follow`.

| Grenze | Tatsächlicher Befund |
| --- | --- |
| Typen / Lint / Tests | `npm run typecheck`, `npm run lint`, `npm test` erfolgreich; **46 Tests**, davon acht Legal-Tests (drei für #40 hinzugefügt). Lokal Node 26.5.0, vorhandene CI-Konfiguration Node 22. Bestehende Node-Modultypwarnungen bleiben ohne Testfehler. |
| Produktionsbuild | `npm run build` erfolgreich mit denselben Platzhalter-Supabase-Werten wie CI; alle vier Legal-Routen als `○ (Static)` ausgegeben. |
| Browser | Installiertes Chrome über Playwright, frische Kontexte ohne Login: DE/EN × 390 × 844 bzw. 1280 × 900 × hell/dunkel = acht Kombinationen, jeweils HTTP 200. |
| Layout / Bedienung | Keine horizontale Überbreite, keine doppelten IDs oder fehlenden Inhaltsanker; alle Seitenlinks mindestens 44 px hoch; sichtbarer Tastaturfokus; Sprachwechsel zwischen den richtigen Terms-Ausgaben. 17 Abschnitte, fünf Kurzfassungspunkte und neun Regelkarten geprüft. |
| Inhalt / Metadaten | Bestätigte Name/Anschrift/E-Mail, richtiger `mailto:`, Entwurfsbanner und Version; keine DPO-Karte in Terms. Tatsächlich gerenderte eigene Canonicals, DE/EN/`x-default`, `noindex, follow`, alle sechs tatsächlichen Meldegrund-Bezeichnungen und kein Link zur stillgelegten OS-Plattform geprüft. |
| Entry-Points | Alle vier Legal-Links auf `/`, `/login`, `/signup`, `/verify-email`; deutsche Terms öffnen von jeder Seite ohne Login. Settings-Einbindung am Code geprüft; keine angemeldete Produktionssitzung getestet. |
| Regression / Auth-Grenze | DE/EN-Datenschutzseiten weiterhin mit 16 Abschnitten, eigener Fassung/Metadaten, DPO-/Kontaktkarte und korrektem Sprachwechsel. `/profile/settings`, `/terms/admin`, `/nutzungsbedingungen/private` führen abgemeldet weiterhin zu `/login`. |
| Backend / Fehler | Keine Supabase-Browserrequests oder uncaught Browserfehler im achtfachen Terms-Seiten-/Sprachwechseltest. Früher Proxy-Return vor Client-Erstellung und `getUser()` am Code geprüft. Keine API-/Datenänderung durch die Legal-Seiten. |
| Screenshots | Zwölf PNGs in `docs/screenshots/terms/`: acht Seitenansichten und vier vollständige Community-Abschnitte bei 390 px; exemplarische Mobil-/Desktop- und Dunkelansichten visuell geprüft. |

Unter `supabase/` wird nichts geändert; `test:db` ist nach dem Issue-Arbeitsauftrag hierfür nicht erforderlich und wurde lokal nicht ausgeführt. Produktive Moderation, Kontolöschung und ein angemeldeter Produktionsaccount sind nicht Teil dieser statischen Seitenprüfung. Ein lokaler Build mit Platzhalterwerten bestätigt keine produktive Providerkonfiguration. Die React-Prüfung ergab statische Serverinhalte, stabile Listen-Keys, Sprach-/Navigations-/Fokuskennzeichnungen und keine neuen Client-Effekte oder Datenabfragen.
