import { useEffect, useState } from 'react';
import { Activity, Gauge, Github, Layers, Zap } from 'lucide-react';
import { DownloadForm } from '@/components/DownloadForm';
import { TaskList } from '@/components/TaskList';
import { useDownloader } from '@/lib/useDownloader';
import { formatSpeed } from '@/lib/format';

function App() {
  const {
    tasks,
    globalSpeed,
    addTask,
    pauseTask,
    resumeTask,
    cancelTask,
    retryTask,
    clearCompleted,
    stopSpeedTimer,
  } = useDownloader();

  const [totalDownloaded, setTotalDownloaded] = useState(0);

  useEffect(() => {
    setTotalDownloaded(tasks.reduce((s, t) => s + t.downloaded, 0));
  }, [tasks]);

  useEffect(() => {
    return () => stopSpeedTimer();
  }, [stopSpeedTimer]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-cyan-50/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="w-6 h-6 text-white" fill="white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              多线程下载器
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            支持 16 / 32 / 64 / 256 / 512 线程 · 不限速 · 直链下载
          </p>
        </header>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-slate-200/60 p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs text-slate-500">总速度</span>
            </div>
            <p className="text-base font-bold text-slate-800">{formatSpeed(globalSpeed)}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-slate-200/60 p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-xs text-slate-500">已下载</span>
            </div>
            <p className="text-base font-bold text-slate-800">{formatSpeed(totalDownloaded).replace('/s', '')}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-slate-200/60 p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-slate-500">任务数</span>
            </div>
            <p className="text-base font-bold text-slate-800">{tasks.length}</p>
          </div>
        </div>

        <div className="mb-6">
          <DownloadForm onSubmit={addTask} />
        </div>

        <TaskList
          tasks={tasks}
          globalSpeed={globalSpeed}
          onPause={pauseTask}
          onResume={resumeTask}
          onCancel={cancelTask}
          onRetry={retryTask}
          onClearCompleted={clearCompleted}
        />

        <footer className="mt-12 text-center">
          <a href="https://github.com/Zy-api/multi-thread-downloader" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
            <Github className="w-3.5 h-3.5" />GitHub 源码
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
