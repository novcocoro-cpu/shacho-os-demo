import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '社長脳 OS — デモ',
  description: 'NOVAI 経営ダッシュボード（デモ版）',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
