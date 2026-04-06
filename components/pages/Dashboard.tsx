'use client';

import { Task, Step, Horizon, RoomData, AIModel } from '@/lib/types';
import { ROOMS, HORIZONS, HORIZON_FILTER } from '@/lib/constants';
import RoomCard from '@/components/RoomCard';

interface DashboardProps {
  horizon: Horizon;
  setHorizon: (h: Horizon) => void;
  rooms: Record<string, RoomData>;
  checked: Record<string, boolean>;
  steps: Record<string, Step[]>;
  newKeys: string[];
  highlight: string | null;
  insight: string;
  aiModel: AIModel;
  onToggle: (key: string) => void;
  onDelete: (roomId: string, origIdx: number) => void;
  onSetSteps: (key: string, steps: Step[]) => void;
  onSaveMemo: (roomId: string, text: string) => void;
  onAppendMemo: (roomId: string, text: string) => void;
  onAddTasks: (roomId: string, tasks: Task[]) => void;
}

export default function Dashboard({
  horizon, setHorizon, rooms, checked, steps, newKeys, highlight, insight, aiModel,
  onToggle, onDelete, onSetSteps, onSaveMemo, onAppendMemo, onAddTasks,
}: DashboardProps) {
  const filterTasks = (tasks: Task[]) =>
    tasks.filter(t => HORIZON_FILTER[horizon].includes(t.deadline));

  const allFiltered = ROOMS.flatMap(r =>
    filterTasks(rooms[r.id].tasks).map(t => ({ id: r.id, task: t }))
  );
  const doneFiltered = allFiltered.filter(({ id, task }) =>
    checked[`${id}-${rooms[id].tasks.indexOf(task)}`]
  ).length;
  const overallPct = allFiltered.length ? Math.round(doneFiltered / allFiltered.length * 100) : 0;
  const urgentCount = allFiltered.filter(({ task }) =>
    task.priority === 'URGENT' || task.deadline === '今日'
  ).length;

  return (
    <div>
      {/* AI insight */}
      <div style={{
        marginBottom: 14, padding: '10px 16px',
        background: 'rgba(200,150,60,0.05)', borderLeft: '3px solid #C8963C',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <span style={{
          fontSize: 9, color: '#C8963C', fontFamily: 'monospace',
          marginTop: 1, flexShrink: 0,
        }}>
          AI▶
        </span>
        <div style={{ fontSize: 12, color: '#C8963C', lineHeight: 1.7 }}>{insight}</div>
      </div>

      {/* Horizon tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
        {HORIZONS.map(h => {
          const cnt = ROOMS.reduce((a, r) =>
            a + rooms[r.id].tasks.filter(t => HORIZON_FILTER[h].includes(t.deadline)).length, 0
          );
          return (
            <button key={h} onClick={() => setHorizon(h)} style={{
              padding: '6px 16px', fontSize: 11, letterSpacing: '0.08em',
              border: horizon === h ? '1px solid #C8963C' : '1px solid rgba(200,150,60,0.18)',
              background: horizon === h ? 'rgba(200,150,60,0.12)' : 'transparent',
              color: horizon === h ? '#C8963C' : '#555',
              cursor: 'pointer', fontFamily: 'monospace',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
            }}>
              {h}
              <span style={{
                fontSize: 9, padding: '1px 5px', borderRadius: 8,
                background: horizon === h ? 'rgba(200,150,60,0.3)' : 'rgba(255,255,255,0.07)',
                color: horizon === h ? '#C8963C' : '#555',
              }}>
                {cnt}
              </span>
            </button>
          );
        })}
        <div style={{ marginLeft: 'auto', fontSize: 10, color: '#444', fontFamily: 'monospace' }}>
          {doneFiltered}/{allFiltered.length} 完了
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
        gap: 8, marginBottom: 14,
      }}>
        {[
          { v: allFiltered.length, l: `${horizon}のタスク`, c: '#E0D8C8' },
          { v: doneFiltered,       l: '完了済み',           c: '#5BAD72' },
          { v: urgentCount,        l: '緊急・今日中',       c: '#E07B6A' },
          { v: `${overallPct}%`,   l: `${horizon}の進捗`,  c: '#C8963C' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px',
          }}>
            <div style={{
              fontSize: 20, fontWeight: 700, color: s.c, fontFamily: 'monospace',
            }}>
              {s.v}
            </div>
            <div style={{ fontSize: 10, color: '#555', marginTop: 1 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Room grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {ROOMS.map(room => (
          <RoomCard
            key={room.id}
            room={room}
            digest={rooms[room.id].digest}
            memo={rooms[room.id].memo}
            tasks={rooms[room.id].tasks}
            horizon={horizon}
            highlight={highlight === room.id}
            checked={checked}
            steps={steps}
            newKeys={newKeys}
            aiModel={aiModel}
            onToggle={onToggle}
            onDelete={onDelete}
            onSetSteps={onSetSteps}
            onSaveMemo={onSaveMemo}
            onAppendMemo={onAppendMemo}
            onAddTasks={onAddTasks}
          />
        ))}
      </div>
    </div>
  );
}
