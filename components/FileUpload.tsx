'use client';

import { useState, useRef } from 'react';
import { RoomDef, Task, AIModel, Knowledge } from '@/lib/types';
import {
  extractTextFromFile, fileToBase64, isImageFile,
  extractTasksFromMemo, extractTasksFromImage, readImageContent,
} from '@/lib/ai';

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.txt,.docx';

interface FileUploadProps {
  room: RoomDef;
  aiModel: AIModel;
  knowledge: Knowledge;
  onAddTasks: (tasks: Task[]) => void;
  onAppendMemo: (text: string) => void;
}

export default function FileUpload({ room, aiModel, knowledge, onAddTasks, onAppendMemo }: FileUploadProps) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFileName(file.name);

    try {
      if (isImageFile(file)) {
        // 画像 → Gemini Visionで読み取り
        const base64 = await fileToBase64(file);
        const mimeType = file.type;

        // テキスト内容を読み取ってメモに追加
        const content = await readImageContent(base64, mimeType);
        if (content.trim()) {
          onAppendMemo(content.trim());
        }

        // タスク抽出
        const tasks = await extractTasksFromImage(room.label, base64, mimeType, knowledge, room.id);
        if (tasks.length > 0) {
          onAddTasks(tasks);
          showToast(`✓ ファイルを読み込み、${tasks.length}件のタスクを追加しました`);
        } else {
          showToast('✓ ファイルを読み込みました（タスク化できる内容はありませんでした）');
        }
      } else {
        // PDF・TXT・DOCX → テキスト抽出
        const text = await extractTextFromFile(file);
        if (!text.trim()) {
          showToast('ファイルからテキストを抽出できませんでした');
          setLoading(false);
          return;
        }

        // メモに追加
        onAppendMemo(text.trim());

        // AIでタスク抽出
        const tasks = await extractTasksFromMemo(aiModel, room.label, text, knowledge, room.id);
        if (tasks.length > 0) {
          onAddTasks(tasks);
          showToast(`✓ ファイルを読み込み、${tasks.length}件のタスクを追加しました`);
        } else {
          showToast('✓ ファイルを読み込みました（タスク化できる内容はありませんでした）');
        }
      }
    } catch (err) {
      console.error('ファイル処理エラー:', err);
      showToast('ファイルの処理中にエラーが発生しました');
    }

    setLoading(false);
    // Reset input so same file can be re-uploaded
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div style={{ position: 'relative' }}>
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

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        style={{
          width: '100%', padding: '6px 10px', fontSize: 10,
          border: `1px solid rgba(${room.rgb},0.2)`,
          background: loading ? `rgba(${room.rgb},0.08)` : 'transparent',
          color: loading ? '#555' : `rgba(${room.rgb},0.7)`,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'monospace', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 6, transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!loading) e.currentTarget.style.background = `rgba(${room.rgb},0.06)`;
        }}
        onMouseLeave={(e) => {
          if (!loading) e.currentTarget.style.background = 'transparent';
        }}
      >
        {loading ? (
          <>
            <span style={{ animation: 'blink 0.8s infinite' }}>●</span>
            ファイルを処理中...
          </>
        ) : (
          '📎 ファイルを読み込む'
        )}
      </button>

      {fileName && (
        <div style={{
          fontSize: 9, color: '#444', marginTop: 3,
          fontFamily: 'monospace', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {loading ? '処理中: ' : '最終: '}{fileName}
        </div>
      )}

      <div style={{
        fontSize: 8, color: '#333', marginTop: 2, fontFamily: 'monospace',
      }}>
        PDF / 画像 / TXT / DOCX
      </div>
    </div>
  );
}
