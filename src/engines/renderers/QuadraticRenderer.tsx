// 二次函数 y = ax² + bx + c 渲染器：曲线 + 顶点 + 对称轴 + 参数滑块
import React from 'react';
import { PlotArea, makeTransform, samplePath } from '../PlotArea';
import ParamSlider from '../ParamSlider';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import styles from '../engines.module.css';

const W = 520;
const H = 360;
const XR: [number, number] = [-10, 10];
const YR: [number, number] = [-10, 10];

const QuadraticRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const a = num(values.a, 1);
  const b = num(values.b, 0);
  const c = num(values.c, 0);
  const t = makeTransform(W, H, XR, YR);

  const fn = (x: number) => a * x * x + b * x + c;
  const vx = -b / (2 * a);
  const vy = fn(vx);
  const vertexVisible = vx >= XR[0] && vx <= XR[1] && vy >= YR[0] && vy <= YR[1];

  return (
    <div className={styles.renderer}>
      <div className={styles.plotWrap}>
        <PlotArea width={W} height={H} xRange={XR} yRange={YR}>
          {/* 对称轴 */}
          <line
            x1={t.toX(vx)}
            y1={12}
            x2={t.toX(vx)}
            y2={H - 32}
            stroke="#f59e0b"
            strokeWidth={1.2}
            strokeDasharray="5,4"
          />
          {/* 曲线 */}
          <path d={samplePath(fn, XR, YR, t)} fill="none" stroke="#38bdf8" strokeWidth={2.2} />
          {/* 顶点 */}
          {vertexVisible && (
            <g>
              <circle cx={t.toX(vx)} cy={t.toY(vy)} r={4.5} fill="#f472b6" stroke="#fff" strokeWidth={1.2} />
              <text x={t.toX(vx) + 8} y={t.toY(vy) - 8} fill="#f9a8d4" fontSize={11}>
                顶点 ({vx.toFixed(2)}, {vy.toFixed(2)})
              </text>
            </g>
          )}
        </PlotArea>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          y = {a.toFixed(2)}x² {b >= 0 ? '+' : '−'} {Math.abs(b).toFixed(2)}x {c >= 0 ? '+' : '−'}{' '}
          {Math.abs(c).toFixed(2)}
        </div>
        {(['a', 'b', 'c'] as const).map((k) => (
          <ParamSlider
            key={k}
            name={k}
            param={paramOf(knowledge, k, { label: k, min: k === 'a' ? -5 : -10, max: k === 'a' ? 5 : 10, value: 0 })}
            value={num(values[k], 0)}
            onChange={(v) => set(k, k === 'a' && v === 0 ? 0.01 : v)}
          />
        ))}
        <div className={styles.readout}>
          开口{a > 0 ? '向上' : '向下'} · 对称轴 x = {vx.toFixed(2)} · 顶点 ({vx.toFixed(2)},{' '}
          {vy.toFixed(2)})
        </div>
      </div>
    </div>
  );
};

export default QuadraticRenderer;
