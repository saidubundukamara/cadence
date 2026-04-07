import { db } from "@/lib/db"

type CreateNotificationInput = {
  userId: string
  type: "PUBLISH_SUCCESS" | "PUBLISH_FAILURE" | "SYSTEM"
  title: string
  message: string
  postId?: string
}

export async function createNotification(input: CreateNotificationInput) {
  const notification = await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      postId: input.postId,
    },
  })

  // Send email notification if user has opted in
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: {
      email: true,
      notifyOnPublish: true,
      notifyOnFail: true,
    },
  })

  if (!user) return notification

  const shouldEmail =
    (input.type === "PUBLISH_SUCCESS" && user.notifyOnPublish) ||
    (input.type === "PUBLISH_FAILURE" && user.notifyOnFail)

  if (shouldEmail && process.env.RESEND_API_KEY) {
    try {
      await sendEmailNotification(user.email, input.title, input.message)
    } catch (error) {
      console.error("Failed to send email notification:", error)
    }
  }

  return notification
}

async function sendEmailNotification(
  to: string,
  subject: string,
  message: string
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "Cadence <notifications@cadence.app>",
      to: [to],
      subject: `Cadence: ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #18181b;">${subject}</h2>
          <p style="color: #3f3f46; line-height: 1.6;">${message}</p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 12px;">
            You received this because you have email notifications enabled in Cadence.
          </p>
        </div>
      `,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend API error: ${err}`)
  }
}
