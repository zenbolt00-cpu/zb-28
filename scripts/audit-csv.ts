import * as fs from 'fs';
import * as path from 'path';

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

const customersFile = path.join(process.cwd(), 'customers_export.csv');
const ordersFile = path.join(process.cwd(), 'orders_export_1.csv');

const customerEmails = new Set<string>();
const customerPhones = new Set<string>();

const customerContent = fs.readFileSync(customersFile, 'utf-8');
const customerLines = customerContent.split('\n').filter(l => l.trim());
for (let i = 1; i < customerLines.length; i++) {
  const row = parseCSVLine(customerLines[i]);
  const email = row[3]?.trim();
  const phone = row[13]?.replace(/^'/, '').trim() || row[12]?.replace(/^'/, '').trim();
  if (email) customerEmails.add(email.toLowerCase());
  if (phone) customerPhones.add(phone);
}

const orderContent = fs.readFileSync(ordersFile, 'utf-8');
const orderLines = orderContent.split('\n');
const ordersMap = new Map<string, any>();

let currentBuffer = "";
const orderRows: string[][] = [];
for (let i = 1; i < orderLines.length; i++) {
  const line = orderLines[i];
  currentBuffer += (currentBuffer ? "\n" : "") + line;
  const quoteCount = (currentBuffer.match(/"/g) || []).length;
  if (quoteCount % 2 === 0) {
    orderRows.push(parseCSVLine(currentBuffer));
    currentBuffer = "";
  }
}

let unlinked = 0;
let totalUniqueOrders = 0;
const processedOrders = new Set<string>();

for (const row of orderRows) {
  if (row.length < 56) continue;
  const orderId = row[55];
  if (processedOrders.has(orderId)) continue;
  processedOrders.add(orderId);
  totalUniqueOrders++;

  const email = row[1]?.trim().toLowerCase();
  const phone = row[70]?.replace(/^'/, '').trim();

  const hasEmailMatch = email && customerEmails.has(email);
  const hasPhoneMatch = phone && customerPhones.has(phone);

  if (!hasEmailMatch && !hasPhoneMatch) {
    unlinked++;
    if (unlinked < 10) {
        console.log(`Unlinked Order: ${orderId} | Email: ${email} | Phone: ${phone}`);
    }
  }
}

console.log(`\nAudit Summary:`);
console.log(`Total Customers in CSV: ${customerLines.length - 1}`);
console.log(`Total Unique Orders in CSV: ${totalUniqueOrders}`);
console.log(`Unlinked Orders (no customer match): ${unlinked}`);
