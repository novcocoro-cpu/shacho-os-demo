'use client';

import { AIModel } from '@/lib/types';

const KNOWLEDGE_FIELDS = [
  {
    label: '会社概要',
    val: 'NOVAIは中小企業向けAIクラウドサービスを開発・提供。心理×AIが最大の差別化。',
  },
  {
    label: 'ビジョン・目標',
    val: '企業OS（会社全体のOS）として機能するSaaSを構築。Supabaseに全データを集約する。',
  },
  {
    label: '今月の最優先方針',
    val: '初契約1社の獲得。タクミ（KGホーム）に絞る。直販実績を先に作る。',
  },
  {
    label: 'パートナー情報',
    val: '社労士パートナー（約50社）、KGホーム、弁護士友人、不動産会社社長（不動産協会役員）。',
  },
];

interface KnowledgePageProps {
  aiModel: AIModel;
  onSetAiModel: (model: AIModel) => void;
}

export default function KnowledgePage({ aiModel, onSetAiModel }: KnowledgePageProps) {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{
        fontSize: 9, color: '#C8963C', letterSpacing: '0.2em',
        fontFamily: 'monospace', marginBottom: 8,
      }}>
        // KNOWLEDGE — AIの判断基準
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>
        AIが<span style={{ color: '#C8963C' }}>「会社を知っている」</span>状態を作る
      </div>

      {/* AI Model Toggle */}
      <div style={{
        marginBottom: 20, padding: '14px 16px',
        border: '1px solid rgba(200,150,60,0.3)',
        background: 'rgba(200,150,60,0.04)',
      }}>
        <div style={{
          fontSize: 9, color: '#C8963C', letterSpacing: '0.15em',
          fontFamily: 'monospace', marginBottom: 10,
        }}>
          // AIモデル選択
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onSetAiModel('claude')}
            style={{
              flex: 1, padding: '10px 14px',
              border: aiModel === 'claude'
                ? '1px solid #C8963C'
                : '1px solid rgba(255,255,255,0.1)',
              background: aiModel === 'claude'
                ? 'rgba(200,150,60,0.12)'
                : 'rgba(255,255,255,0.02)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: aiModel === 'claude' ? '#C8963C' : '#555',
            }}>
              Claude
            </div>
            <div style={{
              fontSize: 9, color: aiModel === 'claude' ? '#A07830' : '#444',
              marginTop: 3, fontFamily: 'monospace',
            }}>
              Anthropic / Sonnet 4.5
            </div>
          </button>
          <button
            onClick={() => onSetAiModel('gemini')}
            style={{
              flex: 1, padding: '10px 14px',
              border: aiModel === 'gemini'
                ? '1px solid #4A9EBF'
                : '1px solid rgba(255,255,255,0.1)',
              background: aiModel === 'gemini'
                ? 'rgba(74,158,191,0.12)'
                : 'rgba(255,255,255,0.02)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: aiModel === 'gemini' ? '#4A9EBF' : '#555',
            }}>
              Gemini
            </div>
            <div style={{
              fontSize: 9, color: aiModel === 'gemini' ? '#3A7E9F' : '#444',
              marginTop: 3, fontFamily: 'monospace',
            }}>
              Google / 2.0 Flash
            </div>
          </button>
        </div>
        <div style={{
          fontSize: 10, color: '#555', marginTop: 8, lineHeight: 1.6,
        }}>
          現在のモデル：
          <span style={{
            color: aiModel === 'claude' ? '#C8963C' : '#4A9EBF',
            fontWeight: 700,
          }}>
            {aiModel === 'claude' ? 'Claude Sonnet 4.5' : 'Gemini 2.0 Flash'}
          </span>
          　—　工程展開・タスク抽出に使用されます
        </div>
      </div>

      {KNOWLEDGE_FIELDS.map((f, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div style={{
            fontSize: 9, color: '#C8963C', letterSpacing: '0.15em',
            fontFamily: 'monospace', marginBottom: 5,
          }}>
            // {f.label}
          </div>
          <div style={{
            fontSize: 12, color: '#888', lineHeight: 1.7,
            padding: '10px 12px', border: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            {f.val}
          </div>
        </div>
      ))}
    </div>
  );
}
