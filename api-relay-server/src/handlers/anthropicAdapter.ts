import { Request, Response } from 'express';
import axios from 'axios';
import { createParser } from 'eventsource-parser';

// Convert OpenAI format to Anthropic format
export function convertToAnthropicFormat(openaiRequest: any) {
  const messages = openaiRequest.messages || [];
  
  // Extract system message
  const systemMessage = messages.find((m: any) => m.role === 'system');
  const system = systemMessage ? systemMessage.content : undefined;
  
  // Convert messages (exclude system)
  const anthropicMessages = messages
    .filter((m: any) => m.role !== 'system')
    .map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));
  
  return {
    model: mapModelName(openaiRequest.model),
    messages: anthropicMessages,
    system,
    max_tokens: openaiRequest.max_tokens || 4096,
    temperature: openaiRequest.temperature,
    stream: openaiRequest.stream || false
  };
}

// Map OpenAI model names to Anthropic
function mapModelName(openaiModel: string): string {
  const modelMap: { [key: string]: string } = {
    'claude-3-opus': 'claude-3-opus-20240229',
    'claude-3-sonnet': 'claude-3-sonnet-20240229',
    'claude-3-haiku': 'claude-3-haiku-20240307',
    'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-20241022'
  };
  
  return modelMap[openaiModel] || 'claude-3-5-sonnet-20241022';
}

// Convert Anthropic response to OpenAI format
export function convertToOpenAIFormat(anthropicResponse: any, model: string) {
  return {
    id: `chatcmpl-${generateId()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: anthropicResponse.content[0]?.text || ''
      },
      finish_reason: anthropicResponse.stop_reason || 'stop'
    }],
    usage: {
      prompt_tokens: anthropicResponse.usage?.input_tokens || 0,
      completion_tokens: anthropicResponse.usage?.output_tokens || 0,
      total_tokens: (anthropicResponse.usage?.input_tokens || 0) + (anthropicResponse.usage?.output_tokens || 0)
    }
  };
}

// Handle Anthropic streaming
export async function handleAnthropicStreaming(req: Request, res: Response) {
  const anthropicUrl = 'https://api.anthropic.com/v1/messages';
  const anthropicRequest = convertToAnthropicFormat(req.body);
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  try {
    const response = await axios.post(
      anthropicUrl,
      anthropicRequest,
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'accept': 'text/event-stream'
        },
        responseType: 'stream'
      }
    );
    
    let buffer = '';
    
    response.data.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            res.write(`data: [DONE]\n\n`);
          } else {
            try {
              const parsed = JSON.parse(data);
              
              // Convert Anthropic stream format to OpenAI format
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                const openaiChunk = {
                  id: `chatcmpl-${generateId()}`,
                  object: 'chat.completion.chunk',
                  created: Math.floor(Date.now() / 1000),
                  model: req.body.model,
                  choices: [{
                    index: 0,
                    delta: {
                      content: parsed.delta.text
                    },
                    finish_reason: null
                  }]
                };
                res.write(`data: ${JSON.stringify(openaiChunk)}\n\n`);
              } else if (parsed.type === 'message_stop') {
                // Send final chunk with finish_reason
                const finalChunk = {
                  id: `chatcmpl-${generateId()}`,
                  object: 'chat.completion.chunk',
                  created: Math.floor(Date.now() / 1000),
                  model: req.body.model,
                  choices: [{
                    index: 0,
                    delta: {},
                    finish_reason: 'stop'
                  }]
                };
                res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
                res.write(`data: [DONE]\n\n`);
              }
            } catch (e) {
              console.error('[ANTHROPIC] Parse error:', e);
            }
          }
        }
      }
    });
    
    response.data.on('end', () => {
      res.end();
    });
    
    response.data.on('error', (error: any) => {
      console.error('[ANTHROPIC] Stream error:', error);
      res.end();
    });
    
  } catch (error: any) {
    console.error('[ANTHROPIC] Request error:', error.message);
    res.write(`data: {"error": "${error.message}"}\n\n`);
    res.end();
  }
}

// Handle non-streaming Anthropic request
export async function handleAnthropicRequest(req: Request, res: Response) {
  const anthropicUrl = 'https://api.anthropic.com/v1/messages';
  const anthropicRequest = convertToAnthropicFormat(req.body);
  
  try {
    const response = await axios.post(
      anthropicUrl,
      anthropicRequest,
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );
    
    const openaiResponse = convertToOpenAIFormat(response.data, req.body.model);
    res.json(openaiResponse);
    
  } catch (error: any) {
    console.error('[ANTHROPIC] Request error:', error.response?.data || error.message);
    
    if (error.response?.data) {
      // Convert Anthropic error to OpenAI format
      res.status(error.response.status).json({
        error: {
          message: error.response.data.error?.message || 'Anthropic API error',
          type: 'api_error',
          code: error.response.data.error?.type || 'unknown'
        }
      });
    } else {
      res.status(500).json({
        error: {
          message: error.message,
          type: 'server_error',
          code: 'internal_error'
        }
      });
    }
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}