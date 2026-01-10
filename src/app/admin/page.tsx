"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { MenuProps } from "antd";
import {
  Button,
  Card,
  Checkbox,
  ConfigProvider,
  Form,
  Input,
  Layout,
  Menu,
  Modal,
  message,
  Space,
  Switch,
} from "antd";
import zhCN from "antd/locale/zh_CN";
import {
  ArrowLeft,
  Database,
  Delete,
  Edit,
  Eye,
  EyeOff,
  Key,
  Menu as MenuIcon,
  Plus,
  Radio,
  RotateCcw,
  User,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminMobileMenu from "@/components/AdminMobileMenu";
import JsonServerManager from "@/components/admin/JsonServerManager";
import SortableCategoryItem from "@/components/admin/SortableCategoryItem";
import SortableSidebarItem from "@/components/admin/SortableSidebarItem";
import SortableUserItem from "@/components/admin/SortableUserItem";
import SortableVideoItem from "@/components/admin/SortableVideoItem";
import type {
  CategoryItem,
  SidebarItem,
  UserItem,
  VideoItem,
} from "@/components/admin/types";
import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/context/AuthContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const { Content, Sider } = Layout;

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, login } = useAuth();
  const [selectedMenu, setSelectedMenu] = useState("sidebar");
  const [isLoginFormOpen, setIsLoginFormOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // 使用访问控制 Hook
  useRequireAuth({
    onUnauthenticated: () => {
      setIsLoginFormOpen(true);
    },
  });

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "登录失败");
      }

      const data = await response.json();

      // 更新认证状态
      login({
        id: data.user.id,
        username: data.user.username,
        nickname: data.user.nickname,
        bio: data.user.bio,
        avatar: data.user.avatar,
        role: data.user.role,
      });

      message.success("登录成功！");
      setIsLoginFormOpen(false);
    } catch (error) {
      console.error("Login error:", error);
      message.error(error instanceof Error ? error.message : "登录失败");
      throw error;
    }
  };

  const handleRegister = async (
    username: string,
    password: string,
    confirmPassword: string,
  ) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, confirmPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "注册失败");
      }

      const data = await response.json();
      message.success("注册成功！请登录");
    } catch (error) {
      console.error("Register error:", error);
      message.error(error instanceof Error ? error.message : "注册失败");
      throw error;
    }
  };
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(
    null,
  );
  const [form] = Form.useForm();
  const [userForm] = Form.useForm();
  const [categoryForm] = Form.useForm();

  // 编辑中的视频 ID 和标题
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editingVideoTitle, setEditingVideoTitle] = useState<string>("");

  // 编辑中的用户 ID 和用户名
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUsername, setEditingUsername] = useState<string>("");
  const [editingPassword, setEditingPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 视频数据（从 API 获取）
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [videoHasMore, setVideoHasMore] = useState(true);
  const [videoLastId, setVideoLastId] = useState<string | null>(null);

  // 用户数据（从 API 获取）
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userHasMore, setUserHasMore] = useState(true);
  const [userLastId, setUserLastId] = useState<string | null>(null);

  // 分类数据（从 API 获取）
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoryHasMore, setCategoryHasMore] = useState(true);
  const [categoryLastId, setCategoryLastId] = useState<string | null>(null);

  // 侧边栏数据（从 API 获取）
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [isSidebarModalOpen, setIsSidebarModalOpen] = useState(false);
  const [editingSidebarItem, setEditingSidebarItem] =
    useState<SidebarItem | null>(null);
  const [sidebarForm] = Form.useForm();

  // 直播源数据（从 API 获取）
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [liveStreamForm] = Form.useForm();
  const [editingLiveStream, setEditingLiveStream] = useState<any | null>(null);
  const [isLiveStreamModalOpen, setIsLiveStreamModalOpen] = useState(false);

  // JSON Server URL
  const [jsonServerUrl, setJsonServerUrl] = useState<string>(() => {
    // 从 localStorage 读取保存的 URL，如果没有则使用环境变量或默认值
    if (typeof window !== "undefined") {
      const savedUrl = localStorage.getItem("jsonServerUrl");
      if (savedUrl) return savedUrl;
    }
    return process.env.NEXT_PUBLIC_JSON_SERVER_URL || "http://localhost:3001";
  });

  // 撤销相关状态
  const [recentOperation, setRecentOperation] = useState<any>(null);

  // 滚动容器引用
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 编辑中的分类 ID
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editingLabel, setEditingLabel] = useState<string>("");

  // 从 API 获取视频数据（懒加载）
  const fetchVideos = useCallback(
    async (isLoadMore: boolean = false) => {
      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }

        const url = videoLastId
          ? `/api/admin/videos?limit=20&lastId=${videoLastId}`
          : `/api/admin/videos?limit=20`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.videos) {
          if (isLoadMore) {
            setVideos((prev) => [...prev, ...data.videos]);
          } else {
            setVideos(data.videos);
          }
          setVideoHasMore(data.hasMore);
          setVideoLastId(data.lastId);
        }
      } catch (error) {
        console.error("Failed to fetch videos:", error);
        message.error("获取视频数据失败");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [videoLastId],
  );

  // 使用 ref 存储 fetchVideos 以避免依赖循环
  const fetchVideosRef = useRef(fetchVideos);
  fetchVideosRef.current = fetchVideos;

  // 从 API 获取用户数据（懒加载）
  const fetchUsers = useCallback(
    async (isLoadMore: boolean = false) => {
      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }

        const url = userLastId
          ? `/api/admin/users?limit=20&lastId=${userLastId}`
          : `/api/admin/users?limit=20`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.users) {
          if (isLoadMore) {
            setUsers((prev) => [...prev, ...data.users]);
          } else {
            setUsers(data.users);
          }
          setUserHasMore(data.hasMore);
          setUserLastId(data.lastId);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        message.error("获取用户数据失败");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [userLastId],
  );

  // 使用 ref 存储 fetchUsers 以避免依赖循环
  const fetchUsersRef = useRef(fetchUsers);
  fetchUsersRef.current = fetchUsers;

  // 从 API 获取分类数据（懒加载）
  const fetchCategories = useCallback(
    async (isLoadMore: boolean = false) => {
      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }

        const url = categoryLastId
          ? `/api/admin/categories?limit=20&lastId=${categoryLastId}`
          : `/api/admin/categories?limit=20`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.categories) {
          if (isLoadMore) {
            setCategories((prev) => [...prev, ...data.categories]);
          } else {
            setCategories(data.categories);
          }
          setCategoryHasMore(data.hasMore);
          setCategoryLastId(data.lastId);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        message.error("获取分类数据失败");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [categoryLastId],
  );

  // 使用 ref 存储 fetchCategories 以避免依赖循环
  const fetchCategoriesRef = useRef(fetchCategories);
  fetchCategoriesRef.current = fetchCategories;

  // 从 API 获取侧边栏数据
  const fetchSidebarItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/sidebar");
      const data = await response.json();
      if (data.items) {
        setSidebarItems(data.items);
      }
    } catch (error) {
      console.error("Failed to fetch sidebar items:", error);
      message.error("获取侧边栏配置失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 使用 ref 存储 fetchSidebarItems 以避免依赖循环
  const fetchSidebarItemsRef = useRef(fetchSidebarItems);
  fetchSidebarItemsRef.current = fetchSidebarItems;

  // 从 M3U 文件获取直播源数据
  const fetchLiveStreams = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/live/playlist");
      const data = await response.json();

      if (data.success && data.content) {
        // 解析M3U内容
        const lines = data.content.split("\n");
        const streams: any[] = [];
        let currentStream: any = {};
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

            // 提取 group-title
            const groupTitleMatch = info.match(/group-title="([^"]*)"/);
            const groupTitle = groupTitleMatch ? groupTitleMatch[1] : "其他";

            currentStream = {
              id: `channel-${index++}`,
              name,
              logo,
              group_title: groupTitle,
              url: "",
              active: true,
            };
          } else if (line && !line.startsWith("#")) {
            // URL 行
            if (currentStream.name) {
              currentStream.url = line;
              streams.push(currentStream);
              currentStream = {};
            }
          }
        }

        setLiveStreams(streams);
      } else {
        setLiveStreams([]);
      }
    } catch (error) {
      console.error("Failed to fetch live streams:", error);
      message.error("获取直播源失败");
      setLiveStreams([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 使用 ref 存储 fetchLiveStreams 以避免依赖循环
  const fetchLiveStreamsRef = useRef(fetchLiveStreams);
  fetchLiveStreamsRef.current = fetchLiveStreams;

  // 加载更多数据的函数
  const loadMoreVideos = useCallback(() => {
    if (!isLoadingMore && videoHasMore) {
      fetchVideos(true);
    }
  }, [isLoadingMore, videoHasMore, fetchVideos]);

  const loadMoreUsers = useCallback(() => {
    if (!isLoadingMore && userHasMore) {
      fetchUsers(true);
    }
  }, [isLoadingMore, userHasMore, fetchUsers]);

  const loadMoreCategories = useCallback(() => {
    if (!isLoadingMore && categoryHasMore) {
      fetchCategories(true);
    }
  }, [isLoadingMore, categoryHasMore, fetchCategories]);

  // 拖拽结束处理 - 侧边栏
  const handleSidebarDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = sidebarItems.findIndex(
          (item) => item.id === active.id,
        );
        const newIndex = sidebarItems.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(sidebarItems, oldIndex, newIndex);

        // 更新所有项目的 sort_order
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          sort_order: index,
        }));

        // 批量更新到服务器
        try {
          await fetch("/api/admin/sidebar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: updatedItems }),
          });
          setSidebarItems(updatedItems);
          message.success("排序更新成功");

          // 触发侧边栏更新事件
          window.dispatchEvent(new Event("sidebar-update"));
        } catch (error) {
          console.error("Failed to reorder sidebar items:", error);
          message.error("排序更新失败");
          // 如果失败，恢复原始顺序
          setSidebarItems(sidebarItems);
        }
      }
    },
    [sidebarItems],
  );

  // 滚动事件处理
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      // 防止在加载时重复触发
      if (isLoading || isLoadingMore) {
        return;
      }

      const target = e.target as HTMLDivElement;
      const { scrollTop, scrollHeight, clientHeight } = target;

      // 当滚动到距离底部 100px 时加载更多
      if (scrollHeight - scrollTop - clientHeight < 100) {
        if (selectedMenu === "videos") {
          loadMoreVideos();
        } else if (selectedMenu === "users") {
          loadMoreUsers();
        } else if (selectedMenu === "categories") {
          loadMoreCategories();
        }
      }
    },
    [
      selectedMenu,
      loadMoreVideos,
      loadMoreUsers,
      loadMoreCategories,
      isLoading,
      isLoadingMore,
    ],
  );

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 拖拽结束处理 - 分类
  const handleCategoryDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = categories.findIndex(
          (category) => category.id === active.id,
        );
        const newIndex = categories.findIndex(
          (category) => category.id === over.id,
        );

        const newCategories = arrayMove(categories, oldIndex, newIndex);

        // 更新所有分类的 sort_order
        const updatedCategories = newCategories.map((category, index) => ({
          ...category,
          sort_order: index,
        }));

        // 批量更新到服务器
        try {
          await fetch("/api/admin/categories/reorder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categories: updatedCategories }),
          });
          setCategories(updatedCategories);
          message.success("排序更新成功");
        } catch (error) {
          console.error("Failed to reorder categories:", error);
          message.error("排序更新失败");
          // 如果失败，恢复原始顺序
          setCategories(categories);
        }
      }
    },
    [categories],
  );

  // 拖拽结束处理 - 用户
  const handleUserDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = users.findIndex((user) => user.id === active.id);
        const newIndex = users.findIndex((user) => user.id === over.id);

        const newUsers = arrayMove(users, oldIndex, newIndex);
        setUsers(newUsers);
        message.success("排序更新成功");
      }
    },
    [users],
  );

  // 拖拽结束处理 - 视频
  const handleVideoDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = videos.findIndex((video) => video.id === active.id);
        const newIndex = videos.findIndex((video) => video.id === over.id);

        const newVideos = arrayMove(videos, oldIndex, newIndex);
        setVideos(newVideos);
        message.success("排序更新成功");
      }
    },
    [videos],
  );

  // 获取最近的操作记录
  const fetchRecentOperation = useCallback(async () => {
    try {
      const tableNameMap: Record<string, string> = {
        videos: "videos",
        users: "users",
        categories: "categories",
        sidebar: "sidebar_items",
      };
      const tableName = tableNameMap[selectedMenu];

      if (tableName) {
        const response = await fetch(
          `/api/admin/undo?table_name=${tableName}&limit=1`,
        );
        const data = await response.json();
        if (data.logs && data.logs.length > 0) {
          setRecentOperation(data.logs[0]);
        } else {
          setRecentOperation(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch recent operation:", error);
    }
  }, [selectedMenu]);

  // 切换菜单时重置数据并重新加载
  useEffect(() => {
    // 重置游标和hasMore状态
    setVideoLastId(null);
    setVideoHasMore(true);
    setVideos([]);

    setUserLastId(null);
    setUserHasMore(true);
    setUsers([]);

    setCategoryLastId(null);
    setCategoryHasMore(true);
    setCategories([]);

    // 根据选中的菜单加载数据
    if (selectedMenu === "videos") {
      fetchVideosRef.current(false);
    } else if (selectedMenu === "users") {
      fetchUsersRef.current(false);
    } else if (selectedMenu === "categories") {
      fetchCategoriesRef.current(false);
    } else if (selectedMenu === "sidebar") {
      fetchSidebarItemsRef.current();
    } else if (selectedMenu === "livestreams") {
      fetchLiveStreamsRef.current();
    }

    // 加载最近的操作记录
    fetchRecentOperation();
  }, [selectedMenu, fetchRecentOperation]);

  // 从数据库加载菜单项
  const [menuItems, setMenuItems] = useState<MenuProps["items"]>([]);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch("/api/admin/menu");
        const data = await response.json();

        if (data.items) {
          const items: MenuProps["items"] = data.items.map((item: any) => {
            // 使用 Lucide 图标映射
            const iconMap: Record<string, any> = {
              video: Video,
              user: User,
              database: Database,
              menu: MenuIcon,
              radio: Radio,
            };

            const IconComponent = iconMap[item.icon_name];

            return {
              key: item.key,
              label: item.label,
              icon: IconComponent ? (
                <IconComponent className="w-4 h-4" />
              ) : null,
            };
          });
          setMenuItems(items);
        }
      } catch (error) {
        console.error("Failed to fetch admin menu items:", error);
      }
    };

    fetchMenuItems();

    // 更新"直播源管理"的图标名称
    const updateMenuIcon = async () => {
      try {
        await fetch("/api/admin/menu/update-icon", {
          method: "POST",
        });
        console.log("Menu icon updated successfully");
      } catch (error) {
        console.error("Failed to update menu icon:", error);
      }
    };

    updateMenuIcon();
  }, []);

  const handleDeleteVideo = async (id: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个视频吗？",
      onOk: async () => {
        try {
          await fetch(`/api/admin/videos?id=${id}`, {
            method: "DELETE",
          });
          // 重置并重新加载
          setVideoLastId(null);
          setVideos([]);
          await fetchVideos(false);
          message.success("删除成功");

          // 获取最近的操作记录
          await fetchRecentOperation();
        } catch (error) {
          console.error("Failed to delete video:", error);
          message.error("删除失败");
        }
      },
    });
  };

  const handleApproveVideo = async (id: string) => {
    try {
      await fetch("/api/admin/videos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "已发布" }),
      });
      message.success("审核通过");
      setVideoLastId(null);
      setVideos([]);
      await fetchVideos(false);

      // 获取最近的操作记录
      await fetchRecentOperation();
    } catch (error) {
      console.error("Failed to approve video:", error);
      message.error("操作失败");
    }
  };

  const handleRejectVideo = async (id: string) => {
    try {
      await fetch("/api/admin/videos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "已拒绝" }),
      });
      message.success("已拒绝");
      setVideoLastId(null);
      setVideos([]);
      await fetchVideos(false);

      // 获取最近的操作记录
      await fetchRecentOperation();
    } catch (error) {
      console.error("Failed to reject video:", error);
      message.error("操作失败");
    }
  };

  const handleDeleteUser = async (id: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个用户吗？",
      onOk: async () => {
        try {
          await fetch(`/api/admin/users?id=${id}`, {
            method: "DELETE",
          });
          setUserLastId(null);
          setUsers([]);
          await fetchUsers(false);
          message.success("删除成功");

          // 获取最近的操作记录
          await fetchRecentOperation();
        } catch (error) {
          console.error("Failed to delete user:", error);
          message.error("删除失败");
        }
      },
    });
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    categoryForm.resetFields();
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (record: CategoryItem) => {
    setEditingCategory(record);
    categoryForm.setFieldsValue(record);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个分类吗？",
      onOk: async () => {
        try {
          await fetch(`/api/admin/categories?id=${id}`, {
            method: "DELETE",
          });
          setCategoryLastId(null);
          setCategories([]);
          await fetchCategories(false);
          message.success("删除成功");

          // 获取最近的操作记录
          await fetchRecentOperation();
        } catch (error) {
          console.error("Failed to delete category:", error);
          message.error("删除失败");
        }
      },
    });
  };

  const handleCategorySubmit = async (values: any) => {
    try {
      if (editingCategory) {
        // 编辑模式
        await fetch("/api/admin/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingCategory.id, ...values }),
        });
        message.success("更新成功");
      } else {
        // 新增模式
        const response = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const data = await response.json();
        if (data.success) {
          message.success("添加成功");
        }
      }
      setCategoryLastId(null);
      setCategories([]);
      await fetchCategories(false);
      setIsCategoryModalOpen(false);
      categoryForm.resetFields();

      // 获取最近的操作记录
      fetchRecentOperation();
    } catch (error) {
      console.error("Failed to submit category:", error);
      message.error("操作失败");
    }
  };

  // 侧边栏项操作
  const handleAddSidebarItem = () => {
    setEditingSidebarItem(null);
    sidebarForm.resetFields();
    setIsSidebarModalOpen(true);
  };

  const handleEditSidebarItem = (record: SidebarItem) => {
    setEditingSidebarItem(record);
    sidebarForm.setFieldsValue(record);
    setIsSidebarModalOpen(true);
  };

  const handleDeleteSidebarItem = async (id: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个侧边栏项吗？",
      onOk: async () => {
        try {
          await fetch(`/api/admin/sidebar?id=${id}`, {
            method: "DELETE",
          });
          message.success("删除成功");

          // 重新加载侧边栏数据
          await fetchSidebarItems();

          // 触发侧边栏更新事件
          window.dispatchEvent(new Event("sidebar-update"));

          // 获取最近的操作记录
          await fetchRecentOperation();
        } catch (error) {
          console.error("Failed to delete sidebar item:", error);
          message.error("删除失败");
        }
      },
    });
  };

  const handleSidebarItemSubmit = async (values: any) => {
    try {
      if (editingSidebarItem) {
        // 编辑模式
        await fetch("/api/sidebar", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingSidebarItem.id, ...values }),
        });
        message.success("更新成功");
      } else {
        // 新增模式
        const response = await fetch("/api/sidebar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const data = await response.json();
        if (data.success) {
          message.success("添加成功");
        }
      }
      await fetchSidebarItems();
      setIsSidebarModalOpen(false);
      sidebarForm.resetFields();

      // 触发侧边栏更新事件
      window.dispatchEvent(new Event("sidebar-update"));

      // 获取最近的操作记录
      await fetchRecentOperation();
    } catch (error) {
      console.error("Failed to submit sidebar item:", error);
      message.error("操作失败");
    }
  };

  // 直播源操作
  const handleUploadM3U = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/live/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        message.success(data.message);
        await fetchLiveStreams();
      } else {
        message.error(data.error || "上传失败");
      }
    } catch (error) {
      console.error("Failed to upload M3U file:", error);
      message.error("上传失败");
    }
  };

  const handleDeleteLiveStream = async (id: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个直播源吗？",
      onOk: async () => {
        try {
          await fetch(`/api/live/streams?id=${id}`, {
            method: "DELETE",
          });
          message.success("删除成功");
          await fetchLiveStreams();
        } catch (error) {
          console.error("Failed to delete live stream:", error);
          message.error("删除失败");
        }
      },
    });
  };

  // 执行撤销操作
  const handleUndo = async () => {
    if (!recentOperation) return;

    try {
      await fetch("/api/admin/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_id: recentOperation.id }),
      });
      message.success("撤销成功");

      // 重新加载数据
      if (selectedMenu === "videos") {
        setVideoLastId(null);
        setVideos([]);
        await fetchVideos(false);
      } else if (selectedMenu === "users") {
        setUserLastId(null);
        setUsers([]);
        await fetchUsers(false);
      } else if (selectedMenu === "categories") {
        setCategoryLastId(null);
        setCategories([]);
        await fetchCategories(false);
      } else if (selectedMenu === "sidebar") {
        await fetchSidebarItems();
      }

      // 刷新操作记录
      await fetchRecentOperation();
    } catch (error) {
      console.error("Failed to undo:", error);
      message.error("撤销失败");
    }
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case "videos":
        return (
          <Card
            title="视频管理"
            extra={
              recentOperation && (
                <Button
                  type="default"
                  icon={<RotateCcw className="w-4 h-4" />}
                  onClick={handleUndo}
                  className="flex items-center"
                >
                  撤销
                </Button>
              )
            }
          >
            {/* 表头 */}
            <div className="hidden lg:flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700 text-sm">
              <div className="w-10"></div>
              <div className="flex-1 grid grid-cols-[80px_1fr_100px_80px_250px] gap-4">
                <div>ID</div>
                <div>视频标题</div>
                <div>作者</div>
                <div>状态</div>
                <div>操作</div>
              </div>
            </div>
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="max-h-150 overflow-y-auto"
            >
              {isLoading && (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              )}
              {!isLoading && videos.length === 0 && (
                <div className="text-center py-8 text-gray-400">暂无数据</div>
              )}
              {!isLoading && videos.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleVideoDragEnd}
                >
                  <SortableContext
                    items={videos.map((v) => v.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {videos.map((video, index) => (
                      <SortableVideoItem
                        key={video.id}
                        video={video}
                        index={index}
                        editingVideoId={editingVideoId}
                        editingVideoTitle={editingVideoTitle}
                        setEditingVideoId={setEditingVideoId}
                        setEditingVideoTitle={setEditingVideoTitle}
                        onApprove={handleApproveVideo}
                        onReject={handleRejectVideo}
                        onDelete={handleDeleteVideo}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
              {isLoadingMore && (
                <div className="text-center py-4 text-gray-500">加载中...</div>
              )}
              {!videoHasMore && videos.length > 0 && (
                <div className="text-center py-4 text-gray-400">
                  没有更多数据了
                </div>
              )}
            </div>
          </Card>
        );
      case "users":
        return (
          <Card
            title="用户管理"
            extra={
              <Space>
                {recentOperation && (
                  <Button
                    type="default"
                    icon={<RotateCcw className="w-4 h-4" />}
                    onClick={handleUndo}
                    className="flex items-center"
                  >
                    撤销
                  </Button>
                )}
              </Space>
            }
          >
            {/* 表头 */}
            <div className="hidden lg:flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700 text-sm">
              <div className="w-10"></div>
              <div className="flex-1 grid grid-cols-[80px_1fr_150px] gap-4">
                <div>ID</div>
                <div>用户名</div>
                <div>操作</div>
              </div>
            </div>
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="max-h-150 overflow-y-auto"
            >
              {isLoading && (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              )}
              {!isLoading && users.length === 0 && (
                <div className="text-center py-8 text-gray-400">暂无数据</div>
              )}
              {!isLoading && users.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleUserDragEnd}
                >
                  <SortableContext
                    items={users.map((u) => u.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {users.map((user, index) => (
                      <SortableUserItem
                        key={user.id}
                        user={user}
                        index={index}
                        editingUserId={editingUserId}
                        editingUsername={editingUsername}
                        editingPassword={editingPassword}
                        showPassword={showPassword}
                        setEditingUserId={setEditingUserId}
                        setEditingUsername={setEditingUsername}
                        setEditingPassword={setEditingPassword}
                        setShowPassword={setShowPassword}
                        onDelete={handleDeleteUser}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
              {isLoadingMore && (
                <div className="text-center py-4 text-gray-500">加载中...</div>
              )}
              {!userHasMore && users.length > 0 && (
                <div className="text-center py-4 text-gray-400">
                  没有更多数据了
                </div>
              )}
            </div>
          </Card>
        );
      case "categories":
        return (
          <Card
            title="分类管理"
            extra={
              <Space>
                {recentOperation && (
                  <Button
                    type="default"
                    icon={<RotateCcw className="w-4 h-4" />}
                    onClick={handleUndo}
                    className="flex items-center"
                  >
                    撤销
                  </Button>
                )}
                <Button
                  type="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleAddCategory}
                >
                  添加分类
                </Button>
              </Space>
            }
          >
            {/* 表头 */}
            <div className="hidden lg:flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700 text-sm">
              <div className="w-10"></div>
              <div className="flex-1 grid grid-cols-[80px_1fr_80px_100px] gap-4">
                <div>ID</div>
                <div>分类名称</div>
                <div>状态</div>
                <div>操作</div>
              </div>
            </div>
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="max-h-150 overflow-y-auto"
            >
              {isLoading && (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              )}
              {!isLoading && categories.length === 0 && (
                <div className="text-center py-8 text-gray-400">暂无数据</div>
              )}
              {!isLoading && categories.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleCategoryDragEnd}
                >
                  <SortableContext
                    items={categories.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {categories.map((category, index) => (
                      <SortableCategoryItem
                        key={category.id}
                        category={category}
                        index={index}
                        editingCategoryId={editingCategoryId}
                        editingLabel={editingLabel}
                        setEditingCategoryId={setEditingCategoryId}
                        setEditingLabel={setEditingLabel}
                        onDelete={handleDeleteCategory}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
              {isLoadingMore && (
                <div className="text-center py-4 text-gray-500">加载中...</div>
              )}
              {!categoryHasMore && categories.length > 0 && (
                <div className="text-center py-4 text-gray-400">
                  没有更多数据了
                </div>
              )}
            </div>
          </Card>
        );
      case "sidebar":
        return (
          <Card
            title="侧边栏管理"
            extra={
              <Space>
                {recentOperation && (
                  <Button
                    type="default"
                    icon={<RotateCcw className="w-4 h-4" />}
                    onClick={handleUndo}
                    className="flex items-center"
                  >
                    撤销
                  </Button>
                )}
                <Button
                  type="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleAddSidebarItem}
                >
                  添加项
                </Button>
              </Space>
            }
          >
            {/* 表头 */}
            <div className="hidden lg:flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700 text-sm">
              <div className="w-10"></div>
              <div className="flex-1 grid grid-cols-[80px_1fr_100px_100px_auto] gap-4">
                <div>ID</div>
                <div>名称</div>
                <div>图标</div>
                <div>路径</div>
                <div>状态</div>
              </div>
            </div>
            <div className="max-h-150 overflow-y-auto">
              {isLoading && (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              )}
              {!isLoading && sidebarItems.length === 0 && (
                <div className="text-center py-8 text-gray-400">暂无数据</div>
              )}
              {!isLoading && sidebarItems.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSidebarDragEnd}
                >
                  <SortableContext
                    items={sidebarItems.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {sidebarItems.map((item, index) => (
                      <SortableSidebarItem
                        key={item.id}
                        item={item}
                        index={index}
                        onEdit={handleEditSidebarItem}
                        onDelete={handleDeleteSidebarItem}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </Card>
        );
      case "livestreams":
        return (
          <Card
            title="直播源管理"
            extra={
              <Space>
                <Button
                  type="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".m3u,.m3u8";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        handleUploadM3U(file);
                      }
                    };
                    input.click();
                  }}
                >
                  上传M3U文件
                </Button>
              </Space>
            }
          >
            {/* 表头 */}
            <div className="hidden lg:flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700 text-sm">
              <div className="w-10 shrink-0"></div>
              <div className="flex-1 grid grid-cols-[80px_1fr_80px_120px] gap-4 min-w-0">
                <div>ID</div>
                <div>名称</div>
                <div>状态</div>
                <div>操作</div>
              </div>
            </div>
            <div className="max-h-150 overflow-y-auto">
              {isLoading && (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              )}
              {!isLoading && liveStreams.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  暂无数据，请上传M3U文件
                </div>
              )}
              {!isLoading && liveStreams.length > 0 && (
                <div className="divide-y divide-gray-200">
                  {liveStreams.map((stream) => (
                    <div
                      key={stream.id}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 flex items-center justify-center">
                        <Radio className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 grid grid-cols-[80px_1fr_80px_120px] gap-4 items-center min-w-0">
                        <div className="text-sm text-gray-600 truncate">
                          {stream.id.slice(0, 8)}...
                        </div>
                        <div className="font-medium truncate">
                          {stream.name}
                        </div>
                        <div>
                          <span
                            className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                              stream.active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {stream.active ? "启用" : "禁用"}
                          </span>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            type="link"
                            size="small"
                            danger
                            icon={<Delete className="w-4 h-4" />}
                            onClick={() => handleDeleteLiveStream(stream.id)}
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        );
      case "jsonserver":
        return (
          <JsonServerManager
            jsonServerUrl={jsonServerUrl}
            onUrlChange={setJsonServerUrl}
          />
        );
      default:
        return null;
    }
  };

  // 检测是否为移动端视图
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 1024);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);

    return () => {
      window.removeEventListener("resize", checkMobileView);
    };
  }, []);

  return (
    <ConfigProvider locale={zhCN}>
      <div className="min-h-screen bg-white">
        <Layout>
          {/* 移动端顶部导航条 - 仅移动端显示 */}
          {isMobileView && (
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  icon={<MenuIcon className="w-4 h-4" />}
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="flex items-center justify-center"
                >
                  菜单
                </Button>
                <h1 className="text-lg font-semibold">后台管理</h1>
              </div>
              <Button
                icon={<ArrowLeft className="w-4 h-4" />}
                onClick={() => router.push("/")}
                className="flex items-center justify-center"
              >
                返回首页
              </Button>
            </div>
          )}

          {/* 侧边栏 - 仅桌面端显示 */}
          {!isMobileView && (
            <Sider
              width={200}
              className="bg-white border-r border-gray-200 shrink-0"
            >
              <div className="p-4">
                <Button
                  icon={<ArrowLeft className="w-4 h-4" />}
                  onClick={() => router.push("/")}
                  className="w-full"
                >
                  返回
                </Button>
              </div>
              <Menu
                mode="inline"
                selectedKeys={[selectedMenu]}
                items={menuItems}
                onClick={({ key }) => setSelectedMenu(key)}
                className="h-full border-r-0"
              />
            </Sider>
          )}
          <Content className="p-4 sm:p-6">{renderContent()}</Content>
        </Layout>

        {/* 分类编辑/添加模态框 */}
        <Modal
          title={editingCategory ? "编辑分类" : "添加分类"}
          open={isCategoryModalOpen}
          onCancel={() => setIsCategoryModalOpen(false)}
          footer={null}
        >
          <Form
            form={categoryForm}
            layout="vertical"
            onFinish={handleCategorySubmit}
          >
            <Form.Item
              name="label"
              label="分类名称"
              rules={[{ required: true, message: "请输入分类名称" }]}
            >
              <Input placeholder="请输入分类名称" />
            </Form.Item>
            <Form.Item name="active" initialValue={1} hidden>
              <Input />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingCategory ? "更新" : "添加"}
                </Button>
                <Button onClick={() => setIsCategoryModalOpen(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 侧边栏编辑/添加模态框 */}
        <Modal
          title={editingSidebarItem ? "编辑侧边栏项" : "添加侧边栏项"}
          open={isSidebarModalOpen}
          onCancel={() => setIsSidebarModalOpen(false)}
          footer={null}
        >
          <Form
            form={sidebarForm}
            layout="vertical"
            onFinish={handleSidebarItemSubmit}
          >
            <Form.Item
              name="label"
              label="显示名称"
              rules={[{ required: true, message: "请输入显示名称" }]}
            >
              <Input placeholder="请输入显示名称" />
            </Form.Item>
            <Form.Item
              name="icon_name"
              label="图标名称"
              tooltip="Lucide 图标名称，如 Home, Compass, Heart 等"
            >
              <Input placeholder="请输入图标名称" />
            </Form.Item>
            <Form.Item
              name="path"
              label="路由路径"
              tooltip="如 /, /recommend, /profile 等"
            >
              <Input placeholder="请输入路由路径" />
            </Form.Item>

            <Form.Item name="active" initialValue={1} hidden>
              <Input />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingSidebarItem ? "更新" : "添加"}
                </Button>
                <Button onClick={() => setIsSidebarModalOpen(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Mobile Menu */}
        <AdminMobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          selectedMenu={selectedMenu}
          onMenuSelect={setSelectedMenu}
        />

        {/* Login Form */}
        <LoginForm
          isOpen={isLoginFormOpen}
          onClose={() => setIsLoginFormOpen(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      </div>
    </ConfigProvider>
  );
}
