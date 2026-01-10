import type { Transition, Variants } from "framer-motion";

// 通用过渡配置
export const transitions: Record<string, Transition> = {
  // 快速弹性过渡 - 用于按钮点击
  snappy: {
    type: "spring",
    stiffness: 400,
    damping: 17,
  },

  // 平滑弹性过渡 - 用于悬停效果
  smooth: {
    type: "spring",
    stiffness: 300,
    damping: 20,
  },

  // 柔和过渡 - 用于页面元素进入
  gentle: {
    type: "spring",
    stiffness: 100,
    damping: 15,
    mass: 0.8,
  },

  // 弹跳过渡 - 用于强调效果
  bouncy: {
    type: "spring",
    stiffness: 200,
    damping: 10,
    bounce: 0.5,
  },

  // 快速线性过渡 - 用于即时反馈
  quick: {
    duration: 0.15,
    ease: "easeOut",
  },

  // 标准过渡 - 用于一般动画
  standard: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  },

  // 缓慢过渡 - 用于重要元素
  slow: {
    duration: 0.5,
    ease: [0.4, 0, 0.2, 1],
  },
};

// 按钮动画变体
export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: transitions.smooth,
  },
  tap: {
    scale: 0.95,
    transition: transitions.snappy,
  },
};

// 图标按钮动画变体
export const iconButtonVariants: Variants = {
  initial: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: transitions.smooth,
  },
  tap: {
    scale: 0.9,
    rotate: -5,
    transition: transitions.snappy,
  },
};

// 卡片进入动画变体
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transitions.gentle,
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: transitions.smooth,
  },
};

// 列表项动画变体
export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.gentle,
  },
  hover: {
    x: 4,
    transition: transitions.smooth,
  },
};

// 容器动画变体（用于列表）
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// 模态框动画变体
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.gentle,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: transitions.quick,
  },
};

// 侧边栏动画变体
export const sidebarVariants: Variants = {
  hidden: {
    x: -20,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: transitions.gentle,
  },
};

// 导航项动画变体
export const navItemVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: transitions.smooth,
  },
  tap: {
    scale: 0.95,
    transition: transitions.snappy,
  },
  active: {
    scale: 1.02,
    transition: transitions.smooth,
  },
};

// 视频卡片动画变体
export const videoCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transitions.gentle,
  },
  hover: {
    y: -12,
    scale: 1.03,
    transition: transitions.smooth,
  },
};

// 播放按钮动画变体
export const playButtonVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.15,
    transition: transitions.smooth,
  },
  tap: {
    scale: 0.9,
    transition: transitions.snappy,
  },
};

// 脉冲动画变体（用于强调）
export const pulseVariants: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// 闪烁动画变体（用于通知）
export const shimmerVariants: Variants = {
  initial: { backgroundPosition: "200% 0" },
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// 淡入动画变体
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.standard,
  },
};

// 滑入动画变体
export const slideInVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.gentle,
  },
};

// 缩放动画变体
export const scaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.bouncy,
  },
};

// 旋转动画变体
export const rotateVariants: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// 摇晃动画变体（用于错误提示）
export const shakeVariants: Variants = {
  initial: { x: 0 },
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
};

// 弹跳动画变体
export const bounceVariants: Variants = {
  initial: { y: 0 },
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// 悬停提升效果
export const hoverLiftVariants: Variants = {
  initial: { y: 0, boxShadow: "0 0 0 rgba(0,0,0,0)" },
  hover: {
    y: -4,
    boxShadow:
      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: transitions.smooth,
  },
};

// 悬停发光效果
export const hoverGlowVariants: Variants = {
  initial: { filter: "brightness(1)" },
  hover: {
    filter: "brightness(1.1)",
    transition: transitions.smooth,
  },
};

// 文字打字机效果
export const typewriterVariants: Variants = {
  hidden: { width: 0 },
  visible: {
    width: "100%",
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// 数字滚动效果
export const numberRollVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.gentle,
  },
};

// 加载动画变体
export const loadingVariants: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// 成功动画变体
export const successVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: transitions.bouncy,
  },
};

// 错误动画变体
export const errorVariants: Variants = {
  hidden: {
    x: 0,
    opacity: 0,
  },
  visible: {
    x: [0, -10, 10, -10, 10, 0],
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
};
