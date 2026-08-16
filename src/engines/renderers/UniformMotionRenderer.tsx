// 匀变速直线运动渲染器：v-t 图像 + 阴影面积（位移）+ 参数滑块
import React from 'react';
import { PlotArea, makeTransform, samplePath } from '../PlotArea';
import ParamSlider from '../ParamSlider';
import AutoPlayButton from '../AutoPlayButton';
import { useAutoPlay } from '../useAutoPlay';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import styles from '../engines.module.css';

const W = 520;
const H = 360;
// x 轴为 t（0~10 s），y 轴为 v（v0 与 a 取极值时 v ∈ [-50, 70]）
const XR: [number, number] = [0, 10];
const YR: [number, number] = [-50, 70];

const UniformMotionRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const v0 = num(values.v0, 5);
  const a = num(values.a, 1);
  const t = num(values.t, 4);
  const tr = makeTransform(W, H, XR, YR);

  // 动画演示：时间 t 自动推进（到 10 s 后跳回 0 循环）
  const tParam = paramOf(knowledge, 't', { label: 't（观察时刻）', min: 0, max: 10, value: 4 });
  const auto = useAutoPlay(tParam.min, tParam.max, (v) => set('t', v), { mode: 'loop', periodMs: 6000 });
  // 手动拖滑块时停止自动播放，避免互相抢值
  const manual = (key: string, v: number) => {
    auto.stop();
    set(key, v);
  };

  const v = (tt: number) => v0 + a * tt;
  const vt = v(t);
  const s = v0 * t + 0.5 * a * t * t;

  // 0 ~ t 之间图线与 t 轴围成的区域（v0 ≥ 0，仅 a < 0 时可能穿过 t 轴，分正负两色填充）
  const fillPoly = (s0: number, s1: number) =>
    `${tr.toX(s0)},${tr.toY(0)} ${tr.toX(s0)},${tr.toY(v(s0))} ${tr.toX(s1)},${tr.toY(v(s1))} ${tr.toX(s1)},${tr.toY(0)}`;
  const tc = a < 0 && v0 > 0 ? -v0 / a : Infinity; // v = 0 的穿越时刻
  const cross = tc > 0 && tc < t;

  const defs: Array<[string, { label: string; min: number; max: number; value: number; unit?: string; effect?: string }]> = [
    ['v0', { label: 'v₀（初速度）', min: 0, max: 20, value: 5, unit: ' m/s', effect: '改变图线的纵截距' }],
    ['a', { label: 'a（加速度）', min: -5, max: 5, value: 1, unit: ' m/s²', effect: '改变图线斜率，a < 0 为减速' }],
    ['t', { label: 't（观察时刻）', min: 0, max: 10, value: 4, unit: ' s', effect: '移动观察点，阴影面积随之变化' }],
  ];

  return (
    <div className={styles.renderer}>
      <div className={styles.plotWrap}>
        <PlotArea width={W} height={H} xRange={XR} yRange={YR}>
          {/* 阴影面积 = 位移（t 轴上方为正、下方为负） */}
          {t > 0 &&
            (cross ? (
              <g>
                <polygon points={fillPoly(0, tc)} fill="#38bdf8" opacity={0.22} />
                <polygon points={fillPoly(tc, t)} fill="#f472b6" opacity={0.22} />
              </g>
            ) : (
              <polygon points={fillPoly(0, t)} fill={vt >= 0 ? '#38bdf8' : '#f472b6'} opacity={0.22} />
            ))}
          {/* v-t 图线 v = v0 + at */}
          <path d={samplePath(v, XR, YR, tr)} fill="none" stroke="#38bdf8" strokeWidth={2.2} />
          {/* 当前时刻观察点 */}
          <g>
            <line
              x1={tr.toX(t)}
              y1={tr.toY(0)}
              x2={tr.toX(t)}
              y2={tr.toY(vt)}
              stroke="#f59e0b"
              strokeWidth={1.2}
              strokeDasharray="5,4"
            />
            <circle cx={tr.toX(t)} cy={tr.toY(vt)} r={4.5} fill="#f472b6" stroke="#fff" strokeWidth={1.2} />
            <text x={tr.toX(t) + 8} y={tr.toY(vt) - 8} fill="#f9a8d4" fontSize={11}>
              t = {t.toFixed(1)} s，v = {vt.toFixed(2)} m/s
            </text>
          </g>
          <text x={W - 120} y={26} fill="#9fb4d8" fontSize={11}>
            t / s（横轴）
          </text>
          <text x={44} y={26} fill="#9fb4d8" fontSize={11}>
            v / (m/s)
          </text>
        </PlotArea>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          v = v₀ + at = {v0.toFixed(2)} {a >= 0 ? '+' : '−'} {Math.abs(a).toFixed(2)}·t
        </div>
        <AutoPlayButton playing={auto.playing} onToggle={auto.toggle} hint="时间 t 自动推进" />
        {defs.map(([key, fb]) => (
          <ParamSlider
            key={key}
            name={key}
            param={paramOf(knowledge, key, fb)}
            value={num(values[key], fb.value)}
            onChange={(val) => manual(key, val)}
          />
        ))}
        <div className={styles.readout}>
          t = {t.toFixed(2)} s 时：v = v₀ + at = {vt.toFixed(2)} m/s，s = v₀·t + ½·a·t² = {s.toFixed(2)} m。
          阴影面积即位移（t 轴下方计为负，粉色区域与蓝色区域求代数和）。
        </div>
      </div>
    </div>
  );
};

export default UniformMotionRenderer;
