import { PostForm } from "@/components/posts/PostForm"

export default function NewPostPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Post</h1>
        <p className="text-sm text-muted-foreground">
          Compose and schedule a post across your social platforms.
        </p>
      </div>
      <PostForm />
    </div>
  )
}
