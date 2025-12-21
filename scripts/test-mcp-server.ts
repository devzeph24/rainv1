/**
 * Comprehensive test script for MCP server tools
 * 
 * Usage:
 *   npm run test:mcp-server
 * 
 * Or with specific test:
 *   TEST_TOOL="create_virtual_card" npm run test:mcp-server
 */

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000/api/mcp';

interface McpRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, any>;
  };
}

async function callMcpTool(toolName: string, args: Record<string, any> = {}) {
  const request: McpRequest = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args,
    },
  };

  console.log(`\n🔧 Calling tool: ${toolName}`);
  console.log(`   Arguments:`, JSON.stringify(args, null, 2));

  try {
    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle SSE format (text/event-stream)
    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('text/event-stream')) {
      const text = await response.text();
      // Parse SSE format: extract JSON from "data: {...}" lines
      const lines = text.split('\n');
      const dataLine = lines.find(line => line.startsWith('data: '));
      if (dataLine) {
        data = JSON.parse(dataLine.substring(6));
      } else {
        throw new Error('No data line found in SSE response');
      }
    } else {
      data = await response.json();
    }
    
    if (data.error) {
      console.error(`❌ Error:`, data.error);
      return { success: false, error: data.error };
    }

    console.log(`✅ Success!`);
    if (data.result?.content) {
      const content = data.result.content[0];
      if (content.type === 'text') {
        try {
          const parsed = JSON.parse(content.text);
          console.log(`   Result:`, JSON.stringify(parsed, null, 2));
          return { success: true, data: parsed };
        } catch {
          console.log(`   Result:`, content.text);
          return { success: true, data: content.text };
        }
      }
    }

    return { success: true, data: data.result };
  } catch (error) {
    console.error(`❌ Failed:`, error instanceof Error ? error.message : String(error));
    return { success: false, error };
  }
}

async function listTools() {
  console.log('\n📋 Listing available tools...');
  
  const request = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/list',
  };

  try {
    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    
    if (data.result?.tools) {
      console.log(`\n✅ Found ${data.result.tools.length} tools:\n`);
      data.result.tools.forEach((tool: any, index: number) => {
        console.log(`${index + 1}. ${tool.name}`);
        console.log(`   ${tool.description}`);
      });
      return data.result.tools;
    }
    
    return [];
  } catch (error) {
    console.error(`❌ Failed to list tools:`, error);
    return [];
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 MCP Server Test Suite');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Server URL: ${MCP_SERVER_URL}\n`);

  // Check if server is running
  try {
    const healthCheck = await fetch(MCP_SERVER_URL, { method: 'GET' });
    if (!healthCheck.ok && healthCheck.status !== 405) {
      throw new Error(`Server returned ${healthCheck.status}`);
    }
    console.log('✅ MCP server is running\n');
  } catch (error) {
    console.error('❌ MCP server is not accessible!');
    console.error('   Make sure the dev server is running: npm run dev');
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // List tools
  const tools = await listTools();

  const testTool = process.env.TEST_TOOL;
  
  if (testTool) {
    // Test specific tool
    console.log(`\n🎯 Testing specific tool: ${testTool}`);
    
    // Get test arguments from env or use defaults
    const testArgs: Record<string, any> = {};
    
    // Common test arguments
    if (process.env.TEST_USER_ID) testArgs.userId = process.env.TEST_USER_ID;
    if (process.env.TEST_CARD_ID) testArgs.cardId = process.env.TEST_CARD_ID;
    if (process.env.TEST_EMAIL) testArgs.email = process.env.TEST_EMAIL;
    if (process.env.TEST_LIMIT_AMOUNT) testArgs.limitAmount = parseInt(process.env.TEST_LIMIT_AMOUNT);
    
    await callMcpTool(testTool, testArgs);
  } else {
    // Run all tests
    console.log('\n🧪 Running test suite...\n');

    // Test 1: List users (should work even with empty database)
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Test 1: List Users');
    console.log('═══════════════════════════════════════════════════════');
    await callMcpTool('list_users', { limit: 5 });

    // Test 2: Initiate user application (if not in test mode, this will create a real application)
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Test 2: Initiate User Application');
    console.log('═══════════════════════════════════════════════════════');
    const appResult = await callMcpTool('initiate_user_application', {
      firstName: 'Test',
      lastName: 'User',
      email: `test-${Date.now()}@example.com`,
    });

    let testUserId: string | undefined;
    if (appResult.success && appResult.data?.userId) {
      testUserId = appResult.data.userId;
      console.log(`\n✅ Got test user ID: ${testUserId}`);
    }

    // Test 3: Get user by email
    if (appResult.success && appResult.data?.email) {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('Test 3: Get User By Email');
      console.log('═══════════════════════════════════════════════════════');
      await callMcpTool('get_user_by_email', {
        email: appResult.data.email,
      });
    }

    // Test 4: Get user balance
    if (testUserId) {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('Test 4: Get User Balance');
      console.log('═══════════════════════════════════════════════════════');
      await callMcpTool('get_user_balance', { userId: testUserId });
    }

    // Test 5: Create virtual card (will use test card if USE_TEST_CARDS=true)
    if (testUserId) {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('Test 5: Create Virtual Card');
      console.log('═══════════════════════════════════════════════════════');
      const cardResult = await callMcpTool('create_virtual_card', {
        userId: testUserId,
        limitAmount: 10000, // $100.00
        limitFrequency: 'perAuthorization',
        displayName: 'Test Card',
        status: 'active',
      });

      let testCardId: string | undefined;
      if (cardResult.success && cardResult.data?.cardId) {
        testCardId = cardResult.data.cardId;
        console.log(`\n✅ Got test card ID: ${testCardId}`);
      }

      // Test 6: Get card payment details
      if (testCardId) {
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('Test 6: Get Card Payment Details');
        console.log('═══════════════════════════════════════════════════════');
        await callMcpTool('get_card_payment_details', {
          cardId: testCardId,
          userId: testUserId,
        });
      }

      // Test 7: Get user cards
      if (testUserId) {
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('Test 7: Get User Cards');
        console.log('═══════════════════════════════════════════════════════');
        await callMcpTool('get_user_cards', { userId: testUserId });
      }
    }

    // Test 8: List all cards
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Test 8: List All Cards');
    console.log('═══════════════════════════════════════════════════════');
    await callMcpTool('list_all_cards', { limit: 5 });
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ Test suite completed!');
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});

