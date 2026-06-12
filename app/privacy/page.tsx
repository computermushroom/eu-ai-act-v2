// Privacy Policy Page
// GDPR / CCPA compliant - required legal page
// Covers: data collection, storage, usage, user rights (access, export, deletion)

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | EU AI Act Compliance Tool",
  description:
    "Learn how we collect, use, and protect your personal data. GDPR and CCPA compliant privacy policy.",
};

/**
 * Section component for consistent policy layout
 */
function Section({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  const lastUpdated = "2026-06-11";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
      </div>

      <div className="mt-8 space-y-10">
        <Section title="1. Introduction">
          <p>
            AI Act Compliance Tool ("we", "us", "our") is committed to
            protecting your privacy. This Privacy Policy explains how we
            collect, use, store, and protect your personal data when you use our
            platform. We comply with the General Data Protection Regulation
            (GDPR), the California Consumer Privacy Act (CCPA), and other
            applicable data protection laws.
          </p>
        </Section>

        <Section title="2. Data Controller">
          <p>
            The data controller for your personal data is AI Act Compliance
            Tool. If you have any questions about this Privacy Policy or your
            data rights, please contact us at privacy@aicompliance.eu.
          </p>
        </Section>

        <Section title="3. What Data We Collect">
          <p>We collect the following categories of personal data:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Account Information:</strong> Name, email address,
              password (hashed), company name, and subscription tier.
            </li>
            <li>
              <strong>Usage Data:</strong> Pages visited, tools used, scan
              results, and feature interactions.
            </li>
            <li>
              <strong>Compliance Data:</strong> AI system descriptions, risk
              assessments, and generated compliance documents that you create.
            </li>
            <li>
              <strong>Payment Data:</strong> Processed by Lemon Squeezy (our
              payment processor). We do not store credit card numbers.
            </li>
            <li>
              <strong>Technical Data:</strong> IP address, browser type,
              operating system, and device information.
            </li>
          </ul>
        </Section>

        <Section title="4. Legal Basis for Processing (GDPR)">
          <p>We process your personal data based on the following legal grounds:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Contract:</strong> To provide our services under your
              subscription agreement.
            </li>
            <li>
              <strong>Consent:</strong> For analytics cookies and marketing
              communications (you can withdraw consent at any time).
            </li>
            <li>
              <strong>Legitimate Interests:</strong> For security, fraud
              prevention, and service improvement.
            </li>
            <li>
              <strong>Legal Obligation:</strong> To comply with tax and
              regulatory requirements.
            </li>
          </ul>
        </Section>

        <Section title="5. How We Use Your Data">
          <p>We use your personal data for the following purposes:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>To provide and maintain our compliance platform services.</li>
            <li>To process payments and manage subscriptions.</li>
            <li>To send service-related notifications and updates.</li>
            <li>To improve our platform based on usage patterns.</li>
            <li>To comply with legal and regulatory obligations.</li>
            <li>To detect and prevent fraud and security incidents.</li>
          </ul>
        </Section>

        <Section title="6. Data Retention">
          <p>
            We retain your personal data for as long as your account is active
            or as needed to provide you with our services. After account
            deletion, we retain certain data for legal and tax compliance
            purposes for up to 7 years, as required by EU law. All other data
            is securely deleted within 30 days of account closure.
          </p>
        </Section>

        <Section title="7. Data Sharing">
          <p>
            We do not sell your personal data. We share data only with trusted
            third-party service providers who assist us in operating our
            platform:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Lemon Squeezy:</strong> Payment processing and VAT
              handling.
            </li>
            <li>
              <strong>Vercel:</strong> Hosting and infrastructure.
            </li>
            <li>
              <strong>PostgreSQL Hosting Provider:</strong> Database storage.
            </li>
          </ul>
          <p>
            All third-party providers are bound by data processing agreements
            that comply with GDPR requirements.
          </p>
        </Section>

        <Section title="8. International Data Transfers">
          <p>
            Your data is primarily stored within the European Economic Area
            (EEA). If data is transferred outside the EEA, we ensure adequate
            protection through Standard Contractual Clauses (SCCs) or other
            GDPR-recognized transfer mechanisms.
          </p>
        </Section>

        <Section id="data-rights" title="9. Your Data Rights">
          <p>
            Under GDPR and CCPA, you have the following rights regarding your
            personal data:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Right to Access:</strong> Request a copy of your personal
              data.
            </li>
            <li>
              <strong>Right to Rectification:</strong> Correct inaccurate or
              incomplete data.
            </li>
            <li>
              <strong>Right to Erasure ("Right to be Forgotten"):</strong>{" "}
              Request deletion of your personal data.
            </li>
            <li>
              <strong>Right to Data Portability:</strong> Export your data in a
              machine-readable format.
            </li>
            <li>
              <strong>Right to Restrict Processing:</strong> Limit how we use
              your data.
            </li>
            <li>
              <strong>Right to Object:</strong> Object to processing based on
              legitimate interests or direct marketing.
            </li>
            <li>
              <strong>Right to Withdraw Consent:</strong> Withdraw consent for
              cookies and marketing at any time.
            </li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at{" "}
            <a
              href="mailto:privacy@aicompliance.eu"
              className="text-primary underline"
            >
              privacy@aicompliance.eu
            </a>{" "}
            or use the data management options in your account settings.
          </p>
        </Section>

        <Section id="cookies" title="10. Cookies and Tracking">
          <p>
            We use cookies and similar technologies to enhance your experience.
            For detailed information about the cookies we use and how to manage
            your preferences, please see our Cookie Preferences panel (accessible
            via the banner that appears when you first visit our site).
          </p>
          <p>
            Essential cookies are always active and necessary for the site to
            function. Analytics and marketing cookies are only activated with
            your explicit consent, which you can manage or withdraw at any time.
          </p>
        </Section>

        <Section title="11. Data Security">
          <p>
            We implement appropriate technical and organizational measures to
            protect your personal data, including:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Encryption of data in transit (TLS 1.3) and at rest.</li>
            <li>Regular security audits and penetration testing.</li>
            <li>Role-based access controls for staff.</li>
            <li>Automated backup and disaster recovery procedures.</li>
            <li>Compliance with ISO 27001 security standards.</li>
          </ul>
        </Section>

        <Section title="12. Children's Privacy">
          <p>
            Our services are not intended for individuals under 16 years of age.
            We do not knowingly collect personal data from children. If you
            believe we have collected data from a child, please contact us
            immediately.
          </p>
        </Section>

        <Section title="13. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of any material changes via email or through a prominent notice
            on our platform. The "Last updated" date at the top of this page
            indicates when the policy was last revised.
          </p>
        </Section>

        <Section title="14. Contact Us">
          <p>
            If you have any questions, concerns, or requests regarding this
            Privacy Policy or your personal data, please contact us:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Email:{" "}
              <a
                href="mailto:privacy@aicompliance.eu"
                className="text-primary underline"
              >
                privacy@aicompliance.eu
              </a>
            </li>
            <li>Address: Dublin, Ireland (EU)</li>
          </ul>
          <p>
            You also have the right to lodge a complaint with your local data
            protection authority.
          </p>
        </Section>
      </div>
    </div>
  );
}
