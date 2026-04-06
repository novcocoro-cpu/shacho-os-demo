'use client';

import { Page, Horizon } from '@/lib/types';

interface NavBarProps {
  page: Page;
  setPage: (p: Page) => void;
  horizon: Horizon;
  overallPct: number;
  demoActive: boolean;
}

export default function NavBar({ page, setPage, horizon, overallPct, demoActive }: NavBarProps) {
  const pages: [Page, string][] = [
    ['dash', '◈ ダッシュボード'],
    ['input', '＋ 入力'],
    ['knowledge', '⚙ ナレッジ'],
  ];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,10,13,0.95)',
      backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(200,150,60,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, border: '1px solid #C8963C',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#C8963C', fontSize: 13,
        }}>
          ◈
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em' }}>社長脳 OS</div>
          <div style={{
            fontSize: 8, color: '#C8963C', letterSpacing: '0.2em', fontFamily: 'monospace',
          }}>
            NOVAI / 荒木信宏
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {pages.map(([p, l]) => (
          <button
            key={p}
            onClick={() => { if (!demoActive) setPage(p); }}
            style={{
              padding: '5px 12px', fontSize: 10, letterSpacing: '0.08em',
              border: page === p ? '1px solid #C8963C' : '1px solid rgba(200,150,60,0.18)',
              background: page === p ? 'rgba(200,150,60,0.1)' : 'transparent',
              color: page === p ? '#C8963C' : '#555',
              cursor: 'pointer', fontFamily: 'monospace',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 8, color: '#555', letterSpacing: '0.15em',
            fontFamily: 'monospace', marginBottom: 3,
          }}>
            {horizon}の完了率
          </div>
          <div style={{
            width: 100, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2,
          }}>
            <div style={{
              width: `${overallPct}%`, height: '100%',
              background: 'linear-gradient(90deg,#C8963C,#E0B060)',
              borderRadius: 2, transition: 'width 0.5s',
            }} />
          </div>
        </div>
        <span style={{
          fontSize: 15, fontWeight: 700, color: '#C8963C', fontFamily: 'monospace',
        }}>
          {overallPct}<span style={{ fontSize: 10 }}>%</span>
        </span>
      </div>
    </nav>
  );
}
