import { TwitterApi, type SendTweetV2Params } from "twitter-api-v2"

export async function publishToTwitter(
  content: string,
  mediaUrls: string[],
  accessToken: string
): Promise<{ platformPostId?: string; error?: string }> {
  try {
    const client = new TwitterApi(accessToken)

    const mediaIds: string[] = []

    // Upload media if present
    if (mediaUrls.length > 0) {
      for (const url of mediaUrls) {
        try {
          const imageRes = await fetch(url)
          const buffer = Buffer.from(await imageRes.arrayBuffer())

          const mediaId = await client.v1.uploadMedia(buffer, {
            mimeType: "image/jpeg",
          })
          mediaIds.push(mediaId)
        } catch (e) {
          console.error("Twitter media upload failed:", e)
        }
      }
    }

    const tweetPayload: SendTweetV2Params = { text: content }

    if (mediaIds.length > 0) {
      // Twitter API accepts 1-4 media IDs as a tuple
      tweetPayload.media = {
        media_ids: mediaIds.slice(0, 4) as unknown as [string],
      }
    }

    const tweet = await client.v2.tweet(tweetPayload)

    return { platformPostId: tweet.data.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Twitter publish error:", message)
    return { error: message }
  }
}
