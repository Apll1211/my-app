import { type FC, useCallback, useEffect, useState } from "react";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  useClassName?: string;
  className?: string;
  characters?: string;
  parentClassName?: string;
}

const DecryptedText: FC<DecryptedTextProps> = ({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = "start",
  useClassName = "",
  className = "",
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?",
  parentClassName = "",
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const animate = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);

    const iterationCount = Array.from({ length: text.length }).fill(0);
    let iterations = 0;

    const interval = setInterval(() => {
      setDisplayText((prev) => {
        return prev
          .split("")
          .map((char, index) => {
            if (char === " ") return char;

            if (index < iterationCount[index]) {
              return text[index];
            }

            if (sequential) {
              let progress = 0;
              if (revealDirection === "start") {
                progress = index / text.length;
              } else if (revealDirection === "end") {
                progress = (text.length - 1 - index) / text.length;
              } else if (revealDirection === "center") {
                const center = text.length / 2;
                progress = 1 - Math.abs(index - center) / center;
              }

              if (progress * maxIterations < iterations) {
                iterationCount[index] = iterations + 1;
                return text[index];
              }
            } else {
              if (iterationCount[index] > 0) {
                return text[index];
              }
            }

            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join("");
      });

      iterations++;

      if (iterations >= maxIterations + (sequential ? text.length : 0)) {
        clearInterval(interval);
        setDisplayText(text);
        setIsAnimating(false);
      }
    }, speed);
  }, [
    isAnimating,
    text,
    speed,
    maxIterations,
    sequential,
    revealDirection,
    characters,
  ]);

  useEffect(() => {
    if (mounted) {
      animate();
    }
  }, [mounted, animate]);

  return (
    <button
      type="button"
      className={`inline-block ${parentClassName}`}
      onClick={animate}
    >
      <span className={`${useClassName} ${className}`}>{displayText}</span>
    </button>
  );
};

export default DecryptedText;
