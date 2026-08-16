// 平抛运动渲染器：轨迹 y = −g·x²/(2v0²) + t 时刻速度分解矢量 + 参数滑块
import React from 'react';
import { PlotArea, makeTransform, samplePath } from '../PlotArea';
import ParamSlider from '../ParamSlider';
import AutoPlayButton from '../AutoPlayButton';
import { useAutoPlay } from '../useAutoPlay';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import styles from '../engines.module.css';

const W = 520;
const H = 360;

const ProjectileRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const v0 = Math.max(0.1, num(values.v0, 10));
  const g = Math.max(0.1, num(values.g, 9.8));
  const t = num(values.t, 1);

  // 量程随参数自适应：x 到 t = 5 s 处，y 覆盖全程下落深度（y 轴向上为正，抛出点在原点）
  const XR: [number, number] = [0, v0 * 5 * 1.08];
  const fall = 0.5 * g * 25; // t = 5 s 的下落深度
  const YR: [number, number] = [-fall * 1.12, fall * 0.18];
  const tr = makeTransform(W, H, XR, YR);

  // 动画演示：时间 t 自动推进（到 5 s 后跳回 0 循环）
  const tParam = paramOf(knowledge, 't', { label: 't（时刻）', min: 0, max: 5, value: 1 });
  const auto = useAutoPlay(tParam.min, tParam.max, (v) => set('t', v), { mode: 'loop', periodMs: 5000 });
  // 手动拖滑块时停止自动播放，避免互相抢值
  const manual = (key: string, v: number) => {
    auto.stop();
    set(key, v);
  };

  const traj = (x: number) => (-g * x * x) / (2 * v0 * v0);
  const x = v0 * t;
  const y = -0.5 * g * t * t;
  const vx = v0;
  const vy = -g * t;
  const speed = Math.hypot(vx, vy);
  const angle = (Math.atan2(Math.abs(vy), vx) * 180) / Math.PI; // 与水平方向的夹角

  // 速度矢量箭头按同一比例缩放到像素长度，保证 vx / vy 比例正确
  const scale = 64 / Math.max(v0, g * 5);
  const px = tr.toX(x);
  const py = tr.toY(y);
  const vxLen = vx * scale;
  const vyLen = Math.abs(vy) * scale;

  const defs: Array<[string, { label: string; min: number; max: number; value: number; unit?: string; effect?: string }]> = [
    ['v0', { label: 'v₀（初速度）', min: 1, max: 30, value: 10, unit: ' m/s', effect: '初速度越大，抛得越远' }],
    ['g', { label: 'g（重力加速度）', min: 1, max: 25, value: 9.8, unit: ' m/s²', effect: '设为 1.6 可演示月球表面' }],
    ['t', { label: 't（时刻）', min: 0, max: 5, value: 1, unit: ' s', effect: '移动质点，观察速度分解' }],
  ];

  return (
    <div className={styles.renderer}>
      <div className={styles.plotWrap}>
        <PlotArea width={W} height={H} xRange={XR} yRange={YR}>
          {/* 抛出点 */}
          <circle cx={tr.toX(0)} cy={tr.toY(0)} r={3.5} fill="#f59e0b" />
          <text x={tr.toX(0) + 8} y={tr.toY(0) - 8} fill="#fbbf24" fontSize={11}>
            抛出点
          </text>
          {/* 抛物线轨迹 */}
          <path d={samplePath(traj, XR, YR, tr)} fill="none" stroke="#38bdf8" strokeWidth={2.2} />
          {/* t 时刻质点与速度分解 */}
          <g>
            <circle cx={px} cy={py} r={4.5} fill="#f472b6" stroke="#fff" strokeWidth={1.2} />
            {/* 水平分速度 vx = v0 */}
            <line x1={px} y1={py} x2={px + vxLen} y2={py} stroke="#f59e0b" strokeWidth={2.5} />
            <polygon
              points={`${px + vxLen},${py} ${px + vxLen - 10},${py - 5} ${px + vxLen - 10},${py + 5}`}
              fill="#f59e0b"
            />
            <text x={px + vxLen / 2} y={py - 8} fill="#fbbf24" fontSize={11} textAnchor="middle">
              vx = {vx.toFixed(1)}
            </text>
            {/* 竖直分速度 vy = −g·t */}
            {vyLen > 2 && (
              <g>
                <line x1={px} y1={py} x2={px} y2={py + vyLen} stroke="#f472b6" strokeWidth={2.5} />
                <polygon
                  points={`${px},${py + vyLen} ${px - 5},${py + vyLen - 10} ${px + 5},${py + vyLen - 10}`}
                  fill="#f472b6"
                />
                <text x={px + 8} y={py + vyLen / 2 + 4} fill="#f9a8d4" fontSize={11}>
                  vy = {vy.toFixed(1)}
                </text>
              </g>
            )}
          </g>
          <text x={W - 110} y={tr.toY(0) - 6} fill="#9fb4d8" fontSize={11}>
            x / m
          </text>
          <text x={44} y={26} fill="#9fb4d8" fontSize={11}>
            y / m
          </text>
        </PlotArea>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          x = v₀·t，y = −½·g·t²（轨迹 y = −g·x² / (2v₀²)）
        </div>
        <AutoPlayButton playing={auto.playing} onToggle={auto.toggle} hint="时间 t 自动推进" />
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
          t = {t.toFixed(2)} s：x = {x.toFixed(2)} m，y = {y.toFixed(2)} m；vx = {vx.toFixed(2)} m/s，vy ={' '}
          {vy.toFixed(2)} m/s；合速度 |v| = {speed.toFixed(2)} m/s，方向斜向下与水平成 {angle.toFixed(1)}°。
        </div>
      </div>
    </div>
  );
};

export default ProjectileRenderer;
