import gsap from "gsap";
import React, {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
} from "react";

export interface CardSwapProps {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  onCardClick?: (idx: number) => void;
  skewAmount?: number;
  easing?: "linear" | "elastic";
  children: ReactNode;
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  customClass?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ customClass, ...rest }, ref) => (
    <div
      ref={ref}
      {...rest}
      className={`absolute top-1/2 left-1/2 rounded-xl border border-white bg-black transform-3d will-change-transform backface-hidden opacity-0 ${customClass ?? ""} ${rest.className ?? ""}`.trim()}
    />
  ),
);
Card.displayName = "Card";

type CardRef = RefObject<HTMLDivElement | null>;
interface Slot {
  x: number;
  y: number;
  z: number;
  zIndex: number;
}

const makeSlot = (
  i: number,
  distX: number,
  distY: number,
  total: number,
): Slot => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i,
});

const placeNow = (el: HTMLElement, slot: Slot, skew: number) => {
  console.log("[CardSwap] placeNow called:", {
    slot,
    skew,
    element: el.tagName,
    elementId: el.id,
  });

  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: "center center",
    zIndex: slot.zIndex,
    force3D: true,
    opacity: 1, // 设置透明度为 1，让卡片可见
  });

  // 验证设置是否生效
  const computedStyle = window.getComputedStyle(el);
  console.log(
    "[CardSwap] After placeNow, computed transform:",
    computedStyle.transform,
  );
};

const CardSwap: React.FC<CardSwapProps> = ({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  onCardClick,
  skewAmount = 6,
  easing = "elastic",
  children,
}) => {
  const config =
    easing === "elastic"
      ? {
          ease: "elastic.out(0.6,0.9)",
          durDrop: 2,
          durMove: 2,
          durReturn: 2,
          promoteOverlap: 0.9,
          returnDelay: 0.05,
        }
      : {
          ease: "power1.inOut",
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.45,
          returnDelay: 0.2,
        };

  const childArr = useMemo(
    () => Children.toArray(children) as ReactElement<CardProps>[],
    [children],
  );

  // 使用 useMemo 创建 refs，确保在渲染前就准备好
  // 这样 rendered 函数在首次渲染时就能访问到正确的 refs
  const refs = useMemo(() => {
    console.log("[CardSwap] Creating refs for", childArr.length, "children");
    return Array(childArr.length)
      .fill(null)
      .map(() => React.createRef<HTMLDivElement>());
  }, [childArr.length]);

  const order = useRef<number[]>([]);
  const initialized = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const intervalRef = useRef<number>(0);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("[CardSwap] Effect triggered:", {
      childCount: childArr.length,
      cardDistance,
      verticalDistance,
      delay,
    });

    // 初始化 order
    if (!initialized.current) {
      console.log("[CardSwap] Initializing order");
      order.current = Array.from({ length: childArr.length }, (_, i) => i);
      initialized.current = true;
    }

    const total = refs.length;

    // 定义 swap 函数，确保在所有作用域中都可访问
    const swap = () => {
      console.log("[CardSwap] Swap triggered, order:", order.current);
      if (order.current.length < 2) return;

      const [front, ...rest] = order.current;
      const elFront = refs[front].current;
      if (!elFront) return;

      const tl = gsap.timeline();
      tlRef.current = tl;

      tl.to(elFront, {
        y: "+=500",
        duration: config.durDrop,
        ease: config.ease,
      });

      tl.addLabel("promote", `-=${config.durDrop * config.promoteOverlap}`);
      rest.forEach((idx, i) => {
        const el = refs[idx].current;
        if (!el) return;

        const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
        tl.set(el, { zIndex: slot.zIndex }, "promote");
        tl.to(
          el,
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            duration: config.durMove,
            ease: config.ease,
          },
          `promote+=${i * 0.15}`,
        );
      });

      const backSlot = makeSlot(
        refs.length - 1,
        cardDistance,
        verticalDistance,
        refs.length,
      );
      tl.addLabel("return", `promote+=${config.durMove * config.returnDelay}`);
      tl.call(
        () => {
          if (elFront) {
            gsap.set(elFront, { zIndex: backSlot.zIndex });
          }
        },
        undefined,
        "return",
      );
      tl.to(
        elFront,
        {
          x: backSlot.x,
          y: backSlot.y,
          z: backSlot.z,
          duration: config.durReturn,
          ease: config.ease,
        },
        "return",
      );

      tl.call(() => {
        console.log("[CardSwap] Swap complete, new order:", [...rest, front]);
        order.current = [...rest, front];
      });
    };

    // 定义放置卡片并启动动画的函数
    const placeCardsAndStartAnimation = () => {
      console.log("[CardSwap] Placing cards");
      refs.forEach((r, i) => {
        if (r.current) {
          placeNow(
            r.current,
            makeSlot(i, cardDistance, verticalDistance, total),
            skewAmount,
          );
        }
      });

      console.log("[CardSwap] Starting first swap");
      swap();
      intervalRef.current = window.setInterval(() => {
        console.log("[CardSwap] Interval swap triggered");
        swap();
      }, delay);

      if (pauseOnHover) {
        const node = container.current;
        if (node) {
          console.log("[CardSwap] Setting up hover events");
          const pause = () => {
            console.log("[CardSwap] Paused on hover");
            tlRef.current?.pause();
            clearInterval(intervalRef.current);
          };
          const resume = () => {
            console.log("[CardSwap] Resumed on leave");
            tlRef.current?.play();
            intervalRef.current = window.setInterval(swap, delay);
          };
          node.addEventListener("mouseenter", pause);
          node.addEventListener("mouseleave", resume);
        }
      }
    };

    // 等待 DOM 渲染完成后再执行 GSAP 动画
    // 增加延迟时间并使用 requestAnimationFrame 确保 DOM 完全渲染
    const timeoutId = setTimeout(() => {
      console.log("[CardSwap] DOM ready, placing cards");

      // 使用 requestAnimationFrame 确保 DOM 完全渲染
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // 检查所有 refs 是否都已绑定
          const allRefsReady = refs.every((r) => r.current !== null);
          console.log("[CardSwap] All refs ready:", allRefsReady);

          if (!allRefsReady) {
            console.warn("[CardSwap] Some refs are not ready, retrying...");
            // 如果 refs 没有准备好，再等待一段时间
            setTimeout(() => {
              placeCardsAndStartAnimation();
            }, 200);
            return;
          }

          placeCardsAndStartAnimation();
        });
      });
    }, 200);

    return () => {
      console.log("[CardSwap] Cleanup");
      clearTimeout(timeoutId);
      clearInterval(intervalRef.current);
      if (pauseOnHover && container.current) {
        const node = container.current;
        node.removeEventListener("mouseenter", () => {});
        node.removeEventListener("mouseleave", () => {});
      }
    };
  }, [
    cardDistance,
    verticalDistance,
    delay,
    pauseOnHover,
    skewAmount,
    config,
    childArr.length,
  ]);

  const rendered = childArr.map((child, i) =>
    isValidElement<CardProps>(child)
      ? cloneElement(child, {
          key: i,
          ref: refs[i],
          style: { width, height, ...(child.props.style ?? {}) },
          onClick: (e) => {
            child.props.onClick?.(e as React.MouseEvent<HTMLDivElement>);
            onCardClick?.(i);
          },
        } as CardProps & React.RefAttributes<HTMLDivElement>)
      : child,
  );

  return (
    <div
      ref={container}
      className="absolute top-[60%] left-[45%] transform -translate-x-1/2 -translate-y-1/2 perspective-[900px] overflow-visible max-[768px]:scale-[0.75] max-[480px]:scale-[0.55]"
      style={{ width, height }}
    >
      {rendered}
    </div>
  );
};

export default CardSwap;
