import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { TypesenseConfigSchema, type TypesenseConfig } from './schema.js';

/**
 * Find the config file path using the following priority:
 * 1. TYPESENSE_CONFIG_PATH environment variable
 * 2. typesense.json in current working directory
 *
 * If no config is found, throws an error with setup instructions.
 */
function findConfigPath(): string {
  // 1. Environment variable takes priority
  if (process.env.TYPESENSE_CONFIG_PATH) {
    const envPath = process.env.TYPESENSE_CONFIG_PATH;
    if (!existsSync(envPath)) {
      throw new Error(
        `Config file not found at TYPESENSE_CONFIG_PATH: ${envPath}`
      );
    }
    return envPath;
  }

  // 2. Check for typesense.json in current working directory
  const cwdConfig = resolve(process.cwd(), 'typesense.json');
  if (existsSync(cwdConfig)) {
    return cwdConfig;
  }

  // No config found - provide helpful error message
  throw new Error(
    `Typesense configuration not found. Please either:\n` +
    `  1. Create a typesense.json file in your project root with:\n` +
    `     {\n` +
    `       "nodes": [{ "host": "localhost", "port": 8108, "protocol": "http" }],\n` +
    `       "apiKey": "your-api-key"\n` +
    `     }\n` +
    `  2. Or set TYPESENSE_CONFIG_PATH environment variable in .mcp.json:\n` +
    `     "env": { "TYPESENSE_CONFIG_PATH": "/path/to/typesense.json" }\n` +
    `\n` +
    `  Searched in: ${cwdConfig}`
  );
}

/**
 * Load and validate Typesense configuration from file or environment variables
 */
export function loadConfig(): TypesenseConfig {
  const configPath = findConfigPath();

  let configData: unknown;

  try {
    const configFile = readFileSync(configPath, 'utf-8');
    configData = JSON.parse(configFile);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load config from ${configPath}: ${error.message}`);
    }
    throw error;
  }

  // Allow API key override from environment variable
  if (process.env.TYPESENSE_API_KEY) {
    if (typeof configData === 'object' && configData !== null) {
      (configData as Record<string, unknown>).apiKey = process.env.TYPESENSE_API_KEY;
    }
  }

  // Validate configuration
  try {
    return TypesenseConfigSchema.parse(configData);
  } catch (error) {
    throw new Error(`Invalid Typesense configuration: ${error}`);
  }
}
