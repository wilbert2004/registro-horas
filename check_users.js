const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres:olia3msc.11@db.npexwuliagbobqteosxk.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query(`SELECT id, full_name, role FROM public.profiles;`);
  console.log("Usuarios en profiles:", res.rows);
  await client.end();
}

run().catch(console.error);
