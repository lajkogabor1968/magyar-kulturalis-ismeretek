# Magyar kulturális ismeretek

Önálló, statikus magyar–orosz vizsgafelkészítő. Kiszolgálás a projekt gyökeréből, például a `python -m http.server` paranccsal. A tanulói állapotot a böngésző helyi tárhelye őrzi.

## Beillesztés a Magyar–orosz Tanműhelybe

A működő alkalmazás beilleszthető hivatkozással vagy keretben. Példa a teljes kurzus beágyazására:

```html
<iframe src="https://lajkogabor1968.github.io/magyar-kulturalis-ismeretek/"
        title="Magyar kulturális ismeretek" width="100%" height="750" loading="lazy"></iframe>
```

A fejezetek közvetlenül címezhetők, például `#/tema/allam/read`, `#/tema/jogok/words`, `#/tema/europa/test`. Az összesítő útvonala `#/final`. A felület és a tartalom külön fájlokban található. A `course.json` tartalmazza az 1-es adatformátum-verziót, a stabil fejezetazonosítókat, a magyar–orosz mondatpárokat, a szószedeteket és a forrásoldalakat. A `cards.json` mezői: id, chapter, hu, ru, answer és translation. A feleletválasztós feladatok két szerkesztett téves választ is tartalmaznak a wrong mezőben. Egy későbbi natív integráció ezeket közvetlenül is beolvashatja.

## Tartalmi karbantartás

A 2026. november 24-i változat a BFKH 2026 őszén közzétett segédanyagához igazodik. A közhivatalok, tisztségviselők és minisztériumok változásakor ellenőrizni kell az államszervezeti leckét és a kapcsolódó kártyákat. A források és a fénykép licence a felületen a Források nézetben érhetők el.

A fejezetteszt 8 kérdést sorsol, az összesítő mindegyik témából kettőt. Ezek gyakorlópontok. A hivatalos vizsga saját pontozását a vizsgatájékoztató határozza meg.
