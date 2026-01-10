"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileVideo, Loader2, Plus, Upload, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// 表单验证 schema
const videoUploadSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(100, "标题不能超过100个字符"),
  description: z.string().max(500, "描述不能超过500个字符").optional(),
  tags: z.string().optional(),
});

type VideoUploadFormValues = z.infer<typeof videoUploadSchema>;

interface VideoUploadFormProps {
  author: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function VideoUploadForm({
  author,
  onSuccess,
  onCancel,
}: VideoUploadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<VideoUploadFormValues>({
    resolver: zodResolver(videoUploadSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: "",
    },
  });

  // 添加标签
  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      setValue("tags", newTags.join(","));
      setTagInput("");
    }
  };

  // 移除标签
  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    setValue("tags", newTags.join(","));
  };

  // 处理标签输入回车
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  // 处理视频文件选择
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      const allowedTypes = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/x-matroska",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("不支持的文件类型，请上传 MP4、MOV、AVI 或 MKV 格式的视频");
        return;
      }

      // 验证文件大小（100MB）
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("不支持提交大于 100M 的文件");
        return;
      }

      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  // 移除视频文件
  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview("");
  };

  // 提交表单
  const onSubmit = async (data: VideoUploadFormValues) => {
    if (!videoFile) {
      alert("请选择视频文件");
      return;
    }

    setIsSubmitting(true);
    try {
      // 创建 FormData
      const formData = new FormData();
      formData.append("file", videoFile);
      formData.append("title", data.title);
      formData.append("author", author);
      formData.append("description", data.description || "");
      formData.append("tags", tags.join(","));

      const response = await fetch("/api/videos", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onSuccess?.();
      } else {
        alert(result.error || "投稿失败");
      }
    } catch (error) {
      console.error("Failed to submit video:", error);
      alert("投稿失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 标题 */}
      <div className="space-y-2">
        <Label htmlFor="title">
          标题 <span className="text-destructive">*</span>
        </Label>
        <Input id="title" placeholder="请输入视频标题" {...register("title")} />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* 描述 */}
      <div className="space-y-2">
        <Label htmlFor="description">视频介绍</Label>
        <textarea
          id="description"
          placeholder="请输入视频介绍（可选）"
          className="flex min-h-30 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* 标签 */}
      <div className="space-y-2">
        <Label htmlFor="tags">标签</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            placeholder="输入标签后按回车添加"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
          />
          <Button type="button" variant="outline" size="icon" onClick={addTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* 标签列表 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 视频文件上传 */}
      <div className="space-y-2">
        <Label htmlFor="videoFile">
          视频文件 <span className="text-destructive">*</span>
        </Label>
        {!videoFile ? (
          <div className="border-2 border-dashed border-border rounded-lg p-8 hover:border-primary/50 transition-colors">
            <input
              id="videoFile"
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska"
              onChange={handleVideoChange}
              className="hidden"
            />
            <label
              htmlFor="videoFile"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                点击或拖拽上传视频文件
              </p>
              <p className="text-xs text-muted-foreground">
                支持 MP4、MOV、AVI、MKV 格式，最大 100MB
              </p>
            </label>
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileVideo className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{videoFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={removeVideo}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {videoPreview && (
              <video
                src={videoPreview}
                className="w-full rounded-lg max-h-48 object-contain bg-black"
                controls
                muted
              >
                <track kind="captions" />
              </video>
            )}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              提交中...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              提交投稿
            </>
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            取消
          </Button>
        )}
      </div>
    </form>
  );
}
