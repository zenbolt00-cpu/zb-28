import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/db";
import { AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      id: "otp",
      name: "OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) return null;
        
        // Simple OTP verification logic (In production, use a real SMS service)
        // For development, we'll accept '123456' as OTP
        if (credentials.otp !== "123456") {
            throw new Error("Invalid OTP");
        }

        // Find or create customer
        let customer = await prisma.customer.findFirst({
          where: { phone: credentials.phone },
        });

        if (!customer) {
          // In a real scenario, we'd need a shopId. We'll fetch the first shop for now.
          const shop = await prisma.shop.findFirst();
          if (!shop) throw new Error("No shop configured");

          customer = await prisma.customer.create({
            data: {
              phone: credentials.phone,
              shopId: shop.id,
              shopifyId: `temp_${Date.now()}`, // Temporary ID until synced
              name: "New Customer",
            },
          });
        }

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          image: null,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        let customer = await prisma.customer.findFirst({
          where: { email: email },
        });

        if (!customer) {
          const shop = await prisma.shop.findFirst();
          if (!shop) return false;

          await prisma.customer.create({
            data: {
              email: email,
              name: user.name,
              shopId: shop.id,
              shopifyId: `google_${Date.now()}`,
            },
          });
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session?.user) {
        // Link customer details to session
        const customer = await prisma.customer.findFirst({
          where: {
            OR: [
              { email: session.user.email || "" },
              { id: token.sub || "" }
            ]
          }
        });
        
        if (customer) {
            (session as any).customer = customer;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
