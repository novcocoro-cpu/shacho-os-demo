import { RoomDef, Horizon, Deadline, RoomData } from './types';

export const ROOMS: RoomDef[] = [
  { id: 'dev',      label: '開発・プロダクト', icon: '◈', color: '#C8963C', rgb: '200,150,60'  },
  { id: 'sales',    label: '営業・売上',       icon: '◆', color: '#4A9EBF', rgb: '74,158,191'  },
  { id: 'strategy', label: '経営・戦略',       icon: '◉', color: '#9B7FD4', rgb: '155,127,212' },
  { id: 'finance',  label: '資金・財務',       icon: '◇', color: '#5BAD72', rgb: '91,173,114'  },
  { id: 'ideas',    label: 'アイデア・構想',   icon: '✦', color: '#E07B6A', rgb: '224,123,106' },
  { id: 'org',      label: '組織・人材',       icon: '◎', color: '#A0C4D8', rgb: '160,196,216' },
];

export const HORIZON_FILTER: Record<Horizon, Deadline[]> = {
  今日: ['今日'],
  今週: ['今日', '今週'],
  今月: ['今日', '今週', '今月'],
  今年: ['今日', '今週', '今月', '今年', 'なし'],
};

export const HORIZONS: Horizon[] = ['今日', '今週', '今月', '今年'];

export const PRI_COLOR: Record<string, string> = {
  URGENT: '#E07B6A',
  HIGH:   '#C8963C',
  MED:    '#9B7FD4',
  LOW:    '#777',
};

export const PRI_BG: Record<string, string> = {
  URGENT: 'rgba(224,123,106,0.12)',
  HIGH:   'rgba(200,150,60,0.12)',
  MED:    'rgba(155,127,212,0.12)',
  LOW:    'rgba(120,120,120,0.08)',
};

export const PRI_JP: Record<string, string> = {
  URGENT: '緊急',
  HIGH:   '高',
  MED:    '中',
  LOW:    '低',
};

export const PRESET: Record<string, RoomData> = {
  dev: {
    digest: '奄美実装が最優先',
    memo: '・タクミのUI、Gemini Visionで登記情報抽出するところが鍵\n・クロコに渡す前にUIUXをここで設計する',
    tasks: [
      { text: '奄美 不動産部門の質問セット（初稿）作成',    priority: 'URGENT', deadline: '今日' },
      { text: 'タクミ：物件写真アップロード画面の実装',      priority: 'HIGH',   deadline: '今週' },
      { text: '金属メッキアプリのClaude API課金設定',       priority: 'HIGH',   deadline: '今週' },
      { text: '法務コンシェルジュ：ヒアリング画面デバッグ', priority: 'MED',    deadline: '今月' },
      { text: '行政書士アプリの技術設計メモ',               priority: 'LOW',    deadline: '今年' },
    ],
  },
  sales: {
    digest: 'デモ日程が急務',
    memo: '・KGホームの担当者は物件写真→PDF自動化に一番反応していた\n・宅建協会の会合は来月頭。そこでタクミを見せるのがベスト',
    tasks: [
      { text: '不動産会社社長に宅建協会の会合を打診',     priority: 'MED',    deadline: '今週' },
      { text: '初契約後の紹介フィー設計を整理',           priority: 'LOW',    deadline: '今月' },
      { text: '業界横断データ事業の市場規模調査',         priority: 'LOW',    deadline: '今年' },
    ],
  },
  strategy: {
    digest: '直販1件が最優先',
    memo: '・競合（NotionAI・kintone）が動いている。今のうちに「心理×AI」を深く刻む\n・代理店展開は直販3件の後',
    tasks: [
      { text: '今月の注力プロダクトをタクミ1本に絞る意思決定', priority: 'HIGH', deadline: '今週' },
      { text: '初契約後のケーススタディ文書の構成を作る',      priority: 'MED',  deadline: '今月' },
      { text: 'NOVAIブランド商標登録の弁理士手配',            priority: 'LOW',  deadline: '今月' },
      { text: 'Phase2（不動産・医療展開）の戦略設計',         priority: 'LOW',  deadline: '今年' },
    ],
  },
  finance: {
    digest: '心理顧問で安定収益',
    memo: '・API実費は想定より低い（月数千円〜1万円程度）\n・心理コンサル2社目を早めに固めると精神的余裕ができる',
    tasks: [
      { text: '心理コンサル2社目の契約書を準備',        priority: 'HIGH', deadline: '今週' },
      { text: '3ヶ月無料トライアルの契約テンプレ確認', priority: 'MED',  deadline: '今月' },
      { text: '年間収益目標と逆算スケジュールの作成',   priority: 'MED',  deadline: '今年' },
    ],
  },
  ideas: {
    digest: 'アイデアは記録のみ',
    memo: '・行政書士アプリ：Coworkプラグインベースが有力。対象書類をまず5種類に絞る\n・社長OSと議事録コンサルの連携が本命の差別化',
    tasks: [
      { text: '行政書士アプリの対象書類種別を確定',     priority: 'LOW', deadline: '今月' },
      { text: '社長OSとSupabase連携の設計メモ作成',     priority: 'LOW', deadline: '今月' },
      { text: '業界横断データ事業のビジネスモデル設計', priority: 'LOW', deadline: '今年' },
    ],
  },
  org: {
    digest: 'ブランド整備は中長期',
    memo: '・novai.jp ドメインは取得済み。Vercel設定だけ残っている\n・商標はNOVAIとAiBi両方で確認が必要',
    tasks: [
      { text: 'novai.jp Vercelカスタムドメイン設定',       priority: 'MED', deadline: '今週' },
      { text: 'NOVAIブランドの商標登録 弁理士に相談',     priority: 'MED', deadline: '今月' },
      { text: '紹介パートナーフィー設計（直販1件成約後）', priority: 'LOW', deadline: '今年' },
    ],
  },
};

export const AI_NEW_TASKS = [
  { text: 'KGホームデモ：来週火曜を正式確定・カレンダー登録', priority: 'URGENT' as const, deadline: '今日' as const },
  { text: 'タクミ デモ用：物件写真→マイソク自動生成フローの動作確認', priority: 'HIGH' as const, deadline: '今週' as const },
  { text: '社労士 田中さんへ進捗報告メッセージ送付', priority: 'HIGH' as const, deadline: '今日' as const },
];

export const DEMO_VOICE = 'KGホームへのタクミのデモなんだけど、来週火曜日に確定できそう。先方の担当者が興味持ってくれてて、物件写真を入れればマイソクが自動生成されるところを見せたい。あと社労士の田中さんに3週間連絡してないのが気になってる。今週中に進捗報告しないといけない。';
