export async function publishToFacebook(
  content: string,
  mediaUrls: string[],
  pageId: string,
  pageToken: string
): Promise<{ platformPostId?: string; error?: string }> {
  try {
    // Separate images and videos
    const videoUrls = mediaUrls.filter((url) =>
      /\.(mp4|mov|avi|wmv)$/i.test(url)
    )
    const imageUrls = mediaUrls.filter(
      (url) => !/\.(mp4|mov|avi|wmv)$/i.test(url)
    )

    // Video post (Facebook Reel / video post)
    if (videoUrls.length > 0) {
      return publishVideoPost(content, videoUrls[0], pageId, pageToken)
    }

    // Multi-photo post
    if (imageUrls.length > 1) {
      return publishMultiPhotoPost(content, imageUrls, pageId, pageToken)
    }

    // Single photo post
    if (imageUrls.length === 1) {
      return publishSinglePhotoPost(content, imageUrls[0], pageId, pageToken)
    }

    // Text-only post
    return publishTextPost(content, pageId, pageToken)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Facebook publish error:", message)
    return { error: message }
  }
}

async function publishTextPost(
  content: string,
  pageId: string,
  pageToken: string
) {
  const params = new URLSearchParams({
    message: content,
    access_token: pageToken,
  })

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}/feed`,
    { method: "POST", body: params }
  )

  const data = await res.json()
  if (data.error) return { error: data.error.message }
  return { platformPostId: data.id }
}

async function publishSinglePhotoPost(
  content: string,
  imageUrl: string,
  pageId: string,
  pageToken: string
) {
  const params = new URLSearchParams({
    url: imageUrl,
    caption: content,
    access_token: pageToken,
  })

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}/photos`,
    { method: "POST", body: params }
  )

  const data = await res.json()
  if (data.error) return { error: data.error.message }
  return { platformPostId: data.id || data.post_id }
}

async function publishMultiPhotoPost(
  content: string,
  imageUrls: string[],
  pageId: string,
  pageToken: string
) {
  // Step 1: Upload each photo as unpublished
  const photoIds: string[] = []

  for (const url of imageUrls) {
    const params = new URLSearchParams({
      url,
      published: "false",
      access_token: pageToken,
    })

    const res = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/photos`,
      { method: "POST", body: params }
    )

    const data = await res.json()
    if (data.error) {
      console.error("Facebook photo upload failed:", data.error.message)
      continue
    }
    photoIds.push(data.id)
  }

  if (photoIds.length === 0) {
    return { error: "Failed to upload any photos" }
  }

  // Step 2: Create post with attached photos
  const params = new URLSearchParams({
    message: content,
    access_token: pageToken,
  })

  photoIds.forEach((id, i) => {
    params.append(`attached_media[${i}]`, JSON.stringify({ media_fbid: id }))
  })

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}/feed`,
    { method: "POST", body: params }
  )

  const data = await res.json()
  if (data.error) return { error: data.error.message }
  return { platformPostId: data.id }
}

async function publishVideoPost(
  content: string,
  videoUrl: string,
  pageId: string,
  pageToken: string
) {
  const params = new URLSearchParams({
    file_url: videoUrl,
    description: content,
    access_token: pageToken,
  })

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}/videos`,
    { method: "POST", body: params }
  )

  const data = await res.json()
  if (data.error) return { error: data.error.message }
  return { platformPostId: data.id }
}
