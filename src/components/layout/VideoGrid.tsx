"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Play, Share2, User, X } from "lucide-react";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import Particles from "@/components/Particles";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  buttonVariants,
  cardVariants,
  playButtonVariants,
  transitions,
  videoCardVariants,
} from "@/lib/animations";

// 生成随机渐变色
const gradients = [
  "from-pink-500 to-rose-500",
  "from-purple-500 to-indigo-500",
  "from-blue-500 to-cyan-500",
  "from-teal-500 to-emerald-500",
  "from-orange-500 to-amber-500",
  "from-red-500 to-pink-500",
];

interface Video {
  id: string;
  title: string;
  author: string;
  author_id?: string;
  user_id?: string;
  user_username?: string;
  user_nickname?: string;
  user_avatar?: string;
  user_bio?: string;
  likes: number;
  comments: number;
  shares: number;
  duration: string;
  gradient?: string;
  video_url: string;
  description?: string;
  thumbnail?: string;
}

export default function VideoGrid() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 检测是否为移动端 - 使用 useMemo 避免每次渲染重新计算
  const isMobile = useMemo(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }, []);

  // 从后端 API 获取视频数据
  const fetchVideos = useCallback(async (pageNum: number, limit: number = 24) => {
    console.log('[VideoGrid] fetchVideos called:', { pageNum, limit });
    try {
      const response = await fetch(`/api/videos?page=${pageNum}&limit=${limit}`);
      const data = await response.json();
      console.log('[VideoGrid] fetchVideos response:', data);

      return data;
    } catch (error) {
      console.error("Failed to fetch videos:", error);
      return null;
    }
  }, []);

  // 初始加载 - 组件挂载时直接加载，不等待进入视口
  useEffect(() => {
    console.log('[VideoGrid] Initial load effect triggered, isMobile:', isMobile);
    
    const loadInitialVideos = async () => {
      console.log('[VideoGrid] Loading initial videos...');
      setIsLoading(true);
      // 移动端加载8个，桌面端加载24个
      const limit = isMobile ? 8 : 24;
      const data = await fetchVideos(1, limit);
      if (data) {
        console.log('[VideoGrid] Initial videos loaded:', data.videos.length);
        // 为每个视频分配随机渐变色
        const videosWithGradients = data.videos.map(
          (video: Video, index: number) => ({
            ...video,
            gradient: gradients[index % gradients.length],
          }),
        );
        setVideos(videosWithGradients);
        setHasMore(data.pagination.hasMore);
        setPage(1);
        // 初始显示前4个卡片（移动端）或前8个（桌面端）
        const initialVisible = isMobile ? 4 : 8;
        setVisibleCards(new Set(Array.from({ length: Math.min(initialVisible, videosWithGradients.length) }, (_, i) => i)));
        console.log('[VideoGrid] Initial visible cards set:', initialVisible);
      }
      setIsLoading(false);
    };

    loadInitialVideos();
  }, [isMobile, fetchVideos]);

  // 检测滚动到底部，自动加载更多
  useEffect(() => {
    console.log('[VideoGrid] LoadMore observer setup:', { hasMore, isLoading, isLoadingMore });
    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log('[VideoGrid] LoadMore intersection:', {
          isIntersecting: entry.isIntersecting,
          hasMore,
          isLoading,
          isLoadingMore
        });
        if (entry.isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          console.log('[VideoGrid] Triggering load more');
          setIsLoadingMore(true);
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      console.log('[VideoGrid] LoadMore observer cleanup');
      observer.disconnect();
    };
  }, [hasMore, isLoading, isLoadingMore]);

  // 检测视频卡片是否进入视口 - 保留此功能以优化性能
  useEffect(() => {
    console.log('[VideoGrid] Card visibility observer setup:', {
      videosCount: videos.length,
      visibleCardsCount: visibleCards.size
    });
    const cardObservers = new Map<number, IntersectionObserver>();

    videos.forEach((video, index) => {
      if (visibleCards.has(index)) return;

      const cardElement = document.getElementById(`video-card-${video.id}`);
      if (!cardElement) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          console.log('[VideoGrid] Card intersection:', {
            videoId: video.id,
            index,
            isIntersecting: entry.isIntersecting
          });
          if (entry.isIntersecting) {
            setVisibleCards(prev => new Set([...prev, index]));
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(cardElement);
      cardObservers.set(index, observer);
    });

    return () => {
      console.log('[VideoGrid] Card observers cleanup:', cardObservers.size);
      cardObservers.forEach(observer => observer.disconnect());
    };
  }, [videos, visibleCards]);

  // 加载更多视频
  const handleLoadMore = useCallback(async () => {
    console.log('[VideoGrid] handleLoadMore called:', { isLoading, hasMore, isLoadingMore, page });
    if (isLoading || !hasMore || isLoadingMore) return;

    setIsLoading(true);
    const nextPage = page + 1;
    // 移动端每次加载8个，桌面端加载24个
    const limit = isMobile ? 8 : 24;
    console.log('[VideoGrid] Loading more videos:', { nextPage, limit });
    const data = await fetchVideos(nextPage, limit);

    if (data) {
      console.log('[VideoGrid] More videos loaded:', data.videos.length);
      const videosWithGradients = data.videos.map(
        (video: Video, index: number) => ({
          ...video,
          gradient: gradients[(page * limit + index) % gradients.length],
        }),
      );
      setVideos((prev) => [...prev, ...videosWithGradients]);
      setHasMore(data.pagination.hasMore);
      setPage(nextPage);
    }

    setIsLoading(false);
    setIsLoadingMore(false);
  }, [isLoading, hasMore, page, fetchVideos, isMobile, isLoadingMore]);

  // 处理视频点击
  const handleVideoClick = useCallback((video: Video) => {
    console.log('[VideoGrid] Video clicked:', video.id);
    setSelectedVideo(video);
  }, []);

  if (isLoading && videos.length === 0) {
    return (
      <div className="relative p-4 scrollbar-thin w-full">
        <div className="flex items-center justify-center h-64">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={transitions.bouncy}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <div className="text-muted-foreground">加载中...</div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative p-4 scrollbar-thin w-full">
      {/* Particles Background - 移动端优化 */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={isMobile ? 30 : 200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={!isMobile}
          alphaParticles={false}
          disableRotation={false}
          className="w-full h-full"
        />
      </div>

      {/* Video Grid Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={transitions.gentle}
        className="relative z-10 columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6"
      >
        <AnimatePresence>
          {videos.map((video, index) => (
            <motion.div
              id={`video-card-${video.id}`}
              key={video.id}
              variants={videoCardVariants}
              initial={visibleCards.has(index) ? "hidden" : false}
              animate={visibleCards.has(index) ? "visible" : false}
              whileHover="hover"
              transition={{
                delay: visibleCards.has(index) ? index * 0.03 : 0,
                ...transitions.gentle,
              }}
              onClick={() => handleVideoClick(video)}
              className="mb-4 break-inside-avoid rounded-xl bg-card shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
            {/* Thumbnail */}
            <div
              className={`relative aspect-9/16 overflow-hidden rounded-t-xl ${
                video.thumbnail ? "" : `bg-linear-to-br ${video.gradient}`
              }`}
            >
              {video.thumbnail ? (
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : null}
              {/* Play Icon Overlay */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                transition={transitions.smooth}
              >
                <motion.div
                  variants={playButtonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm"
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(255, 255, 255, 0.4)",
                      "0 0 0 10px rgba(255, 255, 255, 0)",
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <motion.div
                    className="ml-1 h-0 w-0 border-t-8 border-t-transparent border-l-14 border-l-white border-b-8 border-b-transparent"
                    whileHover={{ scale: 1.2 }}
                    transition={transitions.smooth}
                  ></motion.div>
                </motion.div>
              </motion.div>
            </div>

            {/* Content */}
            <div className="p-3">
              {/* Title */}
              <h3 className="mb-2 line-clamp-2 text-sm font-medium leading-tight">
                {video.title}
              </h3>

              {/* Author */}
              <motion.div
                className="mb-3 flex items-center gap-2"
                whileHover={{ x: 4 }}
                transition={transitions.smooth}
              >
                {video.user_avatar ? (
                  <motion.img
                    src={video.user_avatar}
                    alt={video.user_nickname || video.user_username || video.author}
                    className="h-6 w-6 rounded-full object-cover"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={transitions.smooth}
                  />
                ) : (
                  <motion.div
                    className={`flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br ${video.gradient}`}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={transitions.smooth}
                  >
                    <User className="h-3 w-3 text-white" />
                  </motion.div>
                )}
                <span className="text-xs text-muted-foreground">
                  {video.user_nickname || video.user_username || video.author}
                </span>
              </motion.div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <motion.div
                  className="flex items-center gap-1 cursor-pointer"
                  whileHover={{ scale: 1.15, color: "var(--primary)" }}
                  whileTap={{ scale: 0.9 }}
                  transition={transitions.snappy}
                >
                  <motion.div
                    whileHover={{ rotate: -15 }}
                    transition={transitions.smooth}
                  >
                    <Heart className="h-3 w-3" />
                  </motion.div>
                  <span>{formatNumber(video.likes)}</span>
                </motion.div>
                <motion.div
                  className="flex items-center gap-1 cursor-pointer"
                  whileHover={{ scale: 1.15, color: "var(--primary)" }}
                  whileTap={{ scale: 0.9 }}
                  transition={transitions.snappy}
                >
                  <motion.div
                    whileHover={{ rotate: 15 }}
                    transition={transitions.smooth}
                  >
                    <MessageCircle className="h-3 w-3" />
                  </motion.div>
                  <span>{formatNumber(video.comments)}</span>
                </motion.div>
                <motion.div
                  className="flex items-center gap-1 cursor-pointer"
                  whileHover={{ scale: 1.15, color: "var(--primary)" }}
                  whileTap={{ scale: 0.9 }}
                  transition={transitions.snappy}
                >
                  <motion.div
                    whileHover={{ rotate: -15 }}
                    transition={transitions.smooth}
                  >
                    <Share2 className="h-3 w-3" />
                  </motion.div>
                  <span>{formatNumber(video.shares)}</span>
                </motion.div>
              </div>
            </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Load More Button / Scroll Trigger */}
      <AnimatePresence>
        {hasMore && videos.length > 0 && (
          <motion.div
            ref={loadMoreRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={transitions.gentle}
            className="relative z-10 mt-6 flex justify-center"
          >
            {isLoading ? (
              <motion.div
                className="flex items-center gap-2"
                animate={{ gap: 3 }}
                transition={transitions.smooth}
              >
                <motion.div
                  className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <span className="text-sm text-muted-foreground">加载中...</span>
              </motion.div>
            ) : (
              <motion.button
                type="button"
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                onClick={handleLoadMore}
                className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <span>加载更多</span>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {videos.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={transitions.gentle}
            className="relative z-10 flex items-center justify-center h-64"
          >
            <motion.div
              className="flex flex-col items-center gap-4"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="text-muted-foreground">暂无视频</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Player Dialog */}
      <Dialog
        open={!!selectedVideo}
        onOpenChange={(open) => !open && setSelectedVideo(null)}
      >
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black" showCloseButton={false}>
          <DialogTitle className="sr-only">视频播放器</DialogTitle>
          <AnimatePresence>
            {selectedVideo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={transitions.gentle}
                className="relative w-full aspect-9/16 bg-black"
              >
                {/* Close Button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedVideo(null)}
                  transition={transitions.smooth}
                  className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="h-5 w-5" />
                </motion.button>

              {/* Video Player */}
              <video
                src={selectedVideo.video_url}
                className="w-full h-full object-contain"
                autoPlay
                controls
                playsInline
                onClick={(e) => e.stopPropagation()}
              >
                <track kind="captions" />
              </video>

              {/* Video Info Overlay - 只显示标题和作者，不遮盖控制条 */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, ...transitions.gentle }}
                className="absolute top-0 left-0 right-0 bg-linear-to-b from-black/90 via-black/50 to-transparent p-6"
              >
                <motion.h3
                  className="mb-2 text-lg font-medium text-white"
                  whileHover={{ scale: 1.02 }}
                  transition={transitions.smooth}
                >
                  {selectedVideo.title}
                </motion.h3>
                <motion.div
                  className="flex items-center gap-2 mb-3"
                  whileHover={{ x: 4 }}
                  transition={transitions.smooth}
                >
                  {selectedVideo.user_avatar ? (
                    <motion.img
                      src={selectedVideo.user_avatar}
                      alt={selectedVideo.user_nickname || selectedVideo.user_username || selectedVideo.author}
                      className="h-8 w-8 rounded-full object-cover"
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={transitions.smooth}
                    />
                  ) : (
                    <motion.div
                      className={`flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br ${selectedVideo.gradient}`}
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={transitions.smooth}
                    >
                      <User className="h-4 w-4 text-white" />
                    </motion.div>
                  )}
                  <span className="text-sm text-white/90">
                    {selectedVideo.user_nickname || selectedVideo.user_username || selectedVideo.author}
                  </span>
                </motion.div>
                {selectedVideo.description && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, ...transitions.standard }}
                    className="text-sm text-white/80 line-clamp-2"
                  >
                    {selectedVideo.description}
                  </motion.p>
                )}
              </motion.div>
            </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return num.toString();
}
