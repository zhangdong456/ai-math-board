// 欧姆定律 I = U/R 渲染器：U-I 特性曲线 + 当前工作点 + 参数滑块
import React from 'react';
import { PlotArea, makeTransform, samplePath } from '../PlotArea';
import ParamSlider from '../ParamSlider';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import styles from '../engines.module.css';

const W = 520;
const H = 360;
const XR: [number, number] = [0, 12];

const OhmLawRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const U = num(values.U, 6);
  const R = Math.max(1, num(values.R, 10));
  const I = U / R;

  // y 轴量程自适应：R 很大时斜率很小，留 25% 余量并设小下界
  const YR: [number, number] = [0, Math.max((12 / R) * 1.25, 0.2)];
  const t = makeTransform(W, H, XR, YR);
  const fn = (u: number) => u / R;

  const defs: Array<[string, { label: string; min: number; max: number; value: number; unit?: string; effect?: string }]> = [
    ['U', { label: 'U（电压）', min: 0, max: 12, value: 6, unit: ' V', effect: '沿特性曲线移动工作点' }],
    ['R', { label: 'R（电阻）', min: 1, max: 100, value: 10, unit: ' Ω', effect: '改变曲线斜率 1/R，R 越大电流越小' }],
  ];

  return (
    <div className={styles.renderer}>
      <div className={styles.plotWrap}>
        <PlotArea width={W} height={H} xRange={XR} yRange={YR}>
          {/* U-I 特性曲线：过原点、斜率 1/R 的直线 */}
          <path d={samplePath(fn, XR, YR, t)} fill="none" stroke="#38bdf8" strokeWidth={2.2} />
          {/* 当前工作点 (U, U/R) */}
          <g>
            <line
              x1={t.toX(U)}
              y1={t.toY(0)}
              x2={t.toX(U)}
              y2={t.toY(I)}
              stroke="#f59e0b"
              strokeWidth={1.2}
              strokeDasharray="5,4"
            />
            <line
              x1={t.toX(0)}
              y1={t.toY(I)}
              x2={t.toX(U)}
              y2={t.toY(I)}
              stroke="#f59e0b"
              strokeWidth={1.2}
              strokeDasharray="5,4"
            />
            <circle cx={t.toX(U)} cy={t.toY(I)} r={4.5} fill="#f472b6" stroke="#fff" strokeWidth={1.2} />
            <text x={t.toX(U) + 8} y={t.toY(I) - 8} fill="#f9a8d4" fontSize={11}>
              ({U.toFixed(1)} V, {I.toFixed(3)} A)
            </text>
          </g>
          <text x={W - 110} y={t.toY(0) - 6} fill="#9fb4d8" fontSize={11}>
            U / V
          </text>
          <text x={44} y={26} fill="#9fb4d8" fontSize={11}>
            I / A
          </text>
        </PlotArea>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          I = U / R = {U.toFixed(2)} / {R.toFixed(1)} = {I.toFixed(3)} A
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
          工作点 ({U.toFixed(2)} V, {I.toFixed(3)} A)，斜率 1/R = {(1 / R).toFixed(4)} S。
          R 不变时 I 与 U 成正比；U 不变时 I 与 R 成反比。
        </div>
      </div>
    </div>
  );
};

export default OhmLawRenderer;
