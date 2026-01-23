import type { Client } from 'typesense';
import { z } from 'zod';
import { handleTypesenseError } from '../utils/errors.js';

/**
 * Search documents in a collection
 */
const SearchArgsSchema = z.object({
  collection_name: z.string().describe('Name of the collection to search'),
  q: z.string().describe('Query text to search for'),
  query_by: z.string().describe('Comma-separated list of fields to search'),
  filter_by: z.string().optional().describe('Filter conditions'),
  sort_by: z.string().optional().describe('Sorting criteria'),
  facet_by: z.string().optional().describe('Comma-separated list of fields to facet'),
  max_facet_values: z.number().optional().describe('Maximum number of facet values to return'),
  page: z.number().optional().default(1).describe('Page number for pagination'),
  per_page: z.number().optional().default(10).describe('Number of results per page'),
  include_fields: z.string().optional().describe('Comma-separated list of fields to include'),
  exclude_fields: z.string().optional().describe('Comma-separated list of fields to exclude'),
  highlight_fields: z.string().optional().describe('Comma-separated list of fields to highlight'),
  prefix: z.boolean().optional().describe('Enable prefix searching'),
  infix: z.string().optional().describe('Enable infix searching'),
  num_typos: z.number().optional().describe('Number of typos to tolerate'),
});

export async function searchDocuments(client: Client, args: unknown) {
  const params = SearchArgsSchema.parse(args);
  const { collection_name, ...searchParams } = params;

  try {
    const results = await client.collections(collection_name).documents().search(searchParams as any);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

/**
 * Get a document by ID
 */
const GetDocumentArgsSchema = z.object({
  collection_name: z.string().describe('Name of the collection'),
  document_id: z.string().describe('ID of the document to retrieve'),
});

export async function getDocument(client: Client, args: unknown) {
  const { collection_name, document_id } = GetDocumentArgsSchema.parse(args);

  try {
    const document = await client.collections(collection_name).documents(document_id).retrieve();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(document, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

/**
 * Export documents from a collection
 */
const ExportDocumentsArgsSchema = z.object({
  collection_name: z.string().describe('Name of the collection'),
  filter_by: z.string().optional().describe('Filter conditions for export'),
  include_fields: z.string().optional().describe('Comma-separated list of fields to include'),
  exclude_fields: z.string().optional().describe('Comma-separated list of fields to exclude'),
});

export async function exportDocuments(client: Client, args: unknown) {
  const { collection_name, ...exportParams } = ExportDocumentsArgsSchema.parse(args);

  try {
    const results = await client.collections(collection_name).documents().export(exportParams);
    return {
      content: [
        {
          type: 'text' as const,
          text: results,
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

/**
 * Perform a multi-search across multiple collections
 */
const MultiSearchArgsSchema = z.object({
  searches: z.array(z.object({
    collection: z.string(),
    q: z.string(),
    query_by: z.string(),
    filter_by: z.string().optional(),
    sort_by: z.string().optional(),
    per_page: z.number().optional(),
  })).describe('Array of search queries to execute'),
});

export async function multiSearch(client: Client, args: unknown) {
  const { searches } = MultiSearchArgsSchema.parse(args);

  try {
    const searchRequests = {
      searches: searches.map(search => ({
        collection: search.collection,
        q: search.q,
        query_by: search.query_by,
        filter_by: search.filter_by,
        sort_by: search.sort_by,
        per_page: search.per_page || 10,
      })),
    };

    const results = await client.multiSearch.perform(searchRequests);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

export const documentTools = [
  {
    name: 'typesense_search',
    description: 'Search documents in a collection with filtering, faceting, and sorting',
    inputSchema: {
      type: 'object' as const,
      properties: {
        collection_name: { type: 'string', description: 'Name of the collection to search' },
        q: { type: 'string', description: 'Query text to search for' },
        query_by: { type: 'string', description: 'Comma-separated list of fields to search' },
        filter_by: { type: 'string', description: 'Filter conditions (e.g., "status:=active && price:>100")' },
        sort_by: { type: 'string', description: 'Sorting criteria (e.g., "price:desc")' },
        facet_by: { type: 'string', description: 'Comma-separated list of fields to facet' },
        max_facet_values: { type: 'number', description: 'Maximum number of facet values to return' },
        page: { type: 'number', description: 'Page number for pagination', default: 1 },
        per_page: { type: 'number', description: 'Number of results per page', default: 10 },
        include_fields: { type: 'string', description: 'Comma-separated list of fields to include' },
        exclude_fields: { type: 'string', description: 'Comma-separated list of fields to exclude' },
        highlight_fields: { type: 'string', description: 'Comma-separated list of fields to highlight' },
        prefix: { type: 'boolean', description: 'Enable prefix searching' },
        infix: { type: 'string', description: 'Enable infix searching (off, always, fallback)' },
        num_typos: { type: 'number', description: 'Number of typos to tolerate (0-2)' },
      },
      required: ['collection_name', 'q', 'query_by'],
    },
  },
  {
    name: 'typesense_get_document',
    description: 'Get a specific document by its ID',
    inputSchema: {
      type: 'object' as const,
      properties: {
        collection_name: { type: 'string', description: 'Name of the collection' },
        document_id: { type: 'string', description: 'ID of the document to retrieve' },
      },
      required: ['collection_name', 'document_id'],
    },
  },
  {
    name: 'typesense_export_documents',
    description: 'Export documents from a collection as JSONL',
    inputSchema: {
      type: 'object' as const,
      properties: {
        collection_name: { type: 'string', description: 'Name of the collection' },
        filter_by: { type: 'string', description: 'Filter conditions for export' },
        include_fields: { type: 'string', description: 'Comma-separated list of fields to include' },
        exclude_fields: { type: 'string', description: 'Comma-separated list of fields to exclude' },
      },
      required: ['collection_name'],
    },
  },
  {
    name: 'typesense_multi_search',
    description: 'Perform federated search across multiple collections',
    inputSchema: {
      type: 'object' as const,
      properties: {
        searches: {
          type: 'array',
          description: 'Array of search queries to execute',
          items: {
            type: 'object',
            properties: {
              collection: { type: 'string', description: 'Collection name' },
              q: { type: 'string', description: 'Query text' },
              query_by: { type: 'string', description: 'Fields to search' },
              filter_by: { type: 'string', description: 'Filter conditions' },
              sort_by: { type: 'string', description: 'Sorting criteria' },
              per_page: { type: 'number', description: 'Results per page' },
            },
            required: ['collection', 'q', 'query_by'],
          },
        },
      },
      required: ['searches'],
    },
  },
];
