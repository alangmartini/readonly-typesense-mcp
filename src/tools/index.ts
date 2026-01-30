import type { Client } from 'typesense';
import { collectionTools, listCollections, getCollection } from './collections.js';
import { documentTools, searchDocuments, getDocument, exportDocuments, multiSearch } from './documents.js';
import { curationTools, listOverrides, getOverride } from './curations.js';
import { synonymTools, listSynonyms, getSynonym } from './synonyms.js';
import { aliasTools, listAliases, getAlias } from './aliases.js';
import { analyticsTools, listAnalyticsRules, getAnalyticsRule } from './analytics.js';
import { clusterTools, getHealth, getMetrics, getStats, getDebug } from './cluster.js';
import { reviewTools, reviewCollection } from './review.js';

/**
 * All available tool definitions
 */
export const allTools = [
  ...collectionTools,
  ...documentTools,
  ...curationTools,
  ...synonymTools,
  ...aliasTools,
  ...analyticsTools,
  ...clusterTools,
  ...reviewTools,
];

/**
 * Handle tool execution
 */
export async function handleToolCall(client: Client, name: string, args: unknown) {
  switch (name) {
    // Collections
    case 'typesense_list_collections':
      return listCollections(client);
    case 'typesense_get_collection':
      return getCollection(client, args);

    // Documents
    case 'typesense_search':
      return searchDocuments(client, args);
    case 'typesense_get_document':
      return getDocument(client, args);
    case 'typesense_export_documents':
      return exportDocuments(client, args);
    case 'typesense_multi_search':
      return multiSearch(client, args);

    // Overrides
    case 'typesense_list_overrides':
      return listOverrides(client, args);
    case 'typesense_get_override':
      return getOverride(client, args);

    // Synonyms
    case 'typesense_list_synonyms':
      return listSynonyms(client, args);
    case 'typesense_get_synonym':
      return getSynonym(client, args);

    // Aliases
    case 'typesense_list_aliases':
      return listAliases(client);
    case 'typesense_get_alias':
      return getAlias(client, args);

    // Analytics
    case 'typesense_list_analytics_rules':
      return listAnalyticsRules(client);
    case 'typesense_get_analytics_rule':
      return getAnalyticsRule(client, args);

    // Cluster
    case 'typesense_health':
      return getHealth(client);
    case 'typesense_metrics':
      return getMetrics(client);
    case 'typesense_stats':
      return getStats(client);
    case 'typesense_debug':
      return getDebug(client);

    // Review
    case 'typesense_review_collection':
      return reviewCollection(client, args);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
