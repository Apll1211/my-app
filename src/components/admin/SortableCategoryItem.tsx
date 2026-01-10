import { DeleteOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Input, message, Switch } from "antd";
import type React from "react";
import type { CategoryItem } from "./types";

interface SortableCategoryItemProps {
  category: CategoryItem;
  index: number;
  editingCategoryId: string | null;
  editingLabel: string;
  setEditingCategoryId: (id: string | null) => void;
  setEditingLabel: (label: string) => void;
  onDelete: (id: string) => void;
}

export default function SortableCategoryItem({
  category,
  index,
  editingCategoryId,
  editingLabel,
  setEditingCategoryId,
  setEditingLabel,
  onDelete,
}: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  const isEditing = editingCategoryId === category.id;

  const handleLabelClick = () => {
    setEditingCategoryId(category.id);
    setEditingLabel(category.label);
  };

  const handleLabelBlur = async () => {
    if (editingLabel !== category.label) {
      try {
        await fetch("/api/admin/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: category.id, label: editingLabel }),
        });
        message.success("更新成功");
        // 触发重新加载
        window.dispatchEvent(
          new CustomEvent("admin-refresh", { detail: { type: "categories" } }),
        );
      } catch (error) {
        console.error("Failed to update category:", error);
        message.error("更新失败");
      }
    }
    setEditingCategoryId(null);
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setEditingCategoryId(null);
      setEditingLabel(category.label);
    }
  };

  const handleToggleActive = async (checked: boolean) => {
    try {
      await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category.id, active: checked ? 1 : 0 }),
      });
      if (checked) {
        message.success("已启用");
      } else {
        message.info("已禁用");
      }
      // 触发重新加载
      window.dispatchEvent(
        new CustomEvent("admin-refresh", { detail: { type: "categories" } }),
      );
    } catch (error) {
      console.error("Failed to update category status:", error);
      message.error("更新失败");
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

        {/* 分类信息 */}
        <div className="flex-1 grid grid-cols-[1fr_auto_auto] lg:grid-cols-[80px_1fr_80px_100px] gap-2 sm:gap-4 items-center min-w-0">
          <div className="font-mono text-xs sm:text-sm text-gray-500 hidden lg:block">
            {category.id.slice(0, 8)}
          </div>

          {/* 分类名称 - 可编辑 */}
          {isEditing ? (
            <Input
              value={editingLabel}
              onChange={(e) => setEditingLabel(e.target.value)}
              onBlur={handleLabelBlur}
              onKeyDown={handleLabelKeyDown}
              autoFocus
              className="w-full text-xs sm:text-sm"
              style={{ padding: "4px 8px", margin: "0" }}
            />
          ) : (
            <button
              type="button"
              onClick={handleLabelClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleLabelClick();
                }
              }}
              className="text-gray-900 cursor-pointer hover:text-blue-600 hover:underline px-2 py-2 rounded hover:bg-blue-50 transition-colors text-left bg-transparent border-0 w-full truncate"
            >
              {category.label}
            </button>
          )}

          {/* 状态开关 */}
          <div className="flex items-center justify-center shrink-0">
            <Switch
              checked={category.active === 1}
              onChange={handleToggleActive}
              size="small"
            />
          </div>

          {/* 删除按钮 */}
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(category.id)}
            className="text-xs sm:text-sm shrink-0"
          >
            <span className="hidden sm:inline">删除</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
