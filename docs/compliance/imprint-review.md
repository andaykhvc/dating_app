# Impressum: Betreiberangaben, Konfiguration und Freigabe

Stand: 8. Oktober 2026 · `IMPRINT_VERSION = 2026-10-08-draft.1` · #41, Teil von #17.

## Grundlage

Die statischen Seiten `/impressum` (deutsche Hauptfassung) und `/imprint` (englische Begleitfassung) verwenden `LegalPage` und eine einzige typisierte `LEGAL_ENTITY` in `src/lib/legal.ts`. Vier Abschnitte und fünf Zusammenfassungspunkte sind in beiden Sprachen parallel gepflegt. Keine API-/DB-Abfrage, kein Vertragsschluss und keine Einwilligung werden durch ihren Aufruf ausgelöst.

Der Betreiber hat **Anday Sahin Kahveci, Wundtstr. 5, 01217 Dresden, Deutschland, contact@linguamatch.online** sowie **+491782943998** bestätigt und die Veröffentlichung der Telefonnummer auch in den anderen Dokumenten ausdrücklich erlaubt. Alle sechs Legal-Seiten verwenden dieselben Fakten; Telefonnummern erhalten einen `tel:`-Link. Die Kontaktänderung erhöht `PRIVACY_VERSION` auf `2026-10-08-draft.3` und `TERMS_VERSION` auf `2026-10-08-draft.2`. Alleinbetrieb, Hobby und derzeit kostenlose Nutzung werden ohne pauschale Nicht-Unternehmer- oder Impressum-Ausnahme dokumentiert.

Der Branch `codex/imprint-41` baut auf [PR #63](https://github.com/andaykhvc/dating_app/pull/63), Commit `707424c`, auf; dieser wiederum auf [#62](https://github.com/andaykhvc/dating_app/pull/62). Die PR-Basis ist zunächst `codex/terms-of-service-40`, damit nur #41 sichtbar ist. Nach Integration der Voraussetzungen die Basis auf `main` umstellen und gegen dessen dann aktuellen Stand prüfen. Die bestehende GitHub-CI läuft nur für PRs gegen `main`; lokale Checks werden gesondert dokumentiert.

## Rechtsgrundlage und offene Entscheidungen

Geprüfte Primärquellen am 8. Oktober 2026:

- [§ 5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html): betrifft „geschäftsmäßige, in der Regel gegen Entgelt angebotene digitale Dienste“; der frühere § 5 TMG ist keine aktuelle Rechtsgrundlage. Reichweite, bedingte Register-/Identifikations- und Berufsangaben anhand des tatsächlichen Angebots prüfen. Keine private Steuernummer als allgemeine Pflichtangabe ausgeben.
- [§ 18 MStV, konsolidierte Fassung der Medienanstalten, in Kraft seit 1. Dezember 2025, S. 26](https://www.die-medienanstalten.de/fileadmin/user_upload/Rechtsgrundlagen/Gesetze_Staatsvertraege/Medienstaatsvertrag_MStV.pdf): weitere Identitätsangaben und bei journalistisch-redaktionellem Angebot eine verantwortliche Person mit Anschrift; deren gesetzliche Eignung gesondert prüfen. Das `editorialContent`-Flag ersetzt diese Prüfung nicht.
- [EuGH C-298/07, amtlicher Themenüberblick](https://curia.europa.eu/site/upload/docs/application/pdf/2019-06/fiche_thematique_-commerce_electronique_et_obligations_contractuelles_-_en.pdf): ein geeigneter anderer tatsächlich funktionierender Kontaktweg kann statt Telefon in Betracht kommen. Die URL-Validierung beweist weder Erreichbarkeit noch zeitnahe Bearbeitung; keine erfundene Antwortfrist.
- [Medienanstalten: Impressumspflicht](https://www.die-medienanstalten.de/aufgaben/aufsicht/impressumspflicht/): erkennbare, unmittelbar erreichbare, dauerhaft verfügbare Anbieterkennzeichnung. Die Einzelfallentscheidung zu zwei Links und die Kampagnenprüfung stehen in der [Marketing-Checkliste](marketing-germany.md).

Unbestätigt bleiben Register-/USt-ID-/Wirtschafts-ID-Anwendbarkeit, etwaige reglementierte Tätigkeit und die journalistisch-redaktionelle Einordnung. Diese fünf Entscheidungen bleiben **`null`**, statt aus „kein Unternehmen“ unzulässige Schlussfolgerungen zu ziehen. Anwendbare zusätzliche Angaben sind ebenfalls `null`, bis bestätigt. Die Seiten kennzeichnen diese Lücken rot als **MISSING**. Ein `false` bedeutet eine tatsächlich geprüfte Verneinung, kein bequemes Überspringen.

## Öffentliche Konfiguration

Alle Werte sind öffentliche Anbieterinformationen, niemals Zugangsdaten. Die expliziten `process.env.NEXT_PUBLIC_*`-Referenzen werden beim Next-Produktionsbuild festgeschrieben. Nach jeder Änderung neu bauen. Nicht gesetzte Variablen verwenden nur bei bestätigten Betreiberfakten den dokumentierten Default; eine ausdrücklich leere Zeichenfolge setzt ein Feld auf `null`.

| Feld / Zweck | Umgebungsvariable / Bedingung |
| --- | --- |
| Vollständiger Name, ladungsfähige Anschrift, allgemeine E-Mail | `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_ADDRESS` (echte Zeilenumbrüche), `NEXT_PUBLIC_LEGAL_EMAIL`; alle erforderlich. Kein bloßes Postfach. |
| Zweiter schneller Kontaktweg | `NEXT_PUBLIC_LEGAL_PHONE` (bestätigter Default oben) oder `NEXT_PUBLIC_LEGAL_CONTACT_FORM_URL` (vollständige HTTPS-URL ohne URL-Zugangsdaten). Ein bereitgestellter ungültiger Wert wird ebenfalls beanstandet. Tatsächliche Nutzung prüfen. |
| Anbieterform | `NEXT_PUBLIC_LEGAL_OPERATOR_TYPE`: `individual` (bestätigter Default: natürliche Person) oder `organization`. Kein steuer-/verbraucherrechtlicher Statusentscheid. |
| Organisation | `NEXT_PUBLIC_LEGAL_FORM`, `NEXT_PUBLIC_LEGAL_REPRESENTATIVE` (Name und erforderliche Anschrift); bei `organization` erforderlich. |
| Register | `NEXT_PUBLIC_LEGAL_REGISTER_REQUIRED`: bestätigtes `true`/`false`; bei `true` zusätzlich `NEXT_PUBLIC_LEGAL_REGISTER` mit Register, Gericht und Nummer. |
| Umsatzsteuer-ID | `NEXT_PUBLIC_LEGAL_VAT_ID_REQUIRED`: bestätigtes `true`/`false`; bei `true` zusätzlich `NEXT_PUBLIC_LEGAL_VAT_ID`. |
| Wirtschafts-ID | `NEXT_PUBLIC_LEGAL_BUSINESS_ID_REQUIRED`: bestätigtes `true`/`false`; bei `true` zusätzlich `NEXT_PUBLIC_LEGAL_BUSINESS_ID`. |
| Reglementierte/zulassungspflichtige Tätigkeit | `NEXT_PUBLIC_LEGAL_REGULATED_ACTIVITY`: bestätigtes `true`/`false`; bei `true` verlangt dieser vorsorgliche technische Gate `NEXT_PUBLIC_LEGAL_SUPERVISORY_AUTHORITY` und `NEXT_PUBLIC_LEGAL_PROFESSIONAL_DETAILS`. Den konkret erforderlichen Umfang fachlich bestimmen. |
| Journalistisch-redaktionelles Angebot | `NEXT_PUBLIC_LEGAL_EDITORIAL_CONTENT`: bestätigtes `true`/`false`; bei `true` zusätzlich `NEXT_PUBLIC_LEGAL_CONTENT_RESPONSIBLE_NAME`, `NEXT_PUBLIC_LEGAL_CONTENT_RESPONSIBLE_ADDRESS`. Eignung und gegebenenfalls Verantwortungsbereiche menschlich prüfen. |
| Datenschutzkontakte | `NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL`, `NEXT_PUBLIC_LEGAL_DPO`; diese Zusatzfelder bestimmen nicht die Impressum-Vollständigkeit. Die DPO-Pflicht bleibt Teil der Datenschutzprüfung. |
| Entwurfsfreigabe | `NEXT_PUBLIC_LEGAL_DRAFT_MODE`: nur der genaue Wert `false` schaltet `LEGAL_DRAFT_MODE` aus; fehlender/anderer Wert bleibt Entwurf. |
| Canonical-Origin | `NEXT_PUBLIC_SITE_URL`; gültiger HTTP(S)-Origin ohne Zugangsdaten, bestehender Default `https://dating-app-ruddy.vercel.app`. |

## Freigabe vor Veröffentlichung

1. Identität, Anschrift und tatsächliche Kontaktfähigkeit sowie sämtliche Anwendbarkeitsentscheidungen und bedingten Angaben bestätigen. Erforderliche organisatorische/rechtliche Entscheidungen dokumentieren.
2. Datenschutz, Nutzungsbedingungen **und** Impressum einschließlich offener Verfahren qualifiziert prüfen; Text, DE/EN-Fassungen, Versionen und Datum entsprechend aktualisieren. Ein technischer Beispielzustand ist keine echte rechtliche Freigabe.
3. Erst danach in der vorgesehenen Produktionskonfiguration `NEXT_PUBLIC_LEGAL_DRAFT_MODE=false` setzen und **`npm run legal:check`** ausführen. Die gleichen exportierten Variablen beim folgenden `npm run build` verwenden. Der Node-Check lädt absichtlich keine `.env`-Dateien automatisch; für eine vollständig gepflegte lokale Datei ist `node --env-file=.env.local scripts/legal-check.mjs` möglich. Bei mehreren Dateien und Variablenreferenzen muss die tatsächlich von Next verwendete Produktionskonfiguration exportiert werden; maßgeblich ist die [Next-Dokumentation zur Priorität](https://nextjs.org/docs/app/guides/environment-variables#environment-variable-load-order).
4. Produktionsbuild, erreichbare Kontaktwege, Footer-/Social-/QR-/Store-Links und die [Marketing-Checkliste](marketing-germany.md) auf dem tatsächlichen Veröffentlichungsziel prüfen. Der Gate prüft Konfiguration und einfache Linkformate, keine echte Zustellbarkeit, Vertragswirksamkeit, Anbieterklassifikation oder vollständige Compliance.

`scripts/legal-check.mjs` läuft unter plain Node (wie vorhandene Tests Node 22 mit TypeScript-Unterstützung oder neuer) und verwendet denselben Konfigurationscode. Exit **1** bei erforderlichen fehlenden/ungültigen Werten, unbekannter Anwendbarkeit oder eingeschaltetem Entwurf; Exit **0** nur bei strukturell vollständiger Konfiguration und ausgeschaltetem Entwurf. Es gibt keine Betreiberwerte oder Secrets aus, sondern nur Feld-/Entscheidungsnamen. **Keine Aufnahme in die Default-CI**: Der bewusst unvollständige Entwurf soll PRs nicht blockieren; der Gate ist eine dokumentierte Pflicht vor öffentlichem Release.

## Technische Prüfung

Der Root-Footer rendert `LegalLinks` auf allen normalen Next-Routen, einschließlich Auth-, Onboarding- und App-Layouts. Lokale Footer in Landing/Auth entfallen, die Settings-Karte bleibt zusätzlich erhalten. Das Impressum ist dadurch direkt mit einem Link erreichbar. Nur die sechs exakten Pfade in `LEGAL_DOCUMENT_PATHS` umgehen den Auth-Refresh; verschachtelte/ähnliche Pfade bleiben geschützt. Der Return erfolgt vor Supabase-Client und `getUser()`.

Beide Imprint-Ausgaben haben eigene Canonicals, reziproke DE/EN-Alternativen und deutsches `x-default`. Entwurfsmodus ergibt `noindex, follow`; zusätzlich bleibt ein unvollständiges Impressum unabhängig vom Entwurfsschalter `noindex` und erhält einen Unvollständigkeitshinweis. Alle Anwendbarkeitsentscheidungen müssen daher auch vor einer technischen Indexfreigabe bestätigt sein.

| Prüfung | Tatsächlich ausgeführtes Ergebnis |
| --- | --- |
| Typen / Lint / Tests | `npm run typecheck`, `npm run lint`, `npm test` erfolgreich: **52 Tests, davon 14 Legal-Tests**. Lokal Node 26.5.0; bestehende Modultypwarnungen verursachen keine Fehler. |
| Produktionsbuild | `npm run build` erfolgreich für Betreiber-Default, leere Overrides und vollständige Beispielwerte; sechs Legal-Seiten jeweils `○ (Static)`. Supabase-Platzhalterwerte wie bei CI, keine produktiven Anmeldedaten. Zum Abschluss wieder Betreiber-Default gebaut. |
| `npm run legal:check` | Default: Exit **1** wegen fünf unbestätigter Anwendbarkeitsentscheidungen und Entwurfsmodus. Leere Overrides trotz `DRAFT_MODE=false`: Exit **1** wegen fehlender Fakten/Entscheidungen. Vollständiges synthetisches Beispiel mit fünf `false`-Flags und `DRAFT_MODE=false`: Exit **0**. |
| Browser-Matrix | Installiertes Chrome via Playwright, drei getrennte Produktionsbuilds: DE/EN × 390 × 844 bzw. 1280 × 900 × hell/dunkel = **24 Kombinationen**, alle HTTP 200, ohne Login. Sprachwechsel jeweils geprüft. |
| Datenzustände | Default enthält bestätigte Betreiberfakten und `tel:+491782943998`, DRAFT und offene MISSING-Angaben. Leerzustand entfernt ausdrücklich Name/Adresse/E-Mail/Telefon/Anbieterform, zeigt rote MISSING-Angaben und bleibt ohne Entwurfsbanner trotzdem `noindex`. Vollständiges Beispiel zeigt keine MISSING-Angaben/Unvollständigkeits-/Entwurfsbanner und technisch `index, follow`. Dies ist kein Nachweis rechtlicher Freigabe. |
| Layout / Metadaten | Keine horizontale Überbreite, doppelten IDs oder fehlenden Inhaltsanker. Vier Abschnitte, fünf Zusammenfassungspunkte, alle Links mindestens 44 px hoch, sichtbarer Tastaturfokus, eigene Canonicals und reziproke DE/EN/`x-default` geprüft. |
| Regression / Zugang | Datenschutz weiterhin 16, Terms 17 Abschnitte, beide Sprachfassungen mit neuem Telefonlink und DRAFT/noindex. Sechs Footerlinks auf `/`, `/login`, `/signup`, `/verify-email` und den Legal-Seiten; Impressum direkt geöffnet. `/profile/settings`, `/onboarding/basics`, verschachtelte/ähnliche Imprint-Pfade führen ohne Login weiter zu `/login`. App-/Onboarding-/Settings-Einbindung zusätzlich am Code geprüft. |
| Backend / Fehler | Keine Supabase-/API-Browserrequests oder uncaught Browserfehler bei den Imprint-Seiten/Sprachwechseln. Eine angemeldete Produktionssitzung und tatsächliche Telefon-/E-Mail-Erreichbarkeit wurden nicht getestet. |
| Screenshots | **28 PNGs** in [docs/screenshots/imprint](../screenshots/imprint/): je acht Anbieterabschnitte für `real`, `missing`, `sample`, zusätzlich vier Default-Seitenansichten. Repräsentative mobile/desktop und helle/dunkle Ansichten visuell geprüft. |

Das vollständige Beispiel verwendet ausschließlich **Beispielperson (Test), Musterstraße 1, 00000 Beispielstadt, contact@example.invalid, +49 000 000000**. Die synthetischen Konfigurationen wurden nur für isolierte lokale Prozesse exportiert, nicht als Betreiberdefaults oder Deploymentvariablen gespeichert. Nach der Prüfung enthält der lokale Preview-Build wieder die tatsächlichen bestätigten Betreiberangaben mit eingeschaltetem Entwurfsmodus. Die telefonische Erreichbarkeit wurde nicht durch einen Anruf geprüft.

Die React-Prüfung bestätigt statische Serverinhalte, stabile Keys, gekennzeichnete Sprachen und Fokuszustände; keine neuen Hooks, Client-Effekte, Datenabfragen oder Bibliotheken. Unter `supabase/` wurde nichts geändert; `npm run test:db` ist nach dem Issue-Arbeitsauftrag daher nicht erforderlich und wurde nicht ausgeführt. Der lokale Browsernachweis bestätigt keinen geschützten Vercel-Preview und keine vollständige Compliance der übrigen offenen Issues.
