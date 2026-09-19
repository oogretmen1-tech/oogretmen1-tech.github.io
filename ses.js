/* =========================================================
   Dijital Öğretmen — Ortak Sesli Okuma Motoru (ses.js)
   ---------------------------------------------------------
   Amaç: Sayfalardaki sesli okumanın her cihazda DOĞRU
   Türkçe sesle çalışması.

   Yaptıkları:
   1) speechSynthesis.speak çağrılarını yakalar; metnin diline
      (tr-TR / en-US) uygun EN İYİ sesi otomatik seçer.
      -> Böylece İngilizce ses Türkçe metni okumaya kalkmaz.
   2) Ses listesi geç yüklenen cihazlarda (Android tabletler)
      sesler gelene kadar bekler.
   3) Uzun metinleri cümlelere böler (Android 15 sn sonra sesi
      kesiyordu, artık kesilmez).
   4) Chrome'un 15 sn'de duraklatma hatasına karşı canlı tutar.
   5) Cihazda Türkçe ses paketi hiç yoksa, bozuk telaffuzla
      okumak yerine kullanıcıya nasıl kuracağını anlatan
      kibar bir uyarı gösterir.

   Kullanımı: sayfanın sonuna  <script src="ses.js"></script>
   Sayfadaki mevcut kodların hiçbirini değiştirmeye gerek yok.
   ========================================================= */
(function () {
  "use strict";
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (window.__dtSesKuruldu) return;
  window.__dtSesKuruldu = true;

  var synth = window.speechSynthesis;
  var orijinalSpeak = synth.speak.bind(synth);
  var orijinalCancel = synth.cancel.bind(synth);

  var sesler = [];
  var kuyruk = [];
  var calisiyor = false;
  var canliTut = null;
  var uyariGosterildi = false;

  /* ---------- 1) Ses listesini yükle ---------- */
  function sesleriYukle() {
    try {
      var v = synth.getVoices();
      if (v && v.length) sesler = v;
    } catch (e) {}
    return sesler.length > 0;
  }
  sesleriYukle();
  try {
    synth.addEventListener("voiceschanged", sesleriYukle);
  } catch (e) {
    synth.onvoiceschanged = sesleriYukle;
  }
  // Android'de liste bazen gecikir: kısa süre yoklamaya devam et
  var deneme = 0;
  var yoklama = setInterval(function () {
    if (sesleriYukle() || ++deneme > 40) clearInterval(yoklama);
  }, 250);

  /* ---------- 2) En iyi sesi seç ---------- */
  function dilKodu(lang) {
    return String(lang || "tr-TR").toLowerCase().replace("_", "-").slice(0, 2);
  }

  function puanla(v) {
    var ad = String(v.name || "").toLowerCase();
    var p = 0;
    if (ad.indexOf("google") > -1) p += 40;      // en doğal telaffuz
    if (ad.indexOf("microsoft") > -1) p += 30;
    if (/emel|yelda|tolga|filiz|ahmet|seda/.test(ad)) p += 20; // bilinen TR sesler
    if (ad.indexOf("enhanced") > -1 || ad.indexOf("premium") > -1 || ad.indexOf("neural") > -1) p += 25;
    if (ad.indexOf("compact") > -1 || ad.indexOf("espeak") > -1) p -= 40; // robotik sesler
    if (v.default) p += 5;
    return p;
  }

  function sesBul(lang) {
    var kod = dilKodu(lang);
    var adaylar = sesler.filter(function (v) {
      return dilKodu(v.lang) === kod;
    });
    if (!adaylar.length) {
      // lang alanı boş ama adında dil geçen sesler (bazı Android motorları)
      var anahtar = kod === "tr" ? "turk" : kod === "en" ? "english" : kod;
      adaylar = sesler.filter(function (v) {
        return String(v.name || "").toLowerCase().indexOf(anahtar) > -1;
      });
    }
    if (!adaylar.length) return null;
    adaylar.sort(function (a, b) { return puanla(b) - puanla(a); });
    return adaylar[0];
  }

  /* ---------- 3) Türkçe ses yoksa uyarı ---------- */
  function uyariGoster() {
    if (uyariGosterildi) return;
    uyariGosterildi = true;
    var kutu = document.createElement("div");
    kutu.setAttribute("role", "alert");
    kutu.style.cssText =
      "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);" +
      "z-index:99999;max-width:min(560px,92vw);box-sizing:border-box;" +
      "background:#1f2d3d;color:#fff;padding:16px 18px;border-radius:14px;" +
      "box-shadow:0 10px 30px rgba(0,0,0,.35);font:15px/1.5 system-ui,Segoe UI,Roboto,Arial,sans-serif;";
    kutu.innerHTML =
      '<div style="font-weight:700;margin-bottom:6px;">Türkçe ses paketi bulunamadı</div>' +
      '<div style="opacity:.92;">Bu cihazda Türkçe konuşan bir ses yüklü olmadığı için sesli okuma ' +
      "düzgün çalışmaz. Kurmak için: <b>Ayarlar &rsaquo; Erişilebilirlik &rsaquo; " +
      "Metin okuma (TTS) &rsaquo; Google Konuşma Hizmetleri &rsaquo; Dil yükle &rsaquo; Türkçe</b>." +
      "</div>" +
      '<button type="button" style="margin-top:10px;background:#3fa9f5;border:0;color:#fff;' +
      'padding:8px 16px;border-radius:9px;font-weight:600;cursor:pointer;">Tamam</button>';
    kutu.querySelector("button").onclick = function () { kutu.remove(); };
    (document.body || document.documentElement).appendChild(kutu);
    setTimeout(function () { if (kutu.parentNode) kutu.remove(); }, 15000);
  }

  /* ---------- 4) Uzun metni cümlelere böl ---------- */
  function parcala(metin) {
    var t = String(metin == null ? "" : metin).replace(/\s+/g, " ").trim();
    if (!t) return [];
    if (t.length <= 170) return [t];
    var cumleler = t.match(/[^.!?…:;]+[.!?…:;]*\s*/g) || [t];
    var parcalar = [];
    var tampon = "";
    cumleler.forEach(function (c) {
      c = c.trim();
      if (!c) return;
      while (c.length > 170) {                  // çok uzun cümleyi kelimeden böl
        var kes = c.lastIndexOf(" ", 170);
        if (kes < 60) kes = 170;
        if (tampon) { parcalar.push(tampon.trim()); tampon = ""; }
        parcalar.push(c.slice(0, kes).trim());
        c = c.slice(kes).trim();
      }
      if ((tampon + " " + c).trim().length > 170) {
        if (tampon) parcalar.push(tampon.trim());
        tampon = c;
      } else {
        tampon = (tampon + " " + c).trim();
      }
    });
    if (tampon) parcalar.push(tampon.trim());
    return parcalar.filter(Boolean);
  }

  /* ---------- 5) Kuyruk yönetimi ---------- */
  function canliTutBaslat() {
    if (canliTut) return;
    canliTut = setInterval(function () {
      if (!synth.speaking) return;
      try { synth.pause(); synth.resume(); } catch (e) {}
    }, 9000);
  }
  function canliTutDurdur() {
    if (canliTut) { clearInterval(canliTut); canliTut = null; }
  }

  function siradakiniSoyle() {
    if (!kuyruk.length) { calisiyor = false; canliTutDurdur(); return; }
    calisiyor = true;
    var is = kuyruk.shift();
    orijinalSpeak(is);
  }

  function seslendir(metin, ayar, olaylar) {
    var parcalar = parcala(metin);
    if (!parcalar.length) return;
    // Sayfa zaten bir ses seçtiyse ona saygı duy, yoksa en iyisini bul
    var ses = ayar.ses || sesBul(ayar.lang);

    if (!ses && sesler.length && dilKodu(ayar.lang) === "tr") {
      uyariGoster();   // yanlış dilde bozuk telaffuzla okumaktansa uyar
      return;
    }

    parcalar.forEach(function (p, i) {
      var u = new SpeechSynthesisUtterance(p);
      u.lang = ayar.lang || "tr-TR";
      if (ses) { u.voice = ses; u.lang = ses.lang || u.lang; }
      if (typeof ayar.rate === "number" && isFinite(ayar.rate)) u.rate = ayar.rate;
      if (typeof ayar.pitch === "number" && isFinite(ayar.pitch)) u.pitch = ayar.pitch;
      if (typeof ayar.volume === "number" && isFinite(ayar.volume)) u.volume = ayar.volume;
      if (i === 0 && olaylar.onstart) u.onstart = olaylar.onstart;
      u.onend = function () {
        if (i === parcalar.length - 1 && olaylar.onend) {
          try { olaylar.onend.call(u, { type: "end" }); } catch (e) {}
        }
        setTimeout(siradakiniSoyle, 0);
      };
      u.onerror = function (ev) {
        if (i === parcalar.length - 1 && olaylar.onerror) {
          try { olaylar.onerror.call(u, ev); } catch (e) {}
        }
        setTimeout(siradakiniSoyle, 0);
      };
      kuyruk.push(u);
    });

    canliTutBaslat();
    if (!calisiyor) siradakiniSoyle();
  }

  /* ---------- 6) speak() ve cancel() devralınıyor ---------- */
  synth.speak = function (utterance) {
    try {
      if (!utterance || typeof utterance.text !== "string") {
        return orijinalSpeak(utterance);
      }
      var ayar = {
        ses: utterance.voice || null,
        lang: (utterance.voice && utterance.voice.lang) || utterance.lang || document.documentElement.lang || "tr-TR",
        rate: utterance.rate,
        pitch: utterance.pitch,
        volume: utterance.volume
      };
      var olaylar = {
        onstart: utterance.onstart,
        onend: utterance.onend,
        onerror: utterance.onerror
      };

      if (!sesler.length) {
        // Sesler henüz gelmediyse kısa bir süre bekleyip tekrar dene
        var bekle = 0;
        var zaman = setInterval(function () {
          if (sesleriYukle() || ++bekle > 12) {
            clearInterval(zaman);
            seslendir(utterance.text, ayar, olaylar);
          }
        }, 200);
        return;
      }
      seslendir(utterance.text, ayar, olaylar);
    } catch (e) {
      try { orijinalSpeak(utterance); } catch (e2) {}
    }
  };

  synth.cancel = function () {
    kuyruk.length = 0;
    calisiyor = false;
    canliTutDurdur();
    return orijinalCancel();
  };

  /* Sayfadan çıkarken sesi kes */
  window.addEventListener("beforeunload", function () {
    try { synth.cancel(); } catch (e) {}
  });

  /* Dışarıdan kullanmak isteyenler için küçük yardımcı */
  window.DTSes = {
    konus: function (metin, dil) {
      var u = new SpeechSynthesisUtterance(metin);
      u.lang = dil || "tr-TR";
      synth.speak(u);
    },
    dur: function () { synth.cancel(); },
    sesler: function () { return sesler.slice(); },
    turkceVar: function () { return !!sesBul("tr-TR"); }
  };
})();
