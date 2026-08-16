// 高斯钟形曲线 y = a·exp(−(x−μ)²/(2σ²)) 渲染器：曲线 + 对称轴 + 拐点 + 参数滑块 + 动画自动播放
import React from 'react';
import { PlotArea, makeTransform, samplePath } from '../PlotArea';
import ParamSlider from '../ParamSlider';
import AutoPlayButton from '../AutoPlayButton';
import { useAutoPlay } from '../useAutoPlay';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import styles from '../engines.module.css';

const W = 520;
const H = 360;
const XR: [number, number] = [-10, 10];
const YR: [number, number] = [-1, 6];

const A_FALLBACK = { label: 'a（峰高）', min: 0.2, max: 5, value: 2 };
const MU_FALLBACK = { label: 'μ（对称轴位置）', min: -6, max: 6, value: 0 };
const SIGMA_FALLBACK = { label: 'σ（宽度）', min: 0.3, max: 4, value: 1 };

const GaussianRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const a = num(values.a, 2);
  const mu = num(values.mu, 0);
  const sigma = Math.max(num(values.sigma, 1), 0.01); // σ 必须为正
  const t = makeTransform(W, H, XR, YR);

  // 动画演示：自动扫描宽度 σ（pingpong 往返）
  const sigmaParam = paramOf(knowledge, 'sigma', SIGMA_FALLBACK);
  const auto = useAutoPlay(sigmaParam.min, sigmaParam.max, (v) => set('sigma', v));
  // 手动拖滑块时停止自动播放，避免互相抢值
  const manual = (key: string, v: number) => {
    auto.stop();
    set(key, v);
  };

  const fn = (x: number) => a * Math.exp(-((x - mu) * (x - mu)) / (2 * sigma * sigma));
  // 拐点位于 μ±σ 处，高度 a·e^(−½) ≈ 0.607a
  const inflY = a * Math.exp(-0.5);
  const inflL = mu - sigma;
  const inflR = mu + sigma;
  const inflLVisible = inflL >= XR[0] && inflL <= XR[1];
  const inflRVisible = inflR >= XR[0] && inflR <= XR[1];

  return (
    <div className={styles.renderer}>
      <div className={styles.plotWrap}>
        <PlotArea width={W} height={H} xRange={XR} yRange={YR}>
          {/* 对称轴 x = μ */}
          <line
            x1={t.toX(mu)}
            y1={12}
            x2={t.toX(mu)}
            y2={H - 32}
            stroke="#f59e0b"
            strokeWidth={1.2}
            strokeDasharray="5,4"
          />
          {/* 曲线 */}
          <path d={samplePath(fn, XR, YR, t)} fill="none" stroke="#38bdf8" strokeWidth={2.2} />
          {/* 拐点 μ−σ 与 μ+σ */}
          {inflLVisible && (
            <g>
              <circle cx={t.toX(inflL)} cy={t.toY(inflY)} r={4.5} fill="#f472b6" stroke="#fff" strokeWidth={1.2} />
              <text x={t.toX(inflL) - 8} y={t.toY(inflY) - 8} fill="#f9a8d4" fontSize={11} textAnchor="end">
                拐点 ({inflL.toFixed(2)}, {inflY.toFixed(2)})
              </text>
            </g>
          )}
          {inflRVisible && (
            <g>
              <circle cx={t.toX(inflR)} cy={t.toY(inflY)} r={4.5} fill="#f472b6" stroke="#fff" strokeWidth={1.2} />
              <text x={t.toX(inflR) + 8} y={t.toY(inflY) - 8} fill="#f9a8d4" fontSize={11}>
                拐点 ({inflR.toFixed(2)}, {inflY.toFixed(2)})
              </text>
            </g>
          )}
        </PlotArea>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          y = {a.toFixed(2)}·exp(−(x {mu >= 0 ? '−' : '+'} {Math.abs(mu).toFixed(2)})²/(2×
          {sigma.toFixed(2)}²))
        </div>
        <AutoPlayButton playing={auto.playing} onToggle={auto.toggle} hint="自动扫描宽度 σ" />
        <ParamSlider
          name="a"
          param={paramOf(knowledge, 'a', A_FALLBACK)}
          value={a}
          onChange={(v) => manual('a', v)}
        />
        <ParamSlider
          name="mu"
          param={paramOf(knowledge, 'mu', MU_FALLBACK)}
          value={mu}
          onChange={(v) => manual('mu', v)}
        />
        <ParamSlider
          name="sigma"
          param={paramOf(knowledge, 'sigma', SIGMA_FALLBACK)}
          value={sigma}
          onChange={(v) => manual('sigma', v)}
        />
        <div className={styles.readout}>
          关于 x = {mu.toFixed(2)} 对称 · σ 越小曲线越陡峭、σ 越大越扁平 · 拐点在 μ±σ 处 · 峰高 a ={' '}
          {a.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default GaussianRenderer;
