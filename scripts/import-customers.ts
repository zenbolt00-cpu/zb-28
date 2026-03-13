import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import prisma from '../lib/db';

dotenv.config();

const SHOP_ID = 'cmmo2q3he0000gyuemfwdy2z9';
const CSV_FILE = path.join(process.cwd(), 'customers_export.csv');

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
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const headers = parseCSVLine(lines[0]);

  console.log(`Found ${lines.length - 1} customers. Importing...`);

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const clean = (val: string) => val ? val.replace(/^'/, '').trim() : '';
    
    const customerId = clean(row[0]);
    const firstName = clean(row[1]);
    const lastName = clean(row[2]);
    const email = clean(row[3]) || null;
    const rawPhone = clean(row[13]) || clean(row[12]) || null;
    const phone = normalizePhone(rawPhone);
    
    const address1 = clean(row[6]);
    const address2 = clean(row[7]);
    const city = clean(row[8]);
    const province = clean(row[9]);
    const zip = clean(row[11]);
    const countryCharge = clean(row[10]);
    const defaultAddress = `${address1} ${address2}, ${city}, ${province} ${zip}, ${countryCharge}`
      .replace(/\s+/g, ' ')
      .replace(/, ,/g, ',')
      .trim();

    try {
      await prisma.customer.upsert({
        where: { 
          shopifyId: customerId,
        },
        update: {
          email,
          name: `${firstName} ${lastName}`.trim(),
          phone,
          defaultAddress,
          ordersCount: parseInt(row[16]) || 0,
          totalSpent: parseFloat(row[15]) || 0,
        },
        create: {
          shopId: SHOP_ID,
          shopifyId: customerId,
          email,
          name: `${firstName} ${lastName}`.trim(),
          phone,
          defaultAddress,
          ordersCount: parseInt(row[16]) || 0,
          totalSpent: parseFloat(row[15]) || 0,
        }
      });
    } catch (error) {
      console.error(`Error importing customer ${customerId}:`, error);
    }
  }

  console.log('Customer import completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
