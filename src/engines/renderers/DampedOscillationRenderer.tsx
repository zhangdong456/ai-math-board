// 阻尼振动 x = A·e^(−βt)·cos(ωt) 渲染器：位移-时间曲线 + 包络线 + 当前时刻质点 + 时间自动推进
import React from 'react';
import { PlotArea, makeTransform, samplePath } from '../PlotArea';
import ParamSlider from '../ParamSlider';
import AutoPlayButton from '../AutoPlayButton';
import { useAutoPlay } from '../useAutoPlay';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import styles from '../engines.module.css';

const W = 520;
const H = 360;
const XR: [number, number] = [0, 20];

const A_FALLBACK = { label: 'A（初始振幅）', min: 0.5, max: 5, value: 2, unit: ' m' };
const BETA_FALLBACK = { label: 'β（阻尼系数）', min: 0, max: 1, step: 0.01, value: 0.15 };
const OMEGA_FALLBACK = { label: 'ω（角频率）', min: 0.5, max: 6, value: 2, unit: ' rad/s' };
const T_FALLBACK = { label: 't（时间）', min: 0, max: 20, value: 4, unit: ' s' };

const DampedOscillationRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const A = num(values.A, 2);
  const beta = num(values.beta, 0.15);
  const omega = num(values.omega, 2);
  const tNow = num(values.t, 4);
  // y 轴量程按 A 参数的 max 预留，拖大 A 时曲线不出框
  const Am = paramOf(knowledge, 'A', A_FALLBACK).max;
  const YR: [number, number] = [-Am * 1.15, Am * 1.15];
  const t = makeTransform(W, H, XR, YR);

  // 动画演示：时间 t 自动推进（到 max 后跳回 0 循环）
  const tParam = paramOf(knowledge, 't', T_FALLBACK);
  const auto = useAutoPlay(tParam.min, tParam.max, (v) => set('t', v), { mode: 'loop', periodMs: 8000 });
  // 手动拖滑块时停止自动播放，避免互相抢值
  const manual = (key: string, v: number) => {
    auto.stop();
    set(key, v);
  };

  const fn = (x: number) => A * Math.exp(-beta * x) * Math.cos(omega * x);
  const env = (x: number) => A * Math.exp(-beta * x); // 上包络线
  const curX = fn(tNow); // 当前 t 时刻位移
  const curEnv = env(tNow); // 当前包络振幅

  return (
    <div className={styles.renderer}>
      <div className={styles.plotWrap}>
        <PlotArea width={W} height={H} xRange={XR} yRange={YR}>
          {/* 上下包络线 ±A·e^(−βt) */}
          <path d={samplePath(env, XR, YR, t)} fill="none" stroke="#f59e0b" strokeWidth={1.2} strokeDasharray="5,4" />
          <path
            d={samplePath((x) => -env(x), XR, YR, t)}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={1.2}
            strokeDasharray="5,4"
          />
          {/* 位移-时间曲线（横轴即时间 t） */}
          <path d={samplePath(fn, XR, YR, t)} fill="none" stroke="#38bdf8" strokeWidth={2.2} />
          {/* 当前 t 时刻质点与到 t 轴的竖直虚线 */}
          <line
            x1={t.toX(tNow)}
            y1={t.toY(curX)}
            x2={t.toX(tNow)}
            y2={t.toY(0)}
            stroke="#f472b6"
            strokeWidth={1.2}
            strokeDasharray="4,3"
          />
          <circle cx={t.toX(tNow)} cy={t.toY(curX)} r={4.5} fill="#f472b6" stroke="#fff" strokeWidth={1.2} />
          <text x={t.toX(tNow) + 8} y={t.toY(curX) - 8} fill="#f9a8d4" fontSize={11}>
            t = {tNow.toFixed(2)} s
          </text>
        </PlotArea>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          x = {A.toFixed(2)}·e^(−{beta.toFixed(2)}t)·cos({omega.toFixed(2)}t)
        </div>
        <AutoPlayButton playing={auto.playing} onToggle={auto.toggle} hint="时间 t 自动推进" />
        <ParamSlider
          name="A"
          param={paramOf(knowledge, 'A', A_FALLBACK)}
          value={A}
          onChange={(v) => manual('A', v)}
        />
        <ParamSlider
          name="beta"
          param={paramOf(knowledge, 'beta', BETA_FALLBACK)}
          value={beta}
          onChange={(v) => manual('beta', v)}
        />
        <ParamSlider
          name="omega"
          param={paramOf(knowledge, 'omega', OMEGA_FALLBACK)}
          value={omega}
          onChange={(v) => manual('omega', v)}
        />
        <ParamSlider
          name="t"
          param={paramOf(knowledge, 't', T_FALLBACK)}
          value={tNow}
          onChange={(v) => manual('t', v)}
        />
        <div className={styles.readout}>
          t = {tNow.toFixed(2)} s 时位移 x = {curX.toFixed(3)} m · 当前包络振幅 A·e^(−βt) ={' '}
          {curEnv.toFixed(3)} m · β = 0 时退化为等幅的简谐振动
        </div>
      </div>
    </div>
  );
};

export default DampedOscillationRenderer;
