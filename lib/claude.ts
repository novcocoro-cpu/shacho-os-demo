import { Step, Task } from './types';

const BASE = 'https://api.anthropic.com/v1/messages';
const HEADERS = {
  'Content-Type': 'application/json',
  'x-api-key': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
};

export async function generateSteps(roomLabel: string, taskText: string): Promise<Step[]> {
  const resp = await fetch(BASE, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 400,
      system: `タスクの実行工程を3〜5ステップで返してください。JSON配列のみ（マークダウン不要）。
["工程1の内容","工程2の内容","工程3の内容"]
各工程は20文字以内の具体的アクション。動詞で終わる。順番通りに並べる。`,
      messages: [{ role: 'user', content: `カテゴリ：${roomLabel}\nタスク：${taskText}` }],
    }),
  });
  const data = await resp.json();
  const text = data.content?.map((b: { text?: string }) => b.text || '').join('') || '[]';
  const arr = JSON.parse(text.replace(/```json|```/g, '').trim());
  return arr.map((t: string) => ({ text: t, done: false }));
}

export async function extractTasksFromMemo(roomLabel: string, memo: string): Promise<Task[]> {
  const resp = await fetch(BASE, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 600,
      system: `メモからタスクを抽出してJSON配列のみ返してください（マークダウン不要）。
[{"text":"タスク内容","priority":"URGENT|HIGH|MED|LOW","deadline":"今日|今週|今月|今年"}]
アクション動詞を含むものだけタスクにする。メモ・感想・背景情報はタスクにしない。`,
      messages: [{ role: 'user', content: `カテゴリ：${roomLabel}\nメモ：\n${memo}` }],
    }),
  });
  const data = await resp.json();
  const text = data.content?.map((b: { text?: string }) => b.text || '').join('') || '[]';
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}
