import { NextResponse } from "next/server";

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "EU AI Act Compliance API",
    version: "1.0.0",
    description: "API documentation for EU AI Act Compliance Tool",
  },
  servers: [
    { url: process.env.NEXTAUTH_URL ?? "http://localhost:3000", description: "Current server" },
  ],
  paths: {
    // 包含主要 API 路由的文档
    "/api/ai-assistant": {
      post: {
        summary: "AI Compliance Assistant",
        description: "Chat with AI assistant for EU AI Act compliance questions",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", minLength: 1, maxLength: 8000 },
                  systemContext: { type: "string", maxLength: 2000 },
                },
                required: ["message"],
              },
            },
          },
        },
        responses: {
          "200": { description: "AI response", content: { "application/json": { schema: { type: "object", properties: { response: { type: "string" } } } } } },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limited" },
          "503": { description: "AI service not configured" },
        },
      },
    },
    
    "/api/subscription/checkout": {
      post: {
        summary: "Create Payment Checkout",
        description: "Create a checkout session for subscription purchase",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  tier: { type: "string", enum: ["starter", "professional", "business", "enterprise"] },
                  billingCycle: { type: "string", enum: ["monthly", "yearly"] },
                },
                required: ["tier"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Checkout URL created" },
          "400": { description: "Invalid request" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    
    "/api/fria": {
      get: {
        summary: "List FRIA Assessments",
        description: "Get FRIA assessments for user's AI systems (Business tier)",
        responses: {
          "200": { description: "List of assessments" },
          "401": { description: "Unauthorized" },
          "403": { description: "Tier not allowed" },
        },
      },
      post: {
        summary: "Create/Update FRIA Assessment",
        description: "Submit FRIA assessment sections (Art.27)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  systemId: { type: "string" },
                  section1: { type: "string" },
                  section2: { type: "string" },
                  section3: { type: "string" },
                  section4: { type: "string" },
                  section5: { type: "string" },
                  section6: { type: "string" },
                  status: { type: "string", enum: ["draft", "submitted", "pending_review", "approved", "rejected"] },
                },
                required: ["systemId"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Assessment saved" },
          "400": { description: "Invalid request" },
          "401": { description: "Unauthorized" },
          "403": { description: "Tier not allowed" },
        },
      },
    },
    
    "/api/health": {
      get: {
        summary: "Health Check",
        description: "Check application and database health",
        responses: {
          "200": { description: "Healthy", content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" }, database: { type: "string" }, timestamp: { type: "string" } } } } } },
        },
      },
    },
    
    "/api/payment/webhook/creem": {
      post: {
        summary: "Creem Webhook",
        description: "Receive Creem payment webhooks",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { type: "object" } },
          },
        },
        responses: {
          "200": { description: "Webhook processed" },
          "400": { description: "Invalid signature" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "next-auth.session-token",
        description: "NextAuth.js session cookie",
      },
    },
  },
  security: [{ sessionCookie: [] }],
};

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(openApiSpec);
}
