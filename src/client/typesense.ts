import Typesense from 'typesense';
import type { TypesenseConfig } from '../config/schema.js';

/**
 * Create and configure Typesense client instance
 */
export function createTypesenseClient(config: TypesenseConfig): Typesense.Client {
  return new Typesense.Client({
    nodes: config.nodes,
    nearestNode: config.nearestNode,
    apiKey: config.apiKey,
    connectionTimeoutSeconds: config.connectionTimeoutSeconds,
    numRetries: config.numRetries,
    retryIntervalSeconds: config.retryIntervalSeconds,
    healthcheckIntervalSeconds: config.healthcheckIntervalSeconds,
    logLevel: config.logLevel,
  });
}
