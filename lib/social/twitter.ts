import { TwitterApi, type SendTweetV2Params } from "twitter-api-v2"
import { splitIntoThread } from "@/lib/twitter-thread"

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

    const chunks = splitIntoThread(content)

    // Post first tweet (with media attached)
    const firstPayload: SendTweetV2Params = { text: chunks[0] }

    if (mediaIds.length > 0) {
      firstPayload.media = {
        media_ids: mediaIds.slice(0, 4) as unknown as [string],
      }
    }

    const firstTweet = await client.v2.tweet(firstPayload)
    let lastTweetId = firstTweet.data.id

    // Post remaining chunks as replies
    for (let i = 1; i < chunks.length; i++) {
      const reply = await client.v2.tweet({
        text: chunks[i],
        reply: { in_reply_to_tweet_id: lastTweetId },
      })
      lastTweetId = reply.data.id
    }

    return { platformPostId: firstTweet.data.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Twitter publish error:", message)
    return { error: message }
  }
}
