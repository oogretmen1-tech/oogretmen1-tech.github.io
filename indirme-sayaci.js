/* Dijital Öğretmen – istatistik sayacı (tek sayaç)
   GoatCounter'a üç şey kaydeder, hepsi isim isim:
   1) Ana sayfadaki bölümlerin açılması  →  "Bölüm › Pano Çalışmaları"
   2) Her dosyanın indirilmesi           →  "İndirme › Pano Çalışmaları › 29 Ekim Cumhuriyet Bayramı › Flama (PDF)"
   3) Ön izleme ve yazdırma              →  "Ön İzleme › …", "Yazdırma › …"
   Eski sayaç bütün ana sayfa indirmelerini tek satırda topluyordu; bu sürüm her dosyayı ayrı sayar. */
(function () {
  if (window.doSayac) return;
  var son = {};

  /* ---------- yardımcılar ---------- */
  function temiz(s) {
    return String(s || '').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2B00}-\u{2BFF}]/gu, '').replace(/\s+/g, ' ').trim();
  }
  function buyukHarfDuzelt(s) {
    s = temiz(s);
    if (s && s === s.toLocaleUpperCase('tr') && /[A-ZÇĞİÖŞÜ]{3}/.test(s)) {
      s = s.toLocaleLowerCase('tr').replace(/(^|[\s(·–-])(\S)/g, function (m, a, b) { return a + b.toLocaleUpperCase('tr'); });
    }
    return s;
  }
  function slug(s) {
    return temiz(s).toLocaleLowerCase('tr')
      .replace(/[âà]/g, 'a').replace(/[îì]/g, 'i').replace(/[ûù]/g, 'u').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'genel';
  }
  function dosyaAdi(u) {
    var a = String(u || '').split('#')[0].split('?')[0].split('/').pop();
    try { a = decodeURIComponent(a); } catch (e) {}
    return a;
  }
  function sayfaDosyasi() { return dosyaAdi(location.pathname) || 'index.html'; }
  function anaSayfaMi() { var p = sayfaDosyasi(); return p === 'index.html' || p === ''; }
  function sayfaBasligi() {
    return temiz((document.title || sayfaDosyasi()).split('|')[0].replace(/\((?:[^()]*\b(?:PDF|Word|pdf|word)\b[^()]*)\)/g, ''));
  }

  function gonder(veri, deneme) {
    var anahtar = veri.path;
    var simdi = Date.now();
    if (!deneme) {
      if (son[anahtar] && simdi - son[anahtar] < 2500) return;
      son[anahtar] = simdi;
    }
    if (!(window.goatcounter && window.goatcounter.count)) {
      if ((deneme || 0) < 20) setTimeout(function () { gonder(veri, (deneme || 0) + 1); }, 500);
      return;
    }
    try { window.goatcounter.count(veri); } catch (e) {}
  }

  /* ---------- isim bulma ---------- */
  /* Kartın ait olduğu ana bölüm: "Pano Çalışmaları", "Hayat Bilgisi · 1. Sınıf" … */
  function bolumAdi(el) {
    if (!anaSayfaMi()) return sayfaBasligi();
    var bolum = el && el.closest ? el.closest('.page-section, section') : null;
    if (!bolum) return 'Ana Sayfa';
    var h = bolum.querySelector('.cat-hero h2, h2');
    var ad = h ? temiz(h.textContent) : (bolum.id || 'Ana Sayfa').replace(/^page-/, '');
    var p = bolum.querySelector('.cat-hero p');
    var sinif = p ? (temiz(p.textContent).match(/^\d\.\s*Sınıf/) || [''])[0] : '';
    if (sinif && ad.indexOf(sinif) < 0) ad = sinif + ' ' + ad;
    return ad;
  }
  /* Kartın üstündeki ara başlık: "29 Ekim Cumhuriyet Bayramı", "Ekim" … */
  function araBaslik(el) {
    var kap = el && el.closest ? el.closest('.cards, .card-grid, .grid') : null;
    var d = kap ? kap.previousElementSibling : null;
    for (var i = 0; d && i < 6; i++, d = d.previousElementSibling) {
      if (d.classList && (d.classList.contains('alt-baslik') || /^H[2-4]$/.test(d.tagName))) {
        var kopya = d.cloneNode(true);
        Array.prototype.forEach.call(kopya.querySelectorAll('a'), function (x) { x.remove(); });
        return buyukHarfDuzelt(kopya.textContent);
      }
      if (d.classList && d.classList.contains('cat-hero')) break;
    }
    return '';
  }
  function kartAdi(el) {
    var kart = el && el.closest ? el.closest('.card, .cedes-oz, [data-ad]') : null;
    if (!kart) return '';
    if (kart.dataset && kart.dataset.ad) return temiz(kart.dataset.ad);
    var h = kart.querySelector('h3, h4, strong');
    return h ? temiz(h.textContent) : '';
  }

  /* ---------- kaydedici ---------- */
  /* tur: 'PDF' | 'Word' | 'Sunu' | 'İndirme'   ·   hedef: dosya yolu   ·   el: tıklanan öğe (isim için) */
  function indirmeSay(hedef, tur, el, adZorla) {
    var dosya = dosyaAdi(hedef) || sayfaDosyasi();
    var kok = dosya.replace(/\.[^.]+$/, '');
    var bolum = bolumAdi(el);
    var ara = anaSayfaMi() ? araBaslik(el) : '';
    var ad = adZorla || kartAdi(el) || (anaSayfaMi() ? kok : sayfaBasligi());
    var parca = [bolum];
    if (ara && ad.toLocaleLowerCase('tr').indexOf(ara.toLocaleLowerCase('tr')) < 0) parca.push(ara);
    if (ad && ad !== bolum) parca.push(ad);
    gonder({
      path: 'indir/' + (anaSayfaMi() ? slug(bolum) + '/' + kok : sayfaDosyasi().replace(/\.html?$/i, '') + (kok + '.html' === sayfaDosyasi() ? '' : '/' + kok)) + '-' + slug(tur),
      title: 'İndirme › ' + parca.join(' › ') + ' (' + tur + ')',
      event: true
    });
  }
  function onizlemeSay(bilgi) {
    var el = bilgi && bilgi.__kart;
    var kok = dosyaAdi(bilgi && bilgi.hedef).replace(/\.[^.]+$/, '') || 'dosya';
    var bolum = bolumAdi(el);
    var ara = el ? araBaslik(el) : '';
    var ad = temiz(bilgi && bilgi.ad) || kok;
    var parca = [bolum];
    if (ara && ad.toLocaleLowerCase('tr').indexOf(ara.toLocaleLowerCase('tr')) < 0) parca.push(ara);
    parca.push(ad);
    gonder({ path: 'onizleme/' + (anaSayfaMi() ? slug(bolum) + '/' : '') + kok, title: 'Ön İzleme › ' + parca.join(' › '), event: true });
  }
  function onizlemeIndir(bilgi, hedef, tur) {
    indirmeSay(hedef, tur, bilgi && bilgi.__kart, temiz(bilgi && bilgi.ad));
  }
  window.doSayac = { indir: indirmeSay, onizleme: onizlemeSay, onizlemeIndir: onizlemeIndir };

  /* ---------- tıklamaları yakala ---------- */
  var KELIME = /(^|[^a-zçğıöşü])(indir|word|pdf|docx)([^a-zçğıöşü]|$)/;
  function cozumle(el) {
    var href = (el.getAttribute && el.getAttribute('href')) || '';
    var oc = (el.getAttribute && el.getAttribute('onclick')) || '';
    var yazi = temiz(el.textContent).toLocaleLowerCase('tr');
    var m;
    /* 1) bağlantının kendisi dosya */
    if (/\.(pdf|docx?|pptx?|xlsx?|zip)(\?|#|$)/i.test(href)) return { hedef: href, tur: turBul(href, yazi) };
    /* 2) onclick içinde dosya adı ya da ?indir= */
    if ((m = oc.match(/['"]([^'"]+\.(?:pdf|docx?|pptx?|xlsx?|zip))['"]/i))) return { hedef: m[1], tur: turBul(m[1], yazi) };
    if ((m = oc.match(/['"]([^'"]+\?indir=[^'"]*)['"]/i))) return { hedef: m[1], tur: /indir=word/i.test(m[1]) ? 'Word' : 'PDF' };
    if (/\?indir=/.test(href)) return { hedef: href, tur: /indir=word/i.test(href) ? 'Word' : 'PDF' };
    /* 3) sayfanın kendi Word/PDF düğmesi (yazdırma ayrıca sayılır) */
    if (/yazd[ıi]r|print\(/i.test(yazi + ' ' + oc) && !/pdf|word/.test(yazi)) return null;
    if (KELIME.test(yazi) || /wordindir|downloadword|indir\(|pdfindir|pdfolustur/i.test(oc) || (el.hasAttribute && el.hasAttribute('download'))) {
      return { hedef: sayfaDosyasi(), tur: /word|docx/.test(yazi + oc.toLowerCase()) ? 'Word' : (/pdf/.test(yazi + oc.toLowerCase()) ? 'PDF' : 'İndirme') };
    }
    return null;
  }
  function turBul(dosya, yazi) {
    if (/\.docx?(\?|#|$)/i.test(dosya)) return 'Word';
    if (/\.pdf(\?|#|$)/i.test(dosya)) return 'PDF';
    if (/\.pptx?(\?|#|$)/i.test(dosya)) return 'Sunu';
    if (/\.xlsx?(\?|#|$)/i.test(dosya)) return 'Excel';
    return /word/.test(yazi) ? 'Word' : 'İndirme';
  }
  document.addEventListener('click', function (e) {
    if (e.isTrusted === false) return;              /* kodla üretilen indirme tıklaması: asıl düğme zaten sayıldı */
    var el = e.target && e.target.closest ? e.target.closest('a,button,[onclick],[role=button]') : null;
    if (!el) return;
    if (el.closest('#oi-kaplama')) return;            /* ön izleme penceresi kendisi sayar */
    if (el.classList && el.classList.contains('card-onizle')) return;
    if (!el.isConnected) return;
    var c = cozumle(el);
    if (!c) return;
    /* kartın içindeki düğmeye basıldıysa ismi kart verir */
    indirmeSay(c.hedef, c.tur, el);
  }, true);

  /* ---------- yazdırma ---------- */
  window.addEventListener('beforeprint', function () {
    gonder({ path: 'yazdir/' + sayfaDosyasi().replace(/\.html?$/i, ''), title: 'Yazdırma › ' + sayfaBasligi(), event: true });
  });

  /* ---------- ana sayfa bölümleri ---------- */
  function bolumSay(id) {
    if (!id || id === 'home') return;
    var sec = document.getElementById('page-' + id);
    if (!sec) return;
    gonder({ path: '/bolum/' + id, title: 'Bölüm › ' + bolumAdi(sec.querySelector('.cat-hero') || sec) });
  }
  function bolumKancasi() {
    if (!anaSayfaMi() || typeof window.renderPage !== 'function' || window.renderPage.__doSay) return;
    var asil = window.renderPage;
    var yeni = function (id) { var r = asil.apply(this, arguments); try { bolumSay(id); } catch (e) {} return r; };
    yeni.__doSay = true;
    window.renderPage = yeni;
    var ilk = new URLSearchParams(location.search).get('page');
    if (ilk) bolumSay(ilk);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bolumKancasi);
  else bolumKancasi();
})();
