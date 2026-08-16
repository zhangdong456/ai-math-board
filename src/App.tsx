// 应用外壳：顶栏 + 三栏布局（左 AI 操作区 / 中白板 / 右工具区，侧栏可折叠）+ 模型配置弹窗
import React, { useEffect } from 'react';
import Board from './board/Board';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import ModelConfigModal from './components/ModelConfigModal';
import { useUi } from './store/uiStore';
import { useBoard } from './store/boardStore';
import styles from './app.module.css';

/** 调用 boardStore 的窗口排列 action；action 尚未就绪或无窗口时为无操作 */
const arrange = (mode: 'tile' | 'cascade') => {
  const s = useBoard.getState() as unknown as Record<string, unknown>;
  const fn = mode === 'tile' ? s.arrangeTile : s.arrangeCascade;
  if (typeof fn === 'function') (fn as () => void)();
};

const App: React.FC = () => {
  const leftOpen = useUi((s) => s.leftOpen);
  const rightOpen = useUi((s) => s.rightOpen);
  const toggleLeft = useUi((s) => s.toggleLeft);
  const toggleRight = useUi((s) => s.toggleRight);

  // 首次挂载时窄屏自动折叠两侧栏；副作用幂等，StrictMode 双调用安全
  useEffect(() => {
    if (window.innerWidth < 900) {
      const st = useUi.getState();
      if (st.leftOpen) st.toggleLeft();
      if (st.rightOpen) st.toggleRight();
    }
  }, []);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <button
          className={styles.collapseBtn}
          title={leftOpen ? '收起左栏' : '展开左栏'}
          onClick={toggleLeft}
        >
          {leftOpen ? '◀' : '▶'}
        </button>
        <div className={styles.logo}>AI 动态知识演示白板</div>
        <div className={styles.headerSub}>输入知识点 → AI 生成可交互演示 ｜ 上传图片 → 红色框选 → AI 识别生成</div>
        <button className={styles.collapseBtn} title="窗口平铺排列" onClick={() => arrange('tile')}>
          ▦ 平铺
        </button>
        <button className={styles.collapseBtn} title="窗口级联排列" onClick={() => arrange('cascade')}>
          ▤ 级联
        </button>
        <button
          className={styles.collapseBtn}
          title={rightOpen ? '收起右栏' : '展开右栏'}
          onClick={toggleRight}
        >
          {rightOpen ? '▶' : '◀'}
        </button>
      </header>
      <div className={styles.main}>
        {leftOpen ? (
          <aside className={`${styles.side} ${styles.sideLeft}`}>
            <LeftPanel />
          </aside>
        ) : (
          <div
            className={`${styles.handle} ${styles.handleLeft}`}
            title="展开左栏"
            onClick={toggleLeft}
          >
            <span className={styles.handleText}>AI</span>
          </div>
        )}
        <Board />
        {rightOpen ? (
          <aside className={`${styles.side} ${styles.sideRight}`}>
            <RightPanel />
          </aside>
        ) : (
          <div
            className={`${styles.handle} ${styles.handleRight}`}
            title="展开右栏"
            onClick={toggleRight}
          >
            <span className={styles.handleText}>工具</span>
          </div>
        )}
      </div>
      <ModelConfigModal />
    </div>
  );
};

export default App;
