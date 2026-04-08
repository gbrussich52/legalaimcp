import type { Metadata } from 'next';
import { Fraunces, Inter, DM_Sans } from 'next/font/google';
import './globals.css';

// --- Fonts ---
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-fraunces',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

// --- Metadata ---
export const metadata: Metadata = {
  metadataBase: new URL('https://legalaimcp.com'),
  title: {
    template: '%s | LegalAIMCP',
    default: 'LegalAIMCP — AI Integrations for Law Firms',
  },
  description:
    'The curated directory of AI-powered integrations for law firms. Find MCP servers for contract review, case management, legal research, and more.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://legalaimcp.com',
    siteName: 'LegalAIMCP',
    title: 'LegalAIMCP — AI Integrations for Law Firms',
    description:
      'The curated directory of AI-powered integrations for law firms. Find MCP servers for contract review, case management, legal research, and more.',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${dmSans.variable}`}>
      <body className="bg-warm-white text-charcoal font-body">
        {children}
      </body>
    </html>
  );
}
