// 白板状态：窗口系统 + 标注笔画 + AI 生成说明（persist 到 localStorage）
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AiExplain, BoardWindow, KnowledgeJSON, Stroke, VerifyStatus } from '../types/knowledge';

let uid = 0;
export function nextId(prefix: string): string {
  uid += 1;
  return `${prefix}-${Date.now().toString(36)}-${uid}`;
}

const DEFAULT_DEMO_SIZE = { w: 560, h: 540 };
const DEFAULT_IMAGE_SIZE = { w: 480, h: 440 };

interface Placement {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 新窗口落位：必须在可视区域内。
 * 级联偏移摆放并夹取到视口内；空间不足时收缩尺寸并居中。
 */
export function placeInViewport(
  vw: number,
  vh: number,
  count: number,
  want: { w: number; h: number },
): Placement {
  const w = Math.min(want.w, Math.max(280, vw - 24));
  const h = Math.min(want.h, Math.max(240, vh - 24));
  const offset = (count % 6) * 28;
  let x = Math.round((vw - w) / 2) + offset - 56;
  let y = Math.round((vh - h) / 2) + offset - 56;
  x = Math.min(Math.max(8, x), Math.max(8, vw - w - 8));
  y = Math.min(Math.max(8, y), Math.max(8, vh - h - 8));
  return { x, y, w, h };
}

/**
 * 视口变化（含刷新恢复后首次同步）时把已有窗口夹回可视区域，
 * 防止大屏保存的窗口位置在小屏上完全跑到视口外。
 */
function clampWindowToViewport(win: BoardWindow, vw: number, vh: number): BoardWindow {
  if (win.maximized) {
    if (win.x === 0 && win.y === 0 && win.w === vw && win.h === vh) return win;
    return { ...win, x: 0, y: 0, w: vw, h: vh };
  }
  const w = Math.min(win.w, Math.max(300, vw));
  const h = Math.min(win.h, Math.max(220, vh));
  const x = Math.min(Math.max(0, win.x), Math.max(0, vw - 80));
  const y = Math.min(Math.max(0, win.y), Math.max(0, vh - 40));
  if (x === win.x && y === win.y && w === win.w && h === win.h) return win;
  return { ...win, x, y, w, h };
}

/** 还原最大化窗口（同 toggleMaximize 的还原分支），供智能排列复用 */
function restoreMaximized(win: BoardWindow): BoardWindow {
  if (!win.maximized) return win;
  const p = win.prevBounds ?? { x: 40, y: 40, w: DEFAULT_DEMO_SIZE.w, h: DEFAULT_DEMO_SIZE.h };
  return { ...win, maximized: false, minimized: false, ...p, prevBounds: undefined };
}

interface BoardState {
  windows: BoardWindow[];
  strokes: Stroke[];
  /** 撤销/重做栈（不持久化） */
  undoStack: Stroke[][];
  redoStack: Stroke[][];
  /** 白板可视区域尺寸，由 Board 组件同步 */
  viewport: { w: number; h: number };
  lastExplain: AiExplain | null;

  setViewport: (w: number, h: number) => void;
  addDemoWindow: (knowledge: KnowledgeJSON, status: VerifyStatus, reason?: string) => BoardWindow;
  addImageWindow: (dataUrl: string) => BoardWindow;
  updateWindow: (id: string, patch: Partial<BoardWindow>) => void;
  removeWindow: (id: string) => void;
  bringToFront: (id: string) => void;
  toggleMaximize: (id: string) => void;
  toggleMinimize: (id: string) => void;
  /** 网格平铺所有非最小化窗口 */
  arrangeTile: () => void;
  /** 居中 + 32px 级联偏移摆放所有非最小化窗口 */
  arrangeCascade: () => void;

  addStroke: (s: Stroke) => void;
  undo: () => void;
  redo: () => void;
  clearStrokes: () => void;

  setLastExplain: (e: AiExplain | null) => void;
}

/** localStorage 容量兜底：写不进时丢弃图片 dataURL 重试 */
const safeStorage = createJSONStorage(() => ({
  getItem: (k) => localStorage.getItem(k),
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      try {
        const parsed = JSON.parse(v);
        if (parsed?.state?.windows) {
          for (const w of parsed.state.windows as BoardWindow[]) {
            if (w.kind === 'image') w.imageUrl = undefined;
          }
          localStorage.setItem(k, JSON.stringify(parsed));
        }
      } catch {
        // 放弃本次持久化，不影响运行
      }
    }
  },
  removeItem: (k) => localStorage.removeItem(k),
}));

export const useBoard = create<BoardState>()(
  persist(
    (set, get) => ({
      windows: [],
      strokes: [],
      undoStack: [],
      redoStack: [],
      viewport: { w: 1200, h: 700 },
      lastExplain: null,

      setViewport: (w, h) =>
        set((s) => ({
          viewport: { w, h },
          windows: s.windows.map((win) => clampWindowToViewport(win, w, h)),
        })),

      addDemoWindow: (knowledge, status, reason) => {
        const { windows, viewport } = get();
        const maxZ = windows.reduce((m, w) => Math.max(m, w.z), 0);
        const pos = placeInViewport(viewport.w, viewport.h, windows.length, DEFAULT_DEMO_SIZE);
        const win: BoardWindow = {
          id: nextId('demo'),
          kind: 'demo',
          title: knowledge.title || '动态演示',
          ...pos,
          z: maxZ + 1,
          minimized: false,
          maximized: false,
          knowledge,
          verifyStatus: status,
          verifyReason: reason,
        };
        set({ windows: [...windows, win] });
        return win;
      },

      addImageWindow: (dataUrl) => {
        const { windows, viewport } = get();
        const maxZ = windows.reduce((m, w) => Math.max(m, w.z), 0);
        const pos = placeInViewport(viewport.w, viewport.h, windows.length, DEFAULT_IMAGE_SIZE);
        const win: BoardWindow = {
          id: nextId('img'),
          kind: 'image',
          title: '图片（可框选）',
          ...pos,
          z: maxZ + 1,
          minimized: false,
          maximized: false,
          imageUrl: dataUrl,
        };
        set({ windows: [...windows, win] });
        return win;
      },

      updateWindow: (id, patch) =>
        set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),

      removeWindow: (id) => set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

      bringToFront: (id) =>
        set((s) => {
          const maxZ = s.windows.reduce((m, w) => Math.max(m, w.z), 0);
          const target = s.windows.find((w) => w.id === id);
          if (!target || target.z === maxZ) return s;
          return { windows: s.windows.map((w) => (w.id === id ? { ...w, z: maxZ + 1 } : w)) };
        }),

      toggleMaximize: (id) =>
        set((s) => ({
          windows: s.windows.map((w) => {
            if (w.id !== id) return w;
            if (w.maximized) {
              const p = w.prevBounds ?? { x: 40, y: 40, w: DEFAULT_DEMO_SIZE.w, h: DEFAULT_DEMO_SIZE.h };
              return { ...w, maximized: false, minimized: false, ...p, prevBounds: undefined };
            }
            return {
              ...w,
              maximized: true,
              minimized: false,
              prevBounds: { x: w.x, y: w.y, w: w.w, h: w.h },
              x: 0,
              y: 0,
              w: s.viewport.w,
              h: s.viewport.h,
            };
          }),
        })),

      toggleMinimize: (id) =>
        set((s) => ({
          windows: s.windows.map((w) => {
            if (w.id !== id) return w;
            if (w.minimized) {
              const p = w.prevBounds;
              return {
                ...w,
                minimized: false,
                // 最小化状态下可能已被拖动，x/y 用当前值，只还原宽高
                ...(p ? { w: p.w, h: p.h } : {}),
                prevBounds: undefined,
              };
            }
            return {
              ...w,
              minimized: true,
              maximized: false,
              prevBounds: { x: w.x, y: w.y, w: w.w, h: w.h },
            };
          }),
        })),

      arrangeTile: () =>
        set((s) => {
          const { w: vw, h: vh } = s.viewport;
          const n = s.windows.filter((w) => !w.minimized).length;
          if (n === 0) return s;
          const cols = Math.ceil(Math.sqrt(n));
          const rows = Math.ceil(n / cols);
          const cellW = (vw - 8 * 2 - (cols - 1) * 12) / cols;
          const cellH = (vh - 8 * 2 - (rows - 1) * 12) / rows;
          // 均分单元格，但不小于 280×200；视口太小时保持最小尺寸，允许少量重叠
          const winW = Math.min(Math.max(280, Math.floor(cellW)), Math.max(280, vw - 16));
          const winH = Math.min(Math.max(200, Math.floor(cellH)), Math.max(200, vh - 16));
          let i = 0;
          return {
            windows: s.windows.map((win) => {
              if (win.minimized) return win;
              const col = i % cols;
              const row = Math.floor(i / cols);
              i += 1;
              const base = restoreMaximized(win);
              return {
                ...base,
                x: Math.round(8 + col * (cellW + 12)),
                y: Math.round(8 + row * (cellH + 12)),
                w: winW,
                h: winH,
              };
            }),
          };
        }),

      arrangeCascade: () =>
        set((s) => {
          const { w: vw, h: vh } = s.viewport;
          let i = 0;
          return {
            windows: s.windows.map((win) => {
              if (win.minimized) return win;
              const base = restoreMaximized(win);
              // 保持各自尺寸，超长夹到视口 -24
              const w = Math.min(base.w, Math.max(280, vw - 24));
              const h = Math.min(base.h, Math.max(200, vh - 24));
              const x = Math.round((vw - w) / 2) + i * 32;
              const y = Math.round((vh - h) / 2) + i * 32;
              i += 1;
              return clampWindowToViewport({ ...base, x, y, w, h }, vw, vh);
            }),
          };
        }),

      addStroke: (stroke) =>
        set((s) => ({
          strokes: [...s.strokes, stroke],
          undoStack: [...s.undoStack.slice(-49), s.strokes],
          redoStack: [],
        })),

      undo: () =>
        set((s) => {
          if (s.undoStack.length === 0) return s;
          const prev = s.undoStack[s.undoStack.length - 1];
          return {
            strokes: prev,
            undoStack: s.undoStack.slice(0, -1),
            redoStack: [...s.redoStack, s.strokes],
          };
        }),

      redo: () =>
        set((s) => {
          if (s.redoStack.length === 0) return s;
          const next = s.redoStack[s.redoStack.length - 1];
          return {
            strokes: next,
            redoStack: s.redoStack.slice(0, -1),
            undoStack: [...s.undoStack, s.strokes],
          };
        }),

      clearStrokes: () =>
        set((s) => ({
          strokes: [],
          undoStack: [...s.undoStack.slice(-49), s.strokes],
          redoStack: [],
        })),

      setLastExplain: (lastExplain) => set({ lastExplain }),
    }),
    {
      name: 'ai-board-state',
      storage: safeStorage,
      partialize: (s) => ({ windows: s.windows, strokes: s.strokes }),
    },
  ),
);
