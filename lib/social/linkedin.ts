export async function publishToLinkedIn(
  content: string,
  mediaUrls: string[],
  accessToken: string,
  personId: string
): Promise<{ platformPostId?: string; error?: string }> {
  try {
    const author = `urn:li:person:${personId}`
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202401",
      "X-Restli-Protocol-Version": "2.0.0",
    }

    // Try to upload images if present
    const imageUrns: string[] = []
    if (mediaUrls.length > 0) {
      for (const url of mediaUrls) {
        try {
          // Initialize upload
          const initRes = await fetch(
            "https://api.linkedin.com/rest/images?action=initializeUpload",
            {
              method: "POST",
              headers,
              body: JSON.stringify({
                initializeUploadRequest: {
                  owner: author,
                },
              }),
            }
          )

          if (!initRes.ok) continue

          const initData = await initRes.json()
          const uploadUrl = initData.value?.uploadUrl
          const imageUrn = initData.value?.image

          if (!uploadUrl || !imageUrn) continue

          // Download image and upload to LinkedIn
          const imageRes = await fetch(url)
          const imageBuffer = Buffer.from(await imageRes.arrayBuffer())

          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/octet-stream",
            },
            body: imageBuffer,
          })

          if (uploadRes.ok) {
            imageUrns.push(imageUrn)
          }
        } catch (e) {
          console.error("LinkedIn image upload failed:", e)
        }
      }
    }

    // Build post body
    const postBody: Record<string, unknown> = {
      author,
      commentary: content,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
      },
      lifecycleState: "PUBLISHED",
    }

    if (imageUrns.length === 1) {
      postBody.content = {
        media: {
          id: imageUrns[0],
        },
      }
    } else if (imageUrns.length > 1) {
      postBody.content = {
        multiImage: {
          images: imageUrns.map((urn) => ({ id: urn })),
        },
      }
    }

    const postRes = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers,
      body: JSON.stringify(postBody),
    })

    if (!postRes.ok) {
      const errText = await postRes.text()
      console.error("LinkedIn post failed:", errText)
      return { error: `LinkedIn API error: ${postRes.status}` }
    }

    // Post URN is returned in the x-restli-id header
    const postUrn = postRes.headers.get("x-restli-id") || undefined

    return { platformPostId: postUrn }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("LinkedIn publish error:", message)
    return { error: message }
  }
}
