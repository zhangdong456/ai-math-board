// 三次函数 y = ax³ + bx² + cx + d 渲染器：曲线 + 极值点 + 参数滑块 + 动画自动播放
import React from 'react';
import { PlotArea, makeTransform, samplePath } from '../PlotArea';
import ParamSlider from '../ParamSlider';
import AutoPlayButton from '../AutoPlayButton';
import { useAutoPlay } from '../useAutoPlay';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import styles from '../engines.module.css';

const W = 520;
const H = 360;
const XR: [number, number] = [-5, 5];
const YR: [number, number] = [-10, 10];

const A_FALLBACK = { label: 'a（三次项系数）', min: -2, max: 2, value: 1 };

const CubicRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const a = num(values.a, 1);
  const b = num(values.b, 0);
  const c = num(values.c, -3);
  const d = num(values.d, 0);
  const t = makeTransform(W, H, XR, YR);

  // 动画演示：自动扫描参数 a（避开 a=0 的退化点）
  const aParam = paramOf(knowledge, 'a', A_FALLBACK);
  const auto = useAutoPlay(aParam.min, aParam.max, (v) => set('a', v === 0 ? 0.01 : v));
  // 手动拖滑块时停止自动播放，避免互相抢值
  const manual = (key: string, v: number) => {
    auto.stop();
    set(key, v);
  };

  const fn = (x: number) => a * x * x * x + b * x * x + c * x + d;
  // 导数 3ax² + 2bx + c = 0，判别式 Δ = 4(b² − 3ac)
  const disc = 4 * (b * b - 3 * a * c);
  // Δ > 0 时有两个极值点（极值点可能落在视野外，逐个判断）
  const extremes: { x: number; y: number }[] = [];
  if (disc > 0) {
    const sq = Math.sqrt(disc);
    for (const x of [(-2 * b - sq) / (6 * a), (-2 * b + sq) / (6 * a)]) {
      const y = fn(x);
      if (x >= XR[0] && x <= XR[1] && y >= YR[0] && y <= YR[1]) extremes.push({ x, y });
    }
  }

  return (
    <div className={styles.renderer}>
      <div className={styles.plotWrap}>
        <PlotArea width={W} height={H} xRange={XR} yRange={YR}>
          {/* 曲线 */}
          <path d={samplePath(fn, XR, YR, t)} fill="none" stroke="#38bdf8" strokeWidth={2.2} />
          {/* 极值点 */}
          {extremes.map((p) => (
            <g key={p.x.toFixed(4)}>
              <circle cx={t.toX(p.x)} cy={t.toY(p.y)} r={4.5} fill="#f472b6" stroke="#fff" strokeWidth={1.2} />
              <text x={t.toX(p.x) + 8} y={t.toY(p.y) - 8} fill="#f9a8d4" fontSize={11}>
                极值点 ({p.x.toFixed(2)}, {p.y.toFixed(2)})
              </text>
            </g>
          ))}
        </PlotArea>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          y = {a.toFixed(2)}x³ {b >= 0 ? '+' : '−'} {Math.abs(b).toFixed(2)}x² {c >= 0 ? '+' : '−'}{' '}
          {Math.abs(c).toFixed(2)}x {d >= 0 ? '+' : '−'} {Math.abs(d).toFixed(2)}
        </div>
        <AutoPlayButton playing={auto.playing} onToggle={auto.toggle} hint="自动扫描参数 a" />
        <ParamSlider
          name="a"
          param={paramOf(knowledge, 'a', A_FALLBACK)}
          value={a}
          onChange={(v) => manual('a', v === 0 ? 0.01 : v)}
        />
        {(['b', 'c', 'd'] as const).map((k) => (
          <ParamSlider
            key={k}
            name={k}
            param={paramOf(knowledge, k, { label: k, min: -5, max: 5, value: 0 })}
            value={num(values[k], 0)}
            onChange={(v) => manual(k, v)}
          />
        ))}
        <div className={styles.readout}>
          {disc > 0
            ? `导数判别式 Δ = ${disc.toFixed(2)} > 0，有一个极大值和一个极小值 · a ${a > 0 ? '>' : '<'} 0，整体从左${a > 0 ? '下向右上' : '上向右下'}延伸`
            : `导数判别式 Δ = ${disc.toFixed(2)} ≤ 0，无极值点，函数单调${a > 0 ? '递增' : '递减'}`}
        </div>
      </div>
    </div>
  );
};

export default CubicRenderer;
