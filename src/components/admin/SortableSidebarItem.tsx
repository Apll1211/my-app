import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, message, Switch } from "antd";
import type React from "react";
import type { SidebarItem } from "./types";

interface SortableSidebarItemProps {
  item: SidebarItem;
  index: number;
  onEdit: (item: SidebarItem) => void;
  onDelete: (id: string) => void;
}

export default function SortableSidebarItem({
  item,
  index,
  onEdit,
  onDelete,
}: SortableSidebarItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  const handleToggleActive = async (checked: boolean) => {
    try {
      await fetch("/api/sidebar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, active: checked ? 1 : 0 }),
      });
      if (checked) {
        message.success("已启用");
      } else {
        message.info("已禁用");
      }
      // 触发重新加载
      window.dispatchEvent(
        new CustomEvent("admin-refresh", { detail: { type: "sidebar" } }),
      );
      // 触发侧边栏更新事件
      window.dispatchEvent(new Event("sidebar-update"));
    } catch (error) {
      console.error("Failed to update sidebar item status:", error);
      message.error("更新失败");
    }
  };

  const isDivider = item.item_type === "divider";

  return (
    <div className="border-b border-gray-100 bg-white">
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-2 sm:py-3 ${
          isDragging ? "opacity-50" : ""
        }`}
      >
        {/* 拖拽手柄 */}
        <div
          {...attributes}
          {...listeners}
          className="hidden lg:flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing p-1"
        >
          <div className="w-4 h-0.5 bg-gray-400" />
          <div className="w-4 h-0.5 bg-gray-400" />
          <div className="w-4 h-0.5 bg-gray-400" />
        </div>

        {/* 侧边栏项信息 */}
        {isDivider ? (
          <div className="flex-1 text-gray-400 italic">分割线</div>
        ) : (
          <div className="flex-1 grid grid-cols-[1fr_auto] lg:grid-cols-[80px_1fr_100px_100px_auto] gap-2 sm:gap-4 items-center min-w-0">
            <div className="font-mono text-xs sm:text-sm text-gray-500 hidden lg:block">
              {item.id.slice(0, 8)}
            </div>

            <div className="text-gray-900 truncate">{item.label}</div>

            <div className="text-xs sm:text-sm text-gray-600 hidden lg:block">
              {item.icon_name || "-"}
            </div>

            <div className="text-xs sm:text-sm text-gray-600 hidden lg:block">
              {item.path || "-"}
            </div>

            {/* 状态开关 */}
            <div className="flex items-center justify-center shrink-0">
              <Switch
                checked={item.active === 1}
                onChange={handleToggleActive}
                size="small"
              />
            </div>
          </div>
        )}

        {/* 操作按钮 - 放在右边 */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {!isDivider && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(item)}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">编辑</span>
            </Button>
          )}
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(item.id)}
            className="text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">删除</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
