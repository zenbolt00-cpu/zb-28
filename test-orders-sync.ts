import { fetchAllOrders, getShopConfig } from './lib/shopify-admin';

async function test() {
  const config = await getShopConfig();
  console.log('Testing Shopify Sync for:', config.domain);
  try {
    const orders = await fetchAllOrders(250, 'any');
    console.log('Orders found:', orders.length);
    if (orders.length > 0) {
      console.log('First order:', JSON.stringify(orders[0], null, 2));
    }
  } catch (e) {
    console.error('Error fetching orders:', e);
  }
}

test();
