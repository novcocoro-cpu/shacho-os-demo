'use client';

interface DemoBarProps {
  demoStep: number;
  aiPhase: number;
  onStart: () => void;
  onReset: () => void;
}

export default function DemoBar({ demoStep, aiPhase, onStart, onReset }: DemoBarProps) {
  const phaseTexts = ['', '① カテゴリ分類中...', '② タスク・期限を抽出中...', '③ ダッシュボードに反映中...'];

  return (
    <div style={{
      background: 'rgba(200,150,60,0.07)',
      borderBottom: '1px solid rgba(200,150,60,0.18)',
      padding: '9px 20px', display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        fontSize: 9, color: '#C8963C', fontFamily: 'monospace',
        letterSpacing: '0.12em', flexShrink: 0,
      }}>
        ▶ DEMO
      </div>
      <div style={{ fontSize: 11, color: '#888', flex: 1 }}>
        {demoStep === 0 && '「デモ開始」→ AI整理の流れを体験。各タスクの「▸ 工程」ボタンでAIが実行工程を自動生成します。'}
        {demoStep === 1 && '社長が話しています...（音声入力シミュレート中）'}
        {demoStep === 2 && phaseTexts[aiPhase]}
        {demoStep === 3 && '✓ 完了！タスクの「▸ 工程」ボタンをタップするとAIが実行工程を展開します。'}
      </div>
      {demoStep === 0 && (
        <button onClick={onStart} style={{
          padding: '6px 16px', fontSize: 11, fontWeight: 700,
          background: 'linear-gradient(135deg,#C8963C,#E0B060)',
          border: 'none', color: '#080A0D', cursor: 'pointer', flexShrink: 0,
        }}>
          ▶ デモ開始
        </button>
      )}
      {demoStep === 3 && (
        <button onClick={onReset} style={{
          padding: '5px 12px', fontSize: 10,
          border: '1px solid rgba(200,150,60,0.4)',
          background: 'transparent', color: '#C8963C',
          cursor: 'pointer', fontFamily: 'monospace', flexShrink: 0,
        }}>
          もう一度
        </button>
      )}
    </div>
  );
}
