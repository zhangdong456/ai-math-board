// 牛顿第二定律 F = ma 渲染器：滑块调 m / a，力箭头与数值实时变化
import React from 'react';
import ParamSlider from '../ParamSlider';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import styles from '../engines.module.css';

const W = 520;
const H = 300;

const NewtonRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const m = Math.max(0.1, num(values.m, 2));
  const a = num(values.a, 1);
  const F = m * a;

  // 力箭头长度按 |F| 缩放（上限保护）
  const maxF = Math.max(
    10,
    (knowledge.parameters?.m?.max ?? 10) * Math.max(Math.abs(knowledge.parameters?.a?.min ?? -5), Math.abs(knowledge.parameters?.a?.max ?? 5)),
  );
  const arrowLen = Math.min(340, (Math.abs(F) / maxF) * 340);
  const dir = F >= 0 ? 1 : -1;
  const boxW = 60 + Math.min(120, m * 6); // 质量越大物块越宽
  const cx = W / 2;
  const groundY = H - 70;
  const boxH = 56;
  const arrowY = groundY - boxH / 2;
  const x0 = cx + (dir * boxW) / 2;
  const x1 = x0 + dir * arrowLen;

  const defs: Array<[string, { label: string; min: number; max: number; value: number; unit?: string }]> = [
    ['m', { label: 'm（质量）', min: 0.5, max: 10, value: 2, unit: ' kg' }],
    ['a', { label: 'a（加速度）', min: -5, max: 5, value: 1, unit: ' m/s²' }],
  ];

  return (
    <div className={styles.renderer}>
      <div className={styles.plotWrap}>
        <svg width={W} height={H} style={{ display: 'block', touchAction: 'none' }}>
          <rect x={0} y={0} width={W} height={H} fill="#0d1420" rx={8} />
          {/* 地面 */}
          <line x1={30} y1={groundY} x2={W - 30} y2={groundY} stroke="#4a5f82" strokeWidth={2} />
          {Array.from({ length: 22 }).map((_, i) => (
            <line
              key={i}
              x1={36 + i * 21}
              y1={groundY}
              x2={28 + i * 21}
              y2={groundY + 10}
              stroke="#263549"
              strokeWidth={1.5}
            />
          ))}
          {/* 物块 */}
          <rect
            x={cx - boxW / 2}
            y={groundY - boxH}
            width={boxW}
            height={boxH}
            rx={6}
            fill="#1d3557"
            stroke="#38bdf8"
            strokeWidth={1.5}
          />
          <text x={cx} y={groundY - boxH / 2 + 4} fill="#e2ecfb" fontSize={13} textAnchor="middle">
            m = {m.toFixed(1)} kg
          </text>
          {/* 加速度箭头（物块上方，较小） */}
          <line x1={cx} y1={groundY - boxH - 22} x2={cx + dir * 60} y2={groundY - boxH - 22} stroke="#a78bfa" strokeWidth={2} />
          <polygon
            points={`${cx + dir * 60},${groundY - boxH - 22} ${cx + dir * 48},${groundY - boxH - 27} ${cx + dir * 48},${groundY - boxH - 17}`}
            fill="#a78bfa"
          />
          <text x={cx + dir * 70} y={groundY - boxH - 18} fill="#c4b5fd" fontSize={12}>
            a = {a.toFixed(2)} m/s²
          </text>
          {/* 力箭头 */}
          {arrowLen > 4 && (
            <g>
              <line x1={x0} y1={arrowY} x2={x1} y2={arrowY} stroke="#f472b6" strokeWidth={4} />
              <polygon
                points={`${x1},${arrowY} ${x1 - dir * 14},${arrowY - 7} ${x1 - dir * 14},${arrowY + 7}`}
                fill="#f472b6"
              />
              <text x={(x0 + x1) / 2} y={arrowY - 12} fill="#f9a8d4" fontSize={13} textAnchor="middle">
                F = {F.toFixed(2)} N
              </text>
            </g>
          )}
          {/* 力数值柱状条 */}
          <rect x={30} y={20} width={W - 60} height={14} rx={7} fill="#17202f" />
          <rect
            x={30}
            y={20}
            width={Math.max(4, Math.min(W - 60, (Math.abs(F) / maxF) * (W - 60)))}
            height={14}
            rx={7}
            fill="#38bdf8"
          />
          <text x={30} y={14} fill="#7c8db0" fontSize={11}>
            合力大小 |F|（满刻度 ≈ {maxF.toFixed(0)} N）
          </text>
        </svg>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          F = m·a = {m.toFixed(1)} × {a.toFixed(2)} = {F.toFixed(2)} N
        </div>
        {defs.map(([key, fb]) => (
          <ParamSlider
            key={key}
            name={key}
            param={paramOf(knowledge, key, fb)}
            value={num(values[key], fb.value)}
            onChange={(v) => set(key, v)}
          />
        ))}
        <div className={styles.readout}>
          质量 m 不变时，F 与 a 成正比；加速度 a 不变时，F 与 m 成正比。力的方向与加速度方向一致。
        </div>
      </div>
    </div>
  );
};

export default NewtonRenderer;
