'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/layout/card';
import { Input } from '../../ui/form/input';
import { Label } from '../../ui/form/label';
import { Button } from '../../ui/base/button';
import { login } from './api/auth';
import { salvarSessao } from '../../shared/auth/session';
import { obterRotaPadrao } from '../../shared/auth/permissions';

export default function LoginPage() {
  const router = useRouter();
  const [dadosFormulario, setDadosFormulario] = useState({ login: '', senha: '' });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleEnviar = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const resposta = await login(dadosFormulario);
      salvarSessao(resposta);
      router.replace(obterRotaPadrao(resposta));
    } catch (err) {
      setErro(err?.message ?? 'Falha ao realizar login.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Entrar no sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEnviar} className="space-y-4">
            <div>
              <Label htmlFor="login">Usuário</Label>
              <Input
                id="login"
                value={dadosFormulario.login}
                onChange={(e) => setDadosFormulario((prev) => ({ ...prev, login: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={dadosFormulario.senha}
                  onChange={(e) => setDadosFormulario((prev) => ({ ...prev, senha: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground"
                  onClick={() => setMostrarSenha((prev) => !prev)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  tabIndex={-1}
                >
                  {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {erro && <p className="text-sm text-destructive">{erro}</p>}

            <Button type="submit" className="w-full bg-brand-blue hover:bg-brand-blue-dark" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
