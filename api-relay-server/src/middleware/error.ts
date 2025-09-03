import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[ERROR]', err);
  
  // Default error response (OpenAI format)
  const errorResponse = {
    error: {
      message: err.message || 'Internal server error',
      type: err.type || 'server_error',
      code: err.code || 'internal_error'
    }
  };

  // Handle axios errors from OpenAI
  if (err.response) {
    return res.status(err.response.status).json(err.response.data);
  }

  // Default to 500
  res.status(err.status || 500).json(errorResponse);
}