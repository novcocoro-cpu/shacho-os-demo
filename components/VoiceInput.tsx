'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { RoomDef, Task, AIModel, Knowledge } from '@/lib/types';
import { extractTasksFromMemo } from '@/lib/ai';

const MAX_RECORD_SEC = 60;
const SILENCE_TIMEOUT_MS = 10000;

interface VoiceInputProps {
  room: RoomDef;
  aiModel: AIModel;
  knowledge: Knowledge;
  onAddTasks: (tasks: Task[]) => void;
}

export default function VoiceInput({ room, aiModel, knowledge, onAddTasks }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remainSec, setRemainSec] = useState(MAX_RECORD_SEC);
  const [toast, setToast] = useState('');
  const [displayText, setDisplayText] = useState('');
  const recRef = useRef<SpeechRecognition | null>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalTranscript = useRef('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const cleanup = useCallback(() => {
    if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null; }
    if (maxTimer.current) { clearTimeout(maxTimer.current); maxTimer.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setRemainSec(MAX_RECORD_SEC);
  }, []);

  const processText = useCallback(async (text: string) => {
    if (!text.trim()) {
      showToast('音声が認識されませんでした');
      return;
    }
    console.log('AIに渡すテキスト:', text);
    setLoading(true);
    try {
      const tasks = await extractTasksFromMemo(aiModel, room.label, text, knowledge, room.id);
      if (tasks.length > 0) {
        onAddTasks(tasks);
        showToast(`✓ タスクを${tasks.length}件追加しました`);
      } else {
        showToast('タスク化できる内容はありませんでした');
      }
    } catch (err) {
      console.error('AI処理エラー:', err);
      showToast('エラーが発生しました');
    }
    setLoading(false);
    setDisplayText('');
  }, [aiModel, room.label, room.id, knowledge, onAddTasks]);

  const finishRecording = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
    cleanup();
    const text = finalTranscript.current;
    if (text.trim()) {
      processText(text);
    } else {
      showToast('音声が認識されませんでした');
      setDisplayText('');
    }
    finalTranscript.current = '';
  }, [cleanup, processText]);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    silenceTimer.current = setTimeout(finishRecording, SILENCE_TIMEOUT_MS);
  }, [finishRecording]);

  const startVoice = () => {
    if (listening || loading) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('このブラウザは音声入力に対応していません'); return; }

    const r = new SR();
    r.lang = 'ja-JP';
    r.continuous = true;
    r.interimResults = true;
    finalTranscript.current = '';
    setDisplayText('');

    r.onresult = (e: SpeechRecognitionEvent) => {
      resetSilenceTimer();
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscript.current += transcript;
        } else {
          interim = transcript;
        }
      }
      setDisplayText(finalTranscript.current + interim);
    };

    r.onend = () => {
      setListening(false);
      cleanup();
      const text = finalTranscript.current;
      if (text.trim()) {
        processText(text);
      }
      finalTranscript.current = '';
    };

    r.start();
    recRef.current = r;
    setListening(true);

    resetSilenceTimer();

    setRemainSec(MAX_RECORD_SEC);
    const startTime = Date.now();
    countdownRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setRemainSec(Math.max(0, MAX_RECORD_SEC - elapsed));
    }, 1000);
    maxTimer.current = setTimeout(finishRecording, MAX_RECORD_SEC * 1000);
  };

  useEffect(() => {
    return () => {
      if (recRef.current) recRef.current.stop();
      cleanup();
    };
  }, [cleanup]);

  return (
    <div style={{ position: 'relative' }}>
      {toast && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'rgba(8,10,13,0.96)', border: `1px solid rgba(${room.rgb},0.4)`,
          padding: '6px 10px', fontSize: 10, color: room.color, fontFamily: 'monospace',
          animation: 'fadeIn 0.2s ease', zIndex: 10,
        }}>
          {toast}
        </div>
      )}

      {!listening && !loading && (
        <button onClick={startVoice} style={{
          padding: '3px 8px', fontSize: 9,
          border: `1px solid rgba(${room.rgb},0.3)`,
          background: 'transparent',
          color: `rgba(${room.rgb},0.8)`,
          cursor: 'pointer', fontFamily: 'monospace',
          display: 'flex', alignItems: 'center', gap: 4,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(${room.rgb},0.08)`; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          🎤 話す
        </button>
      )}

      {listening && (
        <div>
          <button onClick={finishRecording} style={{
            padding: '3px 8px', fontSize: 9,
            border: '1px solid rgba(224,123,106,0.5)',
            background: 'rgba(224,123,106,0.12)',
            color: '#E07B6A',
            cursor: 'pointer', fontFamily: 'monospace',
            display: 'flex', alignItems: 'center', gap: 4,
            animation: 'fadeIn 0.2s ease',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#E07B6A', animation: 'blink 0.8s infinite',
              display: 'inline-block',
            }} />
            {remainSec}秒 ■停止
          </button>
          {displayText && (
            <div style={{
              fontSize: 9, color: '#888', fontFamily: 'monospace',
              marginTop: 3, lineHeight: 1.5,
              maxHeight: 48, overflow: 'hidden',
            }}>
              {displayText}
            </div>
          )}
        </div>
      )}

      {loading && (
        <span style={{
          fontSize: 9, color: room.color, fontFamily: 'monospace',
          padding: '3px 8px',
        }}>
          <span style={{ animation: 'blink 0.8s infinite' }}>●</span> AI処理中...
        </span>
      )}
    </div>
  );
}
