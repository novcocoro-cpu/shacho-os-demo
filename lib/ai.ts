import { Step, Task, AIModel, Knowledge } from './types';

// ── ナレッジコンテキスト生成 ─────────────────────────────────────────────────
function buildKnowledgeContext(knowledge?: Knowledge, roomId?: string): string {
  if (!knowledge) return '';
  const parts: string[] = [];
  if (knowledge.company) parts.push(`会社概要：${knowledge.company}`);
  if (knowledge.vision) parts.push(`ビジョン：${knowledge.vision}`);
  if (knowledge.priority) parts.push(`今月の最優先方針：${knowledge.priority}`);
  if (knowledge.partners) parts.push(`パートナー：${knowledge.partners}`);
  if (knowledge.aiPrompt) parts.push(`AI役割設定：${knowledge.aiPrompt}`);
  if (roomId && knowledge.roomPolicies[roomId]) {
    parts.push(`この分野の判断方針：${knowledge.roomPolicies[roomId]}`);
  }
  return parts.length > 0 ? '\n\n【会社ナレッジ】\n' + parts.join('\n') : '';
}

// ── JSONを安全に抽出 ────────────────────────────────────────────────────────
function extractJSON(raw: string): string {
  // マークダウンのコードブロックを除去
  let text = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  // JSON配列の部分だけ抽出
  const match = text.match(/\[[\s\S]*\]/);
  if (match) return match[0];
  return text;
}

// ── Claude API ──────────────────────────────────────────────────────────────
async function callClaude(system: string, userContent: string, maxTokens: number): Promise<string> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': (process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ?? '').trim(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userContent }],
    }),
  });
  const data = await resp.json();
  return data.content?.map((b: { text?: string }) => b.text || '').join('') || '[]';
}

// ── Gemini API ──────────────────────────────────────────────────────────────
async function callGemini(system: string, userContent: string): Promise<string> {
  const apiKey = (process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? '').trim();
  if (!apiKey) {
    console.error('NEXT_PUBLIC_GEMINI_API_KEY が設定されていません');
    throw new Error('Gemini APIキーが未設定です');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  console.log('Gemini API URL:', url.replace(apiKey, apiKey.slice(0, 8) + '...'));
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: userContent }] }],
    }),
  });
  if (!resp.ok) {
    const errorText = await resp.text();
    console.error('Gemini APIエラー:', resp.status, errorText);
    throw new Error(`Gemini API ${resp.status}: ${errorText.slice(0, 200)}`);
  }
  const data = await resp.json();
  console.log('Gemini レスポンス:', JSON.stringify(data).slice(0, 500));
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error('Gemini レスポンスにテキストなし:', JSON.stringify(data).slice(0, 500));
    return '[]';
  }
  return text;
}

// ── Gemini Vision API（画像読み取り）─────────────────────────────────────────
async function callGeminiVision(system: string, base64Data: string, mimeType: string): Promise<string> {
  const apiKey = (process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? '').trim();
  if (!apiKey) throw new Error('Gemini APIキーが未設定です');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{
        parts: [
          { text: '添付された画像・ドキュメントの内容を読み取って処理してください。' },
          { inline_data: { mime_type: mimeType, data: base64Data } },
        ],
      }],
    }),
  });
  if (!resp.ok) {
    const errorText = await resp.text();
    console.error('Gemini Vision APIエラー:', resp.status, errorText);
    throw new Error(`Gemini Vision API ${resp.status}`);
  }
  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
}

// ── 共通呼び出し ────────────────────────────────────────────────────────────
async function callAI(model: AIModel, system: string, userContent: string, maxTokens: number = 400): Promise<string> {
  if (model === 'gemini') {
    return callGemini(system, userContent);
  }
  return callClaude(system, userContent, maxTokens);
}

// ── ファイルテキスト抽出 ────────────────────────────────────────────────────
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'txt') {
    return await file.text();
  }

  if (ext === 'pdf') {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((item: unknown) => (item as { str?: string }).str || '').join(' '));
    }
    return pages.join('\n');
  }

  if (ext === 'docx') {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  return '';
}

// ── ファイルをBase64に変換 ───────────────────────────────────────────────────
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── ファイルが画像かどうか ──────────────────────────────────────────────────
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

// ── 公開関数 ────────────────────────────────────────────────────────────────

export async function generateSteps(model: AIModel, roomLabel: string, taskText: string, knowledge?: Knowledge, roomId?: string): Promise<Step[]> {
  const ctx = buildKnowledgeContext(knowledge, roomId);
  const system = `タスクの実行工程を3〜5ステップで返してください。JSON配列のみ（マークダウン不要）。
["工程1の内容","工程2の内容","工程3の内容"]
各工程は20文字以内の具体的アクション。動詞で終わる。順番通りに並べる。${ctx}`;
  const raw = await callAI(model, system, `カテゴリ：${roomLabel}\nタスク：${taskText}`, 400);
  const text = extractJSON(raw);
  const arr = JSON.parse(text);
  return arr.map((t: string) => ({ text: t, done: false }));
}

export async function extractTasksFromMemo(model: AIModel, roomLabel: string, memo: string, knowledge?: Knowledge, roomId?: string): Promise<Task[]> {
  const ctx = buildKnowledgeContext(knowledge, roomId);
  const system = `以下の発言から、やるべきことを何でも抽出してください。
断片的・口語的な内容でも必ずタスクにする。
「〜したい」「〜が気になる」「〜しないと」も全部タスク化する。
最低1件は必ず返す。本当に何もなければ「内容を確認する」をタスクにする。
JSON配列のみ返す（マークダウン不要）：
[{"text":"タスク内容","priority":"URGENT|HIGH|MED|LOW","deadline":"今日|今週|今月|今年"}]${ctx}`;
  console.log('extractTasksFromMemo 呼び出し:', { model, roomLabel, memoLength: memo.length, memo: memo.slice(0, 100) });
  const raw = await callAI(model, system, `カテゴリ：${roomLabel}\n発言内容：\n${memo}`, 600);
  console.log('AI生レスポンス:', raw.slice(0, 300));
  const text = extractJSON(raw);
  console.log('JSON抽出結果:', text.slice(0, 300));
  return JSON.parse(text);
}

export async function extractTasksFromImage(roomLabel: string, base64Data: string, mimeType: string, knowledge?: Knowledge, roomId?: string): Promise<Task[]> {
  const ctx = buildKnowledgeContext(knowledge, roomId);
  const system = `画像の内容を読み取り、やるべきことを何でも抽出してください。
完全な文章でなくても、単語・断片的な内容でもタスクにする。
「〜したい」「〜が気になる」「〜しないと」も全部タスクにする。
画像にテキストが含まれていない場合や、タスク化できる内容がない場合は空配列[]を返す。
JSON配列のみ返す（マークダウン不要）：
[{"text":"タスク内容","priority":"URGENT|HIGH|MED|LOW","deadline":"今日|今週|今月|今年"}]${ctx}`;
  const raw = await callGeminiVision(system, base64Data, mimeType);
  const text = extractJSON(raw);
  return JSON.parse(text);
}

export async function readImageContent(base64Data: string, mimeType: string): Promise<string> {
  const system = `画像の内容を読み取り、書かれているテキストや内容を日本語で正確に文字起こししてください。
マークダウンは不要です。プレーンテキストで返してください。`;
  return await callGeminiVision(system, base64Data, mimeType);
}
