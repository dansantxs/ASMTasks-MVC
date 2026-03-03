'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/layout/card';
import { Input } from '../../ui/form/input';
import { Label } from '../../ui/form/label';
import { Button } from '../../ui/base/button';
import { login } from './api/auth';
import { saveSession } from '../../shared/auth/session';
import { getDefaultRouteForSession } from '../../shared/auth/permissions';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ login: '', senha: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login(formData);
      saveSession(response);
      router.replace(getDefaultRouteForSession(response));
    } catch (err) {
      setError(err?.message ?? 'Falha ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Entrar no sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="login">Usuario</Label>
              <Input
                id="login"
                value={formData.login}
                onChange={(e) => setFormData((prev) => ({ ...prev, login: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={formData.senha}
                  onChange={(e) => setFormData((prev) => ({ ...prev, senha: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground"
                  onClick={() => setMostrarSenha((prev) => !prev)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full bg-brand-blue hover:bg-brand-blue-dark" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
