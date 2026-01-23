import type { Client } from 'typesense';
import { z } from 'zod';
import { handleTypesenseError } from '../utils/errors.js';

/**
 * List all synonyms for a collection
 */
const ListSynonymsArgsSchema = z.object({
  collection_name: z.string().describe('Name of the collection'),
});

export async function listSynonyms(client: Client, args: unknown) {
  const { collection_name } = ListSynonymsArgsSchema.parse(args);

  try {
    const synonyms = await client.collections(collection_name).synonyms().retrieve();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(synonyms, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

/**
 * Get a specific synonym by ID
 */
const GetSynonymArgsSchema = z.object({
  collection_name: z.string().describe('Name of the collection'),
  synonym_id: z.string().describe('ID of the synonym to retrieve'),
});

export async function getSynonym(client: Client, args: unknown) {
  const { collection_name, synonym_id } = GetSynonymArgsSchema.parse(args);

  try {
    const synonym = await client.collections(collection_name).synonyms(synonym_id).retrieve();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(synonym, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

export const synonymTools = [
  {
    name: 'typesense_list_synonyms',
    description: 'List all synonyms configured for a collection',
    inputSchema: {
      type: 'object' as const,
      properties: {
        collection_name: { type: 'string', description: 'Name of the collection' },
      },
      required: ['collection_name'],
    },
  },
  {
    name: 'typesense_get_synonym',
    description: 'Get a specific synonym by its ID',
    inputSchema: {
      type: 'object' as const,
      properties: {
        collection_name: { type: 'string', description: 'Name of the collection' },
        synonym_id: { type: 'string', description: 'ID of the synonym to retrieve' },
      },
      required: ['collection_name', 'synonym_id'],
    },
  },
];
