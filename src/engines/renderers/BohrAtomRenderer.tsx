// 玻尔原子模型渲染器：滑块调原子序数 Z，电子层排布实时变化 + 动画自动播放
import React from 'react';
import { FitSvg } from '../PlotArea';
import ParamSlider from '../ParamSlider';
import AutoPlayButton from '../AutoPlayButton';
import { useAutoPlay } from '../useAutoPlay';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import styles from '../engines.module.css';

const W = 520;
const H = 360;

// 1~20 号元素：[符号, 中文名]
const ELEMENTS: Array<[string, string]> = [
  ['H', '氢'], ['He', '氦'], ['Li', '锂'], ['Be', '铍'], ['B', '硼'],
  ['C', '碳'], ['N', '氮'], ['O', '氧'], ['F', '氟'], ['Ne', '氖'],
  ['Na', '钠'], ['Mg', '镁'], ['Al', '铝'], ['Si', '硅'], ['P', '磷'],
  ['S', '硫'], ['Cl', '氯'], ['Ar', '氩'], ['K', '钾'], ['Ca', '钙'],
];

const SHELL_NAMES = ['K', 'L', 'M', 'N'];
// 前 20 号元素排布规律：K/L/M/N 依次填充 2、8、8、…
const SHELL_CAP = [2, 8, 8, 8];

/** 按 2/8/8/… 规律计算各层电子数 */
function shellConfig(z: number): number[] {
  const shells: number[] = [];
  let rem = z;
  for (const cap of SHELL_CAP) {
    if (rem <= 0) break;
    const n = Math.min(rem, cap);
    shells.push(n);
    rem -= n;
  }
  return shells;
}

const BohrAtomRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const Z = Math.min(20, Math.max(1, Math.round(num(values.Z, 6))));
  const [symbol, name] = ELEMENTS[Z - 1];
  const shells = shellConfig(Z);

  const cx = 185;
  const cy = 185;
  const shellR = (i: number) => 52 + i * 34;

  // 动画演示：自动切换原子序数 Z（整数步进）
  const zParam = paramOf(knowledge, 'Z', { label: 'Z（原子序数）', min: 1, max: 20, step: 1, value: 6 });
  const auto = useAutoPlay(zParam.min, zParam.max, (v) => set('Z', v), { step: 1, periodMs: 10000 });
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
          {/* 电子层同心圆 */}
          {shells.map((_, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={shellR(i)}
              fill="none"
              stroke="#2b3d58"
              strokeWidth={1.5}
            />
          ))}
          {/* 各层电子（均匀分布） */}
          {shells.map((count, i) =>
            Array.from({ length: count }).map((_, k) => {
              const ang = (2 * Math.PI * k) / count - Math.PI / 2;
              const ex = cx + shellR(i) * Math.cos(ang);
              const ey = cy + shellR(i) * Math.sin(ang);
              return (
                <circle
                  key={`${i}-${k}`}
                  cx={ex}
                  cy={ey}
                  r={5}
                  fill="#38bdf8"
                  stroke="#0d1420"
                  strokeWidth={1.5}
                />
              );
            }),
          )}
          {/* 原子核 */}
          <circle cx={cx} cy={cy} r={28} fill="#1d3557" stroke="#f59e0b" strokeWidth={2} />
          <text x={cx} y={cy - 4} fill="#fcd34d" fontSize={14} fontWeight={700} textAnchor="middle">
            +{Z}
          </text>
          <text x={cx} y={cy + 14} fill="#e2ecfb" fontSize={13} textAnchor="middle">
            {symbol}
          </text>
          {/* 右侧：各层电子数列表 */}
          <text x={388} y={96} fill="#e2ecfb" fontSize={14} fontWeight={700}>
            {name}（{symbol}）
          </text>
          <text x={388} y={118} fill="#7c8db0" fontSize={11}>
            各电子层排布
          </text>
          {shells.map((count, i) => (
            <g key={i}>
              <circle cx={398} cy={140 + i * 30} r={5} fill="#38bdf8" />
              <text x={412} y={144 + i * 30} fill="#9fb4d8" fontSize={13}>
                {SHELL_NAMES[i]} 层：{count} 个电子
              </text>
            </g>
          ))}
          <text x={388} y={146 + shells.length * 30} fill="#7c8db0" fontSize={11}>
            合计 {Z} 个核外电子
          </text>
        </FitSvg>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          {name} {symbol} · 核电荷数 +{Z} · 电子排布 {shells.join('、')}（{SHELL_NAMES.slice(0, shells.length).join('/')}）
        </div>
        <AutoPlayButton playing={auto.playing} onToggle={auto.toggle} hint="自动切换原子序数 Z" />
        <ParamSlider
          name="Z"
          param={zParam}
          value={num(values.Z, 6)}
          onChange={(v) => manual('Z', v)}
        />
        <div className={styles.readout}>
          {name}（{symbol}），原子序数 {Z}，核电荷数 +{Z}，核外电子总数 {Z}；各层排布：
          {shells.map((n, i) => `${SHELL_NAMES[i]} 层 ${n}`).join('，')}。
        </div>
      </div>
    </div>
  );
};

export default BohrAtomRenderer;
