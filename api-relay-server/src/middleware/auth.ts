import { Request, Response, NextFunction } from 'express';

// Extend Request type to include user info
declare global {
  namespace Express {
    interface Request {
      apiKey?: string;
      userId?: string;
      team?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log(`[AUTH DEBUG] Headers:`, req.headers);
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log(`[AUTH ERROR] Missing or invalid auth header:`, authHeader);
    return res.status(401).json({
      error: {
        message: 'Missing or invalid authorization header',
        type: 'invalid_request_error',
        code: 'invalid_api_key'
      }
    });
  }

  const apiKey = authHeader.replace('Bearer ', '');
  
  // Get valid API keys from environment
  const validKeys = process.env.RELAY_API_KEYS?.split(',') || [];
  
  if (!validKeys.includes(apiKey)) {
    console.log(`[AUTH] Invalid API key attempt: ${apiKey.substring(0, 10)}...`);
    return res.status(401).json({
      error: {
        message: 'Invalid API key',
        type: 'invalid_request_error',
        code: 'invalid_api_key'
      }
    });
  }

  // Parse API key format: lc_env_team_user_random
  const keyParts = apiKey.split('_');
  if (keyParts.length >= 4) {
    req.apiKey = apiKey;
    req.team = keyParts[2];
    req.userId = keyParts[3];
  }

  console.log(`[AUTH] Valid request from: team=${req.team}, user=${req.userId}`);
  next();
}