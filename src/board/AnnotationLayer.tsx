// 标注层：覆盖整个白板的透明 canvas，画笔/矩形/圆形/箭头/橡皮擦，pointer events 兼容触屏
import React, { useCallback, useEffect, useRef } from 'react';
import { useBoard, nextId } from '../store/boardStore';
import { useUi } from '../store/uiStore';
import type { Stroke, StrokePoint } from '../types/knowledge';
import styles from './board.module.css';

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = s.color;
  ctx.fillStyle = s.color;
  ctx.lineWidth = s.width;
  if (s.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = s.width * 4;
  }
  const pts = s.points;
  if (pts.length === 0) {
    ctx.restore();
    return;
  }
  if (s.tool === 'pen' || s.tool === 'eraser') {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
    if (pts.length === 1) ctx.lineTo(pts[0].x + 0.1, pts[0].y);
    ctx.stroke();
  } else if (pts.length >= 2) {
    const [a, b] = [pts[0], pts[pts.length - 1]];
    if (s.tool === 'rect') {
      ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    } else if (s.tool === 'circle') {
      const rx = Math.abs(b.x - a.x) / 2;
      const ry = Math.abs(b.y - a.y) / 2;
      ctx.beginPath();
      ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (s.tool === 'arrow') {
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const head = 8 + s.width * 2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - head * Math.cos(angle - 0.45), b.y - head * Math.sin(angle - 0.45));
      ctx.lineTo(b.x - head * Math.cos(angle + 0.45), b.y - head * Math.sin(angle + 0.45));
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

const AnnotationLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 草稿放 ref 而非 state：pointermove 高频更新不触发 React 重渲染，只调度 canvas 重绘
  const draftRef = useRef<Stroke | null>(null);
  const drawingRef = useRef(false);
  const rafRef = useRef(0);
  const strokes = useBoard((s) => s.strokes);
  const addStroke = useBoard((s) => s.addStroke);
  const tool = useUi((s) => s.tool);
  const color = useUi((s) => s.color);
  const penWidth = useUi((s) => s.penWidth);
  // 标注工具激活时画布接收事件；否则穿透给下层窗口
  const toolActive = useUi((s) => s.toolActive);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (const s of strokes) drawStroke(ctx, s);
    const draft = draftRef.current;
    if (draft) drawStroke(ctx, draft);
  }, [strokes]);

  // 合并一帧内的多个 move 事件，最多重绘一次
  const scheduleRedraw = useCallback(() => {
    if (rafRef.current !== 0) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      redraw();
    });
  }, [redraw]);

  useEffect(() => {
    redraw();
    const ro = new ResizeObserver(redraw);
    if (canvasRef.current?.parentElement) ro.observe(canvasRef.current.parentElement);
    return () => ro.disconnect();
  }, [redraw]);

  const toLocal = (e: React.PointerEvent): StrokePoint => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent) => {
    if (!toolActive) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const p = toLocal(e);
    draftRef.current = { id: nextId('stroke'), tool, color, width: penWidth, points: [p] };
    scheduleRedraw();
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const p = toLocal(e);
    const d = draftRef.current;
    if (!d) return;
    // canvas 为立即模式绘制，直接改 ref 对象即可，无需不可变更新
    if (d.tool === 'pen' || d.tool === 'eraser') d.points.push(p);
    else d.points = [d.points[0], p];
    scheduleRedraw();
  };

  const onUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    // 直接读 ref 中的草稿入库（事件处理器只触发一次，无重复入库风险）
    const d = draftRef.current;
    draftRef.current = null;
    // 取消挂起的合并重绘，立即清掉草稿残影
    if (rafRef.current !== 0) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    redraw();
    if (d && d.points.length > 0) {
      const [a, b] = [d.points[0], d.points[d.points.length - 1]];
      const moved = d.points.length > 2 || Math.abs(b.x - a.x) + Math.abs(b.y - a.y) > 2;
      if (moved) addStroke(d);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={styles.annotCanvas}
      style={{ pointerEvents: toolActive ? 'auto' : 'none', touchAction: 'none' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    />
  );
};

export default AnnotationLayer;
