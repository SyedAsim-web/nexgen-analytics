import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { supabase } from './supabase'

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
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.user.id = token.sub!
      return session
    },
    async signIn({ user, account, profile }) {
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
