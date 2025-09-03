import { Request, Response, NextFunction } from 'express';

interface UsageData {
  apiKey: string;
  team: string;
  user: string;
  timestamp: Date;
  endpoint: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cost?: number;
  latency?: number;
  statusCode?: number;
  error?: string;
}

// In-memory storage for MVP (replace with database in production)
const usageStore: UsageData[] = [];

export function usageTracker(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Store original json method
  const originalJson = res.json;
  
  // Override json method to capture response
  res.json = function(data: any) {
    const latency = Date.now() - startTime;
    
    // Extract usage information
    const usage: UsageData = {
      apiKey: req.apiKey || 'unknown',
      team: req.team || 'unknown',
      user: req.userId || 'unknown',
      timestamp: new Date(),
      endpoint: req.path,
      model: req.body?.model,
      latency,
      statusCode: res.statusCode
    };

    // Extract token usage from OpenAI response
    if (data?.usage) {
      usage.promptTokens = data.usage.prompt_tokens;
      usage.completionTokens = data.usage.completion_tokens;
      usage.totalTokens = data.usage.total_tokens;
      
      // Calculate approximate cost (GPT-4 pricing example)
      const costPerPromptToken = 0.00003;
      const costPerCompletionToken = 0.00006;
      usage.cost = (usage.promptTokens || 0) * costPerPromptToken + 
                   (usage.completionTokens || 0) * costPerCompletionToken;
    }

    // Store usage data
    usageStore.push(usage);
    
    // Log usage
    console.log(`[USAGE] ${usage.team}/${usage.user} - ${usage.endpoint} - ${usage.model} - Tokens: ${usage.totalTokens} - Latency: ${usage.latency}ms`);
    
    // Print usage stats every 10 requests
    if (usageStore.length % 10 === 0) {
      printUsageStats();
    }
    
    // Call original json method
    return originalJson.call(this, data);
  };
  
  next();
}

function printUsageStats() {
  const totalRequests = usageStore.length;
  const totalTokens = usageStore.reduce((sum, u) => sum + (u.totalTokens || 0), 0);
  const totalCost = usageStore.reduce((sum, u) => sum + (u.cost || 0), 0);
  const avgLatency = usageStore.reduce((sum, u) => sum + (u.latency || 0), 0) / totalRequests;
  
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                    USAGE STATISTICS                   ║
╠═══════════════════════════════════════════════════════╣
║  Total Requests: ${totalRequests.toString().padEnd(37)}║
║  Total Tokens:   ${totalTokens.toString().padEnd(37)}║
║  Total Cost:     $${totalCost.toFixed(4).padEnd(36)}║
║  Avg Latency:    ${avgLatency.toFixed(0)}ms${' '.repeat(35 - avgLatency.toFixed(0).length)}║
╚═══════════════════════════════════════════════════════╝
  `);
}

// Export function to get usage stats
export function getUsageStats() {
  return usageStore;
}