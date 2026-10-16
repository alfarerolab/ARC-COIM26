import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function localApiPlugin(env) {
  const dataFile = path.resolve(process.cwd(), '.data/registros.json');

  function getDb() {
    try {
      if (fs.existsSync(dataFile)) {
        return JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
      }
    } catch (e) {
      console.error('Error reading local db:', e);
    }
    return [];
  }

  function saveDb(data) {
    const dir = path.dirname(dataFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
  }

  return {
    name: 'local-api-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        if (url.pathname === '/api/admin-auth' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const { usuario, clave } = JSON.parse(body || '{}');
              const adminUsuario = env.ADMIN_USUARIO || process.env.ADMIN_USUARIO || 'admin';
              const adminClave = env.ADMIN_CLAVE || process.env.ADMIN_CLAVE || 'admin123';
              if (usuario === adminUsuario && clave === adminClave) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ ok: true, admin: true, usuario: adminUsuario, token: adminClave }));
              }
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Usuario o contraseña de administrador incorrectos' }));
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Datos no válidos' }));
            }
          });
          return;
        }

        if (!url.pathname.startsWith('/api/registros')) {
          return next();
        }

        const db = getDb();

        if (req.method === 'GET') {
          const tipo = url.searchParams.get('tipo');
          const TIPOS = ['encuesta', 'asistencia', 'caracterizacion'];
          if (tipo && tipo !== 'todos' && !TIPOS.includes(tipo)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Tipo no válido' }));
          }
          const rows = db
            .filter((r) => !tipo || tipo === 'todos' || r.tipo === tipo)
            .sort((a, b) => new Date(b.creado) - new Date(a.creado));
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(rows));
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { tipo, datos } = JSON.parse(body || '{}');
              const TIPOS = ['encuesta', 'asistencia', 'caracterizacion'];
              if (!TIPOS.includes(tipo) || typeof datos !== 'object') {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'Datos no válidos' }));
              }
              const newId = (db.length > 0 ? Math.max(...db.map((r) => r.id || 0)) : 0) + 1;
              const newRecord = {
                id: newId,
                tipo,
                datos,
                creado: new Date().toISOString(),
              };
              db.unshift(newRecord);
              saveDb(db);
              res.statusCode = 201;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ id: newId }));
            } catch (err) {
              console.error('Error processing POST body:', err, 'raw body:', body);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Error procesando datos' }));
            }
          });
          return;
        }

        if (req.method === 'DELETE') {
          const id = Number(url.searchParams.get('id'));
          if (!Number.isInteger(id)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Id no válido' }));
          }
          const index = db.findIndex((r) => r.id === id);
          if (index !== -1) {
            db.splice(index, 1);
            saveDb(db);
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ ok: true }));
        }

        res.statusCode = 405;
        res.setHeader('Allow', 'GET, POST, DELETE');
        res.end(JSON.stringify({ error: 'Método no permitido' }));
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), localApiPlugin(env)],
  };
});
