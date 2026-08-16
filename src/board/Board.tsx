// 白板容器：窗口渲染、可视区域尺寸同步、首次打开加载默认演示
import React, { useEffect, useRef } from 'react';
import { useBoard } from '../store/boardStore';
import { TEMPLATES } from '../engines/templates';
import WindowFrame from './WindowFrame';
import AnnotationLayer from './AnnotationLayer';
import ImageWindow from '../windows/ImageWindow';
import DemoWindow from '../windows/DemoWindow';
import styles from './board.module.css';

let initialized = false;

const Board: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const windows = useBoard((s) => s.windows);
  const setViewport = useBoard((s) => s.setViewport);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => setViewport(el.clientWidth, el.clientHeight);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [setViewport]);

  // 首次打开不是空白页：无窗口时自动载入默认二次函数演示
  useEffect(() => {
    if (initialized) return;
    initialized = true;
    if (useBoard.getState().windows.length === 0) {
      useBoard.getState().addDemoWindow(TEMPLATES[0].knowledge, 'verified');
    }
  }, []);

  return (
    <div ref={ref} className={styles.board}>
      {windows.length === 0 && (
        <div className={styles.emptyHint}>
          在左侧输入知识点或上传图片开始
          <br />
          也可以点击默认模板快速体验
        </div>
      )}
      {windows.map((w) => (
        <WindowFrame key={w.id} win={w}>
          {w.kind === 'image' ? <ImageWindow win={w} /> : <DemoWindow win={w} />}
        </WindowFrame>
      ))}
      <AnnotationLayer />
    </div>
  );
};

export default Board;
