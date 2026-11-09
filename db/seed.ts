import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { ajustesSitio, bloquesSemana } from "./schema";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  try {
    await db
      .insert(ajustesSitio)
      .values({ id: 1, nombre: "Florería" })
      .onConflictDoNothing();
    const yaHayHorario = await db
      .select({ id: bloquesSemana.id })
      .from(bloquesSemana)
      .limit(1);

    if (yaHayHorario.length === 0) {
      const lunesASabado = [1, 2, 3, 4, 5, 6].flatMap((dia) => [
        { diaSemana: dia, inicio: "09:00", fin: "12:00" },
        { diaSemana: dia, inicio: "12:00", fin: "16:00" },
        { diaSemana: dia, inicio: "16:00", fin: "19:00" },
      ]);
      const domingo = [{ diaSemana: 0, inicio: "10:00", fin: "14:00" }];

      await db
        .insert(bloquesSemana)
        .values(
          [...lunesASabado, ...domingo].map((b) => ({
            ...b,
            minutosCierre: 30,
            capacidad: 15,
          })),
        );
      console.log("Horario semanal inicial cargado");
    }
    console.log("Ajustes iniciales listos");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
