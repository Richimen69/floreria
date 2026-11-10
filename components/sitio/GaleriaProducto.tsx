"use client";

import Image from "next/image";
import { ViewTransition, useState } from "react";

export function GaleriaProducto({
  id,
  imagenes,
  nombre,
}: {
  id: number;
  imagenes: string[];
  nombre: string;
}) {
  const [actual, setActual] = useState(0);

  if (imagenes.length === 0) {
    return <div className="aspect-square rounded-tarjeta bg-primario-suave" />;
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-tarjeta bg-primario-suave">
        <ViewTransition name={`foto-producto-${id}`} share="foto-producto">
          <Image
            src={imagenes[actual]}
            alt={nombre}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </ViewTransition>
      </div>

      {imagenes.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {imagenes.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActual(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={`relative aspect-square overflow-hidden rounded-xl ring-2 transition ${
                i === actual
                  ? "ring-primario"
                  : "ring-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="20vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
