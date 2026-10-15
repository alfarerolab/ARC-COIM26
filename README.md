# Formatos de Acción Integral

Aplicativo React (Vite) + funciones serverless de Node.js para diligenciar, guardar, imprimir y exportar tres formatos:
encuesta de satisfacción, listado de asistencia y caracterización del personal.

## Variables de entorno
- `DATABASE_URL`: base de datos Postgres (Neon).
- `APP_CLAVE`: clave de acceso a la aplicación.

## Despliegue en Vercel
1. Suba esta carpeta a un repositorio de GitHub.
2. En Vercel: Add New > Project > importe el repositorio (Vercel detecta Vite solo).
3. En Storage / Marketplace agregue **Neon** y conéctelo al proyecto (crea `DATABASE_URL`).
4. En Settings > Environment Variables agregue `APP_CLAVE`.
5. Deploy.

## Desarrollo local
    npm install
    npm i -g vercel
    vercel link && vercel env pull .env   # trae las variables
    vercel dev                            # sirve frontend y /api juntos
