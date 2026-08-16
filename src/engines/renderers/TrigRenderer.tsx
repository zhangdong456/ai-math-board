// 三角函数 y = A·sin(ωx + φ) + b 渲染器：波形 + 振幅/周期/相位标注 + 参数滑块
import React from 'react';
import { PlotArea, makeTransform, samplePath } from '../PlotArea';
import ParamSlider from '../ParamSlider';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import styles from '../engines.module.css';

const W = 520;
const H = 360;
const XR: [number, number] = [-2 * Math.PI, 2 * Math.PI];
const YR: [number, number] = [-4, 4];

const TrigRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const A = num(values.A, 1);
  const omega = num(values.omega, 1);
  const phi = num(values.phi, 0);
  const b = num(values.b, 0);
  const t = makeTransform(W, H, XR, YR);

  const fn = (x: number) => A * Math.sin(omega * x + phi) + b;
  const period = omega !== 0 ? (2 * Math.PI) / Math.abs(omega) : Infinity;

  const defs: Array<[string, { label: string; min: number; max: number; value: number }]> = [
    ['A', { label: 'A（振幅）', min: -3, max: 3, value: 1 }],
    ['omega', { label: 'ω（角频率）', min: 0.2, max: 4, value: 1 }],
    ['phi', { label: 'φ（初相）', min: -Math.PI, max: Math.PI, value: 0 }],
    ['b', { label: 'b（纵向平移）', min: -2, max: 2, value: 0 }],
  ];

  return (
    <div className={styles.renderer}>
      <div className={styles.plotWrap}>
        <PlotArea width={W} height={H} xRange={XR} yRange={YR}>
          {/* 平衡位置 */}
          <line
            x1={30}
            y1={t.toY(b)}
            x2={W - 30}
            y2={t.toY(b)}
            stroke="#f59e0b"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
          {/* 参考 y=sin(x) */}
          <path
            d={samplePath((x) => Math.sin(x), XR, YR, t)}
            fill="none"
            stroke="#334155"
            strokeWidth={1.2}
            strokeDasharray="3,3"
          />
          <path d={samplePath(fn, XR, YR, t)} fill="none" stroke="#a78bfa" strokeWidth={2.2} />
        </PlotArea>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          y = {A.toFixed(2)}·sin({omega.toFixed(2)}x {phi >= 0 ? '+' : '−'} {Math.abs(phi).toFixed(2)}){' '}
          {b >= 0 ? '+' : '−'} {Math.abs(b).toFixed(2)}
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
          振幅 |A| = {Math.abs(A).toFixed(2)} · 周期 T = 2π/|ω| ≈{' '}
          {Number.isFinite(period) ? period.toFixed(2) : '∞'} · 相位左移 φ/ω ≈{' '}
          {omega !== 0 ? (phi / omega).toFixed(2) : '—'}
        </div>
      </div>
    </div>
  );
};

export default TrigRenderer;
