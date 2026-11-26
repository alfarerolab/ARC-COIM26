# Backend PHP para cPanel — ARC-COIM26

## Archivos

| Archivo | Descripción |
|---|---|
| `api.php` | API REST unificada (registros + autenticación admin) |
| `.htaccess` | Redirección de rutas amigables |
| `setup-mysql.sql` | Script para crear la tabla en MySQL |

## Pasos para subir al cPanel

### 1. Crear la base de datos MySQL en cPanel
1. Entra a cPanel → **MySQL Databases**
2. Crea una BD, por ejemplo: `tuusuario_arccoim26`
3. Crea un usuario MySQL con contraseña segura
4. Asigna el usuario a la BD con **ALL PRIVILEGES**

### 2. Crear la tabla
1. Ve a cPanel → **phpMyAdmin**
2. Selecciona tu BD
3. Pestaña **SQL** → pega el contenido de `setup-mysql.sql` → ejecutar

### 3. Configurar `api.php`
Edita las constantes al inicio del archivo:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'tuusuario_arccoim26');
define('DB_USER', 'tuusuario_dbuser');
define('DB_PASS', 'TuClaveSegura');
define('CORS_ORIGIN', 'https://tu-app.vercel.app');
```

### 4. Subir archivos al cPanel
Sube la carpeta entera al **File Manager** de cPanel, en la ruta:
```
public_html/arc-api/
  ├── api.php
  └── .htaccess
```

La API quedará disponible en: `https://tudominio.com/arc-api/api.php`

### 5. Configurar variable en Vercel
En tu proyecto de Vercel → **Settings → Environment Variables**:
```
VITE_API_URL = https://tudominio.com/arc-api
```

Luego haz un nuevo deploy en Vercel (o ejecuta `npm run build` y sube el `dist/`).

## Endpoints disponibles

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/arc-api/api.php?tipo=encuesta` | Listar registros por tipo |
| `GET` | `/arc-api/api.php?tipo=todos` | Listar todos los registros |
| `POST` | `/arc-api/api.php` | Crear nuevo registro |
| `DELETE` | `/arc-api/api.php?id=5` | Eliminar registro por ID |
| `POST` | `/arc-api/api.php` (ruta admin-auth) | Login del administrador |

## Prueba rápida desde el navegador
```
https://tudominio.com/arc-api/api.php?tipo=todos
```
Debe devolver `[]` (array vacío) si la BD está lista.
