# Datenschutz: Prüfgrundlage und offene Freigabe

Stand: 8. Oktober 2026 · Version `2026-10-08-draft.2` · Issue #39, Teil von #17.

Die deutsche Fassung ist primär verfasst, die englische Ausgabe erläutert denselben Stand. Beide sind **Entwürfe zur menschlichen/rechtlichen Prüfung**. Diese Umsetzung stellt keine rechtliche Freigabe und keine Fertigstellung der übrigen Compliance-Issues dar.

## Grundlage und Koordination

`docs/compliance/data-inventory.md` aus #37 liegt auf dem geprüften Basisstand `eac3ea5` noch nicht vor. Nach der ausdrücklichen Prioritätsanweisung des Betreibers in #39 wurde daher direkt aus Code und Migrationen gearbeitet. Die folgende Zuordnung ist die begrenzte Prüfgrundlage dieses Textes; sie ersetzt nicht das umfassende Verarbeitungsverzeichnis aus #37. Nach dessen Fertigstellung sind Abweichungen mit beiden Sprachfassungen abzugleichen.

Die gemeinsame Betreiberkonfiguration aus #41 liegt noch nicht vor. Deshalb wird `src/lib/legal.ts` hier eingeführt; #41 soll sie weiterverwenden. Vom Betreiber am 8. Oktober bestätigt: **Anday Sahin Kahveci, Wundtstr. 5, 01217 Dresden, Deutschland**. Die ebenfalls bestätigte allgemeine Kontakt- und Datenschutzadresse lautet **contact@linguamatch.online**. Keine Telefonnummer, Gesellschaftsform, Register-/USt-ID oder DPO-Angabe wurde erfunden. Datenschutzanträge können per E-Mail oder an die Postanschrift gerichtet werden.

## Abgleich mit dem geprüften Code

| Verarbeitung / Aussage | Konkrete Grundlage | Grenzen / offene Fakten |
| --- | --- | --- |
| Konto, E-Mail, Passwortanmeldung, optionale Google-/Apple-Anmeldung | `src/features/auth/components/{SignupForm,LoginForm,OAuthButtons}.tsx`, `src/app/auth/callback/route.ts`, `src/lib/supabase/{client,server,proxy}.ts` | OAuth-Buttons beweisen keine produktive Freischaltung; SMTP-Anbieter, Auth-Logs und deren Laufzeiten sind unbestätigt. |
| Profil, Geburtstag, Land/Stadt, Nutzungsabsichten, Interessen, Sprachen und Suchpräferenzen | `supabase/migrations/0002_core_tables.sql`, `0012_read_functions.sql`, `src/features/onboarding/components/`, `src/features/profile/` | Datenbank speichert Geburtsdatum; öffentliche Profil-Ausgabe berechnet Alter. Stadt ist optional. Reguläres UI verlangt ein Foto, der Abschluss-RPC prüft nicht selbst dessen Existenz. Mindestens eine Absicht ist erforderlich; Dating ist optional. |
| Mindestalter 18 | `SignupForm.tsx`, `BasicsStep.tsx`, `src/lib/date.ts`, `0011_functions_triggers.sql` | Datums-/Bestätigungsprüfung, keine amtliche Alters- oder Identitätsprüfung. |
| Fotos und Vorschaubilder | `0013_storage.sql`, `src/lib/image/compressImage.ts`, `src/lib/photos.ts`, `PhotosStep.tsx` | Bucket `profile-photos` ist **öffentlich**, auch ohne Login über bekannte URL. Blockierung entzieht diese Zugriffsmöglichkeit nicht. |
| Likes, Matches, Chat, Antwortbezüge, Korrekturen | `0003_matching_tables.sql`, `0004_chat_tables.sql`, `0007_mission_tables.sql`, `0010_rls_policies.sql`, `0011_functions_triggers.sql`, `src/features/chat/` | Teilnehmerzugriff in der App, technische Betreiber-/Providerzugriffe nicht ausgeschlossen. Keine E2EE. Blockieren beendet Matches, löscht gespeicherte Kommunikation nicht. |
| Lernen, eingegebene Antworten, Wiederholung, Fortschritt, XP und Rangliste | `0008_progress_tables.sql`, `99991_content_engine_tables.sql`, `99993_content_engine_functions.sql`, `99996_xp_leaderboard.sql`, `src/features/learn/` | Profiling kann vorliegen. Keine festgestellte allein automatisierte Entscheidung mit rechtlicher/vergleichbar erheblicher Wirkung. Nicht mit „keine Automatisierung“ gleichsetzen. |
| Meldungen, Blockierungen, Kontostatus | `0002_core_tables.sql`, `0010_rls_policies.sql`, `0011_functions_triggers.sql`, `99996_xp_leaderboard.sql`, `src/features/profile/SettingsPanel.tsx` | Keine nachgewiesene automatische KI-Fotomoderation oder Sanktion allein aufgrund einer Meldung. Organisatorische Bearbeitung ist zu bestätigen. |
| Browser-Sprachausgabe | `src/features/learn/speech.ts` | Lokale Stimme wird bevorzugt; passende entfernte Stimme ist möglich. Daher keine Zusage ausschließlich lokaler Textverarbeitung. Keine Mikrofonaufnahme durch die App. |
| Installation, Geräteinformationen und Erscheinungsbild | `src/features/install/InstallAppProvider.tsx`, `src/app/globals.css`, Android TWA-Konfiguration | UI-Zustand im Arbeitsspeicher, kein eigener Service Worker oder app-eigenes localStorage/sessionStorage/IndexedDB gefunden. Browser/Store können eigene Dienste betreiben. |
| Cookies und technische Abrufdaten | `src/lib/supabase/{client,server,proxy}.ts`, `src/proxy.ts`, `package-lock.json` | Auth-Cookies durch Supabase SSR, eventuell aufgeteilt. Produktive Namen/Laufzeiten sowie Hosting-/Sicherheitsprotokolle sind noch zu auditieren. Notwendigkeit nach § 25 TDDDG ist zweckbezogen zu prüfen. |
| Empfänger und Regionen | Supabase-Abhängigkeiten, SSR-Abfragen, Storage/Realtime-Code, Vercel-Bereitstellung des Repositories | Keine passende Supabase-Projektregion aus verfügbarem Kontozugriff verifiziert. **Regionen anderer Projekte wurden nicht übernommen.** Vertragsgesellschaften, Ausführungsorte, Unterauftragnehmer, AV-Verträge und Transfergarantien sind offen. |
| Speicherdauer, Kontolöschung, Datenexport | FK-Löschverknüpfungen der Migrationen, Storage-Bucket und `SettingsPanel.tsx` | Kein vollständiger Löschplan, kein selbst bedienbares Löschen (#38), kein Export (#43). DB-Cascade ersetzt keine Datei-/Backup-Löschung. Keine erfundenen 30-/90-Tage-Fristen. |
| Sensible Daten und Einwilligung | `intentions`, Fotos, Bio, Chattexte; `PreferencesStep.tsx`, `src/features/profile/IntentionPicker.tsx` | Auswahl „Open to Dating“ ist keine nachgewiesene ausdrückliche Art.-9-Einwilligung. #42 ist offen. Auch Freitext kann besondere Daten enthalten. |

Im geprüften Repository sind keine Firebase-Push-, Werbe-/Analyse-SDKs oder externen KI-Dienste integriert. Brevo ist in #54 geplant, aber kein nachgewiesener aktueller Versanddienst. Dashboard-Erweiterungen sind damit nicht ausgeschlossen. `next/font` bindet Schriftdateien über den Build ein; es wurde kein clientseitiger Google-Fonts-Abruf in der App gefunden.

Besonders zu korrigierende pauschale Annahmen bei #37: öffentliche Fotos sind keine ausschließlich angemeldeten Nutzern zugänglichen Daten; Matching und Lernbewertung sind automatisiert, auch ohne festgestellte Art.-22-Entscheidung; Browser-TTS ist nicht zwingend lokal; weder eine EU-Region noch OAuth-Aktivierung noch ein fertiges Löschverfahren ist allein aus Buttons oder Paketnamen ableitbar.

## Informationspflichten und Freigabepunkte

Die 16 Abschnitte beider Seiten behandeln Verantwortlichen/Kontakt/DPO, direkte und fremde Datenquellen (Art. 13/14), Kategorien/Zwecke, zweckbezogene Rechtsgrundlagen und berechtigte Interessen, Art. 9/Einwilligung, Empfänger und Sichtbarkeit, Drittlandgarantien, Endgerätezugriff, Speicherdauer, Schutzmaßnahmen, Profiling/Art. 22, Pflichtangaben/Folgen, sämtliche Betroffenenrechte, Fristen/Beschwerde und Änderungen.

Vor dem Entfernen der Entwurfskennzeichnung:

- Die tatsächliche Bearbeitung postalischer/elektronischer Anträge organisatorisch sicherstellen. DPO-Benennungspflicht prüfen.
- Vertragsgrundlage, freiwillige Felder und Interessenabwägungen je Zweck prüfen; sensible Verarbeitung mit expliziter Einwilligung und Widerrufsverfahren aus #42 klären.
- Vertragliche Anbieteridentität, AV-Verträge, Projekt-/Funktions-/Logregionen, Unterauftragnehmer und einschlägige Drittlandgarantien bestätigen. Die veröffentlichten DPA-Templates beweisen keinen abgeschlossenen eigenen Vertrag.
- **Vercels veröffentlichtes DPA, Schedule 1 Abschnitt 6, untersagt sensible Customer Data.** Den tatsächlichen Datenfluss, den geltenden Vertragsstand und die Vereinbarkeit prüfen; keine DSGVO-Zulässigkeit aus der Hosting-Wahl ableiten.
- Löschkonzept je Kategorie, Backups und Bilddateien festlegen. Konto-Löschung #38 und Export #43 implementieren; den Text dann anpassen.
- Cookie-/Provider-Audit in Produktion durchführen, notwendige Zwecke und Laufzeiten dokumentieren, zusätzliche Integrationen berücksichtigen.
- Beide Sprachfassungen fachlich prüfen, Angaben aktualisieren und gemeinsame Version/Datum erhöhen; erst dann `LEGAL_DRAFT_MODE` umstellen.

## Konfiguration, Metadaten und Zugang

`LEGAL_ENTITY` enthält die vom Betreiber bestätigten Name-/Adress-/E-Mail-Werte als Vorgabe. Öffentlich verwendete Overrides: `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_ADDRESS` (echte Zeilenumbrüche), `NEXT_PUBLIC_LEGAL_EMAIL`, `NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL`, `NEXT_PUBLIC_LEGAL_DPO`. Für #41 sind zusätzlich `NEXT_PUBLIC_LEGAL_PHONE`, `NEXT_PUBLIC_LEGAL_FORM`, `NEXT_PUBLIC_LEGAL_REPRESENTATIVE`, `NEXT_PUBLIC_LEGAL_REGISTER`, `NEXT_PUBLIC_LEGAL_VAT_ID` vorgesehen; sie sind aktuell leer und werden nicht als Pflichtangaben für jeden Betreiber ausgegeben. Alle Werte sind öffentliche Kontaktdaten, keine Secrets. Die Datenschutzadresse fällt auf die allgemeine E-Mail zurück.

Die Seiten sind statisch, verwenden keine Kontoabfragen und umgehen nur für die **exakten** Pfade `/datenschutz` und `/privacy` den Auth-Refresh. App-Pfade bleiben geschützt. Landeseite, gemeinsames Auth-Layout und Einstellungen verlinken beide Fassungen. Es gibt auf diesem Basisstand keine Sitemap-/Robots-Datei zur Erweiterung. Jede Seite hat ihren eigenen Canonical, gegenseitige Sprachalternativen und `x-default` zur deutschen Fassung. `NEXT_PUBLIC_SITE_URL` legt den Ursprung fest; Vorgabe ist die bestehende App-Domain. Im Entwurfsmodus und bei fehlenden notwendigen Betreiberangaben gilt `noindex, follow`. Öffentliche Konfiguration wird beim Build übernommen; Änderungen erfordern einen neuen Build. Änderungen der Betreiberanschrift verlangen zusätzlich einen erneuten Abgleich der im Text genannten Aufsichtsbehörde.

Die Beschwerdeseite nennt aufgrund der bestätigten Dresden-Adresse die **Sächsische Datenschutz- und Transparenzbeauftragte**. Rechte auf Beschwerden bei anderen zuständigen Behörden werden nicht eingeschränkt.

## Quellen für die rechtliche Prüfung

Geprüft am 8. Oktober 2026. Die gesetzlichen Verweise sind für die fachliche Prüfung verlinkt; Anbieterangaben sind vom tatsächlich geltenden eigenen Vertragsstand zu unterscheiden.

- [DSGVO, offizieller EUR-Lex-Fundort](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [Europäische Kommission: Informationen für Einzelpersonen und Betroffenenrechte](https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en)
- [EDPB: rechtmäßige Verarbeitung](https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en)
- [§ 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html)
- [Sächsische Datenschutz- und Transparenzbeauftragte: Beschwerden und Zuständigkeit](https://www.datenschutz.sachsen.de/beschwerde-einreichen.html)
- [Datenschutzkonferenz: Aufsichtsbehörden](https://www.datenschutzkonferenz-online.de/datenschutzaufsichtsbehoerden.html)
- [Supabase DPA](https://supabase.com/legal/customer-resources/data-processing-addendum), [Projektregionen](https://supabase.com/docs/guides/platform/regions)
- [Vercel DPA](https://vercel.com/legal/dpa), insbesondere Schedule 1 Abschnitt 6 und internationale Übermittlungen
- [MDN: SpeechSynthesisVoice.localService](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService)

## Technische Verifikation

Der geprüfte Ablauf ist: öffentliche Navigation → exakter Legal-Pfad im Proxy → typisierte, statische Inhalte → verständliche Seite mit Sprachwechsel. Es gibt dafür keinen API-/Datenbankaufruf.

| Grenze | Tatsächlicher Befund |
| --- | --- |
| Typen / Lint / Node-Tests | `npm run typecheck`, `npm run lint`, `npm test` erfolgreich; 43 Tests, davon fünf neue Legal-Prüfungen. Lokal Node 26.5.0; CI nutzt die vorhandene `.nvmrc` (22). |
| Build | `npm run build` erfolgreich mit denselben Platzhalter-Supabase-Werten wie CI; beide Legal-Routen als `○ (Static)` ausgegeben. |
| Browser → Seiten | Installiertes Chrome, frische Kontexte ohne Login: jeweils HTTP 200 für DE/EN bei 390 × 844 und 1280 × 900, hell/dunkel (acht Kombinationen). |
| Darstellung / Navigation | Kein horizontaler Überlauf, keine doppelten IDs, alle 16 Inhaltsanker vorhanden, Links mindestens 44 px hoch, sichtbarer Tastaturfokus, Sprachwechsel erfolgreich. Zwölf Screenshots einschließlich Betreiberabschnitt: `docs/screenshots/privacy/`. |
| Metadaten | Tatsächlich gerendert: jeweiliger Canonical, DE/EN/`x-default`, `noindex, follow`; sichtbarer Entwurfsbanner, Name/Postadresse sowie die bestätigte E-Mail mit funktionierendem `mailto:`-Link. |
| Entry-Points | Beide Links auf `/`, `/login`, `/signup`, `/verify-email`; Aufruf der deutschen Fassung jeweils erfolgreich. Settings-Integration am Code geprüft; keine angemeldete Settings-Sitzung gegen Produktion getestet. |
| Auth-Grenze / Backend | `/profile/settings` führt abgemeldet weiterhin zu `/login`. Keine Supabase-Browserrequests oder uncaught Browserfehler bei den Legal-Seiten; der Proxy gibt dort vor Client-Erstellung/`getUser()` zurück. |
| Server | Produktionsserver startete mit `✓ Ready`; bei der Browserprüfung keine Serverfehler ausgegeben. |

Die Prüfergebnisse und Screenshots stehen auch in der PR-Beschreibung. Browserprüfungen betreffen diese öffentlichen Informationen und ihre Navigation, nicht produktive Konto-/Lösch-/Exportverfahren. Ein lokaler Build mit Platzhalter-Supabase-Werten bestätigt keine produktive Providerkonfiguration. Unter `supabase/` werden in diesem PR keine Dateien verändert.
