/* ============================================================
   Dijital Öğretmen — PDF / Word İndir (indir.js)  ·  sürüm 5
   Sayfaya "Yazdır", "Word İndir" ve "PDF İndir" düğmeleri ekler.
   Dosya, yazdırma penceresi AÇILMADAN doğrudan cihaza iner.
   Adrese ?indir=1 (PDF) veya ?indir=word eklenirse indirme kendiliğinden başlar.

   Sürüm 4: SAYFA SEÇEREK yazdırma / indirme. Her sayfanın üstünde
   "Seç · Yazdır · PDF · Word" şeridi; alttaki "Sayfa Seç" ile istenen
   sayfalar işaretlenip yalnızca onlar yazdırılır ya da indirilir.

   Sürüm 3'te düzeltilenler:
   · Sayfa bütünlüğü: kart / tablo satırı / başlık / yazı satırı ORTADAN BÖLÜNMEZ.
     Kesim yalnızca boşluklardan yapılır; sığmayan içerik sayfaya küçültülerek oturtulur.
   · Bir sayfalık içerik (kapak vb.) 2-3 parçaya bölünmez, tek sayfa olarak iner.
   · Dilim dilim yakalama: tablet/telefonda bellek taşmıyor, uzun sayfalar da iniyor.
   · "Dosyayı İndir" düğmeleri artık HTML (dünya simgeli dosya) kaydetmez.
   ============================================================ */
(function () {
  "use strict";
  if (window.__doIndir) return;
  window.__doIndir = true;

  /* Standart yazı tipi: Poppins (klasik "a"). Bütün materyallerde aynı görünüm. */
  (function () {
    if (document.getElementById("do-poppins")) return;
    var s = document.querySelector('script[src*="indir.js"]');
    var kok = s ? s.src.replace(/indir\.js.*$/, "") : "";
    var l = document.createElement("link");
    l.id = "do-poppins"; l.rel = "stylesheet"; l.href = kok + "poppinsa.css";
    (document.head || document.documentElement).appendChild(l);
  })();

  var A4_W = 210, A4_H = 297, KENAR = 8;            // mm
  var A4_PX = 794;                                   // A4 genişliği (96 dpi)
  var SAYFA_SECICI = ".page, .sayfa, .a4, .a4-sayfa, .print-page, .kagit, .paper, .worksheet, .calisma-sayfasi";
  var TASMA = 1.30;   // bir sayfaya küçültülerek sığdırılabilecek en fazla yükseklik oranı
  var EN_AZ_DOLULUK = 0.34;
  var mesgul = false;

  /* ---------- Kütüphaneleri yükle ---------- */
  function scriptYolu() {
    var s = document.querySelector('script[src*="indir.js"]');
    return s ? s.src.replace(/indir\.js.*$/, "") : "";
  }
  function yukle(src) {
    return new Promise(function (ok, hata) {
      var e = document.createElement("script");
      e.src = src; e.onload = ok; e.onerror = hata;
      document.head.appendChild(e);
    });
  }
  function kutuphaneler() {
    var p = [];
    var kok = scriptYolu();
    if (!window.html2canvas) p.push(yukle(kok + "indir-html2canvas.min.js").catch(function () {
      return yukle("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
    }));
    if (!(window.jspdf && window.jspdf.jsPDF)) p.push(yukle(kok + "indir-jspdf.min.js").catch(function () {
      return yukle("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js");
    }));
    return Promise.all(p);
  }

  /* ---------- Arayüz ---------- */
  function stilEkle() {
    var css =
      "#do-indir-bar{position:fixed;right:14px;bottom:14px;z-index:2147483000;display:flex;gap:8px;font-family:Nunito,Arial,sans-serif;flex-wrap:wrap;justify-content:flex-end;max-width:calc(100vw - 28px)}" +
      "#do-indir-bar button{border:0;border-radius:999px;padding:12px 18px;font-size:15px;font-weight:800;cursor:pointer;" +
      "box-shadow:0 4px 14px rgba(0,0,0,.28);display:flex;align-items:center;gap:7px;line-height:1}" +
      "#do-word-btn{background:#2b579a;color:#fff}#do-indir-btn{background:#c62828;color:#fff}" +
      "#do-yazdir-btn{background:#fff;color:#1e293b;border:2px solid #1e293b !important}" +
      "#do-indir-kaplama{position:fixed;inset:0;z-index:2147483600;background:rgba(15,23,42,.72);display:flex;align-items:center;justify-content:center;font-family:Nunito,Arial,sans-serif}" +
      "#do-indir-kutu{background:#fff;border-radius:16px;padding:26px 30px;min-width:260px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.4)}" +
      "#do-indir-kutu b{display:block;font-size:18px;color:#0f172a;margin-bottom:12px}" +
      "#do-indir-cubuk{height:10px;border-radius:6px;background:#e2e8f0;overflow:hidden}" +
      "#do-indir-dolgu{height:100%;width:0;background:#1d4ed8;transition:width .2s}" +
      "#do-indir-yazi{margin-top:10px;font-size:14px;color:#475569}" +
      "@media print{#do-indir-bar,#do-indir-kaplama{display:none !important}}";
    var st = document.createElement("style");
    st.id = "do-indir-stil";
    st.textContent = css;
    document.head.appendChild(st);
  }

  function dugmeEkle() {
    if (document.getElementById("do-indir-bar")) return;
    var bar = document.createElement("div");
    bar.id = "do-indir-bar";
    bar.setAttribute("data-indir-gizle", "");
    bar.innerHTML =
      '<button id="do-yazdir-btn" type="button" title="Yazdır">🖨️ Yazdır</button>' +
      '<button id="do-word-btn" type="button" title="Word dosyası olarak indir">📄 Word İndir</button>' +
      '<button id="do-indir-btn" type="button" title="PDF dosyası olarak indir">⬇️ PDF İndir</button>';
    document.body.appendChild(bar);
    document.getElementById("do-indir-btn").onclick = function () { indir("pdf"); };
    document.getElementById("do-word-btn").onclick = function () { indir("word"); };
    document.getElementById("do-yazdir-btn").onclick = function () { gercekYazdir(); };
    eskiDugmeleriCevir();
  }

  /* Eski "Dosyayı İndir" (sayfayı HTML kaydeden) düğmeleri artık PDF indirir */
  function eskiDugmeleriCevir() {
    var eski = document.querySelectorAll('[onclick*="__dosyayiIndir"],[onclick*="dosyayiIndir"]');
    for (var i = 0; i < eski.length; i++) {
      var d = eski[i];
      if (d.getAttribute("data-do-cevrildi")) continue;
      d.setAttribute("data-do-cevrildi", "1");
      d.removeAttribute("onclick");
      if (/dosya/i.test(d.textContent || "")) d.textContent = "⬇ PDF İndir";
      d.addEventListener("click", function (e) { e.preventDefault(); indir("pdf"); });
    }
  }

  function ilerleme(oran, yazi) {
    var k = document.getElementById("do-indir-kaplama");
    if (!k) {
      k = document.createElement("div");
      k.id = "do-indir-kaplama";
      k.setAttribute("data-indir-gizle", "");
      k.innerHTML = '<div id="do-indir-kutu"><b>Dosya hazırlanıyor…</b><div id="do-indir-cubuk"><div id="do-indir-dolgu"></div></div><div id="do-indir-yazi"></div></div>';
      document.body.appendChild(k);
    }
    document.getElementById("do-indir-dolgu").style.width = Math.round(oran * 100) + "%";
    document.getElementById("do-indir-yazi").textContent = yazi || "";
  }
  function kaplamaKapat() {
    var k = document.getElementById("do-indir-kaplama");
    if (k) k.remove();
  }

  /* ---------- Yazdırma CSS'ini ekranda taklit et ---------- */
  function printKurallari() {
    var metin = [];
    function gez(kurallar, printIcinde) {
      for (var i = 0; i < kurallar.length; i++) {
        var r = kurallar[i];
        if (r.type === 4) { // CSSMediaRule
          var m = (r.media && r.media.mediaText || "").toLowerCase();
          var p = /print/.test(m) && !/not\s+print/.test(m);
          if (p || printIcinde) gez(r.cssRules, true);
        } else if (printIcinde && r.type === 1) {
          metin.push(r.cssText);
        } else if (r.type === 12 && r.cssRules) { // @supports
          gez(r.cssRules, printIcinde);
        }
      }
    }
    for (var i = 0; i < document.styleSheets.length; i++) {
      var ss = document.styleSheets[i];
      if (ss.ownerNode && ss.ownerNode.id === "do-indir-emul") continue;
      try { gez(ss.cssRules || [], false); } catch (e) { /* başka alan adı */ }
    }
    return metin.join("\n");
  }
  function emulasyonAc() {
    var st = document.createElement("style");
    st.id = "do-indir-emul";
    st.textContent = printKurallari() +
      "\n[data-indir-gizle],#do-indir-bar,#do-secici,#do-secim-bar,.do-sayfa-bar,.do-secilmedi,#do-gezinme,.do-gezinme,.no-print,.noprint,.indir-arac-cubugu,.no_print,.yazdirma,.toolbar,.back-link{display:none !important}" +
      "\nhtml,body{scroll-behavior:auto !important}" +
      "\n*{animation:none !important;transition:none !important}";
    document.head.appendChild(st);
  }
  function emulasyonKapat() {
    var st;
    while ((st = document.getElementById("do-indir-emul"))) st.remove();
  }
  /* Akışkan (A4 kabı olmayan) sayfaları A4 genişliğinde ölç */
  function genislikSabitle() {
    if (document.getElementById("do-indir-genislik")) return;
    var st = document.createElement("style");
    st.id = "do-indir-genislik";
    st.textContent = "body{width:" + A4_PX + "px !important;max-width:" + A4_PX + "px !important;" +
      "margin-left:auto !important;margin-right:auto !important;box-sizing:border-box !important;overflow-x:hidden !important}";
    document.head.appendChild(st);
  }
  function genislikCoz() {
    var st = document.getElementById("do-indir-genislik");
    if (st) st.remove();
  }

  /* ---------- Yardımcılar ---------- */
  function gorunur(el) {
    if (!el.getClientRects().length) return false;
    var cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none";
  }
  var SECILI = null, SEC_EK = "";
  function sayfalariBul() {
    if (SECILI && SECILI.length) return SECILI.slice();
    var hepsi = Array.prototype.slice.call(document.querySelectorAll(SAYFA_SECICI));
    var liste = hepsi.filter(function (el) {
      if (!gorunur(el)) return false;
      var r = el.getBoundingClientRect();
      if (r.width < 300 || r.height < 250) return false;
      var p = el.parentElement;
      while (p) {
        if (hepsi.indexOf(p) > -1 && gorunur(p)) return false;
        p = p.parentElement;
      }
      return true;
    });
    if (liste.length) {
      var kapsam = 0;
      liste.forEach(function (el) { kapsam += el.getBoundingClientRect().height; });
      if (kapsam >= document.body.scrollHeight * 0.45) return liste;
      return [];
    }
    var tum = document.body.getElementsByTagName("*");
    if (tum.length > 25000) return [];
    var kirilan = [];
    for (var i = 0; i < tum.length; i++) {
      var el = tum[i];
      if (el.hasAttribute("data-indir-gizle")) continue;
      var cs = getComputedStyle(el);
      if (/page|always|left|right/.test(cs.breakAfter + " " + cs.breakBefore + " " + cs.pageBreakAfter + " " + cs.pageBreakBefore)) {
        if (!gorunur(el)) continue;
        var r = el.getBoundingClientRect();
        if (r.width < 300 || r.height < 150) continue;
        var ic = false;
        for (var j = 0; j < kirilan.length; j++) if (kirilan[j].contains(el)) { ic = true; break; }
        if (!ic) kirilan.push(el);
      }
    }
    return kirilan.length >= 2 ? kirilan : [];
  }
  function dosyaAdi() {
    var t = (document.title || "dijital-ogretmen").split("|")[0].trim();
    var tr = { "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u", "Ç": "C", "Ğ": "G", "İ": "I", "Ö": "O", "Ş": "S", "Ü": "U" };
    t = t.replace(/[çğıöşüÇĞİÖŞÜ]/g, function (c) { return tr[c]; })
      .replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
    return (t || "dijital-ogretmen").slice(0, 80) + SEC_EK + ".pdf";
  }
  function bekle(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  function gorsellerHazir() {
    var imgs = Array.prototype.slice.call(document.images);
    return Promise.all(imgs.map(function (im) {
      if (im.complete) return null;
      return new Promise(function (ok) { im.onload = im.onerror = ok; setTimeout(ok, 4000); });
    }));
  }

  /* ---------- SAYFA BÜTÜNLÜĞÜ: bölünmemesi gereken alanlar ---------- */
  function seffaf(renk) { return !renk || renk === "transparent" || /rgba\([^)]*,\s*0\s*\)/.test(renk); }

  function korunacakAlanlar(el, enFazla) {
    var kokR = el.getBoundingClientRect();
    var ust = kokR.top;
    var alanlar = [];
    var tumu = el.getElementsByTagName("*");
    var n = Math.min(tumu.length, 14000);
    for (var i = 0; i < n; i++) {
      var e = tumu[i];
      if (e.hasAttribute && e.hasAttribute("data-indir-gizle")) continue;
      var tag = e.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "LINK" || tag === "HEAD") continue;
      var r = e.getBoundingClientRect();
      if (r.height <= 1 || r.width <= 1 || r.height > enFazla) continue;
      var cs;
      try { cs = getComputedStyle(e); } catch (x) { continue; }
      if (cs.display === "none" || cs.visibility === "hidden" || cs.position === "fixed") continue;
      var bolunmez =
        /avoid/.test((cs.breakInside || "") + " " + (cs.pageBreakInside || "")) ||
        /^(IMG|SVG|CANVAS|VIDEO|TABLE|THEAD|TBODY|TR|FIGURE|BLOCKQUOTE|PRE|H1|H2|H3|H4|H5|H6|LI|P|LABEL|BUTTON|INPUT|TEXTAREA|SELECT|DT|DD|TD|TH)$/.test(tag) ||
        e.children.length === 0 ||
        !seffaf(cs.backgroundColor) ||
        (cs.backgroundImage && cs.backgroundImage !== "none") ||
        (cs.boxShadow && cs.boxShadow !== "none") ||
        parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0;
      if (!bolunmez) continue;
      alanlar.push([r.top - ust, r.bottom - ust]);
    }
    // Yazı satırları (satır ortasından kesmemek için)
    try {
      if (n < 6000) {
        var yuruyucu = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
        var sayac = 0, dugum;
        while ((dugum = yuruyucu.nextNode()) && sayac < 4000) {
          if (!/\S/.test(dugum.nodeValue)) continue;
          sayac++;
          var menzil = document.createRange();
          menzil.selectNodeContents(dugum);
          var kutular = menzil.getClientRects();
          for (var k = 0; k < kutular.length; k++) {
            var q = kutular[k];
            if (q.height <= 0 || q.height > enFazla) continue;
            alanlar.push([q.top - ust, q.bottom - ust]);
          }
        }
      }
    } catch (x2) { /* önemli değil */ }
    return plan(alanlar);
  }

  /* Alanları sırala + "bu y noktası bir bloğun içinde mi?" sorgusu için ön hesap */
  function plan(alanlar) {
    alanlar.sort(function (a, b) { return a[0] - b[0]; });
    var ustler = [], enAltlar = [], enAlt = -1e9, adaylar = [];
    for (var i = 0; i < alanlar.length; i++) {
      ustler.push(alanlar[i][0]);
      enAlt = Math.max(enAlt, alanlar[i][1]);
      enAltlar.push(enAlt);
      adaylar.push(alanlar[i][1] + 1);   // bloğun hemen altı
      adaylar.push(alanlar[i][0] - 1);   // bloğun hemen üstü
    }
    adaylar.sort(function (a, b) { return a - b; });
    return { ustler: ustler, enAltlar: enAltlar, adaylar: adaylar };
  }

  /* y noktası korunan bir bloğun ortasına denk geliyor mu? */
  function bolerMi(p, y) {
    var lo = 0, hi = p.ustler.length - 1, son = -1;
    while (lo <= hi) {
      var orta = (lo + hi) >> 1;
      if (p.ustler[orta] < y - 1) { son = orta; lo = orta + 1; } else hi = orta - 1;
    }
    if (son < 0) return false;
    return p.enAltlar[son] > y + 1;
  }

  /* Bir sayfanın bitebileceği güvenli y noktasını bul */
  function guvenliKesim(p, limit, altSinir, ustSinir) {
    var a = p.adaylar, i;
    // limitin altındaki en büyük güvenli aday
    var lo = 0, hi = a.length - 1, son = -1;
    while (lo <= hi) {
      var orta = (lo + hi) >> 1;
      if (a[orta] <= limit) { son = orta; lo = orta + 1; } else hi = orta - 1;
    }
    for (i = son; i >= 0; i--) {
      if (a[i] < altSinir) break;
      if (!bolerMi(p, a[i])) return a[i];
    }
    // yukarıda yer yok: limitin biraz üstünde güvenli bir aday (sayfa küçültülerek sığdırılır)
    for (i = son + 1; i < a.length; i++) {
      if (a[i] > ustSinir) break;
      if (!bolerMi(p, a[i])) return a[i];
    }
    return null;
  }

  function kesimNoktalari(el, hedefH) {
    var toplam = Math.max(el.scrollHeight || 0, el.getBoundingClientRect().height);
    var enFazla = hedefH * TASMA;
    if (toplam <= enFazla) return [0, toplam];              // TEK SAYFA — bölme yok
    var p = korunacakAlanlar(el, enFazla);
    var kesimler = [0], y = 0, guvenlik = 0;
    while (toplam - y > enFazla && guvenlik++ < 500) {
      var kes = guvenliKesim(p, y + hedefH, y + hedefH * EN_AZ_DOLULUK, y + enFazla);
      if (kes == null || kes <= y + 10) kes = y + hedefH;
      kesimler.push(kes);
      y = kes;
    }
    // Son sayfa çok ince kalıyorsa bir öncekine ekle
    if (kesimler.length > 1 && toplam - y < hedefH * 0.10 && toplam - kesimler[kesimler.length - 2] <= enFazla * 1.05) {
      kesimler.pop();
    }
    kesimler.push(toplam);
    return kesimler;
  }

  /* ---------- Yakalama ---------- */
  var JPEG_KALITE = 0.86;
  function olcek(genislik, yukseklik) {
    // ~150 dpi: A4 genişliği 1240 px — baskı için yeterli, dosya küçük ve tablette hızlı
    var s = 1.6;
    s = Math.min(s, 1400 / Math.max(genislik, 1));
    s = Math.min(s, 2100 / Math.max(yukseklik, 1));
    return Math.max(0.7, s);
  }
  function yoksay(n) { return n.hasAttribute && (n.hasAttribute("data-indir-gizle") || n.id === "do-indir-bar" || n.id === "do-indir-kaplama" || n.id === "do-secici" || n.id === "do-secim-bar" || (n.classList && n.classList.contains("do-sayfa-bar"))); }

  function yakalaDilim(el, ust, yukseklik) {
    var r = el.getBoundingClientRect();
    var genislik = Math.max(r.width, el.scrollWidth || 0);
    var tamYukseklik = Math.max(el.scrollHeight || 0, r.height);
    // Tek parça ise kırpma yapma (en güvenli yol)
    if (ust <= 1 && yukseklik >= tamYukseklik - 2) {
      return window.html2canvas(el, {
        scale: olcek(genislik, yukseklik),
        useCORS: true, allowTaint: false, backgroundColor: "#ffffff", logging: false,
        scrollX: 0, scrollY: -window.scrollY,
        windowWidth: document.documentElement.clientWidth,
        ignoreElements: yoksay
      });
    }
    return window.html2canvas(el, {
      x: 0, y: ust,
      width: Math.round(genislik),
      height: Math.round(yukseklik),
      scale: olcek(genislik, yukseklik),
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0, scrollY: 0,
      windowWidth: document.documentElement.clientWidth,
      windowHeight: document.documentElement.clientHeight,
      ignoreElements: yoksay
    });
  }

  function tuvalEkle(pdf, tuval, ilk) {
    if (!tuval || tuval.width < 2 || tuval.height < 2) return false;
    var gW = A4_W - 2 * KENAR, gH = A4_H - 2 * KENAR;
    var oran = Math.min(gW / tuval.width, gH / tuval.height);
    var w = tuval.width * oran, h = tuval.height * oran;
    if (!ilk) pdf.addPage();
    pdf.addImage(tuval.toDataURL("image/jpeg", JPEG_KALITE), "JPEG", (A4_W - w) / 2, (A4_H - h) / 2, w, h, undefined, "FAST");
    return true;
  }
  function tuvaliBosalt(t) { try { t.width = 1; t.height = 1; } catch (e) {} }

  /* ---------- Word (.docx) oluşturma ---------- */
  var CRC = (function () {
    var t = [];
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function utf8(s) { return new TextEncoder().encode(s); }
  var DOS_SAAT = 0, DOS_TARIH = ((2026 - 1980) << 9) | (1 << 5) | 1;
  function sikistir(veri) {             // deflate-raw (varsa) — Word dosyası standart sıkıştırmalı olur
    if (!window.CompressionStream) return Promise.resolve(null);
    try {
      var akis = new Blob([veri]).stream().pipeThrough(new CompressionStream("deflate-raw"));
      return new Response(akis).arrayBuffer().then(function (b) { return new Uint8Array(b); })
        .catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }
  function zipYap(dosyalar) {           // Promise<Blob>
    return Promise.all(dosyalar.map(function (d) {
      if (/\.jpeg$/.test(d.ad) || d.veri.length < 1024) return { ad: d.ad, veri: d.veri, ham: d.veri, yontem: 0 };
      return sikistir(d.veri).then(function (s) {
        return (s && s.length < d.veri.length) ? { ad: d.ad, veri: s, ham: d.veri, yontem: 8 }
                                               : { ad: d.ad, veri: d.veri, ham: d.veri, yontem: 0 };
      });
    })).then(function (liste) {
      var parcalar = [], merkez = [], ofset = 0;
      function u16(v) { return [v & 255, (v >>> 8) & 255]; }
      function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
      liste.forEach(function (d) {
        var ad = utf8(d.ad), crc = crc32(d.ham);
        var bas = [].concat([0x50, 0x4b, 3, 4], u16(20), u16(0x800), u16(d.yontem), u16(DOS_SAAT), u16(DOS_TARIH),
          u32(crc), u32(d.veri.length), u32(d.ham.length), u16(ad.length), u16(0));
        parcalar.push(new Uint8Array(bas), ad, d.veri);
        merkez.push(new Uint8Array([].concat([0x50, 0x4b, 1, 2], u16(20), u16(20), u16(0x800), u16(d.yontem), u16(DOS_SAAT), u16(DOS_TARIH),
          u32(crc), u32(d.veri.length), u32(d.ham.length), u16(ad.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(ofset))), ad);
        ofset += bas.length + ad.length + d.veri.length;
      });
      var mBoy = 0; merkez.forEach(function (m) { mBoy += m.length; });
      var son = new Uint8Array([].concat([0x50, 0x4b, 5, 6], u16(0), u16(0), u16(liste.length), u16(liste.length), u32(mBoy), u32(ofset), u16(0)));
      return new Blob(parcalar.concat(merkez, [son]), { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    });
  }
  function base64Bayt(dataUrl) {
    var b = atob(dataUrl.split(",")[1]), a = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
    return a;
  }
  function wordKaydet(gorseller, ad) {
    var EMU = 36000, gW = (A4_W - 2 * KENAR) * EMU, gH = (A4_H - 2 * KENAR - 2) * EMU;
    var govde = "", iliski = "", dosyalar = [];
    gorseller.forEach(function (g, i) {
      var o = Math.min(gW / g.w, gH / g.h), cx = Math.round(g.w * o), cy = Math.round(g.h * o), id = i + 1;
      dosyalar.push({ ad: "word/media/s" + id + ".jpeg", veri: base64Bayt(g.veri) });
      iliski += '<Relationship Id="rS' + id + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/s' + id + '.jpeg"/>';
      govde += '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>' +
        (i > 0 ? '<w:r><w:br w:type="page"/></w:r>' : '') +
        '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:docPr id="' + id + '" name="Sayfa ' + id + '"/>' +
        '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
        '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="' + id + '" name="s' + id + '.jpeg"/><pic:cNvPicPr/></pic:nvPicPr>' +
        '<pic:blipFill><a:blip r:embed="rS' + id + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
        '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>' +
        '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
    });
    var kenar = Math.round(KENAR * 56.7);
    var belge = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>' +
      govde + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="' + kenar + '" w:right="' + kenar + '" w:bottom="' + kenar + '" w:left="' + kenar + '" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>';
    dosyalar.unshift(
      { ad: "[Content_Types].xml", veri: utf8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>') },
      { ad: "_rels/.rels", veri: utf8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>') },
      { ad: "word/document.xml", veri: utf8(belge) },
      { ad: "word/_rels/document.xml.rels", veri: utf8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + iliski + '</Relationships>') }
    );
    return zipYap(dosyalar).then(function (blob) { dosyaVer(blob, ad); });
  }
  /* ---------- Sitede hazır .docx / .pdf varsa doğrudan onu indir ---------- */
  function hazirDosyaAdresi(uzanti) {
    var yol = location.pathname;
    if (!/\.html?$/i.test(yol)) return null;
    return yol.replace(/\.html?$/i, "." + uzanti);
  }
  function hazirDosyaVarMi(uzanti) {
    var adres = hazirDosyaAdresi(uzanti);
    if (!adres || !window.fetch) return Promise.resolve(null);
    return fetch(adres, { method: "HEAD" }).then(function (c) {
      if (!c.ok) return null;
      var tur = (c.headers.get("content-type") || "").toLowerCase();
      if (/text\/html/.test(tur)) return null;      // 404 sayfası döndüyse
      return adres;
    }).catch(function () { return null; });
  }
  function hazirIndir(adres) {
    var a = document.createElement("a");
    a.href = adres; a.download = adres.split("/").pop(); a.rel = "noopener"; a.style.display = "none";
    document.body.appendChild(a); a.click(); a.remove();
  }

  function dosyaVer(blob, ad) {
    if (window.navigator && window.navigator.msSaveOrOpenBlob) { window.navigator.msSaveOrOpenBlob(blob, ad); return; }
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = ad; a.rel = "noopener"; a.style.display = "none";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 20000);
  }

  /* ---------- Asıl dosya oluşturma ---------- */
  var BICIM = "pdf";
  function pdfOlustur() {
    var pdf = null, ilk = true, adsiz, gorseller = [];
    window.scrollTo(0, 0);
    return gorsellerHazir()
      .then(function () { return document.fonts && document.fonts.ready; })
      .then(function () { return bekle(250); })
      .then(function () {
        pdf = BICIM === "pdf" ? new window.jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true }) : null;
        var sayfalar = sayfalariBul();
        var gW = A4_W - 2 * KENAR, gH = A4_H - 2 * KENAR;
        var isler;
        if (sayfalar.length) {
          isler = sayfalar;
        } else {
          genislikSabitle();
          isler = [document.body];
        }

        var ekle = function (t) {
          if (!t || t.width < 2 || t.height < 2) return false;
          var tamam;
          if (pdf) tamam = tuvalEkle(pdf, t, ilk);
          else { gorseller.push({ veri: t.toDataURL("image/jpeg", JPEG_KALITE), w: t.width, h: t.height }); tamam = true; }
          tuvaliBosalt(t);
          return tamam;
        };

        // Önce tüm işler için kesim planını çıkar
        var plan = [];
        isler.forEach(function (el) {
          var r = el.getBoundingClientRect();
          var cssW = Math.max(r.width, el.scrollWidth || 0);
          var sayfaYukPx = cssW * (gH / gW);
          var kesimler = kesimNoktalari(el, sayfaYukPx);
          for (var i = 0; i < kesimler.length - 1; i++) {
            var h = kesimler[i + 1] - kesimler[i];
            if (h < 8) continue;
            plan.push({ el: el, ust: kesimler[i], yuk: h });
          }
        });
        if (!plan.length) plan.push({ el: isler[0], ust: 0, yuk: isler[0].getBoundingClientRect().height });

        var zincir = Promise.resolve();
        plan.forEach(function (p, i) {
          zincir = zincir.then(function () {
            ilerleme(i / plan.length, "Sayfa " + (i + 1) + " / " + plan.length);
            return bekle(20);
          }).then(function () {
            return yakalaDilim(p.el, p.ust, p.yuk);
          }).then(function (tuval) {
            if (ekle(tuval)) ilk = false;
          }).catch(function (e) { console.warn("dilim atlandı", e); });
        });
        return zincir;
      })
      .then(function () {
        ilerleme(1, "Dosya kaydediliyor…");
        adsiz = dosyaAdi();
        if (pdf) { pdf.save(adsiz); return bekle(400); }
        return wordKaydet(gorseller, adsiz.replace(/\.pdf$/, ".docx")).then(function () { return bekle(400); });
      });
  }

  /* Sayfanın kendi "Tümünü yazdır" hazırlığını kullan */
  var asilPrint = window.print ? window.print.bind(window) : function () {};
  var yakalamaModu = null;
  window.print = function () {
    if (yakalamaModu) { var f = yakalamaModu; yakalamaModu = null; f(); return; }
    asilPrint();
  };
  function gercekYazdir() { asilPrint(); }

  function sayfaninYazdirDugmesi(herhangi) {
    var dugmeler = Array.prototype.slice.call(document.querySelectorAll("button,a,[onclick]")).filter(function (b) {
      if (b.closest("#do-indir-bar")) return false;
      var oc = (b.getAttribute("onclick") || "").toLowerCase();
      var yazi = (b.textContent || "").toLowerCase();
      return /print|yazdir/.test(oc) || (/yazdır|yazdir/.test(yazi) && b.tagName === "BUTTON");
    });
    function puan(b) {
      var t = (b.textContent || "").toLocaleLowerCase("tr") + " " + (b.getAttribute("onclick") || "").toLowerCase();
      var p = 0;
      if (/tümünü|tümü|hepsini|printall|tumunu|all/.test(t)) p += 10;
      if (/seçili|secili|selected|bu bölüm|bu sayfa/.test(t)) p -= 5;
      if (/açık|acik|current|aktif/.test(t)) p += 3;
      if (/window\.print\(\)/.test(t)) p -= 1;
      if (gorunur(b)) p += 1;
      return p;
    }
    dugmeler.sort(function (a, b) { return puan(b) - puan(a); });
    var d = dugmeler[0];
    if (!d) return null;
    if (puan(d) >= 10) return d;
    if (herhangi && !/^\s*window\.print\(\)\s*;?\s*$/.test(d.getAttribute("onclick") || "")) return d;
    return null;
  }

  var gozcu = null;
  function oznitelikler(e) {
    var o = {};
    for (var i = 0; i < e.attributes.length; i++) o[e.attributes[i].name] = e.attributes[i].value;
    return o;
  }
  function dondur() {
    coz();
    var hedefler = [document.documentElement, document.body];
    var kayit = hedefler.map(oznitelikler);
    gozcu = new MutationObserver(function (kayitlar) {
      kayitlar.forEach(function (k) {
        var i = hedefler.indexOf(k.target), ad = k.attributeName;
        if (i < 0 || ad === "style") return;
        var eski = kayit[i][ad];
        if (eski === undefined) { if (k.target.hasAttribute(ad)) k.target.removeAttribute(ad); }
        else if (k.target.getAttribute(ad) !== eski) k.target.setAttribute(ad, eski);
      });
    });
    hedefler.forEach(function (e) { gozcu.observe(e, { attributes: true }); });
  }
  function coz() { if (gozcu) { gozcu.disconnect(); gozcu = null; } }

  function icerikBos() {
    var t = (document.body.innerText || "").replace(/\s+/g, "");
    var imgs = Array.prototype.some.call(document.images, function (i) { return gorunur(i) && i.width > 100; });
    return document.body.scrollHeight < 250 || (t.length < 60 && !imgs);
  }

  function dugmeyleHazirla(d) {
    return new Promise(function (ok) {
      var tetiklendi = false;
      yakalamaModu = function () { tetiklendi = true; dondur(); ok(); };
      try { d.click(); } catch (e) {}
      setTimeout(function () {
        if (!tetiklendi) { yakalamaModu = null; ok(); }
      }, 1500);
    });
  }

  function hazirlaVeOlustur(d) {
    var denendi = !!d;
    return (d ? dugmeyleHazirla(d) : Promise.resolve()).then(function () {
      dondur();
      try { window.dispatchEvent(new Event("beforeprint")); } catch (e) {}
      emulasyonAc();
      return bekle(300);
    }).then(function () {
      if (!icerikBos()) return;
      emulasyonKapat();
      var d2 = !denendi && sayfaninYazdirDugmesi(true);
      if (d2) {
        coz();
        return dugmeyleHazirla(d2).then(function () {
          emulasyonAc();
          return bekle(300);
        }).then(function () {
          if (icerikBos()) { emulasyonKapat(); ekranGorunumu(); }
        });
      }
      ekranGorunumu();
    }).then(pdfOlustur);
  }
  function ekranGorunumu() {
    var st = document.createElement("style");
    st.id = "do-indir-emul";
    st.textContent = "[data-indir-gizle],#do-indir-bar,#do-secici,#do-secim-bar,.do-sayfa-bar,.do-secilmedi,#do-gezinme,.no-print,.noprint,.indir-arac-cubugu,.modal-arka-plan,.toolbar{display:none !important}*{animation:none !important;transition:none !important}";
    document.head.appendChild(st);
  }

  /* secim: yalnızca bu sayfalar (dizi) — verilmezse bütün dosya */
  function indir(bicim, secim) {
    if (mesgul) return;
    mesgul = true;
    BICIM = bicim === "word" ? "word" : "pdf";
    var secimli = !!(secim && secim.length);
    SECILI = secimli ? secim.slice() : null;
    SEC_EK = secimli ? secimEki(secim) : "";
    ilerleme(0, "Hazırlanıyor…");
    var baslik = document.querySelector("#do-indir-kutu b");
    if (baslik) baslik.textContent = (BICIM === "word" ? "Word dosyası" : "PDF") +
      (secimli ? " (" + secim.length + " sayfa)" : "") + " hazırlanıyor…";
    var bitir = function () {
      coz();
      emulasyonKapat();
      genislikCoz();
      kaplamaKapat();
      SECILI = null; SEC_EK = "";
      mesgul = false;
      try { window.dispatchEvent(new Event("afterprint")); } catch (e) {}
    };
    /* Sayfa seçildiyse hazır (bütün) dosya değil, yalnız seçilenler üretilir */
    (secimli ? Promise.resolve(null) : hazirDosyaVarMi(BICIM === "word" ? "docx" : "pdf")).then(function (adres) {
      if (adres) { hazirIndir(adres); bitir(); return null; }   // hazır dosya: anında iner
      return kutuphaneler().then(function () {
        if (secimli) {
          dondur();
          emulasyonAc();
          return bekle(300).then(pdfOlustur);
        }
        return hazirlaVeOlustur(sayfaninYazdirDugmesi(false));
      }).then(bitir);
    }).then(null, function (e) {
      bitir();
      console.error(e);
      if (confirm((BICIM === "word" ? "Word" : "PDF") + " dosyası oluşturulamadı. Bunun yerine yazdırma penceresi açılsın mı?\n(Yazıcı olarak \"PDF olarak kaydet\" seçebilirsiniz.)")) asilPrint();
    });
  }

  /* ================= SAYFA SEÇEREK YAZDIR / İNDİR ================= */
  var SAYFALAR = [];          /* bu dosyadaki A4 sayfaları */
  var SECIM = [];             /* seçili sayfa sıraları (0'dan) */

  function secimEki(secim) {
    var no = secim.map(function (el) { return SAYFALAR.indexOf(el) + 1; }).filter(function (n) { return n > 0; });
    if (!no.length) return "-secilenler";
    if (no.length === 1) return "-sayfa-" + no[0];
    if (no.length <= 4) return "-sayfa-" + no.join("-");
    return "-" + no.length + "-sayfa";
  }

  function sayfaBasligi(el, i) {
    var aday = el.querySelector("h1,h2,h3,.baslik,.baslik-kucuk,.sayfa-baslik,.page-title,.title,[class*='baslik'],[class*='title']");
    var t = aday ? (aday.innerText || aday.textContent || "") : "";
    t = t.replace(/\s+/g, " ").replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu, "").trim();
    if (t.length > 46) t = t.slice(0, 44).trim() + "…";
    return t || (i + 1) + ". sayfa";
  }

  function seciliSayfalar() {
    return SECIM.slice().sort(function (a, b) { return a - b; }).map(function (i) { return SAYFALAR[i]; });
  }

  function yalnizBunlariYazdir(liste) {
    if (!liste.length) return;
    liste.forEach(function (el) { el.classList.add("do-secildi"); });
    SAYFALAR.forEach(function (el) { if (liste.indexOf(el) < 0) el.classList.add("do-secilmedi"); });
    var temizle = function () {
      SAYFALAR.forEach(function (el) { el.classList.remove("do-secilmedi", "do-secildi"); });
      window.removeEventListener("afterprint", temizle);
    };
    window.addEventListener("afterprint", temizle);
    setTimeout(function () { asilPrint(); setTimeout(temizle, 1500); }, 60);
  }

  function secimStilEkle() {
    if (document.getElementById("do-secim-stil")) return;
    var css =
      ".do-sayfa-bar{box-sizing:border-box;width:min(210mm,100%);margin:0 auto 6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;" +
        "justify-content:space-between;padding:7px 10px;background:#fff;border:1px solid #cbd5e1;border-radius:10px;" +
        "font:600 13px/1.2 Poppins,Nunito,Arial,sans-serif;color:#1e293b;box-shadow:0 2px 6px rgba(0,0,0,.08)}" +
      ".do-sayfa-bar label{display:flex;align-items:center;gap:8px;cursor:pointer;min-width:0;flex:1}" +
      ".do-sayfa-bar label span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".do-sayfa-bar input{width:20px;height:20px;accent-color:#1d4ed8;flex:none}" +
      ".do-sayfa-bar .do-sb-dg{display:flex;gap:6px;align-items:center;flex-wrap:wrap}" +
      ".do-sayfa-bar .do-sb-not{font:600 12.5px Poppins,Nunito,Arial,sans-serif;color:#64748b;margin-right:2px}" +
      ".do-sayfa-bar button{padding:9px 13px !important;font-size:13.5px !important}" +
      ".do-sayfa-bar button,#do-secici button,#do-secim-bar button{border:0;border-radius:8px;padding:7px 11px;font:700 12.5px Poppins,Nunito,Arial,sans-serif;cursor:pointer;color:#fff}" +
      ".do-b-yaz{background:#0f172a}.do-b-pdf{background:#c62828}.do-b-word{background:#2b579a}.do-b-gri{background:#e2e8f0;color:#0f172a !important}" +
      ".do-sayfa-bar.secili{border-color:#1d4ed8;background:#eff6ff}" +
      "#do-secim-bar{position:fixed;left:50%;transform:translateX(-50%);bottom:74px;z-index:2147483100;display:none;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;" +
        "background:#0f172a;color:#fff;padding:9px 12px;border-radius:14px;font:700 14px Poppins,Nunito,Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35);max-width:calc(100vw - 20px)}" +
      "#do-secim-bar.acik{display:flex}" +
      "#do-secici{position:fixed;inset:0;z-index:2147483300;background:rgba(15,23,42,.72);display:none;align-items:center;justify-content:center;padding:12px;font-family:Poppins,Nunito,Arial,sans-serif}" +
      "#do-secici.acik{display:flex}" +
      "#do-secici .ds-kutu{background:#fff;border-radius:16px;width:min(560px,100%);max-height:90vh;display:flex;flex-direction:column;overflow:hidden}" +
      "#do-secici .ds-ust{padding:14px 16px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;gap:8px}" +
      "#do-secici .ds-ust b{font-size:17px;color:#0f172a}" +
      "#do-secici .ds-liste{overflow:auto;padding:8px 10px;display:grid;grid-template-columns:1fr;gap:6px}" +
      "#do-secici .ds-liste label{display:flex;align-items:center;gap:10px;padding:10px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;color:#1e293b;cursor:pointer}" +
      "#do-secici .ds-liste label.secili{border-color:#1d4ed8;background:#eff6ff}" +
      "#do-secici .ds-liste input{width:20px;height:20px;accent-color:#1d4ed8;flex:none}" +
      "#do-secici .ds-no{flex:none;min-width:30px;font-weight:800;color:#1d4ed8}" +
      "#do-secici .ds-alt{padding:12px 16px;border-top:1px solid #e2e8f0;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}" +
      "#do-secici .ds-alt .ds-bilgi{margin-right:auto;align-self:center;font-weight:700;color:#475569;font-size:14px}" +
      "#do-sec-btn{background:#0f766e;color:#fff}" +
      "@media print{.do-sayfa-bar,#do-secim-bar,#do-secici{display:none !important}.do-secilmedi{display:none !important}}";
    var st = document.createElement("style");
    st.id = "do-secim-stil";
    st.textContent = css;
    document.head.appendChild(st);
  }

  function secimiGuncelle() {
    var n = SECIM.length;
    Array.prototype.forEach.call(document.querySelectorAll(".do-sayfa-bar"), function (b) {
      var i = +b.getAttribute("data-no");
      var var_ = SECIM.indexOf(i) > -1;
      b.classList.toggle("secili", var_);
      var c = b.querySelector("input"); if (c) c.checked = var_;
    });
    Array.prototype.forEach.call(document.querySelectorAll("#do-secici .ds-liste label"), function (l) {
      var i = +l.getAttribute("data-no");
      var var_ = SECIM.indexOf(i) > -1;
      l.classList.toggle("secili", var_);
      var c = l.querySelector("input"); if (c) c.checked = var_;
    });
    var bilgi = document.querySelector("#do-secici .ds-bilgi");
    if (bilgi) bilgi.textContent = n ? n + " sayfa seçildi" : "Sayfa seçin";
    var bar = document.getElementById("do-secim-bar");
    if (bar) {
      bar.classList.toggle("acik", n > 0 && !document.getElementById("do-secici").classList.contains("acik"));
      var y = bar.querySelector(".dsb-yazi"); if (y) y.textContent = n + " sayfa seçildi:";
    }
  }
  function secimDegistir(i, durum) {
    var k = SECIM.indexOf(i);
    if (durum && k < 0) SECIM.push(i);
    if (!durum && k > -1) SECIM.splice(k, 1);
    secimiGuncelle();
  }

  function seciciAc() {
    var s = document.getElementById("do-secici");
    if (!s) return;
    s.classList.add("acik");
    secimiGuncelle();
  }
  function seciciKapat() {
    var s = document.getElementById("do-secici");
    if (s) s.classList.remove("acik");
    secimiGuncelle();
  }
  function seciliIslem(ne) {
    var liste = seciliSayfalar();
    if (!liste.length) { alert("Önce en az bir sayfa seçin."); return; }
    seciciKapat();
    if (ne === "yaz") yalnizBunlariYazdir(liste);
    else indir(ne, liste);
  }

  function secimKur() {
    if (document.getElementById("do-secici")) return;
    var bulunan = sayfalariBul();
    /* yalnızca gerçek A4 sayfa kutuları (.sayfa, .page …) olan dosyalarda */
    bulunan = bulunan.filter(function (el) { return el.matches && el.matches(SAYFA_SECICI); });
    if (bulunan.length < 2) return;
    SAYFALAR = bulunan;
    secimStilEkle();

    /* 1) Her sayfanın üstüne küçük şerit */
    SAYFALAR.forEach(function (el, i) {
      var b = document.createElement("div");
      b.className = "do-sayfa-bar";
      b.setAttribute("data-no", i);
      var ad = sayfaBasligi(el, i);
      b.innerHTML = '<label><input type="checkbox" aria-label="Bu sayfayı seç"><span><b>' + (i + 1) + '.</b> ' +
        ad.replace(/</g, "&lt;") + '</span></label><span class="do-sb-dg"><span class="do-sb-not">Bu sayfa:</span>' +
        '<button type="button" class="do-b-yaz" title="Yalnız bu sayfayı yazdır">🖨️ Yazdır</button>' +
        '<button type="button" class="do-b-pdf" title="Yalnız bu sayfayı PDF indir">⬇️ PDF</button>' +
        '<button type="button" class="do-b-word" title="Yalnız bu sayfayı Word indir">📄 Word</button></span>';
      b.querySelector("input").addEventListener("change", function (e) { secimDegistir(i, e.target.checked); });
      b.querySelector(".do-b-yaz").onclick = function () { yalnizBunlariYazdir([el]); };
      b.querySelector(".do-b-pdf").onclick = function () { indir("pdf", [el]); };
      b.querySelector(".do-b-word").onclick = function () { indir("word", [el]); };
      el.parentNode.insertBefore(b, el);
    });

    /* 2) Sayfa seçme penceresi */
    var s = document.createElement("div");
    s.id = "do-secici";
    var satirlar = SAYFALAR.map(function (el, i) {
      return '<label data-no="' + i + '"><input type="checkbox"><span class="ds-no">' + (i + 1) + '.</span><span>' +
        sayfaBasligi(el, i).replace(/</g, "&lt;") + '</span></label>';
    }).join("");
    s.innerHTML = '<div class="ds-kutu"><div class="ds-ust"><b>Sayfa Seç</b>' +
      '<span><button type="button" class="do-b-gri ds-hepsi">Tümü</button> <button type="button" class="do-b-gri ds-temiz">Temizle</button> ' +
      '<button type="button" class="do-b-gri ds-kapat" aria-label="Kapat">✕</button></span></div>' +
      '<div class="ds-liste">' + satirlar + '</div>' +
      '<div class="ds-alt"><span class="ds-bilgi">Sayfa seçin</span>' +
      '<button type="button" class="do-b-yaz ds-yaz">🖨️ Yazdır</button><button type="button" class="do-b-pdf ds-pdf">⬇️ PDF</button>' +
      '<button type="button" class="do-b-word ds-word">📄 Word</button></div></div>';
    document.body.appendChild(s);
    Array.prototype.forEach.call(s.querySelectorAll(".ds-liste label"), function (l) {
      var i = +l.getAttribute("data-no");
      l.querySelector("input").addEventListener("change", function (e) { secimDegistir(i, e.target.checked); });
    });
    s.querySelector(".ds-hepsi").onclick = function () { SECIM = SAYFALAR.map(function (x, i) { return i; }); secimiGuncelle(); };
    s.querySelector(".ds-temiz").onclick = function () { SECIM = []; secimiGuncelle(); };
    s.querySelector(".ds-kapat").onclick = seciciKapat;
    s.addEventListener("click", function (e) { if (e.target === s) seciciKapat(); });
    s.querySelector(".ds-yaz").onclick = function () { seciliIslem("yaz"); };
    s.querySelector(".ds-pdf").onclick = function () { seciliIslem("pdf"); };
    s.querySelector(".ds-word").onclick = function () { seciliIslem("word"); };

    /* 3) Seçim yapılınca alttan çıkan şerit */
    var sb = document.createElement("div");
    sb.id = "do-secim-bar";
    sb.innerHTML = '<span class="dsb-yazi"></span>' +
      '<button type="button" class="do-b-yaz" style="background:#fff;color:#0f172a">🖨️ Yazdır</button>' +
      '<button type="button" class="do-b-pdf">PDF</button><button type="button" class="do-b-word">Word</button>' +
      '<button type="button" class="do-b-gri" title="Seçimi temizle">✕</button>';
    var d = sb.querySelectorAll("button");
    d[0].onclick = function () { seciliIslem("yaz"); };
    d[1].onclick = function () { seciliIslem("pdf"); };
    d[2].onclick = function () { seciliIslem("word"); };
    d[3].onclick = function () { SECIM = []; secimiGuncelle(); };
    document.body.appendChild(sb);

    /* 4) Ana çubuğa "Sayfa Seç" düğmesi */
    var bar = document.getElementById("do-indir-bar");
    if (bar && !document.getElementById("do-sec-btn")) {
      var btn = document.createElement("button");
      btn.id = "do-sec-btn"; btn.type = "button"; btn.title = "Yazdırmak / indirmek istediğiniz sayfaları seçin";
      btn.textContent = "☑️ Sayfa Seç";
      btn.onclick = seciciAc;
      bar.insertBefore(btn, bar.firstChild);
      var yz = document.getElementById("do-yazdir-btn"); if (yz) yz.textContent = "🖨️ Tümünü Yazdır";
      var wb = document.getElementById("do-word-btn"); if (wb) { wb.textContent = "📦 Tüm Paket · Word"; wb.title = "Bütün sayfaları tek Word dosyası olarak indir"; }
      var pb = document.getElementById("do-indir-btn"); if (pb) { pb.textContent = "📦 Tüm Paket · PDF"; pb.title = "Bütün sayfaları tek PDF dosyası olarak indir"; }
    }
  }
  window.doSayfaSecici = function () { secimKur(); seciciAc(); };
  window.doSayfaSayisi = function () { return SAYFALAR.length; };

  window.doPdfIndir = indir;
  window.doWordIndir = function () { indir("word"); };

  function basla() {
    stilEkle();
    dugmeEkle();
    // Sayfanın kendi HTML kaydetme işlevini devre dışı bırak (dünya simgeli dosya sorunu)
    window.__dosyayiIndir = function () { indir("pdf"); };
    window.dosyayiIndir = window.dosyayiIndir ? function () { indir("pdf"); } : window.dosyayiIndir;
    setTimeout(eskiDugmeleriCevir, 1200);
    setTimeout(eskiDugmeleriCevir, 4000);
    var kur = function () { setTimeout(function () { try { secimKur(); } catch (e) { console.warn("sayfa seçimi kurulamadı", e); } }, 700); };
    if (document.readyState === "complete") kur(); else window.addEventListener("load", kur);
    var m = location.search.match(/[?&]indir=(1|pdf|word)\b/);
    if (m) {
      var f = function () { indir(m[1] === "word" ? "word" : "pdf"); };
      if (document.readyState === "complete") setTimeout(f, 900);
      else window.addEventListener("load", function () { setTimeout(f, 900); });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", basla);
  else basla();
})();
