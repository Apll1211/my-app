"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Particles from "@/components/Particles";
import VideoStream from "@/components/VideoStream";

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

export default function RecommendPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);

  // 从后端 API 获取视频数据
  const fetchVideos = useCallback(async (pageNum: number) => {
    try {
      const response = await fetch(`/api/videos?page=${pageNum}&limit=10`);
      const data = await response.json();

      return data;
    } catch (error) {
      return null;
    }
  }, []);

  // 初始加载
  useEffect(() => {
    const loadInitialVideos = async () => {
      setIsLoading(true);
      const data = await fetchVideos(1);
      if (data) {
        setVideos(data.videos);
        setHasMore(data.pagination.hasMore);
        setPage(1);
      }
      setIsLoading(false);
    };

    loadInitialVideos();
  }, [fetchVideos]);

  // 加载更多视频
  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const nextPage = page + 1;
    const data = await fetchVideos(nextPage);

    if (data) {
      setVideos((prev) => [...prev, ...data.videos]);
      setHasMore(data.pagination.hasMore);
      setPage(nextPage);
    }

    setIsLoading(false);
  }, [isLoading, hasMore, page, fetchVideos]);

  // 清理视频列表
  useEffect(() => {
    return () => {
      setVideos([]);
    };
  }, []);

  return (
    <div className="relative h-screen bg-background overflow-hidden">
      <div className="flex flex-col h-full">
        <Header />
        {/* Video Stream */}
        <div className="flex-1 h-[calc(100vh-4rem)] pt-16 overflow-hidden">
          <VideoStream
            videos={videos}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
          />
        </div>
      </div>
    </div>
  );
}
