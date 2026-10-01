const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

// Proveer distintas opciones de conexion a Supabase Postgres
const connectionStrings = [
  'postgres://postgres:olia3msc.11@db.npexwuliagbobqteosxk.supabase.co:5432/postgres',
  'postgres://postgres.npexwuliagbobqteosxk:olia3msc.11@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  'postgres://postgres.npexwuliagbobqteosxk:olia3msc.11@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
  'postgres://postgres.npexwuliagbobqteosxk:olia3msc.11@aws-0-sa-east-1.pooler.supabase.com:6543/postgres'
];

async function run() {
  let connected = false;
  for (const connStr of connectionStrings) {
    console.log(`Intentando conectar a: ${connStr.replace(/:olia3msc\.11@/, ':****@')}...`);
    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });
    try {
      await client.connect();
      console.log("¡Conexión exitosa a la base de datos de Supabase!");
      console.log("Ejecutando script schema.sql...");
      await client.query(sql);
      console.log("¡Script SQL ejecutado correctamente en Supabase!");
      await client.end();
      connected = true;
      break;
    } catch (err) {
      console.log("Error de conexión:", err.message);
      try { await client.end(); } catch(e) {}
    }
  }

  if (!connected) {
    console.log("\nNo se pudo conectar directamente por PG port. Probando vía REST API o preparando verificación...");
  }
}

run();
