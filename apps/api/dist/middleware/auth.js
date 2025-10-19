"use strict";
// Simple role-based access control middleware
// In a real application, this would integrate with proper authentication
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowRoles = allowRoles;
exports.requireAuth = requireAuth;
// Mock user for development - in production, this would come from JWT/session
const mockUser = {
    id: 'user-123',
    role: 'MANAGER', // Default to MANAGER for development
};
function allowRoles(...allowedRoles) {
    return (req, res, next) => {
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
function requireAuth(req, res, next) {
    // In development, use mock user
    // In production, this would extract user from JWT/session
    req.user = mockUser;
    next();
}
//# sourceMappingURL=auth.js.map