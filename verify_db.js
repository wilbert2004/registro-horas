const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres:olia3msc.11@db.npexwuliagbobqteosxk.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function test() {
  await client.connect();
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `);
  console.log("Tablas creadas en Supabase:", tables.rows.map(r => r.table_name));

  const funcs = await client.query(`
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name = 'get_totals_per_practicante';
  `);
  console.log("Función RPC encontrada:", funcs.rows.map(r => r.routine_name));

  await client.end();
}

test().catch(console.error);
