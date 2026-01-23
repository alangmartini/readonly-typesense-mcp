import type { Client } from 'typesense';
import { handleTypesenseError } from '../utils/errors.js';

/**
 * Get collection schema as a resource
 */
export async function getCollectionResource(client: Client, collectionName: string) {
  try {
    const collection = await client.collections(collectionName).retrieve();
    return {
      contents: [
        {
          uri: `typesense://collections/${collectionName}/schema`,
          mimeType: 'application/json',
          text: JSON.stringify(collection, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

/**
 * Get cluster health as a resource
 */
export async function getHealthResource(client: Client) {
  try {
    const health = await client.health.retrieve();
    return {
      contents: [
        {
          uri: 'typesense://cluster/health',
          mimeType: 'application/json',
          text: JSON.stringify(health, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

/**
 * List available resources
 */
export async function listResources(client: Client) {
  try {
    const collections = await client.collections().retrieve();
    const resources = [
      {
        uri: 'typesense://cluster/health',
        mimeType: 'application/json',
        name: 'Cluster Health',
        description: 'Current health status of the Typesense cluster',
      },
    ];

    // Add collection schema resources
    for (const collection of collections) {
      resources.push({
        uri: `typesense://collections/${collection.name}/schema`,
        mimeType: 'application/json',
        name: `${collection.name} Schema`,
        description: `Schema for the ${collection.name} collection`,
      });
    }

    return resources;
  } catch (error) {
    handleTypesenseError(error);
  }
}

/**
 * Handle resource read requests
 */
export async function handleResourceRead(client: Client, uri: string) {
  const url = new URL(uri);

  if (url.hostname === 'cluster' && url.pathname === '/health') {
    return getHealthResource(client);
  }

  if (url.hostname === 'collections') {
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length === 2 && pathParts[1] === 'schema') {
      return getCollectionResource(client, pathParts[0]);
    }
  }

  throw new Error(`Unknown resource URI: ${uri}`);
}
