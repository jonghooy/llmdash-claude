import { Request, Response } from 'express';
import axios from 'axios';

export async function modelsHandler(req: Request, res: Response) {
  try {
    console.log(`[RELAY] Models request from team=${req.team}, user=${req.userId}`);
    
    // You can customize available models per team/user
    // For MVP, we'll just proxy to OpenAI
    
    const openaiUrl = `${process.env.OPENAI_BASE_URL || 'https://api.openai.com'}/v1/models`;
    
    const response = await axios.get(openaiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });
    
    // Add Claude models to the list
    const claudeModels = [
      {
        id: 'claude-3-5-sonnet',
        object: 'model',
        created: 1729814400,
        owned_by: 'anthropic'
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        object: 'model',
        created: 1729814400,
        owned_by: 'anthropic'
      },
      {
        id: 'claude-3-opus',
        object: 'model',
        created: 1708992000,
        owned_by: 'anthropic'
      },
      {
        id: 'claude-3-sonnet',
        object: 'model',
        created: 1708992000,
        owned_by: 'anthropic'
      },
      {
        id: 'claude-3-haiku',
        object: 'model',
        created: 1709856000,
        owned_by: 'anthropic'
      }
    ];
    
    // Filter OpenAI models if needed
    const allowedOpenAIModels = [
      'gpt-4',
      'gpt-4-turbo-preview', 
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ];
    
    if (response.data?.data) {
      response.data.data = response.data.data.filter((model: any) => 
        allowedOpenAIModels.some(allowed => model.id.includes(allowed))
      );
      
      // Add Claude models to the list
      response.data.data = [...response.data.data, ...claudeModels];
    }
    
    res.json(response.data);
    
  } catch (error: any) {
    console.error('[RELAY] Models error:', error.message);
    
    // Fallback to a default list if OpenAI fails
    res.json({
      object: 'list',
      data: [
        {
          id: 'gpt-4',
          object: 'model',
          created: 1687882410,
          owned_by: 'openai'
        },
        {
          id: 'gpt-3.5-turbo',
          object: 'model',
          created: 1677610602,
          owned_by: 'openai'
        }
      ]
    });
  }
}