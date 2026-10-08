import type { ImprintPolicy } from "./types";
import { IMPRINT_LAST_UPDATED, IMPRINT_SOURCES as sources, IMPRINT_VERSION } from "./imprint.config.ts";

export const imprintDe: ImprintPolicy = {
  kind: "imprint", language: "de", title: "Impressum",
  description: "Anbieterkennzeichnung und Kontakt für Lingua Match. Noch nicht bestätigte Angaben sind ausdrücklich gekennzeichnet.",
  version: IMPRINT_VERSION, lastUpdated: IMPRINT_LAST_UPDATED,
  intro: "Diese Anbieterkennzeichnung gilt für die Website von Lingua Match, die installierbare Web-App und die Android-App, die dieselbe Website öffnet. Die nachstehenden Angaben beruhen auf den bestätigten Informationen des Anbieters. Noch nicht bestätigte Angaben und rechtliche Einordnungen sind ausdrücklich gekennzeichnet.",
  summary: [
    "Lingua Match wird von der unten genannten Person angeboten. Der Produktname ersetzt nicht deren rechtliche Identität.",
    "Vollständiger Name, Postanschrift und E-Mail-Adresse werden aus der gemeinsamen Betreiberkonfiguration übernommen.",
    "Ein weiterer schneller Kontaktweg und gegebenenfalls zusätzliche Pflichtangaben werden unten ausgewiesen. MISSING kennzeichnet eine ausstehende Bestätigung.",
    "Der Anbieter beschreibt das Projekt als allein betriebenes, derzeit unentgeltliches Hobby. Eine rechtliche Ausnahme wird daraus nicht ungeprüft abgeleitet.",
    "Solange Pflichtangaben oder die rechtliche Freigabe ausstehen, bleibt dieses Impressum als Entwurf gekennzeichnet und von der Suchindexierung ausgeschlossen.",
  ],
  sections: [
    {
      id: "provider", title: "1. Anbieter und Kontaktdaten",
      paragraphs: [
        "Anbieter ist die nachstehend bezeichnete Person bzw. Organisation. Die Anschrift muss eine tatsächliche, für die Zustellung geeignete Anschrift sein; ein Postfach ersetzt sie nicht. Zusätzliche Unternehmens-, Register- oder Identifikationsangaben sind nur nach ihrer tatsächlichen Anwendbarkeit zu behandeln.",
        "Die Angabe „Natürliche Person“ beschreibt die Anbieteridentität und ist keine abschließende Aussage über eine gewerbliche oder berufliche Tätigkeit. Nicht bestätigte Angaben werden nicht durch erfundene Daten ersetzt.",
      ],
      links: [{ label: "§ 5 DDG — Allgemeine Informationspflichten", href: sources.ddg }],
    },
    {
      id: "contact", title: "2. Kontaktaufnahme",
      paragraphs: [
        "Für Anfragen zum Dienst verwenden Sie die oben angegebene E-Mail-Adresse oder Postanschrift. Soweit ein weiterer Kontaktweg bestätigt ist, ist er dort direkt verlinkt. Übermitteln Sie keine Passwörter, Bestätigungscodes oder unnötigen sensiblen Daten.",
        "§ 5 Abs. 1 Nr. 2 DDG betrifft eine schnelle elektronische Kontaktaufnahme und unmittelbare Kommunikation. Eine Telefonnummer ist nicht in jedem Fall zwingend; ein tatsächlich funktionierender, geeigneter anderer Kontaktweg kann in Betracht kommen. Dessen Erreichbarkeit und Bearbeitung sind zu prüfen. Es wird keine unbestätigte feste Antwortfrist zugesagt.",
        "Ist der zweite Kontaktweg oben mit MISSING gekennzeichnet, steht seine Bestätigung aus. Ein bloßer weiterer mailto-Link oder eine nicht funktionierende Formularattrappe beseitigt diese Lücke nicht.",
      ],
      links: [{ label: "§ 5 Abs. 1 Nr. 2 DDG — Kontaktangaben", href: sources.ddg }, { label: "EuGH C-298/07 — telefonischer oder geeigneter anderer Kontaktweg (amtliche Übersicht)", href: sources.contact }],
    },
    {
      id: "applicability", title: "3. Rechtsgrundlage und offene Einordnung",
      paragraphs: [
        "§ 5 DDG sieht Anbieterpflichten für „geschäftsmäßige, in der Regel gegen Entgelt angebotene digitale Dienste“ vor. Daneben enthält § 18 Abs. 1 MStV Identitätsangaben für Telemedien außerhalb ausschließlich persönlicher oder familiärer Zwecke. Bei journalistisch-redaktionell gestalteten Angeboten ist zusätzlich die Benennung einer verantwortlichen Person nach § 18 Abs. 2 MStV zu prüfen. Die frühere Bezeichnung § 5 TMG wird hier nicht als aktueller Gesetzesverweis verwendet.",
        "Der Anbieter hat einen allein betriebenen Hobbydienst ohne derzeitiges Nutzungsentgelt beschrieben. Ob und welche Vorschriften für das tatsächliche Angebot gelten, ist dennoch gesondert zu prüfen. Ebenso sind Rechtsform, Registereintrag, vorhandene USt-/Wirtschafts-ID, etwaige Zulassung oder berufsrechtliche Angaben und die redaktionelle Einordnung zu bestätigen. Eine private Steuernummer wird nicht als allgemein erforderliche Impressumsangabe verlangt.",
      ],
      gap: "Noch nicht bestätigte Einordnungen und Angaben sind oben gekennzeichnet. Bei journalistisch-redaktionellen Inhalten sind Name, Anschrift und gesetzliche Eignung der verantwortlichen Person vor Freigabe zu prüfen.",
      links: [{ label: "§ 5 DDG — geltende Anbieterpflichten", href: sources.ddg }, { label: "Medienstaatsvertrag — insbesondere § 18", href: sources.media }, { label: "Medienanstalten — Hinweise zur Impressumspflicht", href: sources.guidance }],
    },
    {
      id: "related", title: "4. Weitere rechtliche Informationen",
      paragraphs: [
        "Die Datenschutzerklärung erläutert die Verarbeitung personenbezogener Daten. Nutzungsbedingungen behandeln Teilnahme und Community-Regeln; Lizenzhinweise nennen die Quellen der Lerninhalte. Diese Seiten haben eigene Entwurfs- und Freigabestände.",
        "Dieses Impressum enthält keinen pauschalen Haftungs-, Urheberrechts- oder Linkhaftungsausschluss. Gesetzliche Ansprüche werden durch die Anbieterkennzeichnung nicht eingeschränkt. Die Hinweise zur Verbraucherstreitbeilegung stehen in den Nutzungsbedingungen und bedürfen dort gesonderter Bestätigung.",
      ],
      links: [{ label: "Datenschutzerklärung", href: "/datenschutz" }, { label: "Nutzungsbedingungen — Verbraucherstreitbeilegung", href: "/nutzungsbedingungen#consumer-disputes" }, { label: "Licenses & attributions", href: "/licenses" }],
    },
  ],
};
