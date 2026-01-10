"use client";

import Link from "next/link";
import { GridScan } from "@/components/theme/GridScan";
import FuzzyText from "@/components/ui/FuzzyText";
import FuzzyTypeText from "@/components/ui/FuzzyTypeText";
import "./not-found.css";

export default function NotFound() {
	return (
		<div className="not-found-page relative flex min-h-screen flex-col items-center justify-center text-white overflow-hidden">
			{/* 网格扫描背景层 */}
			<div className="absolute inset-0">
				<GridScan
					sensitivity={0.55}
					lineThickness={1}
					linesColor="#392e4e"
					gridScale={0.1}
					scanColor="#FF9FFC"
					scanOpacity={0.4}
					enablePost
					bloomIntensity={0.6}
					chromaticAberration={0.002}
					noiseIntensity={0.01}
				/>
			</div>

			{/* 内容层 - 在最上层 */}
			<div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh]">
				<div className="glitch-wrapper mb-12">
					<FuzzyText
						fontSize="clamp(4rem, 15vw, 12rem)"
						fontWeight={900}
						color="#ffffff"
						baseIntensity={0.2}
						hoverIntensity={0.5}
					>
						404
					</FuzzyText>
				</div>

				<div className="z-10 w-full max-w-5xl flex flex-col items-center justify-center mb-12 min-h-16">
					<FuzzyTypeText
						texts={[
							"抱歉,此页面不存在",
							"Sorry, this page is not available",
							"PAGE NOT FOUND",
						]}
						fontSize="clamp(1.5rem, 6vw, 3rem)"
						fontWeight={700}
						color="#ffffff"
						typingSpeed={75}
						pauseDuration={1500}
						showCursor
						cursorCharacter="|"
						className="text-center"
						fuzzyIntensity={0.08}
					/>
				</div>

				<Link
					href="/"
					className="px-8 py-4 rounded-lg text-white font-semibold transition-all duration-300 border border-white/20 hover:border-white/40 bg-transparent hover:bg-white/10 hover:shadow-lg hover:shadow-white/20"
				>
					返回主页
				</Link>
			</div>
		</div>
	);
}
