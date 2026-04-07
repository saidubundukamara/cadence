const FROM = process.env.RESEND_FROM_EMAIL || "Cadence <notifications@cadence.app>"

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping email to", to)
    return
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend API error: ${err}`)
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`

  await sendEmail(
    email,
    "Verify your Cadence email",
    `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #18181b;">Verify your email</h2>
      <p style="color: #3f3f46; line-height: 1.6;">
        Click the button below to verify your email address and activate your Cadence account.
      </p>
      <a href="${url}" style="display: inline-block; background: #18181b; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 16px 0;">
        Verify Email
      </a>
      <p style="color: #a1a1aa; font-size: 12px;">
        This link expires in 24 hours. If you didn't create a Cadence account, you can ignore this email.
      </p>
    </div>
    `
  )
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

  await sendEmail(
    email,
    "Reset your Cadence password",
    `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #18181b;">Reset your password</h2>
      <p style="color: #3f3f46; line-height: 1.6;">
        Click the button below to reset your Cadence password.
      </p>
      <a href="${url}" style="display: inline-block; background: #18181b; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 16px 0;">
        Reset Password
      </a>
      <p style="color: #a1a1aa; font-size: 12px;">
        This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.
      </p>
    </div>
    `
  )
}
