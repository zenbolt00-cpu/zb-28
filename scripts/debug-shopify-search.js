const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

async function debug() {
  const phone = '9222212222';
  const normalizedPhone = phone.slice(-10);
  const fullPhone = `+91${normalizedPhone}`;
  
  console.log(`Searching for: ${fullPhone} and ${normalizedPhone}`);

  const domain = process.env.SHOPIFY_STORE_DOMAIN || 'zica-bella.myshopify.com';
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!token) {
    console.error('No SHOPIFY_ADMIN_ACCESS_TOKEN found');
    return;
  }

  const searchUrl = `https://${domain}/admin/api/2025-01/customers/search.json?query=phone:${fullPhone}`;
  console.log(`URL: ${searchUrl}`);

  const res = await fetch(searchUrl, {
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json'
    }
  });

  const data = await res.json();
  console.log('Search Results for full phone:', JSON.stringify(data, null, 2));

  const searchUrl2 = `https://${domain}/admin/api/2025-01/customers/search.json?query=phone:${normalizedPhone}`;
  const res2 = await fetch(searchUrl2, {
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json'
    }
  });
  const data2 = await res2.json();
  console.log('Search Results for normalized phone:', JSON.stringify(data2, null, 2));
  
  const searchUrl3 = `https://${domain}/admin/api/2025-01/customers/search.json?query=${normalizedPhone}`;
  const res3 = await fetch(searchUrl3, {
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json'
    }
  });
  const data3 = await res3.json();
  console.log('Search Results for general query:', JSON.stringify(data3, null, 2));
}

debug();
