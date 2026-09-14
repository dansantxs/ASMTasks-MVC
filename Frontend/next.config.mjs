/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    // Em `fallback`, e não em `afterFiles`: o Next avalia `afterFiles` ANTES das rotas
    // dinâmicas, então o proxy engolia /api/cep/[cep] (rota do próprio Next) e mandava a
    // chamada para o backend, que não tem essa rota. `fallback` só roda quando nenhuma
    // rota do Next — estática ou dinâmica — atendeu.
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: '/api/:path*',
          destination: 'http://backend:8080/api/:path*',
        },
      ],
    };
  },
};

export default nextConfig;
