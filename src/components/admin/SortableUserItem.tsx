import { DeleteOutlined, KeyOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Input, Modal, message } from "antd";
import type React from "react";
import type { UserItem } from "./types";

interface SortableUserItemProps {
  user: UserItem;
  index: number;
  editingUserId: string | null;
  editingUsername: string;
  editingPassword: string;
  showPassword: Record<string, boolean>;
  setEditingUserId: (id: string | null) => void;
  setEditingUsername: (username: string) => void;
  setEditingPassword: (password: string) => void;
  setShowPassword: (show: Record<string, boolean>) => void;
  onDelete: (id: string) => void;
}

export default function SortableUserItem({
  user,
  index,
  editingUserId,
  editingUsername,
  editingPassword,
  showPassword,
  setEditingUserId,
  setEditingUsername,
  setEditingPassword,
  setShowPassword,
  onDelete,
}: SortableUserItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: user.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  const isEditing = editingUserId === user.id;
  const isPasswordVisible = showPassword[user.id] || false;
  const isEditingPassword = isEditing && isPasswordVisible;

  const handleUsernameClick = () => {
    setEditingUserId(user.id);
    setEditingUsername(user.username);
    setEditingPassword("");
    setShowPassword((prev) => ({
      ...prev,
      [user.id]: false,
    }));
  };

  const handleUsernameBlur = async () => {
    // 如果正在编辑密码，不退出编辑状态
    if (isEditingPassword) {
      return;
    }

    if (editingUsername !== user.username || editingPassword) {
      try {
        const updateData: any = { id: user.id, username: editingUsername };
        if (editingPassword) {
          updateData.password = editingPassword;
        }
        await fetch("/api/admin/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });
        message.success("更新成功");
        // 触发重新加载
        window.dispatchEvent(
          new CustomEvent("admin-refresh", { detail: { type: "users" } }),
        );
      } catch (error) {
        console.error("Failed to update user:", error);
        message.error("更新失败");
      }
    }
    setEditingUserId(null);
    setEditingPassword("");
  };

  const handlePasswordBlur = async () => {
    if (editingUsername !== user.username || editingPassword) {
      try {
        const updateData: any = { id: user.id, username: editingUsername };
        if (editingPassword) {
          updateData.password = editingPassword;
        }
        await fetch("/api/admin/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });
        message.success("更新成功");
        // 触发重新加载
        window.dispatchEvent(
          new CustomEvent("admin-refresh", { detail: { type: "users" } }),
        );
      } catch (error) {
        console.error("Failed to update user:", error);
        message.error("更新失败");
      }
    }
    setEditingUserId(null);
    setEditingPassword("");
  };

  const handleUsernameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setEditingUserId(null);
      setEditingUsername(user.username);
      setEditingPassword("");
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => ({
      ...prev,
      [user.id]: !prev[user.id],
    }));
  };

  const handlePasswordIconClick = () => {
    Modal.confirm({
      title: "修改密码",
      content: "确定要修改该用户的密码吗？",
      onOk: () => {
        setEditingUserId(user.id);
        setEditingUsername(user.username);
        setEditingPassword("");
        setShowPassword((prev) => ({
          ...prev,
          [user.id]: true,
        }));
      },
    });
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

        {/* 用户信息 */}
        <div className="flex-1 grid grid-cols-[1fr_auto] lg:grid-cols-[80px_1fr_150px] gap-2 sm:gap-4 items-center">
          <div className="font-mono text-sm text-gray-500 hidden lg:block">
            {user.id.slice(0, 8)}
          </div>

          {/* 用户名 - 可编辑 */}
          {isEditing ? (
            <div className="flex flex-col gap-2 w-full">
              <Input
                value={editingUsername}
                onChange={(e) => setEditingUsername(e.target.value)}
                onBlur={handleUsernameBlur}
                onKeyDown={handleUsernameKeyDown}
                autoFocus
                className="w-full text-xs sm:text-sm"
                style={{ padding: "4px 8px", margin: "0" }}
                placeholder="用户名"
              />
              {isEditingPassword && (
                <div className="relative">
                  <Input.Password
                    value={editingPassword}
                    onChange={(e) => setEditingPassword(e.target.value)}
                    onBlur={handlePasswordBlur}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      } else if (e.key === "Escape") {
                        setEditingUserId(null);
                        setEditingUsername(user.username);
                        setEditingPassword("");
                      }
                    }}
                    placeholder="新密码（留空则不修改）"
                    className="w-full text-xs sm:text-sm"
                    style={{ padding: "4px 8px", margin: "0" }}
                    visibilityToggle={{
                      visible: isPasswordVisible,
                      onVisibleChange: (visible) => {
                        setShowPassword((prev) => ({
                          ...prev,
                          [user.id]: visible,
                        }));
                      },
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={handleUsernameClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleUsernameClick();
                  }
                }}
                className="text-gray-900 cursor-pointer hover:text-blue-600 hover:underline px-2 py-2 rounded hover:bg-blue-50 transition-colors text-left bg-transparent border-0 flex-1 truncate"
              >
                {user.username}
              </button>
              <Button
                type="link"
                size="small"
                icon={<KeyOutlined />}
                onClick={handlePasswordIconClick}
                className="text-xs sm:text-sm shrink-0"
                title="修改密码"
              >
                <span className="hidden sm:inline">密码</span>
              </Button>
            </div>
          )}

          {/* 删除按钮 */}
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(user.id)}
            className="text-xs sm:text-sm shrink-0"
          >
            <span className="hidden sm:inline">删除</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
