import type { Metadata } from 'next';
import { Fraunces, Inter, DM_Sans } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { Footer } from './components/Footer';
import { WebSiteJsonLd, OrganizationJsonLd } from './components/JsonLd';

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
        {/* JSON-LD structured data */}
        <WebSiteJsonLd />
        <OrganizationJsonLd />

        {/* Sticky header nav */}
        <header className="sticky top-0 z-50 bg-warm-white/95 backdrop-blur-sm border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Left: Wordmark */}
            <Link
              href="/"
              className="font-display text-xl font-bold text-navy"
            >
              LegalAIMCP
            </Link>

            {/* Right: Desktop nav (md+) */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/servers"
                className="font-sans text-sm text-charcoal hover:text-gold-text transition-colors"
              >
                Browse
              </Link>
              <Link
                href="/submit"
                className="font-sans text-sm text-charcoal hover:text-gold-text transition-colors"
              >
                Submit a Tool
              </Link>
              <Link
                href="/about"
                className="font-sans text-sm text-charcoal hover:text-gold-text transition-colors"
              >
                About
              </Link>
              <Link
                href="https://calendly.com/nyclaw-io-proton/30min"
                className="btn-primary text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                Book a Call →
              </Link>
            </nav>

            {/* Right: Mobile nav (< md) */}
            <nav className="flex md:hidden items-center gap-3">
              <Link
                href="/servers"
                className="font-sans text-sm text-charcoal hover:text-gold-text transition-colors"
              >
                Browse
              </Link>
              <Link
                href="https://calendly.com/nyclaw-io-proton/30min"
                className="btn-primary text-xs"
                target="_blank"
                rel="noopener noreferrer"
              >
                Book a Call
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <Footer />
      </body>
    </html>
  );
}
