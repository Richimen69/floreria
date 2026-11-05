export function Tarjeta({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-tarjeta border border-borde bg-superficie p-6 shadow-sm ${className}`}
      {...props}
    />
  )
}