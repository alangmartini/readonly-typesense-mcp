import { z } from 'zod';

/**
 * Zod schema for Typesense node configuration
 */
const NodeSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().int().positive(),
  protocol: z.enum(['http', 'https']),
  path: z.string().optional(),
});

/**
 * Zod schema for complete Typesense configuration
 */
export const TypesenseConfigSchema = z.object({
  nodes: z.array(NodeSchema).min(1, 'At least one node is required'),
  nearestNode: NodeSchema.optional(),
  apiKey: z.string().min(1, 'API key is required'),
  connectionTimeoutSeconds: z.number().int().positive().default(10),
  numRetries: z.number().int().nonnegative().default(3),
  retryIntervalSeconds: z.number().positive().default(0.1),
  healthcheckIntervalSeconds: z.number().int().positive().default(60),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type TypesenseConfig = z.infer<typeof TypesenseConfigSchema>;
export type NodeConfig = z.infer<typeof NodeSchema>;
