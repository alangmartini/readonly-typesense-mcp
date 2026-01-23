#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { loadConfig } from './config/index.js';
import { createTypesenseClient } from './client/typesense.js';
import { allTools, handleToolCall } from './tools/index.js';
import { listResources, handleResourceRead } from './resources/index.js';

/**
 * Main server initialization
 */
async function main() {
  // Load configuration
  const config = loadConfig();

  // Create Typesense client
  const client = createTypesenseClient(config);

  // Create MCP server
  const server = new Server(
    {
      name: 'readonly-typesense-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: allTools,
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return handleToolCall(client, name, args);
  });

  // Handle resource listing
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = await listResources(client);
    return { resources };
  });

  // Handle resource reads
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    return handleResourceRead(client, uri);
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used for MCP communication)
  console.error('Read-only Typesense MCP server running on stdio');
}

// Run the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
