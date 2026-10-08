import type { TermsPolicy } from "./types";
import { TERMS_LAST_UPDATED, TERMS_SOURCES as sources, TERMS_VERSION } from "./terms.config.ts";

/** Native German primary edition; factual changes must also reach EN. */
export const termsDe: TermsPolicy = {
  kind: "terms",
  language: "de",
  title: "Nutzungsbedingungen",
  description: "Entwurf der Nutzungsbedingungen für Lingua Match: Sprachaustausch, Community-Regeln, Nutzerinhalte und Ihre Rechte.",
  version: TERMS_VERSION,
  lastUpdated: TERMS_LAST_UPDATED,
  intro: "Lingua Match verbindet Erwachsene zum Sprachaustausch, gemeinsamen Lernen und Kennenlernen. Diese Nutzungsbedingungen beschreiben den vorgesehenen Rahmen für die Nutzung der Website, der installierbaren Web-App und der Android-App, die dieselbe Website öffnet. Sie sind ein Entwurf zur rechtlichen Prüfung auf Grundlage des Funktionsstands vom 8. Oktober 2026.",
  summary: [
    "Sie müssen mindestens 18 Jahre alt sein und dürfen nur ein persönliches Konto führen. Angaben und Fotos dürfen andere nicht über Ihre Identität täuschen.",
    "Sprachpartnerschaft steht im Mittelpunkt. Dating ist freiwillig; eine Dating-Absicht ersetzt weder gegenseitiges Interesse noch Zustimmung zu sexuellen Kontakten.",
    "Belästigung, Hass, sexuelle Inhalte, Betrug, Identitätstäuschung, Spam und kommerzielle Kontaktwerbung sind untersagt.",
    "Sie behalten die Rechte an Ihren Inhalten. Der Dienst benötigt nur die für die von Ihnen genutzten Funktionen erforderlichen Nutzungsrechte; Profilfotos sind derzeit über ihre Bildadresse öffentlich abrufbar.",
    "Nutzen Sie Melden und Blockieren im Chat oder wenden Sie sich an den Anbieter. Verbindliche Moderationsfristen und die vollständige technische Sperrwirkung sind noch zu klären; Ihre gesetzlichen Rechte bleiben bestehen.",
  ],
  sections: [
    {
      id: "provider", title: "1. Anbieter, Geltungsbereich und Einbeziehung",
      paragraphs: [
        "Anbieter des Dienstes ist die nachstehend bezeichnete Person. „Lingua Match“ bezeichnet das Produkt und ist keine abweichende rechtliche Anbieteridentität. Nach eigener Angabe betreibt der Anbieter das Projekt allein als Hobby und erhebt derzeit kein Nutzungsentgelt. Diese tatsächliche Beschreibung legt seine rechtliche Einordnung nicht fest. Diese Bedingungen sollen nach ihrer rechtlichen Freigabe und wirksamen Einbeziehung den Nutzungsvertrag für die App regeln.",
        "Die bloße Veröffentlichung oder Verlinkung dieses Entwurfs bewirkt keine wirksame Vereinbarung sämtlicher Klauseln. Für Allgemeine Geschäftsbedingungen gelten insbesondere die Voraussetzungen der §§ 305 ff. BGB. Der Vertragsschluss, die rechtzeitige Kenntnisnahmemöglichkeit und ein erforderlicher Zustimmungsnachweis müssen gesondert umgesetzt und geprüft werden.",
      ],
      gap: "Rechtliche Freigabe, Vertragsschluss und versionierter Nachweis der Zustimmung zu den Nutzungsbedingungen stehen aus. Der aktuelle Registrierungsablauf speichert noch keine Annahme dieser Fassung. Eine datenschutzrechtliche Einwilligung ist hiervon zu unterscheiden. Ob der Anbieter rechtlich als Unternehmer einzuordnen ist, muss geprüft werden; die Bezeichnung als Hobby und der Verzicht auf Entgelt entscheiden dies nicht allein.",
      links: [{ label: "§ 305 BGB — Einbeziehung von AGB", href: sources.agbInclusion }, { label: "§ 14 BGB — Unternehmerbegriff", href: sources.providerStatus }],
    },
    {
      id: "eligibility", title: "2. Teilnahme: Volljährigkeit und ein persönliches Konto",
      paragraphs: [
        "Das Angebot richtet sich ausschließlich an Personen ab 18 Jahren. Geben Sie Ihr tatsächliches Geburtsdatum an und bestätigen Sie Ihre Volljährigkeit wahrheitsgemäß. Ein Hinweis, dass ein Profil minderjährig sein könnte, ist über den Meldegrund „Appears to be under 18“ oder den Kontakt in Abschnitt 1 mitzuteilen.",
        "Sie dürfen nur ein persönliches Konto führen und Ihr Konto nicht an andere weitergeben. Zusätzliche Konten zur Umgehung einer Blockierung oder Sperre sind unzulässig. Diese Verhaltensregel bedeutet nicht, dass die App Mehrfachkonten derzeit durch eine amtliche Identitätsprüfung technisch ausschließt.",
        "Die App prüft Altersangaben und die Volljährigkeitsbestätigung bei der Profilvervollständigung. Sie führt derzeit keine amtliche Identitäts- oder Altersverifikation durch. Für Minderjährige ist die Nutzung auch mit einer elterlichen Erlaubnis nach diesem Teilnahmeentwurf nicht vorgesehen.",
      ],
    },
    {
      id: "account-security", title: "3. Konto, Zugang und Sicherheit",
      paragraphs: [
        "Verwenden Sie zutreffende Anmeldedaten und eine E-Mail-Adresse, auf die Sie Zugriff haben. Schützen Sie die Zugangsdaten Ihrer gewählten Anmeldemethode und geben Sie Passwörter oder Bestätigungscodes nicht weiter. Melden Sie einen vermuteten unbefugten Zugriff über die angegebenen Kontaktdaten.",
        "Die Verantwortung für ein Konto ist nach den Umständen des Einzelfalls und dem geltenden Recht zu beurteilen. Allein die Nutzung Ihrer Kennung begründet keine verschuldensunabhängige Haftung für jedes Verhalten eines Dritten.",
        "Sie dürfen Schutzmaßnahmen nicht umgehen, fremde Konten nicht ausspähen und den Dienst nicht durch missbräuchliche automatisierte Zugriffe oder Manipulationen stören. Bei einem Sicherheitsproblem übermitteln Sie nur die zur Prüfung erforderlichen Angaben und keine fremden Zugangsdaten.",
      ],
    },
    {
      id: "service", title: "4. Sprachaustausch, Matching und freiwillige Dating-Absicht",
      paragraphs: [
        "Sie können Sprachpartner, Freundschaften und kulturellen Austausch suchen. Profile werden unter anderem anhand von Sprachen, Alters- und Länderpräferenzen sowie bisherigen Like-/Pass-Entscheidungen vorgeschlagen. Ein gegenseitiges Like erzeugt ein Match; die App bietet dafür Chat, Gesprächsmissionen und sprachliche Korrekturen an.",
        "Eine Dating-Absicht wird nur kenntlich gemacht, wenn Sie „Open to Dating“ freiwillig auswählen. Diese Auswahl ist für Sprachpartnerschaft nicht erforderlich und kann im Profil geändert werden. Eine Einstellung erlaubt es, Profile mit Dating-Absicht in der Entdecken-Ansicht auszublenden. Die Auswahl ist weder eine ausdrückliche datenschutzrechtliche Einwilligung für sensible Daten noch eine Zustimmung zu sexuellen Nachrichten oder persönlichen Treffen.",
        "Die App sichert keine bestimmte Anzahl von Vorschlägen oder Matches, keinen bestimmten Lernerfolg und keine Beziehungsentwicklung zu. Beachten Sie die Grenzen und Wünsche anderer Personen. Gesetzliche Ansprüche wegen der vereinbarten Beschaffenheit des Dienstes bleiben davon unberührt.",
      ],
    },
    {
      id: "profiles-photos", title: "5. Profile und Fotos",
      paragraphs: [
        "Verwenden Sie Ihren eigenen Vornamen und eigene, zutreffende Profilangaben. Ihre Profilfotos müssen Sie selbst zeigen; geben Sie sich nicht als eine andere Person, eine Person des öffentlichen Lebens oder ein Unternehmen aus. Laden Sie nur Bilder hoch, für deren Verwendung Sie die erforderlichen Rechte haben, und beachten Sie die Rechte erkennbarer Dritter.",
        "Im regulären Onboarding ist mindestens ein Foto vorgesehen; das Profil erlaubt bis zu sechs Fotos. Die App erzeugt verkleinerte Fassungen und Vorschaubilder für die Anzeige. Eine Identitäts- oder Fotoverifikation wird durch den Upload allein nicht bestätigt.",
        "Die derzeitige Fotoablage ist öffentlich lesbar: Wer die Bildadresse kennt, kann das Bild ohne Anmeldung abrufen. Eine Blockierung entzieht diesen Zugriff nicht. Fotos dürfen daher keine Zugangsdaten, privaten Dokumente oder sonstigen Informationen enthalten, die Sie nicht auf diese Weise zugänglich machen möchten. Die weiteren Verarbeitungshinweise stehen in der Datenschutzerklärung.",
      ],
      links: [{ label: "Datenschutzerklärung — Sichtbarkeit und Verarbeitung", href: "/datenschutz" }],
    },
    {
      id: "community-rules", title: "6. Regeln für die Community",
      paragraphs: [
        "Die folgenden Regeln gelten für Profile, Bilder, Nachrichten, Korrekturen und sonstige Beiträge. Die angegebenen Meldegründe entsprechen den derzeitigen englischen Bezeichnungen im App-Menü. Sie können den Sachverhalt im Freitext erläutern; eine Auswahl allein legt das Ergebnis einer Prüfung nicht fest.",
      ],
      rules: [
        { id: "harassment", title: "Keine Belästigung oder Drohungen", description: "Unterlassen Sie Einschüchterung, Stalking, persönliche Angriffe und wiederholte unerwünschte Kontaktversuche. Respektieren Sie ein Nein, ausbleibende Antworten und Blockierungen. Sprachliche Korrekturen müssen respektvoll bleiben.", reportReasons: ["harassment"] },
        { id: "hate", title: "Kein Hass und keine diskriminierenden Angriffe", description: "Untersagt sind abwertende oder gewaltbefürwortende Angriffe insbesondere wegen Herkunft, Religion, Geschlecht, sexueller Orientierung, Behinderung oder der Sprache, die jemand lernt.", reportReasons: ["harassment", "inappropriate_content"] },
        { id: "sexual-content", title: "Keine Nacktheit oder sexuellen Inhalte", description: "Nacktbilder, pornografische oder sexuelle Fotos und Nachrichten sowie Darstellungen sexueller Ausbeutung sind untersagt. Das gilt auch bei angegebener Dating-Absicht. Veröffentlichen Sie keine gewaltverherrlichenden oder sonstigen rechtswidrigen Inhalte.", reportReasons: ["inappropriate_content"] },
        { id: "scams", title: "Kein Betrug", description: "Täuschungen zur Erlangung von Geld, Zugangsdaten oder persönlichen Informationen, Phishing und betrügerische Angebote sind untersagt. Fordern Sie andere nicht zur Überweisung von Geld auf.", reportReasons: ["spam"] },
        { id: "minors", title: "Keine Nutzung durch Minderjährige", description: "Personen unter 18 Jahren dürfen kein Konto nutzen. Die Anbahnung sexueller Kontakte mit Minderjährigen und Inhalte, die ihren Missbrauch fördern oder darstellen, sind ausnahmslos untersagt. Melden Sie einen begründeten Verdacht.", reportReasons: ["underage", "inappropriate_content"] },
        { id: "impersonation", title: "Keine Identitätstäuschung", description: "Untersagt sind Fake-Profile, gestohlene Profilbilder und das Ausgeben als andere Personen, öffentliche Persönlichkeiten oder Unternehmen. Täuschen Sie keine Identität oder Verifikation vor.", reportReasons: ["fake_profile"] },
        { id: "spam", title: "Kein Spam", description: "Versenden Sie keine massenhaften, wiederholten oder automatisierten unerwünschten Nachrichten. Untersagt sind auch Konten oder Abläufe, die allein künstliche Interaktionen oder XP erzeugen sollen.", reportReasons: ["spam", "other"] },
        { id: "commercial-solicitation", title: "Keine kommerzielle Kontaktwerbung", description: "Nutzen Sie Profile oder Chats nicht für Werbung, Verkaufsangebote, Kundengewinnung oder die Anwerbung für kommerzielle Dienstleistungen. Der Dienst ist für persönlichen Sprachaustausch und Kontakt bestimmt.", reportReasons: ["spam"] },
        { id: "third-party-rights", title: "Rechte anderer wahren", description: "Veröffentlichen Sie keine fremden vertraulichen Angaben und keine Inhalte, deren Nutzung Urheber-, Bildnis- oder sonstige Rechte verletzt. Melden Sie auch Verstöße, die keiner spezielleren Kategorie entsprechen.", reportReasons: ["other"] },
      ],
    },
    {
      id: "user-content", title: "7. Ihre Inhalte und die erforderlichen Nutzungsrechte",
      paragraphs: [
        "Ihre Rechte an hochgeladenen Fotos, Profiltexten, Nachrichten und eigenen Korrekturen verbleiben bei Ihnen bzw. den jeweiligen Rechteinhabern. Diese Bedingungen übertragen kein Eigentum an Ihren Inhalten.",
        "Soweit die Bedingungen wirksam vereinbart werden, räumen Sie dem Anbieter ein einfaches, nicht ausschließliches und unentgeltliches Nutzungsrecht ein, soweit es zur Bereitstellung der von Ihnen gewählten Funktionen erforderlich ist: Inhalte speichern, technisch übertragen, für die vorgesehenen Empfänger anzeigen und Fotos in Anzeige- und Vorschaubildgrößen umwandeln. Technische Dienstleister dürfen hierfür im erforderlichen Umfang eingebunden werden. Eine Verwendung Ihrer Inhalte für eigenständige Werbekampagnen ist von diesem Zweck nicht umfasst.",
        "Die Einräumung gilt nur für die erforderliche Dauer und den erforderlichen Umfang des Dienstbetriebs. Nach Beendigung der Nutzung dürfen Inhalte nur fortbestehen, soweit dafür ein rechtmäßiger Grund vorliegt; dies ist keine unbegrenzte Weiterverwendungserlaubnis. Bereits von anderen kopierte Inhalte lassen sich dadurch nicht zurückholen. Die Speicher- und Löschfragen werden in der Datenschutzerklärung erläutert.",
        "Veröffentlichen Sie nur Inhalte, für die Sie ausreichende Rechte haben. Die rechtliche Prüfung muss die Lizenz an die konkreten Nutzungsarten, den technischen Datenfluss und das Löschverfahren anpassen. Eine pauschale Freistellung des Anbieters von sämtlichen Ansprüchen Dritter wird nicht vereinbart.",
      ],
      gap: "Der Umfang der Nutzungsrechte und ihre Beendigung sind vor Freigabe rechtlich zu prüfen. Diese Vertragsklausel schafft keine datenschutzrechtliche Einwilligung und ersetzt keinen zulässigen Verarbeitungszweck.",
      links: [{ label: "§ 31 UrhG — Nutzungsrechte", href: sources.copyright }, { label: "Datenschutzerklärung — Speicherung und Löschung", href: "/datenschutz#retention" }],
    },
    {
      id: "learning-rewards", title: "8. Korrekturen, Lernen, XP und Lizenzen",
      paragraphs: [
        "Korrekturen durch andere Nutzer und automatisch bewertete Übungen unterstützen das Lernen. Sie können sachliche Fehler enthalten und sind kein amtlicher Sprachnachweis. Sie sind für einen respektvollen Umgang mit eigenen und fremden Korrekturen verantwortlich.",
        "Die App berechnet XP, Level, Serien und Ranglisten aus Lern- und Nutzungsereignissen. Die Liga-Anzeigen Bronze, Silber und Gold richten sich derzeit nach dem Level. Diese Anzeigen sind Fortschrittsmerkmale; sie sind kein Zahlungsmittel und begründen keinen Anspruch auf Geld-, Sachpreise oder ein Sprachzertifikat. Das künstliche Erzeugen von Lernereignissen oder die Umgehung der Punktevergabe ist unzulässig.",
        "Lerntexte und Referenzdaten können von Dritten stammen und unter eigenen Lizenzen stehen. Die Seite „Licenses & attributions“ nennt Quellen und Lizenzhinweise. Rechte, die Ihnen diese Lizenzen ausdrücklich gewähren, werden durch diese Bedingungen nicht eingeschränkt; die jeweiligen Lizenzbedingungen bleiben maßgeblich.",
      ],
      links: [{ label: "Licenses & attributions — Quellen und Lizenzbedingungen", href: "/licenses" }],
    },
    {
      id: "reporting-moderation", title: "9. Melden, Blockieren und Bearbeitung",
      paragraphs: [
        "Im Chat finden Sie über das Menü mit den drei Punkten die Funktionen zum Melden und Blockieren. Wählen Sie den passenden Grund und beschreiben Sie bei Bedarf den Vorfall. Der derzeitige Meldevorgang speichert die Meldung mit Bezug zum betroffenen Konto und zur Unterhaltung. Eine Eingangsbestätigung in der Oberfläche bedeutet noch keine inhaltliche Entscheidung.",
        "Ist keine passende Meldefunktion erreichbar, etwa bei einem noch nicht gematchten Profil in Entdecken, wenden Sie sich an den Anbieter über die Kontaktdaten in Abschnitt 1. Benennen Sie das betroffene Profil und den Sachverhalt mit den Ihnen verfügbaren Angaben. Übermitteln Sie keine unnötigen sensiblen Daten oder Zugangsdaten.",
        "Blockieren beendet das aktive Match und verhindert weitere Nachrichten in dieser Unterhaltung. Profile werden in Entdecken und der Rangliste gegenseitig ausgeblendet. Gespeicherte Nachrichten werden dadurch nicht gelöscht; bekannte öffentliche Foto-URLs bleiben abrufbar. Blockierungen können Sie unter „Profile → Settings“ wieder aufheben; daraus folgt keine automatische Wiederaufnahme einer beendeten Unterhaltung.",
        "Hinweise auf Minderjährige, sexuelle Ausbeutung oder konkrete Gefährdungen benötigen eine besonders dringliche Prüfung. Der Dienst ist kein Notrufkanal. Wenden Sie sich bei unmittelbarer Gefahr an die örtlichen Notfalldienste. Gesetzliche Pflichten für Meldungen, Begründungen und Rechtsschutz bleiben unberührt, soweit sie für diesen Dienst gelten.",
      ],
      gap: "Ein tatsächlich betriebener Moderationsprozess, die Rückmeldung an Beteiligte und eine verlässlich erreichbare übliche Bearbeitungszeit sind noch zu bestätigen. Der Entwurf verspricht keine Prüfung jeder Meldung innerhalb von 24 Stunden. Anwendbarkeit und Umsetzung des Digital Services Act sind rechtlich zu prüfen.",
      links: [{ label: "Digital Services Act — insbesondere Art. 14, 16 und 17", href: sources.dsa }],
    },
    {
      id: "suspension-termination", title: "10. Maßnahmen, Sperrung und Vertragsbeendigung",
      paragraphs: [
        "Bei einem nachvollziehbaren Regelverstoß oder einer erforderlichen Gefahrenabwehr kommen nach rechtlicher Prüfung angemessene Maßnahmen in Betracht: Hinweis oder Verwarnung, Einschränkung betroffener Inhalte bzw. Funktionen, vorläufige Sperrung oder Beendigung des Kontos. Maßgeblich sind die Umstände, Schwere und Wiederholung des Verstoßes sowie die berechtigten Interessen der Beteiligten. Eine Meldung allein ersetzt keine sachliche Prüfung.",
        "Soweit gesetzlich erforderlich, sind Gründe und verfügbare Möglichkeiten zur Überprüfung mitzuteilen. Sie können eine beanstandete Maßnahme über den Kontakt in Abschnitt 1 zur Überprüfung vorlegen. Die Entscheidung darf nicht allein deshalb unangreifbar sein, weil sie als Moderationsmaßnahme bezeichnet wird.",
        "Gesetzliche Rechte zur Beendigung eines Dauerschuldverhältnisses aus wichtigem Grund bleiben bestehen. Eine willkürliche, voraussetzungslose Kündigung durch den Anbieter wird hier nicht vereinbart. Angemessene Abhilfe- oder Anhörungsmöglichkeiten und etwaige Ausnahmen bei dringender Gefährdung müssen am geltenden Recht gemessen werden.",
      ],
      gap: "Die Kontozustände aktiv, gesperrt und gelöscht sind im Datenmodell vorgesehen. Eine gesperrte Person wird derzeit aus Profilvorschlägen ausgeblendet; eine lückenlose Unterbindung aller eigenen Aktionen ist noch nicht umgesetzt. Das vollständige Verfahren für Sperrung, Begründung, Überprüfung und Wiederherstellung ist vor Freigabe festzulegen. Eine Sperrung bedeutet keine Datenlöschung.",
      links: [{ label: "§ 314 BGB — Kündigung aus wichtigem Grund", href: sources.termination }, { label: "§ 307 BGB — angemessene Vertragsbedingungen", href: sources.agbFairness }],
    },
    {
      id: "account-deletion", title: "11. Nutzung beenden und Konto löschen",
      paragraphs: [
        "Sie können die Nutzung einstellen und den Anbieter über die in Abschnitt 1 genannten Kontaktdaten um Beendigung Ihres Kontos bzw. Löschung Ihrer personenbezogenen Daten bitten. Abmelden unter „Profile → Settings“ beendet Ihre Sitzung, löscht aber nicht das Konto. Auch das Entfernen eines Fotos ist keine vollständige Kontolöschung.",
        "In den derzeitigen Einstellungen besteht noch keine selbst bedienbare Funktion zum vollständigen Löschen oder Herunterladen aller Kontodaten. Der Anbieter muss Anträge nach den jeweils geltenden gesetzlichen Voraussetzungen bearbeiten. Erforderliche Identitätsprüfungen, zulässige Aufbewahrung und die Rechte anderer Personen sind dabei zu berücksichtigen; eine pauschale Verpflichtung zur unbegrenzten Aufbewahrung wird nicht behauptet.",
      ],
      gap: "Der vollständige Lösch- und Exportprozess einschließlich Dateien und Backups ist noch umzusetzen. Konkrete Bearbeitungs- und Speicherfristen ergeben sich aus der Datenschutzerklärung bzw. dem noch zu bestätigenden Löschkonzept, nicht aus einem erfundenen automatischen Ablauf.",
      links: [{ label: "Datenschutzerklärung — Löschung und Betroffenenrechte", href: "/datenschutz#rights" }],
    },
    {
      id: "availability-changes", title: "12. Verfügbarkeit und Änderungen des Dienstes",
      paragraphs: [
        "Wartung, technische Störungen und die Verfügbarkeit beteiligter Dienste können die Nutzung beeinträchtigen. Die App bietet keinen gesondert zugesagten Bereitschafts- oder Notfalldienst. Solche Hinweise begrenzen nicht die Leistungspflichten und gesetzlichen Ansprüche aus einem wirksam geschlossenen Vertrag.",
        "Wesentliche Änderungen des vereinbarten Dienstes setzen eine tragfähige vertragliche oder gesetzliche Grundlage voraus. Soweit die Vorschriften über digitale Produkte anwendbar sind, bleiben insbesondere deren Anforderungen an Änderungen, Information und Vertragsbeendigung unberührt. Ein uneingeschränktes Recht des Anbieters, zugesagte Leistungen jederzeit zu streichen, wird nicht vorgesehen.",
        "Nach eigener Angabe betreibt der Anbieter das Projekt allein als Hobby und erhebt derzeit kein Nutzungsentgelt. Der geprüfte App-Stand enthält keinen Kauf-, Abonnement- oder Zahlungsablauf. Ein künftiges kostenpflichtiges Angebot bedarf eigener transparenter Vereinbarungen und der erforderlichen Verbraucherinformationen; dieser Entwurf führt kein Entgelt ein.",
      ],
      gap: "Vertragsart, Anwendbarkeit der Regeln über digitale Produkte auch bei Bereitstellung personenbezogener Daten, gegebenenfalls Widerrufs- und weitere Verbraucherinformationen sowie Änderungsverfahren sind vor Freigabe rechtlich zu prüfen. Hobbybetrieb und fehlendes Entgelt entscheiden diese Fragen nicht allein.",
      links: [{ label: "§ 327 BGB — digitale Produkte", href: sources.digitalProducts }, { label: "§ 327r BGB — Änderungen digitaler Produkte", href: sources.serviceChanges }],
    },
    {
      id: "liability", title: "13. Haftung und gesetzliche Ansprüche",
      paragraphs: [
        "Für die Haftung des Anbieters gelten die gesetzlichen Vorschriften. Dieser Entwurf enthält keine zusätzliche Haftungsbegrenzung, keinen pauschalen Gewährleistungsausschluss und keine Haftungshöchstgrenze.",
        "Ansprüche insbesondere wegen vorsätzlicher oder grob fahrlässiger Pflichtverletzungen sowie wegen Verletzungen von Leben, Körper oder Gesundheit bleiben unberührt. Ebenso bleiben gesetzliche Ansprüche bei mangelhaften digitalen Leistungen und sonstige zwingende Rechte bestehen. Die Verantwortung für eigene Handlungen beurteilt sich nach dem geltenden Recht.",
        "Die Beschreibung von Matching, Lernhilfen oder technischen Grenzen in diesen Bedingungen darf nicht als pauschaler Ausschluss gesetzlicher Verantwortlichkeit ausgelegt werden. Bei einer späteren Änderung dieses Abschnitts sind die Anforderungen der §§ 305 ff. BGB, insbesondere §§ 307 und 309, einzuhalten.",
      ],
      gap: "Dieser Abschnitt ist ausdrücklich von einer qualifizierten rechtlichen Prüfung freizugeben. Eine später gewünschte Haftungsbeschränkung darf nicht ohne erneute AGB- und Verbraucherrechtsprüfung ergänzt werden.",
      links: [{ label: "§ 307 BGB — Inhaltskontrolle", href: sources.agbFairness }, { label: "§ 309 Nr. 7 BGB — Haftungsklauseln", href: sources.liability }],
    },
    {
      id: "terms-changes", title: "14. Änderungen dieser Bedingungen",
      paragraphs: [
        "Jede veröffentlichte Fassung trägt eine Versionsnummer und einen Bearbeitungsstand. Änderungen des Vertragstexts sind von Änderungen der App-Funktionen zu unterscheiden. Ein neuer Text gilt für bestehende Verträge nicht automatisch allein deshalb, weil er auf dieser Seite erscheint.",
        "Wesentliche Änderungen müssen Ihnen in geeigneter Form mitgeteilt und nach den gesetzlichen Voraussetzungen vereinbart werden. Eine erforderliche Zustimmung ist gesondert einzuholen. Schweigen oder bloße weitere Nutzung werden in diesem Entwurf nicht pauschal als Zustimmung fingiert. Gesetzliche Informations-, Kündigungs- und sonstige Schutzrechte bleiben bestehen.",
      ],
      gap: "Das Verfahren zur Mitteilung, Zustimmung und Dokumentation von Änderungen ist noch umzusetzen. Die sichtbare Entwurfskennzeichnung wird erst nach der notwendigen Prüfung und Freigabe entfernt.",
      links: [{ label: "§§ 305 und 307 BGB — Einbeziehung und Kontrolle", href: sources.agbInclusion }],
    },
    {
      id: "law-venue", title: "15. Anwendbares Recht und Gerichtsstand",
      paragraphs: [
        "Für den Nutzungsvertrag ist deutsches Recht vorgesehen, soweit eine solche Rechtswahl wirksam vereinbart werden kann. Sind Sie Verbraucher, darf Ihnen die Rechtswahl den Schutz der zwingenden Bestimmungen nicht entziehen, die ohne Rechtswahl nach dem anwendbaren Recht gelten; insbesondere sind die Voraussetzungen des Art. 6 der Rom-I-Verordnung zu beachten.",
        "Die gerichtliche Zuständigkeit richtet sich nach den geltenden gesetzlichen Vorschriften einschließlich anwendbarer Verbrauchergerichtsstände. Es wird kein ausschließlicher Gerichtsstand vereinbart, der zwingende Schutzvorschriften verdrängt. Außergerichtliche Beschwerdemöglichkeiten schränken den Zugang zu Gerichten nicht ein.",
        "Die deutsche Fassung ist die primär verfasste Ausgabe; die englische beschreibt denselben Entwurf. Diese redaktionelle Reihenfolge schränkt keine zwingenden Rechte oder Anforderungen an verständliche Vertragsinformationen ein.",
      ],
      gap: "Rechtswahl und internationale Zuständigkeit sind anhand des tatsächlichen Angebots und der angesprochenen Nutzergruppen rechtlich zu prüfen.",
      links: [{ label: "Rom-I-Verordnung — Art. 6, Verbraucherverträge", href: sources.romeI }, { label: "Brüssel-Ia-Verordnung — Verbrauchergerichtsstände", href: sources.jurisdiction }],
    },
    {
      id: "consumer-disputes", title: "16. Verbraucherstreitbeilegung und frühere EU-OS-Plattform",
      paragraphs: [
        "Die frühere Europäische Plattform zur Online-Streitbeilegung wurde eingestellt. Die Verordnung (EU) Nr. 524/2013 wurde mit Wirkung zum 20. Juli 2025 durch die Verordnung (EU) 2024/3228 aufgehoben. Eine Teilnahme oder Beschwerde über diese frühere Plattform wird daher nicht als verfügbarer Weg angeboten.",
        "Hiervon zu unterscheiden sind die deutschen Informationspflichten nach §§ 36 und 37 VSBG. Der Anbieter bezeichnet das Projekt als unentgeltliches, allein betriebenes Hobby ohne bestehendes Unternehmen. Ob er rechtlich als Unternehmer einzuordnen ist, welche tatsächlichen Verhältnisse am 31. Dezember 2025 maßgeblich waren und ob eine Bereitschaft oder Pflicht zur Teilnahme besteht, ist noch zu klären. Diese Beschreibung begründet weder eine bestätigte Ausnahme noch eine Teilnahmezusage.",
        "Kann eine Streitigkeit aus einem Verbrauchervertrag nicht beigelegt werden, sind die anwendbaren Informationspflichten nach § 37 VSBG zu beachten, einschließlich des Hinweises in Textform auf die zuständige Stelle und der Erklärung zur Teilnahme. Eine offene Angabe in diesem Entwurf ersetzt diesen individuellen Hinweis nicht.",
      ],
      gap: "Noch zu bestätigen: rechtliche Anbieterstellung, maßgebliche Beschäftigtenzahl und weitere Voraussetzungen für § 36 VSBG sowie Bereitschaft bzw. bestehende Verpflichtung zur Verbraucherschlichtung. Gegebenenfalls ist die zuständige Stelle mit Anschrift und Website zu nennen. Es wird keine unbelegte Erklärung „nicht bereit und nicht verpflichtet“ eingesetzt.",
      links: [{ label: "Verordnung (EU) 2024/3228 — Einstellung der OS-Plattform", href: sources.odrRepeal }, { label: "§ 36 VSBG — allgemeine Informationspflichten", href: sources.vsbg36 }, { label: "§ 37 VSBG — Informationen nach Entstehen einer Streitigkeit", href: sources.vsbg37 }],
    },
    {
      id: "contact", title: "17. Kontakt und weitere Informationen",
      paragraphs: [
        "Fragen zum Dienst, Hinweise auf Regelverstöße und Einwände gegen eine Maßnahme können Sie per E-Mail oder Post an den Anbieter in Abschnitt 1 richten. Nennen Sie die für Ihr Anliegen erforderlichen Informationen; senden Sie keine Passwörter, Bestätigungscodes oder unnötigen sensiblen Daten.",
        "Datenschutzanfragen, Löschung und Datenübertragbarkeit sind in der Datenschutzerklärung näher erläutert. Für Lerninhalte finden Sie die jeweiligen Quellen und Lizenzbedingungen unter „Licenses & attributions“.",
      ],
      links: [{ label: "Zum Anbieter und den Kontaktdaten", href: "#provider" }, { label: "Datenschutzerklärung", href: "/datenschutz" }, { label: "Licenses & attributions", href: "/licenses" }],
    },
  ],
};
