# Photography

## Gallery — `assets/gallery/`

Six photographs sourced from **Pexels**. The Pexels License permits commercial
use and modification, and does not require attribution. They are credited here
anyway so their origin is on record.

| File | Pexels photo ID | Used for |
|---|---|---|
| ../plate.jpg      | 37260671 | Hero plate — assorted board |
| ../medallion.jpg  | 858501   | About medallion — the morph target |
| 01-nigiri.jpg  | 17894270 | A board, straight off the sheet |
| 02-maki.jpg    | 11064616 | Maki, straight off the sheet |
| 03-sashimi.jpg | 36292349 | Sashimi — on the deluxe sheet |
| 04-tempura.jpg | 8953714  | Tempura from the kitchen |
| 05-udon.jpg    | 31393431 | Udon and noodle soup |
| 06-boat.jpg    | 10562410 | Party boats for the table |

Each was processed before use: EXIF auto-orient, gray-world white balance
(skipped on high-key studio shots, where it introduces a cast rather than
removing one), black/white point set from the histogram, edge-energy crop to
3:4, resize to 900×1200 Lanczos, mild saturation and contrast, unsharp mask,
progressive JPEG at quality 82. The script is `scratchpad/process.py` — see the
README if you want to re-run it over your own photographs.

## ⚠ Attribution IS required for five roll photographs

The Pexels images elsewhere need no credit. Five of the special-roll photos came
from **Openverse** under Creative Commons licences that *do* require visible
credit. They are listed below and are also credited in the page footer. If you
would rather not carry credits, replace these five with your own photographs and
delete the footer credit line.

| File | Licence | Creator | Used for |
|---|---|---|---|
| winchester.jpg     | CC BY 2.0 | elsie.hui | Carousel — Winchester |
| sakura-ichiban.jpg | CC BY 2.0 | elsie.hui | Carousel — Sakura Ichiban |
| volcano.jpg        | CC BY 2.0 | rick | Carousel — Volcano |
| house-dragon.jpg   | CC BY 2.0 | Joe Bielawa | Carousel — House Dragon |
| snow-mountain.jpg  | CC BY 2.0 | ray_explores | Carousel — Snow Mountain |
| tokyo.jpg          | CC BY 2.0 | Clotee Pridgen Allochuku | (spare) |
| christmas.jpg, rocknroll.jpg | Pexels | — | (spare) |

A NoDerivatives-licensed candidate was discarded: this pipeline crops and
resizes, which that licence forbids.

## Special rolls — `assets/rolls/`

| File | Pexels photo ID | Card |
|---|---|---|
| r3.jpg | 17894264 | Winchester |
| r1.jpg | 11064614 | Sakura Ichiban |
| r4.jpg | 37260671 | Volcano (right-hand crop of the hero board) |

⚠ These are stock rolls, **not** photographs of Sakura's actual Winchester,
Sakura Ichiban or Volcano rolls. A named dish implies a specific thing, so
these three are the first images worth replacing with real ones.

## The sushi bar window — `assets/craft/`

| File | Pexels photo ID | Kanji |
|---|---|---|
| c1.jpg | 4725624  | 鮨 A real sushi bar |
| c2.jpg | 24604655 | 菜 Room for everyone |
| c3.jpg | 29962487 | 皿 Your pace, your table |

## From the restaurant — `assets/`

`logo.jpg` and `sushi-platter.jpg` were taken from sakurawinchesterma.com and
belong to the restaurant.

## Worth knowing

These are stock photographs of sushi, not photographs of Sakura's food. That is
normal practice and the licence allows it, but the six slots are sized and ready
for real photographs of your counter, your party boats and your special rolls
whenever you have them — swap the files in `assets/gallery/` and nothing else
needs to change.
