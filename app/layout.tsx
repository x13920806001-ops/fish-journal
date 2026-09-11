import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '我的图文记录',
  description: '记录我养过的鱼、花、旅行和宠物',
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
        <header className="border-b bg-white">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-bold">🐟 我的图文记录</a>
            <a href="/admin" className="text-sm text-gray-500 hover:text-black">后台</a>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>

        <footer className="text-center text-sm text-gray-400 py-8">
          © {new Date().getFullYear()} 我的图文记录
        </footer>
      </body>
    </html>
  );
}