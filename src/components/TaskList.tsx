import { CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import type { DownloadTask } from '@/lib/types';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: DownloadTask[];
  globalSpeed: number;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onClearCompleted: () => void;
}

export function TaskList({
  tasks,
  globalSpeed,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onClearCompleted,
}: TaskListProps) {
  const activeCount = tasks.filter((t) => t.status === 'downloading' || t.status === 'pending').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Loader2 className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-400">暂无下载任务</p>
        <p className="text-xs text-slate-300 mt-1">在上方输入链接开始下载</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-slate-700">下载列表</h3>
          <span className="text-xs text-slate-400">共 {tasks.length} 个任务</span>
          {activeCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />{activeCount} 个进行中
            </span>
          )}
          {completedCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="w-3 h-3" />{completedCount} 个已完成
            </span>
          )}
        </div>
        {completedCount > 0 && (
          <button onClick={onClearCompleted} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-100 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />清除已完成
          </button>
        )}
      </div>

      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onPause={onPause} onResume={onResume} onCancel={onCancel} onRetry={onRetry} />
      ))}
    </div>
  );
}
