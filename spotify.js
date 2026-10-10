/* Spotify import: Authorization Code + PKCE, runs fully in the browser (no client secret).
   Setup:
   1. Create an app at https://developer.spotify.com/dashboard (Web API).
   2. Add your page URL as a Redirect URI, exactly as it appears in the address bar.
      Spotify requires https (e.g. your GitHub Pages URL) or http://127.0.0.1:PORT for local testing; "localhost" is not accepted.
   3. Paste the app's Client ID below. Never put the Client Secret in this file.
   Notes: Development Mode apps need the app owner to have Spotify Premium, and only allowlisted users can log in.
   Playlist contents only load for playlists you own or collaborate on. */
const SPOTIFY_CLIENT_ID = '';
const SP_SCOPES = 'playlist-read-private playlist-read-collaborative';
const SP_REDIRECT = location.origin + location.pathname;

const spStore = {
  get: k => { try{ return sessionStorage.getItem(k); }catch(e){ return null; } },
  set: (k,v) => { try{ sessionStorage.setItem(k,v); }catch(e){} },
  del: k => { try{ sessionStorage.removeItem(k); }catch(e){} }
};

function b64url(buf){ return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function randomString(n){ return b64url(crypto.getRandomValues(new Uint8Array(n))).slice(0,n); }

async function spLogin(){
  if(!SPOTIFY_CLIENT_ID){ toast('Add your Client ID in spotify.js first'); return; }
  const verifier = randomString(64);
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  spStore.set('sp_verifier', verifier);
  /* The share-link hash is lost on redirect, so keep the current board to restore afterwards. */
  if(songs.length) spStore.set('sp_board', encode());
  const q = new URLSearchParams({client_id:SPOTIFY_CLIENT_ID, response_type:'code', redirect_uri:SP_REDIRECT,
    scope:SP_SCOPES, code_challenge_method:'S256', code_challenge:challenge});
  location.href = 'https://accounts.spotify.com/authorize?' + q;
}

async function spTokenRequest(params){
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({client_id:SPOTIFY_CLIENT_ID, ...params})
  });
  if(!r.ok) throw new Error('Token request failed');
  const d = await r.json();
  spStore.set('sp_token', d.access_token);
  spStore.set('sp_expiry', String(Date.now() + d.expires_in*1000 - 30000));
  if(d.refresh_token) spStore.set('sp_refresh', d.refresh_token);
}

async function spToken(){
  if(Date.now() < Number(spStore.get('sp_expiry')||0)) return spStore.get('sp_token');
  const rt = spStore.get('sp_refresh');
  if(!rt) return null;
  try{ await spTokenRequest({grant_type:'refresh_token', refresh_token:rt}); return spStore.get('sp_token'); }
  catch(e){ spLogout(); return null; }
}

async function spGet(url){
  const t = await spToken();
  if(!t) throw new Error('Not connected');
  const r = await fetch(url.startsWith('http') ? url : 'https://api.spotify.com/v1' + url, {headers:{Authorization:'Bearer '+t}});
  if(r.status===403) throw new Error('Spotify denied access (check Premium / allowlist / playlist ownership)');
  if(r.status===429) throw new Error('Spotify rate limit, try again in a moment');
  if(!r.ok) throw new Error('Spotify error ' + r.status);
  return r.json();
}

function spLogout(){ ['sp_token','sp_expiry','sp_refresh','sp_verifier'].forEach(spStore.del); $('sp-picker').hidden = true; $('sp-connect').hidden = false; }

async function spShowPlaylists(){
  $('sp-connect').hidden = true; $('sp-picker').hidden = false;
  const sel = $('sp-list'); sel.textContent = '';
  try{
    let url = '/me/playlists?limit=50', n = 0;
    while(url && n < 3){
      const d = await spGet(url);
      for(const p of d.items) if(p) sel.add(new Option(p.name, p.id));
      url = d.next; n++;
    }
    if(!sel.options.length) toast('No playlists found');
  }catch(e){ toast(e.message); }
}

/* Playlist item endpoints were renamed in Feb 2026: /tracks -> /items and track -> item. Both shapes handled. */
async function spLoadPlaylist(){
  const id = $('sp-list').value; if(!id) return;
  const btn = $('sp-load'); btn.disabled = true; btn.textContent = 'Loading…';
  try{
    const lines = []; let url = '/playlists/' + id + '/items?limit=50', pages = 0;
    while(url && pages < 6){
      const d = await spGet(url);
      for(const it of d.items || []){
        const tr = it.item || it.track;
        if(!tr || !tr.name) continue;
        const artist = tr.artists && tr.artists[0] ? tr.artists[0].name : '';
        lines.push(artist ? artist + ' - ' + tr.name : tr.name);
      }
      url = d.next; pages++;
    }
    if(!lines.length){ toast('No songs found in that playlist'); return; }
    const name = $('sp-list').selectedOptions[0].text;
    $('title').value = name.slice(0,60);
    loadText(lines.join('\n'));
  }catch(e){ toast(e.message); }
  finally{ btn.disabled = false; btn.textContent = 'Load playlist'; }
}

$('sp-connect').onclick = spLogin;
$('sp-load').onclick = spLoadPlaylist;
$('sp-logout').onclick = spLogout;

/* Handle the redirect back from Spotify, or resume an existing session. */
(async function(){
  const p = new URLSearchParams(location.search);
  if(p.get('error')){ toast('Spotify login cancelled'); history.replaceState(null,'',location.pathname); }
  else if(p.get('code') && spStore.get('sp_verifier')){
    try{
      await spTokenRequest({grant_type:'authorization_code', code:p.get('code'), redirect_uri:SP_REDIRECT, code_verifier:spStore.get('sp_verifier')});
      spStore.del('sp_verifier');
    }catch(e){ toast('Spotify login failed'); }
    history.replaceState(null,'',location.pathname);
    const b = spStore.get('sp_board'); if(b){ decode(b); spStore.del('sp_board'); }
  }
  if(await spToken()) spShowPlaylists();
})();
