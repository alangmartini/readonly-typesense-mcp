# Read-Only Typesense MCP Server

A Model Context Protocol (MCP) server providing read-only access to Typesense Cloud. Built with the official `@modelcontextprotocol/sdk` and `typesense` packages.

## Features

- 🔍 **Search Operations**: Full-text search with filters, facets, sorting, and multi-search
- 📚 **Collections**: List and inspect collection schemas
- 📄 **Documents**: Retrieve, search, and export documents
- 🎯 **Curations**: Access search overrides
- 🔤 **Synonyms**: View synonym configurations
- 🏷️ **Aliases**: Manage collection aliases
- 📊 **Analytics**: Access analytics rules
- ⚕️ **Cluster Info**: Health checks, metrics, and statistics
- 🔒 **Read-Only**: All operations are read-only (no write/delete operations)

## Installation

```bash
npm install
npm run build
```

## Configuration

The server looks for configuration in this order:
1. `TYPESENSE_CONFIG_PATH` environment variable
2. `typesense.json` in the current working directory
3. `config/typesense.json` in the current working directory
4. Bundled `config/typesense.json` (relative to the module)

This allows you to simply drop a `typesense.json` file in any project directory and the MCP will use it automatically.

### Config File Format

Create `typesense.json`:

```json
{
  "nodes": [
    {
      "host": "xxx.a1.typesense.net",
      "port": 443,
      "protocol": "https"
    }
  ],
  "nearestNode": {
    "host": "xxx.a1.typesense.net",
    "port": 443,
    "protocol": "https"
  },
  "apiKey": "your-admin-api-key",
  "connectionTimeoutSeconds": 10
}
```

### Environment Variables

- `TYPESENSE_CONFIG_PATH`: Explicit path to config file (overrides auto-discovery)
- `TYPESENSE_API_KEY`: Override API key from config file

### API Key Requirements

While this server only implements read-only operations, it requires an **admin API key** to access certain endpoints like listing collections, overrides, synonyms, etc. Search-only API keys have limited permissions and cannot access collection metadata.

The server is safe to use with admin keys because:
- No write operations are implemented
- No delete operations are implemented
- All operations are strictly read-only
- Perfect for production monitoring and search integration

## Available Tools (18)

### Collections
- `typesense_list_collections` - List all collections with schemas
- `typesense_get_collection` - Get specific collection schema

### Documents
- `typesense_search` - Full-text search with filters, facets, sorting
- `typesense_get_document` - Get document by ID
- `typesense_export_documents` - Export documents as JSONL
- `typesense_multi_search` - Federated search across collections

### Curations/Overrides
- `typesense_list_overrides` - List overrides for collection
- `typesense_get_override` - Get specific override

### Synonyms
- `typesense_list_synonyms` - List synonyms for collection
- `typesense_get_synonym` - Get specific synonym

### Aliases
- `typesense_list_aliases` - List all aliases
- `typesense_get_alias` - Get specific alias

### Analytics
- `typesense_list_analytics_rules` - List analytics rules
- `typesense_get_analytics_rule` - Get specific rule

### Cluster
- `typesense_health` - Node health status
- `typesense_metrics` - RAM/CPU/disk metrics
- `typesense_stats` - API request stats
- `typesense_debug` - Version and state info

## MCP Resources

- `typesense://collections/{name}/schema` - Collection schema
- `typesense://cluster/health` - Cluster health status

## Testing

Test with the MCP Inspector:

```bash
npm run inspect
```

## Claude Code Integration

The MCP auto-discovers `typesense.json` in the current working directory, making it perfect for debugging different Typesense clusters.

### Setup

Create `.mcp.json` in your project root (or copy from this repo):

```json
{
  "mcpServers": {
    "typesense": {
      "command": "node",
      "args": ["/home/alanm/dev/readonly-typesense-mcp/build/index.js"]
    }
  }
}
```

### Usage

1. Copy `.mcp.json` to your project (or symlink it)
2. Create a `typesense.json` with your cluster credentials
3. Start Claude Code - it will detect the MCP and prompt to enable it

```bash
cd /path/to/your/project

# Copy MCP config
cp /home/alanm/dev/readonly-typesense-mcp/.mcp.json .

# Create typesense.json with your cluster credentials
cat > typesense.json << 'EOF'
{
  "nodes": [{"host": "xxx.a1.typesense.net", "port": 443, "protocol": "https"}],
  "apiKey": "your-admin-api-key",
  "connectionTimeoutSeconds": 10
}
EOF

# Start Claude Code
claude
```

Claude Code will detect the `.mcp.json` and ask to enable the Typesense MCP server.

## Claude Desktop Integration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `~/.config/Claude/claude_desktop_config.json` on Linux):

```json
{
  "mcpServers": {
    "typesense": {
      "command": "node",
      "args": ["/home/alanm/dev/readonly-typesense-mcp/build/index.js"]
    }
  }
}
```

## Example Usage

Once integrated with Claude Desktop, you can ask questions like:

- "What collections are available in Typesense?"
- "Search for products with price greater than 100"
- "Show me the schema for the users collection"
- "What's the health status of the Typesense cluster?"
- "Export all documents from the products collection"

## Development

```bash
# Watch mode for development
npm run watch

# Build
npm run build

# Test with inspector
npm run inspect
```

## License

MIT
