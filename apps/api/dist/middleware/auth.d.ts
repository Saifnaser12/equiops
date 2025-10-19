import express from 'express';
export type UserRole = 'MANAGER' | 'VET' | 'BILLING' | 'USER';
export interface AuthenticatedRequest extends express.Request {
    user?: {
        id: string;
        role: UserRole;
    };
}
export declare function allowRoles(...allowedRoles: UserRole[]): (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => express.Response<any, Record<string, any>> | undefined;
export declare function requireAuth(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction): void;
//# sourceMappingURL=auth.d.ts.map