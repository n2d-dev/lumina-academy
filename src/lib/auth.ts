import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

/**
 * NextAuth configuration
 * Hỗ trợ: Email/Password, Google, GitHub
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 ngày
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Vui lòng nhập email và mật khẩu');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.password) {
          throw new Error('Email không tồn tại');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Mật khẩu không đúng');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(process.env.GITHUB_ID
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Lúc đăng nhập: lưu id/role + mốc thời gian phát hành token (pwcAt).
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.pwcAt = Date.now();
        return token;
      }

      // Các request sau: vô hiệu hóa token nếu mật khẩu đã đổi SAU khi token phát hành.
      // Đây là cơ chế revoke thật sự cho JWT strategy (không có Session table để xóa).
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, passwordChangedAt: true },
        });
        if (
          dbUser?.passwordChangedAt &&
          typeof token.pwcAt === 'number' &&
          dbUser.passwordChangedAt.getTime() > token.pwcAt
        ) {
          return {} as typeof token; // token cũ hơn lần đổi mật khẩu → invalid
        }
        if (dbUser) token.role = dbUser.role; // giữ role luôn fresh
      }
      return token;
    },
    async session({ session, token }) {
      // token rỗng (đã bị vô hiệu hóa) → trả session không có user
      if (!token?.id) {
        return { ...session, user: undefined } as unknown as typeof session;
      }
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};
