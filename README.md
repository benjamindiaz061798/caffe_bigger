# Bigger Compras

Plataforma móvil para preparar pedidos de una cafetería a sus proveedores. El enfoque anterior de venta al público permanece en la rama `main`; esta implementación se desarrolla en `codex/compras-proveedores`.

## Alcance implementado

- Registro, edición, archivo y reactivación de proveedores y productos.
- Catálogo por proveedor con presentación y unidad de compra. Cajas, paquetes y botellas aceptan enteros; kilos y litros admiten hasta tres decimales.
- Preparación en tres pasos: proveedor, productos/cantidades y revisión del mensaje.
- Borradores recuperables, historial, repetición como un pedido nuevo y copias históricas de nombres y presentaciones.
- Mensajes para copiar o abrir en WhatsApp. El encargado presiona Enviar en WhatsApp. La plataforma solo registra una confirmación manual, nunca infiere entrega o envío por abrir un enlace.
- PWA con iconos, manifiesto, entrada breve animada, navegación móvil y preferencia de movimiento reducido.

Voz, dashboard analítico, facturas, pagos e inventario no forman parte de esta versión.

## Desarrollo

Usa Node.js 24 LTS, también declarado en `package.json` para Vercel. La versión instalada del cliente Supabase requiere Node.js 22 o posterior.

```sh
npm install
npm run dev -- --port 3001
npm test
npm run build
```

`NEXT_BUILD_DIR` permite separar el directorio de la compilación y el del servidor de desarrollo. `.next` es el directorio predeterminado, compatible con la configuración automática de Vercel.

## Demostración y espacio conectado

Sin configuración de Supabase se abre una **demostración local claramente identificada**. Incluye proveedores ficticios sin teléfono. Los cambios e historial se guardan en este navegador (`localStorage`), no hay cuentas privadas ni sincronización. La opción Mi espacio permite exportar una copia JSON. No ingreses datos privados en un dispositivo compartido.

El espacio conectado requiere la configuración siguiente. Su integración está implementada; no se considera desplegada una base de datos real hasta aplicar la migración y configurar un proyecto propio.

1. Crea un proyecto en Supabase y ejecuta una vez `supabase/migrations/202611020001_purchasing.sql` en su editor SQL. También puedes aplicar la migración mediante Supabase CLI.
2. Desactiva el registro público de nuevos usuarios en la configuración de Authentication de Supabase y crea el primer usuario autorizado desde **Authentication → Users**. La aplicación no ofrece registro público; desactivarlo también en el servicio evita altas directas mediante su API.
3. Copia `.env.example` a `.env.local` y configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o la clave `anon` heredada). Estas son claves públicas destinadas al cliente; nunca uses una clave secreta o `service_role` aquí.
4. Reinicia el servidor. Ingresa con el usuario creado y crea el espacio de la cafetería en el primer acceso.
5. Para autorizar al encargado en el mismo espacio, crea su usuario en Authentication y agrega desde el editor SQL una fila de `memberships` con el UUID del espacio, el UUID del usuario y el rol `buyer`. Esa operación corresponde al administrador; los usuarios no pueden concederse permisos a otro espacio.
6. En Vercel configura las mismas variables para el entorno de despliegue y vuelve a desplegar: las variables `NEXT_PUBLIC_` se incorporan durante la compilación.

## Datos y permisos

PostgreSQL mantiene espacios, membresías, proveedores, productos, pedidos y detalles. RLS restringe los datos a los miembros autenticados. Los usuarios no tienen permisos directos para escribir pedidos o membresías: funciones transaccionales controlan la creación del espacio, el guardado y la confirmación manual.

El servidor valida proveedor, productos, cantidades y unidades, y toma las descripciones desde la base de datos. El guardado es atómico, conserva el historial, mantiene el orden de las líneas y evita duplicados al reintentar una preparación. Archivar un proveedor o producto conserva los pedidos anteriores. Repetir filtra los productos archivados y avisa al usuario.

## Instalación y conexión

Abre la aplicación mediante HTTPS. En Chrome compatible puede ofrecer instalación; en iPhone utiliza Safari → Compartir → Agregar a pantalla de inicio. El servicio worker guarda únicamente los iconos y la pantalla informativa sin conexión. **No almacena páginas privadas, contactos, respuestas de Supabase ni peticiones de escritura.** El espacio conectado necesita internet. Los borradores en este dispositivo no implican sincronización sin conexión.

## Verificación

`npm test` ejecuta pruebas de reglas de compra y la migración en PostgreSQL embebido (PGlite). Incluye aislamiento entre dos espacios, permisos anónimos, intentos de elevar privilegios, integridad entre proveedores, cantidades, atomicidad, idempotencia, borradores y conservación histórica. Estas pruebas no sustituyen la comprobación final con el proyecto Supabase conectado.

## Diseño

Componentes propios con iconos de Lucide. Referencias revisadas: Animate UI, Uiverse, ForgeUI, Uilora, Vengeance UI y 60fps.design. No se copiaron componentes premium ni se crearon cuentas para estas referencias. La entrada animada y las microinteracciones se implementan con CSS para evitar peso innecesario.
