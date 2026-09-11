import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '闲白儿',
  description: '养点儿鱼，盘点儿串儿',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        {/* 顶部导航 */}
        <header className="border-b border-black/5 bg-[#f7f6f3]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
            <a href="/" className="text-lg font-medium tracking-wide text-[#1a1a1a]">
              闲白儿
            </a>
            <a
              href="/admin"
              className="text-xs tracking-widest text-black/40 hover:text-black transition"
            >
              进屋
            </a>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>

        <footer className="text-center text-xs tracking-widest text-black/30 py-16">
          闲白儿
        </footer>
      </body>
    </html>
  );
}