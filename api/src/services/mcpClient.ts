import { ClientSecretCredential } from '@azure/identity';

// MCP Server configuration from environment
const getMcpServerUrl = () => process.env.MCP_SERVER_URL || '';

// Fabric credentials from environment (separate from app deployment credentials)
const FABRIC_TENANT_ID = process.env.FABRIC_TENANT_ID || '';
const FABRIC_CLIENT_ID = process.env.FABRIC_CLIENT_ID || '';
const FABRIC_CLIENT_SECRET = process.env.FABRIC_CLIENT_SECRET || '';

// Fabric API scope for authentication
const FABRIC_SCOPE = 'https://api.fabric.microsoft.com/.default';

/**
 * MCP Tool definition
 */
interface McpTool {
  name: string;
  description?: string;
  inputSchema?: any;
}

/**
 * MCP Client for Fabric Data Agent
 * Uses direct HTTP calls to the Fabric MCP endpoint (JSON-RPC style)
 */
export class McpClient {
  private serverUrl: string;
  private tools: McpTool[] = [];
  private isConnected: boolean = false;
  private accessToken: string | null = null;
  private requestId: number = 0;

  constructor(serverUrl?: string) {
    this.serverUrl = serverUrl || getMcpServerUrl();
    console.log(`McpClient initialized with URL: ${this.serverUrl}`);
  }

  /**
   * Get access token for Fabric API using service principal credentials
   */
  private async getAccessToken(): Promise<string> {
    try {
      if (!FABRIC_TENANT_ID || !FABRIC_CLIENT_ID || !FABRIC_CLIENT_SECRET) {
        throw new Error('Fabric credentials not configured: FABRIC_TENANT_ID, FABRIC_CLIENT_ID, FABRIC_CLIENT_SECRET required');
      }

      const credential = new ClientSecretCredential(
        FABRIC_TENANT_ID,
        FABRIC_CLIENT_ID,
        FABRIC_CLIENT_SECRET
      );
      const tokenResponse = await credential.getToken(FABRIC_SCOPE);
      this.accessToken = tokenResponse.token;
      return tokenResponse.token;
    } catch (error) {
      console.error('Failed to get Fabric token:', error);
      throw new Error('Authentication failed with Fabric API');
    }
  }

  /**
   * Make a JSON-RPC request to the MCP server
   */
  private async makeRequest(method: string, params?: Record<string, unknown>): Promise<Record<string, any>> {
    if (!this.accessToken) {
      await this.getAccessToken();
    }

    const requestId = ++this.requestId;
    const body = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params: params || {}
    };

    console.log(`MCP Request [${requestId}]: ${method}`, JSON.stringify(params));

    const response = await fetch(this.serverUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP server error (${response.status}): ${errorText}`);
    }

    const responseText = await response.text();
    console.log(`MCP Response [${requestId}] raw:`, responseText.substring(0, 1000));

    // Try to parse as JSON, handling potential SSE-style responses
    let result: any;
    try {
      // Check if it's an SSE response (starts with 'data:' or 'event:')
      if (responseText.startsWith('data:') || responseText.startsWith('event:')) {
        // Parse SSE data
        const lines = responseText.split('\n');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const jsonStr = line.substring(5).trim();
            if (jsonStr) {
              result = JSON.parse(jsonStr);
              break;
            }
          }
        }
      } else {
        result = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      throw new Error(`Failed to parse MCP response: ${responseText.substring(0, 200)}`);
    }

    console.log(`MCP Response [${requestId}] parsed:`, JSON.stringify(result).substring(0, 500));

    if (result?.error) {
      throw new Error(`MCP error: ${result.error.message || JSON.stringify(result.error)}`);
    }

    return result?.result || result || {};
  }

  /**
   * Connect to the MCP server (authenticate and prepare)
   * Fabric MCP doesn't require initialization - just authenticate
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    console.log('Connecting to MCP server...');
    
    await this.getAccessToken();
    console.log('Token acquired, marking as connected');
    this.isConnected = true;
  }

  /**
   * List available tools from the MCP server
   */
  async listTools(): Promise<McpTool[]> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const result = await this.makeRequest('tools/list', {});
      this.tools = (result?.tools || []) as McpTool[];
      console.log(`Discovered ${this.tools.length} MCP tools:`, this.tools.map(t => t.name));
    } catch (error) {
      console.log('Failed to list tools, will try direct call:', error);
    }
    
    return this.tools;
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(toolName: string, args: Record<string, unknown>): Promise<any> {
    if (!this.isConnected) {
      await this.connect();
    }

    console.log(`Calling tool "${toolName}" with args:`, args);
    
    const result = await this.makeRequest('tools/call', {
      name: toolName,
      arguments: args
    });

    return result;
  }

  /**
   * Send a message/question to the Fabric Data Agent
   * This is the main method for chat functionality
   */
  async sendMessage(message: string): Promise<string> {
    // Connect if not already connected
    if (!this.isConnected) {
      await this.connect();
    }

    // Get available tools if we haven't yet
    if (this.tools.length === 0) {
      await this.listTools();
    }

    // Try calling the first available tool, or use a default tool name
    const toolName = this.tools[0]?.name || 'query';
    
    console.log(`Calling tool "${toolName}" with message: ${message}`);

    try {
      // Try standard MCP tool call - Fabric Data Agent expects 'userQuestion'
      const result = await this.callTool(toolName, {
        userQuestion: message
      });

      // Extract the response content
      if (result?.content && Array.isArray(result.content)) {
        const textContent = result.content
          .filter((item: any) => item.type === 'text')
          .map((item: any) => item.text)
          .join('\n');
        
        return textContent || 'No response from agent';
      }

      // Return result as string
      return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    } catch (error: any) {
      console.error('Tool call failed:', error);
      
      // Try alternative: direct message endpoint
      try {
        const result = await this.makeRequest('message', { content: message });
        return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
      } catch (altError) {
        throw error; // Throw original error
      }
    }
  }

  /**
   * Close the MCP session
   */
  async close(): Promise<void> {
    this.isConnected = false;
    this.tools = [];
    this.accessToken = null;
    console.log('MCP session closed');
  }
}

/**
 * Factory function to create MCP client
 */
export async function createMcpClient(): Promise<McpClient> {
  const serverUrl = getMcpServerUrl();
  
  if (!serverUrl) {
    throw new Error('MCP_SERVER_URL environment variable is not configured');
  }

  if (!FABRIC_TENANT_ID || !FABRIC_CLIENT_ID || !FABRIC_CLIENT_SECRET) {
    throw new Error('Fabric credentials not configured: FABRIC_TENANT_ID, FABRIC_CLIENT_ID, FABRIC_CLIENT_SECRET required');
  }

  return new McpClient(serverUrl);
}

/**
 * Singleton instance for reuse (optional optimization)
 */
let mcpClientInstance: McpClient | null = null;

export async function getMcpClient(): Promise<McpClient> {
  if (!mcpClientInstance) {
    mcpClientInstance = await createMcpClient();
  }
  return mcpClientInstance;
}
