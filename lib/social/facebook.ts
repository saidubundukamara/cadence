export async function publishToFacebook(
  content: string,
  mediaUrls: string[],
  pageId: string,
  pageToken: string
): Promise<{ platformPostId?: string; error?: string }> {
  try {
    let result

    if (mediaUrls.length > 0) {
      // Post with photo
      const params = new URLSearchParams({
        url: mediaUrls[0],
        caption: content,
        access_token: pageToken,
      })

      const res = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/photos`,
        {
          method: "POST",
          body: params,
        }
      )

      result = await res.json()

      if (result.error) {
        return { error: result.error.message }
      }

      return { platformPostId: result.id || result.post_id }
    } else {
      // Text-only post
      const params = new URLSearchParams({
        message: content,
        access_token: pageToken,
      })

      const res = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/feed`,
        {
          method: "POST",
          body: params,
        }
      )

      result = await res.json()

      if (result.error) {
        return { error: result.error.message }
      }

      return { platformPostId: result.id }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Facebook publish error:", message)
    return { error: message }
  }
}
