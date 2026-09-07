export type DownloadStatus =
  | 'pending'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'error';

export interface DownloadTask {
  id: string;
  url: string;
  filename: string;
  totalSize: number;
  downloaded: number;
  threads: number;
  status: DownloadStatus;
  speed: number;
  progress: number;
  startTime: number;
  endTime: number;
  error: string;
}

export interface ThreadRange {
  index: number;
  start: number;
  end: number;
  downloaded: number;
}

export interface DownloadOptions {
  threads: number;
  url: string;
}
