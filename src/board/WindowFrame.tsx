// 窗口外壳：标题栏拖动、八向边缘调整大小、最大化/最小化/关闭、点击置顶
import React, { useCallback, useRef } from 'react';
import type { BoardWindow } from '../types/knowledge';
import { useBoard } from '../store/boardStore';
import styles from './board.module.css';

type Dir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
const DIRS: Dir[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
const CURSORS: Record<Dir, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
};

const MIN_W = 300;
const MIN_H = 220;

interface Props {
  win: BoardWindow;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

const WindowFrame: React.FC<Props> = ({ win, badge, children }) => {
  const { updateWindow, removeWindow, bringToFront, toggleMaximize, toggleMinimize, viewport } = useBoard();
  const dragRef = useRef<{ mode: 'move' | Dir; sx: number; sy: number; orig: { x: number; y: number; w: number; h: number } } | null>(null);
  // 拖动/缩放期间的最新几何，用 rAF 节流提交（一帧最多一次 updateWindow）
  const pendingRectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const rafRef = useRef(0);

  const clampRect = useCallback(
    (x: number, y: number, w: number, h: number) => ({
      x: Math.min(Math.max(0, x), Math.max(0, viewport.w - 80)),
      y: Math.min(Math.max(0, y), Math.max(0, viewport.h - 40)),
      w,
      h,
    }),
    [viewport],
  );

  const flushRect = useCallback(() => {
    rafRef.current = 0;
    const r = pendingRectRef.current;
    pendingRectRef.current = null;
    if (r) updateWindow(win.id, r);
  }, [updateWindow, win.id]);

  const scheduleCommit = useCallback(
    (rect: { x: number; y: number; w: number; h: number }) => {
      pendingRectRef.current = rect;
      if (rafRef.current === 0) rafRef.current = requestAnimationFrame(flushRect);
    },
    [flushRect],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.sx;
      const dy = e.clientY - d.sy;
      const o = d.orig;
      if (d.mode === 'move') {
        scheduleCommit(clampRect(o.x + dx, o.y + dy, o.w, o.h));
        return;
      }
      let { x, y, w, h } = o;
      if (d.mode.includes('e')) w = Math.max(MIN_W, o.w + dx);
      if (d.mode.includes('s')) h = Math.max(MIN_H, o.h + dy);
      if (d.mode.includes('w')) {
        w = Math.max(MIN_W, o.w - dx);
        x = o.x + (o.w - w);
      }
      if (d.mode.includes('n')) {
        h = Math.max(MIN_H, o.h - dy);
        y = o.y + (o.h - h);
      }
      scheduleCommit({ x: Math.max(0, x), y: Math.max(0, y), w, h });
    },
    [clampRect, scheduleCommit],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
    // 取消挂起的 rAF 并同步提交最后一次几何，确保终态正确
    if (rafRef.current !== 0) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    flushRect();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);
  }, [flushRect, onPointerMove]);

  const beginDrag = useCallback(
    (mode: 'move' | Dir) => (e: React.PointerEvent) => {
      if (win.maximized) return;
      e.preventDefault();
      e.stopPropagation();
      bringToFront(win.id);
      dragRef.current = {
        mode,
        sx: e.clientX,
        sy: e.clientY,
        orig: { x: win.x, y: win.y, w: win.w, h: win.h },
      };
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', endDrag);
    },
    [bringToFront, endDrag, onPointerMove, win],
  );

  const frameStyle: React.CSSProperties = win.minimized
    ? { left: win.x, top: win.y, width: 240, height: 34, zIndex: win.z }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };

  return (
    <div
      className={`${styles.window} ${win.maximized ? styles.maximized : ''}`}
      style={frameStyle}
      onPointerDown={() => bringToFront(win.id)}
    >
      <div className={styles.titleBar} onPointerDown={beginDrag('move')}>
        <span className={styles.title} title={win.title}>
          {win.title}
        </span>
        {badge}
        {/* 阻止 pointerdown 冒泡到标题栏，否则按住按钮会误触发窗口拖动 */}
        <div className={styles.winBtns} onPointerDown={(e) => e.stopPropagation()}>
          <button title={win.minimized ? '还原' : '最小化'} onClick={() => toggleMinimize(win.id)}>
            {win.minimized ? '▢' : '—'}
          </button>
          <button title={win.maximized ? '还原' : '最大化'} onClick={() => toggleMaximize(win.id)}>
            {win.maximized ? '❐' : '▢'}
          </button>
          <button title="关闭" className={styles.closeBtn} onClick={() => removeWindow(win.id)}>
            ✕
          </button>
        </div>
      </div>
      {!win.minimized && <div className={styles.body}>{children}</div>}
      {!win.minimized && !win.maximized &&
        DIRS.map((d) => (
          <div key={d} className={`${styles.handle} ${styles[`h_${d}`]}`} style={{ cursor: CURSORS[d] }} onPointerDown={beginDrag(d)} />
        ))}
    </div>
  );
};

export default WindowFrame;
