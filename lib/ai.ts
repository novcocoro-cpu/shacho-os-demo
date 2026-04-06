import { Step, Task, AIModel } from './types';

// ── Claude API ──────────────────────────────────────────────────────────────
async function callClaude(system: string, userContent: string, maxTokens: number): Promise<string> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!,
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
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: userContent }] }],
      }),
    }
  );
  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
}

// ── Gemini Vision API（画像読み取り）─────────────────────────────────────────
async function callGeminiVision(system: string, base64Data: string, mimeType: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
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
    }
  );
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

export async function generateSteps(model: AIModel, roomLabel: string, taskText: string): Promise<Step[]> {
  const system = `タスクの実行工程を3〜5ステップで返してください。JSON配列のみ（マークダウン不要）。
["工程1の内容","工程2の内容","工程3の内容"]
各工程は20文字以内の具体的アクション。動詞で終わる。順番通りに並べる。`;
  const text = await callAI(model, system, `カテゴリ：${roomLabel}\nタスク：${taskText}`, 400);
  const arr = JSON.parse(text.replace(/```json|```/g, '').trim());
  return arr.map((t: string) => ({ text: t, done: false }));
}

export async function extractTasksFromMemo(model: AIModel, roomLabel: string, memo: string): Promise<Task[]> {
  const system = `話された内容からやるべきことを何でも抽出してください。
完全な文章でなくても、単語・断片的な内容でもタスクにする。
「〜したい」「〜が気になる」「〜しないと」も全部タスクにする。
JSON配列のみ返す（マークダウン不要）：
[{"text":"タスク内容","priority":"URGENT|HIGH|MED|LOW","deadline":"今日|今週|今月|今年"}]`;
  const text = await callAI(model, system, `カテゴリ：${roomLabel}\nメモ：\n${memo}`, 600);
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

export async function extractTasksFromImage(roomLabel: string, base64Data: string, mimeType: string): Promise<Task[]> {
  const system = `画像の内容を読み取り、やるべきことを何でも抽出してください。
完全な文章でなくても、単語・断片的な内容でもタスクにする。
「〜したい」「〜が気になる」「〜しないと」も全部タスクにする。
画像にテキストが含まれていない場合や、タスク化できる内容がない場合は空配列[]を返す。
JSON配列のみ返す（マークダウン不要）：
[{"text":"タスク内容","priority":"URGENT|HIGH|MED|LOW","deadline":"今日|今週|今月|今年"}]`;
  const text = await callGeminiVision(system, base64Data, mimeType);
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

export async function readImageContent(base64Data: string, mimeType: string): Promise<string> {
  const system = `画像の内容を読み取り、書かれているテキストや内容を日本語で正確に文字起こししてください。
マークダウンは不要です。プレーンテキストで返してください。`;
  return await callGeminiVision(system, base64Data, mimeType);
}
