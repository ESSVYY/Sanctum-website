import type { Metadata } from 'next';
import './fonts.css';
import './reference.css';
import './globals.css';
export const metadata: Metadata = { title: 'Sanctum AI | Intelligent Business Systems', description: 'Built by humans. Powered by AI. Intelligent business automation systems. Interactive demonstration.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en-NZ"><body>{children}</body></html>; }
