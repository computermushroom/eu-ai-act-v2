-- CreateTable: users
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: accounts
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: sessions
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: verification_tokens
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable: subscriptions
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lemonSqueezyId" TEXT,
    "lemonSqueezyCustomerId" TEXT,
    "lemonSqueezyVariantId" TEXT,
    "lemonSqueezyProductId" TEXT,
    "lemonSqueezyOrderId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'inactive',
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'free',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: audit_logs
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ai_systems
CREATE TABLE "ai_systems" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "systemType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "riskLevel" TEXT,
    "industry" TEXT,
    "art6Compliant" BOOLEAN NOT NULL DEFAULT false,
    "art9Compliant" BOOLEAN NOT NULL DEFAULT false,
    "art10Compliant" BOOLEAN NOT NULL DEFAULT false,
    "art12Compliant" BOOLEAN NOT NULL DEFAULT false,
    "art13Compliant" BOOLEAN NOT NULL DEFAULT false,
    "art14Compliant" BOOLEAN NOT NULL DEFAULT false,
    "art15Compliant" BOOLEAN NOT NULL DEFAULT false,
    "art17Compliant" BOOLEAN NOT NULL DEFAULT false,
    "art27Compliant" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deployedAt" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),

    CONSTRAINT "ai_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable: scan_results
CREATE TABLE "scan_results" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "scanType" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "findings" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable: scan_tasks
CREATE TABLE "scan_tasks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetUrl" TEXT,
    "scanType" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "results" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: compliance_alerts
CREATE TABLE "compliance_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "articleRef" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "compliance_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: fria_assessments
CREATE TABLE "fria_assessments" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "section1" TEXT,
    "section2" TEXT,
    "section3" TEXT,
    "section4" TEXT,
    "section5" TEXT,
    "section6" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "overallScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "fria_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: qms_checklists
CREATE TABLE "qms_checklists" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "riskManagement" BOOLEAN NOT NULL DEFAULT false,
    "dataGovernance" BOOLEAN NOT NULL DEFAULT false,
    "technicalDoc" BOOLEAN NOT NULL DEFAULT false,
    "recordKeeping" BOOLEAN NOT NULL DEFAULT false,
    "transparency" BOOLEAN NOT NULL DEFAULT false,
    "humanOversight" BOOLEAN NOT NULL DEFAULT false,
    "accuracyRobustness" BOOLEAN NOT NULL DEFAULT false,
    "cybersecurity" BOOLEAN NOT NULL DEFAULT false,
    "qualityControl" BOOLEAN NOT NULL DEFAULT false,
    "postMarket" BOOLEAN NOT NULL DEFAULT false,
    "incidentReporting" BOOLEAN NOT NULL DEFAULT false,
    "completionRate" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'incomplete',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qms_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable: training_modules
CREATE TABLE "training_modules" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "articleRef" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'beginner',
    "duration" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable: training_progress
CREATE TABLE "training_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not-started',
    "score" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable: compliance_documents
CREATE TABLE "compliance_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "systemId" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable: team_members
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "permissions" TEXT[],
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable: webhook_configs
CREATE TABLE "webhook_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: client_portals
CREATE TABLE "client_portals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#2563eb',
    "accentColor" TEXT DEFAULT '#16a34a',
    "customDomain" TEXT,
    "welcomeTitle" TEXT DEFAULT 'Welcome to Your Compliance Dashboard',
    "welcomeMessage" TEXT,
    "footerText" TEXT DEFAULT 'Powered by EU AI Act Compliance Tool',
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "showPricing" BOOLEAN NOT NULL DEFAULT false,
    "showTraining" BOOLEAN NOT NULL DEFAULT true,
    "showDocuments" BOOLEAN NOT NULL DEFAULT true,
    "showTeam" BOOLEAN NOT NULL DEFAULT true,
    "showAlerts" BOOLEAN NOT NULL DEFAULT true,
    "showReports" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_portals_pkey" PRIMARY KEY ("id")
);

-- CreateTable: clients
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "industry" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable: client_ai_systems
CREATE TABLE "client_ai_systems" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "systemType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "riskLevel" TEXT,
    "industry" TEXT,
    "art6Compliant" BOOLEAN NOT NULL DEFAULT false,
    "art9Compliant" BOOLEAN NOT NULL DEFAULT false,
    "art10Compliant" BOOLEAN NOT NULL DEFAULT false,
    "art12Compliant" BOOLEAN NOT NULL DEFAULT false,
    "art13Compliant" BOOLEAN NOT NULL DEFAULT false,
    "art14Compliant" BOOLEAN NOT NULL DEFAULT false,
    "art15Compliant" BOOLEAN NOT NULL DEFAULT false,
    "art17Compliant" BOOLEAN NOT NULL DEFAULT false,
    "art27Compliant" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_ai_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable: client_documents
CREATE TABLE "client_documents" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable: client_alerts
CREATE TABLE "client_alerts" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "articleRef" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "client_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'cancelled', 'expired', 'inactive', 'past_due', 'paused', 'unpaid');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('free', 'starter', 'professional', 'business', 'enterprise');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('user_login', 'user_logout', 'user_registered', 'user_updated_profile', 'user_exported_data', 'user_deleted_account', 'subscription_created', 'subscription_updated', 'subscription_cancelled', 'payment_succeeded', 'payment_failed', 'tool_risk_assessment', 'tool_prohibited_practices', 'tool_transparency_check', 'tool_lifecycle_management', 'tool_data_governance', 'tool_qms_checklist', 'tool_fria_assessment', 'tool_shadow_ai_scan', 'tool_specialized_checks', 'report_generated', 'report_downloaded', 'alert_triggered', 'alert_resolved', 'training_completed', 'document_created', 'document_updated', 'settings_updated');

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_lemonSqueezyId_key" ON "subscriptions"("lemonSqueezyId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_lemonSqueezyId_idx" ON "subscriptions"("lemonSqueezyId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_systems_userId_idx" ON "ai_systems"("userId");

-- CreateIndex
CREATE INDEX "ai_systems_status_idx" ON "ai_systems"("status");

-- CreateIndex
CREATE INDEX "ai_systems_riskLevel_idx" ON "ai_systems"("riskLevel");

-- CreateIndex
CREATE INDEX "scan_results_systemId_idx" ON "scan_results"("systemId");

-- CreateIndex
CREATE INDEX "scan_results_scanType_idx" ON "scan_results"("scanType");

-- CreateIndex
CREATE INDEX "scan_results_createdAt_idx" ON "scan_results"("createdAt");

-- CreateIndex
CREATE INDEX "scan_tasks_userId_idx" ON "scan_tasks"("userId");

-- CreateIndex
CREATE INDEX "scan_tasks_status_idx" ON "scan_tasks"("status");

-- CreateIndex
CREATE INDEX "scan_tasks_nextRunAt_idx" ON "scan_tasks"("nextRunAt");

-- CreateIndex
CREATE INDEX "compliance_alerts_userId_idx" ON "compliance_alerts"("userId");

-- CreateIndex
CREATE INDEX "compliance_alerts_isRead_idx" ON "compliance_alerts"("isRead");

-- CreateIndex
CREATE INDEX "compliance_alerts_severity_idx" ON "compliance_alerts"("severity");

-- CreateIndex
CREATE INDEX "compliance_alerts_createdAt_idx" ON "compliance_alerts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "fria_assessments_systemId_key" ON "fria_assessments"("systemId");

-- CreateIndex
CREATE UNIQUE INDEX "qms_checklists_systemId_key" ON "qms_checklists"("systemId");

-- CreateIndex
CREATE INDEX "training_modules_articleRef_idx" ON "training_modules"("articleRef");

-- CreateIndex
CREATE INDEX "training_modules_isActive_idx" ON "training_modules"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "training_progress_userId_moduleId_key" ON "training_progress"("userId", "moduleId");

-- CreateIndex
CREATE INDEX "training_progress_userId_idx" ON "training_progress"("userId");

-- CreateIndex
CREATE INDEX "training_progress_status_idx" ON "training_progress"("status");

-- CreateIndex
CREATE INDEX "compliance_documents_userId_idx" ON "compliance_documents"("userId");

-- CreateIndex
CREATE INDEX "compliance_documents_systemId_idx" ON "compliance_documents"("systemId");

-- CreateIndex
CREATE INDEX "compliance_documents_type_idx" ON "compliance_documents"("type");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_userId_teamId_key" ON "team_members"("userId", "teamId");

-- CreateIndex
CREATE INDEX "team_members_teamId_idx" ON "team_members"("teamId");

-- CreateIndex
CREATE INDEX "webhook_configs_userId_idx" ON "webhook_configs"("userId");

-- CreateIndex
CREATE INDEX "webhook_configs_isActive_idx" ON "webhook_configs"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "client_portals_userId_key" ON "client_portals"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "client_portals_slug_key" ON "client_portals"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "client_portals_customDomain_key" ON "client_portals"("customDomain");

-- CreateIndex
CREATE INDEX "client_portals_slug_idx" ON "client_portals"("slug");

-- CreateIndex
CREATE INDEX "client_portals_customDomain_idx" ON "client_portals"("customDomain");

-- CreateIndex
CREATE INDEX "client_portals_status_idx" ON "client_portals"("status");

-- CreateIndex
CREATE INDEX "clients_portalId_idx" ON "clients"("portalId");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "clients"("email");

-- CreateIndex
CREATE INDEX "client_ai_systems_clientId_idx" ON "client_ai_systems"("clientId");

-- CreateIndex
CREATE INDEX "client_ai_systems_status_idx" ON "client_ai_systems"("status");

-- CreateIndex
CREATE INDEX "client_documents_clientId_idx" ON "client_documents"("clientId");

-- CreateIndex
CREATE INDEX "client_documents_type_idx" ON "client_documents"("type");

-- CreateIndex
CREATE INDEX "client_alerts_clientId_idx" ON "client_alerts"("clientId");

-- CreateIndex
CREATE INDEX "client_alerts_isRead_idx" ON "client_alerts"("isRead");

-- CreateIndex
CREATE INDEX "client_alerts_severity_idx" ON "client_alerts"("severity");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_systems" ADD CONSTRAINT "ai_systems_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_results" ADD CONSTRAINT "scan_results_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "ai_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_tasks" ADD CONSTRAINT "scan_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_alerts" ADD CONSTRAINT "compliance_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fria_assessments" ADD CONSTRAINT "fria_assessments_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "ai_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qms_checklists" ADD CONSTRAINT "qms_checklists_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "ai_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_progress" ADD CONSTRAINT "training_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_progress" ADD CONSTRAINT "training_progress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "training_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "ai_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_portals" ADD CONSTRAINT "client_portals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "client_portals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_ai_systems" ADD CONSTRAINT "client_ai_systems_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_alerts" ADD CONSTRAINT "client_alerts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
