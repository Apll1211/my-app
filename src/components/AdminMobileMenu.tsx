"use client";

import * as AntdIcons from "@ant-design/icons";
import { Radio } from "lucide-react";
import type { MenuProps } from "antd";
import { Drawer, Menu } from "antd";
import { useEffect, useState } from "react";

interface AdminMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMenu: string;
  onMenuSelect: (key: string) => void;
}

interface AdminMenuItem {
  key: string;
  label: string;
  icon_name: string;
}

export default function AdminMobileMenu({
  isOpen,
  onClose,
  selectedMenu,
  onMenuSelect,
}: AdminMobileMenuProps) {
  const [menuItems, setMenuItems] = useState<MenuProps["items"]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 从数据库加载菜单项
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch("/api/admin/menu");
        const data = await response.json();
        
        if (data.items) {
          const items: MenuProps["items"] = data.items.map((item: AdminMenuItem) => {
            // 动态获取图标组件
            const IconComponent = (AntdIcons as any)[item.icon_name];
            
            return {
              key: item.key,
              label: item.label,
              icon: IconComponent ? <IconComponent /> : null,
            };
          });
          setMenuItems(items);
        }
      } catch (error) {
        console.error("Failed to fetch admin menu items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  return (
    <Drawer
      title="后台管理"
      placement="left"
      onClose={onClose}
      open={isOpen}
      size="default"
      styles={{
        body: { padding: 0 },
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={[selectedMenu]}
        items={menuItems}
        onClick={({ key }) => {
          onMenuSelect(key);
          onClose();
        }}
        className="h-full border-r-0"
      />
    </Drawer>
  );
}
