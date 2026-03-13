import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import prisma from '../lib/db';

dotenv.config();

const SHOP_ID = 'cmmo2q3he0000gyuemfwdy2z9';
const CSV_FILE = path.join(process.cwd(), 'orders_export_1.csv');

function parseCSVLine(line: string) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return cleaned.slice(2);
  }
  return cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
}

async function main() {
  const content = fs.readFileSync(CSV_FILE, 'utf-8');
  // Handle multiline notes in CSV by carefully splitting
  const lines = content.split('\n');
  const headers = parseCSVLine(lines[0]);
  
  const ordersMap = new Map<string, any[]>();

  console.log('Parsing CSV and grouping lines by order ID...');
  
  // Skip header, group lines by 'Id' (column index 55)
  // Wait, let's verify header index for Id.
  // Name=0, Email=1, Financial Status=2, ..., Id=55
  
  let currentBuffer = "";
  let inQuotes = false;
  const rows: string[][] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    currentBuffer += (currentBuffer ? "\n" : "") + line;
    
    // Check if we have an even number of quotes (line ended)
    const quoteCount = (currentBuffer.match(/"/g) || []).length;
    if (quoteCount % 2 === 0) {
      rows.push(parseCSVLine(currentBuffer));
      currentBuffer = "";
    }
  }

  for (const row of rows) {
    if (row.length < 56) continue;
    const orderId = row[55];
    if (!ordersMap.has(orderId)) {
      ordersMap.set(orderId, []);
    }
    ordersMap.get(orderId)!.push(row);
  }

  console.log(`Found ${ordersMap.size} unique orders. Importing...`);

  const entries = Array.from(ordersMap.entries());
  for (const [orderId, orderRows] of entries) {
    const clean = (val: string) => val ? val.replace(/^'/, '').trim() : '';

    const firstRow = orderRows[0];
    const email = clean(firstRow[1]);
    const rawPhone = clean(firstRow[70]);
    const phone = normalizePhone(rawPhone);
    
    // Find customer by email or phone
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          email ? { email: email } : { id: 'non-existent' },
          phone ? { phone: phone } : { id: 'non-existent' }
        ]
      }
    });

    if (!customer) {
      // console.warn(`Customer not found for order ${orderId} (${email}). Skipping order.`);
      continue;
    }

    const shippingAddress = `${clean(firstRow[36])} ${clean(firstRow[37])}, ${clean(firstRow[39])}, ${clean(firstRow[41])} ${clean(firstRow[40])}, ${clean(firstRow[42])}`
      .replace(/\s+/g, ' ')
      .replace(/, ,/g, ',')
      .trim();
    const billingAddress = `${clean(firstRow[26])} ${clean(firstRow[27])}, ${clean(firstRow[29])}, ${clean(firstRow[31])} ${clean(firstRow[30])}, ${clean(firstRow[32])}`
      .replace(/\s+/g, ' ')
      .replace(/, ,/g, ',')
      .trim();

    try {
      const dbOrder = await prisma.order.upsert({
        where: { shopifyOrderId: orderId },
        update: {
          status: firstRow[2] + " / " + firstRow[4],
          totalPrice: parseFloat(firstRow[11]) || 0,
          subtotalPrice: parseFloat(firstRow[8]) || 0,
          totalTax: parseFloat(firstRow[10]) || 0,
          currency: firstRow[7] || 'INR',
          paymentStatus: firstRow[2] || 'pending',
          fulfillmentStatus: firstRow[4] || 'unfulfilled',
          shippingAddress,
          billingAddress,
          note: firstRow[44] || null,
          createdAt: new Date(firstRow[15]) || new Date(),
        },
        create: {
          shopId: SHOP_ID,
          shopifyOrderId: orderId,
          customerId: customer.id,
          status: firstRow[2] + " / " + firstRow[4],
          totalPrice: parseFloat(firstRow[11]) || 0,
          subtotalPrice: parseFloat(firstRow[8]) || 0,
          totalTax: parseFloat(firstRow[10]) || 0,
          currency: firstRow[7] || 'INR',
          paymentStatus: firstRow[2] || 'pending',
          fulfillmentStatus: firstRow[4] || 'unfulfilled',
          deliveryStatus: 'pending',
          shippingAddress,
          billingAddress,
          note: firstRow[44] || null,
          createdAt: new Date(firstRow[15]) || new Date(),
        }
      });

      // Clear existing items and re-add (to handle updates)
      await prisma.orderItem.deleteMany({ where: { orderId: dbOrder.id } });

      for (const row of orderRows) {
        const itemSku = row[20] || 'no-sku';
        const itemTitle = row[17];
        const quantity = parseInt(row[16]) || 0;
        const price = parseFloat(row[18]) || 0;

        await prisma.orderItem.create({
          data: {
            orderId: dbOrder.id,
            shopifyLineItemId: `${orderId}-${itemSku}-${Math.random().toString(36).substr(2, 5)}`, // Generate fake unique item ID
            title: itemTitle,
            quantity,
            price,
            sku: itemSku,
          }
        });
      }
    } catch (error) {
      console.error(`Error importing order ${orderId}:`, error);
    }
  }

  console.log('Order import completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
