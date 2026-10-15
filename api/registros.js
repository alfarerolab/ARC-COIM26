import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const TIPOS = ['encuesta', 'asistencia', 'caracterizacion'];

export default async function handler(req, res) {
  const clave = process.env.APP_CLAVE;
  if (clave && req.headers['x-clave'] !== clave) {
    return res.status(401).json({ error: 'Clave incorrecta' });
  }

  try {
    await sql`CREATE TABLE IF NOT EXISTS registros (
      id SERIAL PRIMARY KEY,
      tipo TEXT NOT NULL,
      datos JSONB NOT NULL,
      creado TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;

    if (req.method === 'GET') {
      const { tipo } = req.query;
      if (!TIPOS.includes(tipo)) return res.status(400).json({ error: 'Tipo no válido' });
      const rows = await sql`SELECT id, tipo, datos, creado FROM registros
                             WHERE tipo = ${tipo} ORDER BY creado DESC LIMIT 500`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { tipo, datos } = req.body || {};
      if (!TIPOS.includes(tipo) || typeof datos !== 'object') {
        return res.status(400).json({ error: 'Datos no válidos' });
      }
      const [row] = await sql`INSERT INTO registros (tipo, datos)
                              VALUES (${tipo}, ${JSON.stringify(datos)}::jsonb) RETURNING id`;
      return res.status(201).json(row);
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Id no válido' });
      await sql`DELETE FROM registros WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error de base de datos' });
  }
}
