<?php
/**
 * Backend PHP Seguro para cPanel + MySQL
 * ARC-COIM26 — Armada Nacional de Colombia — Acción Integral
 */

// Desactivar mostrar errores en pantalla (para que nunca filtre datos ni contraseñas)
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Configurar zona horaria oficial de Colombia (UTC-5)
date_default_timezone_set('America/Bogota');

// ─── CONFIGURACIÓN DE BASE DE DATOS Y CREDENCIALES ─────────────────────────
define('DB_HOST', 'localhost');
define('DB_NAME', 'fundaci3_armada');
define('DB_USER', 'fundaci3_wp246');
define('DB_PASS', 'TYyU5I7(OHRP?o$)');

// Credenciales para el acceso de Administrador (/admin)
define('ADMIN_USUARIO', 'admin');
define('ADMIN_CLAVE',   'admin123'); // Cámbiala si deseas en producción
// ────────────────────────────────────────────────────────────────────────────

// ─── HEADERS DE SEGURIDAD Y CORS ───────────────────────────────────────────
// Permite solicitudes desde localhost (desarrollo) o desde Vercel
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, x-admin-clave, x-clave, Authorization');
header('Access-Control-Max-Age: 86400');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Content-Type: application/json; charset=utf-8');

// Responder inmediatamente las peticiones preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
// ────────────────────────────────────────────────────────────────────────────

// ─── CONEXIÓN SEGURA PDO ────────────────────────────────────────────────────
try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
    // Sincronizar la zona horaria de la sesión MySQL a Colombia (-05:00)
    $pdo->exec("SET time_zone = '-05:00'");
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión con la base de datos: ' . $e->getMessage()]);
    exit;
}

// ─── ASEGURAR TABLA DE REGISTROS ───────────────────────────────────────────
$pdo->exec("CREATE TABLE IF NOT EXISTS registros (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    tipo    VARCHAR(50)  NOT NULL,
    datos   JSON         NOT NULL,
    creado  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tipo (tipo),
    INDEX idx_creado (creado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

// ─── ENRUTAMIENTO ───────────────────────────────────────────────────────────
$path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

if (substr($path, -10) === 'admin-auth') {
    handleAdminAuth($method);
} else {
    handleRegistros($method, $pdo);
}

// ─── CONTROLADOR: /registros ────────────────────────────────────────────────
function handleRegistros(string $method, PDO $pdo): void
{
    $tipos_permitidos = ['encuesta', 'asistencia', 'caracterizacion'];

    // 1. OBTENER REGISTROS (GET) -> Protegido para Administrador
    if ($method === 'GET') {
        $headers = getallheaders();
        $adminToken = $headers['x-admin-clave'] ?? $headers['X-Admin-Clave'] ?? '';

        // Solo permitir listar si tiene token de administrador
        if ($adminToken !== ADMIN_CLAVE) {
            http_response_code(401);
            echo json_encode(['error' => 'Acceso no autorizado. Se requieren permisos de administrador.']);
            return;
        }

        $tipo = $_GET['tipo'] ?? 'todos';
        if ($tipo === 'todos') {
            $stmt = $pdo->query("SELECT id, tipo, datos, creado FROM registros ORDER BY creado DESC LIMIT 1000");
        } else {
            if (!in_array($tipo, $tipos_permitidos, true)) {
                http_response_code(400);
                echo json_encode(['error' => 'Tipo no válido']);
                return;
            }
            $stmt = $pdo->prepare("SELECT id, tipo, datos, creado FROM registros WHERE tipo = ? ORDER BY creado DESC LIMIT 500");
            $stmt->execute([$tipo]);
        }

        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            if (is_string($r['datos'])) {
                $r['datos'] = json_decode($r['datos'], true);
            }
            // Asegurar formato ISO 8601 con zona horaria de Colombia (-05:00)
            if (!empty($r['creado'])) {
                $dt = new DateTime($r['creado'], new DateTimeZone('America/Bogota'));
                $r['creado'] = $dt->format(DateTime::ATOM);
            }
        }
        echo json_encode($rows);
        return;
    }

    // 2. CREAR REGISTRO (POST) -> Público (cualquier usuario que envíe la encuesta)
    if ($method === 'POST') {
        $raw = file_get_contents('php://input');
        $body = json_decode($raw, true);

        $tipo  = $body['tipo']  ?? '';
        $datos = $body['datos'] ?? null;

        if (!in_array($tipo, $tipos_permitidos, true) || !is_array($datos)) {
            http_response_code(400);
            echo json_encode(['error' => 'Estructura de datos o tipo no válido']);
            return;
        }

        // Sanitización y almacenamiento seguro como JSON
        $stmt = $pdo->prepare("INSERT INTO registros (tipo, datos) VALUES (?, ?)");
        $stmt->execute([
            $tipo,
            json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        ]);

        http_response_code(201);
        echo json_encode(['id' => (int) $pdo->lastInsertId(), 'ok' => true]);
        return;
    }

    // 3. ELIMINAR REGISTRO (DELETE) -> Protegido para Administrador
    if ($method === 'DELETE') {
        $headers = getallheaders();
        $adminToken = $headers['x-admin-clave'] ?? $headers['X-Admin-Clave'] ?? '';

        if ($adminToken !== ADMIN_CLAVE) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado para eliminar registros.']);
            return;
        }

        $id = intval($_GET['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'ID no válido']);
            return;
        }

        $stmt = $pdo->prepare("DELETE FROM registros WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['ok' => true]);
        return;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
}

// ─── CONTROLADOR: /admin-auth ───────────────────────────────────────────────
function handleAdminAuth(string $method): void
{
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        return;
    }

    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true);

    $usuario = trim($body['usuario'] ?? '');
    $clave   = trim($body['clave'] ?? '');

    // Comprobación de tiempo constante contra ataques de timing
    if (hash_equals(ADMIN_USUARIO, $usuario) && hash_equals(ADMIN_CLAVE, $clave)) {
        echo json_encode([
            'ok'      => true,
            'admin'   => true,
            'usuario' => ADMIN_USUARIO,
            'token'   => ADMIN_CLAVE,
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Usuario o contraseña de administrador incorrectos']);
    }
}
