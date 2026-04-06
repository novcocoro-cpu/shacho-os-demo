'use client';

import { useState } from 'react';
import { RoomDef, Task, Step, AIModel } from '@/lib/types';
import { PRI_COLOR, PRI_BG, PRI_JP } from '@/lib/constants';
import { generateSteps } from '@/lib/ai';

interface TaskItemProps {
  room: RoomDef;
  task: Task;
  taskKey: string;
  done: boolean;
  isNew: boolean;
  aiModel: AIModel;
  onToggle: () => void;
  onDelete: () => void;
  steps: Step[] | null;
  onSetSteps: (steps: Step[]) => void;
}

function Badge({ p }: { p: string }) {
  return (
    <span style={{
      fontSize: 9, padding: '1px 6px', borderRadius: 3,
      background: PRI_BG[p], color: PRI_COLOR[p], fontFamily: 'monospace',
    }}>
      {PRI_JP[p]}
    </span>
  );
}

function DeadlinePill({ d }: { d: string }) {
  const c = d === '今日' ? '#E07B6A' : d === '今週' ? '#C8963C' : d === '今月' ? '#9B7FD4' : '#555';
  return (
    <span style={{
      fontSize: 9, padding: '1px 6px', borderRadius: 10,
      border: `1px solid ${c}44`, color: c, fontFamily: 'monospace',
    }}>
      {d}
    </span>
  );
}

export default function TaskItem({
  room, task, taskKey, done, isNew, aiModel, onToggle, onDelete, steps, onSetSteps,
}: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const stepDone = steps ? steps.filter(s => s.done).length : 0;
  const stepTotal = steps ? steps.length : 0;

  const handleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !expanded;
    setExpanded(next);
    if (!next || (steps && steps.length > 0)) return;
    setLoading(true);
    try {
      const result = await generateSteps(aiModel, room.label, task.text);
      onSetSteps(result);
    } catch {
      onSetSteps([{ text: '工程の取得に失敗しました', done: false }]);
    }
    setLoading(false);
  };

  const toggleStep = (i: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!steps) return;
    onSetSteps(steps.map((s, idx) => idx === i ? { ...s, done: !s.done } : s));
  };

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 7, padding: '5px 0',
        background: isNew ? 'rgba(200,150,60,0.07)' : 'transparent',
        transition: 'background 0.6s',
      }}>
        <div
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          style={{
            width: 13, height: 13, marginTop: 3, flexShrink: 0, cursor: 'pointer',
            border: `1px solid rgba(${room.rgb},${done ? '1' : '0.35'})`,
            background: done ? room.color : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          {done && <span style={{ fontSize: 7, color: '#080A0D', fontWeight: 700 }}>✓</span>}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
            <div style={{
              fontSize: 10, lineHeight: 1.5,
              color: done ? '#3A3830' : '#C0B8A8',
              textDecoration: done ? 'line-through' : 'none', flex: 1,
            }}>
              {task.text}
            </div>
            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
              {!done && (
                <button onClick={handleExpand} style={{
                  fontSize: 9, padding: '1px 6px',
                  border: `1px solid rgba(${room.rgb},0.28)`,
                  background: expanded ? `rgba(${room.rgb},0.1)` : 'transparent',
                  color: `rgba(${room.rgb},0.8)`,
                  cursor: 'pointer', fontFamily: 'monospace', lineHeight: 1.5,
                  transition: 'all 0.2s',
                }}>
                  {loading ? '…'
                    : expanded && stepTotal > 0 ? `${stepDone}/${stepTotal}`
                    : expanded ? '…'
                    : '▸ 工程'}
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                title="削除"
                style={{
                  fontSize: 10, padding: '1px 5px', lineHeight: 1.5,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent', color: '#3A3830',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#E07B6A';
                  e.currentTarget.style.borderColor = 'rgba(224,123,106,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#3A3830';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                }}
              >
                ✕
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
            {!done && <Badge p={task.priority} />}
            <DeadlinePill d={task.deadline} />
            {isNew && (
              <span style={{ fontSize: 9, color: '#C8963C', fontFamily: 'monospace' }}>AI追加</span>
            )}
          </div>

          {expanded && (
            <div style={{
              marginTop: 8,
              borderLeft: `2px solid rgba(${room.rgb},0.2)`,
              paddingLeft: 10, animation: 'fadeIn 0.2s ease',
            }}>
              {loading ? (
                <div style={{ fontSize: 10, color: '#555', fontFamily: 'monospace', padding: '4px 0' }}>
                  AIが工程を生成中...
                </div>
              ) : steps && steps.length > 0 ? (
                <>
                  {steps.map((step, i) => (
                    <div
                      key={i}
                      onClick={(e) => toggleStep(i, e)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 7,
                        padding: '3px 0', cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: 10, height: 10, marginTop: 3, flexShrink: 0,
                        border: `1px solid rgba(${room.rgb},${step.done ? '0.8' : '0.22'})`,
                        background: step.done ? `rgba(${room.rgb},0.4)` : 'transparent',
                        borderRadius: 2, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', transition: 'all 0.2s',
                      }}>
                        {step.done && <span style={{ fontSize: 6, color: '#E0D8C8' }}>✓</span>}
                      </div>
                      <span style={{
                        fontSize: 10, lineHeight: 1.5,
                        color: step.done ? '#3A3830' : '#807060',
                        textDecoration: step.done ? 'line-through' : 'none',
                        transition: 'all 0.2s',
                      }}>
                        {step.text}
                      </span>
                    </div>
                  ))}
                  <div style={{
                    height: 2, background: 'rgba(255,255,255,0.05)',
                    borderRadius: 1, marginTop: 6,
                  }}>
                    <div style={{
                      width: `${stepTotal ? Math.round(stepDone / stepTotal * 100) : 0}%`,
                      height: '100%', background: `rgba(${room.rgb},0.55)`,
                      borderRadius: 1, transition: 'width 0.3s',
                    }} />
                  </div>
                  <div style={{
                    fontSize: 9, color: `rgba(${room.rgb},0.6)`,
                    fontFamily: 'monospace', marginTop: 4,
                  }}>
                    {stepDone}/{stepTotal} 工程完了
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
