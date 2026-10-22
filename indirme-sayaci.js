/* Dijital Öğretmen – indirme ve yazdırma sayacı
   Word / PDF indirme ve Yazdır düğmelerine basılınca GoatCounter'a
   "olay" olarak kaydeder. İstatistiklerde "indir: sayfa (Word)" gibi görünür. */
(function () {
  var KELIMELER = { indir: 1, word: 1, pdf: 1, docx: 1, yazdır: 1, yazdir: 1 };
  var son = {};

  function sayfaAdi() {
    var p = location.pathname.split('/').pop() || 'index.html';
    try { p = decodeURIComponent(p); } catch (e) {}
    return p.replace(/\.html?$/i, '') || 'index';
  }

  function gonder(yol, baslik, deneme) {
    var simdi = Date.now();
    if (son[yol] && simdi - son[yol] < 1500) return;
    if (!(window.goatcounter && window.goatcounter.count)) {
      if ((deneme || 0) < 5) setTimeout(function () { gonder(yol, baslik, (deneme || 0) + 1); }, 1000);
      return;
    }
    son[yol] = simdi;
    try { window.goatcounter.count({ path: yol, title: baslik, event: true }); } catch (e) {}
  }

  function tur(el) {
    var href = (el.getAttribute && el.getAttribute('href')) || '';
    var dosya = href.split('?')[0].split('#')[0];
    if (/\.docx?$/i.test(dosya)) return { tur: 'Word', dosya: dosya };
    if (/\.pdf$/i.test(dosya)) return { tur: 'PDF', dosya: dosya };
    var yazi = (el.textContent || '') + ' ' + (el.getAttribute('onclick') || '') + ' ' + (el.getAttribute('download') || '');
    yazi = yazi.toLocaleLowerCase('tr');
    var parcalar = yazi.split(/[^a-zçğıöşü]+/);
    var eslesti = el.hasAttribute && el.hasAttribute('download');
    for (var i = 0; i < parcalar.length && !eslesti; i++) if (KELIMELER[parcalar[i]]) eslesti = true;
    if (!eslesti && /print\(|wordindir|downloadword|indir\(/i.test(yazi)) eslesti = true;
    if (!eslesti) return null;
    if (/word|docx|wordindir|downloadword/.test(yazi)) return { tur: 'Word' };
    if (/yazd[ıi]r|print/.test(yazi) && !/pdf indir|pdf olarak indir/.test(yazi)) return { tur: 'Yazdır' };
    if (/pdf/.test(yazi)) return { tur: 'PDF' };
    return { tur: 'İndirme' };
  }

  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a,button,[onclick]') : null;
    if (!el) return;
    var t = tur(el);
    if (!t) return;
    var ad = t.dosya ? t.dosya.split('/').pop() : sayfaAdi();
    try { ad = decodeURIComponent(ad); } catch (x) {}
    gonder('indir: ' + ad.replace(/\.(html?|pdf|docx?)$/i, '') + ' (' + t.tur + ')',
           (document.title || ad) + ' – ' + t.tur);
  }, true);
})();
