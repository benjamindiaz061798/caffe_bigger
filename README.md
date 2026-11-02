# Bigger Compras

Plataforma móvil para preparar pedidos de una cafetería a sus proveedores. La portada pública mantiene la cafetería, su carta y animaciones. La gestión de proveedores está en `/compras`, con acceso mediante una cuenta.

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

Sin configuración completa de Supabase y Firebase se abre una **demostración local claramente identificada**. Incluye proveedores ficticios sin teléfono. Los cambios e historial se guardan en este navegador (`localStorage`), no hay cuentas privadas ni sincronización. La opción Mi espacio permite exportar una copia JSON. No ingreses datos privados en un dispositivo compartido.

El proyecto conectado es **Bigger Compras**, referencia `usvxhrijwupttqoecvsi`, en São Paulo (`sa-east-1`), plan gratuito. Las migraciones de `supabase/migrations` ya están aplicadas en ese proyecto y sus versiones coinciden con el historial remoto. No vuelvas a ejecutar la creación de tablas manualmente sobre él.

La configuración local está en `.env.local`, excluida de Git. Vercel tiene las seis variables públicas descritas en `.env.example`: dos para Supabase y cuatro para Firebase. Nunca coloques claves secretas, `service_role` o contraseñas en variables `NEXT_PUBLIC_`.

### Cuentas y recuperación

Firebase Authentication (`caffe-bigger-cuentas-2026`, plan Spark sin facturación vinculada) gestiona correo/contraseña, confirmación de correo y recuperación. No necesita un SMTP propio. El registro es abierto por decisión del propietario: **cualquier cuenta con correo confirmado obtiene acceso de comprador al espacio compartido de Caffe Bigger**, sin aprobación manual. Los usuarios nuevos nunca reciben el rol administrador.

La cuenta administradora solicitada y la cuenta encargada anterior conservan sus UUID de Supabase y membresías `owner`. Sus credenciales privadas están en archivos locales ignorados dentro de `.data/`, nunca en Git. En **Mi espacio** se puede cambiar contraseña; los administradores pueden listar cuentas y activar/desactivar el acceso de compradores. Desactivar conserva historial y bloquea inmediatamente las operaciones del usuario en la base de datos.

Los enlaces de correo usan la pantalla segura hospedada por Firebase y continúan hacia `/compras`. La contraseña mínima de 10 caracteres y la protección contra enumeración de correos también están habilitadas en el servidor. La ruta `/cuenta/recuperar` maneja acciones `resetPassword` y `verifyEmail` con sus códigos de un solo uso, pero no está configurada como plantilla de correo: Firebase rechazó el cambio de callback con `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`. El flujo activo utiliza su pantalla hospedada predeterminada. El usuario puede solicitar otro enlace si caduca. Los correos están sujetos a cuotas del plan Firebase y a los filtros del destinatario; una respuesta de envío aceptado no demuestra entrega en bandeja de entrada.

### Puente de identidad

La función Supabase `firebase-session` verifica criptográficamente el ID token de Firebase (firma Google RS256, emisor, audiencia, vencimiento y correo confirmado), vincula la identidad al UUID existente o crea un usuario interno, y agrega la membresía `buyer` en el espacio configurado. Solo esta función puede llamar las RPC administrativas de vinculación. Para la creación inicial utiliza una autorización privada de un solo uso (nonce aleatorio, hash SHA-256, correo/UID verificados, vigencia de dos minutos); el trigger la consume y el servidor retira el comprobante del perfil. Los campos editables del usuario por sí solos nunca conceden permisos. Genera y consume internamente un enlace de sesión de Supabase **sin enviar correo**, devuelve únicamente el access token y conserva un registro de sesión limitado al vencimiento Firebase y como máximo una hora. El navegador mantiene ese token en memoria y lo renueva desde su sesión Firebase.

RLS exige ese registro para las identidades vinculadas y rechaza sesiones nativas nuevas que intenten eludir el puente. Cambiar contraseña revoca las otras sesiones de compras. Los clientes no pueden elegir UUID, espacio ni rol. Las claves administrativas permanecen en el entorno interno de Supabase Edge Functions.

`verify_jwt=false` en la función es intencional: su autenticación es el JWT **de Firebase**, validado dentro de la función antes de utilizar privilegios. CORS permite únicamente producción y los puertos locales declarados. Para otro dominio hay que actualizar tanto los dominios autorizados de Firebase como esta lista; los previews con dominios diferentes no abren sesiones de compras automáticamente.

En Firebase, `firebase deploy --only auth` activa los proveedores de `firebase.json`. La CLI utilizada no aplica `authorizedDomains`; estos dominios se configuraron además mediante la API administrativa de Firebase y deben mantenerse en Authentication → Settings → Authorized domains.

Para un proyecto nuevo: aplicar migraciones en orden; crear el espacio y su administrador; definir `private.firebase_registration.workspace_id`; desplegar `supabase/functions/firebase-session/index.ts` con el identificador Firebase correcto; configurar los dominios y las variables públicas. Las tablas `private.*` carecen de políticas de cliente intencionalmente: solo las funciones privadas autorizadas y el servicio administrativo pueden acceder.

### Cafetería pública

`/` muestra la carta y las animaciones 3D anteriores. Su navegación incluye **Acceso del personal**. El carrito sigue permitiendo preparar productos, pero los pagos Webpay están explícitamente deshabilitados: la implementación anterior guardaba transacciones en un archivo local, inadecuado para Vercel. No se presenta como una tienda con pagos operativos. Compras a proveedores no utiliza Webpay.

## Datos y permisos

PostgreSQL mantiene espacios, membresías, proveedores, productos, pedidos y detalles. RLS restringe los datos a los miembros autenticados. Los usuarios no tienen permisos directos para escribir pedidos o membresías: funciones transaccionales privadas controlan la creación del espacio, el guardado y la confirmación manual. Las funciones públicas son envoltorios con SECURITY INVOKER que delegan a esas operaciones; las comprobaciones de usuario y membresía están en la base de datos.

El servidor valida proveedor, productos, cantidades y unidades, y toma las descripciones desde la base de datos. El guardado es atómico, conserva el historial, mantiene el orden de las líneas y evita duplicados al reintentar una preparación. Archivar un proveedor o producto conserva los pedidos anteriores. Repetir filtra los productos archivados y avisa al usuario.

## Instalación y conexión

Abre la aplicación mediante HTTPS. En Chrome compatible puede ofrecer instalación; en iPhone utiliza Safari → Compartir → Agregar a pantalla de inicio. El servicio worker guarda únicamente los iconos y la pantalla informativa sin conexión. **No almacena páginas privadas, contactos, respuestas de Supabase ni peticiones de escritura.** El espacio conectado necesita internet. Los borradores en este dispositivo no implican sincronización sin conexión.

## Verificación

`npm test` ejecuta pruebas de reglas de compra y la migración en PostgreSQL embebido (PGlite). Incluye aislamiento entre dos espacios, permisos anónimos, intentos de elevar privilegios, vinculación Firebase solo desde servidor, sesiones con vencimiento, bloqueo inmediato y roles de comprador/administrador, integridad entre proveedores, cantidades, atomicidad, idempotencia, borradores y conservación histórica. También se ejecutó `supabase/tests/live-purchasing.sql` en la base real, con el contexto del usuario autenticado. Comprueba aislamiento, escrituras, snapshots, reintentos, borradores, cantidades, confirmación y bloqueo anónimo. Los registros de prueba se revierten con ROLLBACK. El inicio de sesión y la creación del espacio se comprueban además mediante HTTPS contra Auth y la Data API.

## Diseño

Componentes propios con iconos de Lucide. Referencias revisadas: Animate UI, Uiverse, ForgeUI, Uilora, Vengeance UI y 60fps.design. No se copiaron componentes premium ni se crearon cuentas para estas referencias. La entrada animada y las microinteracciones se implementan con CSS para evitar peso innecesario.
