# Compliance-Unterlagen — Lingua Match

> **ENTWÜRFE zur fachlichen und rechtlichen Prüfung. Keine Rechtsberatung und keine Freigabe für den Produktivbetrieb.** Ein gemergter Pull Request ersetzt keine Betreiberentscheidung, Anbietervereinbarung oder rechtliche Prüfung.

Ausgangspunkt ist das [Dateninventar](data-inventory.md): überprüfter Code-/Schemastand, tatsächliche Zugriffs- und Löschpfade, Endgerätespeicher, Anbieterfragen und vorgeschlagene Rechtsgrundlagen/Fristen. **`verify`** kennzeichnet fehlende Betriebsnachweise; Implementierung im Repository bedeutet keine bestätigte Aktivierung in Produktion.

| Unterlage | Wofür sie verwendet wird | Stand / notwendiger Abgleich |
| --- | --- | --- |
| [Dateninventar und Art.-30-Vorlage](data-inventory.md) | Datenkarte für alle 45 Migrationstabellen, Art.-9-/Consentprüfung, Anbieter/Transfers, Speicher, Rechte, Retention, DSFA/DSB | 8. Oktober 2026, Commit `b776272`; Betreiberentscheidungen und Produktionskonfigurationen offen |
| [Datenschutzhinweise: Prüfvermerk](privacy-policy-review.md) | Quellen, damaliger Faktenstand und Freigabefragen zu den DE/EN-Texten aus #39 | Älterer Snapshot: insbesondere Push, Sprache/Theme/Zeitzone, Consent, Export/Löschung und Moderation mit Inventar abgleichen |
| [Nutzungsbedingungen: Prüfvermerk](terms-review.md) | Vertrags-/Verbraucherfragen, Regeln und tatsächliche Betreiberangaben aus #40 | Neue Konto-/Moderations-/Consentfunktionen und bestätigten Betrieb abgleichen |
| [Impressum: Prüfvermerk](imprint-review.md) | Betreiber-/Kontaktangaben und noch zu prüfende gesetzlichen Angaben aus #41 | Hobby/unentgeltlich ist keine automatische Klärung sämtlicher Anwendbarkeitsfragen; aktuelle Konfiguration prüfen |
| [Fotomoderation: menschlicher Ablauf](moderation-runbook.md) | Warteschlange, Freigabe/Ablehnung, Dateilöschung und öffentliche Bucket-Risiken | „Sichtbar nur nach Freigabe“ betrifft Profilanzeige; Dateien bleiben bei bekannter URL öffentlich, solange sie existieren |
| [Deutschland-Marketingprüfung](marketing-germany.md) | Rahmen für mögliche öffentliche Werbung/Ansprache | Vor tatsächlichem Marketing den dann aktuellen Betrieb, Einwilligungen und Rechtslage prüfen |

Weitere Implementierungsbelege: [Export](../data-export.md), [Push und Setup](../push-notifications.md), [automatische Fotomoderation](../moderation.md), [allgemeine Moderation](../moderation-runbook.md), [Namensmoderation](../moderation-names.md), [SMTP-Setup](../auth-email-brevo.md), [i18n](../i18n.md), [Inhaltslizenzen](../open-content-licensing.md). Setup-Anweisungen sind kein Nachweis einer aktiven Produktionsanbindung.

Vor Freigabe die [menschliche Aufgabenliste](data-inventory.md#menschliche-aufgaben-vor-freigabe) abschließen und ältere Unterlagen aktualisieren. Bei jeder neuen Tabelle, Datenart, Anbieteranbindung, Endgerätespeicherung oder geänderten Lösch-/Zugriffsfunktion zuerst das Inventar prüfen, anschließend Rechtstexte und Store-Angaben. Die [reproduzierbare Tabellendeckungsprüfung](data-inventory.md#vollständigkeitsregister-der-migrationen) erkennt fehlende Tabellen; Feld-/Betriebsprüfung bleibt zusätzlich erforderlich.
