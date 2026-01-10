"use client";

import { motion } from "framer-motion";
import { FolderOpen, Upload, X } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FolderSelectorProps {
  onFolderSelect: (files: File[]) => void;
}

export default function FolderSelector({
  onFolderSelect,
}: FolderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const videoFiles = files.filter((file) => {
      const extension = file.name.toLowerCase().split(".").pop();
      return ["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(
        extension || "",
      );
    });

    setSelectedFiles(videoFiles);
  };

  const handleConfirm = () => {
    if (selectedFiles.length > 0) {
      onFolderSelect(selectedFiles);
      setIsOpen(false);
      setSelectedFiles([]);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setSelectedFiles([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <FolderOpen className="h-4 w-4" />
          <span>选择视频文件夹</span>
        </motion.button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>选择视频文件夹</DialogTitle>
          <DialogDescription>
            选择包含视频文件的文件夹，系统将自动加载其中的视频文件
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Upload Area */}
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 hover:border-primary/50 transition-colors">
            <motion.div
              animate={{ y: [0, -10] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
              className="mb-4"
            >
              <Upload className="h-12 w-12 text-muted-foreground" />
            </motion.div>
            <p className="text-sm text-muted-foreground mb-4">
              点击下方按钮选择文件夹
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                {...({ webkitdirectory: "", directory: "" } as any)}
                multiple
                className="hidden"
                onChange={handleFolderSelect}
              />
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <FolderOpen className="h-4 w-4" />
                <span>浏览文件夹</span>
              </motion.button>
            </label>
          </div>

          {/* Selected Files Info */}
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-muted p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">
                  已选择 {selectedFiles.length} 个视频文件
                </p>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedFiles([])}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
              <div className="max-h-32 overflow-y-auto scrollbar-thin">
                {selectedFiles.slice(0, 5).map((file, _index) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    className="text-xs text-muted-foreground truncate"
                  >
                    {file.name}
                  </div>
                ))}
                {selectedFiles.length > 5 && (
                  <div className="text-xs text-muted-foreground">
                    ...还有 {selectedFiles.length - 5} 个文件
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            取消
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleConfirm}
            disabled={selectedFiles.length === 0}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认加载
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
