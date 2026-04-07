export async function publishToInstagram(
  content: string,
  mediaUrls: string[],
  igAccountId: string,
  pageToken: string
): Promise<{ platformPostId?: string; error?: string }> {
  try {
    // Instagram requires at least one image
    if (mediaUrls.length === 0) {
      return { error: "Instagram requires at least one image" }
    }

    let containerId: string

    if (mediaUrls.length === 1) {
      // Single image post
      containerId = await createSingleContainer(
        igAccountId,
        pageToken,
        mediaUrls[0],
        content
      )
    } else {
      // Carousel post (2-10 images)
      containerId = await createCarouselContainer(
        igAccountId,
        pageToken,
        mediaUrls.slice(0, 10),
        content
      )
    }

    // Wait for container to be ready
    await waitForContainer(containerId, pageToken)

    // Publish the container
    const publishParams = new URLSearchParams({
      creation_id: containerId,
      access_token: pageToken,
    })

    const publishRes = await fetch(
      `https://graph.facebook.com/v21.0/${igAccountId}/media_publish`,
      { method: "POST", body: publishParams }
    )

    const publishData = await publishRes.json()

    if (publishData.error) {
      return { error: publishData.error.message }
    }

    return { platformPostId: publishData.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Instagram publish error:", message)
    return { error: message }
  }
}

async function createSingleContainer(
  igAccountId: string,
  pageToken: string,
  imageUrl: string,
  caption: string
): Promise<string> {
  const isVideo = /\.(mp4|mov|avi|wmv)$/i.test(imageUrl)

  const params = new URLSearchParams({
    caption,
    access_token: pageToken,
  })

  if (isVideo) {
    params.set("media_type", "VIDEO")
    params.set("video_url", imageUrl)
  } else {
    params.set("image_url", imageUrl)
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${igAccountId}/media`,
    { method: "POST", body: params }
  )

  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.id
}

async function createCarouselContainer(
  igAccountId: string,
  pageToken: string,
  mediaUrls: string[],
  caption: string
): Promise<string> {
  // Step 1: Create individual item containers (no caption on items)
  const childIds: string[] = []

  for (const url of mediaUrls) {
    const isVideo = /\.(mp4|mov|avi|wmv)$/i.test(url)
    const params = new URLSearchParams({
      is_carousel_item: "true",
      access_token: pageToken,
    })

    if (isVideo) {
      params.set("media_type", "VIDEO")
      params.set("video_url", url)
    } else {
      params.set("image_url", url)
    }

    const res = await fetch(
      `https://graph.facebook.com/v21.0/${igAccountId}/media`,
      { method: "POST", body: params }
    )

    const data = await res.json()
    if (data.error) throw new Error(data.error.message)

    // Wait for each child to be ready
    await waitForContainer(data.id, pageToken)
    childIds.push(data.id)
  }

  // Step 2: Create carousel container
  const params = new URLSearchParams({
    media_type: "CAROUSEL",
    caption,
    access_token: pageToken,
  })
  // children param needs to be comma-separated
  params.set("children", childIds.join(","))

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${igAccountId}/media`,
    { method: "POST", body: params }
  )

  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.id
}

async function waitForContainer(
  containerId: string,
  pageToken: string,
  maxAttempts = 30
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${pageToken}`
    )
    const data = await res.json()

    if (data.status_code === "FINISHED") return
    if (data.status_code === "ERROR") {
      throw new Error("Instagram media processing failed")
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  throw new Error("Instagram media processing timed out")
}
