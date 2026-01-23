import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Convert Typesense errors to MCP errors
 */
export function handleTypesenseError(error: unknown): never {
  if (error instanceof Error) {
    // Check for common Typesense error patterns
    const message = error.message.toLowerCase();

    if (message.includes('not found') || message.includes('404')) {
      throw new McpError(ErrorCode.InvalidRequest, `Resource not found: ${error.message}`);
    }

    if (message.includes('unauthorized') || message.includes('401')) {
      throw new McpError(ErrorCode.InvalidRequest, `Authentication failed: ${error.message}`);
    }

    if (message.includes('timeout')) {
      throw new McpError(ErrorCode.InternalError, `Request timeout: ${error.message}`);
    }

    // Generic error
    throw new McpError(ErrorCode.InternalError, `Typesense error: ${error.message}`);
  }

  throw new McpError(ErrorCode.InternalError, 'Unknown error occurred');
}

/**
 * Safely stringify objects for error messages
 */
export function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
