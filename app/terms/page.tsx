// Terms of Service Page
// Required legal page covering service usage, subscriptions, liability, and dispute resolution

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | EU AI Act Compliance Tool",
  description:
    "Terms and conditions governing the use of our EU AI Act compliance platform.",
};

/**
 * Section component for consistent terms layout
 */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  const lastUpdated = "2026-06-11";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
      </div>

      <div className="mt-8 space-y-10">
        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using the AI Act Compliance Tool platform
            ("Service"), you agree to be bound by these Terms of Service
            ("Terms"). If you do not agree to these Terms, you may not access
            or use the Service. These Terms constitute a legally binding
            agreement between you and AI Act Compliance Tool ("Company", "we",
            "us", "our").
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            The Service provides tools and resources to help businesses assess
            and achieve compliance with the European Union Artificial
            Intelligence Act (EU AI Act). Our offerings include:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>AI risk classification and assessment tools.</li>
            <li>Compliance checklists and documentation templates.</li>
            <li>Regulatory knowledge base and article references.</li>
            <li>Compliance scoring and reporting features.</li>
            <li>URL scanning for AI system compliance indicators.</li>
          </ul>
          <p>
            The Service is provided on a subscription basis with multiple tiers
            as described on our Pricing page.
          </p>
        </Section>

        <Section title="3. Account Registration">
          <p>
            To use certain features of the Service, you must create an account.
            You agree to:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Provide accurate, current, and complete information during
              registration.
            </li>
            <li>Maintain the security of your password and account.</li>
            <li>
              Notify us immediately of any unauthorized use of your account.
            </li>
            <li>
              Take responsibility for all activities that occur under your
              account.
            </li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate
            these Terms.
          </p>
        </Section>

        <Section title="4. Subscription and Payment">
          <p>
            The Service is offered on a subscription basis with the following
            terms:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Billing:</strong> Subscriptions are billed in advance on a
              monthly basis through our payment processor, Creem.
            </li>
            <li>
              <strong>VAT:</strong> All prices are inclusive of applicable EU
              VAT, which is automatically calculated and remitted by Creem.
            </li>
            <li>
              <strong>Renewal:</strong> Subscriptions automatically renew unless
              cancelled before the renewal date.
            </li>
            <li>
              <strong>Cancellation:</strong> You may cancel your subscription at
              any time through your account settings. Cancellation takes effect
              at the end of the current billing period.
            </li>
            <li>
              <strong>Refunds:</strong> Refunds are provided at our sole
              discretion and in accordance with EU consumer protection laws.
            </li>
          </ul>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Violate any applicable laws or regulations.</li>
            <li>Infringe upon the intellectual property rights of others.</li>
            <li>
              Attempt to gain unauthorized access to the Service or its related
              systems.
            </li>
            <li>
              Use the Service to generate fraudulent or misleading compliance
              documentation.
            </li>
            <li>
              Interfere with or disrupt the integrity or performance of the
              Service.
            </li>
            <li>
              Reverse engineer, decompile, or disassemble any aspect of the
              Service.
            </li>
          </ul>
        </Section>

        <Section title="6. Intellectual Property">
          <p>
            All content, features, and functionality of the Service, including
            but not limited to text, graphics, logos, icons, images, audio
            clips, digital downloads, data compilations, and software, are the
            exclusive property of the Company or its licensors and are protected
            by international copyright, trademark, and other intellectual
            property laws.
          </p>
          <p>
            You retain ownership of any compliance data, assessments, and
            documents you create using the Service. We grant you a limited,
            non-exclusive, non-transferable license to use the Service for your
            internal business purposes.
          </p>
        </Section>

        <Section title="7. Disclaimer of Warranties">
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
            WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST
            EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT
            NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p>
            We do not warrant that the Service will be uninterrupted, timely,
            secure, or error-free. Compliance assessments generated by the
            Service are for informational purposes and do not constitute legal
            advice. You should consult with qualified legal counsel for
            definitive compliance guidance.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT
            SHALL THE COMPANY, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS,
            SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT
            LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER
            INTANGIBLE LOSSES.
          </p>
          <p>
            Our total liability for any claims arising under these Terms shall
            not exceed the amount you paid for the Service in the 12 months
            preceding the claim, or EUR 100, whichever is greater.
          </p>
        </Section>

        <Section title="9. Indemnification">
          <p>
            You agree to indemnify, defend, and hold harmless the Company and
            its affiliates from and against any claims, liabilities, damages,
            losses, and expenses, including reasonable attorneys' fees, arising
            out of or in any way connected with your access to or use of the
            Service, your violation of these Terms, or your violation of any
            rights of another.
          </p>
        </Section>

        <Section title="10. Termination">
          <p>
            We may terminate or suspend your access to the Service immediately,
            without prior notice or liability, for any reason, including without
            limitation if you breach these Terms.
          </p>
          <p>
            Upon termination, your right to use the Service will immediately
            cease. All provisions of these Terms which by their nature should
            survive termination shall survive, including ownership provisions,
            warranty disclaimers, indemnity, and limitations of liability.
          </p>
        </Section>

        <Section title="11. Governing Law and Dispute Resolution">
          <p>
            These Terms shall be governed by and construed in accordance with
            the laws of the European Union and the laws of Ireland,
            without regard to its conflict of law provisions.
          </p>
          <p>
            Any dispute arising out of or in connection with these Terms shall
            first be attempted to be resolved through good faith negotiations.
            If such negotiations fail, the dispute shall be submitted to
            binding arbitration in accordance with the rules of the
            International Chamber of Commerce (ICC).
          </p>
          <p>
            For consumers within the European Union, you may also have recourse
            to the Online Dispute Resolution (ODR) platform provided by the
            European Commission at https://ec.europa.eu/odr.
          </p>
        </Section>

        <Section title="12. Changes to Terms">
          <p>
            We reserve the right to modify or replace these Terms at any time.
            If a revision is material, we will provide at least 30 days' notice
            prior to any new terms taking effect. What constitutes a material
            change will be determined at our sole discretion.
          </p>
          <p>
            By continuing to access or use the Service after any revisions
            become effective, you agree to be bound by the revised Terms.
          </p>
        </Section>

        <Section title="13. Contact Information">
          <p>
            If you have any questions about these Terms, please contact us:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Email:{" "}
              <a
                href="mailto:legal@aicompliance.eu"
                className="text-primary underline"
              >
                legal@aicompliance.eu
              </a>
            </li>
            <li>Address: Dublin, Ireland (EU)</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
