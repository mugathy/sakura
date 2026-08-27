# Sakura Japanese Restaurant

**All-you-can-eat sushi in Winchester, Massachusetts.**

### 👉 View the site: **https://mugathy.github.io/sakura/**

910 Main St, Winchester, MA 01890 · [(781) 721-4608](tel:+17817214608)

| | |
|---|---|
| **Home** | https://mugathy.github.io/sakura/ |
| **Full menu** — 240 dishes, searchable, with an order basket | https://mugathy.github.io/sakura/menu.html |
| **Find us** — hours, address, directions | https://mugathy.github.io/sakura/location.html |
| **Contact** — call, email, or request a table | https://mugathy.github.io/sakura/contact.html |

### Hours

| Day | |
|---|---|
| Monday | Closed |
| Tuesday – Thursday | 11:30 AM – 10:00 PM |
| Friday – Saturday | 11:30 AM – 10:30 PM |
| Sunday | 12:30 PM – 10:00 PM |

Delivery 6:00 – 10:00 PM.

### All-you-can-eat, dining in

| | Regular | Deluxe |
|---|---|---|
| Adults | $21.95 | $31.95 |
| Child 10–12 | $15.95 | $24.95 |
| Under 10 (lunch) | $13.95 | $16.95 |

Add $2 on Friday, Saturday, Sunday and holidays. Deluxe adds sashimi, octopus,
white tuna and yellowtail with scallion.

---

<details>

```bash
git add -A && git commit -m "what changed" && git push
```

GitHub Pages redeploys in about a minute.

`menu.html`, `location.html` and `contact.html` are **generated** — do not edit
them by hand. Change the data or the template, then rebuild:

```bash
node tools/build-menu.mjs     # after editing data/menu.json
node tools/build-pages.mjs    # after editing tools/build-pages.mjs
```

All the real-world details — address, phone, email, hours, buffet prices — live
in one file: **`js/site.js`**. Change them there and every page updates.

To view it locally before pushing:

```bash
python -m http.server 5187
```

</details>
