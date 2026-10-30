# Caffe Bigger

Next.js 14 + React + Three.js. Experiencia con scroll, carta completa y Webpay Plus.

```powershell
npm install
npm run dev
```

Abrir http://localhost:3000. `npm run build` crea producción; `npm start` la sirve. `npm test` ejecuta las pruebas de catálogo y pagos.

## Experiencia 3D

- El inicio permanece visible y el café se sirve a medida que avanzas con el scroll. Al subir se revierte el llenado.
- La tartaleta de frutillas original vuelve como modelo 3D de referencia, con masa, crema, frutillas, glaseado y menta. No se agrega al catálogo porque no aparece en las cartas.
- La misma sección permite explorar un pie de limón, un sándwich y una fajita en 3D por capas.
- Las fichas muestran modelos 3D. Solo las preparaciones apropiadas permiten separar ingredientes; brownies, muffins, galletas, infusiones y otros productos se muestran completos.
- Con movimiento reducido, las escenas se presentan en su estado final y no requieren recorrer una sección extensa. Sin WebGL se ofrece una alternativa.

## Catálogo de las cinco cartas

Hay 90 productos: 13 cafés e infusiones, 17 cafés fríos, 15 productos de pastelería, 30 sándwiches, 12 fajitas y 3 ensaladas. Todos tienen enlace a su carta original, y se pueden abrir las cinco imágenes desde la página.

Incluye café mediano/grande, panes con recargos, variedades de rellenos y ensaladas configurables: grande con una proteína y cuatro vegetales; pequeña con tres vegetales. Atún, churrasco y lengua tienen recargo de $400 en la ensalada grande.

Cafés fríos y fajitas no muestran precio en las imágenes: están disponibles para consulta pero bloqueados para pago. Las salsas se listan tal como aparecen; sus condiciones no se inventan. Los nombres e ingredientes de recetas tradicionales pueden requerir validación del local. El modelado es referencial, no una declaración de alérgenos.

## Webpay Plus

El flujo de pago está implementado con la API REST oficial: crear transacción, redirigir a Transbank, confirmar en el servidor y mostrar comprobante. **Por defecto funciona en integración, sin cobros reales.**

No se necesitan credenciales privadas para la integración: se usan las públicas de prueba de Transbank en el servidor. No ingreses tarjetas reales.

1. Agrega un producto con precio al carrito y selecciona «Continuar a Webpay».
2. En integración, usa los datos de prueba de [Transbank](https://transbankdevelopers.com/documentacion/como_empezar#tarjetas-de-prueba). VISA aprobada: `4051885600446623`, CVV `123`, vencimiento futuro. Autenticación de prueba: RUT `11.111.111-1`, clave `123`.
3. Al regresar, el servidor verifica `status=AUTHORIZED`, `response_code=0`, monto, orden y sesión antes de marcar el pedido pagado.
4. El comprobante distingue aprobación, rechazo, cancelación, expiración y confirmación pendiente. El carrito se limpia solo tras una aprobación y si conserva la selección de ese intento.

La URL local es apta para volver al navegador que ejecuta la prueba. Si usas otro dominio o puerto, copia `.env.example` a `.env.local` y configura `APP_URL` con el origen exacto. No mezcles `localhost` y `127.0.0.1` durante una prueba.

### Producción

Para cobrar de verdad se requieren afiliación y validación de Transbank, código de comercio y API key propios. Configura `WEBPAY_ENV=production`, las credenciales, `APP_URL` HTTPS y `ORDER_DATA_DIR` en un volumen persistente. El servidor rechaza una configuración incompleta. No publiques las claves ni las agregues a Git.

El almacenamiento actual usa archivos atómicos y bloqueo por orden en `.data/orders`, excluido de Git. Está pensado para desarrollo o una sola instancia de servidor con disco persistente. Para hosting sin disco persistente o con varias réplicas, migra el repositorio de pedidos a una base de datos transaccional compartida antes de activar cobros. Implementa recepción operativa en cocina, disponibilidad, horarios de retiro y administración antes de ofrecer retiros reales. Los pedidos de integración nunca deben prepararse.

### Archivos

- `lib/catalog.mjs`: catálogo completo y cálculo de precios compartido por cliente y servidor.
- `lib/webpay.mjs`: API Transbank y verificación de pagos.
- `lib/order-store.mjs`: almacenamiento de pedidos y acceso al comprobante.
- `app/api/webpay/*`: configuración pública, creación y retorno GET/POST.
- `app/api/orders/[id]`: comprobante protegido con cookie HttpOnly.
- `components/Hero.jsx`: máquina 3D vinculada al scroll.
- `components/FoodScene.jsx`: modelos 3D de alimentos.
- `components/Tart.jsx`: experiencia de desglose con scroll.
- `components/Menu.jsx`: búsqueda, categorías, opciones y cartas originales.
- `tests/checkout.test.mjs`: pruebas de precios, validación, pagos y persistencia.

Los precios proceden del material proporcionado; deben confirmarse antes de abrir ventas. No se inventaron dirección, horarios ni testimonios.

La conexión a Transbank respeta `HTTP_PROXY`, `HTTPS_PROXY` y `NO_PROXY`. En desarrollo Windows también consulta, de forma no interactiva y solo de lectura, el proxy del sistema; no modifica la configuración del equipo ni guarda su dirección. Se puede desactivar con `WEBPAY_USE_SYSTEM_PROXY=false`. En producción configura las variables del entorno si tu infraestructura requiere un proxy.

## Actualización visual

Los seis destacados ahora usan imágenes de estilo fotográfico generadas con IA y señaladas como referenciales. Archivos JPEG optimizados en `public/menu/`; prompts y procedencia en `docs/product-images.md`.

Los modelos principales usan superficies y texturas procedurales: marraqueta partida, carne con volumen y pliegues, tomate con pulpa y semillas, palta en láminas, tortilla que se abre, porción triangular de pie con merengue acanalado y tartaleta con masa acanalada y frutillas con semillas. Las etiquetas se vinculan a las capas 3D y aparecen según el progreso del desplazamiento. El glaseado permanece como película sobre la fruta.

La pastelería utiliza modelos específicos (`BakeryModel.jsx` y `DetailedShapes.js`): medialuna laminada, roll en espiral, kuchen con coberturas distintas de manzana, nuez y plátano, cheesecake, queque con miga, brownie, muffin, cookies, cuchuflís y donas. El pie de limón conserva su modelo anterior.

Las fajitas cerradas se presentan en dos mitades con corte diagonal, tortilla tostada, solapa y extremo plegado. Al abrirlas se conserva el desglose por capas. `SaladModel.jsx` construye hojas onduladas, cortes de vegetales y proteínas; la vista se actualiza con las opciones de la ficha. Antes de seleccionar se muestra una combinación de ejemplo, identificada en pantalla. Las recetas siguen siendo referenciales.

El visor de la ficha se reutiliza entre productos y pausa el renderizado mientras el modal está cerrado.
