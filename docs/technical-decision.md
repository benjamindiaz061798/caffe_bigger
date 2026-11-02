# Decisión técnica: Bigger Compras

- Aplicación: PWA adaptable, priorizando teléfono y uso habitual del dueño o encargado.
- Interfaz: JavaScript / JSX, React y CSS. Next.js ejecuta y publica la aplicación.
- Datos: PostgreSQL en Supabase; acceso por Supabase Auth y membresías con RLS.
- Compra: un proveedor por pedido; cantidades expresadas en unidades de compra, con presentación explícita.
- WhatsApp: mensaje prellenado mediante wa.me; el encargado confirma el envío dentro de WhatsApp. No se utiliza una API de envío automático.
- Historial: snapshots de productos y proveedor; repetición crea una preparación nueva. Solo un borrador puede actualizarse.
- Instalación: manifiesto e iconos PWA, HTTPS; sin prometer sincronización offline.
- Publicación: GitHub y Vercel; rama nueva para conservar la versión anterior.
- Mejoras posteriores: dictado, dashboard e incorporación de facturas.

Proyecto Supabase conectado: Bigger Compras (`usvxhrijwupttqoecvsi`), plan gratuito, región São Paulo. Seis tablas de negocio con RLS y una lista privada de cuentas autorizadas. Acceso inicial del encargado aprovisionado; el endpoint temporal de inicialización está cerrado.
