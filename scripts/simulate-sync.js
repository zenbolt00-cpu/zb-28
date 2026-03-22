const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

async function simulateAuthorize() {
  const credentials = { phone: '9222212222', otp: '123456' };
  const phoneDigits = credentials.phone.replace(/\D/g, "");
  const normalizedPhone = phoneDigits.slice(-10);
  const fullPhone = `+91${normalizedPhone}`;

  console.log(`[SIM] Starting simulation for ${fullPhone}`);

  const domain = process.env.SHOPIFY_STORE_DOMAIN || '8tiahf-bk.myshopify.com';
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '';
  const API_VERSION = '2025-01';

  async function shopifyFetch(endpoint, params) {
    const url = new URL(`https://${domain}/admin/api/${API_VERSION}/${endpoint}`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), {
      headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' }
    });
    return res.json();
  }

  async function searchCustomerByPhone(phone) {
    let data = await shopifyFetch('customers/search.json', { query: `phone:${phone}` });
    if (data.customers && data.customers[0]) return data.customers[0];
    data = await shopifyFetch('customers/search.json', { query: `${phone}` });
    return data.customers ? data.customers[0] : null;
  }

  async function fetchOrdersByCustomerId(customerId) {
    const data = await shopifyFetch(`customers/${customerId}/orders.json`, { status: 'any' });
    return data.orders || [];
  }

  try {
    const shopifyCustomer = await searchCustomerByPhone(fullPhone) || await searchCustomerByPhone(normalizedPhone);
    
    if (shopifyCustomer) {
      console.log(`[SIM] Found Shopify customer: ${shopifyCustomer.id}`);
      
      let shop = await prisma.shop.findFirst();
      if (!shop) {
        shop = await prisma.shop.create({ data: { domain, accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || token } });
      }

      const customer = await prisma.customer.upsert({
        where: { shopifyId: String(shopifyCustomer.id) },
        create: {
          shopifyId: String(shopifyCustomer.id),
          shopId: shop.id,
          email: shopifyCustomer.email,
          name: `${shopifyCustomer.first_name || ""} ${shopifyCustomer.last_name || ""}`.trim() || shopifyCustomer.email?.split("@")[0] || "User",
          phone: shopifyCustomer.phone || fullPhone,
          ordersCount: shopifyCustomer.orders_count || 0,
          totalSpent: parseFloat(shopifyCustomer.total_spent || "0"),
        },
        update: {
          name: `${shopifyCustomer.first_name || ""} ${shopifyCustomer.last_name || ""}`.trim() || shopifyCustomer.email?.split("@")[0] || "User",
        }
      });

      console.log(`[SIM] Local customer state: ${JSON.stringify(customer, null, 2)}`);

      const shopifyOrders = await fetchOrdersByCustomerId(String(shopifyCustomer.id));
      console.log(`[SIM] Found ${shopifyOrders.length} orders in Shopify`);
      
      for (const o of shopifyOrders) {
        const dbOrder = await prisma.order.upsert({
          where: { shopifyOrderId: String(o.id) },
          create: {
            shopId: shop.id,
            shopifyOrderId: String(o.id),
            customerId: customer.id,
            status: 'active',
            totalPrice: parseFloat(o.total_price || '0'),
            currency: o.currency || 'INR',
            paymentStatus: o.financial_status || 'pending',
            fulfillmentStatus: o.fulfillment_status || 'unfulfilled',
            createdAt: new Date(o.created_at),
          },
          update: {}
        });
        console.log(`[SIM] Order ${o.id} synced: ${dbOrder.id}`);
      }
      
      console.log(`[SIM] Simulation complete. DB is now populated.`);
    } else {
      console.error(`[SIM] Customer NOT found in Shopify.`);
    }
  } catch (err) {
    console.error(`[SIM] Error: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

simulateAuthorize();
