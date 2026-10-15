const K = 'clave';
export const getClave = () => sessionStorage.getItem(K) || '';
export const setClave = (v) => (v ? sessionStorage.setItem(K, v) : sessionStorage.removeItem(K));

async function req(url, opt = {}) {
  const r = await fetch(url, {
    ...opt,
    headers: { 'Content-Type': 'application/json', 'x-clave': getClave() },
  });
  if (r.status === 401) {
    setClave('');
    throw new Error('401');
  }
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Error del servidor');
  return r.json();
}

export const api = {
  listar: (tipo) => req(`/api/registros?tipo=${tipo}`),
  crear: (tipo, datos) => req('/api/registros', { method: 'POST', body: JSON.stringify({ tipo, datos }) }),
  borrar: (id) => req(`/api/registros?id=${id}`, { method: 'DELETE' }),
};
