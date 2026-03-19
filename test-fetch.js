async function main() {
  try {
    const res = await fetch('http://localhost:3000/api/admin/inventory/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'ZB26GG02TSXS', mode: 'STOCK_IN' })
    });
    const data = await res.json();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}
main();
