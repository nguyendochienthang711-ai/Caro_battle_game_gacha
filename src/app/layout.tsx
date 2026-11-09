import type { Metadata } from 'next';
import { Inter, Orbitron } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });

export const metadata: Metadata = {
  title: 'CyberCaro 3D 30x30 Pro - Next.js & Three.js',
  description:
    'Trò chơi Cờ Caro 3D 30x30 Cyberpunk phong cách tương lai, tích hợp AI CyberBot và chơi qua mạng LAN Wi-Fi.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${inter.variable} ${orbitron.variable}`}>
      <body className="bg-[#050711] text-slate-100 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
