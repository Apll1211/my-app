import type React from "react";
import { useEffect, useRef, useState } from "react";
import FuzzyText from "./FuzzyText";

interface FuzzyTypeTextProps {
	texts: string[];
	fontSize?: number | string;
	fontWeight?: string | number;
	fontFamily?: string;
	color?: string;
	typingSpeed?: number;
	pauseDuration?: number;
	showCursor?: boolean;
	cursorCharacter?: string;
	className?: string;
	fuzzyIntensity?: number;
}

const FuzzyTypeText: React.FC<FuzzyTypeTextProps> = ({
	texts,
	fontSize = "clamp(1rem, 4vw, 2rem)",
	fontWeight = "400",
	fontFamily = "inherit",
	color = "#ffffff",
	typingSpeed = 100,
	pauseDuration = 2000,
	showCursor = true,
	cursorCharacter = "|",
	className = "",
	fuzzyIntensity = 0.1,
}) => {
	const [currentTextIndex, setCurrentTextIndex] = useState(0);
	const [currentText, setCurrentText] = useState("");
	const [isTyping, setIsTyping] = useState(true);
	const [showCursorState, setShowCursorState] = useState(true);

	const currentTextRef = useRef("");
	const currentIndexRef = useRef(0);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const text = texts[currentTextIndex] || "";
		currentTextRef.current = text;
		currentIndexRef.current = 0;
		setCurrentText("");
		setIsTyping(true);

		const typeNextChar = () => {
			if (currentIndexRef.current < text.length) {
				setCurrentText(text.slice(0, currentIndexRef.current + 1));
				currentIndexRef.current++;
				timeoutRef.current = setTimeout(typeNextChar, typingSpeed);
			} else {
				setIsTyping(false);
				timeoutRef.current = setTimeout(() => {
					setShowCursorState(false);
					timeoutRef.current = setTimeout(() => {
						setCurrentTextIndex((prev) => (prev + 1) % texts.length);
					}, pauseDuration / 2);
				}, pauseDuration / 2);
			}
		};

		typeNextChar();

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [currentTextIndex, texts, typingSpeed, pauseDuration]);

	useEffect(() => {
		const cursorInterval = setInterval(() => {
			if (isTyping) {
				setShowCursorState((prev) => !prev);
			}
		}, 500);

		return () => clearInterval(cursorInterval);
	}, [isTyping]);

	return (
		<div className={className} style={{ fontFamily }}>
			<FuzzyText
				fontSize={fontSize}
				fontWeight={fontWeight}
				fontFamily={fontFamily}
				color={color}
				baseIntensity={fuzzyIntensity}
				hoverIntensity={fuzzyIntensity * 2}
				enableHover={false}
			>
				{currentText}
				{showCursor && showCursorState && cursorCharacter}
			</FuzzyText>
		</div>
	);
};

export default FuzzyTypeText;