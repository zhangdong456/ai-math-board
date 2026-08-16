// 参数滑块：演示引擎渲染器共用的参数控制组件
import React from 'react';
import type { KnowledgeParam } from '../types/knowledge';
import styles from './engines.module.css';

interface ParamSliderProps {
  name: string;
  param: KnowledgeParam;
  value: number;
  onChange: (v: number) => void;
}

const ParamSlider: React.FC<ParamSliderProps> = ({ name, param, value, onChange }) => {
  const step = param.step ?? (param.max - param.min) / 100;
  return (
    <div className={styles.sliderRow} title={param.effect}>
      <span className={styles.sliderLabel}>{param.label || name}</span>
      <input
        type="range"
        min={param.min}
        max={param.max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className={styles.sliderValue}>
        {Number(value.toFixed(3))}
        {param.unit ?? ''}
      </span>
    </div>
  );
};

export default ParamSlider;
