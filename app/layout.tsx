import type { Metadata, Viewport } from "next";
import { Alfa_Slab_One, Inter } from "next/font/google";
import Script from "next/script";
import { config } from "@/lib/config";
import "./globals.css";

// Título com personalidade (slab forte) e texto em sans-serif legível
const titulo = Alfa_Slab_One({ weight: "400", subsets: ["latin"], variable: "--font-titulo", display: "swap" });
const texto = Inter({ subsets: ["latin"], variable: "--font-texto", display: "swap" });

const descricao =
  "Banco que vira mesa em eucalipto maciço, feito sob encomenda. Pague só após a entrega. A partir de R$ 170. Peça pelo WhatsApp.";

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: "Ramos Madeiras | Banco que vira mesa em eucalipto",
  description: descricao,
  openGraph: {
    title: "Ramos Madeiras | Banco que vira mesa",
    description: descricao,
    type: "website",
    locale: "pt_BR",
    siteName: config.nome,
    images: [{ url: config.fotos.mesaEnvernizadaExterna.src }],
  },
};

export const viewport: Viewport = { themeColor: "#c4531a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pixel = config.metaPixelId;
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${texto.variable}`}>
      <body>
        {children}
        {pixel && (
          <Script id="meta-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${pixel}');fbq('track','PageView');
          `}</Script>
        )}
      </body>
    </html>
  );
}
