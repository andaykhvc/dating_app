import type { PrivacyPolicy } from "./types";
import { PRIVACY_LAST_UPDATED, PRIVACY_SOURCES as sources, PRIVACY_VERSION } from "./privacy.config.ts";

/** German is the primary editorial edition. Changes must be reflected in EN. */
export const privacyDe: PrivacyPolicy = {
  language: "de",
  title: "Datenschutzerklärung",
  description: "Informationen zur Verarbeitung personenbezogener Daten bei Lingua Match — deutscher Entwurf zur rechtlichen Prüfung.",
  version: PRIVACY_VERSION,
  lastUpdated: PRIVACY_LAST_UPDATED,
  intro: "Diese Erklärung erläutert, welche personenbezogenen Daten bei der Nutzung von Lingua Match verarbeitet werden, zu welchen Zwecken dies geschieht und welche Rechte Ihnen zustehen. Sie bezieht sich auf die Website, die installierbare Web-App und die Android-App, die dieselbe Website öffnet. Maßgeblich für diesen Entwurf ist der geprüfte Funktionsumfang vom 8. Oktober 2026.",
  summary: [
    "Profilangaben helfen Ihnen, Sprachpartner zu finden. Dating ist eine freiwillige Nutzungsabsicht.",
    "Nachrichten sind innerhalb der App den Beteiligten des jeweiligen Matches zugänglich. Profilfotos sind über ihre Bildadresse öffentlich abrufbar.",
    "Wir verarbeiten Lernantworten und Fortschritte für Übungen, Wiederholungen, XP und Ranglisten.",
    "Der geprüfte App-Code enthält keine Werbetracker, keine Analyse-SDKs und keine Firebase-Push-Integration.",
    "Elektronischer Datenschutzkontakt, konkrete Infrastruktur, Löschfristen und die Einwilligung für sensible Angaben müssen vor einer endgültigen Veröffentlichung vervollständigt werden.",
  ],
  sections: [
    {
      id: "controller", title: "1. Verantwortlicher und Datenschutzkontakt",
      paragraphs: [
        "Verantwortlicher im Sinne des Art. 4 Nr. 7 DSGVO ist die nachstehend bezeichnete Person oder Gesellschaft, die über Zwecke und Mittel der Verarbeitung entscheidet. Lingua Match ist die Produktbezeichnung; sie ersetzt nicht die rechtliche Identität des Verantwortlichen.",
        "Für Datenschutzanfragen verwenden Sie die unten angegebene Kontaktadresse. Ob ein Datenschutzbeauftragter zu benennen ist und gegebenenfalls dessen Kontaktdaten, ist gesondert zu prüfen. Eine nicht ausgefüllte Angabe bedeutet nicht, dass diese Prüfung bereits erfolgt ist.",
      ],
      gap: "Name und Postanschrift wurden vom Betreiber angegeben. Die E-Mail-Adresse steht noch aus; auch die Prüfung einer Benennungspflicht für einen Datenschutzbeauftragten ist offen. Datenschutzanfragen können bereits an die angegebene Postanschrift gerichtet werden.",
    },
    {
      id: "scope-sources", title: "2. Anwendungsbereich, Mindestalter und Datenquellen",
      paragraphs: [
        "Lingua Match dient dem Sprachaustausch, dem Kennenlernen anderer Menschen und dem sprachlichen Üben. Das Angebot richtet sich ausschließlich an Personen ab 18 Jahren. Die Altersangabe wird bei der Registrierung und bei der Profilvervollständigung geprüft; eine amtliche Identitäts- oder Altersverifikation findet derzeit nicht statt.",
        "Die meisten Daten erhalten wir unmittelbar von Ihnen: bei der Registrierung, beim Ausfüllen Ihres Profils, beim Hochladen von Fotos, durch Nachrichten und durch Lernübungen. Andere Nutzer können uns Angaben über Sie übermitteln, insbesondere Korrekturen zu Ihren Nachrichten sowie Meldungen über Ihr Verhalten. Nutzungsbezogene Daten wie Match-Zeitpunkte, Übungsergebnisse und XP entstehen während der Nutzung.",
        "Bei einer freiwillig gewählten Anmeldung über Google oder Apple erhalten wir die vom jeweiligen Anbieter freigegebenen Identitäts- und Kontodaten, insbesondere eine Anbieterkennung und gegebenenfalls E-Mail-Adresse, Name oder Profilbild. Der konkrete Umfang richtet sich nach der Freigabe und der tatsächlich aktivierten Anbieter-Konfiguration. Für die grundlegende Registrierung nutzen wir keine öffentlich zugänglichen Personendatenbanken.",
      ],
      links: [{ label: "DSGVO: Art. 13 und 14 — Informationen und Datenquellen", href: sources.gdpr }],
    },
    {
      id: "data-purposes", title: "3. Welche Daten wir wofür verarbeiten",
      paragraphs: [
        "Die folgenden Verarbeitungsvorgänge ergeben sich aus dem derzeitigen App-Code und Datenbankschema. Die Zuordnung der Rechtsgrundlagen in Abschnitt 4 ist ein rechtlich zu prüfender Entwurf; sie ersetzt weder eine erforderliche Einwilligung noch die tatsächliche Umsetzung von Lösch- und Schutzmaßnahmen.",
      ],
      bullets: [
        "Konto und Anmeldung: E-Mail-Adresse, interne Nutzerkennung, Authentifizierungsdaten einschließlich Passwort-Hash bei Passwortanmeldung, Bestätigungs- und Sitzungsdaten sowie gegebenenfalls OAuth-Anbieterinformationen. Zweck: Konto einrichten, E-Mail bestätigen, Anmeldung und Sitzungen absichern.",
        "Profil und Präferenzen: Vorname, Geburtsdatum, Bestätigung der Volljährigkeit, Stadt und Land, Kurzbeschreibung, Nutzungsabsichten, Sprachen und selbst eingeschätztes Sprachniveau, Interessen sowie Alters- und Länderpräferenzen. Zweck: Profil darstellen und passende Sprachpartner vorschlagen. Andere Nutzer erhalten das errechnete Alter, nicht das Geburtsdatum.",
        "Fotos: hochgeladene Bilder, daraus erzeugte verkleinerte Fassungen und Vorschaubilder, Speicherpfade, Reihenfolge und Upload-Zeitpunkte. Zweck: Profil, Entdecken-Ansicht, Match- und Nachrichtenlisten sowie Ranglisten bebildern.",
        "Kontakte und Kommunikation: Like-/Pass-Entscheidungen, Matches und deren Status, Nachrichten mit Absender, Inhalt, Zeitstempel und gegebenenfalls Antwortbezug, Korrekturtexte und Erläuterungen sowie Missionsfortschritt. Zweck: gegenseitige Kontaktaufnahme und gemeinsames Üben.",
        "Lernen und Fortschritt: Übungs- und Spielsitzungen, eingegebene Antworten, Bewertungsergebnisse, Abschlusszeitpunkte, Wiederholungsplanung, Konzept- und Lektionsfortschritt, XP-Ereignisse, Level, Serien und Ranglistenpositionen. Auch das Übernehmen einer Lernphrase in einen Chat und deren Verwendung werden für Fortschritt und Belohnung vermerkt.",
        "Sicherheit und Meldungen: Blockierbeziehungen, Meldungsgrund und Freitext, Bezug zu betroffenen Profilen oder Nachrichten, Bearbeitungsstatus sowie Kontostatus. Zweck: Beschwerden prüfen, unerwünschte Kontakte unterbinden und Missbrauch bearbeiten. Lerninhalte können ebenfalls mit einem Hinweis zur Überprüfung gemeldet werden.",
        "Technischer Betrieb: Beim Abruf werden notwendigerweise Verbindungsdaten wie IP-Adresse, Zeitpunkt, angeforderte Adresse und Browser-/Geräteinformationen an die beteiligten Server übermittelt. Ob und wie lange Hosting-, Authentifizierungs- oder Sicherheitsprotokolle gespeichert werden, hängt von der aktiven Infrastruktur ab und ist noch zu bestätigen.",
      ],
      gap: "Konkrete Protokollfelder, Zugriffsmöglichkeiten des Betreibers und Aufbewahrungsfristen in der produktiven Hosting-, Auth- und E-Mail-Konfiguration sind nicht aus dem Repository feststellbar.",
    },
    {
      id: "legal-bases", title: "4. Zwecke und Rechtsgrundlagen",
      paragraphs: [
        "Für die zur Bereitstellung des von Ihnen angeforderten Dienstes erforderliche Verarbeitung kommt Art. 6 Abs. 1 Buchst. b DSGVO in Betracht. Dies betrifft insbesondere Konto, Profil, Matching, Nachrichtenübermittlung und die von Ihnen genutzten Lernfunktionen. Voraussetzung ist ein wirksames Vertragsverhältnis; die Erforderlichkeit ist für jede Datenkategorie zu prüfen. Freiwillige Zusatzangaben sind nicht allein deshalb zur Vertragserfüllung erforderlich, weil ein Eingabefeld angeboten wird.",
        "Die Verarbeitung gewöhnlicher personenbezogener Daten zur technischen Sicherheit, zur Verhinderung von Missbrauch und zur Prüfung von Meldungen kann auf Art. 6 Abs. 1 Buchst. f DSGVO gestützt werden. Berechtigte Interessen sind die Funktionsfähigkeit und Sicherheit des Dienstes, der Schutz seiner Nutzer und die Abwehr rechtswidriger Nutzung. Hierfür sind Erforderlichkeit und Interessenabwägung zu dokumentieren. Für gesetzlich vorgeschriebene Verarbeitungen gilt Art. 6 Abs. 1 Buchst. c DSGVO nur, soweit eine konkrete Verpflichtung besteht; eine pauschale Aufbewahrungspflicht wird nicht behauptet.",
        "Soweit eine Verarbeitung auf Ihre Einwilligung gestützt wird, ist Art. 6 Abs. 1 Buchst. a DSGVO maßgeblich. Sie muss freiwillig, informiert und auf den jeweiligen Zweck bezogen erfolgen und kann für die Zukunft widerrufen werden. Für besondere Kategorien personenbezogener Daten muss zusätzlich eine Ausnahme nach Art. 9 Abs. 2 DSGVO vorliegen; Art. 6 allein genügt nicht.",
      ],
      gap: "Vertragsgrundlage, Umfang freiwilliger Felder, dokumentierte Interessenabwägungen und Einwilligungstexte sind vom Verantwortlichen und der rechtlichen Prüfung noch festzulegen. Dieser Text erteilt selbst keine Einwilligung und begründet keine zusätzliche Rechtsgrundlage.",
      links: [{ label: "DSGVO: Art. 5–7 und Art. 9", href: sources.gdpr }],
    },
    {
      id: "sensitive-data", title: "5. Dating-Absicht und besonders sensible Angaben",
      paragraphs: [
        "Angaben zu Dating-Interessen sowie Inhalte von Fotos, Profiltexten oder Nachrichten können im Einzelfall Informationen über das Sexualleben, die sexuelle Orientierung, die Gesundheit, die Religion oder andere besondere Kategorien personenbezogener Daten erkennen lassen. Ein gewöhnliches Profilfoto ist nicht bereits deshalb ein biometrisches Datum zur eindeutigen Identifizierung; eine solche Gesichtserkennung ist im geprüften App-Code nicht implementiert.",
        "Eine solche sensible Verarbeitung darf nicht allein auf Vertragserfüllung oder ein allgemeines berechtigtes Interesse gestützt werden. Soweit für die Dating-Funktion eine ausdrückliche Einwilligung nach Art. 9 Abs. 2 Buchst. a DSGVO erforderlich ist, muss diese gesondert, nachweisbar und widerruflich eingeholt werden. Das bloße Auswählen von „Open to Dating“ und das Lesen dieser Erklärung ersetzen diese Einwilligung nicht. Auf eine vermeintlich öffentliche Zugänglichkeit wird nicht pauschal als Ausnahme zurückgegriffen.",
        "Die Sprachpartnerfunktionen sind von der Dating-Absicht zu unterscheiden. Sie können die Dating-Absicht im Profil ändern und Dating-Profile aus Ihrer Entdecken-Ansicht ausblenden. Eine Änderung wirkt nicht rückwirkend auf bereits geteilte Inhalte. Vermeiden Sie sensible Angaben über sich oder Dritte, soweit sie für den jeweiligen Austausch nicht erforderlich sind.",
      ],
      gap: "Die gesonderte ausdrückliche Einwilligung, ihre Versionierung und der vollständige Widerrufsprozess sind derzeit nicht implementiert. Diese Lücke und die Zulässigkeit sensibler Daten bei allen eingesetzten Dienstleistern müssen vor einer Freigabe der betreffenden Verarbeitung geklärt werden.",
      links: [{ label: "DSGVO: Art. 9 und Art. 7 Abs. 3", href: sources.gdpr }],
    },
    {
      id: "visibility", title: "6. Wer Ihre Angaben sehen kann",
      paragraphs: [
        "Angemeldete Nutzer erhalten abhängig von den Funktionen und Zugriffsregeln ausgewählte Profilangaben, insbesondere Vorname, errechnetes Alter, Stadt/Land, Sprachen, Interessen, Kurzbeschreibung, Nutzungsabsichten und Profilbilder. Die Rangliste zeigt geeignete aktive Profile mit Vorname, Bild, XP, Level und Platzierung. Blockierungen werden bei Entdecken-Ansicht und Rangliste in beide Richtungen berücksichtigt.",
        "Nachrichten und Korrekturen sind in der App den Beteiligten des jeweiligen Matches zugänglich. Die Datenbank speichert diese Inhalte; berechtigte technische oder administrative Zugriffe des Betreibers bzw. seiner Dienstleister sind damit nicht ausgeschlossen. Es besteht keine implementierte Ende-zu-Ende-Verschlüsselung für Chats. Melden Sie Inhalte, können dafür relevante Angaben zur Bearbeitung der Meldung herangezogen werden.",
        "Profilbilder liegen derzeit in einem öffentlich lesbaren Speicherbereich. Wer die Bildadresse kennt oder weitergegeben bekommt, kann das Bild auch ohne Anmeldung abrufen. Eine Blockierung macht eine bereits bekannte Bildadresse nicht unzugänglich. Andere Nutzer können Inhalte außerdem kopieren oder Screenshots anfertigen; dies lässt sich durch die derzeitige Technik nicht verhindern.",
        "Blockieren beendet das aktive Match, löscht aber nach dem aktuellen Datenbankschema nicht automatisch gespeicherte Nachrichten oder Meldungen. Es ist daher kein Ersatz für einen Löschungsantrag.",
      ],
    },
    {
      id: "providers", title: "7. Empfänger und eingesetzte Dienste",
      paragraphs: [
        "Zur Erbringung des Dienstes werden externe technische Anbieter eingesetzt. Soweit diese personenbezogene Daten in unserem Auftrag verarbeiten, bedarf es einer Vereinbarung nach Art. 28 DSGVO. Für eigene Verarbeitungsvorgänge eines Anbieters kann dieser selbst Verantwortlicher sein; dessen jeweilige Datenschutzhinweise gelten ergänzend.",
      ],
      bullets: [
        "Supabase: Datenbank, Authentifizierung und Sitzungsverwaltung, Speicherung von Profilbildern sowie Echtzeitübertragung neuer Chatdaten. Dabei werden Konto-, Profil-, Kommunikations- und Lerndaten sowie erforderliche technische Metadaten verarbeitet. Die konkrete Vertragsgesellschaft und Projektregion sind noch zu bestätigen.",
        "Vercel: Hosting und Auslieferung der Website sowie Ausführung serverseitiger App-Funktionen. Vercel erhält technische Abrufdaten und kann Daten verarbeiten, die serverseitig zur Darstellung der App abgerufen werden. Der ausgewählte Ausführungsort, Logging-Einstellungen und konkrete Vertragsstand sind noch zu bestätigen.",
        "Google / Apple: nur bei der von Ihnen gewählten und tatsächlich aktivierten Anmeldung über den jeweiligen Anbieter. Der Anbieter erhält Informationen zur Anmeldung und gibt die freigegebenen Identitätsdaten zurück. Ein Anbieter-Passwort wird nicht in das Lingua-Match-Formular eingegeben. Das Vorhandensein eines Login-Buttons belegt nicht, dass der Anbieter in der Produktivumgebung bereits freigeschaltet ist.",
        "E-Mail-Versand: Bestätigungs- und sonstige Kontomails werden über die Authentifizierungsinfrastruktur versandt. Ob ein externer SMTP-Anbieter eingerichtet ist und welche Versand-/Zustellprotokolle entstehen, ist noch zu bestätigen.",
        "Geräte- und Browserfunktionen: Die Android-App öffnet die Website als Trusted Web Activity. Installations- und Browserdienste können eigene Daten nach ihren Bedingungen verarbeiten. Hörübungen verwenden die Sprachausgabe des Browsers; lokale Stimmen werden bevorzugt, eine passende entfernte Stimme kann aber verwendet werden. Dann kann Übungstext durch den Browser an dessen Sprachdienst übermittelt werden. Die App zeichnet keine Stimme auf.",
      ],
      gap: "Firebase-Push, Werbe-SDKs und externe KI-Dienste sind im geprüften Repository nicht integriert. Abweichende Dashboard-Einstellungen, Hosting-Erweiterungen und zukünftige Integrationen sind vor Veröffentlichung dieser Erklärung zu prüfen. Anbieter-Vertragsgesellschaften, Auftragsverarbeitungsverträge und Unterauftragnehmer sind noch zu bestätigen.",
      links: [
        { label: "Supabase — Data Processing Addendum", href: sources.supabaseDpa },
        { label: "Vercel — Data Processing Addendum", href: sources.vercelDpa },
        { label: "Google — Datenschutzhinweise", href: sources.google },
        { label: "Apple — Datenschutzhinweise", href: sources.apple },
      ],
    },
    {
      id: "transfers", title: "8. Verarbeitungsorte und Drittlandübermittlungen",
      paragraphs: [
        "Der konkrete Speicherort dieses Supabase-Projekts und die Ausführungs- bzw. Protokollierungsorte der Vercel-Bereitstellung sind nicht verifiziert. Eine ausschließlich in Deutschland oder der EU stattfindende Verarbeitung wird daher nicht zugesichert. Auch die Auswahl einer EU-Datenbankregion schließt einen Zugriff aus anderen Ländern oder weitere Verarbeitung durch Unterauftragnehmer nicht von selbst aus.",
        "Bei einer Übermittlung außerhalb des Europäischen Wirtschaftsraums müssen die Voraussetzungen der Art. 44 ff. DSGVO erfüllt sein. Je nach Empfänger kann dies ein anwendbarer Angemessenheitsbeschluss oder geeignete Garantien, insbesondere die Standardvertragsklauseln der Europäischen Kommission mit gegebenenfalls erforderlichen ergänzenden Maßnahmen, sein. Welche Grundlage für welchen Empfänger tatsächlich gilt, muss vor der Freigabe belegt werden. Eine Berufung auf das EU–US Data Privacy Framework setzt insbesondere voraus, dass der konkrete Empfänger und die betreffende Datenverarbeitung vom jeweils geltenden Beschluss und einer gültigen Zertifizierung erfasst sind.",
        "Informationen zur tatsächlich eingesetzten Übermittlungsgrundlage und eine Kopie bzw. Fundstelle der geeigneten Garantien können Sie über den in Abschnitt 1 genannten Kontakt anfordern.",
      ],
      gap: "Projektregion, Anbieterstandorte, Unterauftragnehmer, geltende Vertragsmodule, Zertifizierungsstatus und gegebenenfalls Transferprüfung sind offen. Vercels veröffentlichtes DPA enthält zudem eine Einschränkung für sensible Kundendaten; deren Vereinbarkeit mit den konkreten Profil- und Kommunikationsdaten bedarf gesonderter Klärung.",
      links: [
        { label: "DSGVO: Art. 44–49", href: sources.gdpr },
        { label: "Supabase — verfügbare Projektregionen", href: sources.supabaseRegions },
        { label: "Vercel — DPA, internationale Übermittlungen und Datenkategorien", href: sources.vercelDpa },
      ],
    },
    {
      id: "device-storage", title: "9. Cookies und Zugriff auf Ihr Endgerät",
      paragraphs: [
        "Die Anmeldung verwendet Supabase-Sitzungscookies. Diese speichern Authentifizierungs- und gegebenenfalls kurzlebige Anmeldeflussinformationen; Bezeichnungen können projektbezogen mit „sb-“ beginnen und bei größeren Inhalten in mehrere Cookies aufgeteilt sein. Die Cookies dienen der Anmeldung und Sitzungsfortführung. Die konkrete Laufzeit hängt von den Bibliotheks- und Auth-Einstellungen ab und ist vor Veröffentlichung anhand der Produktivumgebung zu dokumentieren.",
        "Soweit das Speichern oder Auslesen für den von Ihnen ausdrücklich gewünschten Anmeldedienst unbedingt erforderlich ist, kommt die Ausnahme des § 25 Abs. 2 Nr. 2 TDDDG in Betracht. Eine darüber hinausgehende, nicht erforderliche Speicherung oder Auswertung würde grundsätzlich eine vorherige Einwilligung nach § 25 Abs. 1 TDDDG benötigen; die anschließende Verarbeitung personenbezogener Daten ist zusätzlich nach der DSGVO zu beurteilen.",
        "Die Installationshilfe erkennt im laufenden Browser unter anderem Gerätekategorie und Standalone-Anzeigezustand. Ihr Zustand wird im geprüften App-Code nur im Arbeitsspeicher gehalten. Eigene dauerhafte Einträge in localStorage, sessionStorage oder IndexedDB sowie ein eigener Service Worker sind dort derzeit nicht vorhanden. Das Erscheinungsbild folgt der Systempräferenz. Das Repository enthält keine eigenen Analyse- oder Marketingtracker; dies ist keine Aussage über unbekannte Hosting-Erweiterungen.",
      ],
      gap: "Die tatsächlichen Cookie-Namen, Zwecke und Laufzeiten sowie etwaige zusätzliche Anbieter-Cookies sind durch einen Produktions-Browseraudit zu vervollständigen. Eine notwendige Cookie-Einwilligung wird durch diese Erklärung nicht ersetzt.",
      links: [{ label: "§ 25 TDDDG — Endgerätezugriff", href: sources.tdddg }],
    },
    {
      id: "retention", title: "10. Speicherdauer und Löschung",
      paragraphs: [
        "Personenbezogene Daten dürfen nur so lange gespeichert werden, wie es für den jeweiligen Zweck erforderlich ist oder eine einschlägige gesetzliche Verpflichtung bzw. die Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen dies rechtfertigt. Anschließend sind sie zu löschen oder wirksam zu anonymisieren. Eine bloße Kontosperre oder das Ende eines Matches ist keine Anonymisierung.",
        "Im geprüften Code besteht kein automatisierter, nach Datenkategorien abgestufter Löschplan. Konto-, Profil-, Chat- und Lerndaten bleiben grundsätzlich gespeichert, solange kein tatsächlicher Löschvorgang durchgeführt wird. Die datenbankseitigen Löschverknüpfungen entfernen viele abhängige Datensätze bei einer Kontolöschung; gespeicherte Bilddateien müssen zusätzlich über den Speicherdienst entfernt werden. Allein das Löschen von Datenbankverweisen entfernt eine Datei nicht verlässlich.",
        "Konkrete Fristen für inaktive Konten, Kommunikationsdaten nach Match-Ende, Meldungen und Sicherheitsprotokolle sowie die Löschzyklen von Sicherungskopien sind nicht festgelegt. Auch eine Weiterverarbeitung in Backups nach einem Löschvorgang darf nur für begrenzte, sachlich begründete Zwecke erfolgen und muss in einem überprüfbaren Verfahren berücksichtigt werden.",
      ],
      gap: "Ein verbindliches Löschkonzept einschließlich Fristen, Ausnahmen, Verantwortlichkeiten und Backup-Behandlung ist noch zu beschließen und technisch umzusetzen. Dieser Entwurf nennt keine erfundenen Tagesfristen und verspricht keine bereits aktive automatische Löschung.",
      links: [{ label: "DSGVO: Art. 5 Abs. 1 Buchst. e und Art. 17", href: sources.gdpr }],
    },
    {
      id: "security", title: "11. Schutz Ihrer Daten",
      paragraphs: [
        "Zugriffsregeln in der Datenbank und ausgewählte Ausgabefunktionen begrenzen, welche Daten ein App-Nutzer lesen oder verändern darf. Lernbewertung und XP-Vergabe erfolgen in Datenbankfunktionen; gewöhnliche Nutzer können sich nicht unmittelbar eigene Punkte schreiben. Diese Maßnahmen sind von den Zugriffsrechten des Infrastrukturbetreibers und des Administrators zu unterscheiden.",
        "Die öffentlich lesbare Fotoablage und das Fehlen einer Ende-zu-Ende-Verschlüsselung für Chats sind in Abschnitt 6 beschrieben. Eine lückenlose Sicherheitsgarantie wird nicht gegeben. Die technischen und organisatorischen Maßnahmen, privilegierten Zugänge, Transportkonfiguration und Vorfallverfahren der produktiven Umgebung sind vor Freigabe zu überprüfen.",
      ],
    },
    {
      id: "automation", title: "12. Automatisierte Auswahl, Lernbewertung und Entscheidungen",
      paragraphs: [
        "Die App filtert bzw. sortiert Profilvorschläge anhand von Sprachen, Alters- und Länderpräferenzen, bisherigen Swipe-Entscheidungen und Blockierungen. Übungen werden automatisch bewertet; Wiederholungstermine sowie XP, Level und Ranglistenpositionen werden aus dem Lern- und Nutzungsverlauf berechnet. Dies dient der Partnerauswahl und Übungsplanung und kann eine automatisierte Bewertung von Präferenzen oder Leistungen im Sinne eines Profilings darstellen.",
        "Im geprüften App-Code wurde keine ausschließlich automatisierte Entscheidung festgestellt, die rechtliche Wirkung entfaltet oder Sie in vergleichbarer Weise erheblich beeinträchtigt, wie sie Art. 22 Abs. 1 DSGVO beschreibt. Insbesondere sind keine automatisierte KI-Fotomoderation und keine automatische Sanktion allein aufgrund einer Nutzermeldung implementiert. Diese Feststellung ist bei Einführung neuer Moderations- oder Bewertungssysteme erneut zu prüfen.",
      ],
      links: [{ label: "DSGVO: Art. 4 Nr. 4 und Art. 22", href: sources.gdpr }],
    },
    {
      id: "required-data", title: "13. Welche Angaben erforderlich sind",
      paragraphs: [
        "Sie sind gesetzlich nicht verpflichtet, ein Konto bei Lingua Match anzulegen. Für die Kontoanmeldung sind die zur gewählten Anmeldemethode erforderlichen Identitätsdaten nötig. Ohne diese Angaben ist eine Anmeldung nicht möglich. Der reguläre Onboarding-Ablauf verlangt insbesondere Vorname, Geburtsdatum und Volljährigkeitsbestätigung, Land, mindestens eine Mutter- und eine Lernsprache, mindestens eine Nutzungsabsicht sowie ein Profilfoto. Ohne diese Angaben können Sie diesen Ablauf nicht abschließen.",
        "Stadt, Kurzbeschreibung, Interessen, zusätzliche Fotos und die Dating-Absicht sind freiwillige Profilangaben; welche weiteren Angaben in einem bestimmten Bildschirm verlangt werden, ist dort erkennbar. Nachrichten, Korrekturen und konkrete Übungsantworten entstehen erst, wenn Sie diese Funktionen nutzen. Für einen Sprachpartneraustausch ist es nicht erforderlich, „Open to Dating“ auszuwählen. Dass eine Oberfläche eine Angabe verlangt, ist für sich genommen noch keine abschließende datenschutzrechtliche Erforderlichkeitsprüfung.",
      ],
    },
    {
      id: "rights", title: "14. Ihre Rechte und deren Ausübung",
      paragraphs: [
        "Unter den jeweiligen gesetzlichen Voraussetzungen haben Sie folgende Rechte. Sie können sich dafür an den in Abschnitt 1 genannten Datenschutzkontakt wenden. Zur Vermeidung unbefugter Offenlegung darf bei begründeten Zweifeln eine angemessene Identitätsprüfung erfolgen; es werden dafür keine über das Erforderliche hinausgehenden Daten verlangt.",
      ],
      bullets: [
        "Auskunft nach Art. 15 DSGVO über die Verarbeitung Ihrer Daten einschließlich einer Kopie der personenbezogenen Daten.",
        "Berichtigung nach Art. 16 DSGVO und Vervollständigung unvollständiger Daten. Viele Profilangaben können Sie selbst unter „Profile → Edit profile“ ändern.",
        "Löschung nach Art. 17 DSGVO, soweit keine gesetzliche Ausnahme entgegensteht, sowie Einschränkung der Verarbeitung nach Art. 18 DSGVO.",
        "Datenübertragbarkeit nach Art. 20 DSGVO in einem strukturierten, gängigen und maschinenlesbaren Format für von Ihnen bereitgestellte Daten, die auf Einwilligung oder Vertrag beruhen und automatisiert verarbeitet werden; direkte Übermittlung an einen anderen Verantwortlichen, soweit technisch machbar.",
        "Widerspruch nach Art. 21 Abs. 1 DSGVO aus Gründen Ihrer besonderen Situation gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 Buchst. e oder f DSGVO, einschließlich darauf gestützten Profilings. In diesem Fall darf die Verarbeitung nur unter den gesetzlichen Voraussetzungen fortgesetzt werden. Gegen Direktwerbung besteht nach Art. 21 Abs. 2 DSGVO ein jederzeitiges Widerspruchsrecht; eigene Direktwerbefunktionen sind derzeit nicht implementiert.",
        "Widerruf einer Einwilligung nach Art. 7 Abs. 3 DSGVO jederzeit mit Wirkung für die Zukunft. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt unberührt. Der Widerruf darf nicht schwieriger sein als die Erteilung.",
        "Die Rechte bei Entscheidungen nach Art. 22 DSGVO, soweit eine solche Entscheidung eingesetzt wird und die gesetzlichen Voraussetzungen erfüllt sind.",
      ],
      gap: "Eine selbst bedienbare Funktion „Konto löschen“ oder „Meine Daten herunterladen“ gibt es in den derzeitigen Einstellungen noch nicht. Anträge können schriftlich an die Postanschrift in Abschnitt 1 gerichtet werden. Die elektronische Kontaktadresse steht noch aus. Der Verantwortliche muss die fristgerechte Bearbeitung einschließlich Identitätsprüfung, Datenzusammenstellung und tatsächlicher Löschung organisatorisch sicherstellen.",
      links: [{ label: "Europäische Kommission — Betroffenenrechte", href: sources.rights }],
    },
    {
      id: "complaints", title: "15. Fristen und Beschwerde bei einer Aufsichtsbehörde",
      paragraphs: [
        "Informationen über die aufgrund Ihres Antrags ergriffenen Maßnahmen sind grundsätzlich unverzüglich, spätestens innerhalb eines Monats nach Eingang, zu erteilen. Bei gesetzlich zulässiger Verlängerung um bis zu zwei weitere Monate sind Sie innerhalb des ersten Monats über die Verlängerung und ihre Gründe zu informieren. Für eine Ablehnung gelten die Begründungs- und Hinweispflichten des Art. 12 DSGVO.",
        "Unabhängig von einem Rechtsbehelf können Sie sich nach Art. 77 DSGVO bei einer Datenschutzaufsichtsbehörde beschweren, insbesondere in dem Mitgliedstaat Ihres gewöhnlichen Aufenthaltsorts, Ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes. Sie müssen sich hierfür nicht zunächst an uns wenden.",
        "Für den angegebenen Sitz des Verantwortlichen in Dresden ist die Sächsische Datenschutz- und Transparenzbeauftragte die zuständige Landesaufsichtsbehörde. Die offizielle Beschwerdeseite und das Verzeichnis weiterer Aufsichtsbehörden sind unten verlinkt.",
      ],
      links: [
        { label: "Sächsische Datenschutz- und Transparenzbeauftragte — Beschwerde einreichen", href: sources.saxony },
        { label: "Offizielles Verzeichnis der Datenschutzaufsichtsbehörden", href: sources.authorities },
        { label: "DSGVO: Art. 12 und Art. 77", href: sources.gdpr },
      ],
    },
    {
      id: "changes", title: "16. Stand, Änderungen und offene Freigabe",
      paragraphs: [
        "Versionsnummer und Bearbeitungsstand dieser Erklärung finden Sie am Seitenanfang. Bei Änderungen der Funktionen, Empfänger oder Zwecke muss die Erklärung angepasst werden. Eine Textänderung allein ersetzt weder eine neue Rechtsgrundlage noch eine für neue Zwecke erforderliche Einwilligung.",
        "Die deutsche Fassung ist die primär erstellte Fassung dieses Entwurfs; die englische Ausgabe erläutert denselben geprüften Stand. Dadurch werden gesetzliche Rechte oder zwingende Informationspflichten in einer verständlichen Sprache nicht eingeschränkt.",
      ],
      gap: "Freigabe ausstehend: elektronische Kontaktadresse, Datenschutzbeauftragten-Prüfung, tatsächliche Dienstleister/Regionen und Verträge, Drittlandgarantien, Löschkonzept, Cookie-Audit und ausdrückliche Einwilligung für sensible Daten. Bis zur Klärung bleibt die sichtbare Entwurfskennzeichnung bestehen.",
    },
  ],
};
