import { verifyToken, UserPayload } from './jwt';

export function getAuthenticatedUser(req: Request): UserPayload | null {
  try {
    // Lấy cookie từ Header của request
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [key, ...value] = c.trim().split('=');
        return [key, value.join('=')];
      })
    );

    const token = cookies['token'];
    if (!token) return null;

    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

export function hasRole(user: UserPayload | null, allowedRoles: ('ADMIN' | 'STAFF' | 'CUSTOMER')[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}
