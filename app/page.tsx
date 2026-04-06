'use client';

import { useState, useEffect, useRef } from 'react';
import { Page, Horizon, Task, Step, RoomData, AIModel } from '@/lib/types';
import { ROOMS, HORIZON_FILTER, PRESET, AI_NEW_TASKS, DEMO_VOICE } from '@/lib/constants';
import NavBar from '@/components/NavBar';
import DemoBar from '@/components/DemoBar';
import Dashboard from '@/components/pages/Dashboard';
import InputPage from '@/components/pages/InputPage';
import KnowledgePage from '@/components/pages/KnowledgePage';

export default function Home() {
  const [page, setPage] = useState<Page>('dash');
  const [horizon, setHorizon] = useState<Horizon>('今日');
  const [rooms, setRooms] = useState<Record<string, RoomData>>(PRESET);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [steps, setSteps] = useState<Record<string, Step[]>>({});
  const [newKeys, setNewKeys] = useState<string[]>([]);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [aiModel, setAiModel] = useState<AIModel>('gemini');
  const [insight, setInsight] = useState<string>(
    'KGホームデモと社労士報告—今日の2大タスク。午前中に田中さんへ連絡を済ませ、午後でデモ日程を確定する順番を推奨します。'
  );

  const [demoStep, setDemoStep] = useState(0);
  const [voiceText, setVoiceText] = useState('');
  const [aiPhase, setAiPhase] = useState(0);
  const typeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Computed values
  const filterTasks = (tasks: Task[]) =>
    tasks.filter(t => HORIZON_FILTER[horizon].includes(t.deadline));

  const allFiltered = ROOMS.flatMap(r =>
    filterTasks(rooms[r.id].tasks).map(t => ({ id: r.id, task: t }))
  );
  const doneFiltered = allFiltered.filter(({ id, task }) =>
    checked[`${id}-${rooms[id].tasks.indexOf(task)}`]
  ).length;
  const overallPct = allFiltered.length
    ? Math.round(doneFiltered / allFiltered.length * 100) : 0;

  // Actions
  const toggle = (key: string) =>
    setChecked(p => ({ ...p, [key]: !p[key] }));

  const deleteTask = (roomId: string, origIdx: number) => {
    setRooms(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        tasks: prev[roomId].tasks.filter((_, i) => i !== origIdx),
      },
    }));
    const key = `${roomId}-${origIdx}`;
    setChecked(p => { const n = { ...p }; delete n[key]; return n; });
    setSteps(p => { const n = { ...p }; delete n[key]; return n; });
  };

  const saveMemo = (roomId: string, text: string) =>
    setRooms(p => ({ ...p, [roomId]: { ...p[roomId], memo: text } }));

  const addTasks = (roomId: string, newTasks: Task[]) =>
    setRooms(p => ({
      ...p,
      [roomId]: { ...p[roomId], tasks: [...newTasks, ...p[roomId].tasks] },
    }));

  const setTaskSteps = (key: string, val: Step[]) =>
    setSteps(p => ({ ...p, [key]: val }));

  // Demo
  const runDemo = () => {
    setPage('input');
    setDemoStep(1);
    setVoiceText('');
    setAiPhase(0);
  };

  const resetDemo = () => {
    setDemoStep(0);
    setVoiceText('');
    setAiPhase(0);
  };

  useEffect(() => {
    if (demoStep !== 1) return;
    let i = 0;
    typeRef.current = setInterval(() => {
      i++;
      setVoiceText(DEMO_VOICE.slice(0, i));
      if (i >= DEMO_VOICE.length) {
        clearInterval(typeRef.current!);
        setTimeout(() => setDemoStep(2), 600);
      }
    }, 26);
    return () => { if (typeRef.current) clearInterval(typeRef.current); };
  }, [demoStep]);

  useEffect(() => {
    if (demoStep !== 2) return;
    setAiPhase(1);
    const t1 = setTimeout(() => setAiPhase(2), 900);
    const t2 = setTimeout(() => setAiPhase(3), 1800);
    const t3 = setTimeout(() => {
      setRooms(p => ({
        ...p,
        sales: { ...p.sales, tasks: [...AI_NEW_TASKS, ...p.sales.tasks] },
      }));
      setInsight(
        'KGホームデモと社労士報告—今日の2大タスク。午前中に田中さんへ連絡、午後でデモ日程を確定する順番を推奨します。'
      );
      setNewKeys(AI_NEW_TASKS.map((_, i) => `sales-${i}`));
      setHighlight('sales');
      setDemoStep(3);
      setPage('dash');
      setHorizon('今日');
      setTimeout(() => setHighlight(null), 2000);
      setTimeout(() => setNewKeys([]), 5000);
    }, 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [demoStep]);

  const demoActive = demoStep > 0 && demoStep < 3;

  return (
    <div style={{
      minHeight: '100vh', background: '#080A0D', color: '#E0D8C8',
      fontFamily: "'Noto Sans JP', sans-serif",
    }}>
      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(200,150,60,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(200,150,60,0.025) 1px,transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      <NavBar
        page={page}
        setPage={setPage}
        horizon={horizon}
        overallPct={overallPct}
        demoActive={demoActive}
      />

      <DemoBar
        demoStep={demoStep}
        aiPhase={aiPhase}
        onStart={runDemo}
        onReset={resetDemo}
      />

      <div style={{ maxWidth: 1020, margin: '0 auto', padding: '18px 16px' }}>
        {page === 'dash' && (
          <Dashboard
            horizon={horizon}
            setHorizon={setHorizon}
            rooms={rooms}
            checked={checked}
            steps={steps}
            newKeys={newKeys}
            highlight={highlight}
            insight={insight}
            aiModel={aiModel}
            onToggle={toggle}
            onDelete={deleteTask}
            onSetSteps={setTaskSteps}
            onSaveMemo={saveMemo}
            onAddTasks={addTasks}
          />
        )}
        {page === 'input' && (
          <InputPage
            demoStep={demoStep}
            voiceText={voiceText}
            aiPhase={aiPhase}
            onRunDemo={runDemo}
          />
        )}
        {page === 'knowledge' && (
          <KnowledgePage aiModel={aiModel} onSetAiModel={setAiModel} />
        )}
      </div>
    </div>
  );
}
