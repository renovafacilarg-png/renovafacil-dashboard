import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, LogIn, AlertCircle } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { Logo } from '@/components/Logo';

interface LoginPageProps {
  onLogin: (token: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_expires', data.expires_at);
        onLogin(data.token);
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        /* Fondo cálido con sutil degradado de marca */
        background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(14 60% 97%) 50%, hsl(30 20% 96%) 100%)',
      }}
    >
      {/* Decorative tiles pattern — subtle background texture evocando placas 3D */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-12 right-16 w-24 h-24 rounded-2xl opacity-[0.04]"
          style={{ background: 'hsl(var(--primary))' }} />
        <div className="absolute top-24 right-32 w-16 h-16 rounded-2xl opacity-[0.03]"
          style={{ background: 'hsl(var(--primary))' }} />
        <div className="absolute bottom-20 left-16 w-20 h-20 rounded-2xl opacity-[0.04]"
          style={{ background: 'hsl(var(--primary))' }} />
        <div className="absolute bottom-32 left-32 w-12 h-12 rounded-2xl opacity-[0.03]"
          style={{ background: 'hsl(var(--primary))' }} />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: 'hsl(var(--primary))' }} />

        <div className="px-8 pt-8 pb-10">
          {/* Logo + heading */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md bg-primary/10">
              <Logo size={48} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Renovafacil
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Admin Dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresá tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/8 border border-destructive/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-sm font-medium"
              disabled={loading || !password}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Ingresando...
                </span>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Ingresar
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
