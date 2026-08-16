// 动画自动播放按钮：渲染器共用，配合 useAutoPlay 使用
import React from 'react';
import styles from './engines.module.css';

interface AutoPlayButtonProps {
  playing: boolean;
  onToggle: () => void;
  /** 说明文字，如「自动扫描参数 a」或「时间 t 自动推进」 */
  hint: string;
}

const AutoPlayButton: React.FC<AutoPlayButtonProps> = ({ playing, onToggle, hint }) => (
  <button
    type="button"
    className={`${styles.autoPlayBtn} ${playing ? styles.autoPlayBtnOn : ''}`}
    onClick={onToggle}
  >
    <span className={styles.autoPlayIcon}>{playing ? '⏸' : '▶'}</span>
    {playing ? `停止演示（${hint}）` : `动画演示（${hint}）`}
  </button>
);

export default AutoPlayButton;
