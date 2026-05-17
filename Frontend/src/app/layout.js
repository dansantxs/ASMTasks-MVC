import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import Providers from "../context/providers";
import LayoutPrincipal from "./LayoutPrincipal";
import { SwRegistrar } from "./SwRegistrar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  themeColor: '#1e3a8a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  title: "ASM Tasks",
  description: "Sistema de Gestão de Setores",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ASM Tasks",
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Captura o evento de instalação PWA antes do React montar para não perdê-lo */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__pwaInstallPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.__pwaInstallPrompt = e;
              });
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <LayoutPrincipal>{children}</LayoutPrincipal>
        </Providers>
        <SwRegistrar />
      </body>
    </html>
  );
}
