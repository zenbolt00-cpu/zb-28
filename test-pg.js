const { Pool } = require('pg');
const url = "postgres://postgres.nymlgypzrafgdkssjkgf:Zb-devop2026@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true";
const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT 1', (err, res) => {
  if (err) console.error("Error:", err.message);
  else console.log("Success");
  pool.end();
});
