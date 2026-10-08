import type { ImprintPolicy } from "./types";
import { IMPRINT_LAST_UPDATED, IMPRINT_SOURCES as sources, IMPRINT_VERSION } from "./imprint.config.ts";

export const imprintEn: ImprintPolicy = {
  kind: "imprint", language: "en", title: "Imprint / Legal Notice",
  description: "Provider identity and contact for Lingua Match. Unconfirmed details are clearly identified.",
  version: IMPRINT_VERSION, lastUpdated: IMPRINT_LAST_UPDATED,
  intro: "This provider notice covers the Lingua Match website, installable web app and Android app that opens the same website. It uses information confirmed by the provider. Unconfirmed details and legal classifications are explicitly identified.",
  summary: [
    "The person identified below provides Lingua Match. The product name is not a substitute for the provider's legal identity.",
    "The full name, physical postal address and email come from the shared operator configuration.",
    "A second rapid contact channel and any applicable additional disclosures appear below. MISSING identifies an outstanding confirmation.",
    "The provider describes an unpaid hobby project run alone. This does not establish an unverified legal exemption.",
    "While required details or legal approval are outstanding, this notice remains marked as a draft and excluded from search indexing.",
  ],
  sections: [
    {
      id: "provider", title: "1. Provider and contact details",
      paragraphs: [
        "The person or organization listed below provides the service. The address must be a physical address suitable for service; a P.O. box is not a substitute. Company, register and identification disclosures depend on the provider's actual circumstances.",
        "“Natural person” identifies the provider type. It does not settle whether the activity is legally commercial or professional. Unconfirmed information is not replaced with invented details.",
      ],
      links: [{ label: "§ 5 DDG — general provider information duties", href: sources.ddg }],
    },
    {
      id: "contact", title: "2. Getting in touch",
      paragraphs: [
        "Use the email or postal address above for service enquiries. Any confirmed additional channel is linked there. Do not send passwords, verification codes or unnecessary sensitive data.",
        "§ 5(1)(2) DDG concerns rapid electronic contact and direct communication. A telephone number is not invariably required; another suitable channel that actually works may be possible. Its availability and handling need verification. No unconfirmed fixed response deadline is promised.",
        "If the second channel is marked MISSING above, it has not been confirmed. Another mailto link or a non-working form does not resolve that gap.",
      ],
      links: [{ label: "§ 5(1)(2) DDG — contact information", href: sources.ddg }, { label: "CJEU C-298/07 — telephone or another suitable channel (official overview)", href: sources.contact }],
    },
    {
      id: "applicability", title: "3. Legal basis and outstanding classification",
      paragraphs: [
        "§ 5 DDG sets provider duties for business-like digital services normally offered for remuneration, within its statutory scope. Separately, § 18(1) MStV requires identity information for telemedia beyond exclusively personal or family purposes. Journalistic/editorial offerings require assessment of the additional responsible-person provisions in § 18(2) MStV. The former § 5 TMG is not cited as the current statute here.",
        "The provider describes a hobby service run alone with no current usage fee. Which provisions apply still needs assessment of the actual offering. Confirm any legal form, register entry, VAT or German business identification number, authorization or professional disclosures, and editorial classification. This notice does not request a private tax number as a universally required disclosure.",
      ],
      gap: "Unconfirmed classifications and details are identified above. If the offering includes journalistic/editorial material, the responsible person's name, address and statutory eligibility must be checked before approval.",
      links: [{ label: "§ 5 DDG — current provider duties", href: sources.ddg }, { label: "Medienstaatsvertrag — particularly § 18", href: sources.media }, { label: "German media authorities — legal-notice guidance", href: sources.guidance }],
    },
    {
      id: "related", title: "4. Related legal information",
      paragraphs: [
        "The privacy notice explains personal-data processing. The terms cover participation and community rules, while licence notices identify learning-content sources. Each document has its own draft and approval status.",
        "This notice contains no blanket liability, copyright or external-link disclaimer. Identifying the provider does not restrict statutory claims. Consumer dispute-resolution information appears in the terms and requires its own confirmation there.",
      ],
      links: [{ label: "Privacy notice", href: "/privacy" }, { label: "Terms — consumer dispute resolution", href: "/terms#consumer-disputes" }, { label: "Licenses & attributions", href: "/licenses" }],
    },
  ],
};
