import type { Client } from 'typesense';
import { handleTypesenseError } from '../utils/errors.js';

/**
 * Get cluster health status
 */
export async function getHealth(client: Client) {
  try {
    const health = await client.health.retrieve();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(health, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

/**
 * Get cluster metrics (RAM, CPU, disk usage)
 */
export async function getMetrics(client: Client) {
  try {
    const metrics = await client.metrics.retrieve();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(metrics, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

/**
 * Get API statistics
 */
export async function getStats(client: Client) {
  try {
    const stats = await client.stats.retrieve();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

/**
 * Get debug information (version, state)
 */
export async function getDebug(client: Client) {
  try {
    const debug = await client.debug.retrieve();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(debug, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

export const clusterTools = [
  {
    name: 'typesense_health',
    description: 'Get the health status of all Typesense nodes in the cluster',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'typesense_metrics',
    description: 'Get resource metrics (RAM, CPU, disk usage) for the cluster',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'typesense_stats',
    description: 'Get API request statistics for the cluster',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'typesense_debug',
    description: 'Get debug information including version and state',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];
