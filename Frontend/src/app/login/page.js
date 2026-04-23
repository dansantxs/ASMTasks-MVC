'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Kanban, AlertCircle, Loader2 } from 'lucide-react';
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
      <div className="w-full max-w-sm">

        {/* Identidade */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-brand-blue rounded-2xl shadow-sm mb-4">
            <Kanban className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">ASM Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">Acesse sua conta para continuar</p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-xl border shadow-sm p-8">
          <form onSubmit={handleEnviar} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="login">Usuário</Label>
              <Input
                id="login"
                placeholder="Seu login de acesso"
                autoComplete="username"
                value={dadosFormulario.login}
                onChange={(e) =>
                  setDadosFormulario((prev) => ({ ...prev, login: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  value={dadosFormulario.senha}
                  onChange={(e) =>
                    setDadosFormulario((prev) => ({ ...prev, senha: e.target.value }))
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMostrarSenha((prev) => !prev)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  tabIndex={-1}
                >
                  {mostrarSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {erro && (
              <div className="flex items-start gap-2.5 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{erro}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-brand-blue hover:bg-brand-blue-dark h-10"
              disabled={carregando}
            >
              {carregando ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} ASM Tasks
        </p>
      </div>
    </div>
  );
}
