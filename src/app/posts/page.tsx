import Header from "@/components/layout/Header";

export default function PostsPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <div className="flex-1 pt-28 px-4">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">文章页面</h1>
          <p className="text-muted-foreground">这是博客的文章列表页面</p>
        </div>
      </div>
    </div>
  );
}