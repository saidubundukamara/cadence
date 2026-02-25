export async function publishToYouTube(
  content: string,
  youtubeVideoId: string | null,
  accessToken: string
): Promise<{ platformPostId?: string; error?: string }> {
  if (!youtubeVideoId) {
    return { error: "No video uploaded for YouTube" }
  }

  try {
    // Parse content: first line = title, rest = description
    const lines = content.split("\n")
    const title = (lines[0] || "").slice(0, 100)
    const description = lines.slice(1).join("\n").trim().slice(0, 5000)

    // Update video metadata and set to public
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/videos?part=snippet,status",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: youtubeVideoId,
          snippet: {
            title: title || "Untitled",
            description,
            categoryId: "22", // People & Blogs
          },
          status: {
            privacyStatus: "public",
          },
        }),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error("YouTube publish failed:", errText)
      return { error: `YouTube API error: ${res.status}` }
    }

    return { platformPostId: youtubeVideoId }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("YouTube publish error:", message)
    return { error: message }
  }
}
