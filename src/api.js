const K = 'clave';
const KA_TOKEN = 'admin_token';
const KA_USER = 'admin_usuario';

export const getClave = () => sessionStorage.getItem(K) || '';
export const setClave = (v) => (v ? sessionStorage.setItem(K, v) : sessionStorage.removeItem(K));

export const getEsAdmin = () => !!sessionStorage.getItem(KA_TOKEN);
export const getAdminUsuario = () => sessionStorage.getItem(KA_USER) || '';
export const setAdminAuth = (token, usuario) => {
  if (token) {
    sessionStorage.setItem(KA_TOKEN, token);
    sessionStorage.setItem(KA_USER, usuario || 'admin');
  } else {
    sessionStorage.removeItem(KA_TOKEN);
    sessionStorage.removeItem(KA_USER);
  }
};
export const setEsAdmin = (v) => setAdminAuth(v ? 'admin123' : null);

async function req(url, opt = {}) {
  const adminToken = sessionStorage.getItem(KA_TOKEN);
  const r = await fetch(url, {
    ...opt,
    headers: {
      'Content-Type': 'application/json',
      'x-clave': getClave(),
      'x-admin-clave': adminToken || '',
      ...(opt.headers || {}),
    },
  });
  if (r.status === 401) {
    if (!adminToken) setClave('');
    throw new Error('401');
  }
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Error del servidor');
  return r.json();
}

export const api = {
  listar: (tipo = 'todos') => req(`/api/registros?tipo=${tipo}`),
  crear: (tipo, datos) => req('/api/registros', { method: 'POST', body: JSON.stringify({ tipo, datos }) }),
  borrar: (id) => req(`/api/registros?id=${id}`, { method: 'DELETE' }),
  validarAdmin: async (usuario, clave) => {
    const r = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, clave }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || 'Usuario o contraseña de administrador incorrectos');
    }
    const data = await r.json();
    setAdminAuth(data.token, data.usuario);
    return data;
  },
  cerrarAdmin: () => {
    setAdminAuth(null);
  },
};
