import "server-only";
import { connection } from "next/server";
import {
  evaluarFecha,
  proximasFechasDisponibles,
  type Ahora,
} from "@/lib/calendario";
import { horaEnAcapulco, hoyEnAcapulco, sumarDias } from "@/lib/fechas";
import { obtenerConfigCalendario } from "@/server/consultas/calendario";

// La hora cambia en cada visita: nunca se pre-renderiza
export async function ahoraEnAcapulco(): Promise<Ahora> {
  await connection();
  const ahora = new Date();
  return { fecha: hoyEnAcapulco(ahora), hora: horaEnAcapulco(ahora) };
}

// TODO: cuando existan los pedidos, contar aquí los pedidos (web y manuales) por bloque
async function ocupacionDeFecha(
  _fecha: string,
): Promise<Record<string, number>> {
  return {};
}

export async function diaDeEntrega(fecha: string, fechaMinima?: string) {
  const [config, ahora, ocupacion] = await Promise.all([
    obtenerConfigCalendario(),
    ahoraEnAcapulco(),
    ocupacionDeFecha(fecha),
  ]);
  return evaluarFecha(config, fecha, ahora, ocupacion, fechaMinima);
}

export async function proximosDias(cantidad: number) {
  const [config, ahora] = await Promise.all([
    obtenerConfigCalendario(),
    ahoraEnAcapulco(),
  ]);
  return Array.from({ length: cantidad }, (_, i) =>
    evaluarFecha(config, sumarDias(ahora.fecha, i), ahora),
  );
}
export async function siguientesFechasDisponibles(
  cantidad: number,
  fechaMinima?: string,
) {
  const [config, ahora] = await Promise.all([
    obtenerConfigCalendario(),
    ahoraEnAcapulco(),
  ]);
  return proximasFechasDisponibles(config, ahora, cantidad, { fechaMinima });
}
