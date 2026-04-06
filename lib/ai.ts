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

// ── 共通呼び出し ────────────────────────────────────────────────────────────
async function callAI(model: AIModel, system: string, userContent: string, maxTokens: number = 400): Promise<string> {
  if (model === 'gemini') {
    return callGemini(system, userContent);
  }
  return callClaude(system, userContent, maxTokens);
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
  const system = `メモからタスクを抽出してJSON配列のみ返してください（マークダウン不要）。
[{"text":"タスク内容","priority":"URGENT|HIGH|MED|LOW","deadline":"今日|今週|今月|今年"}]
アクション動詞を含むものだけタスクにする。メモ・感想・背景情報はタスクにしない。`;
  const text = await callAI(model, system, `カテゴリ：${roomLabel}\nメモ：\n${memo}`, 600);
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}
