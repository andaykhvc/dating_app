import type { PrivacyPolicy } from "./types";
import { PRIVACY_LAST_UPDATED, PRIVACY_SOURCES as sources, PRIVACY_VERSION } from "./privacy.config.ts";

/** Companion edition of the German-first Datenschutzerklärung. */
export const privacyEn: PrivacyPolicy = {
  kind: "privacy",
  language: "en",
  title: "Privacy Policy",
  description: "How Lingua Match processes personal data — English companion draft awaiting legal review.",
  version: PRIVACY_VERSION,
  lastUpdated: PRIVACY_LAST_UPDATED,
  intro: "This notice explains the personal data processed when you use Lingua Match, the purposes of that processing, and your rights. It covers the website, its installable web app, and the Android app that opens the same website. It reflects the features reviewed on 8 October 2026. The German Datenschutzerklärung is the primary editorial edition of this draft.",
  summary: [
    "Profile details help you find language partners. Being open to dating is an optional intention.",
    "Messages are available in the app to the participants in the relevant match. Profile photos can be accessed publicly through their image URLs.",
    "Exercise answers and progress support lessons, reviews, XP, and rankings.",
    "The reviewed app code has no advertising trackers, analytics SDKs, or Firebase push integration.",
    "Production infrastructure, retention rules, and consent for sensitive information must be completed before this notice is approved.",
  ],
  sections: [
    {
      id: "controller", title: "1. Controller and privacy contact",
      paragraphs: [
        "The controller (Verantwortlicher) under Article 4(7) GDPR is the person or organisation identified below, who determines why and how personal data is processed. Lingua Match is the product name, not a substitute for the controller's legal identity.",
        "Use the contact details below for privacy requests. Whether a data protection officer must be appointed, and their contact details where applicable, needs a separate assessment. An empty field does not mean that assessment has been completed.",
      ],
      gap: "The DPO appointment assessment and any required DPO contact details remain outstanding. Privacy requests can be sent by email or post using the contact details above.",
    },
    {
      id: "scope-sources", title: "2. Scope, minimum age, and sources of data",
      paragraphs: [
        "Lingua Match helps people find language partners, meet others, and practise languages. It is for adults aged 18 or over. Age entries are checked during registration and profile completion; the current app does not verify identity or age against an official document.",
        "Most information comes directly from you: account registration, profile entries, uploaded photos, messages, and exercise answers. Other users may provide information about you through corrections or reports about your conduct. Match dates, exercise results, and XP are generated as you use the service.",
        "If you choose a configured Google or Apple sign-in option, the provider supplies the identity information authorised for that login, such as a provider identifier and, where shared, an email address, name, or profile image. The actual fields depend on the provider's permissions and deployed configuration. We do not use public personal-data databases for ordinary account registration.",
      ],
      links: [{ label: "GDPR: Articles 13 and 14 — information and data sources", href: sources.gdpr }],
    },
    {
      id: "data-purposes", title: "3. Data categories and purposes",
      paragraphs: [
        "These activities are identified from the current code and database schema. Section 4 sets out the proposed legal bases for review; it does not substitute for consent or for implementing appropriate deletion and protection measures.",
      ],
      bullets: [
        "Accounts and authentication: email, internal user identifier, authentication records including a password hash for password sign-in, verification/session records, and any OAuth provider information. These enable account creation, email confirmation, and secure sign-in.",
        "Profiles and preferences: first name, date of birth, adult confirmation, city/country, biography, intentions, native/learning languages and self-assessed level, interests, and age/country preferences. These enable profile presentation and partner suggestions. Other users receive your calculated age, not your date of birth.",
        "Photos: uploaded images, resized versions and thumbnails, storage paths, order, and upload times. These illustrate profiles, discovery, matches, conversations, and rankings.",
        "Connections and communication: likes/passes, matches and their status, message sender/content/time and reply references, corrections and notes, and mission progress. These enable mutual contact and collaborative practice.",
        "Learning and progress: exercise/game sessions, submitted answers, grading results, completion times, review scheduling, concept/lesson progress, XP events, levels, streaks, and rankings. Selecting a learned phrase for a chat and using it are recorded for progress and rewards.",
        "Safety and reports: blocking relationships, report reasons and free text, references to affected profiles/messages, review status, and account status. These support complaint handling and protection against unwanted contact and misuse. Learning content may also be flagged for review.",
        "Technical operation: requests necessarily transmit connection information such as IP address, time, requested URL, and browser/device information to the relevant servers. Whether and how long hosting, authentication, or security logs are retained depends on the deployed infrastructure and has not been confirmed.",
      ],
      gap: "Production log fields, operator access, and retention settings for hosting, authentication, and email are not established by the repository alone.",
    },
    {
      id: "legal-bases", title: "4. Purposes and legal bases",
      paragraphs: [
        "Article 6(1)(b) GDPR may apply to processing necessary to provide the service you request, including account operation, profiles, matching, message delivery, and the learning features you use. This requires a valid contractual basis and an assessment of necessity for each category. Optional information is not automatically necessary for a contract merely because an input field exists.",
        "Article 6(1)(f) GDPR may support processing of ordinary personal data for technical security, abuse prevention, and report handling. The proposed legitimate interests are service reliability, user protection, and prevention of unlawful use. Necessity and a balancing assessment must be documented. Article 6(1)(c) applies only where a specific legal obligation requires processing; this notice does not assert a general obligation to retain all data.",
        "Where processing relies on consent, Article 6(1)(a) applies. Consent must be freely given, informed, specific, and withdrawable for future processing. Special-category data additionally requires a valid exception under Article 9(2); Article 6 alone is insufficient.",
      ],
      gap: "The controller and legal reviewer must confirm the contractual basis, optional fields, legitimate-interest assessments, and consent wording. Reading this notice does not give consent or create a legal basis.",
      links: [{ label: "GDPR: Articles 5–7 and 9", href: sources.gdpr }],
    },
    {
      id: "sensitive-data", title: "5. Dating intentions and sensitive information",
      paragraphs: [
        "Dating intentions and the content of photos, biographies, or messages may, depending on the context, reveal sex life, sexual orientation, health, religion, or other special categories of personal data. An ordinary profile photo is not inherently biometric data used for unique identification; that type of facial identification is not implemented in the reviewed app.",
        "Sensitive processing cannot rely solely on a contract or a general legitimate interest. Where explicit consent under Article 9(2)(a) is required for the dating feature, it must be separately obtained, evidenced, and withdrawable. Choosing “Open to Dating” or reading this notice does not replace such consent. We do not assume that making information visible automatically supplies a valid public-disclosure exception.",
        "Language-partner features are distinct from dating intentions. You can change your intention in your profile and exclude dating profiles from discovery. Changes do not undo information already shared. Avoid including sensitive information about yourself or others unless it is needed for the exchange.",
      ],
      gap: "Separate explicit consent, consent-version records, and a complete withdrawal process are not implemented. This gap and each provider's permission to handle sensitive data must be resolved before the relevant processing is approved.",
      links: [{ label: "GDPR: Article 9 and Article 7(3)", href: sources.gdpr }],
    },
    {
      id: "visibility", title: "6. Who can see your information",
      paragraphs: [
        "Signed-in users receive selected profile details according to the feature and access rules: first name, calculated age, city/country, languages, interests, biography, intentions, and images. Rankings show eligible active profiles with name, image, XP, level, and rank. Blocking in either direction is respected in discovery and rankings.",
        "In-app messages and corrections are accessible to the participants of the relevant match. Content is stored in the database; authorised technical or administrative access by the operator or providers is not thereby excluded. Chat is not end-to-end encrypted. Relevant information may be reviewed when a report is handled.",
        "Profile images currently use public storage. Anyone with the image URL can access the file without signing in, including after that URL has been shared. Blocking does not invalidate an already known image URL. Other users can also copy content or take screenshots; the current technology cannot prevent this.",
        "Blocking ends the active match but does not automatically delete stored messages or reports under the current schema. It does not substitute for an erasure request.",
      ],
    },
    {
      id: "providers", title: "7. Recipients and service providers",
      paragraphs: [
        "External providers help operate the service. Processing performed on our behalf requires an Article 28 GDPR agreement (Auftragsverarbeitungsvertrag). A provider may act as a separate controller for its own processing; its privacy information applies to that activity.",
      ],
      bullets: [
        "Supabase provides the database, authentication/session management, photo storage, and realtime chat delivery. It processes account, profile, communication, learning, and required technical data. The contracting entity and this project's region still need confirmation.",
        "Vercel hosts and delivers the website and runs server-side app functions. It receives request data and may handle application data loaded for server-rendered screens. Function locations, logging configuration, and the actual contractual arrangements are unconfirmed.",
        "Google / Apple are involved only if you choose a provider enabled in the deployed environment. The provider receives the sign-in request and returns authorised identity information. You do not enter a provider password into a Lingua Match form. A visible button alone does not prove that a provider is enabled in production.",
        "Email is sent through the authentication infrastructure for verification and other account messages. The SMTP provider, if any, and delivery/log records need confirmation.",
        "Browser/device services: the Android Trusted Web Activity opens the same website. Browser and installation services may process their own data under their terms. Listening exercises use browser speech synthesis, preferring local voices but allowing a suitable remote voice. In that case the browser may transmit exercise text to its speech provider. The app does not record your voice.",
      ],
      gap: "The reviewed repository has no Firebase push, advertising SDK, or external AI integration. Dashboard extensions and future integrations must be checked separately. Provider legal entities, processing agreements, and subprocessors are not yet confirmed.",
      links: [
        { label: "Supabase — Data Processing Addendum", href: sources.supabaseDpa },
        { label: "Vercel — Data Processing Addendum", href: sources.vercelDpa },
        { label: "Google — privacy information", href: sources.google },
        { label: "Apple — privacy information", href: sources.apple },
      ],
    },
    {
      id: "transfers", title: "8. Processing locations and international transfers",
      paragraphs: [
        "This Supabase project's storage region and the Vercel deployment's execution/logging locations have not been verified. We therefore do not promise processing exclusively in Germany or the EU. Choosing an EU database region does not, by itself, exclude access from elsewhere or processing by subprocessors.",
        "Transfers outside the European Economic Area require compliance with Articles 44 onward GDPR. Depending on the recipient, an applicable adequacy decision or appropriate safeguards may be used, including the European Commission's standard contractual clauses and any necessary supplementary measures. The actual mechanism for each recipient must be evidenced before approval. Reliance on the EU–US Data Privacy Framework requires the specific recipient and processing to fall within the applicable decision and a valid certification.",
        "You may request details and a copy or reference to the safeguards using the contact in section 1.",
      ],
      gap: "Regions, provider locations, subprocessors, applicable contract modules, certification status, and any required transfer assessment remain unresolved. Vercel's published DPA also restricts sensitive customer data; compatibility with this app's profile and communication data needs specific review.",
      links: [
        { label: "GDPR: Articles 44–49", href: sources.gdpr },
        { label: "Supabase — project regions", href: sources.supabaseRegions },
        { label: "Vercel — international transfers and data categories", href: sources.vercelDpa },
      ],
    },
    {
      id: "device-storage", title: "9. Cookies and access to your device",
      paragraphs: [
        "Supabase session cookies support sign-in and session continuity. They hold authentication and potentially short-lived login-flow information. Project-specific names may begin with “sb-”, and larger values can be split across cookies. Exact lifetimes depend on the libraries and authentication configuration and must be documented from the production environment.",
        "Storage/access strictly necessary for a sign-in service you expressly request may fall within section 25(2)(2) TDDDG. Non-essential storage or access generally needs prior consent under section 25(1); subsequent processing of personal data also needs a GDPR basis.",
        "Installation guidance inspects device category and standalone display state in the active browser. Its reviewed implementation keeps state in memory, without its own persistent localStorage, sessionStorage, or IndexedDB entries. The repository contains no app service worker, analytics tracker, or marketing tracker. Appearance follows the system preference. This code finding does not establish which hosting extensions may be enabled outside the repository.",
      ],
      gap: "Actual cookie names, purposes, lifetimes, and additional provider cookies must be established in a production-browser audit. This notice does not substitute for any required cookie consent.",
      links: [{ label: "Section 25 TDDDG — device access", href: sources.tdddg }],
    },
    {
      id: "retention", title: "10. Retention and deletion",
      paragraphs: [
        "Personal data should be retained only while needed for its purpose or where a relevant legal obligation or the establishment, exercise, or defence of legal claims justifies retention. It must then be erased or effectively anonymised. Suspending an account or ending a match does not anonymise the data.",
        "The reviewed code has no automated retention schedule by data category. Account, profile, chat, and learning records generally remain until a deletion is actually performed. Database cascades remove many dependent records on account deletion, but photo files also need removal through the storage service. Deleting a database reference does not reliably delete its file.",
        "Periods for inactive accounts, messages after a match ends, reports, security logs, and backup rotation have not been determined. Any continued retention in backups must be limited and handled through a verifiable process.",
      ],
      gap: "A binding retention/deletion schedule, exceptions, responsible roles, and backup handling must be approved and implemented. This draft invents no fixed deadlines and promises no existing automated deletion.",
      links: [{ label: "GDPR: Article 5(1)(e) and Article 17", href: sources.gdpr }],
    },
    {
      id: "security", title: "11. Data protection measures",
      paragraphs: [
        "Database access rules and shaped read functions limit the information ordinary app users can read or change. Exercises are graded and XP is awarded by database functions; users cannot write their own rewards directly. These safeguards are distinct from infrastructure or administrator access.",
        "Section 6 explains public photo storage and the absence of chat end-to-end encryption. No absolute security guarantee is made. Production access controls, transport settings, incident procedures, and technical/organisational measures still require verification.",
      ],
    },
    {
      id: "automation", title: "12. Automated suggestions, grading, and decisions",
      paragraphs: [
        "Profile suggestions are filtered or ordered using languages, age/country preferences, swipe history, and blocks. Exercises are automatically graded; review dates, XP, levels, and rankings are calculated from learning/activity records. Such evaluation of preferences or performance may amount to profiling.",
        "The reviewed app contains no identified solely automated decision producing legal effects or similarly significantly affecting a person within Article 22(1) GDPR. In particular, automatic AI photo moderation and sanctions based solely on a user report are not implemented. This assessment must be revisited if moderation or evaluation systems change.",
      ],
      links: [{ label: "GDPR: Article 4(4) and Article 22", href: sources.gdpr }],
    },
    {
      id: "required-data", title: "13. Required and optional information",
      paragraphs: [
        "You are not legally obliged to open a Lingua Match account. The selected sign-in method needs its identity information; without it, sign-in is unavailable. The regular onboarding flow requires a first name, date of birth/adult confirmation, country, at least one native and one learning language, at least one intention, and a profile photo. These inputs are needed to complete that flow.",
        "City, biography, interests, additional photos, and a dating intention are optional profile entries. Screens indicate other required inputs. Messages, corrections, and exercise answers arise when you use those features. You do not need to choose “Open to Dating” to use language-partner features. An interface requiring an input does not, on its own, establish that collecting it is legally necessary.",
      ],
    },
    {
      id: "rights", title: "14. Your rights and how to exercise them",
      paragraphs: [
        "The following rights apply subject to their statutory conditions. Contact the controller using section 1. If there are reasonable doubts about identity, a proportionate check may be required to avoid disclosure to an unauthorised person; it must not collect more information than necessary.",
      ],
      bullets: [
        "Access under Article 15 GDPR, including a copy of the personal data processed about you.",
        "Rectification and completion under Article 16. You can change many profile entries through “Profile → Edit profile”.",
        "Erasure under Article 17, subject to lawful exceptions, and restriction of processing under Article 18.",
        "Portability under Article 20 in a structured, commonly used, machine-readable format for data you provided that is processed automatically on the basis of consent or contract, including direct transmission where technically feasible.",
        "Objection under Article 21(1), on grounds relating to your particular situation, to processing based on Article 6(1)(e) or (f), including associated profiling. Continuation then requires the statutory conditions to be met. Article 21(2) provides an unconditional right to object to direct marketing; the reviewed app has no own direct-marketing feature.",
        "Withdrawal of consent under Article 7(3) for future processing, without affecting the lawfulness of prior processing. Withdrawal must be as easy as giving consent.",
        "Rights concerning Article 22 decisions where such processing is introduced and the statutory conditions apply.",
      ],
      gap: "Settings currently has no self-service account deletion or data download. You can send requests by email or post using the contact details in section 1. The controller must ensure timely handling, including identity checks, gathering records, and actually carrying out erasure.",
      links: [{ label: "European Commission — data-subject rights", href: sources.rights }],
    },
    {
      id: "complaints", title: "15. Response deadlines and supervisory complaints",
      paragraphs: [
        "Information about action on a request is generally due without undue delay and within one month. Where the law permits up to two additional months, the controller must notify you within the initial month and explain the extension. A refusal is subject to the explanation and remedy requirements of Article 12 GDPR.",
        "You may complain under Article 77 to a supervisory authority, particularly in the Member State of your habitual residence, workplace, or an alleged infringement. You need not contact us first, and other remedies remain available.",
        "For the stated Dresden establishment, the competent state authority is the Sächsische Datenschutz- und Transparenzbeauftragte. Its official complaint page and the directory of other authorities are linked below.",
      ],
      links: [
        { label: "Sächsische Datenschutz- und Transparenzbeauftragte — complaints", href: sources.saxony },
        { label: "Official directory of German supervisory authorities", href: sources.authorities },
        { label: "GDPR: Articles 12 and 77", href: sources.gdpr },
      ],
    },
    {
      id: "changes", title: "16. Version, changes, and outstanding approval",
      paragraphs: [
        "The version and review date appear at the top of this notice. Changes in features, recipients, or purposes require the text to be reviewed. Updating this text does not create a legal basis or replace consent required for a new purpose.",
        "German is the primary editorial edition; this English version describes the same reviewed implementation. That editorial order does not limit statutory rights or mandatory information duties in a language people can understand.",
      ],
      gap: "Approval remains pending for the DPO assessment, actual providers/regions/contracts, transfer safeguards, retention, cookie audit, and sensitive-data consent. The draft marking remains visible until these are resolved.",
    },
  ],
};
