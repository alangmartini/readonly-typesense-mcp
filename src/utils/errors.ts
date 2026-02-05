import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Connection hint to help users diagnose issues
 */
function getConnectionHint(): string {
  return 'Use the typesense_config_info tool to verify your configuration settings.';
}

/**
 * Convert Typesense errors to MCP errors with actionable guidance
 */
export function handleTypesenseError(error: unknown): never {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const originalMessage = error.message;

    // Connection refused - server not running or wrong host/port
    if (message.includes('econnrefused') || message.includes('connection refused')) {
      throw new McpError(
        ErrorCode.InternalError,
        `Connection refused: Typesense server is not reachable. ` +
        `Verify the server is running and the host/port in your config are correct. ` +
        getConnectionHint()
      );
    }

    // DNS resolution failure - wrong hostname
    if (message.includes('enotfound') || message.includes('getaddrinfo')) {
      throw new McpError(
        ErrorCode.InternalError,
        `DNS lookup failed: Cannot resolve the Typesense hostname. ` +
        `Check that the 'host' value in your config is correct (e.g., 'localhost' or a valid domain). ` +
        getConnectionHint()
      );
    }

    // Network unreachable
    if (message.includes('enetunreach') || message.includes('network is unreachable')) {
      throw new McpError(
        ErrorCode.InternalError,
        `Network unreachable: Cannot connect to Typesense server. ` +
        `Check your network connection and firewall settings. ` +
        getConnectionHint()
      );
    }

    // Connection reset
    if (message.includes('econnreset') || message.includes('connection reset')) {
      throw new McpError(
        ErrorCode.InternalError,
        `Connection reset: The Typesense server closed the connection unexpectedly. ` +
        `The server may have restarted or there may be a network issue. ` +
        getConnectionHint()
      );
    }

    // SSL/TLS certificate errors
    if (message.includes('certificate') || message.includes('ssl') || message.includes('unable to verify')) {
      throw new McpError(
        ErrorCode.InternalError,
        `SSL/TLS error: Certificate verification failed. ` +
        `If using HTTPS, ensure the certificate is valid. For local development, you may need to use 'http' protocol. ` +
        getConnectionHint()
      );
    }

    // Timeout - server slow or unreachable
    if (message.includes('timeout') || message.includes('etimedout')) {
      throw new McpError(
        ErrorCode.InternalError,
        `Request timeout: Typesense server did not respond in time. ` +
        `The server may be overloaded, unreachable, or the connectionTimeoutSeconds may be too short. ` +
        getConnectionHint()
      );
    }

    // Authentication failures
    if (message.includes('unauthorized') || message.includes('401') || message.includes('forbidden') || message.includes('403')) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Authentication failed: Invalid or insufficient API key. ` +
        `Verify your API key is correct and has the required permissions. ` +
        getConnectionHint()
      );
    }

    // Resource not found
    if (message.includes('not found') || message.includes('404')) {
      throw new McpError(ErrorCode.InvalidRequest, `Resource not found: ${originalMessage}`);
    }

    // Bad request
    if (message.includes('bad request') || message.includes('400')) {
      throw new McpError(ErrorCode.InvalidRequest, `Bad request: ${originalMessage}`);
    }

    // Server errors
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      throw new McpError(
        ErrorCode.InternalError,
        `Typesense server error: The server encountered an internal error. ` +
        `Check Typesense server logs for details. Original error: ${originalMessage}`
      );
    }

    // Generic error with original message preserved
    throw new McpError(ErrorCode.InternalError, `Typesense error: ${originalMessage}. ${getConnectionHint()}`);
  }

  throw new McpError(ErrorCode.InternalError, `Unknown error occurred. ${getConnectionHint()}`);
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
