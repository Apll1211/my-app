"use client";

import { Eye, Heart, Play, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useRef, useMemo } from "react";
import CardSwap, { Card } from "./CardSwap";
import Particles from "./Particles";

interface Video {
  id: string;
  title: string;
  author: string;
  user_nickname?: string;
  thumbnail: string;
  likes: number;
  views: number;
  duration: string;
  video_url: string;
  description?: string;
}

export default function FeaturedVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // 检测是否为移动端 - 使用 useMemo 避免每次渲染重新计算
  const isMobile = useMemo(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }, []);

  // 组件挂载后设置 isMounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    console.log('[FeaturedVideos] Component mounted, isMobile:', isMobile);
    const fetchFeaturedVideos = async () => {
      console.log('[FeaturedVideos] Fetching featured videos...');
      try {
        // 移动端加载3个，桌面端加载5个
        const limit = isMobile ? 3 : 5;
        const response = await fetch(`/api/videos?page=1&limit=${limit}`);
        const data = await response.json();
        console.log('[FeaturedVideos] Videos fetched:', data.videos?.length);

        if (data.videos && data.videos.length > 0) {
          setVideos(data.videos);
        }
      } catch (error) {
        console.error("Failed to fetch featured videos:", error);
      } finally {
        setLoading(false);
        console.log('[FeaturedVideos] Loading complete');
      }
    };

    fetchFeaturedVideos();
  }, [isMobile]);

  const handleCardClick = (index: number) => {
    console.log('[FeaturedVideos] Card clicked:', index);
    const video = videos[index];
    if (video) {
      setSelectedVideo(video);
    }
  };

  const handleClosePlayer = () => {
    console.log('[FeaturedVideos] Player closed');
    setSelectedVideo(null);
  };

  if (loading) {
    return (
      <div className="relative h-100 md:h-125 w-full bg-muted/20 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">加载热门推荐中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="relative h-100 md:h-125 w-full bg-muted/20 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">暂无热门推荐视频</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-112.5 md:h-150 bg-linear-to-br from-primary/5 via-background to-primary/5 rounded-2xl overflow-hidden border border-border">
      {/* 3D 粒子背景 - 移动端优化 */}
      <div className="absolute inset-0 z-0">
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={isMobile ? 20 : 200}
          particleSpread={10}
          speed={isMobile ? 0.05 : 0.1}
          particleBaseSize={100}
          moveParticlesOnHover={!isMobile}
          alphaParticles={false}
          disableRotation={isMobile}
        />
      </div>

      {/* 标题 */}
      <div className="absolute top-6 left-6 z-10">
        <h2 className="text-2xl font-bold text-foreground mb-1">🔥 热门推荐</h2>
        <p className="text-sm text-muted-foreground">精选优质内容，不容错过</p>
      </div>

      {/* 3D 卡片堆叠 */}
      {videos.length > 0 && isMounted && (
        <div className="relative h-full w-full">
          <CardSwap
            width={600}
            height={420}
            cardDistance={70}
            verticalDistance={80}
            delay={isMobile ? 6000 : 4000}
            pauseOnHover={false}
            onCardClick={handleCardClick}
            skewAmount={isMobile ? 2 : 5}
            easing={isMobile ? "linear" : "elastic"}
          >
            {videos.map((video, index) => (
              <Card
                key={video.id}
                className="overflow-hidden cursor-pointer group"
                onClick={() => handleCardClick(index)}
              >
                {/* 视频缩略图 */}
                <div className="relative w-full h-full">
                  <Image
                    src={video.thumbnail || "/placeholder.jpg"}
                    alt={video.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                    priority={index === 0}
                    loading={index === 0 ? "eager" : "lazy"}
                  />

                  {/* 渐变遮罩 */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent"></div>

                  {/* 播放按钮 */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                  </div>

                  {/* 视频信息 */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                      {video.title}
                    </h3>

                    <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                      <span className="font-medium">{video.user_nickname || video.author}</span>
                    </div>

                    {/* 统计信息 */}
                    <div className="flex items-center gap-4 text-white/70 text-xs">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{video.views || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        <span>{video.likes || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
                          {video.duration || "00:00"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </CardSwap>
        </div>
      )}

      {/* 视频播放弹窗 */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-5xl bg-card rounded-lg overflow-hidden shadow-2xl">
            {/* 关闭按钮 */}
            <button
              type="button"
              onClick={handleClosePlayer}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* 视频播放器 */}
            <div className="relative w-full aspect-video bg-black">
              <video
                src={selectedVideo.video_url}
                controls
                autoPlay
                className="w-full h-full"
              >
                <track kind="captions" />
              </video>
            </div>

            {/* 视频信息 */}
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2">{selectedVideo.title}</h3>
              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <span className="font-medium">{selectedVideo.user_nickname || selectedVideo.author}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{selectedVideo.views || 0}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{selectedVideo.likes || 0}</span>
                </div>
              </div>
              {selectedVideo.description && (
                <p className="text-muted-foreground">
                  {selectedVideo.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
