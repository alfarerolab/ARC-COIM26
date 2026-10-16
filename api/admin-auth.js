export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { usuario, clave } = req.body || {};
  const adminUsuario = process.env.ADMIN_USUARIO || 'admin';
  const adminClave = process.env.ADMIN_CLAVE || 'admin123';

  if (usuario && clave && usuario === adminUsuario && clave === adminClave) {
    return res.status(200).json({ ok: true, admin: true, usuario: adminUsuario, token: adminClave });
  }

  return res.status(401).json({ error: 'Usuario o contraseña de administrador incorrectos' });
}
