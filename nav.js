/* ============================================================
   Dijital Öğretmen — Site Gezinme Çubuğu (nav.js)
   Tüm sayfalara otomatik olarak eklenir.
   İçerik: Geri · İleri · Yol izi (breadcrumb) · Ana Sayfa · Yukarı
   ============================================================ */
(function () {
  "use strict";
  if (window.__dijitalOgretmenNav) return;
  window.__dijitalOgretmenNav = true;

  var ANA_SAYFA = "index.html";
  var IZ_ANAHTAR = "do-gezinme-izi";
  var YUKSEKLIK = 50;

  /* ---------- Yardımcılar ---------- */
  function simdikiAdres() {
    return location.pathname + location.search;
  }

  function dosyaAdi() {
    var p = location.pathname.split("/").pop() || "index.html";
    return p.toLowerCase();
  }

  function anaSayfaMi() {
    var d = dosyaAdi();
    return d === "" || d === "index.html";
  }

  function sayfaBasligi() {
    // index.html içindeki bölümler (SPA) için açık bölümün başlığını kullan
    var aktif = document.querySelector(".page-section.aktif");
    if (aktif) {
      if (aktif.id === "page-home") return "Ana Sayfa";
      var h = aktif.querySelector(".cat-hero h2, h2, h1");
      if (h && h.textContent.trim()) return h.textContent.trim();
    }
    var t = (document.title || "").trim();
    return t || "Sayfa";
  }

  /* Doğrudan girilen bir sayfada geçmiş yoksa: mantıksal üst sayfa */
  function ustSayfa() {
    var d = dosyaAdi();
    var kural = [
      [/fotokopi|calisma-kagidi|baskiya/, "?page=baskiya"],
      [/yillik-plan|yillik_plan/, "?page=yillikplanlar"],
      [/pano/, "?page=pano"],
      [/hikaye|kitap|masal/, "?page=hikaye"],
      [/siir/, "?page=siir"],
      [/oyun/, "?page=oyun"],
      [/cedes|deger/, "?page=cedes"],
      [/ogretmen-dosyasi|evrak|dosya-kapak|calisma-takvimi/, "?page=evraklar"],
      [/rehber/, "?page=ogretmenrehberi"],
      [/ihtiyac/, "?page=ihtiyac"],
      [/ingilizce/, "?page=ingilizce"],
      [/bilincli/, "?page=bilincli"],
      [/^3-sinif.*turkce|turkce.*3-sinif/, "?page=turkce3"],
      [/^3-sinif.*matematik/, "?page=matematik3"],
      [/^3-sinif.*(hayat)/, "?page=hayat3"],
      [/^3-sinif.*(fen)/, "?page=fen3"],
      [/turkce|okuma-yazma|okuma_yazma|harf|ses-grubu|cizgi/, "?page=turkce"],
      [/matematik|sayilar/, "?page=matematik"],
      [/hayat/, "?page=hayat"],
      [/kasim|nisan|ekim|mayis|mart|subat|ocak|aralik|hafta|gun/, "?page=belirli"]
    ];
    for (var i = 0; i < kural.length; i++) {
      if (kural[i][0].test(d)) return ANA_SAYFA + kural[i][1];
    }
    return ANA_SAYFA;
  }

  /* ---------- Gezinme izi (sessionStorage) ---------- */
  function izOku() {
    try {
      var v = JSON.parse(sessionStorage.getItem(IZ_ANAHTAR));
      if (v && v.liste && typeof v.i === "number") return v;
    } catch (e) {}
    return { liste: [], i: -1 };
  }

  function izYaz(v) {
    try { sessionStorage.setItem(IZ_ANAHTAR, JSON.stringify(v)); } catch (e) {}
  }

  function izGuncelle() {
    var s = izOku();
    var u = simdikiAdres();
    var t = sayfaBasligi();

    if (s.i >= 0 && s.liste[s.i] && s.liste[s.i].u === u) {
      s.liste[s.i].t = t;                      // aynı sayfa
    } else if (s.i > 0 && s.liste[s.i - 1] && s.liste[s.i - 1].u === u) {
      s.i--;                                   // geri gidildi
    } else if (s.liste[s.i + 1] && s.liste[s.i + 1].u === u) {
      s.i++;                                   // ileri gidildi
    } else {
      s.liste = s.liste.slice(0, s.i + 1);
      s.liste.push({ u: u, t: t });
      s.i = s.liste.length - 1;                // yeni sayfa
    }

    if (s.liste.length > 40) {
      var kes = s.liste.length - 40;
      s.liste = s.liste.slice(kes);
      s.i -= kes;
      if (s.i < 0) s.i = 0;
    }
    izYaz(s);
    return s;
  }

  /* ---------- Görünüm ---------- */
  var css =
    '#do-nav{position:fixed;top:0;left:0;right:0;z-index:2147483000;height:' + YUKSEKLIK + 'px;' +
    'display:flex;align-items:center;gap:6px;padding:0 10px;box-sizing:border-box;' +
    'background:rgba(255,255,255,.94);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);' +
    'border-bottom:1px solid #DCE3EC;box-shadow:0 2px 10px rgba(14,29,51,.07);' +
    'font-family:"Andika","Nunito","Trebuchet MS",Arial,sans-serif;' +
    'transition:transform .25s ease;transform:translateY(0);margin:0!important;' +
    'font-size:14px;line-height:1.2}' +
    '#do-nav.do-gizli{transform:translateY(-100%)}' +
    '#do-nav button{font-family:inherit!important;font-size:14px!important;font-weight:700!important;' +
    'color:#16345C!important;background:#F2F4F8!important;box-sizing:border-box!important;' +
    'border:1px solid #DCE3EC!important;border-radius:11px!important;' +
    'height:36px!important;min-height:0!important;max-height:36px!important;' +
    'min-width:36px!important;width:auto!important;padding:0 11px!important;margin:0!important;' +
    'display:inline-flex!important;align-items:center;justify-content:center;gap:5px;' +
    'flex:0 0 auto;cursor:pointer;line-height:1!important;text-transform:none!important;' +
    'letter-spacing:normal!important;box-shadow:none!important;position:static!important;' +
    'transform:none;animation:none!important;' +
    '-webkit-tap-highlight-color:transparent;transition:background .15s,transform .1s}' +
    '#do-nav button:active{transform:scale(.94)}' +
    '#do-nav button:hover{background:#E9EEF4}' +
    '#do-nav button[disabled]{opacity:.34;cursor:default;pointer-events:none}' +
    '#do-nav .do-ana{background:#16345C!important;color:#fff!important;border-color:#16345C!important}' +
    '#do-nav .do-ana:hover{background:#0E1D33!important}' +
    '#do-nav>button#do-geri{order:1}#do-nav>button#do-ileri{order:2}' +
    '#do-nav>.do-iz{order:3}#do-nav>button#do-ana{order:4}' +
    '#do-nav .do-iz{flex:1 1 auto!important;min-width:0;display:flex!important;align-items:center;gap:4px;' +
    'position:static!important;float:none!important;margin:0!important;background:none!important;' +
    'overflow-x:auto;overflow-y:hidden;white-space:nowrap;scrollbar-width:none;' +
    'font-size:13.5px;color:#5E6E82;padding:0 2px;box-shadow:none!important;border:0!important}' +
    '#do-nav .do-iz::-webkit-scrollbar{display:none}' +
    '#do-nav .do-iz a{color:#5E6E82;background:none;text-decoration:none!important;cursor:pointer;' +
    'padding:3px 6px;border:0;border-radius:8px;font-weight:400;' +
    'max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;vertical-align:middle}' +
    '#do-nav .do-iz a:hover{background:#F2F4F8;color:#16345C}' +
    '#do-nav .do-iz a,#do-nav .do-iz .do-simdi{flex:0 0 auto}' +
    '#do-nav .do-iz .do-simdi{color:#16345C;font-weight:700;max-width:none;' +
    'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:3px 4px}' +
    '#do-nav .do-ayrac{color:#C4CEDA;flex:0 0 auto;padding:0 1px}' +
    '#do-yukari{position:fixed!important;right:14px!important;bottom:14px!important;top:auto!important;' +
    'left:auto!important;z-index:2147482000;width:44px!important;height:44px!important;' +
    'box-sizing:border-box!important;padding:0!important;margin:0!important;' +
    'border-radius:50%!important;border:1px solid #DCE3EC!important;background:rgba(255,255,255,.94)!important;' +
    'color:#16345C!important;font-family:inherit;font-size:19px!important;font-weight:700!important;' +
    'line-height:1!important;cursor:pointer;box-shadow:0 6px 18px rgba(14,29,51,.16)!important;' +
    'display:none;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent}' +
    '#do-yukari.do-acik{display:flex!important}' +
    '@media(max-width:560px){' +
    '#do-nav .do-iz{font-size:12.5px}' +
    '#do-nav .do-iz a{max-width:120px}' +
    '#do-nav button{padding:0 9px!important;font-size:13px!important}' +
    '#do-nav .do-etiket{display:none}}' +
    '@media print{#do-nav,#do-yukari{display:none!important}' +
    'body{padding-top:0!important}}';

  function stilEkle() {
    var s = document.createElement("style");
    s.id = "do-nav-stil";
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  var cubuk, btnGeri, btnIleri, izKutu, btnYukari;

  function cubukKur() {
    cubuk = document.createElement("div");
    cubuk.id = "do-nav";
    cubuk.setAttribute("role", "navigation");
    cubuk.setAttribute("aria-label", "Site gezinme");
    cubuk.innerHTML =
      '<button type="button" id="do-geri" title="Geri (Alt + ←)" aria-label="Geri">' +
      '←<span class="do-etiket">Geri</span></button>' +
      '<button type="button" id="do-ileri" title="İleri (Alt + →)" aria-label="İleri">' +
      '<span class="do-etiket">İleri</span>→</button>' +
      '<div class="do-iz" id="do-iz"></div>' +
      '<button type="button" class="do-ana" id="do-ana" title="Ana Sayfa" aria-label="Ana Sayfa">' +
      '⌂<span class="do-etiket">Ana Sayfa</span></button>';
    document.body.appendChild(cubuk);

    btnYukari = document.createElement("button");
    btnYukari.type = "button";
    btnYukari.id = "do-yukari";
    btnYukari.title = "Sayfa başına dön";
    btnYukari.setAttribute("aria-label", "Sayfa başına dön");
    btnYukari.textContent = "↑";
    document.body.appendChild(btnYukari);

    btnGeri = document.getElementById("do-geri");
    btnIleri = document.getElementById("do-ileri");
    izKutu = document.getElementById("do-iz");

    btnGeri.addEventListener("click", geriGit);
    btnIleri.addEventListener("click", ileriGit);
    document.getElementById("do-ana").addEventListener("click", function () {
      location.href = ANA_SAYFA;
    });
    btnYukari.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* Sayfanın kendi içeriğini çubuğun altından başlat */
  function yerAc() {
    var mevcut = parseFloat(getComputedStyle(document.body).paddingTop) || 0;
    if (!document.body.hasAttribute("data-do-pad")) {
      document.body.setAttribute("data-do-pad", "1");
      document.body.style.paddingTop = (mevcut + YUKSEKLIK) + "px";
    }
    // Sayfada kendi sabit üst başlığı varsa onu da aşağı kaydır
    var hepsi = document.body.querySelectorAll("*");
    for (var i = 0; i < hepsi.length && i < 400; i++) {
      var el = hepsi[i];
      if (el.id === "do-nav" || el.id === "do-yukari") continue;
      var st = getComputedStyle(el);
      if (st.position === "fixed" && st.display !== "none") {
        var ust = parseFloat(st.top);
        if (!isNaN(ust) && ust >= 0 && ust < 10) {
          el.style.top = (ust + YUKSEKLIK) + "px";
        }
      }
    }
  }

  /* ---------- Eylemler ---------- */
  function geriGit() {
    var s = izOku();
    if (s.i > 0) history.back();
    else location.href = anaSayfaMi() ? ANA_SAYFA : ustSayfa();
  }

  function ileriGit() {
    var s = izOku();
    if (s.i < s.liste.length - 1) history.forward();
  }

  function kisalt(metin) {
    metin = String(metin || "Sayfa").replace(/\s+/g, " ").trim();
    metin = metin.replace(/\s*[|–—-]\s*Dijital Öğretmen\s*$/i, "");
    return metin.length > 34 ? metin.slice(0, 33) + "…" : metin;
  }

  function ciz() {
    var s = izGuncelle();

    btnGeri.disabled = (s.i <= 0 && anaSayfaMi());
    btnIleri.disabled = (s.i >= s.liste.length - 1);

    // Son 4 adımı göster
    var bas = Math.max(0, s.i - 3);
    var parca = "";
    if (bas > 0) parca += '<span class="do-ayrac">…</span>';
    for (var k = bas; k <= s.i; k++) {
      var e = s.liste[k];
      if (!e) continue;
      if (k > bas || bas > 0) parca += '<span class="do-ayrac">›</span>';
      if (k === s.i) {
        parca += '<span class="do-simdi">' + kacir(kisalt(e.t)) + "</span>";
      } else {
        parca += '<a data-git="' + (k - s.i) + '">' + kacir(kisalt(e.t)) + "</a>";
      }
    }
    izKutu.innerHTML = parca;
    izKutu.scrollLeft = izKutu.scrollWidth;

    var baglar = izKutu.querySelectorAll("a[data-git]");
    for (var j = 0; j < baglar.length; j++) {
      baglar[j].addEventListener("click", function () {
        var d = parseInt(this.getAttribute("data-git"), 10);
        if (d) history.go(d);
      });
    }
  }

  function kacir(m) {
    return String(m).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------- Kaydırmada gizle / göster ---------- */
  function kaydirmaKur() {
    var sonY = window.pageYOffset || 0;
    var bekle = false;
    window.addEventListener("scroll", function () {
      if (bekle) return;
      bekle = true;
      window.requestAnimationFrame(function () {
        var y = window.pageYOffset || 0;
        if (y > 140 && y > sonY + 6) cubuk.classList.add("do-gizli");
        else if (y < sonY - 6 || y < 90) cubuk.classList.remove("do-gizli");
        if (y > 400) btnYukari.classList.add("do-acik");
        else btnYukari.classList.remove("do-acik");
        sonY = y;
        bekle = false;
      });
    }, { passive: true });
  }

  /* ---------- Klavye ---------- */
  function klavyeKur() {
    document.addEventListener("keydown", function (e) {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); geriGit(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); ileriGit(); }
    });
  }

  /* ---------- history API'sini dinle (index.html içi geçişler) ---------- */
  function tarihceKur() {
    var pushOrj = history.pushState;
    var replaceOrj = history.replaceState;
    history.pushState = function () {
      var r = pushOrj.apply(this, arguments);
      setTimeout(ciz, 60);
      return r;
    };
    history.replaceState = function () {
      var r = replaceOrj.apply(this, arguments);
      setTimeout(ciz, 60);
      return r;
    };
    window.addEventListener("popstate", function () { setTimeout(ciz, 60); });
    window.addEventListener("pageshow", function () { ciz(); });
  }

  /* ---------- Başlat ---------- */
  function basla() {
    if (!document.body) { setTimeout(basla, 30); return; }
    stilEkle();
    cubukKur();
    yerAc();
    ciz();
    kaydirmaKur();
    klavyeKur();
    tarihceKur();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", basla);
  } else {
    basla();
  }
})();
