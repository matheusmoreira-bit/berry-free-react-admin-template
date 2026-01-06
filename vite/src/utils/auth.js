export function getToken(){
  return localStorage.getItem('b1_token');
}
export function getUser(){
  const txt = localStorage.getItem('b1_user');
  try{
    return JSON.parse(txt || 'null');
  }catch(e){ return null; }
}
export function logout(){
  localStorage.removeItem('b1_token');
  localStorage.removeItem('b1_user');
  window.location.href = '/login';
}