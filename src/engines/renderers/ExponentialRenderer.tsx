// 指数函数 y = a^x 渲染器：曲线 + 关键点 (0,1) (1,a)，演示底数对单调性的影响 + 动画自动播放
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
const YR: [number, number] = [-2, 10];

const ExponentialRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  // a === 1 时函数退化为常数，按 1.001 处理避免平线
  const raw = num(values.a, 2);
  const a = raw === 1 ? 1.001 : Math.max(0.01, raw);
  const t = makeTransform(W, H, XR, YR);

  // 动画演示：自动扫描底数 a（a=1 的退化点沿用 1.001 修正）
  const aParam = paramOf(knowledge, 'a', { label: 'a（底数）', min: 0.1, max: 4, value: 2 });
  const auto = useAutoPlay(aParam.min, aParam.max, (v) => set('a', v));
  // 手动拖滑块时停止自动播放，避免互相抢值
  const manual = (key: string, v: number) => {
    auto.stop();
    set(key, v);
  };

  const fn = (x: number) => Math.pow(a, x);
  const p1Visible = a >= YR[0] && a <= YR[1];

  return (
    <div className={styles.renderer}>
      <div className={styles.plotWrap}>
        <PlotArea width={W} height={H} xRange={XR} yRange={YR}>
          {/* 渐近线 y = 0 提示 */}
          <line
            x1={36}
            y1={t.toY(0)}
            x2={W - 36}
            y2={t.toY(0)}
            stroke="#f59e0b"
            strokeWidth={1}
            strokeDasharray="4,5"
          />
          {/* 曲线 y = a^x */}
          <path d={samplePath(fn, XR, YR, t)} fill="none" stroke="#38bdf8" strokeWidth={2.2} />
          {/* 关键点 (0, 1) */}
          <circle cx={t.toX(0)} cy={t.toY(1)} r={4.5} fill="#f472b6" stroke="#fff" strokeWidth={1.2} />
          <text x={t.toX(0) + 8} y={t.toY(1) - 8} fill="#f9a8d4" fontSize={11}>
            (0, 1)
          </text>
          {/* 关键点 (1, a) */}
          {p1Visible && (
            <g>
              <circle cx={t.toX(1)} cy={t.toY(a)} r={4} fill="#f59e0b" stroke="#fff" strokeWidth={1.2} />
              <text x={t.toX(1) + 8} y={t.toY(a) - 8} fill="#fcd34d" fontSize={11}>
                (1, {a.toFixed(2)})
              </text>
            </g>
          )}
        </PlotArea>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          y = aˣ = {a.toFixed(2)}ˣ
        </div>
        <AutoPlayButton playing={auto.playing} onToggle={auto.toggle} hint="自动扫描底数 a" />
        <ParamSlider
          name="a"
          param={paramOf(knowledge, 'a', { label: 'a（底数）', min: 0.1, max: 4, value: 2 })}
          value={num(values.a, 2)}
          onChange={(v) => manual('a', v)}
        />
        <div className={styles.readout}>
          底数 a = {a.toFixed(2)}：{a > 1 ? 'a > 1，函数在 R 上单调递增' : '0 < a < 1，函数在 R 上单调递减'}
          ；定义域为 R，值域为 (0, +∞)；图象恒过点 (0, 1)，x 轴（y = 0）是渐近线。
        </div>
      </div>
    </div>
  );
};

export default ExponentialRenderer;
