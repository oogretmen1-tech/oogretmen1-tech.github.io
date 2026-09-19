/* ============================================================
   Dijital Öğretmen — Ön İzleme (onizleme.js)
   Baskıya hazır etkinlikler, pano çalışmaları, öğretmen evrakları,
   ölçme-değerlendirme vb. bölümlerdeki her materyal kartına
   "Ön İzleme" düğmesi ekler. Düğmeye basınca materyal büyük bir
   pencerede sayfa sayfa görüntülenir; alttan Yazdır / PDF / Word
   indirilebilir. İnteraktif dersler, oyunlar ve hikâyeler hariçtir.
   ============================================================ */
(function () {
  "use strict";
  if (window.__doOnizleme) return;
  window.__doOnizleme = true;

  /* Ön izleme düğmesi eklenecek bölümler */
  var BOLUMLER = [
    "page-baskiya", "page-pano", "page-evraklar", "page-olcme",
    "page-belirli", "page-harfatolye", "page-ogretmenrehberi",
    "page-ihtiyac", "page-yillikplanlar", "page-cedes"
  ];

  /* İnteraktif / hub sayfalar: ön izleme yok, doğrudan açılır */
  var HARIC = [
    "23Nisan_Uygulama.html", "1-sinif-hazirlik-donemi.html",
    "sesli-ogrenme-materyalleri.html", "mevsim-agaci-pano.html",
    "kapi-susleme.html", "sozluk.html", "dinleme-kosesi.html"
  ];

  var PDFJS_YEDEK = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
  var ILK_SAYFA_SAYISI = 3;     /* açılışta hemen çizilecek sayfa */

  /* ---------------- yardımcılar ---------------- */
  function dosyaAdi(u) { return (u || "").split("?")[0].split("#")[0].split("/").pop(); }
  function uzanti(u) { var a = dosyaAdi(u); var i = a.lastIndexOf("."); return i < 0 ? "" : a.slice(i + 1).toLowerCase(); }
  function kokAd(u) { var a = dosyaAdi(u); return a.replace(/\.[^.]+$/, ""); }
  function indir(url) {
    var a = document.createElement("a");
    a.href = url; a.download = ""; document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------------- stil ---------------- */
  function stilEkle() {
    if (document.getElementById("oi-stil")) return;
    var css =
      ".card-onizle{background:#0f766e !important;box-shadow:none}" +
      "#oi-kaplama{position:fixed;inset:0;z-index:2147483500;background:rgba(15,23,42,.78);" +
        "display:none;align-items:center;justify-content:center;padding:14px;" +
        "font-family:Nunito,Arial,sans-serif}" +
      "#oi-kaplama.acik{display:flex}" +
      "#oi-kutu{background:#fff;border-radius:16px;width:min(980px,100%);height:min(92vh,100%);" +
        "display:flex;flex-direction:column;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.45)}" +
      "#oi-bar{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#1e293b;color:#fff;flex:none}" +
      "#oi-baslik{font-size:1rem;font-weight:800;flex:1;line-height:1.3;overflow:hidden;" +
        "display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}" +
      "#oi-sayac{font-size:.78rem;font-weight:700;opacity:.85;white-space:nowrap}" +
      "#oi-kapat{border:0;background:rgba(255,255,255,.16);color:#fff;font-size:1.1rem;font-weight:900;" +
        "width:36px;height:36px;border-radius:50%;cursor:pointer;flex:none}" +
      "#oi-kapat:hover{background:rgba(255,255,255,.3)}" +
      "#oi-govde{flex:1;overflow:auto;background:#e2e8f0;-webkit-overflow-scrolling:touch}" +
      "#oi-sayfalar{display:flex;flex-direction:column;align-items:center;gap:14px;padding:14px}" +
      ".oi-sayfa{background:#fff;box-shadow:0 3px 12px rgba(0,0,0,.22);max-width:100%;width:100%;" +
        "border-radius:4px;display:block}" +
      ".oi-bekle{display:flex;align-items:center;justify-content:center;color:#64748b;" +
        "font-weight:700;font-size:.85rem;background:#fff;border-radius:4px;width:100%}" +
      "#oi-govde iframe{width:100%;height:100%;border:0;background:#fff;display:block}" +
      "#oi-alt{flex:none;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;" +
        "padding:11px 12px;background:#f8fafc;border-top:1px solid #e2e8f0}" +
      "#oi-alt button{border:0;border-radius:999px;padding:11px 17px;font-size:.85rem;font-weight:800;" +
        "cursor:pointer;color:#fff;font-family:inherit;line-height:1}" +
      ".oi-pdf{background:#c62828}.oi-word{background:#2b579a}.oi-yaz{background:#0f172a}" +
      ".oi-ac{background:#0f766e}" +
      "#oi-durum{padding:26px 18px;text-align:center;color:#475569;font-weight:700;font-size:.9rem}" +
      "@media(max-width:600px){#oi-kutu{height:100%;border-radius:12px}" +
        "#oi-alt button{padding:10px 13px;font-size:.8rem}}" +
      "@media print{#oi-kaplama{display:none !important}}";
    var st = document.createElement("style");
    st.id = "oi-stil"; st.textContent = css;
    document.head.appendChild(st);
  }

  /* ---------------- pencere ---------------- */
  var kaplama, govde, baslik, sayac, alt;

  function pencereKur() {
    if (kaplama) return;
    kaplama = document.createElement("div");
    kaplama.id = "oi-kaplama";
    kaplama.innerHTML =
      '<div id="oi-kutu" role="dialog" aria-modal="true">' +
        '<div id="oi-bar"><span id="oi-baslik"></span><span id="oi-sayac"></span>' +
        '<button id="oi-kapat" type="button" aria-label="Kapat">✕</button></div>' +
        '<div id="oi-govde"></div><div id="oi-alt"></div></div>';
    document.body.appendChild(kaplama);
    govde = kaplama.querySelector("#oi-govde");
    baslik = kaplama.querySelector("#oi-baslik");
    sayac = kaplama.querySelector("#oi-sayac");
    alt = kaplama.querySelector("#oi-alt");
    kaplama.querySelector("#oi-kapat").onclick = kapat;
    kaplama.addEventListener("click", function (e) { if (e.target === kaplama) kapat(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && kaplama.classList.contains("acik")) kapat();
    });
  }

  function kapat() {
    kaplama.classList.remove("acik");
    govde.innerHTML = ""; alt.innerHTML = ""; sayac.textContent = "";
    document.body.style.overflow = "";
  }

  function dugme(sinif, yazi, islev) {
    var b = document.createElement("button");
    b.type = "button"; b.className = sinif; b.textContent = yazi; b.onclick = islev;
    alt.appendChild(b); return b;
  }

  /* ---------------- pdf.js ---------------- */
  var pdfjsYuk = null;
  function kokYol() {
    var s = document.querySelector('script[src*="onizleme.js"]');
    return s ? s.src.replace(/onizleme\.js.*$/, "") : "";
  }
  function yedekYukle() {
    return new Promise(function (ok, hata) {
      var s = document.createElement("script");
      s.src = PDFJS_YEDEK + "pdf.min.js";
      s.onload = function () {
        try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_YEDEK + "pdf.worker.min.js"; } catch (e) {}
        ok(window.pdfjsLib);
      };
      s.onerror = hata;
      document.head.appendChild(s);
    });
  }
  function pdfjsHazirla() {
    if (pdfjsYuk) return pdfjsYuk;
    var kok = kokYol();
    pdfjsYuk = import(kok + "onizleme-pdf.min.mjs").then(function (lib) {
      lib.GlobalWorkerOptions.workerSrc = kok + "onizleme-pdf.worker.min.mjs";
      return lib;
    }).catch(yedekYukle);
    return pdfjsYuk;
  }

  function pdfGoster(url) {
    govde.innerHTML = '<div id="oi-durum">Ön izleme hazırlanıyor…</div>';
    pdfjsHazirla().then(function (lib) {
      return lib.getDocument(url).promise;
    }).then(function (pdf) {
      sayac.textContent = pdf.numPages + " sayfa";
      govde.innerHTML = '<div id="oi-sayfalar"></div>';
      var kap = govde.querySelector("#oi-sayfalar");
      var genislik = Math.min(kap.clientWidth - 28, 900);
      var kutular = [];
      for (var i = 1; i <= pdf.numPages; i++) {
        var yer = document.createElement("div");
        yer.className = "oi-bekle";
        yer.style.height = Math.round(genislik * 1.414) + "px";
        yer.textContent = i + ". sayfa";
        yer.dataset.no = i;
        kap.appendChild(yer); kutular.push(yer);
      }
      function ciz(yer) {
        if (yer.dataset.cizildi) return;
        yer.dataset.cizildi = "1";
        pdf.getPage(+yer.dataset.no).then(function (sayfa) {
          var v1 = sayfa.getViewport({ scale: 1 });
          var olcek = genislik / v1.width;
          var vp = sayfa.getViewport({ scale: olcek * (window.devicePixelRatio > 1 ? 2 : 1.5) });
          var c = document.createElement("canvas");
          c.className = "oi-sayfa";
          c.width = Math.round(vp.width); c.height = Math.round(vp.height);
          c.style.width = "100%"; c.style.height = "auto";
          sayfa.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise.then(function () {
            if (yer.parentNode) yer.parentNode.replaceChild(c, yer);
          });
        });
      }
      if ("IntersectionObserver" in window) {
        var gozlemci = new IntersectionObserver(function (girisler) {
          girisler.forEach(function (g) { if (g.isIntersecting) { ciz(g.target); gozlemci.unobserve(g.target); } });
        }, { root: govde, rootMargin: "600px 0px" });
        kutular.forEach(function (k) { gozlemci.observe(k); });
      }
      kutular.slice(0, ILK_SAYFA_SAYISI).forEach(ciz);
    }).catch(function () {
      govde.innerHTML = '<div id="oi-durum">Ön izleme açılamadı.<br>Dosyayı indirip açabilirsiniz.</div>';
    });
  }

  function htmlGoster(url) {
    govde.innerHTML = "";
    var f = document.createElement("iframe");
    f.src = url;
    f.setAttribute("title", "Ön izleme");
    f.onload = function () {
      /* sayfanın kendi indirme çubuğunu ön izlemede gizle */
      try {
        var d = f.contentDocument;
        var st = d.createElement("style");
        st.textContent = "#do-indir-bar,[data-indir-gizle]{display:none !important}";
        d.head.appendChild(st);
      } catch (e) {}
    };
    govde.appendChild(f);
  }

  /* ---------------- aç ---------------- */
  function ac(bilgi) {
    pencereKur();
    baslik.textContent = bilgi.ad;
    sayac.textContent = "";
    alt.innerHTML = "";
    kaplama.classList.add("acik");
    document.body.style.overflow = "hidden";

    if (bilgi.tip === "pdf") {
      pdfGoster(bilgi.hedef);
      dugme("oi-yaz", "🖨 Yazdır", function () { window.open(bilgi.hedef, "_blank"); });
      dugme("oi-pdf", "⬇ PDF İndir", function () { indir(bilgi.pdf); });
      if (bilgi.word) dugme("oi-word", "📄 Word İndir", function () { indir(bilgi.word); });
    } else {
      htmlGoster(bilgi.hedef);
      dugme("oi-yaz", "🖨 Yazdır", function () {
        var f = govde.querySelector("iframe");
        try { f.contentWindow.focus(); f.contentWindow.print(); }
        catch (e) { window.open(bilgi.hedef, "_blank"); }
      });
      if (bilgi.pdf) dugme("oi-pdf", "⬇ PDF İndir", function () { location.href = bilgi.pdf; });
      if (bilgi.word) dugme("oi-word", "📄 Word İndir", function () { location.href = bilgi.word; });
      dugme("oi-ac", "↗ Sayfayı Aç", function () { location.href = bilgi.hedef; });
    }
  }

  /* ---------------- kartlara düğme ekle ---------------- */
  function kartlariTara() {
    BOLUMLER.forEach(function (id) {
      var bolum = document.getElementById(id);
      if (!bolum) return;
      var kartlar = bolum.querySelectorAll("a.card");
      Array.prototype.forEach.call(kartlar, function (kart) {
        if (kart.classList.contains("yakinda")) return;
        if (kart.dataset.onizleme === "yok") return;
        var href = kart.getAttribute("href") || "";
        if (!href || href.charAt(0) === "#" || href.indexOf("javascript:") === 0) return;
        var ad = dosyaAdi(href);
        if (HARIC.indexOf(ad) > -1) return;
        /* data-onizleme ile başka bir dosya ön izlenebilir (ör. çok sayfalı HTML yerine PDF'i) */
        var onizHedef = kart.dataset.onizleme || href;
        var ext = uzanti(onizHedef);
        if (uzanti(href) !== "pdf" && uzanti(href) !== "html" && uzanti(href) !== "htm") return;
        var govdeEl = kart.querySelector(".card-body") || kart;
        if (govdeEl.querySelector(".card-onizle")) return;

        var bilgi = { ad: "", tip: ext === "pdf" ? "pdf" : "html", hedef: onizHedef, pdf: "", word: "" };
        var b = kart.querySelector(".card-body h3");
        bilgi.ad = b ? b.textContent.trim() : ad;

        /* karttaki mevcut indirme düğmelerinden hedefleri çıkar */
        var mevcut = govdeEl.querySelectorAll(".card-indir");
        Array.prototype.forEach.call(mevcut, function (d) {
          var oc = d.getAttribute("onclick") || "";
          var m = oc.match(/['"]([^'"]+\.(?:pdf|docx))['"]/i) || oc.match(/['"]([^'"]+\?indir=[^'"]*)['"]/i);
          if (!m) return;
          var hedef = m[1];
          if (d.classList.contains("card-word") || /\.docx/i.test(hedef) || /indir=word/.test(hedef)) bilgi.word = hedef;
          else bilgi.pdf = hedef;
        });
        if (bilgi.tip === "pdf") {
          if (!bilgi.pdf) bilgi.pdf = onizHedef;
          if (!bilgi.word) bilgi.word = kokAd(onizHedef) + ".docx";
        } else {
          if (!bilgi.pdf) bilgi.pdf = href + "?indir=1";
          if (!bilgi.word) bilgi.word = href + "?indir=word";
        }

        var span = document.createElement("span");
        span.className = "card-indir card-onizle";
        span.setAttribute("role", "button");
        span.textContent = "👁 Ön İzleme";
        span.addEventListener("click", function (e) {
          e.preventDefault(); e.stopPropagation(); ac(bilgi);
        });
        var ilk = govdeEl.querySelector(".card-indir");
        if (ilk) govdeEl.insertBefore(span, ilk); else govdeEl.appendChild(span);
      });
    });
  }

  function baslat() { stilEkle(); pencereKur(); kartlariTara(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", baslat);
  else baslat();
  window.doOnizlemeTara = kartlariTara;
})();
