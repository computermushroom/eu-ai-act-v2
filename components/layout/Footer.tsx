// Footer Component
// Server Component with next-intl translations
// Contains GDPR/CCPA required links

import Link from "next/link";
import { getTranslations } from "next-intl/server";

/**
 * Site footer with legal links and copyright
 * Required for GDPR/CCPA compliance
 */
export default async function Footer() {
  const currentYear = new Date().getFullYear();
  const t = await getTranslations();

  return (
    <footer className="w-full border-t border-border bg-muted/50">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t("footer.brand")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("footer.brandDescription")}
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t("footer.product")}</h3>
            <ul className="space-y-2">
              <FooterLink href="/tools/risk-assessment">{t("footer.riskAssessment")}</FooterLink>
              <FooterLink href="/tools/specialized-checks">{t("footer.complianceCheck")}</FooterLink>
              <FooterLink href="/tools/documentation">{t("footer.documentation")}</FooterLink>
              <FooterLink href="/pricing">{t("footer.pricing")}</FooterLink>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t("footer.resources")}</h3>
            <ul className="space-y-2">
              <FooterLink href="/knowledge-base">{t("footer.aiLiteracy")}</FooterLink>
              <FooterLink href="/knowledge-base">{t("footer.knowledgeBase")}</FooterLink>
              <FooterLink href="/tools/risk-assessment">{t("footer.riskGuide")}</FooterLink>
              <FooterLink href="/knowledge-base">{t("footer.blog")}</FooterLink>
            </ul>
          </div>

          {/* Legal - GDPR/CCPA required */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t("footer.legal")}</h3>
            <ul className="space-y-2">
              <FooterLink href="/privacy">{t("footer.privacy")}</FooterLink>
              <FooterLink href="/terms">{t("footer.terms")}</FooterLink>
              <FooterLink href="/privacy#cookies">{t("footer.cookiePolicy")}</FooterLink>
              <FooterLink href="/privacy#data-rights">{t("footer.dataRights")}</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} AI Act Compliance Tool. {t("footer.rights")}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              {t("footer.gdprCompliant")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Footer link with consistent styling
 */
function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {children}
      </Link>
    </li>
  );
}
