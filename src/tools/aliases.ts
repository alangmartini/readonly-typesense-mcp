import type { Client } from 'typesense';
import { z } from 'zod';
import { handleTypesenseError } from '../utils/errors.js';

/**
 * List all collection aliases
 */
export async function listAliases(client: Client) {
  try {
    const aliases = await client.aliases().retrieve();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(aliases, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

/**
 * Get a specific alias
 */
const GetAliasArgsSchema = z.object({
  alias_name: z.string().describe('Name of the alias to retrieve'),
});

export async function getAlias(client: Client, args: unknown) {
  const { alias_name } = GetAliasArgsSchema.parse(args);

  try {
    const alias = await client.aliases(alias_name).retrieve();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(alias, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

export const aliasTools = [
  {
    name: 'typesense_list_aliases',
    description: 'List all collection aliases in the cluster',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'typesense_get_alias',
    description: 'Get a specific collection alias',
    inputSchema: {
      type: 'object' as const,
      properties: {
        alias_name: { type: 'string', description: 'Name of the alias to retrieve' },
      },
      required: ['alias_name'],
    },
  },
];
