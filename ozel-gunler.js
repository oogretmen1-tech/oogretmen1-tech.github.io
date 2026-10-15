/* =========================================================
   Dijital Öğretmen · Özel Gün ve Bayram Bandı
   Bu dosya her gün tarihi kendisi kontrol eder:
   - Milli bayramlarda kutlama bandı + bayrak
   - 10 Kasım'da site siyah-gri olur, anma ekranı açılır
   - Dini bayramlar, belirli gün ve haftalar
   Deneme için adresin sonuna ?ozelgun=2026-11-10 yazın.
   ========================================================= */
(function () {
  "use strict";

  /* ---- Atatürk portresi: sitedeki ataturk.jpg (siyah zeminde beyaza çevrilir) */
  var ATATURK_FOTO = "ataturk.jpg";

  /* ---- Bantta "Etkinliklere göz at" düğmesinin gideceği genel sayfa */
  var ETKINLIK_LINKI = "belirli-gun-ve-haftalar-etkinlikleri.html";

  /* ---- Dini bayramlar (Diyanet takvimi). Her yıl Aralık'ta kontrol edilmeli.
     2027 tarihleri Diyanet takviminden doğrulandı; 2028 ve sonrası hesaplanmış tahmindir. */
  var DINI = [
    { ad: "Ramazan Bayramı", arife: "2027-03-08", bas: "2027-03-09", bit: "2027-03-11" },
    { ad: "Kurban Bayramı",  arife: "2027-05-15", bas: "2027-05-16", bit: "2027-05-19" },
    { ad: "Ramazan Bayramı", arife: "2028-02-25", bas: "2028-02-26", bit: "2028-02-28" },
    { ad: "Kurban Bayramı",  arife: "2028-05-04", bas: "2028-05-05", bit: "2028-05-08" },
    { ad: "Ramazan Bayramı", arife: "2029-02-13", bas: "2029-02-14", bit: "2029-02-16" },
    { ad: "Kurban Bayramı",  arife: "2029-04-23", bas: "2029-04-24", bit: "2029-04-27" },
    { ad: "Ramazan Bayramı", arife: "2030-02-03", bas: "2030-02-04", bit: "2030-02-06" },
    { ad: "Kurban Bayramı",  arife: "2030-04-12", bas: "2030-04-13", bit: "2030-04-16" }
  ];

  /* ---- Her yıl aynı tarihte gelen günler (AA-GG).
     tur: bayram | anma | yas | dini | gun | hafta   (öncelik bu sıraya göre) */
  var SABIT = [
    { bas: "10-04", bit: "10-04", tur: "gun", url: "4-ekim-hayvanlari-koruma-gunu-etkinlikleri.html", ad: "Hayvanları Koruma Günü", alt: "Sevgiyle bakılan her can, daha güzel bir dünya demek." },
    { bas: "10-28", bit: "10-28", tur: "bayram", url: "29-ekim-cumhuriyet-bayrami-etkinlikleri.html", ad: "Cumhuriyet Bayramı yarın!", alt: "Bayraklarımız hazır, coşkumuz hazır." },
    { bas: "10-29", bit: "10-29", tur: "bayram", url: "29-ekim-cumhuriyet-bayrami-etkinlikleri.html", ad: "Cumhuriyet Bayramımız kutlu olsun!", alt: "Cumhuriyetimizin " + "{CUMHURIYET}" + ". yılı kutlu olsun. Ne mutlu Türk'üm diyene!" },
    { bas: "10-30", bit: "11-04", tur: "hafta", ad: "Kızılay Haftası", alt: "Yardımlaşmak en güzel alışkanlıktır." },
    { bas: "11-10", bit: "11-10", tur: "yas", url: "10-kasim-ataturku-anma-etkinlikleri.html", ad: "Saygı ve özlemle anıyoruz", alt: "Ulu Önder Mustafa Kemal Atatürk'ü aramızdan ayrılışının {ANMA}. yılında saygı, sevgi ve özlemle anıyoruz." },
    { bas: "11-11", bit: "11-16", tur: "anma", url: "10-kasim-ataturku-anma-etkinlikleri.html", ad: "Atatürk Haftası", alt: "İzindeyiz Atam. Bıraktığın emanet bizde." },
    { bas: "11-20", bit: "11-20", tur: "gun", ad: "Dünya Çocuk Hakları Günü", alt: "Her çocuğun oyun, sağlık ve eğitim hakkı var." },
    { bas: "11-24", bit: "11-24", tur: "gun", url: "24-kasim-ogretmenler-gunu-etkinlikleri.html", ad: "Öğretmenler Günü kutlu olsun!", alt: "Başöğretmenimiz Atatürk'ün izinde, emeği geçen bütün öğretmenlerimize teşekkürler." },
    { bas: "12-03", bit: "12-03", tur: "gun", url: "3-aralik-dunya-engelliler-gunu-etkinlikleri.html", ad: "Dünya Engelliler Günü", alt: "Farklılıklarımız bizi zenginleştirir. Engelleri birlikte kaldırırız." },
    { bas: "12-12", bit: "12-18", tur: "hafta", url: "yerli-mali-haftasi-etkinlikleri.html", ad: "Tutum, Yatırım ve Türk Malları Haftası", alt: "Yerli malı yurdun malı, herkes onu kullanmalı." },
    { bas: "01-01", bit: "01-01", tur: "gun", ad: "Mutlu yıllar!", alt: "Yeni yılda sağlık, mutluluk ve bol kitaplı günler dileriz." },
    { bas: "03-08", bit: "03-14", tur: "hafta", ad: "Bilim ve Teknoloji Haftası", alt: "Merak et, sor, dene, bul." },
    { bas: "03-12", bit: "03-12", tur: "anma", url: "12-mart-istiklal-marsi-etkinlikleri.html", ad: "İstiklal Marşı'nın Kabulü ve Mehmet Akif Ersoy'u Anma Günü", alt: "Korkma, sönmez bu şafaklarda yüzen al sancak." },
    { bas: "03-18", bit: "03-18", tur: "anma", url: "18-mart-canakkale-zaferi-etkinlikleri.html", ad: "18 Mart Çanakkale Zaferi ve Şehitleri Anma Günü", alt: "Çanakkale geçilmez! Şehitlerimizi rahmet ve minnetle anıyoruz." },
    { bas: "03-21", bit: "03-26", tur: "hafta", ad: "Orman Haftası", alt: "Bir fidan dik, geleceğe gölge olsun." },
    { bas: "04-22", bit: "04-22", tur: "bayram", url: "23-nisan-etkinlikleri.html", ad: "23 Nisan yarın!", alt: "Çocuk Bayramı'na bir gün kaldı." },
    { bas: "04-23", bit: "04-23", tur: "bayram", url: "23-nisan-etkinlikleri.html", ad: "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı kutlu olsun!", alt: "Atatürk'ün bütün dünya çocuklarına armağanı. Bugün bayram, bugün sizin gününüz!" },
    { bas: "05-10", bit: "05-16", tur: "hafta", ad: "Engelliler Haftası", alt: "Engelleri sevgiyle, saygıyla ve birlikte aşarız." },
    { bas: "05-19", bit: "05-19", tur: "bayram", ad: "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı kutlu olsun!", alt: "Ey Türk gençliği! Birinci vazifen, Türk istiklalini, Türk Cumhuriyetini ilelebet muhafaza ve müdafaa etmektir." },
    { bas: "06-05", bit: "06-05", tur: "gun", ad: "Dünya Çevre Günü", alt: "Doğayı korumak, geleceğimizi korumaktır." },
    { bas: "07-15", bit: "07-15", tur: "anma", ad: "15 Temmuz Demokrasi ve Milli Birlik Günü", alt: "Şehitlerimizi rahmetle, gazilerimizi minnetle anıyoruz." },
    { bas: "08-30", bit: "08-30", tur: "bayram", ad: "30 Ağustos Zafer Bayramı kutlu olsun!", alt: "Ordular! İlk hedefiniz Akdenizdir. İleri!" },
    { bas: "09-19", bit: "09-19", tur: "gun", ad: "Gaziler Günü", alt: "Gazilerimize minnet ve saygıyla." }
  ];

  var ONCELIK = { yas: 0, bayram: 1, anma: 2, dini: 3, gun: 4, hafta: 5 };

  /* Deneme tarihi: sayfa adresi değişmeden önce hemen okunur */
  var DENEME = null;
  try { DENEME = new URLSearchParams(location.search).get("ozelgun"); } catch (e) {}

  /* ---------- Tarih: Türkiye saatine göre bugün ---------- */
  function bugunTR() {
    if (DENEME && /^\d{4}-\d{2}-\d{2}$/.test(DENEME)) return DENEME;
    try {
      var s = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    } catch (e) {}
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }

  function nPazar(yil, ay, n) { // ayın n. pazarı (ay: 1-12)
    var d = new Date(Date.UTC(yil, ay - 1, 1));
    var ilk = (7 - d.getUTCDay()) % 7 + 1;
    var g = ilk + (n - 1) * 7;
    return yil + "-" + ("0" + ay).slice(-2) + "-" + ("0" + g).slice(-2);
  }

  function bul(tarih) {
    var yil = +tarih.slice(0, 4), ag = tarih.slice(5);
    var sonuc = [];
    SABIT.forEach(function (g) {
      if (ag >= g.bas && ag <= g.bit) sonuc.push(g);
    });
    DINI.forEach(function (b) {
      if (tarih === b.arife) sonuc.push({ tur: "dini", url: /Ramazan/.test(b.ad) ? "ramazan-bayrami-etkinlikleri.html" : "", ad: b.ad + " yarın", alt: "Arife gününüz hayırlı olsun." });
      else if (tarih >= b.bas && tarih <= b.bit) sonuc.push({ tur: "dini", url: /Ramazan/.test(b.ad) ? "ramazan-bayrami-etkinlikleri.html" : "", ad: b.ad + "nız mübarek olsun!", alt: "Büyüklerimizin elinden öpelim, küslükleri bitirelim. Nice güzel bayramlara!" });
    });
    if (tarih === nPazar(yil, 5, 2)) sonuc.push({ tur: "gun", url: "anneler-gunu-etkinlikleri.html", ad: "Anneler Günü kutlu olsun!", alt: "Bütün annelerimizin emeğine sağlık." });
    if (tarih === nPazar(yil, 6, 3)) sonuc.push({ tur: "gun", ad: "Babalar Günü kutlu olsun!", alt: "Bütün babalarımızın emeğine sağlık." });
    sonuc.sort(function (a, b) { return ONCELIK[a.tur] - ONCELIK[b.tur]; });
    sonuc.forEach(function (g) {
      g.alt = (g.alt || "").replace("{CUMHURIYET}", yil - 1923).replace("{ANMA}", yil - 1938);
    });
    return sonuc;
  }

  /* ---------- Görsel parçalar ---------- */
  var BAYRAK = '<svg class="og-bayrak" viewBox="0 -30000 90000 60000" aria-hidden="true"><path fill="#e30a17" d="m0-30000h90000v60000H0z"/><path fill="#fff" d="m41750 0 13568-4408-8386 11541V-7133l8386 11541zm925 8021a15000 15000 0 1 1 0-16042 12000 12000 0 1 0 0 16042z"/></svg>';

  function stilEkle() {
    if (!document.querySelector('link[href*="family=Poppins"]')) {
      var l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap";
      document.head.appendChild(l);
    }
    var css = [
      "#og-bant{font-family:'Poppins',system-ui,sans-serif;position:relative;z-index:900;display:flex;align-items:center;gap:14px;padding:10px 46px 10px 16px;color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.18);overflow:hidden}",
      "#og-bant .og-yazi{flex:1;min-width:0}",
      "#og-bant .og-baslik{font-weight:700;font-size:17px;line-height:1.25;margin:0}",
      "#og-bant .og-alt{font-size:13.5px;line-height:1.35;opacity:.93;margin:2px 0 0}",
      "#og-bant .og-ek{font-size:12.5px;opacity:.85;margin:3px 0 0}",
      "#og-bant .og-dugme{flex:none;background:#fff;color:#222;font-weight:600;font-size:13px;text-decoration:none;padding:7px 12px;border-radius:999px;white-space:nowrap}",
      "#og-bant .og-kapat{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:30px;height:30px;border:0;border-radius:50%;background:rgba(255,255,255,.18);color:#fff;font-size:18px;line-height:30px;cursor:pointer;font-family:inherit}",
      "#og-bant .og-bayrak{flex:none;width:58px;height:auto;border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,.25);animation:ogDalga 2.6s ease-in-out infinite;transform-origin:left center}",
      "@keyframes ogDalga{0%,100%{transform:skewY(0)}50%{transform:skewY(-3deg) scaleX(.97)}}",
      "#og-bant.og-bayram{background:linear-gradient(100deg,#b5000f,#e30a17 55%,#c4000f)}",
      "#og-bant.og-anma{background:linear-gradient(100deg,#1d2430,#2f3a4a)}",
      "#og-bant.og-yas{background:#0d0d0d;border-bottom:1px solid #333}",
      "#og-bant.og-dini{background:linear-gradient(100deg,#0f6b5a,#1a8c74)}",
      "#og-bant.og-gun{background:linear-gradient(100deg,#2b5aa8,#3c74c8)}",
      "#og-bant.og-hafta{background:linear-gradient(100deg,#4b5563,#64748b)}",
      "#og-bant .og-sonsuz{flex:none;font-size:34px;line-height:1;font-weight:400;opacity:.9}",
      "#og-bant .og-foto{flex:none;width:58px;height:46px;object-fit:contain;filter:invert(1) grayscale(1);mix-blend-mode:screen}",
      ".og-konfeti{position:fixed;top:-12px;width:8px;height:12px;z-index:9998;pointer-events:none;animation:ogDus linear forwards}",
      "@keyframes ogDus{to{transform:translateY(105vh) rotate(540deg);opacity:.9}}",
      /* 10 Kasım */
      "html.og-yas-gunu{filter:grayscale(1)}",
      "html.og-yas-gunu body{background:#111 !important}",
      "#og-perde{font-family:'Poppins',system-ui,sans-serif;position:fixed;inset:0;z-index:9999;background:#000;color:#eee;display:flex;align-items:center;justify-content:center;padding:24px 16px;overflow:auto;opacity:0;transition:opacity 1.2s}",
      "#og-perde.og-acik{opacity:1}",
      "#og-perde .og-kutu{max-width:520px;width:100%;text-align:center}",
      "#og-perde img{display:block;margin:0 auto;width:min(330px,82vw);height:auto;filter:invert(1);mix-blend-mode:screen}",
      "#og-perde .og-buyuk-sonsuz{font-size:72px;line-height:1;margin:18px 0 6px;font-weight:300;color:#fff;letter-spacing:2px}",
      "#og-perde .og-yil{font-size:15px;letter-spacing:4px;color:#aaa;margin:0}",
      "#og-perde h1{font-size:26px;font-weight:700;margin:14px 0 8px;color:#fff;line-height:1.3}",
      "#og-perde p.og-metin{font-size:15px;line-height:1.6;color:#cfcfcf;margin:0 0 6px}",
      "#og-perde .og-izinde{font-size:20px;font-weight:600;color:#fff;margin:14px 0 4px}",
      "#og-perde .og-saat{font-size:13px;color:#999;margin:4px 0 22px}",
      "#og-perde button{font-family:inherit;background:transparent;color:#ddd;border:1px solid #555;border-radius:999px;padding:10px 22px;font-size:14px;cursor:pointer}",
      "#og-perde button:hover{border-color:#999;color:#fff}",
      "@media (max-width:560px){#og-bant{gap:10px;padding:9px 42px 9px 12px}#og-bant .og-baslik{font-size:15px}#og-bant .og-alt{font-size:12.5px}#og-bant .og-bayrak{width:44px}#og-bant .og-dugme{display:none}#og-perde h1{font-size:22px}}",
      "@media print{#og-bant,#og-perde,.og-konfeti{display:none !important}html.og-yas-gunu{filter:none !important}}"
    ].join("\n");
    var s = document.createElement("style");
    s.id = "og-stil";
    s.textContent = css;
    document.head.appendChild(s);
  }

  function depoOku(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function depoYaz(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function konfeti() {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var renk = ["#e30a17", "#ffffff", "#e30a17", "#ffd400"];
    for (var i = 0; i < 46; i++) {
      var c = document.createElement("div");
      c.className = "og-konfeti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = renk[i % renk.length];
      c.style.boxShadow = "0 0 0 1px rgba(0,0,0,.06)";
      c.style.animationDuration = 2.4 + Math.random() * 2 + "s";
      c.style.animationDelay = Math.random() * 1.2 + "s";
      document.body.appendChild(c);
      (function (el) { setTimeout(function () { el.remove(); }, 5200); })(c);
    }
  }

  function bantKur(liste, tarih) {
    var g = liste[0];
    var kapatAnahtar = "og-kapat-" + tarih + "-" + g.ad;
    if (g.tur !== "yas" && depoOku(kapatAnahtar)) return;

    var bant = document.createElement("div");
    bant.id = "og-bant";
    bant.className = "og-" + g.tur;
    bant.setAttribute("role", "status");

    var sol = "";
    if (g.tur === "bayram") sol = BAYRAK;
    else if (g.tur === "yas") sol = '<span class="og-sonsuz">∞</span>';
    else if (g.tur === "anma" && /Atatürk/.test(g.ad)) sol = '<img class="og-foto" alt="Mustafa Kemal Atatürk" src="' + ATATURK_FOTO + '" onerror="this.remove()">';
    else if (g.tur === "anma") sol = BAYRAK;

    var ek = liste[1] ? '<p class="og-ek">Ayrıca: ' + liste[1].ad.replace(/!$/, "") + "</p>" : "";
    var hedef = g.url || ETKINLIK_LINKI;
    var dugme = hedef ? '<a class="og-dugme" href="' + hedef + '">' + (g.tur === "yas" || g.tur === "anma" ? "Anma etkinlikleri" : "Etkinliklere göz at") + "</a>" : "";

    bant.innerHTML = sol +
      '<div class="og-yazi"><p class="og-baslik">' + g.ad + '</p><p class="og-alt">' + g.alt + "</p>" + ek + "</div>" +
      dugme +
      (g.tur === "yas" ? "" : '<button class="og-kapat" type="button" aria-label="Kapat">×</button>');

    document.body.insertBefore(bant, document.body.firstChild);

    var k = bant.querySelector(".og-kapat");
    if (k) k.addEventListener("click", function () { bant.remove(); depoYaz(kapatAnahtar, "1"); });

    if (g.tur === "bayram" && /kutlu olsun/.test(g.ad) && !depoOku("og-konfeti-" + tarih)) {
      depoYaz("og-konfeti-" + tarih, "1");
      setTimeout(konfeti, 400);
    }
  }

  function yasGunu(tarih, g) {
    document.documentElement.classList.add("og-yas-gunu");
    var anahtar = "og-perde-" + tarih;
    if (depoOku(anahtar)) return;

    var perde = document.createElement("div");
    perde.id = "og-perde";
    perde.setAttribute("role", "dialog");
    perde.setAttribute("aria-label", "10 Kasım Atatürk'ü Anma");
    var yil = +tarih.slice(0, 4);
    perde.innerHTML =
      '<div class="og-kutu">' +
        '<img alt="Mustafa Kemal Atatürk" src="' + ATATURK_FOTO + '" onerror="this.remove()">' +
        '<div class="og-buyuk-sonsuz">∞</div>' +
        '<p class="og-yil">1881 – 1938</p>' +
        "<h1>Saygı ve özlemle anıyoruz</h1>" +
        '<p class="og-metin">Cumhuriyetimizin kurucusu, Başöğretmenimiz Gazi Mustafa Kemal Atatürk\'ü aramızdan ayrılışının ' + (yil - 1938) + '. yılında saygı, sevgi ve özlemle anıyoruz.</p>' +
        '<p class="og-izinde">İzindeyiz Atam.</p>' +
        '<p class="og-saat">Saat 09.05\'te saygı duruşundayız.</p>' +
        '<button type="button">Siteye geç</button>' +
        '<p style="margin:16px 0 0"><a href="10-kasim-ataturku-anma-etkinlikleri.html" style="color:#bbb;font-size:13px">10 Kasım anma etkinlikleri</a></p>' +
      "</div>";
    document.body.appendChild(perde);
    requestAnimationFrame(function () { perde.classList.add("og-acik"); });
    perde.querySelector("button").addEventListener("click", function () {
      depoYaz(anahtar, "1");
      perde.classList.remove("og-acik");
      setTimeout(function () { perde.remove(); }, 900);
    });
  }

  function basla() {
    var tarih = bugunTR();
    var liste = bul(tarih);
    if (!liste.length) return;
    stilEkle();
    if (liste[0].tur === "yas") yasGunu(tarih, liste[0]);
    bantKur(liste, tarih);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", basla);
  else basla();
})();
