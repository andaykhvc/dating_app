import type { TermsPolicy } from "./types";
import { TERMS_LAST_UPDATED, TERMS_SOURCES as sources, TERMS_VERSION } from "./terms.config.ts";

/** English companion edition; keep the German edition's scope and safeguards. */
export const termsEn: TermsPolicy = {
  kind: "terms",
  language: "en",
  title: "Terms of Service",
  description: "Draft terms for Lingua Match: language exchange, community rules, your content and your rights.",
  version: TERMS_VERSION,
  lastUpdated: TERMS_LAST_UPDATED,
  intro: "Lingua Match helps adults practise languages, learn together and meet people. These draft terms describe the intended rules for the website, installable web app and Android app that opens the same website. They reflect the implementation reviewed on 8 October 2026 and await legal approval.",
  summary: [
    "You must be at least 18 and use one personal account. Your details and photos must not mislead people about who you are.",
    "Language exchange comes first. Dating is optional; selecting it does not replace mutual interest or consent to sexual contact.",
    "Harassment, hate, sexual content, scams, impersonation, spam and commercial solicitation are prohibited.",
    "You keep your rights in your content. The service needs only the permissions necessary for the features you use; profile photos currently remain accessible to anyone who knows their image URL.",
    "Report or block someone in chat, or contact the provider. Reliable moderation timelines and complete suspension controls still need confirmation. Your statutory rights remain intact.",
  ],
  sections: [
    {
      id: "provider", title: "1. Provider, scope and agreement",
      paragraphs: [
        "The person identified below provides the service. Lingua Match is the product name, not a separate legal entity. The provider describes the project as a hobby run alone and currently charges no usage fee. This describes its operation; it does not settle its legal classification. These terms are intended to govern use once legally approved and validly agreed.",
        "Publishing or linking this draft does not by itself make every clause binding. German rules on Allgemeine Geschäftsbedingungen (AGB, standard contract terms), including §§ 305 ff. BGB, govern how terms are incorporated. Contract formation, a timely opportunity to read the terms and any necessary evidence of agreement require separate implementation and review.",
      ],
      gap: "Legal approval, contract formation and a versioned acceptance record are outstanding. Registration does not yet record acceptance of this edition. Privacy consent is a separate matter. Whether the provider is legally an Unternehmer must be assessed; calling the project a hobby or charging no fee does not decide this.",
      links: [{ label: "§ 305 BGB — incorporation of standard terms", href: sources.agbInclusion }, { label: "§ 14 BGB — Unternehmer (professional/business status)", href: sources.providerStatus }],
    },
    {
      id: "eligibility", title: "2. Adults only; one personal account",
      paragraphs: [
        "You must be 18 or older. Enter your actual date of birth and confirm your age truthfully. Use “Appears to be under 18” to report a suspected underage account, or contact the provider identified in section 1.",
        "Use one personal account and do not share it with another person. Extra accounts to evade a block or suspension are prohibited. This rule does not mean the app currently prevents every duplicate account through verified identity checks.",
        "The app checks the submitted age and adult confirmation when a profile is completed. It does not currently verify official identity or age documents. Parental permission does not make an under-18 account eligible under these draft participation rules.",
      ],
    },
    {
      id: "account-security", title: "3. Your account and access security",
      paragraphs: [
        "Provide accurate sign-in details and an email address you can access. Protect the credentials for your chosen sign-in method. Do not share passwords or verification codes. Contact the provider if you suspect someone has accessed your account without permission.",
        "Responsibility for account activity depends on the circumstances and applicable law. Activity under your account identifier alone does not make you automatically liable for everything a third party does.",
        "Do not bypass safeguards, access other people's accounts or disrupt the service through abusive automated requests or manipulation. When reporting a security problem, send only the information needed to investigate and never someone else's credentials.",
      ],
    },
    {
      id: "service", title: "4. Language exchange, matching and optional dating",
      paragraphs: [
        "You can look for language partners, friendship and cultural exchange. Suggestions take account of languages, age and country preferences, and previous like/pass choices, among other factors. Mutual likes create a match with chat, conversation missions and language corrections.",
        "A dating intention appears only when you choose “Open to Dating”. It is optional for language exchange and can be changed in your profile. A setting lets you hide profiles with a dating intention in Discover. This choice is neither explicit privacy consent for sensitive data nor consent to sexual messages or an in-person meeting.",
        "The app does not promise a particular number of suggestions or matches, a learning outcome or a relationship. Respect other people's boundaries. This does not limit statutory rights concerning the service's agreed characteristics.",
      ],
    },
    {
      id: "profiles-photos", title: "5. Profiles and photos",
      paragraphs: [
        "Use your own first name and accurate profile details. Profile photos must show you. Do not pretend to be someone else, a public figure or a business. Upload only images you have the necessary rights to use, and respect the rights of other people shown in them.",
        "The regular onboarding flow expects at least one photo; a profile supports up to six. The app creates smaller display images and thumbnails. Uploading a photo does not establish verified identity or photo authenticity.",
        "Photo storage is currently publicly readable: anyone with an image URL can access it without signing in. Blocking someone does not revoke that access. Do not include credentials, private documents or information you would not want accessible this way. The privacy notice explains the related processing.",
      ],
      links: [{ label: "Privacy notice — visibility and processing", href: "/privacy" }],
    },
    {
      id: "community-rules", title: "6. Community rules",
      paragraphs: [
        "These rules apply to profiles, photos, messages, corrections and other contributions. The report reasons below use the actual labels in the app menu. Add details when useful; selecting a reason does not determine the outcome of a review.",
      ],
      rules: [
        { id: "harassment", title: "No harassment or threats", description: "Do not intimidate, stalk, attack or repeatedly contact someone who does not want contact. Respect a refusal, unanswered messages and blocks. Keep language corrections respectful.", reportReasons: ["harassment"] },
        { id: "hate", title: "No hate or discriminatory attacks", description: "Do not degrade people or encourage violence against them, including on grounds of origin, religion, gender, sexual orientation, disability or the language they are learning.", reportReasons: ["harassment", "inappropriate_content"] },
        { id: "sexual-content", title: "No nudity or sexual content", description: "Nude, pornographic or sexual photos and messages, and depictions of sexual exploitation, are prohibited even with a dating intention. Do not post content glorifying violence or other unlawful material.", reportReasons: ["inappropriate_content"] },
        { id: "scams", title: "No scams", description: "Do not deceive people to obtain money, credentials or personal information, send phishing requests or make fraudulent offers. Do not ask other users to transfer money.", reportReasons: ["spam"] },
        { id: "minors", title: "No underage accounts", description: "People under 18 may not use an account. Sexual approaches to minors and material promoting or depicting their abuse are prohibited without exception. Report a well-founded concern.", reportReasons: ["underage", "inappropriate_content"] },
        { id: "impersonation", title: "No impersonation", description: "Do not create fake profiles, use stolen profile photos or impersonate other people, public figures or businesses. Do not claim an identity or verification you do not have.", reportReasons: ["fake_profile"] },
        { id: "spam", title: "No spam", description: "Do not send mass, repetitive or automated unwanted messages. Accounts and processes created solely to generate artificial interactions or XP are prohibited.", reportReasons: ["spam", "other"] },
        { id: "commercial-solicitation", title: "No commercial solicitation", description: "Do not use profiles or chat for advertising, sales, finding customers or recruiting people for commercial services. The service is for personal language exchange and connections.", reportReasons: ["spam"] },
        { id: "third-party-rights", title: "Respect other people's rights", description: "Do not share someone else's confidential information or content that infringes copyright, image rights or other rights. Report violations that do not fit a more specific reason as well.", reportReasons: ["other"] },
      ],
    },
    {
      id: "user-content", title: "7. Your content and the permissions the service needs",
      paragraphs: [
        "You and the relevant rights holders retain your rights in uploaded photos, profile text, messages and original corrections. These terms do not transfer ownership of your content.",
        "If validly agreed, these terms grant the provider a non-exclusive, no-fee permission only as needed to deliver the features you choose: storing and transmitting content, displaying it to its intended recipients, and resizing photos for display and thumbnails. Technical providers may assist only to the extent necessary. This permission does not cover independent advertising campaigns using your content.",
        "The permission lasts only for the time and scope needed to operate the service. Content may remain after use ends only where there is a lawful reason; this is not an unlimited right to reuse it. It cannot recall copies other people already made. The privacy notice explains retention and deletion.",
        "Share only content you have sufficient rights to use. Legal review must match this permission to the actual uses, data flows and deletion process. These terms do not impose a blanket obligation to indemnify the provider against every third-party claim.",
      ],
      gap: "The licence scope and its ending require legal review before approval. This contract provision does not create privacy consent or replace a lawful processing purpose.",
      links: [{ label: "§ 31 UrhG — Nutzungsrechte (rights of use)", href: sources.copyright }, { label: "Privacy notice — retention and deletion", href: "/privacy#retention" }],
    },
    {
      id: "learning-rewards", title: "8. Corrections, learning, XP and licences",
      paragraphs: [
        "Corrections from other users and automatically scored exercises support learning. They can be wrong and are not official proof of language proficiency. Treat your own and other people's corrections respectfully.",
        "XP, levels, streaks and rankings reflect learning and activity events. Bronze, Silver and Gold league labels currently depend on level. They show progress, are not a currency and confer no entitlement to cash, prizes or a language certificate. Do not manufacture learning events or bypass point-awarding rules.",
        "Learning texts and reference data may come from third parties under their own licences. “Licenses & attributions” lists sources and notices. These terms do not narrow rights those licences expressly grant you; their own conditions continue to apply.",
      ],
      links: [{ label: "Licenses & attributions — sources and licence conditions", href: "/licenses" }],
    },
    {
      id: "reporting-moderation", title: "9. Reporting, blocking and review",
      paragraphs: [
        "Open the three-dot menu in chat to report or block someone. Choose the relevant reason and describe the incident if needed. Reporting currently saves a report linked to the account and conversation. The on-screen acknowledgement confirms receipt, not a substantive decision.",
        "If a report control is unavailable, including for an unmatched profile in Discover, contact the provider using section 1. Identify the profile and incident using the information available to you. Do not send unnecessary sensitive data or credentials.",
        "Blocking ends the active match and prevents further messages in that conversation. Profiles are hidden from each other in Discover and rankings. Stored messages are not deleted, and known public photo URLs remain accessible. You can unblock someone in “Profile → Settings”; this does not automatically restore an ended conversation.",
        "Reports involving minors, sexual exploitation or a specific threat need particular urgency. This service is not an emergency channel; contact local emergency services for immediate danger. Applicable statutory reporting, reasoning and remedy duties remain intact.",
      ],
      gap: "An actively operated moderation process, feedback to the people involved and a reliable usual response time still need confirmation. This draft does not promise that every report will be reviewed within 24 hours. Digital Services Act applicability and implementation require legal assessment.",
      links: [{ label: "Digital Services Act — particularly Articles 14, 16 and 17", href: sources.dsa }],
    },
    {
      id: "suspension-termination", title: "10. Restrictions, suspension and termination",
      paragraphs: [
        "Following legal review, a substantiated rule violation or necessary protective intervention may justify proportionate action: a reminder or warning, a restriction on relevant content or features, temporary suspension or account termination. The circumstances, seriousness, repetition and legitimate interests of those involved matter. A report alone is not evidence of a violation.",
        "Reasons and available review options must be provided where the law requires them. You can ask the provider in section 1 to review a disputed measure. Calling an action moderation does not make it immune from challenge.",
        "Statutory rights to end a continuing contractual relationship for an important reason (wichtiger Grund) remain available. These terms do not grant the provider an arbitrary, unconditional right to terminate. Appropriate opportunities to remedy a problem or be heard, and exceptions for urgent threats, must comply with applicable law.",
      ],
      gap: "The data model includes active, suspended and deleted states. A suspended account is currently hidden from profile suggestions, but complete prevention of all its own actions is not implemented. Suspension, reasons, review and restoration procedures must be settled before approval. Suspension does not delete data.",
      links: [{ label: "§ 314 BGB — termination for an important reason", href: sources.termination }, { label: "§ 307 BGB — fairness of standard terms", href: sources.agbFairness }],
    },
    {
      id: "account-deletion", title: "11. Stopping use and deleting your account",
      paragraphs: [
        "You can stop using the service and ask the provider in section 1 to end your account or erase your personal data. Signing out in “Profile → Settings” ends your session but does not delete the account. Removing a photo does not delete the whole account either.",
        "Settings currently have no self-service control for complete account deletion or export. Requests must be handled under the applicable legal conditions, taking account of necessary identity checks, lawful retention and other people's rights. These terms do not claim a blanket requirement to keep data indefinitely.",
      ],
      gap: "The full deletion and export process, including files and backups, still needs implementation. Any concrete handling and retention periods must follow the privacy notice and a confirmed deletion plan, not an invented automated process.",
      links: [{ label: "Privacy notice — erasure and individual rights", href: "/privacy#rights" }],
    },
    {
      id: "availability-changes", title: "12. Availability and service changes",
      paragraphs: [
        "Maintenance, technical faults and the availability of supporting services can affect access. This does not waive the provider's statutory duties concerning an agreed service. No blanket promise of uninterrupted access or blanket exclusion of defect rights is made.",
        "Service changes require a lawful basis and must preserve applicable consumer rights. Where German rules for digital products apply, their requirements concerning changes, information and rights to end the contract remain intact. This draft gives no unrestricted power to withdraw an agreed service.",
        "The provider currently runs this project alone as a hobby and charges no usage fee. The reviewed app has no purchase or subscription flow. Any future paid offer would need its own clear pricing, contract information and lawful agreement; these terms do not introduce a charge.",
      ],
      gap: "Before approval, assess contract classification and whether digital-product rules, consumer information and withdrawal rights apply, including where personal data is supplied. A hobby label or the absence of payment alone does not settle these questions.",
      links: [{ label: "§ 327 BGB — scope of digital-product rules", href: sources.digitalProducts }, { label: "§ 327r BGB — changes to digital products", href: sources.serviceChanges }],
    },
    {
      id: "liability", title: "13. Liability and statutory rights",
      paragraphs: [
        "This draft adds no liability exclusion or cap. Liability is determined by applicable law; statutory rights and remedies remain intact.",
        "In particular, these terms do not exclude liability for intent, gross negligence or injury to life, body or health, and do not waive mandatory digital-product rights. Any later limitation would need a specific, transparent assessment under German AGB controls, including §§ 305 ff., 307 and 309 BGB.",
      ],
      gap: "Qualified German legal review is required before approval. Generic “as is”, “no liability” or fixed compensation caps must not be substituted for this clause without review.",
      links: [{ label: "§ 307 BGB — transparency and fairness", href: sources.agbFairness }, { label: "§ 309 BGB — prohibited standard clauses", href: sources.liability }],
    },
    {
      id: "terms-changes", title: "14. Changes to these terms",
      paragraphs: [
        "Each edition has a version and update date. Publishing a new edition does not automatically replace terms already agreed with you. A change requires the legally necessary notice, opportunity to review and, where required, agreement.",
        "Silence, continued browsing or a preselected option is not declared to be blanket consent. An acceptance record must distinguish terms agreement from privacy consent and identify the relevant version.",
      ],
      gap: "Change notices, versioned acceptance and any necessary renewed agreement still require implementation and legal review. The displayed version alone is not an acceptance record.",
      links: [{ label: "§ 305 BGB — agreement of standard terms", href: sources.agbInclusion }],
    },
    {
      id: "law-venue", title: "15. Applicable law, courts and language",
      paragraphs: [
        "German law is proposed where a choice of law can validly be agreed. It must not remove mandatory protections you would otherwise receive as a consumer, including under Article 6 of the Rome I Regulation where applicable.",
        "Court jurisdiction follows the applicable statutory rules, including consumer protections where they apply. These terms do not impose an exclusive Dresden court or require consumers to surrender an available home jurisdiction.",
        "The German edition is the primary editorial text and English is its companion. This does not restrict mandatory language, transparency or consumer rights. Differences between editions must be corrected before approval.",
      ],
      gap: "Choice of law, jurisdiction and the effect of both language editions require legal review for the actual provider status and countries served.",
      links: [{ label: "Rome I Regulation — Article 6", href: sources.romeI }, { label: "Brussels I bis Regulation — Articles 17–19", href: sources.jurisdiction }],
    },
    {
      id: "consumer-disputes", title: "16. Consumer dispute resolution",
      paragraphs: [
        "The EU Online Dispute Resolution (ODR) platform ceased operating on 20 July 2025. Regulation (EU) 2024/3228 repealed its former legal basis. This draft therefore does not link to the old platform as an available dispute-resolution service.",
        "German consumer-dispute information duties under the Verbraucherstreitbeilegungsgesetz (VSBG) are a separate question. The provider describes the project as an unpaid hobby run alone, without an established business. Whether the provider legally qualifies as an Unternehmer, the relevant facts on 31 December 2025, and any willingness or duty to participate still require clarification. This description does not establish an exemption or a commitment to participate.",
        "Where an unresolved consumer-contract dispute triggers § 37 VSBG, the applicable individual notice duties must be met, including information in text form about the competent body and participation. An open item in this draft does not replace that notice.",
      ],
      gap: "Confirm legal provider status, the relevant headcount and other facts for § 36 VSBG, and willingness or any duty to participate. If required, identify the competent body, address and website. No unconfirmed statement that the provider is unwilling and not obliged to participate has been inserted.",
      links: [{ label: "Regulation (EU) 2024/3228 — closure of the ODR platform", href: sources.odrRepeal }, { label: "§ 36 VSBG — general information duties", href: sources.vsbg36 }, { label: "§ 37 VSBG — information after a dispute arises", href: sources.vsbg37 }],
    },
    {
      id: "contact", title: "17. Contact and related information",
      paragraphs: [
        "Send service questions, reports of rule violations and requests to review a measure to the provider in section 1 by email or post. Include what is necessary for the request, without passwords, verification codes or unnecessary sensitive data.",
        "The privacy notice explains privacy requests, erasure and portability. “Licenses & attributions” lists sources and licence conditions for learning content.",
      ],
      links: [{ label: "Provider and contact details", href: "#provider" }, { label: "Privacy notice", href: "/privacy" }, { label: "Licenses & attributions", href: "/licenses" }],
    },
  ],
};
