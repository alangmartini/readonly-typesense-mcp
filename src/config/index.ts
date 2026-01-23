import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TypesenseConfigSchema, type TypesenseConfig } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load and validate Typesense configuration from file or environment variables
 */
export function loadConfig(): TypesenseConfig {
  const configPath = process.env.TYPESENSE_CONFIG_PATH ||
    resolve(__dirname, '../../config/typesense.json');

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
