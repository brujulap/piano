"use strict";
(function(){
const $=id=>document.getElementById(id), SK='pz_key';
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)), ub64=a=>{let s='';for(let i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s)};
function saved(){return localStorage.getItem(SK)||sessionStorage.getItem(SK)}
function forget(){localStorage.removeItem(SK);sessionStorage.removeItem(SK)}
async function derive(pw,meta){const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:b64(meta.salt),iterations:meta.iter,hash:'SHA-256'},km,256))}
async function open(meta,raw){const k=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['decrypt']);
  return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(meta.iv)},k,b64(meta.ct))))}
function boot(P){
  const st=document.createElement('style');st.textContent=P.css;document.head.appendChild(st);
  $('root').innerHTML=P.html;
  window.__PIANO={data:P.data,build:P.build,logout(){forget();location.replace(location.pathname)}};
  const u=URL.createObjectURL(new Blob([P.js],{type:'text/javascript'}));
  const s=document.createElement('script');s.src=u;s.onload=()=>URL.revokeObjectURL(u);document.body.appendChild(s);
}
async function unlock(pw,sv){
  const err=$('lerr'),go=$('go');err.textContent='';go.disabled=true;go.textContent='Descifrando…';
  try{
    const meta=await (await fetch('d/app.json',{cache:'no-cache'})).json();
    let raw;
    if(sv){const [salt,k]=sv.split(':');if(salt!==meta.salt)throw new Error('stale');raw=b64(k)} else raw=await derive(pw,meta);
    const P=await open(meta,raw);
    if(!sv){const v=meta.salt+':'+ub64(raw);forget();($('rem').checked?localStorage:sessionStorage).setItem(SK,v)}
    $('pw').value='';$('lock').hidden=true;document.body.classList.remove('locked');boot(P);
  }catch(e){
    if(sv){forget()}else{err.textContent='Contraseña incorrecta. Probá de nuevo.';const c=$('lf');c.classList.remove('shake');void c.offsetWidth;c.classList.add('shake');$('pw').select()}
    go.disabled=false;go.textContent='Entrar';
  }
}
$('lf').addEventListener('submit',e=>{e.preventDefault();unlock($('pw').value)});
const sv=saved();if(sv)unlock(null,sv);
})();
