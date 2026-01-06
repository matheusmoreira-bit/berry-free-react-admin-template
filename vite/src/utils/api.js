export async function request(path, opts = {}){
  const token = localStorage.getItem('b1_token');
  opts.headers = opts.headers || {};
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  // default accept json
  opts.headers['Accept'] = opts.headers['Accept'] || 'application/json';
  try{
    const res = await fetch(path, opts);
    if (res.status === 401){
      // unauthorized: redirect to login
      localStorage.removeItem('b1_token');
      localStorage.removeItem('b1_user');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    const txt = await res.text();
    let parsed = null;
    if (txt){
      try{ parsed = JSON.parse(txt); }catch(e){ parsed = txt; }
    }
    if (!res.ok){
      const msg = (parsed && parsed.message) ? parsed.message : (parsed || res.statusText || 'Error');
      if (res.status === 403) throw new Error(msg || 'Forbidden');
      throw new Error(msg);
    }
    return parsed;
  }catch(err){
    throw err;
  }
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type':'application/json' } }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body), headers: { 'Content-Type':'application/json' } }),
  del: (path) => request(path, { method: 'DELETE' })
};
