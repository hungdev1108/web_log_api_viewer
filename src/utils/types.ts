// TypeScript interfaces cho OpenAPI 3.0

export type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "options"
  | "head";

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description?: string;
    version: string;
    contact?: {
      name?: string;
      email?: string;
    };
  };
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
  tags?: Array<{
    name: string;
    description?: string;
  }>;
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  patch?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
}

export interface Operation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: Record<string, Response>;
}

export interface Parameter {
  name: string;
  in: "query" | "header" | "path" | "cookie";
  description?: string;
  required?: boolean;
  schema?: Schema;
}

export interface RequestBody {
  description?: string;
  content?: Record<string, Content>;
  required?: boolean;
}

export interface Content {
  schema?: Schema | { $ref: string };
  example?: any;
  examples?: Record<string, any>;
}

export interface Response {
  description: string;
  content?: Record<string, Content>;
}

export interface Schema {
  type?: string;
  format?: string;
  $ref?: string;
  items?: Schema;
  properties?: Record<string, Schema>;
  required?: string[];
  nullable?: boolean;
  enum?: any[];
  default?: any;
  example?: any;
}

// Transformed types cho UI
export interface ApiEndpoint {
  id: string;
  method: Uppercase<HttpMethod>;
  path: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: Record<string, Response>;
}

export interface GroupedEndpoints {
  [tag: string]: ApiEndpoint[];
}
