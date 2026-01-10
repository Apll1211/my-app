"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import LivePlayer from "@/components/LivePlayer";
import { Radio, Tv, Play, Search, ArrowUp } from "lucide-react";

interface LiveChannel {
  id: string;
  name: string;
  logo?: string;
  url: string;
}

// 解析M3U内容
const parseM3U = (content: string): LiveChannel[] => {
  const lines = content.split("\n");
  const streams: LiveChannel[] = [];
  let currentStream: Partial<LiveChannel> = {};
  let index = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#EXTINF:")) {
      // 解析 #EXTINF 行
      const info = line.substring(8);
      
      // 提取名称
      const nameMatch = info.match(/,(.+)$/);
      const name = nameMatch ? nameMatch[1].trim() : `频道 ${index + 1}`;

      // 提取 logo
      const logoMatch = info.match(/tvg-logo="([^"]*)"/);
      const logo = logoMatch ? logoMatch[1] : undefined;

      currentStream = {
        id: `channel-${index++}`,
        name,
        logo,
        url: "",
      };
    } else if (line && !line.startsWith("#")) {
      // URL 行
      if (currentStream.name) {
        currentStream.url = line;
        streams.push(currentStream as LiveChannel);
        currentStream = {};
      }
    }
  }

  return streams;
};

export default function LivePage() {
  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<LiveChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 从M3U文件获取播放列表
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/live/playlist");
        const data = await response.json();
        
        if (data.success && data.content) {
          // 解析M3U内容
          const parsedChannels = parseM3U(data.content);
          setChannels(parsedChannels);
          
          // 默认选择第一个频道
          if (parsedChannels.length > 0) {
            setSelectedChannel(parsedChannels[0]);
          }
        } else {
          setError("未找到播放列表，请联系管理员上传M3U文件");
        }
      } catch (err) {
        console.error("Failed to fetch playlist:", err);
        setError("加载播放列表失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, []);

  // 监听滚动事件，控制返回顶部按钮显示
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      setShowBackToTop(scrollTop > 300);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 返回顶部
  const scrollToTop = () => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // 过滤频道
  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative h-screen bg-background overflow-hidden">
      <div className="flex flex-col lg:flex-row h-full">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full lg:ml-20 xl:ml-44">
          <Header />
          
          {/* 主内容区域 */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto pt-16 scrollbar-custom"
          >
            <div className="flex flex-col">
              {/* 播放器区域 */}
              {selectedChannel && (
                <div className="p-4">
                  <LivePlayer
                    channel={selectedChannel}
                    onClose={() => setSelectedChannel(null)}
                  />
                </div>
              )}

              {/* 搜索栏 */}
              <div className="px-4 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="搜索频道..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* 频道列表 */}
              <div className="px-4 pb-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-block mb-4"
                      >
                        <Radio className="h-12 w-12 text-primary" />
                      </motion.div>
                      <p className="text-muted-foreground">加载播放列表中...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-red-500">{error}</p>
                  </div>
                ) : filteredChannels.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">没有找到匹配的频道</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredChannels.map((channel, index) => (
                      <motion.button
                        key={channel.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        onClick={() => setSelectedChannel(channel)}
                        className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg text-left ${
                          selectedChannel?.id === channel.id
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <Tv className="h-8 w-8 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{channel.name}</h3>
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Play className="h-5 w-5 text-primary" />
                          </motion.div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 返回顶部悬浮按钮 */}
          <AnimatePresence>
            {showBackToTop && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={scrollToTop}
                className="fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                <ArrowUp className="h-6 w-6" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}