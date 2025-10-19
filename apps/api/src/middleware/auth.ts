// Simple role-based access control middleware
// In a real application, this would integrate with proper authentication

export type UserRole = 'MANAGER' | 'VET' | 'BILLING' | 'USER';

export interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

// Mock user for development - in production, this would come from JWT/session
const mockUser: { id: string; role: UserRole } = {
  id: 'user-123',
  role: 'MANAGER', // Default to MANAGER for development
};

export function allowRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    // In development, use mock user
    // In production, this would extract user from JWT/session
    req.user = mockUser;
    
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }
    
    next();
  };
}

export function requireAuth(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  // In development, use mock user
  // In production, this would extract user from JWT/session
  req.user = mockUser;
  next();
}