'use client';

import { useState } from 'react';
import { AIModel, Knowledge } from '@/lib/types';
import { ROOMS } from '@/lib/constants';

interface KnowledgePageProps {
  aiModel: AIModel;
  onSetAiModel: (model: AIModel) => void;
  knowledge: Knowledge;
  onSaveKnowledge: (k: Knowledge) => void;
}

function EditableField({
  label, value, onSave, placeholder, minHeight,
}: {
  label: string; value: string; onSave: (v: string) => void;
  placeholder: string; minHeight?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 5,
      }}>
        <div style={{
          fontSize: 9, color: '#C8963C', letterSpacing: '0.15em', fontFamily: 'monospace',
        }}>
          // {label}
        </div>
        {!editing ? (
          <button onClick={() => { setDraft(value); setEditing(true); }} style={{
            fontSize: 9, padding: '2px 8px',
            border: '1px solid rgba(200,150,60,0.3)', background: 'transparent',
            color: '#C8963C', cursor: 'pointer', fontFamily: 'monospace',
          }}>
            ✎ 編集
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={cancel} style={{
              fontSize: 9, padding: '2px 8px',
              border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
              color: '#555', cursor: 'pointer',
            }}>
              キャンセル
            </button>
            <button onClick={save} style={{
              fontSize: 9, padding: '2px 8px',
              border: '1px solid rgba(200,150,60,0.5)', background: 'rgba(200,150,60,0.1)',
              color: '#C8963C', cursor: 'pointer', fontWeight: 700,
            }}>
              保存
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', minHeight: minHeight || 60,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(200,150,60,0.25)', outline: 'none',
            color: '#C8B898', fontSize: 12, lineHeight: 1.7, padding: '10px 12px',
            fontFamily: "'Noto Sans JP', sans-serif", resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <div
          style={{
            fontSize: 12, color: value ? '#888' : '#333', lineHeight: 1.7,
            padding: '10px 12px', border: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.02)', cursor: 'pointer',
            whiteSpace: 'pre-wrap', minHeight: 36,
          }}
          onClick={() => { setDraft(value); setEditing(true); }}
        >
          {value || placeholder}
        </div>
      )}
    </div>
  );
}

export default function KnowledgePage({
  aiModel, onSetAiModel, knowledge, onSaveKnowledge,
}: KnowledgePageProps) {
  const updateField = (field: keyof Knowledge, value: string) => {
    onSaveKnowledge({ ...knowledge, [field]: value });
  };

  const updateRoomPolicy = (roomId: string, value: string) => {
    onSaveKnowledge({
      ...knowledge,
      roomPolicies: { ...knowledge.roomPolicies, [roomId]: value },
    });
  };

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
                ? '1px solid #C8963C' : '1px solid rgba(255,255,255,0.1)',
              background: aiModel === 'claude'
                ? 'rgba(200,150,60,0.12)' : 'rgba(255,255,255,0.02)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: aiModel === 'claude' ? '#C8963C' : '#555',
            }}>Claude</div>
            <div style={{
              fontSize: 9, color: aiModel === 'claude' ? '#A07830' : '#444',
              marginTop: 3, fontFamily: 'monospace',
            }}>Anthropic / Sonnet 4.5</div>
          </button>
          <button
            onClick={() => onSetAiModel('gemini')}
            style={{
              flex: 1, padding: '10px 14px',
              border: aiModel === 'gemini'
                ? '1px solid #4A9EBF' : '1px solid rgba(255,255,255,0.1)',
              background: aiModel === 'gemini'
                ? 'rgba(74,158,191,0.12)' : 'rgba(255,255,255,0.02)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: aiModel === 'gemini' ? '#4A9EBF' : '#555',
            }}>Gemini</div>
            <div style={{
              fontSize: 9, color: aiModel === 'gemini' ? '#3A7E9F' : '#444',
              marginTop: 3, fontFamily: 'monospace',
            }}>Google / 2.0 Flash</div>
          </button>
        </div>
      </div>

      {/* Layer 1: 会社情報 */}
      <div style={{
        fontSize: 11, color: '#C8963C', fontWeight: 700, marginBottom: 10,
        paddingBottom: 6, borderBottom: '1px solid rgba(200,150,60,0.2)',
      }}>
        Layer 1 — 会社情報
      </div>

      <EditableField
        label="会社概要"
        value={knowledge.company}
        onSave={(v) => updateField('company', v)}
        placeholder="例：NOVAIは中小企業向けAIクラウドサービスを開発・提供。"
      />
      <EditableField
        label="ビジョン・目標"
        value={knowledge.vision}
        onSave={(v) => updateField('vision', v)}
        placeholder="例：企業OS（会社全体のOS）として機能するSaaSを構築。"
      />
      <EditableField
        label="今月の最優先方針"
        value={knowledge.priority}
        onSave={(v) => updateField('priority', v)}
        placeholder="例：初契約1社の獲得。タクミに絞る。直販実績を先に作る。"
      />
      <EditableField
        label="パートナー情報"
        value={knowledge.partners}
        onSave={(v) => updateField('partners', v)}
        placeholder="例：社労士パートナー（約50社）、KGホーム、弁護士友人。"
      />

      {/* Layer 2: AIプロンプト設定 */}
      <div style={{
        fontSize: 11, color: '#9B7FD4', fontWeight: 700, marginTop: 24, marginBottom: 10,
        paddingBottom: 6, borderBottom: '1px solid rgba(155,127,212,0.2)',
      }}>
        Layer 2 — AIプロンプト設定（参謀の役割）
      </div>

      <EditableField
        label="AIの役割・判断基準・スタイル"
        value={knowledge.aiPrompt}
        onSave={(v) => updateField('aiPrompt', v)}
        placeholder={`例：\nあなたはNOVAIの経営参謀AIです。\n心理学×経営の両面から判断してください。\n売上直結タスクを最優先にし、\nアイデアは記録のみで実行は後回しにしてください。`}
        minHeight={100}
      />

      {/* Layer 3: 分野ごとの判断方針 */}
      <div style={{
        fontSize: 11, color: '#5BAD72', fontWeight: 700, marginTop: 24, marginBottom: 10,
        paddingBottom: 6, borderBottom: '1px solid rgba(91,173,114,0.2)',
      }}>
        Layer 3 — 分野ごとのAI判断方針
      </div>

      {ROOMS.map(room => (
        <EditableField
          key={room.id}
          label={`${room.icon} ${room.label}`}
          value={knowledge.roomPolicies[room.id] || ''}
          onSave={(v) => updateRoomPolicy(room.id, v)}
          placeholder={`この分野でAIが判断する際の方針を設定...`}
        />
      ))}
    </div>
  );
}
