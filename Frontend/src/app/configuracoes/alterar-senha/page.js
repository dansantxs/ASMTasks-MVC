'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/layout/card';
import { Input } from '../../../ui/form/input';
import { Label } from '../../../ui/form/label';
import { Button } from '../../../ui/base/button';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { alterarLogin, alterarSenha } from '../../login/api/auth';
import { limparSessao } from '../../../shared/auth/session';
import { toast, Toaster } from 'sonner';
import TourGuia from '../../../shared/components/TourGuia';

const PASSOS_TOUR = [
  {
    element: '#tour-cabecalho',
    popover: {
      title: 'Configurações da Conta',
      description: 'Nesta tela você pode alterar seu <strong>login</strong> e sua <strong>senha</strong> de acesso ao sistema. As alterações afetam apenas a sua conta.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-card-login',
    popover: {
      title: 'Alterar Login',
      description: 'Informe um novo login para sua conta. O login deve ter ao menos 4 caracteres e não pode conter espaços. Após salvar, você será redirecionado para a tela de login.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-campo-login',
    popover: {
      title: 'Novo Login',
      description: 'Digite o novo login desejado. Lembre-se: após alterar, você precisará usar o novo login para entrar no sistema.',
      side: 'bottom',
    },
  },
  {
    element: '#tour-card-senha',
    popover: {
      title: 'Alterar Senha',
      description: 'Para trocar a senha, informe a senha atual e o novo valor duas vezes para confirmação. A nova senha deve ter ao menos 6 caracteres.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '#tour-campo-senha-atual',
    popover: {
      title: 'Senha Atual',
      description: 'Informe sua senha atual para confirmar a identidade antes de definir uma nova. Use o ícone de olho para visualizar o que está digitando.',
      side: 'bottom',
    },
  },
  {
    element: '#tour-campo-nova-senha',
    popover: {
      title: 'Nova Senha',
      description: 'Digite a nova senha desejada. Ela deve ter no mínimo <strong>6 caracteres</strong>.',
      side: 'bottom',
    },
  },
  {
    element: '#tour-campo-confirmar-senha',
    popover: {
      title: 'Confirmar Nova Senha',
      description: 'Digite a nova senha novamente para garantir que não houve erro de digitação. Ambos os campos devem ser idênticos para salvar.',
      side: 'bottom',
    },
  },
];

export default function AlterarSenhaPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarNovaSenha: '',
  });
  const [novoLogin, setNovoLogin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLogin, setIsSavingLogin] = useState(false);
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.novaSenha.length < 6) {
      toast.error('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }

    if (formData.novaSenha !== formData.confirmarNovaSenha) {
      toast.error('A confirmação da senha não confere.');
      return;
    }

    setIsSaving(true);
    try {
      await alterarSenha({ senhaAtual: formData.senhaAtual, novaSenha: formData.novaSenha });
      setFormData({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
      toast.success('Senha alterada com sucesso.');
    } catch (err) {
      toast.error(err?.message ?? 'Não foi possível alterar a senha.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAlterarLogin = async (e) => {
    e.preventDefault();
    setIsSavingLogin(true);
    try {
      await alterarLogin({ novoLogin });
      limparSessao();
      toast.success('Login alterado com sucesso. Faça login novamente.');
      setTimeout(() => {
        router.replace('/login');
      }, 600);
    } catch (err) {
      toast.error(err?.message ?? 'Não foi possível alterar o login.');
    } finally {
      setIsSavingLogin(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div id="tour-cabecalho" className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <KeyRound className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Configurações da Conta</h1>
              <p className="text-muted-foreground">
                Atualize seu login e senha de acesso ao sistema
              </p>
            </div>
          </div>
          <TourGuia passos={PASSOS_TOUR} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card id="tour-card-login">
            <CardHeader>
              <CardTitle>Alterar meu login</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleAlterarLogin}>
                <div id="tour-campo-login">
                  <Label htmlFor="novoLogin">Novo login</Label>
                  <Input
                    id="novoLogin"
                    value={novoLogin}
                    onChange={(e) => setNovoLogin(e.target.value)}
                    placeholder="Mínimo 4 caracteres, sem espaços"
                  />
                </div>
                <Button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark" disabled={isSavingLogin}>
                  {isSavingLogin ? 'Salvando...' : 'Alterar login'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card id="tour-card-senha">
            <CardHeader>
              <CardTitle>Alterar minha senha</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div id="tour-campo-senha-atual">
                  <Label htmlFor="senhaAtual">Senha atual</Label>
                  <div className="relative">
                    <Input
                      id="senhaAtual"
                      type={mostrarSenhaAtual ? 'text' : 'password'}
                      value={formData.senhaAtual}
                      onChange={(e) => setFormData((prev) => ({ ...prev, senhaAtual: e.target.value }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenhaAtual((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {mostrarSenhaAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div id="tour-campo-nova-senha">
                  <Label htmlFor="novaSenha">Nova senha</Label>
                  <div className="relative">
                    <Input
                      id="novaSenha"
                      type={mostrarNovaSenha ? 'text' : 'password'}
                      value={formData.novaSenha}
                      onChange={(e) => setFormData((prev) => ({ ...prev, novaSenha: e.target.value }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarNovaSenha((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {mostrarNovaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div id="tour-campo-confirmar-senha">
                  <Label htmlFor="confirmarNovaSenha">Confirmar nova senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmarNovaSenha"
                      type={mostrarConfirmarSenha ? 'text' : 'password'}
                      value={formData.confirmarNovaSenha}
                      onChange={(e) => setFormData((prev) => ({ ...prev, confirmarNovaSenha: e.target.value }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarConfirmarSenha((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {mostrarConfirmarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Alterar senha'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
