'use client';

interface InputPageProps {
  demoStep: number;
  voiceText: string;
  aiPhase: number;
  onRunDemo: () => void;
}

export default function InputPage({ demoStep, voiceText, aiPhase, onRunDemo }: InputPageProps) {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{
        fontSize: 9, color: '#C8963C', letterSpacing: '0.2em',
        fontFamily: 'monospace', marginBottom: 8,
      }}>
        // INPUT — 話すだけで整理される
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 18, lineHeight: 1.4 }}>
        今、頭の中にあることを<span style={{ color: '#C8963C' }}>そのまま話す</span>
      </div>

      <div style={{
        border: '1px solid rgba(200,150,60,0.3)', background: 'rgba(200,150,60,0.02)',
        padding: 20, marginBottom: 16, minHeight: 140, position: 'relative',
      }}>
        {demoStep === 1 && (
          <div style={{
            position: 'absolute', top: 12, right: 14,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%', background: '#E07B6A',
              animation: 'blink 0.9s infinite',
            }} />
            <span style={{ fontSize: 9, color: '#E07B6A', fontFamily: 'monospace' }}>録音中</span>
          </div>
        )}
        <div style={{
          fontSize: 13, lineHeight: 1.8,
          color: voiceText ? '#D0C8B8' : '#3A3830', whiteSpace: 'pre-wrap',
        }}>
          {voiceText || 'ここに社長の発言が入ります...'}
          {demoStep === 1 && (
            <span style={{ animation: 'blink 0.7s infinite', color: '#C8963C' }}>|</span>
          )}
        </div>
      </div>

      {demoStep === 2 && (
        <div style={{
          border: '1px solid rgba(200,150,60,0.4)',
          background: 'rgba(8,10,13,0.98)', padding: 24,
        }}>
          <div style={{
            fontSize: 11, color: '#C8963C', letterSpacing: '0.2em',
            fontFamily: 'monospace', marginBottom: 14, textAlign: 'center',
          }}>
            AI PROCESSING...
          </div>
          {[
            { ph: 1, label: 'カテゴリを自動分類中',     detail: '営業・売上 / 開発...' },
            { ph: 2, label: 'タスク・期限を抽出中',     detail: '今日/今週のdeadlineを付与...' },
            { ph: 3, label: '優先順位をスコアリング中', detail: '期限・影響度・ブロッカー分析...' },
          ].map(item => (
            <div key={item.ph} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', marginBottom: 6,
              background: aiPhase >= item.ph ? 'rgba(200,150,60,0.07)' : 'rgba(255,255,255,0.02)',
              border: aiPhase >= item.ph ? '1px solid rgba(200,150,60,0.28)' : '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.4s',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                border: `1px solid ${aiPhase >= item.ph ? '#C8963C' : 'rgba(200,150,60,0.2)'}`,
                background: aiPhase > item.ph ? '#C8963C' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.4s',
              }}>
                {aiPhase > item.ph && (
                  <span style={{ fontSize: 8, color: '#080A0D', fontWeight: 700 }}>✓</span>
                )}
                {aiPhase === item.ph && (
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#C8963C', animation: 'blink 0.6s infinite',
                  }} />
                )}
              </div>
              <div>
                <div style={{
                  fontSize: 12, color: aiPhase >= item.ph ? '#E0D8C8' : '#444',
                }}>
                  {item.label}
                </div>
                {aiPhase >= item.ph && (
                  <div style={{ fontSize: 10, color: '#C8963C', marginTop: 2 }}>
                    {item.detail}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {demoStep === 0 && (
        <button onClick={onRunDemo} style={{
          width: '100%', padding: 12, fontSize: 13, fontWeight: 700,
          background: 'linear-gradient(135deg,#C8963C,#E0B060)',
          border: 'none', color: '#080A0D', cursor: 'pointer',
        }}>
          ▶ デモ開始
        </button>
      )}
    </div>
  );
}
