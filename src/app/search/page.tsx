"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Play,
  Share2,
  User,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Particles from "@/components/Particles";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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
  likes: number;
  comments: number;
  shares: number;
  duration: string;
  gradient?: string;
  video_url?: string;
  description?: string;
  thumbnail?: string;
  views?: number;
  tags?: string;
  status?: string;
}

interface ApiResponse {
  videos: Video[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// 数据验证函数
function validateVideoData(data: unknown): data is Video {
  if (!data || typeof data !== "object") return false;

  const video = data as Partial<Video>;
  return (
    typeof video.id === "string" &&
    typeof video.title === "string" &&
    typeof video.author === "string" &&
    typeof video.likes === "number" &&
    typeof video.comments === "number" &&
    typeof video.shares === "number" &&
    typeof video.duration === "string"
  );
}

function validateApiResponse(data: unknown): data is ApiResponse {
  if (!data || typeof data !== "object") return false;

  const response = data as Partial<ApiResponse>;
  const pagination = response.pagination as any;

  return (
    Array.isArray(response.videos) &&
    pagination &&
    typeof pagination === "object" &&
    typeof pagination.page === "number" &&
    typeof pagination.limit === "number" &&
    typeof pagination.total === "number" &&
    typeof pagination.hasMore === "boolean"
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  // 搜索视频
  const searchVideos = useCallback(
    async (
      searchQuery: string,
      pageNum: number = 1,
    ): Promise<ApiResponse | null> => {
      try {
        // 验证查询参数
        if (
          !searchQuery ||
          typeof searchQuery !== "string" ||
          searchQuery.trim().length === 0
        ) {
          return null;
        }

        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery.trim())}&page=${pageNum}&limit=24`,
        );

        if (!response.ok) {
          return null;
        }

        const data = await response.json();

        // 验证响应数据
        if (!validateApiResponse(data)) {
          return null;
        }

        // 验证每个视频数据
        const validVideos = data.videos.filter(validateVideoData);

        return {
          ...data,
          videos: validVideos,
        };
      } catch (error) {
        return null;
      }
    },
    [],
  );

  // 初始加载搜索结果
  useEffect(() => {
    const loadSearchResults = async () => {
      if (!query.trim()) {
        setVideos([]);
        setIsLoading(false);
        setHasMore(false);
        return;
      }

      setIsLoading(true);
      setPage(1);

      const data = await searchVideos(query, 1);
      if (data) {
        const videosWithGradients = data.videos.map(
          (video: Video, index: number) => ({
            ...video,
            gradient: gradients[index % gradients.length],
          }),
        );
        setVideos(videosWithGradients);
        setHasMore(data.pagination.hasMore);
      } else {
        setVideos([]);
        setHasMore(false);
      }

      setIsLoading(false);
    };

    loadSearchResults();
  }, [query, searchVideos]);

  // 加载更多搜索结果
  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const nextPage = page + 1;
    const data = await searchVideos(query, nextPage);

    if (data) {
      const videosWithGradients = data.videos.map(
        (video: Video, index: number) => ({
          ...video,
          gradient: gradients[(page * 24 + index) % gradients.length],
        }),
      );
      setVideos((prev) => [...prev, ...videosWithGradients]);
      setHasMore(data.pagination.hasMore);
      setPage(nextPage);
    }

    setIsLoading(false);
  }, [isLoading, hasMore, page, searchVideos, query]);

  // 处理视频点击
  const handleVideoClick = useCallback((video: Video) => {
    setSelectedVideo(video);
  }, []);

  if (isLoading && videos.length === 0) {
    return (
      <div className="relative pt-20 px-4 scrollbar-thin">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">搜索中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pt-20 px-4 scrollbar-thin">
      {/* Particles Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
          className="w-full h-full"
        />
      </div>

      {/* Search Query Display */}
      <div className="relative z-10 mb-6">
        <div className="flex items-center gap-4 mb-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/")}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回</span>
          </motion.button>
        </div>
        <h1 className="text-2xl font-bold">
          搜索结果: <span className="text-primary">"{query}"</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          找到 {videos.length} 个相关视频
        </p>
      </div>

      {/* Video Grid Content */}
      <div className="relative z-10 columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6">
        {videos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ y: -4, scale: 1.02 }}
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
              >
                <motion.div
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm"
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(255, 255, 255, 0.4)",
                      "0 0 0 10px rgba(255, 255, 255, 0)",
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <div className="ml-1 h-0 w-0 border-t-8 border-t-transparent border-l-14 border-l-white border-b-8 border-b-transparent"></div>
                </motion.div>
              </motion.div>
              {/* Duration Badge */}
              <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                {video.duration}
              </div>
            </div>

            {/* Content */}
            <div className="p-3">
              {/* Title */}
              <h3 className="mb-2 line-clamp-2 text-sm font-medium leading-tight">
                {video.title}
              </h3>

              {/* Author */}
              <div className="mb-3 flex items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br ${video.gradient}`}
                >
                  <User className="h-3 w-3 text-white" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {video.author}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <motion.div
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Heart className="h-3 w-3" />
                  <span>{formatNumber(video.likes)}</span>
                </motion.div>
                <motion.div
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <MessageCircle className="h-3 w-3" />
                  <span>{formatNumber(video.comments)}</span>
                </motion.div>
                <motion.div
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Share2 className="h-3 w-3" />
                  <span>{formatNumber(video.shares)}</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && videos.length > 0 && (
        <div className="relative z-10 mt-6 flex justify-center">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLoadMore}
            disabled={isLoading}
            className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? "加载中..." : "加载更多"}
          </motion.button>
        </div>
      )}

      {videos.length === 0 && !isLoading && (
        <div className="relative z-10 flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-muted-foreground">
            未找到与"{query}"相关的视频
          </div>
        </div>
      )}

      {/* Video Player Dialog */}
      <Dialog
        open={!!selectedVideo}
        onOpenChange={(open) => !open && setSelectedVideo(null)}
      >
        <DialogContent
          className="max-w-4xl w-full p-0 overflow-hidden bg-black"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">视频播放器</DialogTitle>
          {selectedVideo && (
            <div className="relative w-full aspect-9/16 bg-black">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

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

              {/* Video Info Overlay */}
              <div className="absolute top-0 left-0 right-0 bg-linear-to-b from-black/90 via-black/50 to-transparent p-6">
                <h3 className="mb-2 text-lg font-medium text-white">
                  {selectedVideo.title}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br ${selectedVideo.gradient}`}
                  >
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm text-white/90">
                    {selectedVideo.author}
                  </span>
                </div>
                {selectedVideo.description && (
                  <p className="text-sm text-white/80 line-clamp-2">
                    {selectedVideo.description}
                  </p>
                )}
              </div>
            </div>
          )}
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

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Particles Background */}
      <div className="fixed inset-0 z-0">
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
          className="w-full h-full"
        />
      </div>

      <div className="flex flex-col">
        <Header />
        <Suspense fallback={<div className="pt-20 px-4"><div className="flex items-center justify-center h-64"><div className="text-muted-foreground">加载中...</div></div></div>}>
          <SearchContent />
        </Suspense>
      </div>
    </div>
  );
}
