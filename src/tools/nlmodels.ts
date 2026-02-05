import type { Client } from 'typesense';
import { z } from 'zod';
import { handleTypesenseError } from '../utils/errors.js';

/**
 * Sensitive fields that should be redacted when returning NL model configurations.
 * These contain credentials that shouldn't be exposed in backups/exports.
 */
const SENSITIVE_FIELDS = [
  'api_key',
  'access_token',
  'refresh_token',
  'client_id',
  'client_secret',
];

/**
 * Recursively redact sensitive fields from an object.
 * Replaces sensitive values with "[REDACTED]" to indicate the field exists
 * but the value is hidden for security.
 */
function redactSensitiveFields<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };

  for (const key of Object.keys(result)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      (result as Record<string, unknown>)[key] = '[REDACTED]';
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      (result as Record<string, unknown>)[key] = redactSensitiveFields(
        result[key] as Record<string, unknown>
      );
    }
  }

  return result;
}

/**
 * List all NL search models with credentials redacted
 */
export async function listNLModels(client: Client) {
  try {
    const models = await client.nlSearchModels().retrieve();
    const sanitizedModels = Array.isArray(models)
      ? models.map((model) => redactSensitiveFields(model as unknown as Record<string, unknown>))
      : redactSensitiveFields(models as unknown as Record<string, unknown>);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(sanitizedModels, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

/**
 * Get a specific NL search model by ID
 */
const GetNLModelArgsSchema = z.object({
  model_id: z.string().describe('ID of the NL search model to retrieve'),
});

export async function getNLModel(client: Client, args: unknown) {
  const { model_id } = GetNLModelArgsSchema.parse(args);

  try {
    const model = await client.nlSearchModels(model_id).retrieve();
    const sanitizedModel = redactSensitiveFields(model as unknown as Record<string, unknown>);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(sanitizedModel, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

export const nlModelTools = [
  {
    name: 'typesense_list_nl_models',
    description: 'List all NL search models configured in the cluster (credentials redacted)',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'typesense_get_nl_model',
    description: 'Get a specific NL search model by ID (credentials redacted)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        model_id: { type: 'string', description: 'ID of the NL search model to retrieve' },
      },
      required: ['model_id'],
    },
  },
];
