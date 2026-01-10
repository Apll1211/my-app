"use client";

import { AnimatePresence, motion } from "framer-motion";
import Hls from "hls.js";
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface LivePlayerProps {
  channel: {
    id: string;
    name: string;
    url: string;
  };
  onClose: () => void;
}

export default function LivePlayer({ channel, onClose }: LivePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setError("无法加载直播流，请尝试其他频道");
      setIsLoading(false);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);

    // 检测是否为 HLS 流（.m3u8 或 .m3u）
    const isHlsStream =
      channel.url.includes(".m3u8") || channel.url.includes(".m3u");

    // 使用统一的代理 API
    const streamUrl = `/api/proxy?url=${encodeURIComponent(channel.url)}`;

    // 使用 hls.js 加载 HLS 流
    if (Hls.isSupported() && isHlsStream) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        manifestLoadingTimeOut: 10000,
        levelLoadingTimeOut: 10000,
        fragLoadingTimeOut: 20000,
      });

      // 在 hls 实例上附加重试计数器
      (hls as any).retryCount = 0;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          const retryCount = (hls as any).retryCount || 0;

          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (retryCount < 3) {
                console.error(
                  `网络错误，尝试恢复 (${retryCount + 1}/3)...`,
                  data,
                );
                (hls as any).retryCount = retryCount + 1;
                hls.startLoad();
              } else {
                console.error("超过最大重试次数，停止重试");
                setError("无法加载直播流，请尝试其他频道");
                setIsLoading(false);
                hls.destroy();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              if (retryCount < 3) {
                console.error(
                  `媒体错误，尝试恢复 (${retryCount + 1}/3)...`,
                  data,
                );
                (hls as any).retryCount = retryCount + 1;
                hls.recoverMediaError();
              } else {
                console.error("超过最大重试次数，停止重试");
                setError("无法加载直播流，请尝试其他频道");
                setIsLoading(false);
                hls.destroy();
              }
              break;
            default:
              console.error("无法恢复的错误:", data);
              setError("无法加载直播流，请尝试其他频道");
              setIsLoading(false);
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        hls.destroy();
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("waiting", handleWaiting);
        video.removeEventListener("canplay", handleCanPlay);
        video.removeEventListener("error", handleError);
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari 原生支持 HLS
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
      });
    } else {
      // 非 HLS 流，使用统一的代理 API
      video.src = streamUrl;
    }

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
    };
  }, [channel.url]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying) {
        video.pause();
      } else {
        // 确保视频已暂停再播放
        if (!video.paused) {
          return;
        }
        await video.play();
      }
    } catch (err: any) {
      // 忽略 AbortError（播放被中断）
      if (err.name === "AbortError") {
        console.log("播放被中断");
        return;
      }
      console.error("Play error:", err);
      setError("播放失败，请尝试其他频道");
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error("Fullscreen error:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="relative bg-black rounded-lg overflow-hidden shadow-2xl"
    >
      {/* 视频播放器 */}
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          autoPlay
          playsInline
          controls={false}
          onError={() => setError("无法加载直播流")}
        >
          <track kind="captions" label="中文字幕" srcLang="zh" />
          您的浏览器不支持视频播放
        </video>

        {/* 加载指示器 */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-4"
                >
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full" />
                </motion.div>
                <p className="text-white text-sm">加载中...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 错误提示 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/80"
            >
              <div className="text-center px-4">
                <p className="text-red-400 text-sm mb-2">{error}</p>
                <p className="text-white/60 text-xs">请尝试切换其他频道</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 控制栏 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={togglePlay}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMute}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </motion.button>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 频道信息 */}
      <div className="bg-card border-t border-border p-4">
        <h2 className="text-lg font-semibold">{channel.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">正在播放直播内容</p>
      </div>
    </motion.div>
  );
}
