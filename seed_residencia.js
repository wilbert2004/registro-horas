const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres:olia3msc.11@db.npexwuliagbobqteosxk.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // Asegurar indice unico para user_id y date
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS unique_user_date_idx ON public.time_logs (user_id, date);
  `);

  // Obtener todos los practicantes
  const resUsers = await client.query(`SELECT id, full_name FROM public.profiles WHERE role = 'practicante';`);
  const practicantes = resUsers.rows;

  if (practicantes.length === 0) {
    console.log("No se encontraron usuarios practicantes.");
    await client.end();
    return;
  }

  const startDate = new Date("2026-08-28T00:00:00");
  const endDate = new Date("2026-10-01T00:00:00");

  const entryOptions = ["10:00", "10:05", "10:12", "10:18", "10:25", "10:30"];
  const exitOptions = ["16:00", "16:20", "16:30", "16:45", "17:00", "17:05"];

  for (const user of practicantes) {
    console.log(`Poblando historial para practicante: ${user.full_name} (${user.id})...`);

    let cur = new Date(startDate);
    let insertedCount = 0;

    while (cur <= endDate) {
      const dayOfWeek = cur.getDay(); // 0 = Dom, 6 = Sáb
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Solo Lunes a Viernes
        const dateStr = cur.toISOString().split('T')[0];

        const entryT = entryOptions[Math.floor(Math.random() * entryOptions.length)];
        const exitT = exitOptions[Math.floor(Math.random() * exitOptions.length)];
        const lunchStartT = "13:00";
        const lunchEndT = "14:00";

        const [enH, enM] = entryT.split(':').map(Number);
        const [exH, exM] = exitT.split(':').map(Number);
        const totalMinutes = (exH * 60 + exM) - (enH * 60 + enM) - 60;
        const hours = Math.max(0, parseFloat((totalMinutes / 60).toFixed(2)));
        const extraHours = hours > 8.0 ? parseFloat((hours - 8.0).toFixed(2)) : 0;

        await client.query(`
          INSERT INTO public.time_logs (user_id, date, entry_time, lunch_start, lunch_end, exit_time, hours, extra_hours, status_type, description)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'normal', 'Residencia profesional')
          ON CONFLICT (user_id, date) DO UPDATE SET
            entry_time = EXCLUDED.entry_time,
            lunch_start = EXCLUDED.lunch_start,
            lunch_end = EXCLUDED.lunch_end,
            exit_time = EXCLUDED.exit_time,
            hours = EXCLUDED.hours,
            extra_hours = EXCLUDED.extra_hours,
            status_type = EXCLUDED.status_type,
            description = EXCLUDED.description;
        `, [user.id, dateStr, entryT, lunchStartT, lunchEndT, exitT, hours, extraHours]);

        insertedCount++;
      }
      cur.setDate(cur.getDate() + 1);
    }

    console.log(`¡Insertados ${insertedCount} días de residencia para ${user.full_name}!`);
  }

  await client.end();
}

run().catch(console.error);
