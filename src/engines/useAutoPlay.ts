// 参数动画自动播放 Hook：用 requestAnimationFrame 驱动某个参数在 min~max 间自动变化
import { useEffect, useRef, useState } from 'react';

export interface AutoPlayOptions {
  /** pingpong=往返扫描（适合系数类参数）；loop=到 max 后跳回 min 循环（适合时间 t、旋转角） */
  mode?: 'pingpong' | 'loop';
  /** 单程（min→max）耗时，默认 4000ms */
  periodMs?: number;
  /** 量化步长（整数参数如 n、Z 用），缺省连续取值 */
  step?: number;
}

export interface AutoPlay {
  playing: boolean;
  toggle: () => void;
  stop: () => void;
}

/**
 * 自动播放：playing 期间按时间驱动 setValue。
 * - pingpong：min→max→min 三角波往返
 * - loop：min→max 锯齿波循环
 * 返回值基于绝对时钟计算，与用户手动拖滑块互不干扰（手动拖动时建议先 stop）。
 */
export function useAutoPlay(
  min: number,
  max: number,
  setValue: (v: number) => void,
  opts?: AutoPlayOptions,
): AutoPlay {
  const [playing, setPlaying] = useState(false);
  // 用 ref 持有最新配置，rAF 循环只依赖 playing，参数变化不重启动画
  const cfg = useRef({ min, max, setValue, mode: opts?.mode ?? 'pingpong', periodMs: opts?.periodMs ?? 4000, step: opts?.step });
  cfg.current = { min, max, setValue, mode: opts?.mode ?? 'pingpong', periodMs: opts?.periodMs ?? 4000, step: opts?.step };

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const c = cfg.current;
      const span = c.max - c.min;
      let v: number;
      if (c.mode === 'loop') {
        const phase = ((now - t0) % c.periodMs) / c.periodMs; // 0→1 循环
        v = c.min + phase * span;
      } else {
        const p = ((now - t0) % (c.periodMs * 2)) / c.periodMs; // 0→2 往返
        v = p <= 1 ? c.min + p * span : c.max - (p - 1) * span;
      }
      if (c.step && c.step > 0) v = c.min + Math.round((v - c.min) / c.step) * c.step;
      c.setValue(Number(v.toFixed(6)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  return {
    playing,
    toggle: () => setPlaying((p) => !p),
    stop: () => setPlaying(false),
  };
}
