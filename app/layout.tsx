import type { Metadata } from 'next';
import { siteUrl } from '@/lib/seo';
import './fonts.css';
import './reference.css';
import './globals.css';
export const metadata: Metadata = { metadataBase: new URL(siteUrl()), title: 'Sanctum AI | Intelligent Business Systems', description: 'Built by humans. Powered by AI. Business automation and custom AI engineering from New Zealand, serving businesses internationally.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en-NZ"><body>{children}</body></html>; }
