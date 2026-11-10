# The Food Garden — demo restaurant website

A complete, mobile-first website for a (fictional) multi-cuisine restaurant on GS Road, Christian Basti, Guwahati.
It is a portfolio demo: the restaurant, menu, prices, ratings, reviews, timings and contact details are sample data.

Plain HTML, CSS and JavaScript. No framework, no build step, no external requests, no tracking.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opened straight from the file system everything works as well; Chrome then logs a harmless font-preload message in its console, and the fonts still load.

It can be hosted as it is on any static host. Vercel is set up in the repository (next section); for Netlify, Cloudflare Pages, GitHub Pages or shared hosting, upload the folder.

## Deploy on Vercel

There is nothing to install or build. Vercel publishes the files as they are.

1. Make sure the website is on the `main` branch. Vercel builds a new project's public (production) site from `main`.
2. On [vercel.com/new](https://vercel.com/new), import this GitHub repository.
3. Change nothing on the settings screen and press **Deploy**.

After that, every push to `main` updates the public site, and every other branch or pull request gets its own preview address.

Good to know:

- **`vercel.json`** fixes three build settings: no framework (`"framework": null`), no build command (`"buildCommand": ""`), and the repository's top folder as the folder to publish (`"outputDirectory": "."`). The file wins over the project settings in the Vercel dashboard, so a preset or build command picked there by mistake cannot break the deployment. Without the file, the preset "Vite" or "Next.js" or a build command such as `npm run build` makes the build fail.
- **Root Directory** is the one project setting the file cannot fix. Leave it empty: `index.html` sits in the repository's top folder.
- **`404.html`** is shown, in the site's own look, for every address that does not exist. Its links start with `/`, so it expects the site at the top of its domain, which is the case on Vercel. On a host that serves the site from a sub-folder (a GitHub Pages project site, for example), change those links.
- **`README.md` and `vercel.json` are not published.** Vercel leaves them out by itself. Every other file in the repository is public.
- **Preview addresses ask for a Vercel login** in a new project (Vercel's Deployment Protection). The production address is public. Vercel also tells search engines not to list previews.
- The demo asks search engines not to list it on any address (see "Before using this for a real restaurant").

## What is in it

| Section | What it does |
| --- | --- |
| Header | Sticky header with logo, navigation and a Book a Table button. Hamburger menu below 1000 px. |
| Hero | Headline, short intro, "Open Today" badge and two calls to action. |
| Restaurant information | Location, cuisine, price range, masked phone number and an illustrative map marked **Demo location**. |
| Menu | 10 dishes in 5 categories, each with a veg / non-veg mark. Filter by category, search by name, sort by popularity or price. |
| Food details | Large photo, price, description, ingredients, availability, rating and reviews for each dish. Has its own link (`#dish-<id>`) and closes with Back, Esc, the close button or a click outside. |
| About | Short story with two photos. |
| Reviews | 3 sample reviews per dish (30 in total), clearly labelled as samples. Visitors can add their own star rating and review. |
| Book a table | Validated request form that opens WhatsApp with a ready-to-send message. |
| Location and contact | Address, Get Directions, opening hours with today highlighted. |
| Footer | Quick links, menu categories and the demo notice. |

### How the interactive parts behave

- **Visitor reviews** are stored only in that visitor's browser (`localStorage`). They are listed separately from the sample reviews, marked **Unverified**, survive a reload and can be removed. They never change a dish's listed rating. Nothing is sent to a server.
- **Table requests** are not stored anywhere. A valid form builds a WhatsApp message and opens `https://wa.me/…`. The page says "Request prepared, not yet confirmed" and never claims a table is booked.
- **Book This Food / Enquire** in a dish's details adds that dish to the table request. There is no cart, ordering or payment.
- **Call** buttons show a short notice instead of dialling, because the demo phone number is masked.
- **Get Directions** opens Google Maps for the general GS Road, Christian Basti area, not an exact address.

## Files

```
index.html               All page content and the inline SVG icons
404.html                 "Page not found" page, used by Vercel and most static hosts
assets/css/styles.css    All styles (mobile-first, design tokens at the top)
assets/js/data.js        Menu, sample reviews and booking settings  <- edit this
assets/js/app.js         Behaviour: menu, food details, reviews, booking, navigation
assets/fonts/            Fraunces and DM Sans (subset WOFF2) with their licences
assets/img/              Hero, About and dish photos, favicon, touch icon
favicon.ico              Icon for browsers and apps that ask for /favicon.ico
robots.txt               Lets crawlers in, so they can read the "noindex" tag of the pages
vercel.json              Build settings for Vercel (see "Deploy on Vercel")
THIRD-PARTY-NOTICES.md   Licences for fonts and icons
```

## Customise

**Menu, prices, ratings and sample reviews:** `assets/js/data.js`. Each dish has a name, category, price, rating, veg / non-veg marker, short and long description, ingredients, availability and an image prefix. Sample reviews are listed per dish id. Add a category by adding it to `categories` and using its id on a dish; the filter buttons update by themselves, while the "Menu Categories" links in the footer are plain links in `index.html`.

**Booking options:** `site.booking` in `assets/js/data.js` (first and last time slot, slot length, maximum guests, how many days ahead).

**WhatsApp number:** `site.whatsappNumber` in `assets/js/data.js`. It is empty on purpose, so the demo never messages a real person; WhatsApp then asks the sender to pick a chat. For a real restaurant enter the number with country code, digits only (`91XXXXXXXXXX`).

**Name, address, phone, tagline, opening hours:** plain text in `index.html`. The hours are the list with `id="hours-list"`. Add `data-closed` to a day (`<li data-day="monday" data-closed>`) and the hero badge reads "Closed Today" on that day. The day is worked out in the time zone set in `site.timeZone`.

**Colours, fonts, spacing:** the `:root` block at the top of `assets/css/styles.css`.

**Photos:** every dish needs three WebP files in `assets/img/dishes/`, 4:3, named `<image>-400.webp`, `<image>-640.webp` and `<image>-960.webp`. With ImageMagick:

```bash
for w in 400 640 960; do
  h=$((w * 3 / 4))
  convert photo.jpg -resize "${w}x${h}^" -gravity center -extent "${w}x${h}" -strip -quality 76 "assets/img/dishes/my-dish-$w.webp"
done
```

The hero uses a square image (640, 960 and 1254 px) and a 5:4 crop for phones (640 and 800 px wide), each as AVIF with a WebP fallback. The About photos are 4:5 (500 and 1000 px wide) and square (320 and 640 px).

## Before using this for a real restaurant

1. Remove `<meta name="robots" content="noindex, nofollow">` from `index.html`. It is there because this is a fictional business. Leave the same tag in `404.html` (an error page should never be listed) and leave `robots.txt` as it is.
2. Replace the sample data: phone number, address, opening hours, menu and prices. Remove the "demo" labels and notes once the information is real.
3. Remove the sample reviews, or replace them with genuine ones you have permission to publish. Collecting real public reviews needs a server or a review service; browser storage only shows a review to the person who wrote it.
4. Replace the photos with real photos of the food and the place. The current ones are illustrations.
5. Set `whatsappNumber`, and turn the Call buttons into real `tel:` links.
6. Replace the illustrative map with a real map link or embed and the exact address.
7. Add a privacy notice if you start collecting enquiries.

## Quality checks

Checked in headless Chromium at 16 viewport widths from 320 px to 1920 px:

- every navigation link, button and form control responds;
- category filters, search, sorting and their combinations;
- details, prices, ratings and the 3 sample reviews for each of the 10 dishes;
- star rating, review validation, review persistence across a reload, and removal;
- booking validation (required fields, phone format, past dates and times) and the exact WhatsApp message and link;
- no horizontal overflow, no clipped text, touch targets of at least 44 px, form text of at least 16 px;
- no layout shift while loading or scrolling (CLS 0), first view under 400 KB;
- no console errors or failed requests when served over HTTP;
- valid HTML (html-validate) and no accessibility violations reported by axe-core (WCAG 2.2 AA rules) in eight page states, the "page not found" page included;
- colour contrast: all text and placeholders at 4.5:1 or more, form field outlines and rating stars at 3:1 or more;
- keyboard use: skip link; Tab and Shift + Tab reach every control, in the order it appears on screen, and never land on something hidden behind the header or outside the screen; Esc and Back close the food details, and focus returns to the button that opened them;
- focus indicator: every control shows a complete focus ring, measured in screenshots and not only in the styles, on desktop and phone layouts, in the open phone menu, in the food details and with form errors showing;
- phone menu by keyboard: the menu button comes before the menu items, and the menu closes when focus moves on to the page;
- the header at every width from 320 px to 1920 px, also when the web fonts fail to load: the name never touches the buttons next to it;
- closing the food details never moves the page, also after a navigation link has put a `#section` in the address.

**Vercel.** The repository was built with Vercel's own build tool (`vercel build`, Vercel CLI 65) with the settings of a freshly imported project and with deliberately wrong dashboard settings (wrong framework preset, a build command, an output folder). The result was then served locally the way Vercel serves static files, and all checks above were repeated on it. Every published file is served with the right type, addresses that do not exist get `404.html` with status 404, and `README.md` and `vercel.json` cannot be fetched. This is a local reproduction; it was not observed on a live Vercel deployment.

Not tested on physical devices or in Safari and Firefox. The code avoids very new browser features; it needs a browser with `<dialog>` support (Chrome 37+, Firefox 98+, Safari 15.4+). High-contrast (forced colours) mode was checked with Chromium's emulation only: focus and selected items get outlines there.

## Credits

- **Photos:** AI-generated illustrations made for this demo. They do not show a real restaurant or real dishes.
- **Fonts:** [Fraunces](https://github.com/undercasetype/Fraunces) and [DM Sans](https://github.com/googlefonts/dm-fonts), SIL Open Font License 1.1.
- **Icons:** [Lucide](https://lucide.dev) (ISC License). WhatsApp glyph from [Simple Icons](https://simpleicons.org) (CC0); WhatsApp is a trademark of its owner.
- **Logo and map:** drawn for this demo. The map is illustrative and not to scale.

Licence texts are in `THIRD-PARTY-NOTICES.md` and `assets/fonts/`.
