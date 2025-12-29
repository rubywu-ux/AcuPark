# Using Figma MCP in AcuPark

This project utilizes the **Model Context Protocol (MCP)** to integrate Figma directly into the development workflow. This allows the AI coding assistant to read design data directly from Figma files and generate pixel-perfect code.

## 🛠️ Setup

The MCP configuration is located in `mcp_config.json` in the root directory.

### 1. Get a Figma Personal Access Token
1.  Go to Figma Settings -> Account.
2.  Scroll to "Personal access tokens".
3.  Create a new token and copy it.

### 2. Configure `mcp_config.json`
Ensure your `mcp_config.json` includes the `figma-reader` server with your API key:

```json
{
  "mcpServers": {
    "figma-reader": {
      "command": "npx",
      "args": [
        "-y",
        "figma-developer-mcp",
        "--figma-api-key=YOUR_FIGMA_TOKEN_HERE",
        "--stdio"
      ]
    }
  }
}
```

> **Note:** In this project, the API key is pre-configured. For a new project, replace `YOUR_FIGMA_TOKEN_HERE` with your actual token.

## 🚀 How We Used It

In the development of AcuPark, we used the Figma MCP to bridge the gap between design and code:

1.  **Context Retrieval**: We asked the AI to "read the Figma file" provided via a URL or File ID.
2.  **Node Inspection**: The AI used the `figma-reader` tool to inspect specific nodes (frames, components) in the design.
3.  **Code Generation**: Based on the JSON data returned by the MCP server (colors, spacing, typography, layout), the AI generated the Tailwind CSS and React components.

### Example Prompt
> "Use the `figma-reader` to inspect the 'Reservation Page' frame in the provided Figma file. Then, generate a React component using Tailwind CSS that matches the design exactly."

## 📚 Resources
-   [MCP Explained](./MCP_EXPLAINED.md) - Learn more about the underlying technology.
-   [Figma Developer MCP](https://www.npmjs.com/package/figma-developer-mcp) - The specific tool used.
