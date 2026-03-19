import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/db";
import { AuthOptions } from "next-auth";

// Shopify Storefront API customer access token
async function shopifyCustomerLogin(email: string, password: string) {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const storefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
  
  if (!storeDomain || !storefrontToken) {
    throw new Error("Shopify configuration missing");
  }

  const query = `
    mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const res = await fetch(`https://${storeDomain}/api/2024-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontToken,
    },
    body: JSON.stringify({
      query,
      variables: { input: { email, password } },
    }),
  });

  const data = await res.json();
  const result = data?.data?.customerAccessTokenCreate;

  if (result?.customerUserErrors?.length > 0) {
    throw new Error(result.customerUserErrors[0].message);
  }

  if (!result?.customerAccessToken?.accessToken) {
    throw new Error("Invalid credentials");
  }

  // Fetch customer details using the access token
  const customerQuery = `
    query {
      customer(customerAccessToken: "${result.customerAccessToken.accessToken}") {
        id
        firstName
        lastName
        email
        phone
      }
    }
  `;

  const customerRes = await fetch(`https://${storeDomain}/api/2024-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontToken,
    },
    body: JSON.stringify({ query: customerQuery }),
  });

  const customerData = await customerRes.json();
  return customerData?.data?.customer;
}

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
        try {
          if (!credentials?.phone || !credentials?.otp) {
            console.warn("[AUTH] Missing phone or OTP in credentials");
            return null;
          }
          
          // Validate phone: must have at least 10 digits when stripped
          const phoneDigits = credentials.phone.replace(/\D/g, "");
          if (phoneDigits.length < 10) {
            console.error(`[AUTH] Invalid phone number provided: ${credentials.phone}`);
            throw new Error("Invalid phone number. Must be at least 10 digits.");
          }

          // Mock OTP verification — replace with SMS provider (Twilio, etc.) in production
          // User requested to keep this logic for now but make it "fully functional"
          if (credentials.otp !== "123456") {
            console.warn(`[AUTH] Invalid OTP attempt for phone: ${credentials.phone}`);
            throw new Error("Invalid OTP");
          }

          // Normalize: extract last 10 digits for lookup
          const normalizedPhone = phoneDigits.slice(-10);
          // Keep the full international number for storage
          const fullPhone = credentials.phone.startsWith('+') ? credentials.phone : `+${phoneDigits}`;

          console.log(`[AUTH] Attempting OTP login for phone: ${fullPhone} (normalized: ${normalizedPhone})`);

          let customer = await prisma.customer.findFirst({
            where: { 
              OR: [
                { phone: credentials.phone },
                { phone: normalizedPhone },
                { phone: `+91${normalizedPhone}` },
                { phone: fullPhone },
              ]
            },
          });

          if (!customer) {
            console.log(`[AUTH] Customer not found for ${fullPhone}. Creating new customer...`);
            let shop = await prisma.shop.findFirst();
            if (!shop) {
              console.log("[AUTH] No shop found. Creating a default shop to allow login.");
              shop = await prisma.shop.create({
                data: {
                  domain: process.env.SHOPIFY_STORE_DOMAIN || "zicabella.myshopify.com",
                  accessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN || "default_token",
                }
              });
            }

            customer = await prisma.customer.create({
              data: {
                phone: fullPhone,
                shopId: shop.id,
                shopifyId: `otp_${Date.now()}`,
                name: "New User",
              },
            });
            console.log(`[AUTH] New customer created: ${customer.id}`);
          } else {
            console.log(`[AUTH] Existing customer found: ${customer.id}`);
          }

          return {
            id: customer.id,
            name: customer.name ?? "User",
            email: customer.email ?? undefined,
            phone: customer.phone,
            image: (customer as any).image ?? undefined,
          };
        } catch (error: any) {
          console.error("[AUTH] OTP authorize error:", error);
          throw error;
        }
      },
    }),
    CredentialsProvider({
      id: "shopify-customer",
      name: "Shopify Account",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const shopifyCustomer = await shopifyCustomerLogin(
            credentials.email,
            credentials.password
          );

          if (!shopifyCustomer) {
            throw new Error("Invalid email or password");
          }

          // Find or create customer in local DB
          let customer = await prisma.customer.findFirst({
            where: { email: shopifyCustomer.email },
          });

          if (!customer) {
            let shop = await prisma.shop.findFirst();
            if (!shop) {
              console.log("[AUTH] No shop found. Creating a default shop to allow login.");
              shop = await prisma.shop.create({
                data: {
                  domain: process.env.SHOPIFY_STORE_DOMAIN || "zicabella.myshopify.com",
                  accessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN || "default_token",
                }
              });
            }

            customer = await prisma.customer.create({
              data: {
                email: shopifyCustomer.email,
                name: `${shopifyCustomer.firstName || ""} ${shopifyCustomer.lastName || ""}`.trim() || "Shopify User",
                phone: shopifyCustomer.phone || null,
                shopId: shop.id,
                shopifyId: shopifyCustomer.id,
              },
            });
          }

          return {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            image: (customer as any).image,
          };
        } catch (error: any) {
          console.error("[AUTH] Shopify authorize error:", error);
          throw new Error(error.message || "Login failed");
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        let customer = await prisma.customer.findFirst({
          where: { email },
        });

        if (!customer) {
          let shop = await prisma.shop.findFirst();
          if (!shop) {
            console.log("[AUTH] No shop found. Creating a default shop to allow login.");
            shop = await prisma.shop.create({
              data: {
                domain: process.env.SHOPIFY_STORE_DOMAIN || "zicabella.myshopify.com",
                accessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN || "default_token",
              }
            });
          }

          await prisma.customer.create({
            data: {
              email,
              name: user.name,
              shopId: shop.id,
              shopifyId: `google_${Date.now()}`,
              image: user.image,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        try {
          const userId = (session.user as any).id || token.sub || token.id;
          
          if (userId) {
            const customer = await prisma.customer.findFirst({
              where: { 
                OR: [
                  { id: userId as string },
                  { shopifyId: userId as string },
                  ...(session.user.email ? [{ email: session.user.email }] : []),
                ]
              },
              include: {
                communityMember: true,
              }
            });
            
            if (customer) {
              (session as any).customer = customer;
              (session.user as any).id = customer.id;
              (session.user as any).phone = customer.phone;
              (session as any).customerId = customer.id;
            }
          }
        } catch (error) {
          console.error("[AUTH] Session callback error:", error);
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
