/**
 * Import Orders from Shopify CSV Export into the Postgres database.
 * 
 * This script:
 * 1. Reads orders_export_1.csv
 * 2. Creates/upserts customers by email or phone
 * 3. Creates orders with proper line items, shipping addresses, payment info
 * 4. Groups multi-line-item orders (same order number, multiple CSV rows)
 * 
 * Usage: node scripts/import-orders-csv.js
 */

// Load env first
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Determine the Postgres URL
const pgUrl =
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')
    ? process.env.DATABASE_URL
    : undefined);

if (!pgUrl) {
  console.error('✗ No Postgres URL found. Set POSTGRES_PRISMA_URL or POSTGRES_URL.');
  process.exit(1);
}

// Set DATABASE_URL for Prisma
process.env.DATABASE_URL = pgUrl;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let prisma;
try {
  const { PrismaPg } = require('@prisma/adapter-pg');
  const pool = new Pool({
    connectionString: pgUrl,
    ssl: { rejectUnauthorized: false },
  });
  prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
    log: ['error'],
  });
} catch (e) {
  console.error('✗ Prisma init error:', e.message);
  process.exit(1);
}

// ─── CSV Parser (handles quoted fields with embedded commas/newlines) ───
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.length > 1 || currentRow[0] !== '') {
          rows.push(currentRow);
        }
        currentRow = [];
        if (ch === '\r') i++; // skip \n after \r
      } else {
        currentField += ch;
      }
    }
  }
  // Last row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.length > 1 || currentRow[0] !== '') {
      rows.push(currentRow);
    }
  }
  return rows;
}

// Map CSV header to index
function headerMap(headers) {
  const map = {};
  headers.forEach((h, i) => { map[h.trim()] = i; });
  return map;
}

function getVal(row, hMap, key) {
  const idx = hMap[key];
  return idx !== undefined ? (row[idx] || '').trim() : '';
}

function parseFloat2(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function parseInt2(v) {
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : n;
}

function normalizePhone(p) {
  if (!p) return null;
  const digits = p.replace(/\D/g, '');
  if (digits.length >= 10) {
    return '+' + digits;
  }
  return null;
}

function mapFulfillmentToDeliveryStatus(fulfillment, financialStatus, cancelledAt) {
  if (cancelledAt) return 'cancelled';
  const f = (fulfillment || '').toLowerCase();
  if (f === 'fulfilled') return 'delivered';
  if (f === 'partial') return 'shipped';
  return 'pending';
}

function mapFinancialToStatus(financial, cancelledAt) {
  if (cancelledAt) return 'CANCELLED';
  const f = (financial || '').toLowerCase();
  if (f === 'paid') return 'PAID';
  if (f === 'refunded' || f === 'partially_refunded') return 'REFUNDED';
  if (f === 'voided') return 'CANCELLED';
  if (f === 'pending') return 'PENDING';
  return 'PENDING';
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   ZicaBella Order CSV Importer                      ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('  DB:', pgUrl.replace(/:[^:@]+@/, ':***@').substring(0, 80) + '...');

  // Ensure shop exists
  let shop = await prisma.shop.findFirst();
  if (!shop) {
    shop = await prisma.shop.create({
      data: {
        domain: process.env.SHOPIFY_STORE_DOMAIN || '8tiahf-bk.myshopify.com',
        accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
      }
    });
    console.log('✓ Created shop:', shop.domain);
  } else {
    console.log('✓ Using shop:', shop.domain);
  }

  // Read CSV
  const csvPath = path.join(__dirname, '..', 'orders_export_1.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('✗ CSV file not found at:', csvPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, 'utf-8');
  const allRows = parseCSV(raw);
  
  if (allRows.length < 2) {
    console.error('✗ CSV has no data rows');
    process.exit(1);
  }

  const headers = allRows[0];
  const hMap = headerMap(headers);
  const dataRows = allRows.slice(1);

  console.log(`\n📊 CSV has ${dataRows.length} data rows`);

  // Group rows by order name (e.g. #ZB71451)
  const orderGroups = new Map();
  for (const row of dataRows) {
    const orderName = getVal(row, hMap, 'Name');
    if (!orderName) continue;
    if (!orderGroups.has(orderName)) {
      orderGroups.set(orderName, []);
    }
    orderGroups.get(orderName).push(row);
  }

  console.log(`📦 Found ${orderGroups.size} unique orders\n`);

  // Cache for customer resolution
  const customerCache = new Map(); // key: email or phone -> customer record
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const [orderName, rows] of orderGroups) {
    const primaryRow = rows[0]; // First row has the main order data
    
    try {
      const email = getVal(primaryRow, hMap, 'Email');
      const phone = normalizePhone(getVal(primaryRow, hMap, 'Phone') || getVal(primaryRow, hMap, 'Billing Phone'));
      const billingName = getVal(primaryRow, hMap, 'Billing Name');
      const shippingName = getVal(primaryRow, hMap, 'Shipping Name');
      const financialStatus = getVal(primaryRow, hMap, 'Financial Status');
      const fulfillmentStatus = getVal(primaryRow, hMap, 'Fulfillment Status');
      const cancelledAt = getVal(primaryRow, hMap, 'Cancelled at');
      const createdAt = getVal(primaryRow, hMap, 'Created at');
      const totalPrice = parseFloat2(getVal(primaryRow, hMap, 'Total'));
      const subtotal = parseFloat2(getVal(primaryRow, hMap, 'Subtotal'));
      const taxes = parseFloat2(getVal(primaryRow, hMap, 'Taxes'));
      const shipping = parseFloat2(getVal(primaryRow, hMap, 'Shipping'));
      const discountAmount = parseFloat2(getVal(primaryRow, hMap, 'Discount Amount'));
      const discountCode = getVal(primaryRow, hMap, 'Discount Code');
      const currency = getVal(primaryRow, hMap, 'Currency') || 'INR';
      const paymentMethod = getVal(primaryRow, hMap, 'Payment Method');
      const shippingMethod = getVal(primaryRow, hMap, 'Shipping Method');
      const tags = getVal(primaryRow, hMap, 'Tags');
      const notes = getVal(primaryRow, hMap, 'Notes');
      const shopifyId = getVal(primaryRow, hMap, 'Id');

      // Build shopify order ID from order name
      const shopifyOrderId = orderName; // e.g. #ZB71451

      // Check if order already exists
      const existingOrder = await prisma.order.findUnique({
        where: { shopifyOrderId }
      });
      if (existingOrder) {
        skipped++;
        continue;
      }

      // ─── Resolve/Create Customer ───
      const customerKey = email || phone || billingName;
      let customer;
      
      if (customerCache.has(customerKey)) {
        customer = customerCache.get(customerKey);
      } else {
        // Try find existing customer
        const whereConditions = [];
        if (email) whereConditions.push({ email });
        if (phone) whereConditions.push({ phone });
        
        if (whereConditions.length > 0) {
          customer = await prisma.customer.findFirst({
            where: { OR: whereConditions }
          });
        }

        if (!customer) {
          // Create new customer
          const customerShopifyId = shopifyId ? `csv_${shopifyId}` : `csv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          customer = await prisma.customer.create({
            data: {
              shopifyId: customerShopifyId,
              shopId: shop.id,
              email: email || null,
              name: billingName || shippingName || 'Customer',
              phone: phone || null,
            }
          });
        }
        
        if (customerKey) {
          customerCache.set(customerKey, customer);
        }
      }

      // ─── Build Shipping Address JSON ───
      const shippingAddress = JSON.stringify({
        name: shippingName || billingName,
        address1: getVal(primaryRow, hMap, 'Shipping Address1'),
        address2: getVal(primaryRow, hMap, 'Shipping Address2'),
        city: getVal(primaryRow, hMap, 'Shipping City'),
        province: getVal(primaryRow, hMap, 'Shipping Province Name') || getVal(primaryRow, hMap, 'Shipping Province'),
        zip: (getVal(primaryRow, hMap, 'Shipping Zip') || '').replace(/'/g, ''),
        country: getVal(primaryRow, hMap, 'Shipping Country'),
        phone: normalizePhone(getVal(primaryRow, hMap, 'Shipping Phone')) || phone,
      });

      // ─── Build Billing Address JSON ───
      const billingAddress = JSON.stringify({
        name: billingName,
        address1: getVal(primaryRow, hMap, 'Billing Address1'),
        address2: getVal(primaryRow, hMap, 'Billing Address2'),
        city: getVal(primaryRow, hMap, 'Billing City'),
        province: getVal(primaryRow, hMap, 'Billing Province Name') || getVal(primaryRow, hMap, 'Billing Province'),
        zip: (getVal(primaryRow, hMap, 'Billing Zip') || '').replace(/'/g, ''),
        country: getVal(primaryRow, hMap, 'Billing Country'),
        phone: normalizePhone(getVal(primaryRow, hMap, 'Billing Phone')) || phone,
      });

      // ─── Build Line Items ───
      const lineItems = [];
      for (const row of rows) {
        const itemTitle = getVal(row, hMap, 'Lineitem name');
        if (!itemTitle) continue;
        
        const lineItemId = `csv_${orderName}_${lineItems.length}_${Date.now()}`;
        lineItems.push({
          shopifyLineItemId: lineItemId,
          title: itemTitle,
          quantity: parseInt2(getVal(row, hMap, 'Lineitem quantity')) || 1,
          price: parseFloat2(getVal(row, hMap, 'Lineitem price')),
          sku: getVal(row, hMap, 'Lineitem sku') || null,
        });
      }

      if (lineItems.length === 0) {
        skipped++;
        continue;
      }

      // ─── Determine statuses ───
      const orderStatus = mapFinancialToStatus(financialStatus, cancelledAt);
      const deliveryStatus = mapFulfillmentToDeliveryStatus(fulfillmentStatus, financialStatus, cancelledAt);

      // Parse created date
      let orderDate = new Date();
      if (createdAt) {
        const parsed = new Date(createdAt);
        if (!isNaN(parsed.getTime())) {
          orderDate = parsed;
        }
      }

      // Build note with extra info
      const orderNote = [
        notes,
        discountCode ? `Discount: ${discountCode} (-₹${discountAmount})` : '',
        shippingMethod ? `Shipping: ${shippingMethod}` : '',
        paymentMethod ? `Payment: ${paymentMethod}` : '',
      ].filter(Boolean).join(' | ');

      // ─── Create Order ───
      const createdOrder = await prisma.order.create({
        data: {
          shopId: shop.id,
          shopifyOrderId,
          customerId: customer.id,
          status: orderStatus,
          totalPrice,
          subtotalPrice: subtotal || (totalPrice - taxes - shipping),
          totalTax: taxes,
          currency,
          paymentStatus: financialStatus || 'pending',
          fulfillmentStatus: fulfillmentStatus || 'unfulfilled',
          deliveryStatus,
          shippingAddress,
          billingAddress,
          note: orderNote || null,
          tags: tags || null,
          createdAt: orderDate,
          items: {
            create: lineItems
          },
          ...(paymentMethod ? {
            payments: {
              create: {
                customerId: customer.id,
                amount: totalPrice,
                type: financialStatus === 'paid' ? 'PAYMENT' : 'COD',
                status: financialStatus || 'pending',
                gateway: paymentMethod,
              }
            }
          } : {}),
        },
        include: { items: true }
      });

      // ─── Handle Returns for Refunded Orders ───
      if (financialStatus?.toLowerCase().includes('refunded')) {
        const firstItem = createdOrder.items[0];
        if (firstItem) {
          await prisma.return.create({
            data: {
              orderId: createdOrder.id,
              customerId: customer.id,
              productId: firstItem.productId || 'cmmpk2s1k000481uej9u1o3v7', // Fallback to a valid product ID if missing
              reason: 'Refunded in Shopify',
              status: 'REFUNDED',
              refundMethod: 'ORIGINAL',
              refundAmount: totalPrice,
              refundStatus: 'COMPLETED',
              requestedAt: orderDate,
            }
          });
        }
      }

      // Update customer order count
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          ordersCount: { increment: 1 },
          totalSpent: { increment: totalPrice },
        }
      });

      imported++;
      if (imported % 50 === 0) {
        console.log(`  ✓ Imported ${imported} orders...`);
      }
    } catch (err) {
      errors++;
      if (errors <= 10) {
        console.error(`  ✗ Error on ${orderName}:`, err.message);
      }
    }
  }

  console.log('\n════════════════════════════════════════════════');
  console.log(`✅ Imported: ${imported}`);
  console.log(`⏭  Skipped (already exist): ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('════════════════════════════════════════════════\n');

  // Print summary
  const totalOrders = await prisma.order.count();
  const totalCustomers = await prisma.customer.count();
  console.log(`📊 Database now has ${totalOrders} orders and ${totalCustomers} customers`);
}

main()
  .catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
