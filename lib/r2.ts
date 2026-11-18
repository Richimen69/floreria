import 'server-only'
import { DeleteObjectCommand, PutObjectCommand, S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function subirArchivoR2(clave: string, contenido: Buffer, tipo: string) {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: clave,
      Body: contenido,
      ContentType: tipo,
      // Cada archivo tiene nombre único, así que se puede cachear para siempre
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )
  return `${process.env.R2_PUBLIC_URL}/${clave}`
}

export async function eliminarArchivoR2(clave: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: clave }))
}

export async function subirArchivoPrivadoR2(clave: string, contenido: Buffer, tipo: string) {
  await r2.send(
    new PutObjectCommand({ Bucket: process.env.R2_BUCKET_PRIVADO, Key: clave, Body: contenido, ContentType: tipo }),
  )
}

// Enlace que solo funciona unos minutos
export async function urlTemporalPrivada(clave: string, segundos = 300) {
  return getSignedUrl(r2, new GetObjectCommand({ Bucket: process.env.R2_BUCKET_PRIVADO, Key: clave }), {
    expiresIn: segundos,
  })
}