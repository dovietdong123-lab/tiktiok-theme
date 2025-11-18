// Session storage for admin authentication
// In production, use Redis or database

interface Session {
  userId: number
  username: string
  expires: number
}

export const sessions = new Map<string, Session>()

// Clean expired sessions periodically
setInterval(() => {
  const now = Date.now()
  for (const [token, session] of sessions.entries()) {
    if (session.expires < now) {
      sessions.delete(token)
    }
  }
}, 60 * 60 * 1000) // Clean every hour

