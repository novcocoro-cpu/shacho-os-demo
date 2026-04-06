'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RoomDef, Task, AIModel } from '@/lib/types';
import { extractTasksFromMemo } from '@/lib/ai';

const MAX_RECORD_SEC = 60;
const SILENCE_TIMEOUT_MS = 3000;

interface MemoPanelProps {
  room: RoomDef;
  memo: string;
  aiModel: AIModel;
  onSave: (text: string) => void;
  onAddTasks: (tasks: Task[]) => void;
}

export default function MemoPanel({ room, memo, aiModel, onSave, onAddTasks }: MemoPanelProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEdit] = useState(false);
  const [draft, setDraft] = useState(memo);
  const [listening, setListen] = useState(false);
  const [aiLoading, setAiLoad] = useState(false);
  const [toast, setToast] = useState('');
  const [remainSec, setRemainSec] = useState(MAX_RECORD_SEC);
  const ref = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<SpeechRecognition | null>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTranscript = useRef('');

  const lines = memo ? memo.split('\n').filter(Boolean) : [];
  const preview = lines[0] || null;

  const save = () => { onSave(draft); setEdit(false); };
  const cancel = () => { setDraft(memo); setEdit(false); };

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [draft, editing]);

  const stopVoice = useCallback(() => {
    recRef.current?.stop();
    setListen(false);
    if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null; }
    if (maxTimer.current) { clearTimeout(maxTimer.current); maxTimer.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setRemainSec(MAX_RECORD_SEC);
  }, []);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    silenceTimer.current = setTimeout(() => {
      stopVoice();
      showToast('無音のため自動停止しました');
    }, SILENCE_TIMEOUT_MS);
  }, [stopVoice]);

  const toggleVoice = () => {
    if (listening) {
      stopVoice();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('このブラウザは音声入力に対応していません'); return; }
    const r = new SR();
    r.lang = 'ja-JP';
    r.continuous = true;
    r.interimResults = false;
    lastTranscript.current = '';

    r.onresult = (e: SpeechRecognitionEvent) => {
      resetSilenceTimer();
      const latest = Array.from(e.results)
        .filter(res => res.isFinal)
        .map(res => res[0].transcript)
        .join('');
      if (!latest.trim()) return;
      // Deduplicate: skip if same as last transcript
      if (latest.trim() === lastTranscript.current.trim()) return;
      lastTranscript.current = latest;
      setDraft(prev => {
        const base = prev.trimEnd();
        return base ? base + '\n' + latest : latest;
      });
    };

    r.onend = () => {
      setListen(false);
      if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null; }
      if (maxTimer.current) { clearTimeout(maxTimer.current); maxTimer.current = null; }
      if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
      setRemainSec(MAX_RECORD_SEC);
    };

    r.start();
    recRef.current = r;
    setListen(true);

    // Start silence timer
    resetSilenceTimer();

    // Max recording time (60s)
    setRemainSec(MAX_RECORD_SEC);
    const startTime = Date.now();
    countdownRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setRemainSec(Math.max(0, MAX_RECORD_SEC - elapsed));
    }, 1000);
    maxTimer.current = setTimeout(() => {
      stopVoice();
      showToast('録音時間の上限（60秒）に達しました');
    }, MAX_RECORD_SEC * 1000);
  };

  const extractTasks = async () => {
    if (!draft.trim()) return;
    setAiLoad(true);
    try {
      const tasks = await extractTasksFromMemo(aiModel, room.label, draft);
      if (tasks.length) {
        onAddTasks(tasks);
        showToast(`✓ タスクを${tasks.length}件追加しました`);
      } else {
        showToast('タスク化できる内容が見つかりませんでした');
      }
    } catch {
      showToast('エラーが発生しました');
    }
    setAiLoad(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recRef.current) recRef.current.stop();
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      if (maxTimer.current) clearTimeout(maxTimer.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  return (
    <div style={{
      marginTop: 10, borderTop: `1px solid rgba(${room.rgb},0.15)`,
      paddingTop: 8, position: 'relative',
    }}>
      {toast && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'rgba(8,10,13,0.96)', border: `1px solid rgba(${room.rgb},0.4)`,
          padding: '6px 10px', fontSize: 10, color: room.color, fontFamily: 'monospace',
          animation: 'fadeIn 0.2s ease', zIndex: 10,
        }}>
          {toast}
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: open ? 8 : 0,
      }}>
        <button
          onClick={() => { setOpen(o => !o); if (!open) setEdit(false); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          <span style={{
            fontSize: 9, color: `rgba(${room.rgb},0.7)`,
            fontFamily: 'monospace', letterSpacing: '0.12em',
          }}>
            {open ? '▾' : '▸'} MEMO
          </span>
          {!open && (preview
            ? <span style={{
                fontSize: 10, color: '#555', maxWidth: 140,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{preview}</span>
            : <span style={{ fontSize: 10, color: '#333' }}>タップして追加</span>
          )}
        </button>

        {open && !editing && (
          <button onClick={() => setEdit(true)} style={{
            fontSize: 9, padding: '2px 8px',
            border: `1px solid rgba(${room.rgb},0.3)`, background: 'transparent',
            color: room.color, cursor: 'pointer', fontFamily: 'monospace',
          }}>
            ✎ 編集
          </button>
        )}

        {open && editing && !listening && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button onClick={toggleVoice} style={{
              width: 24, height: 24, borderRadius: '50%',
              border: `1px solid rgba(${room.rgb},0.4)`,
              background: 'transparent',
              color: room.color, cursor: 'pointer', fontSize: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              ♪
            </button>
            <button onClick={cancel} style={{
              fontSize: 9, padding: '2px 8px',
              border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
              color: '#555', cursor: 'pointer',
            }}>
              ✕
            </button>
            <button onClick={save} style={{
              fontSize: 9, padding: '2px 8px',
              border: `1px solid rgba(${room.rgb},0.5)`, background: `rgba(${room.rgb},0.1)`,
              color: room.color, cursor: 'pointer', fontWeight: 700,
            }}>
              保存
            </button>
          </div>
        )}
      </div>

      {open && (
        <div style={{ animation: 'fadeIn 0.15s ease' }}>
          {editing ? (
            <>
              {listening && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 6, padding: '6px 10px',
                  background: 'rgba(224,123,106,0.1)',
                  border: '1px solid rgba(224,123,106,0.3)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#E07B6A', animation: 'blink 0.8s infinite',
                    }} />
                    <span style={{ fontSize: 10, color: '#E07B6A', fontFamily: 'monospace' }}>
                      録音中　残り {remainSec}秒
                    </span>
                  </div>
                  <button onClick={stopVoice} style={{
                    padding: '4px 14px', fontSize: 11, fontWeight: 700,
                    background: '#E07B6A', border: 'none', color: '#080A0D',
                    cursor: 'pointer',
                  }}>
                    ■ 停止
                  </button>
                </div>
              )}
              <textarea
                ref={ref}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={'・気になること\n・覚えておきたいこと\n\n話した内容もここに入ります'}
                style={{
                  width: '100%', minHeight: 72, background: 'rgba(255,255,255,0.025)',
                  border: `1px solid rgba(${room.rgb},0.25)`, outline: 'none',
                  color: '#C8B898', fontSize: 11, lineHeight: 1.8, padding: '8px 10px',
                  fontFamily: 'sans-serif', resize: 'none', boxSizing: 'border-box',
                }}
              />
              {draft.trim() && (
                <button onClick={extractTasks} disabled={aiLoading} style={{
                  width: '100%', marginTop: 6, padding: '7px 10px', fontSize: 10,
                  border: `1px solid rgba(${room.rgb},0.35)`, background: `rgba(${room.rgb},0.07)`,
                  color: aiLoading ? '#555' : room.color,
                  cursor: aiLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'monospace', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 6,
                }}>
                  {aiLoading ? 'AIが抽出中...' : '◈ このメモからタスクをAIで抽出 → TODOリストに追加'}
                </button>
              )}
            </>
          ) : (
            <div
              style={{
                fontSize: 11, color: '#706860', lineHeight: 1.8,
                padding: '6px 2px', whiteSpace: 'pre-wrap', minHeight: 36, cursor: 'text',
              }}
              onClick={() => setEdit(true)}
            >
              {memo || <span style={{ color: '#333' }}>+ タップしてメモを追加...</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
