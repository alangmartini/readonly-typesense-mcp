import type { TypesenseConfig } from '../config/schema.js';

/**
 * Stored config info for diagnostic purposes
 */
let configInfo: {
  config: TypesenseConfig;
  configPath: string;
} | null = null;

/**
 * Store the loaded config info for diagnostic access
 */
export function setConfigInfo(config: TypesenseConfig, configPath: string) {
  configInfo = { config, configPath };
}

/**
 * Get the current configuration info (for diagnostics)
 */
export function getConfigInfo() {
  if (!configInfo) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ error: 'Config not loaded' }, null, 2),
        },
      ],
    };
  }

  const { config, configPath } = configInfo;

  // Mask API key for security (show first 4 and last 4 chars)
  const maskedApiKey = config.apiKey.length > 8
    ? `${config.apiKey.slice(0, 4)}...${config.apiKey.slice(-4)}`
    : '****';

  const diagnosticInfo = {
    configPath,
    cwd: process.cwd(),
    nodes: config.nodes.map(node => ({
      host: node.host,
      port: node.port,
      protocol: node.protocol,
      path: node.path,
    })),
    nearestNode: config.nearestNode ? {
      host: config.nearestNode.host,
      port: config.nearestNode.port,
      protocol: config.nearestNode.protocol,
    } : undefined,
    apiKey: maskedApiKey,
    connectionTimeoutSeconds: config.connectionTimeoutSeconds,
    numRetries: config.numRetries,
    retryIntervalSeconds: config.retryIntervalSeconds,
    healthcheckIntervalSeconds: config.healthcheckIntervalSeconds,
    logLevel: config.logLevel,
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(diagnosticInfo, null, 2),
      },
    ],
  };
}

export const configTools = [
  {
    name: 'typesense_config_info',
    description: 'Get diagnostic information about the loaded Typesense configuration including the config file path, current working directory, host(s), and masked API key. Useful for debugging connection issues.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];
