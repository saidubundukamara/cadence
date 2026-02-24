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

    // Step 1: Create media container
    const containerParams = new URLSearchParams({
      image_url: mediaUrls[0],
      caption: content,
      access_token: pageToken,
    })

    const containerRes = await fetch(
      `https://graph.facebook.com/v21.0/${igAccountId}/media`,
      {
        method: "POST",
        body: containerParams,
      }
    )

    const containerData = await containerRes.json()

    if (containerData.error) {
      return { error: containerData.error.message }
    }

    const containerId = containerData.id

    // Step 2: Wait for container to be ready (poll status)
    let ready = false
    let attempts = 0
    const maxAttempts = 20

    while (!ready && attempts < maxAttempts) {
      const statusRes = await fetch(
        `https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${pageToken}`
      )
      const statusData = await statusRes.json()

      if (statusData.status_code === "FINISHED") {
        ready = true
      } else if (statusData.status_code === "ERROR") {
        return { error: "Instagram media processing failed" }
      } else {
        // Wait 2 seconds before polling again
        await new Promise((resolve) => setTimeout(resolve, 2000))
        attempts++
      }
    }

    if (!ready) {
      return { error: "Instagram media processing timed out" }
    }

    // Step 3: Publish the container
    const publishParams = new URLSearchParams({
      creation_id: containerId,
      access_token: pageToken,
    })

    const publishRes = await fetch(
      `https://graph.facebook.com/v21.0/${igAccountId}/media_publish`,
      {
        method: "POST",
        body: publishParams,
      }
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
