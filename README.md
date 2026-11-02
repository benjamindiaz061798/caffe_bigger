# Bigger Compras

Plataforma móvil para preparar pedidos de una cafetería a sus proveedores. El enfoque actual es la gestión de compras a proveedores. El historial de Git conserva la versión anterior de venta al público.

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

El proyecto conectado es **Bigger Compras**, referencia `usvxhrijwupttqoecvsi`, en São Paulo (`sa-east-1`), plan gratuito. Las migraciones de `supabase/migrations` ya están aplicadas en ese proyecto y sus versiones coinciden con el historial remoto. No vuelvas a ejecutar la creación de tablas manualmente sobre él.

La configuración local está en `.env.local`, excluida de Git. Vercel utiliza `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; son datos públicos para el cliente. Nunca coloques una clave secreta o `service_role` en variables `NEXT_PUBLIC_`.

La cuenta inicial del encargado tiene su acceso en `.data/ACCESO-BIGGER.txt`, un archivo privado local excluido de Git. Las contraseñas y tokens no forman parte del repositorio. La inicialización utilizó el SDK administrativo de Auth desde una función protegida de un solo uso; el código administrativo fue sustituido y ese endpoint ahora responde 410.

Para autorizar otro encargado:

1. El administrador agrega su correo normalizado a `private.authorized_accounts` desde Supabase. La tabla no tiene acceso desde el cliente.
2. Crea el usuario desde **Authentication → Users**.
3. Agrega su UUID y el UUID del espacio a `public.memberships` con el rol `buyer`.

El trigger `bigger_authorized_account` rechaza nuevas cuentas cuyo correo no haya sido autorizado, incluso si se intenta utilizar directamente la API de registro. Como protección adicional puede desactivarse el registro público desde la configuración de Authentication; la aplicación no ofrece registro público.

Para un proyecto Supabase nuevo aplica las migraciones en orden, configura las dos variables públicas y crea los usuarios autorizados. La creación del primer espacio utiliza una sesión real; los usuarios siguientes deben vincularse al mismo espacio mediante una membresía.

## Datos y permisos

PostgreSQL mantiene espacios, membresías, proveedores, productos, pedidos y detalles. RLS restringe los datos a los miembros autenticados. Los usuarios no tienen permisos directos para escribir pedidos o membresías: funciones transaccionales privadas controlan la creación del espacio, el guardado y la confirmación manual. Las funciones públicas son envoltorios con SECURITY INVOKER que delegan a esas operaciones; las comprobaciones de usuario y membresía están en la base de datos.

El servidor valida proveedor, productos, cantidades y unidades, y toma las descripciones desde la base de datos. El guardado es atómico, conserva el historial, mantiene el orden de las líneas y evita duplicados al reintentar una preparación. Archivar un proveedor o producto conserva los pedidos anteriores. Repetir filtra los productos archivados y avisa al usuario.

## Instalación y conexión

Abre la aplicación mediante HTTPS. En Chrome compatible puede ofrecer instalación; en iPhone utiliza Safari → Compartir → Agregar a pantalla de inicio. El servicio worker guarda únicamente los iconos y la pantalla informativa sin conexión. **No almacena páginas privadas, contactos, respuestas de Supabase ni peticiones de escritura.** El espacio conectado necesita internet. Los borradores en este dispositivo no implican sincronización sin conexión.

## Verificación

`npm test` ejecuta pruebas de reglas de compra y la migración en PostgreSQL embebido (PGlite). Incluye aislamiento entre dos espacios, permisos anónimos, intentos de elevar privilegios, integridad entre proveedores, cantidades, atomicidad, idempotencia, borradores y conservación histórica. También se ejecutó `supabase/tests/live-purchasing.sql` en la base real, con el contexto del usuario autenticado. Comprueba aislamiento, escrituras, snapshots, reintentos, borradores, cantidades, confirmación y bloqueo anónimo. Los registros de prueba se revierten con ROLLBACK. El inicio de sesión y la creación del espacio se comprueban además mediante HTTPS contra Auth y la Data API.

## Diseño

Componentes propios con iconos de Lucide. Referencias revisadas: Animate UI, Uiverse, ForgeUI, Uilora, Vengeance UI y 60fps.design. No se copiaron componentes premium ni se crearon cuentas para estas referencias. La entrada animada y las microinteracciones se implementan con CSS para evitar peso innecesario.
