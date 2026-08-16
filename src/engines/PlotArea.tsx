// 数学渲染器共用的 SVG 坐标系组件与坐标变换工具
import React from 'react';

export interface Transform {
  toX: (x: number) => number;
  toY: (y: number) => number;
}

export function makeTransform(
  width: number,
  height: number,
  xRange: [number, number],
  yRange: [number, number],
  pad = 36,
): Transform {
  const [x0, x1] = xRange;
  const [y0, y1] = yRange;
  return {
    toX: (x) => pad + ((x - x0) / (x1 - x0)) * (width - pad * 2),
    toY: (y) => height - pad - ((y - y0) / (y1 - y0)) * (height - pad * 2),
  };
}

function niceStep(range: number, target = 8): number {
  const raw = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const m of [1, 2, 5, 10]) {
    if (raw <= m * mag) return m * mag;
  }
  return 10 * mag;
}

export function ticks(min: number, max: number): number[] {
  const step = niceStep(max - min);
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) {
    out.push(Math.abs(v) < 1e-9 ? 0 : Number(v.toFixed(6)));
  }
  return out;
}

interface FitSvgProps {
  width: number;
  height: number;
  children?: React.ReactNode;
}

/**
 * 自适应缩放的 SVG 容器：内部仍按 width×height 逻辑坐标绘制，
 * 通过 viewBox + preserveAspectRatio 随外层容器同比缩放（含文字/线宽），
 * 窗口放大时坐标系不会再显得小。
 */
export const FitSvg: React.FC<FitSvgProps> = ({ width, height, children }) => (
  <svg
    viewBox={`0 0 ${width} ${height}`}
    preserveAspectRatio="xMidYMid meet"
    style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }}
  >
    {children}
  </svg>
);

interface PlotAreaProps {
  width: number;
  height: number;
  xRange: [number, number];
  yRange: [number, number];
  children?: React.ReactNode;
}

/** 带网格与刻度坐标轴的 SVG 坐标系（y 轴向上为正，随窗口同比缩放） */
export const PlotArea: React.FC<PlotAreaProps> = ({ width, height, xRange, yRange, children }) => {
  const t = makeTransform(width, height, xRange, yRange);
  const xs = ticks(xRange[0], xRange[1]);
  const ys = ticks(yRange[0], yRange[1]);
  return (
    <FitSvg width={width} height={height}>
      <rect x={0} y={0} width={width} height={height} fill="#0d1420" rx={8} />
      {xs.map((x) => (
        <g key={`x${x}`}>
          <line x1={t.toX(x)} y1={16} x2={t.toX(x)} y2={height - 36} stroke="#1e2a3d" strokeWidth={1} />
          <text x={t.toX(x)} y={height - 20} fill="#7c8db0" fontSize={10} textAnchor="middle">
            {x}
          </text>
        </g>
      ))}
      {ys.map((y) => (
        <g key={`y${y}`}>
          <line x1={36} y1={t.toY(y)} x2={width - 36} y2={t.toY(y)} stroke="#1e2a3d" strokeWidth={1} />
          <text x={30} y={t.toY(y) + 3} fill="#7c8db0" fontSize={10} textAnchor="end">
            {y}
          </text>
        </g>
      ))}
      {/* x / y 轴 */}
      {yRange[0] <= 0 && yRange[1] >= 0 && (
        <line x1={30} y1={t.toY(0)} x2={width - 30} y2={t.toY(0)} stroke="#4a5f82" strokeWidth={1.5} />
      )}
      {xRange[0] <= 0 && xRange[1] >= 0 && (
        <line x1={t.toX(0)} y1={10} x2={t.toX(0)} y2={height - 30} stroke="#4a5f82" strokeWidth={1.5} />
      )}
      <text x={width - 34} y={t.toY(0) - 6} fill="#9fb4d8" fontSize={11}>x</text>
      <text x={t.toX(0) + 6} y={20} fill="#9fb4d8" fontSize={11}>y</text>
      {children}
    </FitSvg>
  );
};

export function samplePath(
  fn: (x: number) => number,
  xRange: [number, number],
  yRange: [number, number],
  t: Transform,
  samples = 240,
): string {
  const [x0, x1] = xRange;
  const [y0, y1] = yRange;
  const overflow = (y1 - y0) * 4;
  let d = '';
  let pen = false;
  for (let i = 0; i <= samples; i++) {
    const x = x0 + ((x1 - x0) * i) / samples;
    const y = fn(x);
    if (!Number.isFinite(y) || y < y0 - overflow || y > y1 + overflow) {
      pen = false;
      continue;
    }
    d += `${pen ? 'L' : 'M'}${t.toX(x).toFixed(1)},${t.toY(y).toFixed(1)}`;
    pen = true;
  }
  return d;
}
