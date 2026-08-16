// 图片窗口：显示上传图片，鼠标/触摸框选（高对比度红色描边），裁剪后发给视觉模型生成演示
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { BoardWindow } from '../types/knowledge';
import { useUi } from '../store/uiStore';
import { useModelConfig, getActiveConfig, isConfigured } from '../store/modelConfigStore';
import { modelSupportsVision } from '../config/providers';
import { generateFromImage } from '../ai/client';
import { finishGeneration } from '../ai/generate';
import styles from '../board/board.module.css';

interface Sel {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** 将框选区域从原图裁出为 JPEG dataURL（限制最大边长，控制体积） */
function cropSelection(img: HTMLImageElement, sel: Sel): string | null {
  const wrap = img.parentElement!;
  const ir = img.getBoundingClientRect();
  const wr = wrap.getBoundingClientRect();
  // 图片在容器中的偏移（contain 居中）
  const ox = ir.left - wr.left;
  const oy = ir.top - wr.top;
  const scale = img.naturalWidth / ir.width;
  const x = Math.max(0, (Math.min(sel.x0, sel.x1) - ox) * scale);
  const y = Math.max(0, (Math.min(sel.y0, sel.y1) - oy) * scale);
  const w = Math.abs(sel.x1 - sel.x0) * scale;
  const h = Math.abs(sel.y1 - sel.y0) * scale;
  if (w < 8 || h < 8) return null;
  const cw = Math.min(img.naturalWidth - x, w);
  const ch = Math.min(img.naturalHeight - y, h);
  const ratio = Math.min(1, 1024 / Math.max(cw, ch));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(cw * ratio);
  canvas.height = Math.round(ch * ratio);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, x, y, cw, ch, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

const ImageWindow: React.FC<{ win: BoardWindow }> = ({ win }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<Sel | null>(null);
  const [committed, setCommitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('拖动鼠标 / 手指框选公式区域');
  const draggingRef = useRef(false);
  const subject = useUi((s) => s.subject);
  const setConfigOpen = useUi((s) => s.setConfigOpen);

  useEffect(() => {
    setSel(null);
    setCommitted(false);
  }, [win.imageUrl]);

  const toLocal = (e: React.PointerEvent) => {
    const r = wrapRef.current!.getBoundingClientRect();
    return {
      x: Math.min(Math.max(0, e.clientX - r.left), r.width),
      y: Math.min(Math.max(0, e.clientY - r.top), r.height),
    };
  };

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    draggingRef.current = true;
    const p = toLocal(e);
    setSel({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
    setCommitted(false);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const p = toLocal(e);
    setSel((s) => (s ? { ...s, x1: p.x, y1: p.y } : s));
  };

  const onUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    // 直接读当前渲染的 sel，避免在 setState updater 里做副作用（StrictMode 双调用）
    if (sel && Math.abs(sel.x1 - sel.x0) > 6 && Math.abs(sel.y1 - sel.y0) > 6) {
      setCommitted(true);
      setMsg('已框选，点击下方「AI 动态演示」生成');
    } else {
      setSel(null);
    }
  };

  const runGenerate = useCallback(async () => {
    const cfgState = useModelConfig.getState();
    if (!isConfigured(cfgState)) {
      setMsg('未配置 API Key：请先在左下角「模型配置」中填写，或使用默认模板');
      setConfigOpen(true);
      return;
    }
    const vision = modelSupportsVision(cfgState.providerId, cfgState.model);
    if (vision === false) {
      setMsg(`当前模型 ${cfgState.model} ❌ 不支持图片识别，请在模型配置中更换 ✅ 支持图片的模型`);
      setConfigOpen(true);
      return;
    }
    const img = imgRef.current;
    if (!img || !sel) return;
    const dataUrl = cropSelection(img, sel);
    if (!dataUrl) {
      setMsg('框选区域太小或不在图片范围内，请重新框选');
      return;
    }
    setBusy(true);
    setMsg('AI 正在识别框选区域…');
    try {
      const raw = await generateFromImage(dataUrl, subject, getActiveConfig(cfgState));
      const outcome = finishGeneration(raw, '图片框选识别');
      setMsg(outcome.message);
      if (outcome.ok) {
        setSel(null);
        setCommitted(false);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '生成失败');
    } finally {
      setBusy(false);
    }
  }, [sel, subject, setConfigOpen]);

  if (!win.imageUrl) {
    return (
      <div style={{ padding: 16, color: '#8ea3c5', fontSize: 13 }}>
        图片数据未持久化（localStorage 容量不足时已丢弃），请重新上传。
      </div>
    );
  }

  const box = sel
    ? {
        left: Math.min(sel.x0, sel.x1),
        top: Math.min(sel.y0, sel.y1),
        width: Math.abs(sel.x1 - sel.x0),
        height: Math.abs(sel.y1 - sel.y0),
      }
    : null;

  return (
    <>
      <div
        ref={wrapRef}
        className={styles.imgWrap}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <img ref={imgRef} src={win.imageUrl} alt="上传图片" draggable={false} />
        {box && <div className={styles.selectBox} style={box} />}
      </div>
      <div className={styles.imgToolbar}>
        <span className={styles.imgHint} title={msg}>
          {busy ? '⏳ ' : ''}{msg}
        </span>
        {committed && !busy && (
          <button className="btn ghost" onClick={() => { setSel(null); setCommitted(false); setMsg('已清除框选'); }}>
            清除框选
          </button>
        )}
        <button className="btn primary" disabled={!committed || busy} onClick={runGenerate}>
          {busy ? '生成中…' : 'AI 动态演示'}
        </button>
      </div>
    </>
  );
};

// win 对象引用在未修改时保持不变（updateWindow 只替换被改窗口），浅比较即可生效
export default React.memo(ImageWindow);
