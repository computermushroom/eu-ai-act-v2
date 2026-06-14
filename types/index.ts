// Shared TypeScript type definitions
// All types are centralized here for easy maintenance

// Subscription plan tiers
export type SubscriptionTier = "free" | "starter" | "professional" | "business" | "enterprise";

// Subscription plan details
export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number; // in EUR
  features: string[];
}

// User role within organization
export type UserRole = "owner" | "admin" | "member" | "viewer";

// Supported locales for i18n
export type SupportedLocale = "en" | "de" | "fr" | "es" | "it" | "zh" | "ja" | "ko" | "ru" | "ar";

// AI risk level per EU AI Act classification
export type AIRiskLevel = "unacceptable" | "high" | "limited" | "minimal" | "unknown";

// Tool category
export type ToolCategory =
  | "risk-assessment"
  | "compliance-check"
  | "documentation"
  | "monitoring"
  | "training"
  | "reporting";

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
