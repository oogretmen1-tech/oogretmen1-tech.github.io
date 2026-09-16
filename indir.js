/* ============================================================
   Dijital Öğretmen — PDF İndir (indir.js)
   Sayfaya "PDF İndir" ve "Word İndir" düğmeleri ekler. Düğme, yazdırma penceresi
   AÇMADAN sayfayı doğrudan .pdf dosyası olarak cihaza indirir.
   Adrese ?indir=1 (PDF) veya ?indir=word eklenirse indirme kendiliğinden başlar.
   Gerekli kütüphaneler sitede barındırılır (indir-html2canvas.min.js, indir-jspdf.min.js).
   ============================================================ */
(function () {
  "use strict";
  if (window.__doIndir) return;
  window.__doIndir = true;

  var A4_W = 210, A4_H = 297, KENAR = 8;           // mm
  var PX_W = 794;                                   // A4 genişliği (96 dpi)
  var SAYFA_SECICI = ".page, .sayfa, .a4, .a4-sayfa, .print-page, .kagit, .paper, .worksheet, .calisma-sayfasi";
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
      "#do-indir-bar{position:fixed;right:14px;bottom:14px;z-index:2147483000;display:flex;gap:8px;font-family:Nunito,Arial,sans-serif}" +
      "#do-indir-bar button{border:0;border-radius:999px;padding:12px 18px;font-size:15px;font-weight:800;cursor:pointer;" +
      "box-shadow:0 4px 14px rgba(0,0,0,.28);display:flex;align-items:center;gap:7px;line-height:1}" +
      "#do-word-btn{background:#2b579a;color:#fff}#do-indir-btn{background:#c62828;color:#fff}#do-indir-bar{flex-wrap:wrap;justify-content:flex-end;max-width:calc(100vw - 28px)}"+"#do-indir-btn{}" +
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
    // Eski "Dosyayı İndir" (HTML kaydeden) düğmelerini PDF indirmeye çevir
    var eski = document.querySelectorAll('[onclick*="__dosyayiIndir"]');
    for (var i = 0; i < eski.length; i++) {
      eski[i].removeAttribute("onclick");
      eski[i].textContent = "⬇ PDF İndir";
      eski[i].addEventListener("click", function (e) { e.preventDefault(); indir("pdf"); });
    }
  }

  function ilerleme(oran, yazi) {
    var k = document.getElementById("do-indir-kaplama");
    if (!k) {
      k = document.createElement("div");
      k.id = "do-indir-kaplama";
      k.setAttribute("data-indir-gizle", "");
      k.innerHTML = '<div id="do-indir-kutu"><b>PDF hazırlanıyor…</b><div id="do-indir-cubuk"><div id="do-indir-dolgu"></div></div><div id="do-indir-yazi"></div></div>';
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
      "\n[data-indir-gizle],#do-indir-bar,#do-gezinme,.do-gezinme,.no-print,.noprint,.indir-arac-cubugu,.no_print,.yazdirma{display:none !important}" +
      "\nhtml,body{scroll-behavior:auto !important}" +
      "\n*{animation:none !important;transition:none !important}";
    document.head.appendChild(st);
  }
  function emulasyonKapat() {
    var st;
    while ((st = document.getElementById("do-indir-emul"))) st.remove();
  }

  /* ---------- Yardımcılar ---------- */
  function gorunur(el) {
    if (!el.getClientRects().length) return false;
    var cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none";
  }
  function sayfalariBul() {
    var hepsi = Array.prototype.slice.call(document.querySelectorAll(SAYFA_SECICI));
    var liste = hepsi.filter(function (el) {
      if (!gorunur(el)) return false;
      var r = el.getBoundingClientRect();
      if (r.width < 300 || r.height < 250) return false;
      // başka bir sayfa kabının içindeyse alma
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
    // Sınıf adı yoksa: yazdırmada sayfa sonu verilen öğeleri sayfa say
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
    return (t || "dijital-ogretmen").slice(0, 80) + ".pdf";
  }
  function bekle(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  function gorsellerHazir() {
    var imgs = Array.prototype.slice.call(document.images);
    return Promise.all(imgs.map(function (im) {
      if (im.complete) return null;
      return new Promise(function (ok) { im.onload = im.onerror = ok; setTimeout(ok, 4000); });
    }));
  }
  function olcek(el) {
    var r = el.getBoundingClientRect();
    var alan = r.width * r.height;
    var s = 2;
    if (alan * 4 > 60e6) s = Math.max(1, Math.sqrt(60e6 / alan));   // tuval sınırı
    return Math.min(s, 2);
  }
  function yakala(el) {
    return window.html2canvas(el, {
      scale: olcek(el),
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.clientWidth,
      ignoreElements: function (n) { return n.hasAttribute && n.hasAttribute("data-indir-gizle"); }
    });
  }

  /* Uzun içerikte satır/kart ortasından kesmemek için kesim noktaları */
  function kesimNoktalari(el, sayfaYuk) {
    var kok = el.getBoundingClientRect();
    var toplam = el.scrollHeight || kok.height;
    var kutular = [];
    var adaylar = el.querySelectorAll("p,li,tr,h1,h2,h3,h4,h5,h6,img,svg,canvas,table,figure,blockquote,pre,.card,.kart,.box,.kutu,.soru,[class*=soru],[class*=card],[class*=kart]");
    for (var i = 0; i < adaylar.length; i++) {
      var r = adaylar[i].getBoundingClientRect();
      if (r.height <= 0 || r.height > sayfaYuk * 0.9) continue;
      kutular.push([r.top - kok.top, r.bottom - kok.top]);
    }
    var kesimler = [0], y = 0;
    while (y + sayfaYuk < toplam - 2) {
      var kes = y + sayfaYuk, degisti = true, tur = 0;
      while (degisti && tur++ < 60) {
        degisti = false;
        for (var j = 0; j < kutular.length; j++) {
          var b = kutular[j];
          if (b[0] < kes - 1 && b[1] > kes + 1 && b[0] > y + sayfaYuk * 0.3) { kes = b[0] - 2; degisti = true; }
        }
      }
      if (kes <= y + 20) kes = y + sayfaYuk;
      kesimler.push(kes);
      y = kes;
    }
    kesimler.push(toplam);
    return kesimler;
  }

  function tuvalEkle(pdf, tuval, ilk) {
    if (!tuval || tuval.width < 2 || tuval.height < 2) return false;
    var gW = A4_W - 2 * KENAR, gH = A4_H - 2 * KENAR;
    var oran = Math.min(gW / tuval.width, gH / tuval.height);
    var w = tuval.width * oran, h = tuval.height * oran;
    if (!ilk) pdf.addPage();
    pdf.addImage(tuval.toDataURL("image/jpeg", 0.92), "JPEG", (A4_W - w) / 2, KENAR, w, h, undefined, "FAST");
    return true;
  }
  function dilimle(tuval, pikselOrani, kesimler) {
    var parcalar = [];
    for (var i = 0; i < kesimler.length - 1; i++) {
      var y0 = Math.round(kesimler[i] * pikselOrani);
      var y1 = Math.min(tuval.height, Math.round(kesimler[i + 1] * pikselOrani));
      if (y1 - y0 < 4) continue;
      var c = document.createElement("canvas");
      c.width = tuval.width; c.height = y1 - y0;
      var x = c.getContext("2d");
      x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(tuval, 0, y0, tuval.width, y1 - y0, 0, 0, tuval.width, y1 - y0);
      parcalar.push(c);
    }
    return parcalar;
  }

  /* ---------- Word (.docx) oluşturma: her sayfa A4'e tam oturan bir görsel ---------- */
  var CRC = (function () {
    var t = [];
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function utf8(s) { return new TextEncoder().encode(s); }
  function zipYap(dosyalar) {           // sıkıştırmasız (store) zip
    var parcalar = [], merkez = [], ofset = 0;
    function u16(v) { return [v & 255, (v >>> 8) & 255]; }
    function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
    dosyalar.forEach(function (d) {
      var ad = utf8(d.ad), veri = d.veri, crc = crc32(veri);
      var bas = [].concat([0x50, 0x4b, 3, 4], u16(20), u16(0x800), u16(0), u16(0), u16(0), u32(crc), u32(veri.length), u32(veri.length), u16(ad.length), u16(0));
      parcalar.push(new Uint8Array(bas), ad, veri);
      merkez.push(new Uint8Array([].concat([0x50, 0x4b, 1, 2], u16(20), u16(20), u16(0x800), u16(0), u16(0), u16(0), u32(crc), u32(veri.length), u32(veri.length), u16(ad.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(ofset))), ad);
      ofset += bas.length + ad.length + veri.length;
    });
    var mBoy = 0; merkez.forEach(function (m) { mBoy += m.length; });
    var son = new Uint8Array([].concat([0x50, 0x4b, 5, 6], u16(0), u16(0), u16(dosyalar.length), u16(dosyalar.length), u32(mBoy), u32(ofset), u16(0)));
    return new Blob(parcalar.concat(merkez, [son]), { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
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
      govde += '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>' +
        (i < gorseller.length - 1 ? '' : '') + '</w:pPr>' +
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
    var url = URL.createObjectURL(zipYap(dosyalar));
    var a = document.createElement("a");
    a.href = url; a.download = ad; a.style.display = "none";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
  }

  /* ---------- Asıl PDF oluşturma ---------- */
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
          isler = [document.body];
          if (document.documentElement.clientWidth > 980) {
            var dar = document.createElement("style");
            dar.id = "do-indir-emul";
            dar.textContent = "body{width:900px !important;max-width:900px !important;margin-left:auto !important;margin-right:auto !important;box-sizing:border-box}";
            document.head.appendChild(dar);
          }
        }
        var ekle = function (t) {
          if (!t || t.width < 2 || t.height < 2) return false;
          if (pdf) return tuvalEkle(pdf, t, ilk);
          gorseller.push({ veri: t.toDataURL("image/jpeg", 0.92), w: t.width, h: t.height });
          return true;
        };
        var zincir = Promise.resolve();
        isler.forEach(function (el, i) {
          zincir = zincir.then(function () {
            ilerleme(i / isler.length, "Sayfa " + (i + 1) + " / " + isler.length);
            return bekle(30);
          }).then(function () {
            return yakala(el);
          }).then(function (tuval) {
            var r = el.getBoundingClientRect();
            var cssW = r.width, cssH = Math.max(r.height, el.scrollHeight || 0);
            var sayfaYukPx = cssW * (gH / gW);           // bir PDF sayfasına sığan css yüksekliği
            if (cssH <= sayfaYukPx * 1.12) {
              if (ekle(tuval)) ilk = false;
            } else {
              var kes = kesimNoktalari(el, sayfaYukPx);
              dilimle(tuval, tuval.height / cssH, kes).forEach(function (p) {
                if (ekle(p)) ilk = false;
              });
            }
          });
        });
        return zincir;
      })
      .then(function () {
        ilerleme(1, "Dosya kaydediliyor…");
        adsiz = dosyaAdi();
        if (pdf) pdf.save(adsiz);
        else wordKaydet(gorseller, adsiz.replace(/\.pdf$/, ".docx"));
        return bekle(400);
      });
  }

  /* Sayfanın kendi "Tümünü yazdır" hazırlığını kullan:
     window.print çağrıldığında yazdırma yerine PDF üretilir. */
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
    if (puan(d) >= 10) return d;               // "tümünü yazdır" hazırlığı
    if (herhangi && !/^\s*window\.print\(\)\s*;?\s*$/.test(d.getAttribute("onclick") || "")) return d;
    return null;
  }

  /* Sayfa, yazdırma hazırlığını zamanlayıcıyla geri alırsa (ör. 1 sn sonra
     sınıfı kaldırmak) PDF bitene kadar html/body özniteliklerini sabit tut. */
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

  /* Sayfanın kendi yazdır düğmesine bas; window.print çağrısını yakala */
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
  // Yazdırma görünümü boşsa ekrandaki hâli al (düğmeler/araç çubukları gizli)
  function ekranGorunumu() {
    var st = document.createElement("style");
    st.id = "do-indir-emul";
    st.textContent = "[data-indir-gizle],#do-indir-bar,#do-gezinme,.no-print,.noprint,.indir-arac-cubugu,.modal-arka-plan{display:none !important}*{animation:none !important;transition:none !important}";
    document.head.appendChild(st);
  }

  function indir(bicim) {
    if (mesgul) return;
    mesgul = true;
    BICIM = bicim === "word" ? "word" : "pdf";
    ilerleme(0, "Hazırlanıyor…");
    var baslik = document.querySelector("#do-indir-kutu b");
    if (baslik) baslik.textContent = BICIM === "word" ? "Word dosyası hazırlanıyor…" : "PDF hazırlanıyor…";
    var bitir = function () {
      coz();
      emulasyonKapat();
      kaplamaKapat();
      mesgul = false;
      try { window.dispatchEvent(new Event("afterprint")); } catch (e) {}
    };
    kutuphaneler().then(function () {
      return hazirlaVeOlustur(sayfaninYazdirDugmesi(false));
    }).then(bitir, function (e) {
      bitir();
      console.error(e);
      if (confirm((BICIM === "word" ? "Word" : "PDF") + " dosyası oluşturulamadı. Bunun yerine yazdırma penceresi açılsın mı?\n(Yazıcı olarak \"PDF olarak kaydet\" seçebilirsiniz.)")) asilPrint();
    });
  }
  window.doPdfIndir = indir;

  function basla() {
    stilEkle();
    dugmeEkle();
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
