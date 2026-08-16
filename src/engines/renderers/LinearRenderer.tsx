// 一次函数 y = kx + b 渲染器：直线 + 截距标注 + 参数滑块
import React from 'react';
import { PlotArea, makeTransform, samplePath } from '../PlotArea';
import ParamSlider from '../ParamSlider';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import styles from '../engines.module.css';

const W = 520;
const H = 360;
const XR: [number, number] = [-10, 10];
const YR: [number, number] = [-10, 10];

const LinearRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const k = num(values.k, 1);
  const b = num(values.b, 0);
  const t = makeTransform(W, H, XR, YR);

  const fn = (x: number) => k * x + b;
  const yIntVisible = b >= YR[0] && b <= YR[1];
  const xInt = k !== 0 ? -b / k : null;
  const xIntVisible = xInt !== null && xInt >= XR[0] && xInt <= XR[1];

  return (
    <div className={styles.renderer}>
      <div className={styles.plotWrap}>
        <PlotArea width={W} height={H} xRange={XR} yRange={YR}>
          <path d={samplePath(fn, XR, YR, t)} fill="none" stroke="#34d399" strokeWidth={2.2} />
          {yIntVisible && (
            <g>
              <circle cx={t.toX(0)} cy={t.toY(b)} r={4} fill="#f472b6" stroke="#fff" strokeWidth={1.2} />
              <text x={t.toX(0) + 8} y={t.toY(b) - 6} fill="#f9a8d4" fontSize={11}>
                y 轴截距 (0, {b.toFixed(2)})
              </text>
            </g>
          )}
          {xIntVisible && xInt !== null && Math.abs(xInt) > 1e-6 && (
            <g>
              <circle cx={t.toX(xInt)} cy={t.toY(0)} r={4} fill="#fbbf24" stroke="#fff" strokeWidth={1.2} />
              <text x={t.toX(xInt) + 8} y={t.toY(0) - 6} fill="#fde68a" fontSize={11}>
                x 轴截距 ({xInt.toFixed(2)}, 0)
              </text>
            </g>
          )}
        </PlotArea>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          y = {k.toFixed(2)}x {b >= 0 ? '+' : '−'} {Math.abs(b).toFixed(2)}
        </div>
        {(['k', 'b'] as const).map((key) => (
          <ParamSlider
            key={key}
            name={key}
            param={paramOf(knowledge, key, { label: key, min: -10, max: 10, value: 0 })}
            value={num(values[key], 0)}
            onChange={(v) => set(key, v)}
          />
        ))}
        <div className={styles.readout}>
          斜率 k = {k.toFixed(2)}（{k > 0 ? 'y 随 x 增大而增大' : k < 0 ? 'y 随 x 增大而减小' : '水平直线'}
          ）· y 轴截距 b = {b.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default LinearRenderer;
