export interface VideoItem {
  key: string;
  id: string;
  title: string;
  author: string;
  views: number;
  likes: number;
  status: string;
  createTime: string;
}

export interface UserItem {
  key: string;
  id: string;
  username: string;
}

export interface CategoryItem {
  key: string;
  id: string;
  label: string;
  sort_order: number;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface SidebarItem {
  key: string;
  id: string;
  label: string | null;
  icon_name: string | null;
  path: string | null;
  sort_order: number;
  item_type: "button" | "divider";
  active: number;
  created_at: string;
  updated_at: string;
}
