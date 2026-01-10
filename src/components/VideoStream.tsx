"use client";

import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Play,
  Share2,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mousewheel } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/virtual";
import "swiper/css/mousewheel";
import { useAuth } from "@/context/AuthContext";

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
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export default function VideoStream({
  videos,
  onLoadMore,
  hasMore = true,
}: VideoStreamProps) {
  const { user } = useAuth();
  const swiperRef = useRef<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(
    new Set(videos.map((v) => v.id)),
  );
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [visibleVideos, setVisibleVideos] = useState<Set<number>>(
    new Set([0, 1]),
  );
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const isUpdatingRef = useRef(false);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [videoLikes, setVideoLikes] = useState<Map<string, number>>(new Map());

  // 切换播放/暂停
  const togglePlay = useCallback((videoId: string) => {
    const videoEl = videoRefs.current.get(videoId);
    if (videoEl) {
      const isPlaying = !videoEl.paused;
      if (isPlaying) {
        videoEl.pause();
      } else {
        videoEl.play().catch((err) => {
          console.error("播放失败:", err);
        });
      }
    }
  }, []);

  // 切换静音状态
  const toggleMute = useCallback((videoId: string) => {
    setMutedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  }, []);

  // 初始化点赞状态
  useEffect(() => {
    const initializeLikes = async () => {
      if (!user) return;

      const newLikedVideos = new Set<string>();
      const newVideoLikes = new Map<string, number>();

      for (const video of videos) {
        try {
          const response = await fetch(
            `/api/videos/likes?videoId=${video.id}&userId=${user.id}`,
          );
          const data = await response.json();

          if (data.success) {
            if (data.liked) {
              newLikedVideos.add(video.id);
            }
            newVideoLikes.set(video.id, data.likes);
          }
        } catch (error) {
          console.error("Failed to fetch like status:", error);
          // 使用视频的初始点赞数
          newVideoLikes.set(video.id, video.likes);
        }
      }

      setLikedVideos(newLikedVideos);
      setVideoLikes(newVideoLikes);
    };

    initializeLikes();
  }, [videos, user]);

  // 当视频加载时，更新 visibleVideos
  useEffect(() => {
    if (videos.length > 0) {
      setVisibleVideos(new Set([0, 1]));
    }
  }, [videos]);

  // 处理点赞
  const handleLike = useCallback(
    async (videoId: string) => {
      if (!user) {
        alert("请先登录");
        return;
      }

      const isLiked = likedVideos.has(videoId);

      try {
        if (isLiked) {
          // 取消点赞
          const response = await fetch(
            `/api/videos/likes?videoId=${videoId}&userId=${user.id}`,
            { method: "DELETE" },
          );
          const data = await response.json();

          if (data.success) {
            setLikedVideos((prev) => {
              const newSet = new Set(prev);
              newSet.delete(videoId);
              return newSet;
            });
            setVideoLikes((prev) => new Map(prev).set(videoId, data.likes));
          }
        } else {
          // 点赞
          const response = await fetch("/api/videos/likes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoId,
              userId: user.id,
              userNickname: user.nickname || user.username,
            }),
          });
          const data = await response.json();

          if (data.success) {
            setLikedVideos((prev) => new Set(prev).add(videoId));
            setVideoLikes((prev) => new Map(prev).set(videoId, data.likes));
          }
        }
      } catch (error) {
        console.error("Failed to toggle like:", error);
        alert("操作失败，请稍后重试");
      }
    },
    [likedVideos, user],
  );

  // 处理滑动变化
  const handleSlideChange = useCallback(
    (swiper: any) => {
      const currentIndex = swiper.activeIndex;
      const prevIndex = swiper.previousIndex;

      setActiveIndex(currentIndex);

      // 更新可见视频集合（只保留当前和相邻的视频）
      setVisibleVideos(
        new Set(
          [currentIndex, currentIndex + 1, currentIndex - 1].filter(
            (i) => i >= 0 && i < videos.length,
          ),
        ),
      );

      // 暂停之前的视频
      if (prevIndex !== undefined && videos[prevIndex]) {
        const prevVideo = videoRefs.current.get(videos[prevIndex].id);
        if (prevVideo) {
          prevVideo.pause();
          prevVideo.currentTime = 0; // 重置播放进度
        }
        setPlayingVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(videos[prevIndex].id);
          return newSet;
        });
      }

      // 只有在用户交互后才自动播放当前视频
      if (hasUserInteracted && videos[currentIndex]) {
        const currentVideo = videoRefs.current.get(videos[currentIndex].id);
        if (currentVideo) {
          currentVideo.play().catch((err) => {
            // 静默处理播放失败
          });
        }
        setPlayingVideos((prev) => new Set(prev).add(videos[currentIndex].id));
      }

      // 加载更多
      if (onLoadMore && hasMore && currentIndex >= videos.length - 3) {
        onLoadMore();
      }
    },
    [videos, onLoadMore, hasMore, hasUserInteracted],
  );

  // 处理用户首次交互
  useEffect(() => {
    const handleFirstInteraction = () => {
      setHasUserInteracted(true);
    };

    document.addEventListener("click", handleFirstInteraction, { once: true });
    document.addEventListener("keydown", handleFirstInteraction, {
      once: true,
    });
    document.addEventListener("touchstart", handleFirstInteraction, {
      once: true,
    });

    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, []);

  // 同步播放状态到视频元素
  useEffect(() => {
    if (isUpdatingRef.current) return;

    playingVideos.forEach((videoId) => {
      const videoEl = videoRefs.current.get(videoId);
      if (videoEl && videoEl.paused) {
        isUpdatingRef.current = true;
        videoEl.play().catch(() => {});
        isUpdatingRef.current = false;
      }
    });

    videos.forEach((video) => {
      if (!playingVideos.has(video.id)) {
        const videoEl = videoRefs.current.get(video.id);
        if (videoEl && !videoEl.paused) {
          isUpdatingRef.current = true;
          videoEl.pause();
          isUpdatingRef.current = false;
        }
      }
    });
  }, [playingVideos, videos]);

  // 处理键盘事件（空格键暂停/播放）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        const currentIndex = swiperRef.current?.swiper?.activeIndex;
        if (currentIndex !== undefined && videos[currentIndex]) {
          togglePlay(videos[currentIndex].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [videos, togglePlay]);

  // Swiper 初始化后的回调
  const handleSwiperInit = useCallback((swiper: any) => {
    if (swiperRef.current) {
      swiperRef.current.swiper = swiper;
    }
  }, []);

  if (videos.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ y: [0, -10] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            className="mb-4"
          >
            <Play className="mx-auto h-16 w-16 text-muted-foreground" />
          </motion.div>
          <p className="text-lg font-medium text-muted-foreground">暂无视频</p>
          <p className="text-sm text-muted-foreground">正在加载视频...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Swiper
        onSwiper={handleSwiperInit}
        direction="vertical"
        spaceBetween={0}
        slidesPerView={1}
        onSlideChange={handleSlideChange}
        modules={[Mousewheel]}
        mousewheel={{
          enabled: true,
          sensitivity: 1,
          forceToAxis: true,
        }}
        className="h-full w-full"
        style={{ height: "100%" }}
      >
        {videos.map((video, index) => (
          <SwiperSlide
            key={video.id}
            virtualIndex={index}
            style={{ height: "100%" }}
          >
            <div className="relative h-full w-full bg-black">
              {/* Video Element - 只渲染可见的视频 */}
              {visibleVideos.has(index) && (
                <video
                  key={video.id}
                  src={video.video_url}
                  className="h-full w-full object-cover"
                  autoPlay={false}
                  loop
                  muted={mutedVideos.has(video.id)}
                  playsInline
                  controls={false}
                  onClick={() => togglePlay(video.id)}
                  ref={(el) => {
                    if (el) {
                      // 只保存视频引用,不在这里控制播放
                      videoRefs.current.set(video.id, el);
                    }
                  }}
                  onError={(e) => {
                    console.error("视频加载失败:", e);
                  }}
                  onEnded={() => {
                    // 视频播放结束时自动循环
                    const videoEl = videoRefs.current.get(video.id);
                    if (videoEl && playingVideos.has(video.id)) {
                      videoEl.currentTime = 0;
                      videoEl.play().catch(() => {});
                    }
                  }}
                  onPlay={() => {
                    if (!isUpdatingRef.current) {
                      setPlayingVideos((prev) => new Set(prev).add(video.id));
                    }
                  }}
                  onPause={() => {
                    if (!isUpdatingRef.current) {
                      setPlayingVideos((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(video.id);
                        return newSet;
                      });
                    }
                  }}
                >
                  <track kind="captions" />
                </video>
              )}

              {/* Sound Control Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleMute(video.id)}
                className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                {mutedVideos.has(video.id) ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </motion.button>

              {/* Play/Pause Overlay */}
              {!playingVideos.has(video.id) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => togglePlay(video.id)}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
                  >
                    <Play className="h-10 w-10 fill-white text-white ml-1" />
                  </motion.div>
                </motion.div>
              )}

              {/* Video Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                {/* Title */}
                <h3 className="mb-3 text-lg font-medium text-white">
                  {video.title}
                </h3>

                {/* Author */}
                <div className="mb-4 flex items-center gap-2">
                  {video.user_avatar ? (
                    <img
                      src={video.user_avatar}
                      alt={
                        video.user_nickname ||
                        video.user_username ||
                        video.author
                      }
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-pink-500">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <span className="text-sm text-white/90">
                    {video.user_nickname || video.user_username || video.author}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleLike(video.id)}
                    className="flex flex-col items-center gap-1 text-white"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
                        likedVideos.has(video.id)
                          ? "bg-red-500/80"
                          : "bg-white/20"
                      }`}
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          likedVideos.has(video.id) ? "fill-white" : ""
                        }`}
                      />
                    </div>
                    <span className="text-xs">
                      {formatNumber(videoLikes.get(video.id) || video.likes)}
                    </span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center gap-1 text-white"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <span className="text-xs">
                      {formatNumber(video.comments)}
                    </span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center gap-1 text-white"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                      <Share2 className="h-5 w-5" />
                    </div>
                    <span className="text-xs">
                      {formatNumber(video.shares)}
                    </span>
                  </motion.button>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return num.toString();
}
