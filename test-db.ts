import prisma from "./lib/db";

async function test() {
  try {
    const shop = await prisma.shop.findFirst();
    console.log("Shop found:", shop?.domain || "None");
    const count = await prisma.customer.count();
    console.log("Customer count:", count);
  } catch (e) {
    console.error("Test failed:", e);
  } finally {
    process.exit();
  }
}

test();
