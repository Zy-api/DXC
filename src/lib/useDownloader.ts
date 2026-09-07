import { useCallback, useRef, useState } from 'react';
import type { DownloadTask } from './types';
import { MultiThreadDownloader, createTask } from './downloader';

const downloaders = new Map<string, MultiThreadDownloader>();

export function useDownloader() {
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [globalSpeed, setGlobalSpeed] = useState(0);
  const speedTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateTask = useCallback((id: string, patch: Partial<DownloadTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }, []);

  const startSpeedTimer = useCallback(() => {
    if (speedTimer.current) return;
    speedTimer.current = setInterval(() => {
      setTasks((prev) => {
        const total = prev.reduce((s, t) => s + (t.status === 'downloading' ? t.speed : 0), 0);
        setGlobalSpeed(total);
        return prev;
      });
    }, 500);
  }, []);

  const stopSpeedTimer = useCallback(() => {
    if (speedTimer.current) {
      clearInterval(speedTimer.current);
      speedTimer.current = null;
    }
  }, []);

  const addTask = useCallback(
    (url: string, threads: number) => {
      const task = createTask(url, threads);
      setTasks((prev) => [task, ...prev]);

      const downloader = new MultiThreadDownloader({
        filename: task.filename,
        onProgress: (loaded, total, speed) => {
          updateTask(task.id, {
            downloaded: loaded,
            totalSize: total,
            speed,
            progress: total > 0 ? (loaded / total) * 100 : 0,
            status: 'downloading',
          });
        },
        onComplete: () => {
          updateTask(task.id, {
            status: 'completed',
            progress: 100,
            speed: 0,
            endTime: Date.now(),
          });
          downloaders.delete(task.id);
        },
        onError: (error) => {
          updateTask(task.id, { status: 'error', error, speed: 0 });
          downloaders.delete(task.id);
        },
      });

      downloaders.set(task.id, downloader);
      startSpeedTimer();
      downloader.start(url, threads);
    },
    [updateTask, startSpeedTimer],
  );

  const pauseTask = useCallback((id: string) => {
    downloaders.get(id)?.pause();
    updateTask(id, { status: 'paused' });
  }, [updateTask]);

  const resumeTask = useCallback((id: string) => {
    downloaders.get(id)?.resume();
    updateTask(id, { status: 'downloading' });
  }, [updateTask]);

  const cancelTask = useCallback((id: string) => {
    downloaders.get(id)?.abort();
    downloaders.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const retryTask = useCallback((id: string) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      if (!task) return prev;
      downloaders.get(id)?.abort();
      downloaders.delete(id);

      const newTask = createTask(task.url, task.threads);
      const downloader = new MultiThreadDownloader({
        filename: newTask.filename,
        onProgress: (loaded, total, speed) => {
          updateTask(newTask.id, {
            downloaded: loaded,
            totalSize: total,
            speed,
            progress: total > 0 ? (loaded / total) * 100 : 0,
            status: 'downloading',
          });
        },
        onComplete: () => {
          updateTask(newTask.id, {
            status: 'completed',
            progress: 100,
            speed: 0,
            endTime: Date.now(),
          });
          downloaders.delete(newTask.id);
        },
        onError: (error) => {
          updateTask(newTask.id, { status: 'error', error, speed: 0 });
          downloaders.delete(newTask.id);
        },
      });

      downloaders.set(newTask.id, downloader);
      startSpeedTimer();
      downloader.start(newTask.url, newTask.threads);

      return prev.map((t) => (t.id === id ? newTask : t));
    });
  }, [updateTask, startSpeedTimer]);

  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((t) => t.status !== 'completed'));
  }, []);

  return {
    tasks,
    globalSpeed,
    addTask,
    pauseTask,
    resumeTask,
    cancelTask,
    retryTask,
    clearCompleted,
    stopSpeedTimer,
  };
}
