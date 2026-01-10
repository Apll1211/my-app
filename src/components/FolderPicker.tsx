"use client";

import { Check, FolderOpen, Loader2, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VideoFile {
  filename: string;
  path: string;
  fullPath: string;
}

interface FolderPickerProps {
  onImport?: (videos: VideoFile[]) => void;
}

export default function FolderPicker({ onImport }: FolderPickerProps) {
  const [folderPath, setFolderPath] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 扫描文件夹
  const handleScan = async () => {
    if (!folderPath.trim()) {
      setError("请输入文件夹路径");
      return;
    }

    setIsScanning(true);
    setError("");
    setSuccess("");
    setVideos([]);
    setSelectedVideos(new Set());

    try {
      const response = await fetch(
        `/api/folder?path=${encodeURIComponent(folderPath)}`,
      );
      const data = await response.json();

      if (data.success) {
        setVideos(data.videos);
        setSuccess(`找到 ${data.count} 个视频文件`);
      } else {
        setError(data.error || "扫描失败");
      }
    } catch (error) {
      console.error("Failed to scan folder:", error);
      setError("扫描文件夹失败");
    } finally {
      setIsScanning(false);
    }
  };

  // 选择/取消选择视频
  const toggleVideo = (path: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelectedVideos(newSelected);
  };

  // 全选/取消全选
  const toggleAll = () => {
    if (selectedVideos.size === videos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(videos.map((v) => v.path)));
    }
  };

  // 导入视频
  const handleImport = async () => {
    if (selectedVideos.size === 0) {
      setError("请至少选择一个视频");
      return;
    }

    setIsImporting(true);
    setError("");
    setSuccess("");

    try {
      const selectedVideoList = videos.filter((v) =>
        selectedVideos.has(v.path),
      );
      const response = await fetch("/api/folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderPath,
          videos: selectedVideoList,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`成功导入 ${data.imported} 个视频`);
        setSelectedVideos(new Set());
        if (onImport) {
          onImport(data.videos);
        }
      } else {
        setError(data.error || "导入失败");
      }
    } catch (error) {
      console.error("Failed to import videos:", error);
      setError("导入视频失败");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 文件夹路径输入 */}
      <div className="space-y-2">
        <Label htmlFor="folderPath">视频文件夹路径</Label>
        <div className="flex gap-2">
          <Input
            id="folderPath"
            placeholder="例如: E:/Videos 或 /home/user/videos"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
          />
          <Button onClick={handleScan} disabled={isScanning} variant="outline">
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            扫描
          </Button>
        </div>
      </div>

      {/* 错误和成功消息 */}
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-500/10 text-green-600 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* 视频列表 */}
      {videos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>找到 {videos.length} 个视频文件</Label>
            <Button onClick={toggleAll} variant="ghost" size="sm">
              {selectedVideos.size === videos.length ? "取消全选" : "全选"}
            </Button>
          </div>

          <div className="border rounded-lg max-h-96 overflow-y-auto">
            {videos.map((video) => (
              <button
                key={video.path}
                type="button"
                className="flex items-center gap-3 p-3 hover:bg-accent w-full text-left border-b last:border-b-0 transition-colors"
                onClick={() => toggleVideo(video.path)}
                onKeyDown={(e) => e.key === "Enter" && toggleVideo(video.path)}
              >
                <div className="shrink-0">
                  {selectedVideos.has(video.path) ? (
                    <Check className="h-5 w-5 text-primary" />
                  ) : (
                    <div className="h-5 w-5 border-2 border-muted-foreground/30 rounded" />
                  )}
                </div>
                <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {video.filename}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {video.path}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* 导入按钮 */}
          <Button
            onClick={handleImport}
            disabled={isImporting || selectedVideos.size === 0}
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                导入中...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                导入选中的 {selectedVideos.size} 个视频
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
