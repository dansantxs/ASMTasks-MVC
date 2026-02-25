'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/layout/card';
import { Input } from '../../../ui/form/input';
import { Label } from '../../../ui/form/label';
import { Button } from '../../../ui/base/button';
import { Settings } from 'lucide-react';
import { alterarLogin, alterarSenha } from '../../login/api/auth';
import { clearSession } from '../../../shared/auth/session';
import { toast, Toaster } from 'sonner';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.novaSenha.length < 6) {
      toast.error('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }

    if (formData.novaSenha !== formData.confirmarNovaSenha) {
      toast.error('A confirmacao da senha nao confere.');
      return;
    }

    setIsSaving(true);
    try {
      await alterarSenha({ senhaAtual: formData.senhaAtual, novaSenha: formData.novaSenha });
      setFormData({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
      toast.success('Senha alterada com sucesso.');
    } catch (err) {
      toast.error(err?.message ?? 'Nao foi possivel alterar a senha.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAlterarLogin = async (e) => {
    e.preventDefault();
    setIsSavingLogin(true);
    try {
      await alterarLogin({ novoLogin });
      clearSession();
      toast.success('Login alterado com sucesso. Faca login novamente.');
      setTimeout(() => {
        router.replace('/login');
      }, 600);
    } catch (err) {
      toast.error(err?.message ?? 'Nao foi possivel alterar o login.');
    } finally {
      setIsSavingLogin(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-blue/10 rounded-lg">
            <Settings className="h-6 w-6 text-brand-blue" />
          </div>
          <div>
            <h1>Configuracoes da Conta</h1>
            <p className="text-muted-foreground">
              Atualize seu login e senha de acesso ao sistema
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Alterar meu login</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleAlterarLogin}>
                <div>
                  <Label htmlFor="novoLogin">Novo login</Label>
                  <Input
                    id="novoLogin"
                    value={novoLogin}
                    onChange={(e) => setNovoLogin(e.target.value)}
                    placeholder="Minimo 4 caracteres, sem espacos"
                  />
                </div>
                <Button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark" disabled={isSavingLogin}>
                  {isSavingLogin ? 'Salvando...' : 'Alterar login'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alterar minha senha</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="senhaAtual">Senha atual</Label>
                  <Input
                    id="senhaAtual"
                    type="password"
                    value={formData.senhaAtual}
                    onChange={(e) => setFormData((prev) => ({ ...prev, senhaAtual: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="novaSenha">Nova senha</Label>
                  <Input
                    id="novaSenha"
                    type="password"
                    value={formData.novaSenha}
                    onChange={(e) => setFormData((prev) => ({ ...prev, novaSenha: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmarNovaSenha">Confirmar nova senha</Label>
                  <Input
                    id="confirmarNovaSenha"
                    type="password"
                    value={formData.confirmarNovaSenha}
                    onChange={(e) => setFormData((prev) => ({ ...prev, confirmarNovaSenha: e.target.value }))}
                  />
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
