import './cafe.css'
export const metadata = { title: 'Caffe Bigger — Tu pausa, un poquito más grande', description: 'Descubre la carta de Caffe Bigger: café, pastelería, sándwiches y fajitas. Explora sus ingredientes y encuentra tu próxima pausa favorita.' }
export default function RootLayout({ children }) {
  return <html lang="es-CL"><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap" /></head><body>{children}</body></html>
}
