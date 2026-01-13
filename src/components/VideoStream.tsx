"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";
import { Play, Heart, MessageCircle, Share2, Loader2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface Video {
  id: string;
  title: string;
  author: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  duration: string;
  thumbnail: string;
  video_url: string;
}

interface VideoStreamProps {
  videos: Video[];
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
}

export default function VideoStream({ videos, onLoadMore, hasMore }: VideoStreamProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [playing, setPlaying] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  // 处理滚动切换视频
  const handleScroll = useCallback((e: React.WheelEvent) => {
    if (isLoading) return;

    const delta = e.deltaY;
    if (Math.abs(delta) > 50) {
      if (delta > 0 && currentIndex < videos.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (delta < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }
  }, [currentIndex, videos.length, isLoading]);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (currentIndex < videos.length - 1) {
            setCurrentIndex(prev => prev + 1);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
          }
          break;
        case " ": {
          e.preventDefault();
          const currentVideo = videos[currentIndex];
          if (currentVideo) {
            setPlaying(prev => ({
              ...prev,
              [currentVideo.id]: !prev[currentVideo.id]
            }));
          }
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, videos, isLoading]);

  // 自动加载更多
  useEffect(() => {
    if (hasMore && currentIndex >= videos.length - 2 && !isLoading) {
      setIsLoading(true);
      onLoadMore().finally(() => setIsLoading(false));
    }
  }, [currentIndex, videos.length, hasMore, isLoading, onLoadMore]);

  const togglePlay = (videoId: string) => {
    setPlaying(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
  };

  const handleAction = (action: string, video: Video) => {
    // 这里可以添加实际的点赞、评论、分享逻辑
  };

  return (
    <div 
      ref={containerRef}
      className="relative h-full overflow-hidden bg-background"
      onWheel={handleScroll}
    >
      {/* 背景网格效果 */}
      <div className={`absolute inset-0 opacity-10 ${isDark ? 'bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)]' : 'bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.1)_1px,transparent_1px)]'}`} 
           style={{ backgroundSize: '20px 20px' }} />

      {/* 视频列表 */}
      <AnimatePresence mode="popLayout">
        {videos.slice(Math.max(0, currentIndex - 1), currentIndex + 2).map((video, idx) => {
          const relativeIndex = currentIndex - (Math.max(0, currentIndex - 1));
          const isCurrent = idx === relativeIndex;
          const isNext = idx === relativeIndex + 1;
          const isPrev = idx === relativeIndex - 1;

          return (
            <motion.div
              key={video.id}
              className={`absolute inset-0 flex items-center justify-center ${
                isCurrent ? 'z-20' : isNext || isPrev ? 'z-10' : 'z-0'
              }`}
              initial={{ 
                opacity: 0, 
                y: isNext ? 100 : isPrev ? -100 : 0,
                scale: isCurrent ? 0.95 : 0.85
              }}
              animate={{ 
                opacity: isCurrent ? 1 : 0.3,
                y: isCurrent ? 0 : isNext ? 50 : -50,
                scale: isCurrent ? 1 : 0.9,
                rotateX: isCurrent ? 0 : isNext ? -15 : 15
              }}
              exit={{ 
                opacity: 0,
                y: isPrev ? -100 : 100,
                scale: 0.8
              }}
              transition={{ 
                duration: 0.6,
                ease: "easeInOut",
                type: "spring",
                stiffness: 100,
                damping: 20
              }}
              style={{ 
                perspective: "1000px",
                transformStyle: "preserve-3d"
              }}
            >
              <div className="relative w-full max-w-md aspect-[9/16] mx-auto rounded-2xl overflow-hidden shadow-2xl border border-border/20 bg-card">
                {/* 封面图 */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 z-10" />
                
                {/* 视频缩略图 */}
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${video.thumbnail})` }}
                />

                {/* 播放按钮 */}
                <motion.button
                  onClick={() => togglePlay(video.id)}
                  className="absolute inset-0 z-20 flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center"
                    animate={playing[video.id] ? { scale: [1, 1.1, 1], opacity: [1, 0.8, 1] } : {}}
                    transition={{ duration: 1, repeat: playing[video.id] ? Infinity : 0 }}
                  >
                    {playing[video.id] ? (
                      <div className="flex gap-1">
                        <div className="w-1.5 h-6 bg-white rounded-sm animate-pulse" />
                        <div className="w-1.5 h-8 bg-white rounded-sm animate-pulse" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1.5 h-6 bg-white rounded-sm animate-pulse" style={{ animationDelay: '0.2s' }} />
                      </div>
                    ) : (
                      <Play className="w-8 h-8 fill-white text-white ml-1" />
                    )}
                  </motion.div>
                </motion.button>

                {/* 视频信息 */}
                <div className="absolute bottom-0 left-0 right-0 z-30 p-4 text-white">
                  <motion.h3 
                    className="text-lg font-bold mb-1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {video.title}
                  </motion.h3>
                  <motion.p 
                    className="text-sm text-gray-300 mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    @{video.author} · {video.duration}
                  </motion.p>
                  <motion.p 
                    className="text-xs text-gray-400 line-clamp-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {video.description}
                  </motion.p>

                  {/* 互动按钮 */}
                  <motion.div 
                    className="flex gap-4 mt-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <button
                      type="button"
                      onClick={() => handleAction("like", video)}
                      className="flex items-center gap-1 text-sm hover:text-pink-400 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      <span>{video.likes}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction("comment", video)}
                      className="flex items-center gap-1 text-sm hover:text-blue-400 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{video.comments}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction("share", video)}
                      className="flex items-center gap-1 text-sm hover:text-green-400 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{video.shares}</span>
                    </button>
                  </motion.div>
                </div>

                {/* 播放状态指示器 */}
                {playing[video.id] && (
                  <motion.div 
                    className="absolute top-4 right-4 z-30"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                  >
                    <div className="px-2 py-1 bg-black/50 backdrop-blur-md rounded-full text-xs text-white">
                      播放中
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* 加载更多指示器 */}
      {isLoading && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="px-4 py-2 bg-background/80 backdrop-blur-md border border-border rounded-full flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>加载更多视频...</span>
          </div>
        </motion.div>
      )}

      {/* 滚动提示 */}
      {videos.length > 0 && currentIndex === 0 && (
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="text-xs text-muted-foreground">滚动切换视频</div>
        </motion.div>
      )}

      {/* 空状态 */}
      {videos.length === 0 && !isLoading && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center z-30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-6xl mb-4">📹</div>
          <p className="text-lg font-medium text-foreground">暂无视频</p>
          <p className="text-sm text-muted-foreground mt-2">请稍后重试</p>
        </motion.div>
      )}
    </div>
  );
}