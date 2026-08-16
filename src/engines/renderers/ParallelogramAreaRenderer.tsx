// 平行四边形面积 S = 底 × 高 渲染器：割补法——把一端的直角三角形平移到另一端拼成长方形 + 动画自动播放
import React from 'react';
import { FitSvg } from '../PlotArea';
import ParamSlider from '../ParamSlider';
import AutoPlayButton from '../AutoPlayButton';
import { useAutoPlay } from '../useAutoPlay';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import styles from '../engines.module.css';

const W = 520;
const H = 340;

const ParallelogramAreaRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const base = Math.max(1, num(values.base, 8)); // 底
  const height = Math.max(0.5, num(values.height, 4)); // 高
  const slant = Math.max(0, num(values.slant, 2)); // 顶边水平偏移

  // 顶点（数学坐标）：A(0,0) B(base,0) C(base+slant,h) D(slant,h)
  const minX = 0;
  const maxX = base + slant;
  const scale = Math.min((W - 140) / Math.max(1, maxX - minX), (H - 130) / height);
  const ox = (W - (maxX - minX) * scale) / 2;
  const baseY = H - 70;
  const sx = (x: number) => ox + (x - minX) * scale;
  const sy = (y: number) => baseY - y * scale;

  const area = base * height;
  const p = (x: number, y: number) => `${sx(x).toFixed(1)},${sy(y).toFixed(1)}`;

  const defs: Array<[string, { label: string; min: number; max: number; value: number }]> = [
    ['base', { label: 'base（底）', min: 1, max: 12, value: 8 }],
    ['height', { label: 'height（高）', min: 1, max: 8, value: 4 }],
    ['slant', { label: 'slant（倾斜偏移）', min: 0, max: 6, value: 2 }],
  ];

  // 动画演示：自动改变倾斜（底和高不变，面积不变）
  const slantParam = paramOf(knowledge, 'slant', defs[2][1]);
  const auto = useAutoPlay(slantParam.min, slantParam.max, (v) => set('slant', v));
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
          {/* 割补目标：base × height 的长方形轮廓（虚线） */}
          <rect
            x={sx(0)}
            y={sy(height)}
            width={base * scale}
            height={height * scale}
            fill="none"
            stroke="#a7f3d0"
            strokeWidth={1.5}
            strokeDasharray="7,5"
          />
          {/* 平行四边形本体 */}
          <polygon
            points={`${p(0, 0)} ${p(base, 0)} ${p(base + slant, height)} ${p(slant, height)}`}
            fill="rgba(56,189,248,0.14)"
            stroke="#38bdf8"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {/* 右侧多出的直角三角形（待割下，高亮） */}
          {slant > 1e-9 && (
            <polygon
              points={`${p(base, 0)} ${p(base + slant, height)} ${p(base, height)}`}
              fill="rgba(245,158,11,0.45)"
              stroke="#f59e0b"
              strokeWidth={1.5}
            />
          )}
          {/* 平移到左侧补缺的三角形副本（半透明 + 虚线描边） */}
          {slant > 1e-9 && (
            <polygon
              points={`${p(0, 0)} ${p(slant, height)} ${p(0, height)}`}
              fill="rgba(245,158,11,0.20)"
              stroke="#f59e0b"
              strokeWidth={1.2}
              strokeDasharray="4,4"
            />
          )}
          {/* 高（虚线） */}
          <line
            x1={sx(base)}
            y1={sy(0)}
            x2={sx(base)}
            y2={sy(height)}
            stroke="#f59e0b"
            strokeWidth={1.2}
            strokeDasharray="6,4"
          />
          <text x={sx(base) + 8} y={sy(height / 2)} fill="#fcd34d" fontSize={12}>
            高 = {height.toFixed(2)}
          </text>
          <text x={(sx(0) + sx(base)) / 2} y={sy(0) + 20} fill="#7dd3fc" fontSize={12} textAnchor="middle">
            底 = {base.toFixed(2)}
          </text>
        </FitSvg>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          S = 底 × 高 = {base.toFixed(2)} × {height.toFixed(2)} = {area.toFixed(2)}
        </div>
        <AutoPlayButton playing={auto.playing} onToggle={auto.toggle} hint="自动改变倾斜（面积不变）" />
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
          割补法：把右侧多出的直角三角形（橙色）剪下，平移到左侧缺口，正好拼成一个 {base.toFixed(2)} ×{' '}
          {height.toFixed(2)} 的长方形（绿色虚线），所以平行四边形面积 = 底 × 高 = {area.toFixed(2)}。
        </div>
      </div>
    </div>
  );
};

export default ParallelogramAreaRenderer;
