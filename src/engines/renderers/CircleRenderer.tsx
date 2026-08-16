// 圆 (x−h)² + (y−k)² = r² 渲染器：圆 + 圆心 + 半径标注 + 参数滑块 + 动画自动播放
import React from 'react';
import { PlotArea, makeTransform } from '../PlotArea';
import ParamSlider from '../ParamSlider';
import AutoPlayButton from '../AutoPlayButton';
import { useAutoPlay } from '../useAutoPlay';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import styles from '../engines.module.css';

const W = 520;
const H = 360;
const XR: [number, number] = [-10, 10];
const YR: [number, number] = [-7, 7];

const CircleRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const h = num(values.h, 0);
  const k = num(values.k, 0);
  const r = Math.max(0.1, num(values.r, 3));
  const t = makeTransform(W, H, XR, YR);

  // x、y 方向像素比例不同，取平均近似绘制圆
  const pxPerUnitX = (W - 72) / (XR[1] - XR[0]);
  const pxPerUnitY = (H - 72) / (YR[1] - YR[0]);
  const rp = r * Math.min(pxPerUnitX, pxPerUnitY);

  const defs: Array<[string, { label: string; min: number; max: number; value: number }]> = [
    ['h', { label: 'h（圆心横坐标）', min: -8, max: 8, value: 0 }],
    ['k', { label: 'k（圆心纵坐标）', min: -5, max: 5, value: 0 }],
    ['r', { label: 'r（半径）', min: 0.5, max: 6, value: 3 }],
  ];

  // 动画演示：自动扫描半径 r
  const rParam = paramOf(knowledge, 'r', defs[2][1]);
  const auto = useAutoPlay(rParam.min, rParam.max, (v) => set('r', v));
  // 手动拖滑块时停止自动播放，避免互相抢值
  const manual = (key: string, v: number) => {
    auto.stop();
    set(key, v);
  };

  return (
    <div className={styles.renderer}>
      <div className={styles.plotWrap}>
        <PlotArea width={W} height={H} xRange={XR} yRange={YR}>
          <circle cx={t.toX(h)} cy={t.toY(k)} r={rp} fill="rgba(56,189,248,0.08)" stroke="#38bdf8" strokeWidth={2.2} />
          <line x1={t.toX(h)} y1={t.toY(k)} x2={t.toX(h) + rp} y2={t.toY(k)} stroke="#f472b6" strokeWidth={1.5} />
          <text x={t.toX(h) + rp / 2} y={t.toY(k) - 6} fill="#f9a8d4" fontSize={11} textAnchor="middle">
            r = {r.toFixed(2)}
          </text>
          <circle cx={t.toX(h)} cy={t.toY(k)} r={4} fill="#f472b6" stroke="#fff" strokeWidth={1.2} />
          <text x={t.toX(h) + 8} y={t.toY(k) + 16} fill="#f9a8d4" fontSize={11}>
            圆心 ({h.toFixed(2)}, {k.toFixed(2)})
          </text>
        </PlotArea>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          (x − {h.toFixed(2)})² + (y − {k.toFixed(2)})² = {(r * r).toFixed(2)}
        </div>
        <AutoPlayButton playing={auto.playing} onToggle={auto.toggle} hint="自动扫描半径 r" />
        {defs.map(([key, fb]) => (
          <ParamSlider
            key={key}
            name={key}
            param={paramOf(knowledge, key, fb)}
            value={num(values[key], fb.value)}
            onChange={(v) => manual(key, v)}
          />
        ))}
        <div className={styles.readout}>
          圆心 (h, k) 决定圆的位置，半径 r 决定圆的大小 · 面积 ≈ {(Math.PI * r * r).toFixed(2)} · 周长 ≈{' '}
          {(2 * Math.PI * r).toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default CircleRenderer;
