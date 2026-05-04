'use client';

import { BarraLateral } from "../shared/components/BarraLateral";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import {
  limparSessao,
  obterLimiteInatividadeMs,
  obterSessaoArmazenada,
  isSessaoValida,
  registrarAtividadeSessao,
} from "../shared/auth/session";
import { useUsuarioAtual } from "../shared/auth/useUsuarioAtual";
import { obterRotaPadrao, obterPermissaoPorRota, temPermissao } from "../shared/auth/permissions";
import { logout } from "./login/api/auth";
import { useConfiguracoesSistema } from "../shared/configuracoes-sistema/api";

export default function LayoutPrincipal({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [barraLateralRecolhida, setBarraLateralRecolhida] = useState(false);
  const [mobileAberta, setMobileAberta] = useState(false);
  const [autenticacaoVerificada, setAutenticacaoVerificada] = useState(false);
  const paginaLogin = pathname === "/login";

  const { data: configuracoes } = useConfiguracoesSistema({ enabled: !paginaLogin });
  const { usuario, carregando: carregandoUsuario } = useUsuarioAtual({ enabled: !paginaLogin || isSessaoValida() });

  useEffect(() => {
    const logo = configuracoes?.logoBase64;
    if (!logo) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = logo;
  }, [configuracoes?.logoBase64, pathname]);

  const handleNavegar = (caminho) => {
    setMobileAberta(false);
    router.push(caminho);
  };

  const handleSair = async () => {
    try { await logout(); } catch {}
    limparSessao();
    router.replace("/login");
  };

  useEffect(() => {
    if (paginaLogin) {
      if (!isSessaoValida()) {
        setAutenticacaoVerificada(true);
        return;
      }
      if (carregandoUsuario) return;
      router.replace(obterRotaPadrao(usuario));
      return;
    }

    if (!isSessaoValida()) {
      limparSessao();
      router.replace("/login");
      return;
    }

    if (carregandoUsuario) return;

    if (!usuario) {
      limparSessao();
      router.replace("/login");
      return;
    }

    const permissaoNecessaria = obterPermissaoPorRota(pathname);
    if (permissaoNecessaria && !temPermissao(usuario, permissaoNecessaria)) {
      router.replace(obterRotaPadrao(usuario));
      return;
    }

    setAutenticacaoVerificada(true);
  }, [paginaLogin, pathname, router, usuario, carregandoUsuario]);

  useEffect(() => {
    if (paginaLogin || !autenticacaoVerificada) return;

    const atualizarAtividade = () => registrarAtividadeSessao();
    const eventos = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    eventos.forEach((nomeEvento) => window.addEventListener(nomeEvento, atualizarAtividade));

    const intervalo = setInterval(() => {
      const sessaoArmazenada = obterSessaoArmazenada();
      const ultimaAtividade = sessaoArmazenada?.ultimoAcessoEm ?? 0;
      if (Date.now() - ultimaAtividade > obterLimiteInatividadeMs()) {
        handleSair();
      }
    }, 15000);

    return () => {
      clearInterval(intervalo);
      eventos.forEach((nomeEvento) => window.removeEventListener(nomeEvento, atualizarAtividade));
    };
  }, [paginaLogin, autenticacaoVerificada]);

  useEffect(() => {
    setMobileAberta(false);
  }, [pathname]);

  if (!autenticacaoVerificada) return null;

  if (paginaLogin) {
    return <>{children}</>;
  }

  return (
    <div className="flex bg-background text-foreground min-h-screen">
      {mobileAberta && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileAberta(false)}
          aria-hidden="true"
        />
      )}

      <BarraLateral
        caminhoAtual={pathname}
        aoNavegar={handleNavegar}
        aoAlternarRecolhimento={setBarraLateralRecolhida}
        colaboradorNome={usuario?.colaboradorNome ?? ""}
        permissoes={usuario?.permissoes ?? []}
        aoSair={handleSair}
        mobileAberta={mobileAberta}
        aoFecharMobile={() => setMobileAberta(false)}
      />

      <main
        className={`flex-1 overflow-y-auto transition-all duration-300 ${
          barraLateralRecolhida ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <div className="sticky top-0 z-20 flex items-center h-14 px-4 bg-[#0f172a] border-b border-gray-800 lg:hidden">
          <button
            onClick={() => setMobileAberta(true)}
            className="p-2 rounded-lg text-white hover:bg-gray-800 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 text-white font-medium text-sm">ASM Tasks</span>
        </div>
        {children}
      </main>
    </div>
  );
}
