# 多线程下载器

基于 React + TypeScript + Vite 构建的多线程下载器，支持 16 / 32 / 64 / 256 / 512 线程并发下载，不限速，支持直链。

## 功能特性

- 支持 16 / 32 / 64 / 256 / 512 线程并发下载
- 自动检测服务器是否支持断点续传（Range 请求）
- 不支持分块时自动降级为单线程下载
- 实时显示下载速度、进度、剩余时间
- 支持暂停 / 继续 / 取消 / 重试
- 中文界面
- 响应式设计，适配移动端和桌面端

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide Icons

## 快速开始

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 许可证

MIT
