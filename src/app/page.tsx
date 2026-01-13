import Header from "@/components/layout/Header";
import CategoryNav from "@/components/layout/CategoryNav";
import PrismBackground from "@/components/PrismBackground";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden relative">
      {/* 3D Prism Background */}
      <div className="fixed inset-0 z-0">
        <PrismBackground
          animationType="rotate"
          timeScale={0.5}
          height={3.5}
          baseWidth={5.5}
          scale={3.6}
          hueShift={0.3}
          colorFrequency={1.5}
          noise={0.3}
          glow={1.5}
          whiteGlow={2.0}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen bg-background/60 backdrop-blur-md">
        <Header />
        {/* 只在桌面端显示二级导航 */}
        <div className="hidden md:block">
          <CategoryNav />
        </div>
        <div className="flex-1 pt-28 md:pt-20">
          {/* 博客内容区域 */}
          <div className="px-4">
            <div className="text-center py-12">
              <h1 className="text-3xl font-bold mb-4 text-foreground drop-shadow-lg">欢迎来到我的主页</h1>
              <p className="text-foreground/80 drop-shadow-md">正在施工中...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
