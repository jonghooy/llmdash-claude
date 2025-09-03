import { Request, Response } from 'express';
import axios from 'axios';
import { createParser } from 'eventsource-parser';
import { handleAnthropicRequest, handleAnthropicStreaming } from './anthropicAdapter';

export async function chatCompletionsHandler(req: Request, res: Response) {
  try {
    const startTime = Date.now();
    
    console.log(`[RELAY] Chat completion request:`, {
      model: req.body.model,
      messages: req.body.messages?.length,
      stream: req.body.stream,
      team: req.team,
      user: req.userId
    });

    // Check if it's a Claude model
    const isClaudeModel = req.body.model?.includes('claude');
    
    if (isClaudeModel) {
      // Handle Anthropic Claude requests
      console.log(`[RELAY] Routing to Anthropic for model: ${req.body.model}`);
      if (req.body.stream === true) {
        await handleAnthropicStreaming(req, res);
      } else {
        await handleAnthropicRequest(req, res);
      }
    } else {
      // Handle OpenAI requests
      const isStreaming = req.body.stream === true;
      const openaiUrl = `${process.env.OPENAI_BASE_URL || 'https://api.openai.com'}/v1/chat/completions`;
      
      if (isStreaming) {
        await handleStreamingResponse(req, res, openaiUrl);
      } else {
        await handleRegularResponse(req, res, openaiUrl);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[RELAY] Request completed in ${duration}ms`);
    
  } catch (error: any) {
    console.error('[RELAY] Error:', error.message);
    
    // If error from OpenAI, pass it through
    if (error.response?.data) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    // Otherwise, return generic error in OpenAI format
    res.status(500).json({
      error: {
        message: error.message || 'Internal relay server error',
        type: 'server_error',
        code: 'internal_error'
      }
    });
  }
}

async function handleRegularResponse(req: Request, res: Response, openaiUrl: string) {
  const response = await axios.post(
    openaiUrl,
    req.body,
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  res.json(response.data);
}

async function handleStreamingResponse(req: Request, res: Response, openaiUrl: string) {
  // Set SSE headers for Cursor
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
  
  try {
    const response = await axios.post(
      openaiUrl,
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        responseType: 'stream'
      }
    );
    
    let tokenCount = 0;
    
    // Create SSE parser
    const parser = createParser({
      onEvent: (event) => {
        const data = event.data;
        
        // Send data to client in SSE format
        if (data === '[DONE]') {
          res.write(`data: [DONE]\n\n`);
          console.log(`[STREAM] Completed. Total chunks sent.`);
        } else {
          try {
            const parsed = JSON.parse(data);
            // Count tokens (rough estimate)
            if (parsed.choices?.[0]?.delta?.content) {
              tokenCount += parsed.choices[0].delta.content.split(' ').length;
            }
            // Forward to client
            res.write(`data: ${data}\n\n`);
          } catch (e) {
            // Forward as-is if not JSON
            res.write(`data: ${data}\n\n`);
          }
        }
      }
    });
    
    // Process stream
    response.data.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      // Parse SSE format
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          parser.feed(`event: message\ndata: ${data}\n\n`);
        }
      }
    });
    
    response.data.on('end', () => {
      console.log(`[STREAM] Stream ended. Estimated tokens: ${tokenCount}`);
      res.end();
    });
    
    response.data.on('error', (error: any) => {
      console.error('[STREAM] Stream error:', error);
      res.write(`data: {"error": "${error.message}"}\n\n`);
      res.end();
    });
    
  } catch (error: any) {
    console.error('[STREAM] Setup error:', error.message);
    res.write(`data: {"error": {"message": "${error.message}", "type": "stream_error"}}\n\n`);
    res.end();
  }
}