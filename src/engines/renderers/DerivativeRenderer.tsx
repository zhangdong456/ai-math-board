// 导数几何意义渲染器：抛物线 f(x)=ax²+bx+c 上 x0 处的切线与割线，h→0 时割线逼近切线
import React from 'react';
import { PlotArea, makeTransform, samplePath } from '../PlotArea';
import ParamSlider from '../ParamSlider';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import styles from '../engines.module.css';

const W = 520;
const H = 360;
const XR: [number, number] = [-10, 10];
const YR: [number, number] = [-10, 10];

const DerivativeRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const a = num(values.a, 1);
  const b = num(values.b, 0);
  const c = num(values.c, 0);
  const x0 = num(values.x0, 1);
  const h = num(values.h, 1);
  const t = makeTransform(W, H, XR, YR);

  const f = (x: number) => a * x * x + b * x + c;
  const f0 = f(x0);
  const slope = 2 * a * x0 + b; // 导数 f′(x0)
  const hasSecant = Math.abs(h) > 0.001;
  const f1 = f(x0 + h);
  const secSlope = hasSecant ? (f1 - f0) / h : slope; // 割线斜率

  // 切线与割线都用直线方程采样绘制（samplePath 自动裁剪出界部分）
  const tangent = (x: number) => f0 + slope * (x - x0);
  const secant = (x: number) => f0 + secSlope * (x - x0);

  const inView = (x: number, y: number) => x >= XR[0] && x <= XR[1] && y >= YR[0] && y <= YR[1];

  const defs: Array<[string, { label: string; min: number; max: number; value: number; step?: number }]> = [
    ['a', { label: 'a', min: -5, max: 5, value: 1 }],
    ['b', { label: 'b', min: -10, max: 10, value: 0 }],
    ['c', { label: 'c', min: -10, max: 10, value: 0 }],
    ['x0', { label: 'x0（切点）', min: -8, max: 8, value: 1 }],
    ['h', { label: 'h（割线增量）', min: -2, max: 2, value: 1, step: 0.01 }],
  ];

  return (
    <div className={styles.renderer}>
      <div className={styles.plotWrap}>
        <PlotArea width={W} height={H} xRange={XR} yRange={YR}>
          {/* 抛物线 */}
          <path d={samplePath(f, XR, YR, t)} fill="none" stroke="#38bdf8" strokeWidth={2.2} />
          {/* 切线（醒目色） */}
          <path d={samplePath(tangent, XR, YR, t)} fill="none" stroke="#f472b6" strokeWidth={1.8} />
          {/* 割线 */}
          {hasSecant && (
            <path
              d={samplePath(secant, XR, YR, t)}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="7,4"
            />
          )}
          {/* 切点 (x0, f(x0)) */}
          {inView(x0, f0) && (
            <g>
              <circle cx={t.toX(x0)} cy={t.toY(f0)} r={4.5} fill="#f472b6" stroke="#fff" strokeWidth={1.2} />
              <text x={t.toX(x0) + 8} y={t.toY(f0) - 8} fill="#f9a8d4" fontSize={11}>
                ({x0.toFixed(2)}, {f0.toFixed(2)})
              </text>
            </g>
          )}
          {/* 割线第二点 (x0+h, f(x0+h)) */}
          {hasSecant && inView(x0 + h, f1) && (
            <g>
              <circle cx={t.toX(x0 + h)} cy={t.toY(f1)} r={4} fill="#f59e0b" stroke="#fff" strokeWidth={1.2} />
              <text x={t.toX(x0 + h) + 8} y={t.toY(f1) + 14} fill="#fcd34d" fontSize={11}>
                ({(x0 + h).toFixed(2)}, {f1.toFixed(2)})
              </text>
            </g>
          )}
        </PlotArea>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          f(x) = {a.toFixed(2)}x² {b >= 0 ? '+' : '−'} {Math.abs(b).toFixed(2)}x {c >= 0 ? '+' : '−'}{' '}
          {Math.abs(c).toFixed(2)}　f′(x) = {(2 * a).toFixed(2)}x {b >= 0 ? '+' : '−'} {Math.abs(b).toFixed(2)}
        </div>
        {defs.map(([key, fb]) => (
          <ParamSlider
            key={key}
            name={key}
            param={paramOf(knowledge, key, fb)}
            value={num(values[key], fb.value)}
            onChange={(v) => set(key, key === 'a' && v === 0 ? 0.01 : v)}
          />
        ))}
        <div className={styles.readout}>
          {hasSecant
            ? `割线斜率 = ${secSlope.toFixed(4)}　|　导数 f′(${x0.toFixed(2)}) = ${slope.toFixed(4)}　|　h = ${h.toFixed(2)}`
            : `h ≈ 0，割线已与切线重合：f′(${x0.toFixed(2)}) = ${slope.toFixed(4)}`}
          ；h 越接近 0，割线斜率越逼近切线斜率（导数）——导数就是割线斜率的极限。
        </div>
      </div>
    </div>
  );
};

export default DerivativeRenderer;
