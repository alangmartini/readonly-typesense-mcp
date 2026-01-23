import type { Client } from 'typesense';
import { z } from 'zod';
import { handleTypesenseError } from '../utils/errors.js';

/**
 * List all collections with their schemas
 */
export async function listCollections(client: Client) {
  try {
    const collections = await client.collections().retrieve();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(collections, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

/**
 * Get a specific collection schema
 */
const GetCollectionArgsSchema = z.object({
  collection_name: z.string().describe('Name of the collection to retrieve'),
});

export async function getCollection(client: Client, args: unknown) {
  const { collection_name } = GetCollectionArgsSchema.parse(args);

  try {
    const collection = await client.collections(collection_name).retrieve();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(collection, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

export const collectionTools = [
  {
    name: 'typesense_list_collections',
    description: 'List all collections in the Typesense cluster with their schemas',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'typesense_get_collection',
    description: 'Get the schema and configuration of a specific collection',
    inputSchema: {
      type: 'object' as const,
      properties: {
        collection_name: {
          type: 'string',
          description: 'Name of the collection to retrieve',
        },
      },
      required: ['collection_name'],
    },
  },
];
