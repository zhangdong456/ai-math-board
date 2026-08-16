// 三角形面积 S = ½·底·高 渲染器：拖动顶点偏移演示"等底等高面积不变" + 动画自动播放
import React from 'react';
import { FitSvg } from '../PlotArea';
import ParamSlider from '../ParamSlider';
import AutoPlayButton from '../AutoPlayButton';
import { useAutoPlay } from '../useAutoPlay';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import styles from '../engines.module.css';

const W = 520;
const H = 340;

const TriangleAreaRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const base = Math.max(0.5, num(values.base, 8)); // 底
  const height = Math.max(0.5, num(values.height, 5)); // 高
  const offset = num(values.offset, 0); // 顶点水平偏移

  // 三个顶点（数学坐标：底边在 y=0 上，x 向右）
  const ax = 0;
  const bx = base;
  const cxm = base / 2 + offset; // 顶点横坐标 = 底边中点 + offset
  const minX = Math.min(ax, cxm);
  const maxX = Math.max(bx, cxm);

  // 单位缩放与屏幕映射，保证三角形整体居中放下
  const scale = Math.min((W - 140) / Math.max(1, maxX - minX), (H - 130) / height);
  const ox = (W - (maxX - minX) * scale) / 2;
  const baseY = H - 70;
  const sx = (x: number) => ox + (x - minX) * scale;
  const sy = (y: number) => baseY - y * scale;

  const area = (base * height) / 2;

  const defs: Array<[string, { label: string; min: number; max: number; value: number }]> = [
    ['base', { label: 'base（底）', min: 1, max: 12, value: 8 }],
    ['height', { label: 'height（高）', min: 1, max: 10, value: 5 }],
    ['offset', { label: 'offset（顶点偏移）', min: -6, max: 6, value: 0 }],
  ];

  // 动画演示：自动移动顶点（等底等高，面积不变）
  const offsetParam = paramOf(knowledge, 'offset', defs[2][1]);
  const auto = useAutoPlay(offsetParam.min, offsetParam.max, (v) => set('offset', v));
  // 手动拖滑块时停止自动播放，避免互相抢值
  const manual = (key: string, v: number) => {
    auto.stop();
    set(key, v);
  };

  return (
    <div className={styles.renderer}>
      <div className={styles.plotWrap}>
        <FitSvg width={W} height={H}>
          <rect x={0} y={0} width={W} height={H} fill="#0d1420" rx={8} />
          {/* 三角形半透明填充 */}
          <polygon
            points={`${sx(ax)},${sy(0)} ${sx(bx)},${sy(0)} ${sx(cxm)},${sy(height)}`}
            fill="rgba(56,189,248,0.15)"
            stroke="#38bdf8"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {/* 高：从顶点向底边所在直线引的虚线 */}
          <line
            x1={sx(cxm)}
            y1={sy(height)}
            x2={sx(cxm)}
            y2={sy(0)}
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="6,4"
          />
          {/* 直角标记 */}
          <rect
            x={sx(cxm)}
            y={sy(0) - 10}
            width={10}
            height={10}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={1}
          />
          <text x={sx(cxm) + 8} y={sy(height / 2)} fill="#fcd34d" fontSize={12}>
            高 = {height.toFixed(2)}
          </text>
          {/* 底边标注 */}
          <text x={(sx(ax) + sx(bx)) / 2} y={sy(0) + 20} fill="#7dd3fc" fontSize={12} textAnchor="middle">
            底 = {base.toFixed(2)}
          </text>
          {/* 顶点 */}
          <circle cx={sx(cxm)} cy={sy(height)} r={4.5} fill="#f472b6" stroke="#fff" strokeWidth={1.2} />
          <text x={sx(cxm) + 8} y={sy(height) - 8} fill="#f9a8d4" fontSize={11}>
            顶点（offset = {offset.toFixed(2)}）
          </text>
          {/* 底边端点 */}
          <circle cx={sx(ax)} cy={sy(0)} r={3.5} fill="#38bdf8" />
          <circle cx={sx(bx)} cy={sy(0)} r={3.5} fill="#38bdf8" />
        </FitSvg>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          S = ½ × 底 × 高 = ½ × {base.toFixed(2)} × {height.toFixed(2)} = {area.toFixed(2)}
        </div>
        <AutoPlayButton playing={auto.playing} onToggle={auto.toggle} hint="自动移动顶点（面积不变）" />
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
          拖动 offset 让顶点沿水平方向滑动：三角形形状变了，但只要底 {base.toFixed(2)} 与高{' '}
          {height.toFixed(2)} 不变，面积恒为 S = {area.toFixed(2)} —— 等底等高的三角形面积相等。
        </div>
      </div>
    </div>
  );
};

export default TriangleAreaRenderer;
