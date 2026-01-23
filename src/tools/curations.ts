import type { Client } from 'typesense';
import { z } from 'zod';
import { handleTypesenseError } from '../utils/errors.js';

/**
 * List all overrides (curations) for a collection
 */
const ListOverridesArgsSchema = z.object({
  collection_name: z.string().describe('Name of the collection'),
});

export async function listOverrides(client: Client, args: unknown) {
  const { collection_name } = ListOverridesArgsSchema.parse(args);

  try {
    const overrides = await client.collections(collection_name).overrides().retrieve();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(overrides, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

/**
 * Get a specific override by ID
 */
const GetOverrideArgsSchema = z.object({
  collection_name: z.string().describe('Name of the collection'),
  override_id: z.string().describe('ID of the override to retrieve'),
});

export async function getOverride(client: Client, args: unknown) {
  const { collection_name, override_id } = GetOverrideArgsSchema.parse(args);

  try {
    const override = await client.collections(collection_name).overrides(override_id).retrieve();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(override, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

export const curationTools = [
  {
    name: 'typesense_list_overrides',
    description: 'List all search overrides (curations) for a collection',
    inputSchema: {
      type: 'object' as const,
      properties: {
        collection_name: { type: 'string', description: 'Name of the collection' },
      },
      required: ['collection_name'],
    },
  },
  {
    name: 'typesense_get_override',
    description: 'Get a specific search override by its ID',
    inputSchema: {
      type: 'object' as const,
      properties: {
        collection_name: { type: 'string', description: 'Name of the collection' },
        override_id: { type: 'string', description: 'ID of the override to retrieve' },
      },
      required: ['collection_name', 'override_id'],
    },
  },
];
