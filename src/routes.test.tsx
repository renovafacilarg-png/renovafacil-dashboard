import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authLoader } from './routes';

describe('authLoader', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('redirects to /login when no token in localStorage', async () => {
    localStorage.clear();
    const request = new Request('http://localhost/inbox');
    const result = await authLoader({ request, params: {} });
    expect(result).toBeDefined();
    // redirect() returns a Response object with Location header
    expect(result).toBeInstanceOf(Response);
    const res = result as Response;
    expect(res.headers.get('Location')).toContain('/login');
  });

  it('returns null when token exists (skips backend verify in unit test)', async () => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('auth_expires', new Date(Date.now() + 3600000).toISOString());
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ valid: true }),
    }));
    const request = new Request('http://localhost/inbox');
    const result = await authLoader({ request, params: {} });
    expect(result).toBeNull();
    localStorage.clear();
    vi.unstubAllGlobals();
  });
});
