import { DeleteOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Input, message } from "antd";
import type React from "react";
import type { VideoItem } from "./types";

interface SortableVideoItemProps {
  video: VideoItem;
  index: number;
  editingVideoId: string | null;
  editingVideoTitle: string;
  setEditingVideoId: (id: string | null) => void;
  setEditingVideoTitle: (title: string) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function SortableVideoItem({
  video,
  index,
  editingVideoId,
  editingVideoTitle,
  setEditingVideoId,
  setEditingVideoTitle,
  onDelete,
  onApprove,
  onReject,
}: SortableVideoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  const isEditing = editingVideoId === video.id;

  const handleTitleClick = () => {
    setEditingVideoId(video.id);
    setEditingVideoTitle(video.title);
  };

  const handleTitleBlur = async () => {
    if (editingVideoTitle !== video.title) {
      try {
        await fetch("/api/admin/videos", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: video.id, title: editingVideoTitle }),
        });
        message.success("更新成功");
        // 触发重新加载
        window.dispatchEvent(
          new CustomEvent("admin-refresh", { detail: { type: "videos" } }),
        );
      } catch (error) {
        console.error("Failed to update video:", error);
        message.error("更新失败");
      }
    }
    setEditingVideoId(null);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setEditingVideoId(null);
      setEditingVideoTitle(video.title);
    }
  };

  return (
    <div className="border-b border-gray-100 bg-white">
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-2 sm:py-3 ${
          isDragging ? "opacity-50" : ""
        }`}
      >
        {/* 拖拽手柄 - 三个横线 */}
        <div
          {...attributes}
          {...listeners}
          className="hidden lg:flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing p-1"
        >
          <div className="w-4 h-0.5 bg-gray-400" />
          <div className="w-4 h-0.5 bg-gray-400" />
          <div className="w-4 h-0.5 bg-gray-400" />
        </div>

        {/* 视频信息 */}
        <div className="flex-1 grid grid-cols-[1fr] lg:grid-cols-[80px_1fr_100px_80px_250px] gap-2 sm:gap-4 items-center min-w-0">
          <div className="font-mono text-sm text-gray-500 hidden lg:block">
            {video.id.slice(0, 8)}
          </div>

          {/* 视频标题 - 可编辑 */}
          {isEditing ? (
            <Input
              value={editingVideoTitle}
              onChange={(e) => setEditingVideoTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              autoFocus
              className="w-full text-xs sm:text-sm"
              style={{ padding: "4px 8px", margin: "0" }}
            />
          ) : (
            <button
              type="button"
              onClick={handleTitleClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleTitleClick();
                }
              }}
              className="text-gray-900 cursor-pointer hover:text-blue-600 hover:underline px-2 py-2 rounded hover:bg-blue-50 transition-colors text-left bg-transparent border-0 w-full truncate"
            >
              {video.title}
            </button>
          )}

          <div className="text-gray-600 text-sm truncate hidden lg:block">
            {video.author}
          </div>
          <div className="text-sm hidden lg:block">
            <span
              className={`px-2 py-1 rounded ${
                video.status === "已发布"
                  ? "bg-green-100 text-green-800"
                  : video.status === "已拒绝"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {video.status}
            </span>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {video.status === "待审核" && (
              <>
                <Button
                  type="link"
                  size="small"
                  onClick={() => onApprove(video.id)}
                  className="text-xs sm:text-sm"
                >
                  通过
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  onClick={() => onReject(video.id)}
                  className="text-xs sm:text-sm"
                >
                  拒绝
                </Button>
              </>
            )}
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(video.id)}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">删除</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
