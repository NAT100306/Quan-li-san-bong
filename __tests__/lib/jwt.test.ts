import { signToken, verifyToken, hashPassword, comparePassword, UserPayload } from '@/lib/jwt';

describe('JWT Library', () => {
  const samplePayload: UserPayload = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'CUSTOMER',
    name: 'Nguyễn Test',
  };

  // ─── signToken ────────────────────────────────────────────────────────────
  describe('signToken()', () => {
    it('should return a non-empty string token', () => {
      const token = signToken(samplePayload);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should return a valid JWT with 3 parts separated by dots', () => {
      const token = signToken(samplePayload);
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('should sign tokens for different roles', () => {
      const adminToken = signToken({ ...samplePayload, role: 'ADMIN' });
      const staffToken = signToken({ ...samplePayload, role: 'STAFF' });
      expect(adminToken).not.toBe(staffToken);
    });
  });

  // ─── verifyToken ──────────────────────────────────────────────────────────
  describe('verifyToken()', () => {
    it('should return the original payload when given a valid token', () => {
      const token = signToken(samplePayload);
      const decoded = verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.id).toBe(samplePayload.id);
      expect(decoded?.email).toBe(samplePayload.email);
      expect(decoded?.role).toBe(samplePayload.role);
      expect(decoded?.name).toBe(samplePayload.name);
    });

    it('should return null for an invalid / tampered token', () => {
      const result = verifyToken('invalid.token.string');
      expect(result).toBeNull();
    });

    it('should return null for an empty string', () => {
      const result = verifyToken('');
      expect(result).toBeNull();
    });

    it('should return null for an expired token', () => {
      // Sign token that expires immediately (1ms)
      const token = signToken(samplePayload, '1ms');
      // Wait 10ms to ensure expiration
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const result = verifyToken(token);
          expect(result).toBeNull();
          resolve();
        }, 50);
      });
    });
  });

  // ─── hashPassword & comparePassword ───────────────────────────────────────
  describe('hashPassword()', () => {
    it('should return a hashed string different from the original password', async () => {
      const password = 'password123';
      const hash = await hashPassword(password);
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for the same password (due to salt)', async () => {
      const password = 'password123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });

    it('should produce a bcrypt hash starting with $2', async () => {
      const hash = await hashPassword('testPassword');
      expect(hash.startsWith('$2')).toBe(true);
    });
  });

  describe('comparePassword()', () => {
    it('should return true when password matches the hash', async () => {
      const password = 'mySecretPassword';
      const hash = await hashPassword(password);
      const result = await comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false when password does not match the hash', async () => {
      const hash = await hashPassword('correctPassword');
      const result = await comparePassword('wrongPassword', hash);
      expect(result).toBe(false);
    });

    it('should return false for empty password against a valid hash', async () => {
      const hash = await hashPassword('somePassword');
      const result = await comparePassword('', hash);
      expect(result).toBe(false);
    });
  });
});
