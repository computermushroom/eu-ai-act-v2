declare module "swagger-ui-react" {
  import type { ComponentType } from "react";

  interface SwaggerUIProps {
    spec?: Record<string, unknown>;
    url?: string;
    docExpansion?: "list" | "full" | "none";
    defaultModelExpandDepth?: number;
    defaultModelsExpandDepth?: number;
    displayOperationId?: boolean;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    supportedSubmitMethods?: string[];
    onComplete?: () => void;
    requestInterceptor?: (req: unknown) => unknown;
    responseInterceptor?: (res: unknown) => unknown;
    presets?: unknown[];
    plugins?: unknown[];
    [key: string]: unknown;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}

declare module "swagger-ui-react/swagger-ui.css" {
  // CSS module, no exports
}
