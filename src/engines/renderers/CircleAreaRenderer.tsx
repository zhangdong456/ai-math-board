// 圆面积渲染器：内接正 n 边形逼近圆，演示 Sₙ → πr² 的极限过程
import React from 'react';
import ParamSlider from '../ParamSlider';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import styles from '../engines.module.css';

const W = 520;
const H = 360;

const CircleAreaRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const r = Math.max(0.1, num(values.r, 3)); // 半径
  const n = Math.max(3, Math.round(num(values.n, 12))); // 内接正多边形边数（整数）

  // 圆心与像素缩放：r = 6 时恰好放下
  const cx = W / 2;
  const cy = H / 2;
  const px = (Math.min(W, H) / 2 - 34) / 6;
  const R = r * px;

  // 内接正 n 边形顶点（从正上方起，逆时针）
  const pts = Array.from({ length: n }).map((_, i) => {
    const ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return `${(cx + R * Math.cos(ang)).toFixed(1)},${(cy + R * Math.sin(ang)).toFixed(1)}`;
  });

  // 多边形面积 Sₙ = n·r²·sin(π/n)·cos(π/n)
  const sn = n * r * r * Math.sin(Math.PI / n) * Math.cos(Math.PI / n);
  const sc = Math.PI * r * r;
  const approxPi = sn / (r * r);

  const defs: Array<[string, { label: string; min: number; max: number; value: number; step?: number }]> = [
    ['r', { label: 'r（半径）', min: 0.5, max: 6, value: 3 }],
    ['n', { label: 'n（多边形边数）', min: 3, max: 64, value: 12, step: 1 }],
  ];

  return (
    <div className={styles.renderer}>
      <div className={styles.plotWrap}>
        <svg width={W} height={H} style={{ display: 'block', touchAction: 'none' }}>
          <rect x={0} y={0} width={W} height={H} fill="#0d1420" rx={8} />
          {/* 圆 */}
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="#38bdf8" strokeWidth={2} />
          {/* 内接正 n 边形 */}
          <polygon
            points={pts.join(' ')}
            fill="rgba(245,158,11,0.18)"
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          {/* 半径标注 */}
          <line x1={cx} y1={cy} x2={cx + R} y2={cy} stroke="#4a5f82" strokeWidth={1.2} />
          <circle cx={cx} cy={cy} r={3} fill="#f472b6" />
          <text x={cx + R / 2} y={cy - 8} fill="#9fb4d8" fontSize={12} textAnchor="middle">
            r = {r.toFixed(2)}
          </text>
          <text x={cx} y={24} fill="#7c8db0" fontSize={11} textAnchor="middle">
            内接正 {n} 边形
          </text>
        </svg>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          Sₙ = n·r²·sin(π/n)·cos(π/n) = {sn.toFixed(4)}　→　S = πr² = {sc.toFixed(4)}
        </div>
        {defs.map(([key, fb]) => (
          <ParamSlider
            key={key}
            name={key}
            param={paramOf(knowledge, key, fb)}
            value={num(values[key], fb.value)}
            onChange={(v) => set(key, v)}
          />
        ))}
        <div className={styles.readout}>
          正 {n} 边形面积 Sₙ = {sn.toFixed(4)}，圆面积 πr² = {sc.toFixed(4)}，相差{' '}
          {(sc - sn).toFixed(4)}；Sₙ ÷ r² = {approxPi.toFixed(6)}，n 越大越接近 π = 3.141593…。
        </div>
      </div>
    </div>
  );
};

export default CircleAreaRenderer;
