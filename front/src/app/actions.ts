"use server"

import { createClient } from "@libsql/client"

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

export async function authenticate(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  if (!username || !password) {
    return { error: "Please provide both username and password" }
  }

  try {
    const result = await client.execute({
      sql: "SELECT * FROM users WHERE username = ?",
      args: [username]
    })

    if (result.rows.length === 0) {
      return { error: "Invalid credentials" }
    }

    const user = result.rows[0] as any

    if (user.password !== password) {
      return { error: "Invalid credentials" }
    }

    return { success: true }
  } catch (error) {
    console.error("Authentication error:", error)
    return { error: "Failed to authenticate. Please try again later." }
  }
}