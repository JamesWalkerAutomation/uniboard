// app.js v4.4 — справжні лого платформ, універсальна форма
"use strict";
window.addEventListener('error', function (e) {
  showErr('Помилка: ' + (e.message || '?') +
    ' (рядок ' + (e.lineno || '?') + ')');
});
function showErr(msg) {
  var v = document.getElementById('view');
  if (v) {
    v.innerHTML = '<div class="errbox">❌ ' + msg +
      '\nСфотографуйте і надішліть розробнику.</div>';
  }
}
/* ===== СХОВИЩЕ ===== */
var STORES = ['listings', 'media', 'publications',
  'messages', 'events', 'kv'];
var _db = null;
function idb() {
  if (_db) return _db;
  _db = new Promise(function (res, rej) {
    var r = indexedDB.open('uniboard4', 1);
    r.onupgradeneeded = function (e) {
      var d = e.target.result;
      STORES.forEach(function (s) {
        if (!d.objectStoreNames.contains(s)) {
          d.createObjectStore(s, {
            keyPath: s === 'kv' ? 'key' : 'id',
            autoIncrement: s !== 'kv'
          });
        }
      });
    };
    r.onsuccess = function (e) { res(e.target.result); };
    r.onerror = function (e) { rej(e.target.error); };
  });
  return _db;
}
function rq(r) {
  return new Promise(function (res, rej) {
    r.onsuccess = function () { res(r.result); };
    r.onerror = function () { rej(r.error); };
  });
}
function os(s, m) {
  return idb().then(function (d) {
    return d.transaction(s, m || 'readonly').objectStore(s);
  });
}
var DB = {};
DB.all = function (s) {
  return os(s).then(function (o) { return rq(o.getAll()); });
};
DB.get = function (s, id) {
  return os(s).then(function (o) { return rq(o.get(id)); });
};
DB.put = function (s, v) {
  return os(s, 'readwrite').then(function (o) {
    return rq(o.put(v));
  });
};
DB.del = function (s, id) {
  return os(s, 'readwrite').then(function (o) {
    return rq(o.delete(id));
  });
};
DB.clear = function (s) {
  return os(s, 'readwrite').then(function (o) {
    return rq(o.clear());
  });
};
function kvGet(k, d) {
  return DB.get('kv', k).then(function (r) {
    return r ? r.value : d;
  });
}
function kvSet(k, v) {
  return DB.put('kv', { key: k, value: v });
}
/* ===== ДОВІДНИКИ ===== */
var CATS = ['Електроніка', 'Транспорт', 'Нерухомість',
  'Одяг та взуття', 'Дім і сад', 'Дитячий світ',
  'Тварини', 'Робота', 'Послуги', 'Хобі', 'Інше'];
var SVG_SMS = '<svg viewBox="0 0 24 24" fill="#fff">' +
  '<path d="M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4V5a2 2 0 0 1 2-2z"/></svg>';
var SVG_MAIL = '<svg viewBox="0 0 24 24" fill="#fff">' +
  '<path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6zm2 .8 8 5.7 8-5.7H4z"/></svg>';
var PL = [
  { code: 'telegram', name: 'Telegram', grp: 'auto',
    dom: 'telegram.org', bc: '#229ED9',
    desc: 'Bot API: автопублікація з фото, повідомлення',
    fields: [['token', 'Bot Token (від @BotFather)'],
      ['chat', 'Chat ID каналу/групи']] },
  { code: 'discord', name: 'Discord', grp: 'auto',
    dom: 'discord.com', bc: '#5865F2',
    desc: 'Webhook: автопублікація з фото у канал',
    fields: [['webhook', 'URL Webhook']] },
  { code: 'mastodon', name: 'Mastodon', grp: 'auto',
    dom: 'mastodon.social', bc: '#6364FF',
    desc: 'API: автопублікація посту',
    fields: [['instance', 'Інстанція'],
      ['token', 'Access Token']] },
  { code: 'fb_share', name: 'Facebook', grp: 'share',
    dom: 'facebook.com', bc: '#1877F2',
    desc: 'Пост/групи через шеринг',
    share: 'https://www.facebook.com/sharer/sharer.php' +
      '?u={U}&quote={T}' },
  { code: 'x', name: 'X (Twitter)', grp: 'share',
    dom: 'x.com', bc: '#000000',
    desc: 'Твіт з посиланням',
    share: 'https://twitter.com/intent/tweet' +
      '?text={T}&url={U}' },
  { code: 'wa', name: 'WhatsApp', grp: 'share',
    dom: 'whatsapp.com', bc: '#25D366',
    desc: 'У чат/групу/статус',
    share: 'https://api.whatsapp.com/send?text={T}%20{U}' },
  { code: 'viber', name: 'Viber', grp: 'share',
    dom: 'viber.com', bc: '#7360F2',
    desc: 'Переслати у чат/спільноту',
    share: 'viber://forward?text={T}%20{U}' },
  { code: 'tg_share', name: 'Telegram-шеринг',
    grp: 'share', dom: 'telegram.org', bc: '#229ED9',
    desc: 'У будь-який чат/канал',
    share: 'https://t.me/share/url?url={U}&text={T}' },
  { code: 'sms', name: 'SMS', grp: 'share',
    svg: SVG_SMS, bc: '#64748B',
    desc: 'Текст + посилання',
    share: 'sms:?body={T}%20{U}' },
  { code: 'mail', name: 'Email', grp: 'share',
    svg: SVG_MAIL, bc: '#64748B',
    desc: 'Лист з посиланням',
    share: 'mailto:?subject={T}&body={T}%20{U}' },
  { code: 'olx', name: 'OLX.ua', grp: 'manual',
    dom: 'olx.ua', bc: '#002F34',
    desc: 'Дошка №1 · керований процес',
    url: 'https://www.olx.ua/uk/post-new-ad/' },
  { code: 'izi', name: 'IZI.ua', grp: 'manual',
    dom: 'izi.ua', bc: '#F04E23',
    desc: 'Маркетплейс · керований процес',
    url: 'https://izi.ua/uk/new/' },
  { code: 'prom', name: 'Prom.ua', grp: 'manual',
    dom: 'prom.ua', bc: '#00A551',
    desc: 'Маркетплейс товарів',
    url: 'https://my.prom.ua/cabinet/products/create' },
  { code: 'shafa', name: 'Shafa.ua', grp: 'manual',
    dom: 'shafa.ua', bc: '#D6437C',
    desc: 'Одяг/взуття',
    url: 'https://shafa.ua/cabinet/products/create' },
  { code: 'fb_market', name: 'FB Marketplace',
    grp: 'manual', dom: 'facebook.com', bc: '#1877F2',
    desc: 'Маркетплейс Facebook',
    url: 'https://www.facebook.com/marketplace/create/item' },
  { code: 'kidstaff', name: 'Kidstaff', grp: 'manual',
    dom: 'kidstaff.com.ua', bc: '#E8722A',
    desc: 'Дитячі товари',
    url: 'https://kidstaff.com.ua/sozdaniye-objavlenije.html' },
  { code: 'crafta', name: 'Crafta.ua', grp: 'manual',
    dom: 'crafta.ua', bc: '#8A4FBF',
    desc: 'Ручна робота',
    url: 'https://crafta.ua/cabinet/products/create' },
  { code: 'besplatka', name: 'Besplatka.ua',
    grp: 'manual', dom: 'besplatka.ua', bc: '#43A047',
    desc: 'Дошка оголошень',
    url: 'https://besplatka.ua/board/post' },
  { code: 'flagma', name: 'Flagma.ua', grp: 'manual',
    dom: 'flagma.ua', bc: '#1F6FB2',
    desc: 'B2B дошка',
    url: 'https://flagma.ua/add/' }
];
var STATUS = {
  draft: ['Чернетка', ''],
  published: ['Опубліковано', 'pub'],
  needs_action: ['Потребує дії', 'act'],
  error: ['Помилка', 'err'],
  publishing: ['Публікується', 'pend'],
  paused: ['Призупинено', 'pau']
};
/* ===== ЛОГО ПЛАТФОРМ ===== */
function plogo(p, sz) {
  sz = sz || 26;
  if (!p) {
    p = { name: '?', bc: '#94A3B8' };
  }
  var fs = Math.round(sz * 0.45);
  var h = '<span class="plogo" style="width:' + sz + 'px;';
  h += 'height:' + sz + 'px;background:' + (p.bc || '#94A3B8');
  h += '">';
  if (p.svg) {
    h += p.svg;
  } else {
    h += '<span class="pl-f" style="font-size:' + fs + 'px">';
    h += esc(String(p.name).charAt(0)) + '</span>';
    if (p.dom) {
      h += '<img alt="" src="https://www.google.com/s2/';
      h += 'favicons?sz=128&domain_url=' + p.dom + '"';
      h += ' onload="var f=this.previousElementSibling;';
      h += 'if(f)f.style.display=\'none\'"';
      h += ' onerror="this.style.display=\'none\'">';
    }
  }
  return h + '</span>';
}
function plByName(nm) {
  return PL.find(function (p) { return p.name === nm; });
}
/* ===== СТАН ===== */
var L = [], MED = [], PUB = [], MSG = [], EV = [];
var CONN = {}, AUTOPOLL = false;
var PROFILE = { name: '', phone: '', email: '',
  city: '', delivery: '', tg: '' };
var page = 'listings', sel = [], search = '';
var fSt = 'all', sortB = 'new';
var editing = null, editMedia = [];
var pubIds = [], pubSel = [], _TK = [], _TR = [];
var urlCache = {};
function murl(m) {
  if (!urlCache[m.id]) {
    urlCache[m.id] = URL.createObjectURL(m.blob);
  }
  return urlCache[m.id];
}
function esc(s) {
  return String(s == null ? '' : s).replace(
    /[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;',
        '>': '&gt;', '"': '&quot;',
        "'": '&#39;' }[c];
    });
}
function toast(m, t) {
  var e = document.getElementById('toast');
  e.textContent = m;
  e.className = 'show ' + (t || '');
  clearTimeout(e._h);
  e._h = setTimeout(function () { e.className = ''; }, 2600);
}
function fmtd(d) {
  return new Date(d).toLocaleString('uk-UA', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit' });
}
function priceText(l) {
  if (l.offerType === 'free') return 'Задармо';
  return l.price + ' ' + l.currency;
}
function attrsOf(l) {
  return (l.attrs || []).filter(function (a) {
    return a.n && a.v;
  });
}
function loadAll() {
  return Promise.all([DB.all('listings'), DB.all('media'),
    DB.all('publications'), DB.all('messages'),
    DB.all('events')]).then(function (r) {
    L = r[0]; MED = r[1]; PUB = r[2];
    MSG = r[3]; EV = r[4];
    return Promise.all([kvGet('conn', {}),
      kvGet('profile', null), kvGet('tg_autopoll', false)]);
  }).then(function (r) {
    CONN = r[0] || {};
    if (r[1]) PROFILE = r[1];
    AUTOPOLL = !!r[2];
    sortListings();
  });
}
function sortListings() {
  L.sort(function (a, b) {
    return sortB === 'price'
      ? a.price - b.price : b.createdAt - a.createdAt;
  });
}
function log(t, m) {
  var r = { type: t, message: m, at: Date.now() };
  EV.unshift(r);
  DB.put('events', r);
  if (EV.length > 200) EV = EV.slice(0, 200);
}
function mediaOf(id) {
  return MED.filter(function (m) {
    return m.listingId === id;
  }).sort(function (a, b) { return a.pos - b.pos; });
}
function pubsOf(id) {
  return PUB.filter(function (p) {
    return p.listingId === id;
  });
}
function plOf(c) {
  return PL.find(function (p) {
    return p.code === c;
  }) || { name: c, bc: '#94A3B8' };
}
/* ===== МОДАЛКИ ===== */
function showModal(h) {
  document.getElementById('modalRoot').innerHTML =
    '<div class="overlay" onclick="if(event.target===this)' +
    'closeModal()"><div class="modal">' + h +
    '</div></div>';
}
function closeModal() {
  document.getElementById('modalRoot').innerHTML = '';
}
var _cRes = null;
function cAsk(m) {
  return new Promise(function (r) {
    _cRes = r;
    showModal('<h3>Підтвердження</h3>' +
      '<p style="margin:8px 0 16px">' + esc(m) + '</p>' +
      '<div class="row">' +
      '<button class="btn sec" onclick="cDone(false)">' +
      'Скасувати</button>' +
      '<button class="btn danger" onclick="cDone(true)">' +
      'Так</button></div>');
  });
}
function cDone(v) {
  closeModal();
  if (_cRes) _cRes(v);
  _cRes = null;
}
/* ===== НАВІГАЦІЯ ===== */
var NAV = [['listings', '📋', 'Оголошення'],
  ['platforms', '🌐', 'Платформи'],
  ['messages', '💬', 'Чати'],
  ['stats', '📊', 'Статистика'],
  ['profile', '👤', 'Ще']];
function go(p, id) {
  page = p;
  if (p === 'edit') {
    editing = (id == null ? null : id);
    prepEdit();
  }
  closeModal();
  render();
  window.scrollTo(0, 0);
}
function renderNav() {
  var un = MSG.filter(function (m) {
    return !m.read;
  }).length;
  var b = '', t = '', i, n, on;
  for (i = 0; i < NAV.length; i++) {
    n = NAV[i];
    on = (page === n[0] ||
      (n[0] === 'listings' && page === 'edit'));
    b += '<button class="' + (on ? 'on' : '') + '"';
    b += ' onclick="go(\'' + n[0] + '\')">';
    b += '<span class="ic">' + n[1] + '</span>' + n[2];
    if (n[0] === 'messages' && un) {
      b += '<span class="badge">' + un + '</span>';
    }
    b += '</button>';
    t += '<button class="' + (on ? 'on' : '') + '"';
    t += ' onclick="go(\'' + n[0] + '\')">';
    t += n[1] + ' ' + n[2];
    if (n[0] === 'messages' && un) t += ' (' + un + ')';
    t += '</button>';
  }
  document.getElementById('botnav').innerHTML = b;
  document.getElementById('topnav').innerHTML = t;
}
function render() {
  try {
    renderNav();
    var v = document.getElementById('view');
    if (page === 'listings') v.innerHTML = vListings();
    else if (page === 'edit') v.innerHTML = vEdit();
    else if (page === 'platforms') v.innerHTML = vPlatforms();
    else if (page === 'messages') v.innerHTML = vMessages();
    else if (page === 'stats') v.innerHTML = vStats();
    else if (page === 'events') v.innerHTML = vEvents();
    else v.innerHTML = vProfile();
  } catch (e) { showErr('render: ' + e.message); }
}
function maybeOnboard() {
  kvGet('onboard', false).then(function (done) {
    if (done) return;
    showModal('<div style="text-align:center;' +
      'padding:10px 0">' +
      '<img src="icon.svg" width="64" height="64" alt="">' +
      '<h3 style="margin:10px 0">Вітаємо в UniBoard!</h3>' +
      '<p class="mut">1️⃣ Створіть оголошення з фото<br>' +
      '2️⃣ Оберіть платформи (19 доступних)<br>' +
      '3️⃣ Додаток адаптує текст і опублікує<br><br>' +
      '⚡ Telegram, Discord, Mastodon — автоматично<br>' +
      '📤 Facebook, WhatsApp, Viber — один дотик<br>' +
      '📋 OLX, IZI, Prom — крок за кроком</p>' +
      '<button class="btn wide" style="margin-top:10px" ' +
      'onclick="kvSet(\'onboard\',true);closeModal()">' +
      'Почнемо 🚀</button></div>');
  });
}
/* ===== СПИСОК ===== */
function vListings() {
  var items = L;
  if (search) {
    items = items.filter(function (l) {
      return (l.title + ' ' + l.description)
        .toLowerCase().indexOf(search.toLowerCase()) >= 0;
    });
  }
  if (fSt === 'draft') {
    items = items.filter(function (l) {
      return !pubsOf(l.id).length;
    });
  } else if (fSt !== 'all') {
    items = items.filter(function (l) {
      return pubsOf(l.id).some(function (p) {
        return p.status === fSt;
      }) || (fSt === 'paused' && l.status === 'paused');
    });
  }
  var h = '';
  h += '<div class="row" style="margin-bottom:8px">';
  h += '<div class="sbox"><span class="si">🔍</span>';
  h += '<input class="input" placeholder="Пошук..."';
  h += ' value="' + esc(search) + '"';
  h += ' oninput="search=this.value;render()"></div>';
  h += '<select class="input" style="max-width:128px"';
  h += ' onchange="sortB=this.value;sortListings();render()">';
  h += '<option value="new"';
  h += (sortB === 'new' ? ' selected' : '') + '>Нові</option>';
  h += '<option value="price"';
  h += (sortB === 'price' ? ' selected' : '');
  h += '>За ціною</option></select></div>';
  h += '<div class="chipsrow">';
  var chips = [['all', 'Всі ' + L.length],
    ['draft', 'Чернетки'], ['published', 'Опубліковані'],
    ['needs_action', 'Потребує дії'],
    ['error', 'Помилки'], ['paused', 'Призупинені']];
  for (var i = 0; i < chips.length; i++) {
    var c = chips[i];
    h += '<span class="chipf' + (fSt === c[0] ? ' on' : '');
    h += '" onclick="fSt=\'' + c[0] + '\';render()">';
    h += c[1] + '</span>';
  }
  h += '</div>';
  if (sel.length) {
    h += '<div class="card" style="background:var(--soft)">';
    h += '<div class="row">';
    h += '<button class="btn sm green" onclick="openPublish(sel)">▶ (' + sel.length + ')</button>';
    h += '<button class="btn sm" style="background:#FEF9C3;color:#A16207" onclick="bulkPause()">⏸</button>';
    h += '<button class="btn sm danger" onclick="bulkDelete()">🗑</button>';
    h += '<button class="btn sm sec" onclick="sel=[];render()">✕</button>';
    h += '</div></div>';
  }
  if (!items.length) {
    h += '<div class="empty"><div class="big">📋</div>';
    h += '<b>Немає оголошень</b><br>';
    h += '<span class="mut">Створіть перше — і опублікуйте всюди</span><br><br>';
    h += '<button class="btn" onclick="go(\'edit\',null)">＋ Створити</button></div>';
    return h;
  }
  for (var j = 0; j < items.length; j++) {
    h += cardHtml(items[j]);
  }
  return h;
}
function cardHtml(l) {
  var ms = mediaOf(l.id);
  var mn = ms.find(function (m) { return m.isMain; }) || ms[0];
  var ps = pubsOf(l.id);
  var h = '<div class="card"><div class="litem">';
  h += '<input type="checkbox" class="sel"';
  h += (sel.indexOf(l.id) >= 0 ? ' checked' : '');
  h += ' onchange="togSel(' + l.id + ')">';
  if (mn) h += '<img src="' + murl(mn) + '">';
  else {
    h += '<div style="width:72px;height:72px;';
    h += 'background:#F1F2F6;border-radius:14px;';
    h += 'display:flex;align-items:center;';
    h += 'justify-content:center;font-size:24px">🖼</div>';
  }
  h += '<div style="flex:1;min-width:0">';
  h += '<div class="ltitle">' + esc(l.title) + '</div>';
  h += '<div class="lprice"><b>' + priceText(l) + '</b>';
  if (l.neg) h += ' · торг';
  h += ' · ' + new Date(l.createdAt).toLocaleDateString('uk-UA');
  h += '</div><div style="margin-top:5px">';
  for (var i = 0; i < ps.length; i++) {
    var st = STATUS[ps[i].status] || [ps[i].status, ''];
    h += '<span class="chip ' + st[1] + '">';
    h += plogo(plOf(ps[i].platformCode), 14);
    h += ' ' + st[0] + '</span>';
  }
  if (l.status === 'paused') {
    h += '<span class="chip pau">⏸ Призупинено</span>';
  }
  h += '</div><div class="acts">';
  h += '<button class="abtn pri" onclick="openPublish([';
  h += l.id + '])">▶ Публікація</button>';
  h += '<button class="abtn" onclick="go(\'edit\',';
  h += l.id + ')" title="Редагувати">✏️</button>';
  h += '<button class="abtn" onclick="shareNative(';
  h += l.id + ')" title="Поділитися">📤</button>';
  h += '<button class="abtn" onclick="dup(' + l.id;
  h += ')" title="Дублювати">📋</button>';
  h += '<button class="abtn danger" onclick="delListing(';
  h += l.id + ')" title="Видалити">🗑</button>';
  h += '</div></div></div></div>';
  return h;
}
function togSel(id) {
  sel = sel.indexOf(id) >= 0
    ? sel.filter(function (x) { return x !== id; })
    : sel.concat([id]);
  render();
}
function dup(id) {
  DB.get('listings', id).then(function (l) {
    var c = Object.assign({}, l, {
      title: l.title + ' (копія)',
      createdAt: Date.now(), updatedAt: Date.now() });
    delete c.id;
    return DB.put('listings', c);
  }).then(function () {
    log('copy', 'Дубль');
    toast('Дубльовано', 'ok');
    return loadAll();
  }).then(render);
}
function delListing(id) {
  cAsk('Видалити оголошення назавжди?').then(function (ok) {
    if (!ok) return;
    var p = Promise.resolve();
    mediaOf(id).forEach(function (m) {
      p = p.then(function () { return DB.del('media', m.id); });
    });
    pubsOf(id).forEach(function (x) {
      p = p.then(function () {
        return DB.del('publications', x.id); });
    });
    p.then(function () { return DB.del('listings', id); })
      .then(function () {
        log('delete', 'Видалено #' + id);
        toast('Видалено', 'ok');
        return loadAll();
      }).then(render);
  });
}
function bulkDelete() {
  cAsk('Видалити ' + sel.length + ' оголошень?')
    .then(function (ok) {
      if (!ok) return;
      var p = Promise.resolve();
      sel.forEach(function (id) {
        mediaOf(id).forEach(function (m) {
          p = p.then(function () {
            return DB.del('media', m.id); });
        });
        pubsOf(id).forEach(function (x) {
          p = p.then(function () {
            return DB.del('publications', x.id); });
        });
        p = p.then(function () {
          return DB.del('listings', id); });
      });
      p.then(function () { sel = []; return loadAll(); })
        .then(render)
        .then(function () { toast('Видалено', 'ok'); });
    });
}
function bulkPause() {
  Promise.all(sel.map(function (id) {
    return DB.get('listings', id).then(function (l) {
      l.status = 'paused';
      return DB.put('listings', l);
    });
  })).then(function () {
    sel = [];
    return loadAll();
  }).then(render)
    .then(function () { toast('Призупинено', 'ok'); });
}
function shareNative(id) {
  DB.get('listings', id).then(function (l) {
    return pubLink(l).then(function (u) {
      var t = l.title + ' — ' + priceText(l);
      if (navigator.share) {
        navigator.share({ title: t, text: t, url: u })
          .catch(function () {});
        return;
      }
      window.open('https://t.me/share/url?url=' +
        encodeURIComponent(u) + '&text=' +
        encodeURIComponent(t), '_blank');
    });
  });
}
/* ===== РЕДАГУВАННЯ ===== */
var F = {};
function prepEdit() {
  if (editing) {
    var l = L.find(function (x) { return x.id === editing; });
    F = JSON.parse(JSON.stringify(l));
    F.attrs = F.attrs || [];
    editMedia = mediaOf(editing).map(function (m) {
      return Object.assign({}, m); });
  } else {
    F = { title: '', description: '', price: '',
      currency: 'UAH', category: CATS[0],
      offerType: 'sale', condition: 'used',
      brand: '', model: '', attrs: [], neg: 0,
      location: PROFILE.city || '',
      delivery: PROFILE.delivery || '' };
    editMedia = [];
  }
}
function quality() {
  var s = 0, iss = [];
  if ((F.title || '').length >= 10) s += 20;
  else iss.push('Заголовок короткий');
  if ((F.description || '').length >= 100) s += 30;
  else iss.push('Опис короткий');
  if (F.offerType === 'free') s += 15;
  else if (+F.price > 0) s += 15;
  else iss.push('Вкажіть ціну');
  if (F.location) s += 10;
  if (attrsOf(F).length >= 2) s += 5;
  if (editMedia.length >= 3) s += 15;
  else if (editMedia.length) s += 5;
  else iss.push('Мінімум 3 фото');
  return { s: Math.min(100, s), iss: iss };
}
function addAttr() {
  (F.attrs || (F.attrs = [])).push({ n: '', v: '' });
  render();
}
function rmAttr(i) {
  F.attrs.splice(i, 1);
  render();
}
function vEdit() {
  var q = quality();
  var free = (F.offerType === 'free');
  var h = '';
  h += '<button class="btn sm sec"';
  h += ' onclick="go(\'listings\')">← Назад</button>';
  h += '<div class="card" style="margin-top:10px">';
  h += '<div class="gtitle">Основне</div>';
  h += '<label class="label">Заголовок *</label>';
  h += '<div class="row"><input class="input" value="';
  h += esc(F.title) + '" maxlength="200"';
  h += ' oninput="F.title=this.value;qRefresh()">';
  h += '<button class="btn sec" onclick="aiTitle()">✨</button></div>';
  h += '<label class="label">Опис *</label>';
  h += '<textarea rows="6"';
  h += ' oninput="F.description=this.value;qRefresh()">';
  h += esc(F.description) + '</textarea></div>';
  h += '<div class="card"><div class="gtitle">Параметри</div>';
  h += '<div class="grid2">';
  h += '<div><label class="label">';
  h += free ? 'Ціна (необов\'язково)' : 'Ціна *';
  h += '</label>';
  h += '<input class="input" type="number" value="';
  h += esc(F.price) + '"';
  h += ' oninput="F.price=this.value;qRefresh()"></div>';
  h += '<div><label class="label">Валюта</label>';
  h += '<select onchange="F.currency=this.value">';
  h += '<option' + (F.currency === 'UAH' ? ' selected' : '');
  h += '>UAH</option>';
  h += '<option' + (F.currency === 'USD' ? ' selected' : '');
  h += '>USD</option>';
  h += '<option' + (F.currency === 'EUR' ? ' selected' : '');
  h += '>EUR</option></select></div>';
  h += '<div><label class="label">Категорія</label>';
  h += '<select onchange="F.category=this.value">';
  for (var i = 0; i < CATS.length; i++) {
    h += '<option' + (F.category === CATS[i] ? ' selected' : '');
    h += '>' + CATS[i] + '</option>';
  }
  h += '</select></div>';
  h += '<div><label class="label">Тип пропозиції</label>';
  h += '<select';
  h += ' onchange="F.offerType=this.value;render()">';
  h += '<option value="sale"';
  h += (F.offerType === 'sale' ? ' selected' : '');
  h += '>Продаж</option><option value="rent"';
  h += (F.offerType === 'rent' ? ' selected' : '');
  h += '>Оренда</option><option value="exchange"';
  h += (F.offerType === 'exchange' ? ' selected' : '');
  h += '>Обмін</option><option value="free"';
  h += (F.offerType === 'free' ? ' selected' : '');
  h += '>Задармо</option></select></div>';
  h += '<div><label class="label">Стан</label>';
  h += '<select onchange="F.condition=this.value">';
  h += '<option value="new"';
  h += (F.condition === 'new' ? ' selected' : '');
  h += '>Новий</option><option value="used"';
  h += (F.condition === 'used' ? ' selected' : '');
  h += '>Вживаний</option><option value="ref"';
  h += (F.condition === 'ref' ? ' selected' : '');
  h += '>Відновлений</option></select></div>';
  h += '<div><label class="label">Бренд</label>';
  h += '<input class="input" value="' + esc(F.brand) + '"';
  h += ' oninput="F.brand=this.value"></div>';
  h += '<div><label class="label">Модель</label>';
  h += '<input class="input" value="' + esc(F.model) + '"';
  h += ' oninput="F.model=this.value"></div>';
  h += '<div><label class="label">Місто</label>';
  h += '<input class="input" value="' + esc(F.location) + '"';
  h += ' oninput="F.location=this.value"></div>';
  h += '</div>';
  h += '<label class="chk"><input type="checkbox"';
  h += (F.neg ? ' checked' : '');
  h += ' onchange="F.neg=this.checked?1:0">';
  h += '🤝 Торг доречний</label>';
  h += '<label class="label">Доставка</label>';
  h += '<input class="input" value="' + esc(F.delivery) + '"';
  h += ' oninput="F.delivery=this.value"></div>';
  h += '<div class="card"><div class="gtitle">';
  h += 'Характеристики</div>';
  h += '<div class="mut" style="margin:0 0 8px">';
  h += 'Будь-які параметри: розмір, колір, пробіг, поверх, комплект… Потрапляють у тексти оголошень.</div>';
  var at = F.attrs || (F.attrs = []);
  for (var ai = 0; ai < at.length; ai++) {
    h += '<div class="row" style="margin-bottom:6px">';
    h += '<input class="input" placeholder="Назва"';
    h += ' value="' + esc(at[ai].n) + '"';
    h += ' oninput="F.attrs[' + ai + '].n=this.value">';
    h += '<input class="input" placeholder="Значення"';
    h += ' value="' + esc(at[ai].v) + '"';
    h += ' oninput="F.attrs[' + ai + '].v=this.value">';
    h += '<button class="btn sec" style="min-width:44px"';
    h += ' onclick="rmAttr(' + ai + ')">✕</button></div>';
  }
  h += '<button class="btn sec sm" onclick="addAttr()">';
  h += '＋ Додати характеристику</button></div>';
  h += '<div class="card"><div class="gtitle">Фото</div>';
  if (editMedia.length) {
    h += '<div class="mgrid">';
    for (var m = 0; m < editMedia.length; m++) {
      h += '<div class="m"><img src="';
      h += editMedia[m].blob ? murl(editMedia[m]) : '';
      h += '">' + (editMedia[m].isMain
        ? '<span class="star">⭐</span>' : '');
      h += '<button class="del" onclick="rmMedia(' + m + ')">✕</button>';
      h += '<button class="main" onclick="mainMedia(' + m + ')">⭐</button>';
      h += '</div>';
    }
    h += '</div>';
  }
  h += '<input type="file" id="fin" accept="image/*,video/*"';
  h += ' multiple style="display:none"';
  h += ' onchange="addFiles(this.files)">';
  h += '<button class="btn sec wide"';
  h += ' onclick="document.getElementById(\'fin\').click()">';
  h += '📷 Додати фото/відео</button></div>';
  h += '<div class="savebar">';
  h += '<button class="btn" style="flex:2"';
  h += ' onclick="saveListing()">💾 Зберегти</button>';
  if (editing) {
    h += '<button class="btn green" style="flex:2"';
    h += ' onclick="openPublish([' + editing + '])">▶</button>';
    h += '<button class="btn sec" style="flex:1"';
    h += ' onclick="shareNative(' + editing + ')">📤</button>';
  }
  h += '</div>';
  h += '<div class="card"><div class="gtitle">✨ Якість: ';
  h += '<span id="qs" style="color:var(--pri)">';
  h += q.s + '/100</span></div>';
  h += '<div style="background:#E5E7EB;height:6px;';
  h += 'border-radius:3px;margin:4px 0 8px">';
  h += '<div id="qb" style="background:var(--pri);height:6px;';
  h += 'border-radius:3px;width:' + q.s + '%"></div></div>';
  h += '<div id="qi">';
  for (var k = 0; k < q.iss.length; k++) {
    h += '<div class="warn">⚠️ ' + q.iss[k] + '</div>';
  }
  h += '</div></div>';
  if (editing) h += vPubs(editing);
  return h;
}
function qRefresh() {
  var q = quality();
  var a = document.getElementById('qs');
  if (!a) return;
  a.textContent = q.s + '/100';
  document.getElementById('qb').style.width = q.s + '%';
  var html = '';
  for (var i = 0; i < q.iss.length; i++) {
    html += '<div class="warn">⚠️ ' + q.iss[i] + '</div>';
  }
  document.getElementById('qi').innerHTML = html;
}
function aiTitle() {
  var p = [F.brand, F.model,
    F.condition === 'new' ? 'новий' : null, F.category]
    .filter(Boolean).join(' ');
  if (p) { F.title = p; render(); toast('Запропоновано', 'ok'); }
}
function addFiles(fs) {
  var arr = Array.from(fs);
  var p = Promise.resolve();
  arr.forEach(function (f) {
    p = p.then(function () {
      if (f.type.indexOf('image/') === 0) {
        return createImageBitmap(f).then(function (b) {
          var w = b.width, h = b.height, mx = 2000;
          if (w > mx || h > mx) {
            var r = Math.min(mx / w, mx / h);
            w = Math.round(w * r);
            h = Math.round(h * r);
          }
          var c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(b, 0, 0, w, h);
          return new Promise(function (rr) {
            c.toBlob(rr, 'image/jpeg', 0.85); });
        }).then(function (bl) {
          editMedia.push({ blob: bl, type: 'image',
            name: f.name, isMain: editMedia.length === 0,
            pos: editMedia.length });
        }).catch(function () {
          toast('Не оброблено: ' + f.name, 'err'); });
      } else if (f.type.indexOf('video/') === 0) {
        if (f.size > 50 * 1024 * 1024) {
          toast('Відео >50МБ', 'err'); return;
        }
        editMedia.push({ blob: f, type: 'video',
          name: f.name, isMain: false,
          pos: editMedia.length });
      }
    });
  });
  p.then(function () {
    render();
    toast('Додано: ' + arr.length, 'ok');
  });
}
function rmMedia(i) {
  editMedia.splice(i, 1);
  editMedia.forEach(function (m, x) {
    m.pos = x; if (x === 0) m.isMain = true; });
  render();
}
function mainMedia(i) {
  editMedia.forEach(function (m, x) { m.isMain = (x === i); });
  render();
}
function saveListing() {
  if (!F.title || F.title.length < 3) {
    return toast('Заголовок ≥3 символи', 'err');
  }
  if (!F.description || F.description.length < 10) {
    return toast('Опис ≥10 символів', 'err');
  }
  if (F.offerType !== 'free' && !(+F.price > 0)) {
    return toast('Вкажіть ціну', 'err');
  }
  var now = Date.now();
  var rec = Object.assign({}, F, {
    price: +F.price || 0, updatedAt: now,
    status: F.status || 'draft' });
  var id = editing;
  var chain = Promise.resolve();
  if (id) {
    rec.id = id;
    chain = chain.then(function () {
      return DB.put('listings', rec); });
  } else {
    rec.createdAt = now;
    chain = chain.then(function () {
      return DB.put('listings', rec);
    }).then(function (nid) { editing = id = nid; });
  }
  chain = chain.then(function () {
    var keep = editMedia.filter(function (m) {
      return m.id; }).map(function (m) { return m.id; });
    var p = Promise.resolve();
    mediaOf(id).forEach(function (m) {
      if (keep.indexOf(m.id) < 0) {
        p = p.then(function () {
          delete urlCache[m.id];
          return DB.del('media', m.id); });
      }
    });
    editMedia.forEach(function (m, i) {
      p = p.then(function () {
        m.listingId = id; m.pos = i;
        if (i === 0) m.isMain = true;
        return DB.put('media', { blob: m.blob,
          type: m.type, name: m.name, w: m.w, h: m.h,
          isMain: m.isMain, pos: m.pos, listingId: id });
      }).then(function (nid) { if (!m.id) m.id = nid; });
    });
    return p;
  });
  chain.then(function () {
    log('save', 'Збережено: ' + F.title);
    toast('Збережено', 'ok');
    return loadAll();
  }).then(function () { go('edit', editing); })
    .catch(function (e) { toast(e.message, 'err'); });
}
function vPubs(id) {
  var ps = pubsOf(id);
  if (!ps.length) return '';
  var h = '<div class="card"><div class="gtitle">';
  h += '🎯 Центр публікацій</div>';
  for (var i = 0; i < ps.length; i++) {
    var p = ps[i];
    var pf = plOf(p.platformCode);
    var st = STATUS[p.status] || [p.status, ''];
    h += '<div class="pf"><div>';
    h += '<span class="dot ' +
      (p.status === 'published' ? 'on' : 'off') + '"></span>';
    h += '<span class="n">' + plogo(pf, 22) + ' ';
    h += esc(pf.name) + '</span> ';
    h += '<span class="chip ' + st[1] + '">';
    h += st[0] + '</span><div class="d">' + fmtd(p.createdAt);
    if (p.error) h += ' · ' + esc(p.error);
    h += '</div></div>';
    h += '<div class="row" style="flex:0;flex-wrap:wrap;';
    h += 'justify-content:flex-end">';
    if (p.status === 'needs_action') {
      h += '<button class="btn sm sec" onclick="copyPub(';
      h += p.id + ')">📋</button>';
      h += '<button class="btn sm sec" onclick="savePhotos(';
      h += p.listingId + ')">📷</button>';
      h += '<button class="btn sm" onclick="window.open(\'';
      h += p.externalUrl + '\')">↗</button>';
      h += '<button class="btn sm green" onclick="markPub(';
      h += p.id + ',\'published\')">✅</button>';
      h += '<button class="btn sm danger" onclick="markPub(';
      h += p.id + ',\'error\')">✕</button>';
    } else {
      h += '<button class="btn sm sec" onclick="retryPub(';
      h += p.id + ')">🔄</button>';
      h += '<button class="btn sm danger" onclick="delPub(';
      h += p.id + ')">✕</button>';
    }
    h += '</div></div>';
  }
  return h + '</div>';
}
function copyPub(pid) {
  DB.get('publications', pid).then(function (p) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(p.adapted).then(
        function () { toast('Текст скопійовано', 'ok'); },
        function () { showText(p.adapted); });
    } else showText(p.adapted);
  });
}
function showText(t) {
  showModal('<h3>Скопіюйте текст</h3><div class="pre">' +
    esc(t) + '</div>');
}
function savePhotos(lid) {
  var ms = mediaOf(lid).filter(function (m) {
    return m.type === 'image'; });
  if (!ms.length) return toast('Немає фото');
  var p = Promise.resolve();
  ms.forEach(function (m) {
    p = p.then(function () {
      var a = document.createElement('a');
      a.href = murl(m);
      a.download = m.name || 'photo.jpg';
      a.click();
      return new Promise(function (r) { setTimeout(r, 300); });
    });
  });
  p.then(function () {
    toast('Фото збережено у завантаження', 'ok'); });
}
function markPub(pid, st) {
  DB.get('publications', pid).then(function (p) {
    p.status = st; p.updatedAt = Date.now();
    return DB.put('publications', p);
  }).then(function () {
    log(st === 'published' ? 'publish' : 'error',
      'статус оновлено');
    return loadAll();
  }).then(render)
    .then(function () { toast('Статус оновлено', 'ok'); });
}
function retryPub(pid) {
  DB.get('publications', pid).then(function (p) {
    return DB.get('listings', p.listingId).then(function (l) {
      return doPublishOne(l, p.platformCode, p); });
  }).then(function () { return loadAll(); }).then(render);
}
function delPub(pid) {
  DB.del('publications', pid)
    .then(function () { return loadAll(); }).then(render);
}
/* ===== ПУБЛІЧНЕ ПОСИЛАННЯ ===== */
function thumbData(m, max, q) {
  return new Promise(function (res) {
    var i = new Image();
    i.onload = function () {
      var w = i.width, h = i.height;
      var r = Math.min(1, max / Math.max(w, h));
      w = Math.round(w * r); h = Math.round(h * r);
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(i, 0, 0, w, h);
      res(c.toDataURL('image/jpeg', q));
    };
    i.onerror = function () { res(null); };
    i.src = murl(m);
  });
}
function b64u(u) {
  var s = '';
  u.forEach(function (b) { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_')
    .replace(/=+$/, '');
}
function unb64u(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  var b = atob(s);
  var u = new Uint8Array(b.length);
  for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
}
function pubLink(l) {
  var ms = mediaOf(l.id).filter(function (m) {
    return m.type === 'image'; });
  var chain = Promise.resolve([]);
  if (ms.length) {
    chain = thumbData(ms[0], 360, 0.6).then(function (t) {
      return t ? [t] : []; });
  }
  return chain.then(function (ph) {
    var o = { t: l.title, d: l.description, p: l.price,
      c: l.currency, fr: l.offerType === 'free' ? 1 : 0,
      ng: l.neg ? 1 : 0, a: attrsOf(l),
      cat: l.category, loc: l.location,
      ct: { ph: PROFILE.phone, em: PROFILE.email,
        tg: PROFILE.tg }, ph: ph };
    var j = JSON.stringify(o);
    var base = location.origin + location.pathname + '#v=';
    if (typeof CompressionStream !== 'undefined') {
      var c = new CompressionStream('gzip');
      var w = c.writable.getWriter();
      w.write(new TextEncoder().encode(j));
      w.close();
      return new Response(c.readable).arrayBuffer()
        .then(function (ab) {
          return base + 'g' + b64u(new Uint8Array(ab)); });
    }
    return base + 'u' + b64u(new TextEncoder().encode(j));
  });
}
function decodeLink(s) {
  var pref = s[0], rest = s.slice(1);
  if (pref === 'g') {
    var c = new DecompressionStream('gzip');
    var w = c.writable.getWriter();
    w.write(unb64u(rest));
    w.close();
    return new Response(c.readable).text();
  }
  return Promise.resolve(
    new TextDecoder().decode(unb64u(rest)));
}
function renderPublic(o) {
  document.body.classList.add('pubmode');
  var ct = o.ct || {};
  var h = '<div class="card" style="margin-top:20px">';
  if (o.ph && o.ph[0]) {
    h += '<img src="' + o.ph[0] + '"';
    h += ' style="width:100%;border-radius:14px;';
    h += 'margin-bottom:12px">';
  }
  h += '<div class="pubhero" style="margin:-14px -14px 12px">';
  h += '<div class="p">';
  h += o.fr ? 'Задармо' : (o.p + ' ' + o.c);
  if (o.ng) h += ' · торг';
  h += '</div>';
  h += '<div style="font-size:18px;font-weight:700">';
  h += esc(o.t) + '</div></div>';
  h += '<div class="chip">' + esc(o.cat || '') + '</div>';
  h += '<div class="chip">📍 ' + esc(o.loc || '-') + '</div>';
  var at = o.a || [];
  for (var i = 0; i < at.length; i++) {
    h += '<div class="chip">' + esc(at[i].n) + ': ';
    h += esc(at[i].v) + '</div>';
  }
  h += '<p style="white-space:pre-wrap;margin:12px 0">';
  h += esc(o.d) + '</p><div class="row" style="flex-wrap:wrap">';
  if (ct.ph) {
    h += '<a class="btn green" style="text-decoration:none"';
    h += ' href="tel:' + esc(ct.ph) + '">📞 Подзвонити</a>';
  }
  if (ct.tg) {
    h += '<a class="btn" style="text-decoration:none"';
    h += ' href="https://t.me/' +
      esc(String(ct.tg).replace('@', '')) +
      '" target="_blank">✈️ Telegram</a>';
  }
  if (ct.em) {
    h += '<a class="btn sec" style="text-decoration:none"';
    h += ' href="mailto:' + esc(ct.em) + '">✉️ Email</a>';
  }
  h += '</div><div style="margin-top:16px;';
  h += 'border-top:1px solid var(--line);padding-top:12px">';
  h += '<button class="btn sec wide" onclick="importPublic()">';
  h += '💾 Зберегти в мій UniBoard</button>';
  h += '<div class="mut" style="text-align:center;';
  h += 'margin-top:8px">UniBoard</div></div></div>';
  document.getElementById('view').innerHTML = h;
  window._pub = o;
}
function importPublic() {
  var o = window._pub;
  if (!o) return;
  var now = Date.now();
  DB.put('listings', { title: o.t, description: o.d,
    price: o.p || 0, currency: o.c,
    offerType: o.fr ? 'free' : 'sale',
    neg: o.ng ? 1 : 0, attrs: o.a || [],
    category: o.cat, location: o.loc,
    condition: 'used', brand: '', model: '', delivery: '',
    createdAt: now, updatedAt: now, status: 'draft' })
    .then(function (id) {
      var chain = Promise.resolve();
      if (o.ph && o.ph[0]) {
        chain = fetch(o.ph[0]).then(function (r) {
          return r.blob();
        }).then(function (bl) {
          return DB.put('media', { blob: bl, type: 'image',
            name: 'import.jpg', isMain: true, pos: 0,
            listingId: id });
        });
      }
      return chain.then(function () {
        location.hash = '';
        document.body.classList.remove('pubmode');
        return loadAll();
      }).then(function () {
        go('edit', id);
        toast('Імпортовано', 'ok');
      });
    });
}
/* ===== АДАПТАЦІЯ / ПУБЛІКАЦІЯ ===== */
function adapt(l, code) {
  var w = [];
  var t = l.title, d = l.description;
  var lim = { olx: [100, 32000], izi: [100, 10000],
    prom: [255, 20000], shafa: [100, 3000],
    fb_market: [100, 1000], kidstaff: [100, 10000],
    crafta: [150, 15000], besplatka: [100, 10000],
    flagma: [120, 15000], mastodon: [500, 500] }[code]
    || [200, 10000];
  if (t.length > lim[0]) {
    w.push('Заголовок обрізано до ' + lim[0]);
    t = t.slice(0, lim[0]);
  }
  if (d.length > lim[1]) {
    w.push('Опис обрізано до ' + lim[1]);
    d = d.slice(0, lim[1]);
  }
  var cond = { new: 'новий', used: 'вживаний',
    ref: 'відновлений' }[l.condition] || '-';
  var pl = (l.offerType === 'free')
    ? '🎁 Задармо'
    : '💰 ' + l.price + ' ' + l.currency;
  if (l.neg) pl += ' · торг доречний';
  var at = attrsOf(l);
  var attrP = '', attrT = '';
  for (var i = 0; i < at.length; i++) {
    attrP += '\n• ' + at[i].n + ': ' + at[i].v;
    attrT += '\n• ' + esc(at[i].n) + ': ' + esc(at[i].v);
  }
  var plain = t + '\n\n' + pl + '\n📦 ' + cond + attrP +
    '\n📍 ' + (l.location || '-') +
    '\n🚚 ' + (l.delivery || '-') +
    '\n📞 ' + (PROFILE.phone || '-') + '\n\n' + d;
  if (code === 'telegram') {
    return { text: '<b>' + esc(t) + '</b>\n\n' + pl +
      '\n📦 ' + cond + attrT + '\n📍 ' +
      esc(l.location || '-') + '\n📞 ' +
      esc(PROFILE.phone || '-') + '\n\n' + esc(d),
      warn: w };
  }
  if (code === 'mastodon') {
    var m = t + '\n' + pl + attrP +
      '\n' + (l.location || '') + '\n' + d;
    if (m.length > 500) {
      m = m.slice(0, 497) + '...';
      w.push('Mastodon: ліміт 500');
    }
    return { text: m, warn: w };
  }
  return { text: plain, warn: w };
}
function openPublish(ids) {
  pubIds = ids; pubSel = [];
  function grp(g, ttl) {
    var arr = PL.filter(function (p) { return p.grp === g; });
    if (!arr.length) return '';
    var h = '<div class="grp">' + ttl + '</div>';
    for (var i = 0; i < arr.length; i++) {
      var p = arr[i];
      var c = CONN[p.code];
      var dis = (g === 'auto' && !(c && c.on));
      h += '<label class="pf" style="cursor:';
      h += dis ? 'not-allowed' : 'pointer';
      h += ';opacity:' + (dis ? '.5' : '1') + '"><div>';
      h += '<span class="n">' + plogo(p, 26) + ' ' + p.name;
      h += '</span><div class="d">' + p.desc;
      if (dis) h += ' · ⚠️ спершу підключіть';
      h += '</div></div>';
      h += '<input type="checkbox"';
      h += ' style="width:22px;height:22px"';
      if (dis) h += ' disabled';
      h += ' value="' + p.code + '"';
      h += ' onchange="pubSel=Array.from(document.querySelectorAll(\'#modalRoot input:checked\')).map(function(i){return i.value;})">';
      h += '</label>';
    }
    return h;
  }
  showModal('<h3>Куди публікувати?</h3>' +
    grp('auto', '⚡ Автоматично') +
    grp('share', '📤 Один дотик') +
    grp('manual', '📋 Крок за кроком') +
    '<div class="row" style="margin-top:14px">' +
    '<button class="btn sec" onclick="closeModal()">Скасувати</button>' +
    '<button class="btn" onclick="previewPublish()">Далі →</button></div>');
}
function previewPublish() {
  if (!pubSel.length) return toast('Оберіть платформи', 'err');
  DB.get('listings', pubIds[0]).then(function (l) {
    var h = '<h3>Попередній перегляд</h3>';
    for (var i = 0; i < pubSel.length; i++) {
      var code = pubSel[i];
      var p = plOf(code);
      var a = adapt(l, code);
      h += '<div class="card"><b style="display:flex;';
      h += 'align-items:center;gap:8px">' + plogo(p, 22);
      h += ' ' + p.name + '</b>';
      if (p.grp === 'auto') {
        h += '<div class="okbox">⚡ Буде опубліковано автоматично</div>';
      } else if (p.grp === 'share') {
        h += '<div class="okbox">📤 Відкриється шеринг з публічним посиланням</div>';
      } else {
        h += '<div class="warn">📋 Скопіюємо текст і відкриємо сайт — ви завершите кроками</div>';
      }
      for (var k = 0; k < a.warn.length; k++) {
        h += '<div class="warn">⚠️ ' + a.warn[k] + '</div>';
      }
      h += '<div class="pre">' + esc(a.text) + '</div></div>';
    }
    h += '<div class="row">';
    h += '<button class="btn sec" onclick="openPublish(pubIds)">← Назад</button>';
    h += '<button class="btn green" onclick="runPublish()">✅ Підтвердити</button></div>';
    showModal(h);
  });
}
function runPublish() {
  closeModal();
  toast('Публікація...');
  var manualLid = null;
  var p = Promise.resolve();
  pubIds.forEach(function (lid) {
    pubSel.forEach(function (code) {
      p = p.then(function () {
        return DB.get('listings', lid).then(function (l) {
          return doPublishOne(l, code, null);
        }).then(function (r) {
          if (r === 'manual') manualLid = lid;
        });
      });
    });
  });
  p.then(function () { sel = []; return loadAll(); })
    .then(render).then(function () {
      if (manualLid) openManual(manualLid);
      toast('Готово. Перевірте статуси', 'ok');
    });
}
function doPublishOne(l, code, ex) {
  var p = plOf(code);
  var rec = ex ? Object.assign({}, ex) : {
    listingId: l.id, platformCode: code,
    createdAt: Date.now() };
  rec.status = 'publishing'; rec.error = null;
  return DB.put('publications', rec).then(function (pid) {
    rec.id = pid;
    var a = adapt(l, code);
    var ms = mediaOf(l.id).filter(function (m) {
      return m.type === 'image'; });
    var blobs = ms.map(function (m) { return m.blob; });
    var chain = Promise.resolve();
    if (p.grp === 'auto') {
      if (code === 'telegram') {
        chain = tgSend(CONN.telegram, a.text, blobs)
          .then(function (mid) {
            rec.status = 'published';
            rec.externalId = String(mid);
            log('publish', '⚡ Telegram: ' + l.title);
          });
      } else if (code === 'discord') {
        chain = dcSend(CONN.discord.webhook, a.text, blobs)
          .then(function () {
            rec.status = 'published';
            log('publish', '⚡ Discord: ' + l.title);
          });
      } else if (code === 'mastodon') {
        chain = maSend(CONN.mastodon.instance,
          CONN.mastodon.token, a.text).then(function (u) {
            rec.status = 'published';
            rec.externalUrl = u;
            log('publish', '⚡ Mastodon: ' + l.title);
          });
      }
    } else if (p.grp === 'share') {
      chain = pubLink(l).then(function (u) {
        var t = l.title + ' — ' + priceText(l);
        var url = p.share
          .replace('{U}', encodeURIComponent(u))
          .replace('{T}', encodeURIComponent(t));
        window.open(url, '_blank');
        rec.status = 'published';
        rec.externalUrl = url;
        rec.adapted = a.text;
        log('publish', '📤 ' + p.name + ': ' + l.title);
      });
    } else {
      chain = Promise.resolve().then(function () {
        if (navigator.clipboard) {
          return navigator.clipboard
            .writeText(a.text).catch(function () {});
        }
      }).then(function () {
        rec.status = 'needs_action';
        rec.externalUrl = p.url;
        rec.adapted = a.text;
        log('publish', '📋 ' + p.name + ': ' + l.title);
      });
    }
    return chain.catch(function (e) {
      rec.status = 'error';
      rec.error = String(e.message || e);
      log('error', '❌ ' + p.name + ': ' + rec.error);
    }).then(function () {
      rec.updatedAt = Date.now();
      return DB.put('publications', rec);
    }).then(function () {
      return rec.status === 'needs_action'
        ? 'manual' : rec.status;
    });
  });
}
function openManual(lid) {
  var ps = pubsOf(lid).filter(function (p) {
    return p.status === 'needs_action'; });
  if (!ps.length) return;
  var h = '<h3>📋 Завершення публікації</h3>';
  h += '<p class="mut">Текст уже скопійовано. Кроки:</p>';
  for (var i = 0; i < ps.length; i++) {
    var p = ps[i];
    var pf = plOf(p.platformCode);
    h += '<div class="card"><b style="display:flex;';
    h += 'align-items:center;gap:8px">' + plogo(pf, 22);
    h += ' ' + pf.name + '</b>';
    h += '<div class="step"><span class="num">1</span>';
    h += '<button class="btn sm sec" onclick="copyPub(' + p.id + ')">📋 Текст</button>';
    h += '<button class="btn sm sec" onclick="savePhotos(' + p.listingId + ')">📷 Фото</button></div>';
    h += '<div class="step"><span class="num">2</span>';
    h += '<button class="btn sm" onclick="window.open(\'' + p.externalUrl + '\')">↗ Відкрити сайт і вставити</button></div>';
    h += '<div class="step"><span class="num">3</span>';
    h += '<button class="btn sm green" onclick="markPub(' + p.id + ',\'published\');closeModal()">✅ Я опублікував</button>';
    h += '<button class="btn sm danger" onclick="markPub(' + p.id + ',\'error\');closeModal()">✕ Не вийшло</button></div></div>';
  }
  showModal(h);
}
/* ===== АВТО-АДАПТЕРИ ===== */
function tgSend(c, text, blobs) {
  var F = function (m) {
    return 'https://api.telegram.org/bot' + c.token + '/' + m;
  };
  if (blobs.length === 1) {
    var fd = new FormData();
    fd.append('chat_id', c.chat);
    fd.append('caption', text);
    fd.append('parse_mode', 'HTML');
    fd.append('photo', blobs[0], 'photo.jpg');
    return fetch(F('sendPhoto'), { method: 'POST', body: fd })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok) throw new Error(d.description);
        return d.result.message_id; });
  }
  if (blobs.length > 1) {
    var fd2 = new FormData();
    fd2.append('chat_id', c.chat);
    var mj = [];
    blobs.slice(0, 10).forEach(function (b, i) {
      var fn = 'f' + i;
      fd2.append(fn, b, fn + '.jpg');
      mj.push(i === 0
        ? { type: 'photo', media: 'attach://' + fn,
          caption: text, parse_mode: 'HTML' }
        : { type: 'photo', media: 'attach://' + fn });
    });
    fd2.append('media', JSON.stringify(mj));
    return fetch(F('sendMediaGroup'),
      { method: 'POST', body: fd2 })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok) throw new Error(d.description);
        return d.result[0].message_id; });
  }
  return fetch(F('sendMessage'), { method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: c.chat, text: text,
      parse_mode: 'HTML' }) })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d.ok) throw new Error(d.description);
      return d.result.message_id; });
}
function dcSend(hook, text, blobs) {
  if (blobs.length) {
    var fd = new FormData();
    fd.append('payload_json', JSON.stringify(
      { content: text.slice(0, 2000) }));
    blobs.slice(0, 10).forEach(function (b, i) {
      fd.append('files[' + i + ']', b, 'photo.jpg'); });
    return fetch(hook, { method: 'POST', body: fd })
      .then(function (r) {
        if (!r.ok) throw new Error('Discord ' + r.status); });
  }
  return fetch(hook, { method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: text.slice(0, 2000) }) })
    .then(function (r) {
      if (!r.ok) throw new Error('Discord ' + r.status); });
}
function maSend(inst, token, text) {
  return fetch(inst.replace(/\/$/, '') + '/api/v1/statuses', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json' },
    body: JSON.stringify({ status: text }) })
    .then(function (r) {
      if (!r.ok) throw new Error('Mastodon ' + r.status);
      return r.json();
    }).then(function (d) { return d.url; });
}
/* ===== ПЛАТФОРМИ ===== */
function vPlatforms() {
  function grp(g, ttl) {
    var h = '<div class="grp">' + ttl + '</div>';
    var arr = PL.filter(function (p) { return p.grp === g; });
    for (var i = 0; i < arr.length; i++) {
      var p = arr[i];
      var c = CONN[p.code];
      h += '<div class="card"><div class="pf"';
      h += ' style="border:none;padding:0"><div>';
      h += '<span class="n">' + plogo(p, 30) + ' ' + p.name;
      h += '</span><div class="d">' + p.desc;
      h += ' · ' + (c && c.on ? 'підключено' : 'не підключено');
      h += '</div></div>';
      if (p.grp === 'auto') {
        if (c && c.on) {
          h += '<button class="btn sm danger"';
          h += ' onclick="disConn(\'' + p.code + '\')">';
          h += 'Відключити</button>';
        } else {
          h += '<button class="btn sm"';
          h += ' onclick="connForm(\'' + p.code + '\')">';
          h += 'Підключити</button>';
        }
      } else {
        h += '<span class="chip ' +
          (p.grp === 'share' ? 'pub' : 'act') + '">';
        h += (p.grp === 'share' ? '1 дотик' : 'кроки');
        h += '</span>';
      }
      h += '</div></div>';
    }
    return h;
  }
  return '<div class="h2">Платформи</div>' +
    '<p class="mut" style="margin:-6px 0 10px">' +
