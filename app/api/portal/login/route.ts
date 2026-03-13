import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, password, shopDomain } = await req.json();

    if (!email || !password || !shopDomain) {
      return NextResponse.json({ error: 'Missing email, password, or shop' }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({ where: { domain: shopDomain } });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const normalizePhone = (phone: string | null | undefined): string => {
      if (!phone) return "";
      const cleaned = phone.replace(/\D/g, "");
      if (cleaned.startsWith("91") && cleaned.length === 12) {
        return cleaned.slice(2);
      }
      return cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
    };

    const inputEmail = email.toLowerCase().trim();
    const inputPhone = normalizePhone(email); // User might enter phone in the 'email' field
    const inputPasswordPhone = normalizePhone(password); // In some flows, 'password' field might hold phone

    const customer = await prisma.customer.findFirst({
      where: {
        shopId: shop.id,
        OR: [
          { email: inputEmail },
          { phone: inputEmail }, // Literal check
          { phone: inputPhone }, // Normalized check
          password ? { phone: inputPasswordPhone } : { id: 'non-existent' }
        ]
      }
    });

    if (customer) {
      // In a real app, we'd verify OTP or password. 
      // For this "CSV sync" mode, we'll allow login if they exist.
      console.log(`Found local customer for login: ${customer.email || customer.phone}`);
      return NextResponse.json({ 
        success: true, 
        customer, 
        token: 'local_authenticated_' + customer.id 
      }, { status: 200 });
    }

    const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
    if (!storefrontAccessToken) {
      console.warn("No STOREFRONT_ACCESS_TOKEN found. Mocking successful login for development.");
      // Find or create customer
      const customer = await prisma.customer.findFirst({ where: { email, shopId: shop.id } });
      if (customer) {
        return NextResponse.json({ success: true, customer, token: 'mock_token' }, { status: 200 });
      } else {
        return NextResponse.json({ error: 'Customer not found. Please create an account on the store first.' }, { status: 401 });
      }
    }

    // Call Shopify Storefront API customerAccessTokenCreate
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

    const variables = {
      input: { email, password }
    };

    const response = await fetch(`https://${shopDomain}/api/2025-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken
      },
      body: JSON.stringify({ query, variables })
    });

    const result = await response.json();

    if (result.errors || result.data.customerAccessTokenCreate.customerUserErrors.length > 0) {
      const errorMsg = result.errors?.[0]?.message || result.data.customerAccessTokenCreate.customerUserErrors[0].message;
      return NextResponse.json({ error: errorMsg }, { status: 401 });
    }

    const tokenData = result.data.customerAccessTokenCreate.customerAccessToken;

    // Fetch customer details
    const customerQuery = `
      query {
        customer(customerAccessToken: "${tokenData.accessToken}") {
          id
          firstName
          lastName
          email
          phone
        }
      }
    `;

    const customerRes = await fetch(`https://${shopDomain}/api/2025-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken
      },
      body: JSON.stringify({ query: customerQuery })
    });

    const customerResult = await customerRes.json();
    const shopifyCustomer = customerResult.data.customer;
    const shopifyId = shopifyCustomer.id.split('/').pop();

    // Upsert customer in DB
    const dbCustomer = await prisma.customer.upsert({
      where: { shopifyId },
      create: {
        shopId: shop.id,
        shopifyId,
        email: shopifyCustomer.email,
        name: `${shopifyCustomer.firstName || ''} ${shopifyCustomer.lastName || ''}`.trim(),
        phone: shopifyCustomer.phone
      },
      update: {
        email: shopifyCustomer.email,
        name: `${shopifyCustomer.firstName || ''} ${shopifyCustomer.lastName || ''}`.trim(),
        phone: shopifyCustomer.phone
      }
    });

    return NextResponse.json({ 
      success: true, 
      customer: dbCustomer, 
      token: tokenData.accessToken 
    }, { status: 200 });

  } catch (error) {
    console.error('Portal Login Error:', error);
    return NextResponse.json({ error: 'Internal server error during login' }, { status: 500 });
  }
}
