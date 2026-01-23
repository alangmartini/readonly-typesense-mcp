import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TypesenseConfigSchema, type TypesenseConfig } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Find the config file path using the following priority:
 * 1. TYPESENSE_CONFIG_PATH environment variable
 * 2. typesense.json in current working directory
 * 3. config/typesense.json in current working directory
 * 4. Bundled config/typesense.json (relative to this module)
 */
function findConfigPath(): string {
  // 1. Environment variable takes priority
  if (process.env.TYPESENSE_CONFIG_PATH) {
    return process.env.TYPESENSE_CONFIG_PATH;
  }

  // 2. Check for typesense.json in current working directory
  const cwdConfig = resolve(process.cwd(), 'typesense.json');
  if (existsSync(cwdConfig)) {
    return cwdConfig;
  }

  // 3. Check for config/typesense.json in current working directory
  const cwdConfigDir = resolve(process.cwd(), 'config', 'typesense.json');
  if (existsSync(cwdConfigDir)) {
    return cwdConfigDir;
  }

  // 4. Fall back to bundled config
  return resolve(__dirname, '../../config/typesense.json');
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
