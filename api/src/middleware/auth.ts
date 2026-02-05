import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to validate Bearer token presence
 * The actual token validation happens in the Foundry client using OBO flow
 */
export const validateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No Bearer token provided. Please authenticate with Azure AD.'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token format'
    });
  }

  // Attach token to request for downstream use
  (req as any).userToken = token;
  
  next();
};
