// 演示引擎注册表：type → 渲染器。新增演示类型只需在此登记。
import type { ComponentType } from 'react';
import type { RendererProps } from './useParams';
import QuadraticRenderer from './renderers/QuadraticRenderer';
import LinearRenderer from './renderers/LinearRenderer';
import TrigRenderer from './renderers/TrigRenderer';
import CircleRenderer from './renderers/CircleRenderer';
import NewtonRenderer from './renderers/NewtonRenderer';
import RectAreaRenderer from './renderers/RectAreaRenderer';
import TriangleAreaRenderer from './renderers/TriangleAreaRenderer';
import ParallelogramAreaRenderer from './renderers/ParallelogramAreaRenderer';
import CircleAreaRenderer from './renderers/CircleAreaRenderer';
import ExponentialRenderer from './renderers/ExponentialRenderer';
import DerivativeRenderer from './renderers/DerivativeRenderer';
import UniformMotionRenderer from './renderers/UniformMotionRenderer';
import OhmLawRenderer from './renderers/OhmLawRenderer';
import ProjectileRenderer from './renderers/ProjectileRenderer';
import BohrAtomRenderer from './renderers/BohrAtomRenderer';
import ChemicalBalanceRenderer from './renderers/ChemicalBalanceRenderer';
import Molecule3DRenderer from './renderers/Molecule3DRenderer';
import GaussianRenderer from './renderers/GaussianRenderer';
import CubicRenderer from './renderers/CubicRenderer';
import DampedOscillationRenderer from './renderers/DampedOscillationRenderer';

export interface RendererEntry {
  component: ComponentType<RendererProps>;
  /** 该 type 必须包含的参数 key，用于知识验证层 */
  requiredParams: string[];
  defaultTitle: string;
}

export const RENDERERS: Record<string, RendererEntry> = {
  quadratic: {
    component: QuadraticRenderer,
    requiredParams: ['a', 'b', 'c'],
    defaultTitle: '二次函数 y = ax² + bx + c',
  },
  linear: {
    component: LinearRenderer,
    requiredParams: ['k', 'b'],
    defaultTitle: '一次函数 y = kx + b',
  },
  trig: {
    component: TrigRenderer,
    requiredParams: ['A', 'omega', 'phi'],
    defaultTitle: '三角函数 y = A·sin(ωx + φ)',
  },
  circle: {
    component: CircleRenderer,
    requiredParams: ['h', 'k', 'r'],
    defaultTitle: '圆 (x−h)² + (y−k)² = r²',
  },
  newton_second_law: {
    component: NewtonRenderer,
    requiredParams: ['m', 'a'],
    defaultTitle: '牛顿第二定律 F = ma',
  },
  rect_area: {
    component: RectAreaRenderer,
    requiredParams: ['a', 'b'],
    defaultTitle: '矩形面积 S = a×b',
  },
  triangle_area: {
    component: TriangleAreaRenderer,
    requiredParams: ['base', 'height', 'offset'],
    defaultTitle: '三角形面积 S = ½×底×高',
  },
  parallelogram_area: {
    component: ParallelogramAreaRenderer,
    requiredParams: ['base', 'height', 'slant'],
    defaultTitle: '平行四边形面积 S = 底×高',
  },
  circle_area: {
    component: CircleAreaRenderer,
    requiredParams: ['r', 'n'],
    defaultTitle: '圆的面积与割圆术',
  },
  exponential: {
    component: ExponentialRenderer,
    requiredParams: ['a'],
    defaultTitle: '指数函数 y = a^x',
  },
  derivative: {
    component: DerivativeRenderer,
    requiredParams: ['a', 'b', 'c', 'x0', 'h'],
    defaultTitle: '导数的几何意义',
  },
  uniform_motion: {
    component: UniformMotionRenderer,
    requiredParams: ['v0', 'a', 't'],
    defaultTitle: '匀变速直线运动',
  },
  ohm_law: {
    component: OhmLawRenderer,
    requiredParams: ['U', 'R'],
    defaultTitle: '欧姆定律 I = U/R',
  },
  projectile: {
    component: ProjectileRenderer,
    requiredParams: ['v0', 'g', 't'],
    defaultTitle: '平抛运动',
  },
  bohr_atom: {
    component: BohrAtomRenderer,
    requiredParams: ['Z'],
    defaultTitle: '玻尔原子模型',
  },
  chemical_balance: {
    component: ChemicalBalanceRenderer,
    requiredParams: ['h2', 'o2', 'h2o'],
    defaultTitle: '化学方程式配平',
  },
  molecule_3d: {
    component: Molecule3DRenderer,
    requiredParams: ['rotX', 'rotY'],
    defaultTitle: '分子 3D 结构',
  },
  gaussian: {
    component: GaussianRenderer,
    requiredParams: ['a', 'mu', 'sigma'],
    defaultTitle: '高斯钟形曲线（正态分布）',
  },
  cubic: {
    component: CubicRenderer,
    requiredParams: ['a', 'b', 'c', 'd'],
    defaultTitle: '三次函数 y = ax³ + bx² + cx + d',
  },
  damped_oscillation: {
    component: DampedOscillationRenderer,
    requiredParams: ['A', 'beta', 'omega', 't'],
    defaultTitle: '阻尼振动 x = A·e^(−βt)·cos(ωt)',
  },
};

export const KNOWN_TYPES = Object.keys(RENDERERS);
