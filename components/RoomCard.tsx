'use client';

import { RoomDef, Task, Step, Horizon, AIModel } from '@/lib/types';
import { HORIZON_FILTER } from '@/lib/constants';
import TaskItem from './TaskItem';
import MemoPanel from './MemoPanel';

interface RoomCardProps {
  room: RoomDef;
  digest: string;
  memo: string;
  tasks: Task[];
  horizon: Horizon;
  highlight: boolean;
  checked: Record<string, boolean>;
  steps: Record<string, Step[]>;
  newKeys: string[];
  aiModel: AIModel;
  onToggle: (key: string) => void;
  onDelete: (roomId: string, origIdx: number) => void;
  onSetSteps: (key: string, steps: Step[]) => void;
  onSaveMemo: (roomId: string, text: string) => void;
  onAddTasks: (roomId: string, tasks: Task[]) => void;
}

export default function RoomCard({
  room, digest, memo, tasks, horizon, highlight,
  checked, steps, newKeys, aiModel,
  onToggle, onDelete, onSetSteps, onSaveMemo, onAddTasks,
}: RoomCardProps) {
  const filterTasks = (ts: Task[]) => ts.filter(t => HORIZON_FILTER[horizon].includes(t.deadline));
  const vis = filterTasks(tasks);
  const totalDone = tasks.filter((_, i) => checked[`${room.id}-${i}`]).length;
  const totalPct = tasks.length ? Math.round(totalDone / tasks.length * 100) : 0;

  return (
    <div style={{
      border: `1px solid rgba(${room.rgb},${highlight ? '0.8' : vis.length ? '0.28' : '0.1'})`,
      background: `rgba(${room.rgb},${highlight ? '0.1' : vis.length ? '0.04' : '0.015'})`,
      padding: 15, display: 'flex', flexDirection: 'column',
      transition: 'all 0.4s',
      boxShadow: highlight ? `0 0 24px rgba(${room.rgb},0.2)` : 'none',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 8,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ color: room.color, fontSize: 12 }}>{room.icon}</span>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: vis.length ? '#E0D8C8' : '#484440',
            }}>
              {room.label}
            </span>
            {highlight && (
              <span style={{ fontSize: 8, color: room.color, fontFamily: 'monospace' }}>● NEW</span>
            )}
          </div>
          {digest && (
            <div style={{ fontSize: 9, color: room.color, fontStyle: 'italic' }}>
              「{digest}」
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 17, fontWeight: 700, color: room.color, fontFamily: 'monospace',
          }}>
            {totalPct}<span style={{ fontSize: 9 }}>%</span>
          </div>
          <div style={{ fontSize: 9, color: '#444' }}>{totalDone}/{tasks.length}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 2, background: 'rgba(255,255,255,0.07)',
        borderRadius: 2, marginBottom: 10,
      }}>
        <div style={{
          width: `${totalPct}%`, height: '100%',
          background: room.color, borderRadius: 2, transition: 'width 0.5s',
        }} />
      </div>

      {/* Tasks */}
      <div style={{ flex: 1 }}>
        {vis.length === 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', height: 60,
          }}>
            <div style={{ fontSize: 9, color: '#333', fontFamily: 'monospace' }}>
              {tasks.length > 0 ? `「${horizon}」の期限タスクなし` : 'タスクなし'}
            </div>
          </div>
        ) : (
          vis.slice(0, 4).map(task => {
            const origIdx = tasks.indexOf(task);
            const key = `${room.id}-${origIdx}`;
            return (
              <TaskItem
                key={key}
                room={room}
                task={task}
                taskKey={key}
                done={!!checked[key]}
                isNew={newKeys.includes(key)}
                aiModel={aiModel}
                onToggle={() => onToggle(key)}
                onDelete={() => onDelete(room.id, origIdx)}
                steps={steps[key] || null}
                onSetSteps={(val) => onSetSteps(key, val)}
              />
            );
          })
        )}
        {vis.length > 4 && (
          <div style={{ fontSize: 9, color: '#444', marginTop: 4 }}>+{vis.length - 4}件</div>
        )}
      </div>

      {/* Memo */}
      <MemoPanel
        room={room}
        memo={memo}
        aiModel={aiModel}
        onSave={(text) => onSaveMemo(room.id, text)}
        onAddTasks={(newTasks) => onAddTasks(room.id, newTasks)}
      />
    </div>
  );
}
