/* ============================================================
   Dijital Öğretmen — Uygulama içi tarayıcı uyarısı (tarayici.js)
   Instagram, Facebook, TikTok, Pinterest gibi uygulamaların içinde
   açılan sayfalarda dosya indirme çalışmaz. Bu dosya o durumu
   tanır ve öğretmeni tek dokunuşla gerçek tarayıcıya yönlendirir:
   · Android: "Tarayıcıda Aç" düğmesi sayfayı Chrome / varsayılan
     tarayıcıda açar; PDF düğmeleri dosyayı doğrudan tarayıcıda açar.
   · iPhone / iPad: "Safari'de aç" adımı resimli anlatılır, bağlantı
     tek dokunuşla kopyalanır.
   Normal tarayıcılarda (Chrome, Safari, Samsung İnternet, Firefox,
   Edge) hiçbir şey göstermez, hiçbir şeyi değiştirmez.
   ============================================================ */
(function () {
  "use strict";
  if (window.DO_TARAYICI) return;
  var ua = navigator.userAgent || "";
  var uygulamaIci = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FB4A|Line\/|musical_ly|Bytedance|TikTok|Twitter|Snapchat|Pinterest|LinkedInApp|GSA\/|; wv\)/i.test(ua);
  var android = /Android/i.test(ua);
  var ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
  var uygulama = /Instagram/i.test(ua) ? "Instagram" : /FBAN|FBAV|FB_IAB|FBIOS|FB4A/i.test(ua) ? "Facebook" :
                 /musical_ly|Bytedance|TikTok/i.test(ua) ? "TikTok" : /Pinterest/i.test(ua) ? "Pinterest" : "bu uygulama";

  function tamAdres(u) { try { return new URL(u || location.href, location.href).href; } catch (e) { return location.href; } }
  function intentAdres(u) {
    var a = new URL(tamAdres(u));
    return "intent://" + a.host + a.pathname + a.search + a.hash +
      "#Intent;scheme=" + a.protocol.replace(":", "") + ";action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;" +
      "S.browser_fallback_url=" + encodeURIComponent(a.href) + ";end";
  }
  function tarayicidaAc(u) { if (android) { location.href = intentAdres(u); return true; } return false; }

  function stil() {
    if (document.getElementById("do-tr-stil")) return;
    var s = document.createElement("style"); s.id = "do-tr-stil";
    s.textContent =
      "#do-tr-serit{position:sticky;top:0;z-index:2147483200;background:#fff7e0;border-bottom:3px solid #f2b705;padding:10px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font:600 14px/1.45 Poppins,Arial,sans-serif;color:#3d2f00}" +
      "#do-tr-serit b{color:#b45309}#do-tr-serit .dtr-bosluk{flex:1 1 200px}" +
      "#do-tr-serit button,#do-tr-kutu button{border:0;border-radius:999px;padding:9px 16px;font:800 14px Poppins,Arial,sans-serif;cursor:pointer}" +
      ".dtr-ac{background:#16a34a;color:#fff}.dtr-kopya{background:#1f5fb0;color:#fff}.dtr-kapat{background:#e5e7eb;color:#1f2937}" +
      "#do-tr-perde{position:fixed;inset:0;z-index:2147483300;background:rgba(15,23,42,.6);display:none;align-items:center;justify-content:center;padding:16px}" +
      "#do-tr-perde.acik{display:flex}" +
      "#do-tr-kutu{background:#fff;border-radius:18px;max-width:420px;width:100%;padding:20px 20px 16px;font:500 15px/1.55 Poppins,Arial,sans-serif;color:#1f2937;box-shadow:0 20px 50px rgba(0,0,0,.35)}" +
      "#do-tr-kutu h3{margin:0 0 8px;font-size:18px;color:#16345C}#do-tr-kutu ol{margin:8px 0 12px;padding-left:22px}#do-tr-kutu li{margin:4px 0}" +
      "#do-tr-kutu .dtr-dg{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}" +
      "#do-tr-kutu .dtr-nokta{display:inline-block;background:#f1f5f9;border-radius:6px;padding:0 6px;font-weight:800}";
    (document.head || document.documentElement).appendChild(s);
  }

  function kopyala(btn) {
    var u = location.href.split("?")[0];
    var bitti = function () { btn.textContent = "✓ Kopyalandı"; setTimeout(function () { btn.textContent = "🔗 Bağlantıyı kopyala"; }, 2500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(bitti, function () { prompt("Bağlantıyı kopyalayın:", u); });
    else prompt("Bağlantıyı kopyalayın:", u);
  }

  function anlatim() {
    if (android) return "<p>Dosyalar " + uygulama + " içinde inmiyor. Aşağıdaki yeşil düğmeye dokunun; sayfa telefonunuzun tarayıcısında (Chrome) açılır ve indirme orada çalışır.</p>" +
      "<p style='font-size:13px;color:#64748b'>Düğme çalışmazsa: sağ üstteki <span class='dtr-nokta'>⋮</span> menüsüne dokunup <b>“Tarayıcıda aç”</b> seçin.</p>";
    return "<p>Dosyalar " + uygulama + " içinde inmiyor. Sayfayı Safari'de açmanız yeterli:</p><ol>" +
      "<li>Ekranın sağ üstündeki <span class='dtr-nokta'>•••</span> düğmesine dokunun.</li>" +
      "<li><b>“Dış tarayıcıda aç”</b> ya da <b>“Safari'de aç”</b> seçin.</li>" +
      "<li>Açılan sayfada indirme düğmesine yeniden basın.</li></ol>" +
      "<p style='font-size:13px;color:#64748b'>Menüyü bulamazsanız bağlantıyı kopyalayıp Safari'ye yapıştırın.</p>";
  }

  function kutuAc(dosyaAdresi) {
    stil();
    var p = document.getElementById("do-tr-perde");
    if (!p) {
      p = document.createElement("div"); p.id = "do-tr-perde";
      p.innerHTML = "<div id='do-tr-kutu'><h3>📥 İndirmek için tarayıcıda açın</h3><div class='dtr-metin'></div><div class='dtr-dg'></div></div>";
      p.addEventListener("click", function (e) { if (e.target === p) p.classList.remove("acik"); });
      document.body.appendChild(p);
    }
    p.querySelector(".dtr-metin").innerHTML = anlatim();
    var dg = p.querySelector(".dtr-dg"); dg.innerHTML = "";
    if (android) {
      var b = document.createElement("button"); b.className = "dtr-ac"; b.textContent = "🌐 Tarayıcıda Aç";
      b.onclick = function () { tarayicidaAc(dosyaAdresi || location.href); }; dg.appendChild(b);
    } else {
      var k = document.createElement("button"); k.className = "dtr-kopya"; k.textContent = "🔗 Bağlantıyı kopyala";
      k.onclick = function () { kopyala(k); }; dg.appendChild(k);
    }
    var c = document.createElement("button"); c.className = "dtr-kapat"; c.textContent = "Kapat";
    c.onclick = function () { p.classList.remove("acik"); }; dg.appendChild(c);
    p.classList.add("acik");
  }

  function seritEkle() {
    stil();
    if (document.getElementById("do-tr-serit")) return;
    var s = document.createElement("div"); s.id = "do-tr-serit";
    s.innerHTML = "<span class='dtr-bosluk'>📥 Sayfa <b>" + uygulama + "</b> içinde açıldı. Dosyaları indirmek için sayfayı tarayıcıda açın.</span>";
    var b = document.createElement("button");
    if (android) { b.className = "dtr-ac"; b.textContent = "🌐 Tarayıcıda Aç"; b.onclick = function () { tarayicidaAc(location.href); }; }
    else { b.className = "dtr-kopya"; b.textContent = "Nasıl?"; b.onclick = function () { kutuAc(); }; }
    var x = document.createElement("button"); x.className = "dtr-kapat"; x.textContent = "✕"; x.setAttribute("aria-label", "Kapat");
    x.onclick = function () { s.remove(); };
    s.appendChild(b); s.appendChild(x);
    document.body.insertBefore(s, document.body.firstChild);
  }

  window.DO_TARAYICI = {
    uygulamaIci: uygulamaIci,
    /* İndirme denemesinden önce çağrılır. true dönerse indirme yerine yönlendirme yapılmıştır. */
    engel: function (dosyaAdresi) {
      if (!uygulamaIci) return false;
      if (dosyaAdresi && android) { tarayicidaAc(dosyaAdresi); return true; }  // hazır PDF/Word: doğrudan tarayıcıda açılır
      kutuAc(dosyaAdresi);
      return true;
    },
    kutuAc: kutuAc
  };
  if (uygulamaIci) {
    if (document.body) seritEkle(); else document.addEventListener("DOMContentLoaded", seritEkle);
  }
})();
