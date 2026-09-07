import type { DownloadTask, ThreadRange } from './types';

interface ThreadState {
  range: ThreadRange;
  controller: AbortController;
  loaded: number;
  chunks: Uint8Array[];
}

export class MultiThreadDownloader {
  private threads = new Map<number, ThreadState>();
  private totalLoaded = 0;
  private totalSize = 0;
  private speedSamples: { time: number; bytes: number }[] = [];
  private lastSpeedTime = 0;
  private currentSpeed = 0;
  private paused = false;
  private aborted = false;
  private filename: string;
  private onProgress: (loaded: number, total: number, speed: number) => void;
  private onComplete: () => void;
  private onError: (error: string) => void;

  constructor(opts: {
    filename: string;
    onProgress: (loaded: number, total: number, speed: number) => void;
    onComplete: () => void;
    onError: (error: string) => void;
  }) {
    this.filename = opts.filename;
    this.onProgress = opts.onProgress;
    this.onComplete = opts.onComplete;
    this.onError = opts.onError;
  }

  async start(url: string, threads: number): Promise<void> {
    this.aborted = false;
    this.paused = false;

    let acceptRanges = '';
    let contentLength = 0;

    // Try HEAD to probe range support; fall back to GET if HEAD fails
    try {
      const head = await fetch(url, { method: 'HEAD' });
      if (head.ok) {
        acceptRanges = (head.headers.get('Accept-Ranges') || '').toLowerCase();
        contentLength = parseInt(
          head.headers.get('Content-Length') || '0',
          10,
        );
      }
    } catch {
      // HEAD not supported or blocked — continue to GET
    }

    try {
      if (!contentLength || contentLength <= 0 || acceptRanges !== 'bytes') {
        await this.singleThreadDownload(url);
        return;
      }

      this.totalSize = contentLength;
      await this.multiThreadDownload(url, threads, contentLength);
    } catch (err) {
      if (!this.aborted) {
        this.onError(err instanceof Error ? err.message : String(err));
      }
    }
  }

  private async singleThreadDownload(url: string): Promise<void> {
    const controller = new AbortController();
    const chunks: Uint8Array[] = [];
    const state: ThreadState = {
      range: { index: 0, start: 0, end: 0, downloaded: 0 },
      controller,
      loaded: 0,
      chunks,
    };
    this.threads.set(0, state);

    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok || !res.body) throw new Error(`服务器返回 ${res.status}`);

    const reader = res.body.getReader();
    this.totalSize = parseInt(res.headers.get('Content-Length') || '0', 10);

    while (true) {
      if (this.paused) {
        await this.waitResume();
        if (this.aborted) return;
      }
      const { done, value } = await reader.read();
      if (done) break;
      state.loaded += value.byteLength;
      state.range.downloaded = state.loaded;
      state.chunks.push(value);
      this.totalLoaded += value.byteLength;
      this.updateSpeed(value.byteLength);
      this.onProgress(this.totalLoaded, this.totalSize, this.currentSpeed);
    }

    this.saveFile(chunks);
    this.onComplete();
  }

  private async multiThreadDownload(
    url: string,
    threads: number,
    totalSize: number,
  ): Promise<void> {
    const chunkSize = Math.ceil(totalSize / threads);
    const ranges: ThreadRange[] = [];

    for (let i = 0; i < threads; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize - 1, totalSize - 1);
      ranges.push({ index: i, start, end, downloaded: 0 });
    }

    const promises = ranges.map((range) => this.downloadRange(url, range));
    await Promise.all(promises);

    if (!this.aborted) {
      // Merge chunks from all threads in range order
      const sorted = Array.from(this.threads.values()).sort(
        (a, b) => a.range.index - b.range.index,
      );
      const allChunks: Uint8Array[] = [];
      for (const t of sorted) {
        allChunks.push(...t.chunks);
      }
      this.saveFile(allChunks);
      this.onComplete();
    }
  }

  private async downloadRange(url: string, range: ThreadRange): Promise<void> {
    const controller = new AbortController();
    const chunks: Uint8Array[] = [];
    const state: ThreadState = { range, controller, loaded: 0, chunks };
    this.threads.set(range.index, state);

    try {
      const res = await fetch(url, {
        headers: { Range: `bytes=${range.start}-${range.end}` },
        signal: controller.signal,
      });

      if (!res.ok && res.status !== 206) {
        throw new Error(`分块 ${range.index} 请求失败: ${res.status}`);
      }

      if (!res.body) throw new Error('无响应体');

      const reader = res.body.getReader();

      while (true) {
        if (this.paused) {
          await this.waitResume();
          if (this.aborted) return;
        }
        const { done, value } = await reader.read();
        if (done) break;
        state.loaded += value.byteLength;
        state.range.downloaded = state.loaded;
        state.chunks.push(value);
        this.totalLoaded += value.byteLength;
        this.updateSpeed(value.byteLength);
        this.onProgress(this.totalLoaded, this.totalSize, this.currentSpeed);
      }
    } catch (err) {
      if (!this.aborted) {
        throw err;
      }
    }
  }

  private saveFile(chunks: Uint8Array[]): void {
    const blob = new Blob(chunks as BlobPart[]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private updateSpeed(bytes: number): void {
    const now = performance.now();
    if (this.lastSpeedTime === 0) this.lastSpeedTime = now;

    this.speedSamples.push({ time: now, bytes });
    while (this.speedSamples.length > 100) this.speedSamples.shift();

    const elapsed = (now - this.lastSpeedTime) / 1000;
    if (elapsed >= 0.3) {
      const recent = this.speedSamples.slice(-20);
      const totalBytes = recent.reduce((s, x) => s + x.bytes, 0);
      const timeSpan = (now - recent[0].time) / 1000 || 1;
      this.currentSpeed = totalBytes / timeSpan;
      this.lastSpeedTime = now;
    }
  }

  private async waitResume(): Promise<void> {
    while (this.paused && !this.aborted) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  abort(): void {
    this.aborted = true;
    this.paused = false;
    this.threads.forEach((t) => t.controller.abort());
    this.threads.clear();
  }

  getThreadStates(): ThreadRange[] {
    return Array.from(this.threads.values()).map((t) => ({
      ...t.range,
      downloaded: t.loaded,
    }));
  }
}

export function createTask(url: string, threads: number): DownloadTask {
  const filename =
    url.split('/').pop()?.split('?')[0] || `download_${Date.now()}`;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    url,
    filename,
    totalSize: 0,
    downloaded: 0,
    threads,
    status: 'pending',
    speed: 0,
    progress: 0,
    startTime: Date.now(),
    endTime: 0,
    error: '',
  };
}
