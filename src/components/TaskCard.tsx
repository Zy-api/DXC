import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  X,
  XCircle,
} from 'lucide-react';
import type { DownloadTask } from '@/lib/types';
import { formatProgress, formatSize, formatSpeed, formatTime } from '@/lib/format';

interface TaskCardProps {
  task: DownloadTask;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
}

function statusConfig(status: DownloadTask['status']) {
  switch (status) {
    case 'pending':
      return { icon: Clock, label: '等待中', color: 'text-slate-500', bg: 'bg-slate-100', bar: 'from-slate-300 to-slate-400' };
    case 'downloading':
      return { icon: Loader2, label: '下载中', color: 'text-blue-600', bg: 'bg-blue-50', bar: 'from-blue-500 to-cyan-500' };
    case 'paused':
      return { icon: Pause, label: '已暂停', color: 'text-amber-600', bg: 'bg-amber-50', bar: 'from-amber-400 to-amber-500' };
    case 'completed':
      return { icon: CheckCircle2, label: '已完成', color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'from-emerald-400 to-emerald-500' };
    case 'error':
      return { icon: XCircle, label: '失败', color: 'text-red-600', bg: 'bg-red-50', bar: 'from-red-400 to-red-500' };
  }
}

export function TaskCard({ task, onPause, onResume, onCancel, onRetry }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig(task.status);
  const StatusIcon = cfg.icon;
  const remaining = task.speed > 0 ? (task.totalSize - task.downloaded) / task.speed : Infinity;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
              <StatusIcon className={`w-4.5 h-4.5 ${cfg.color} ${task.status === 'downloading' ? 'animate-spin' : ''}`} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate">{task.filename}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{task.url}</p>
            </div>
          </div>
          <span className={`text-xs font-bold ${cfg.color} ${cfg.bg} px-2.5 py-1 rounded-lg flex-shrink-0`}>
            {cfg.label}
          </span>
        </div>

        <div className="mb-3">
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${cfg.bar} rounded-full transition-all duration-300 ease-out relative overflow-hidden`}
              style={{ width: `${task.progress}%` }}
            >
              {task.status === 'downloading' && (
                <div className="absolute inset-0 bg-white/30 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
          <span className="font-medium">{formatProgress(task.downloaded, task.totalSize).toFixed(1)}%</span>
          <span>{formatSize(task.downloaded)} / {formatSize(task.totalSize)}</span>
          <span className="text-blue-500 font-medium">{formatSpeed(task.speed)}</span>
          {task.status === 'downloading' && isFinite(remaining) && (
            <span>剩余 {formatTime(remaining)}</span>
          )}
          <span className="text-slate-400">{task.threads} 线程</span>
        </div>

        {task.error && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">
            {task.error}
          </div>
        )}

        <div className="flex items-center gap-2">
          {task.status === 'downloading' && (
            <button onClick={() => onPause(task.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium hover:bg-amber-100 transition-colors">
              <Pause className="w-3.5 h-3.5" />暂停
            </button>
          )}
          {task.status === 'paused' && (
            <button onClick={() => onResume(task.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors">
              <Play className="w-3.5 h-3.5" />继续
            </button>
          )}
          {task.status === 'error' && (
            <button onClick={() => onRetry(task.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />重试
            </button>
          )}
          {task.status === 'completed' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600">
              <Download className="w-3.5 h-3.5" />下载完成
            </span>
          )}
          <button onClick={() => onCancel(task.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition-colors ml-auto">
            <X className="w-3.5 h-3.5" />删除
          </button>
        </div>
      </div>
    </div>
  );
}
