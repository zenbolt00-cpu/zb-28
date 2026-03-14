import { fetchOrdersCount, fetchProductsCount, fetchCustomersCount, getShopConfig } from '../lib/shopify-admin';
import 'dotenv/config';

async function testConnection() {
  console.log('--- SHOPIFY CONNECTION TEST ---');
  try {
    const config = await getShopConfig();
    console.log('Config Domain:', config.domain);
    console.log('Config Token starts with:', config.accessToken ? config.accessToken.substring(0, 10) + '...' : 'MISSING');

    console.log('Fetching counts from Shopify...');
    const [orders, products, customers] = await Promise.all([
      fetchOrdersCount(),
      fetchProductsCount(),
      fetchCustomersCount(),
    ]);

    console.log('Orders Count:', orders);
    console.log('Products Count:', products);
    console.log('Customers Count:', customers);
    
    if (orders === 0 && products === 0 && customers === 0) {
      console.warn('Warning: All counts are zero. This might indicate an empty store or a permission issue (though 200 OK was received).');
    } else {
      console.log('Success: Connection verified and data found.');
    }
  } catch (err: any) {
    console.error('Connection Test Failed:');
    console.error('Message:', err.message);
    if (err.stack) console.error('Stack:', err.stack);
  }
}

testConnection();
