import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { supabase } from './supabase'

async function refreshAccessToken(token: any) {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type:    'refresh_token',
        refresh_token: token.refreshToken,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw data
    return {
      ...token,
      accessToken:  data.access_token,
      expiresAt:    Math.floor(Date.now() / 1000) + data.expires_in,
      refreshToken: data.refresh_token ?? token.refreshToken,
      error:        undefined,
    }
  } catch (err) {
    console.error('Token refresh failed:', err)
    return { ...token, error: 'RefreshAccessTokenError' }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/webmasters.readonly',
            'https://www.googleapis.com/auth/analytics.readonly',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign-in: persist tokens from Google OAuth response
      if (account) {
        return {
          ...token,
          accessToken:  account.access_token,
          refreshToken: account.refresh_token,
          expiresAt:    account.expires_at,
        }
      }

      // Token still valid (with 60s buffer)
      if (token.expiresAt && Date.now() / 1000 < (token.expiresAt as number) - 60) {
        return token
      }

      // Token expired — refresh it
      return await refreshAccessToken(token)
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.user.id = token.sub!
      // Expose refresh errors so the client can prompt re-login
      if ((token as any).error) {
        (session as any).error = (token as any).error
      }
      return session
    },
    async signIn({ user, account }) {
      if (!user.email) return false
      try {
        const { error } = await supabase.from('users').upsert({
          id: user.id || account?.providerAccountId,
          email: user.email,
          name: user.name,
          avatar_url: user.image,
          google_access_token: account?.access_token,
          google_refresh_token: account?.refresh_token,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' })
        if (error) console.error('Supabase upsert error:', error)
      } catch (e) {
        console.error('signIn callback error:', e)
      }
      return true
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
})
