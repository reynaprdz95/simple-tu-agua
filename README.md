# Landing SIMPLE

Landing responsive para captar solicitudes de cotización de hogares y empresas.

## Ejecutar

```bash
npm start
```

El sitio queda disponible en `http://localhost:4173`.

## CRM

El formulario envía los leads a `POST /api/lead`. Para reenviarlos a un CRM o automatización,
configura un webhook:

```bash
CRM_WEBHOOK_URL="https://tu-crm.com/webhook" npm start
```

El webhook recibe JSON con `source`, `receivedAt`, `name`, `whatsapp`, `email`, `city`,
`clientType`, `people` y `message`.

## WhatsApp y redes

Completa los datos oficiales de la app, WhatsApp y redes en `site-config.js`. El número de WhatsApp debe incluir código de país
sin espacios, por ejemplo `5215512345678`.

## Antes de publicar

- Completar el responsable y medios para ejercer derechos en `aviso-privacidad.html`.
- Agregar número oficial de WhatsApp y URLs de redes.
- Configurar `CRM_WEBHOOK_URL`.
- Conectar el dominio y revisar datos estructurados/SEO.
