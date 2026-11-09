# Invitación de baby shower

Sitio estático en HTML, CSS y JavaScript puro. La lista de regalos usa una hoja privada de Google Sheets mediante una aplicación web de Google Apps Script. No usa Firebase, Firestore ni otra base de datos externa.

## Archivos

- `config.js`: evento, catálogo estable de 21 regalos y URL pública de Apps Script.
- `regalos.js`: interfaz y protocolo de lectura/escritura.
- `apps-script/Code.gs`: backend.
- `apps-script/appsscript.json`: manifiesto de Apps Script.

La pantalla inicial, transición, imágenes, temporizador, mapa, osito, estilos y WhatsApp no cambian. La asistencia continúa usando solo WhatsApp, sin registrar asistencia ni regalos en la hoja.

## Estructura de la hoja

Ejecutar `inicializar()` crea estas pestañas privadas:

| Pestaña | Columnas | Uso |
| --- | --- | --- |
| `Elecciones` | `requestId`, `giftId`, `fecha` | Una fila por regalo elegido. Sin nombres ni teléfonos. |
| `Operaciones` | `requestId`, `estado`, `detalle`, `fecha` | Idempotencia y confirmación de cada POST. |

IDs únicos: `tina`, `kit-aseo`, `cuna-moises`, `monitor`, `termometro`, `organizador-panales`, `aspirador-nasal`, `extractor-leche`, `paseador`, `silla-comer`.

IDs repetibles: `ropa-3-6`, `ropa-6-9`, `ropa-9-12`, `ropa-12-18`, `mamelucos`, `pijamas`, `panales-3-4`, `cobija`, `toallas`, `juguetes`, `regalo-libre`.

No cambies IDs sin actualizar a la vez `config.js` y `apps-script/Code.gs`.

## Configuración

1. Crea una hoja nueva en tu cuenta Google. No la compartas con invitados ni actives edición pública.
2. Copia su ID, el texto entre `/d/` y `/edit` de la URL.
3. Abre [Google Apps Script](https://script.google.com/home) y crea un proyecto, o abre **Extensiones > Apps Script** desde la hoja.
4. Copia `apps-script/Code.gs` y `apps-script/appsscript.json`. Reemplaza en `Code.gs` solo `PEGA_AQUI_EL_ID_DE_TU_HOJA` por el ID real.
5. Guarda y ejecuta `inicializar`. Autoriza con la cuenta propietaria y comprueba que se crearon las dos pestañas y sus encabezados.
6. Elige **Implementar > Nueva implementación > Aplicación web**. Configura **Ejecutar como: yo** y el acceso para cualquier persona sin inicio de sesión, si esa opción aparece en tu cuenta. No uses `/dev`: solo funciona para editores.
7. Autoriza, implementa y copia la URL que termina en `/exec`.
8. Pega únicamente esa URL en `regalosApi.webAppUrl` de `config.js`. No pongas el ID de la hoja ni credenciales en el frontend.
9. Desde la carpeta `baby-shower`, levanta un servidor HTTP. Por ejemplo, si Python está instalado: `python -m http.server 8000`; abre `http://localhost:8000`.
10. Al cambiar `Code.gs`, crea una nueva versión de la implementación antes de probar. Verifica luego desde la futura URL de GitHub Pages y una ventana privada.

## Protocolo y reglas

`ContentService` sirve el resultado desde una URL distinta de `googleusercontent.com`. Por eso las lecturas usan JSONP y son solo de consulta: `state` devuelve disponibilidad y conteos; `request` devuelve el resultado de un `requestId` aleatorio.

La escritura no usa `no-cors`. El navegador envía un POST codificado a un iframe oculto y consulta después el `requestId` por JSONP. No se muestra éxito ni se borra la selección hasta confirmar en `Operaciones` el estado `success`. Un fallo de conexión conserva selección y `requestId` para no duplicar la operación al reintentar.

`doGet` nunca escribe. `doPost` valida el formato, todos los IDs y la lista completa. Dentro de `LockService.getScriptLock()` revisa los únicos y registra todas las filas o el rechazo, sin selección parcial. Los únicos solo admiten una fila; los repetibles suman una fila por elección.

## Pruebas

Ejecutadas:

- Inspección estática del catálogo: 10 únicos y 11 repetibles, incluidos los rangos actuales 3-6, 6-9, 9-12 y 12-18 meses.
- Revisión de que la implementación de regalos no usa Firebase/Firestore, `localStorage` ni `sessionStorage`.
- Revisión del flujo de confirmación: el estado visual espera la consulta por `requestId` y el reintento conserva ese ID.

Pendientes, porque requieren una hoja, autorización y URL `/exec` reales:

1. Consultar desde localhost y GitHub Pages.
2. Registrar un único, recargar y verlo desde otra sesión.
3. Repetir un único y comprobar el rechazo.
4. Registrar repetibles desde dos sesiones y confirmar su contador.
5. Enviar simultáneamente un único desde dos sesiones y confirmar que una sola operación tiene éxito.
6. Cortar conexión durante POST, reintentar y confirmar una sola operación para ese `requestId`.
7. Verificar WhatsApp sin regalos y sin escritura en Sheets.

## Seguridad y límites

La hoja y su ID no se exponen en el sitio. La app se ejecuta como propietaria, valida el catálogo en servidor y no tiene operaciones públicas de edición o borrado. No se almacenan datos personales. El bloqueo evita carreras y el límite por solicitud evita cargas accidentales grandes.

Una URL pública sin autenticación no puede detener por completo solicitudes automatizadas o falsas. Sin añadir inicio de sesión, CAPTCHA o un servicio adicional, no puede identificarse de forma fiable a cada visitante. Revisa `Elecciones` y `Operaciones` periódicamente. Para un evento pequeño, el uso debe encajar en las cuotas gratuitas habituales de una cuenta personal, aunque Google puede modificarlas.

## Fuentes oficiales

- [Aplicaciones web de Apps Script](https://developers.google.com/apps-script/guides/web)
- [ContentService](https://developers.google.com/apps-script/reference/content/content-service)
- [LockService](https://developers.google.com/apps-script/reference/lock/lock-service)
