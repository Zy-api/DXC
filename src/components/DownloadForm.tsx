import { useState } from 'react';
import { Download, Link2, Zap } from 'lucide-react';

interface DownloadFormProps {
  onSubmit: (url: string, threads: number) => void;
}

const THREAD_OPTIONS = [16, 32, 64, 256, 512];

export function DownloadForm({ onSubmit }: DownloadFormProps) {
  const [url, setUrl] = useState('');
  const [threads, setThreads] = useState(16);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('请输入下载链接');
      return;
    }
    try {
      new URL(url.trim());
    } catch {
      setError('请输入有效的链接');
      return;
    }
    setError('');
    onSubmit(url.trim(), threads);
    setUrl('');
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/60 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">新建下载任务</h2>
          <p className="text-xs text-slate-500">输入直链，选择线程数，开始下载</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
            <Link2 className="w-4 h-4 text-slate-400" />
            下载链接
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/file.zip"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
          />
          {error && (
            <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
              {error}
            </p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
            <Zap className="w-4 h-4 text-slate-400" />
            线程数
          </label>
          <div className="grid grid-cols-5 gap-2">
            {THREAD_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setThreads(opt)}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  threads === opt
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-105'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            更多线程可提升下载速度，但部分服务器可能限制并发数
          </p>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-sm shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          开始下载
        </button>
      </form>
    </div>
  );
}
