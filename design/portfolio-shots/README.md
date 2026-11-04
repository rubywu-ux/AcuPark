# Portfolio screenshots

`shoot-frame.mjs` captures the live app for the portfolio's iPhone frames (ruby-wu-site `.proto__device`):
390×890 viewport (the frame's screen proportions), 2× retina, dark mode, in the app's
embedded mode (`html[data-embed]`: phone-style safe areas and a drawn home indicator, see globals.css) with the top
inset set to 66px so content starts at 7.4% of the screen, clear of the Dynamic Island the frame draws (it ends at 5.3%). It freezes the launch screen at the
Dubs moment for `splash.png`, then shoots home, scan, reservation, map, navigation, payment, map-all (every lot's count), map-filters (EV Charging on) and pay-ahead (the Pay ahead sheet on Home).

```bash
node shoot-frame.mjs ./out dark          # all seven screens
node shoot-frame.mjs ./out light home,map # the light-mode pair the hero mockup uses
```

Needs Google Chrome installed. `BASE=http://127.0.0.1:3000 node shoot-frame.mjs …` shoots the local dev server instead of the live site. Convert the PNGs to webp into `ruby-wu-site/assets/hq/acupark/`, then
re-screenshot the hero mockup (`ruby-wu-site/_figma-staging/acupark-hero.html`).
