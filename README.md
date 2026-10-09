# Playlist Mood Board

Paste a list of song titles, get them sorted into vibes, and export the result as a shareable image or link.

It's a single static HTML file. No build step, no dependencies, no API keys, and nothing is uploaded anywhere.

<!-- ![Playlist Mood Board screenshot]<img width="1157" height="868" alt="image" src="https://github.com/user-attachments/assets/479522ce-6590-4f35-967f-1cfca74e8226" />
 -->

## Features

- **Paste and sort.** One song per line. Plain titles, `Artist - Title`, and numbered or bulleted lists all work.
- **Seven vibes.** After midnight, Heartache, Dance floor, Golden hour, Slow drift, Full volume and Rewind. Songs that don't match any vibe go to Unsorted.
- **Fix it by hand.** Every song has a **Move…** dropdown to send it to a different vibe.
- **Export as PNG.** Downloads the board as a 2x image, ready for social posts or chats.
- **Share link.** Copies a URL that contains the whole board in the hash. Anyone who opens it sees the same board.
- **Light and dark mode.** Follows the system setting.

## Quick start

1. Download or clone this repo.
2. Open `index.html` in your browser.
3. Paste your songs, click **Sort into vibes**, and rename the board if you like.
4. Click **Download PNG** or **Copy share link**.

Click **Try a sample** to see it working with example songs.

## Host it on GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, then select `main` and `/ (root)`.
4. Save. Your site will be live at `https://<your-username>.github.io/<repo-name>/` after a minute or two.

Share links point to wherever the page is hosted, so host it first if you want links to work for other people. A link copied from a local `file://` page will only open on your own machine.

## How the grouping works

Grouping is keyword based and runs entirely in your browser:

1. Each title is lowercased and split into words. If a line looks like `Artist - Title`, only the title part is used.
2. Every vibe has a list of keyword stems (for example `midnight`, `neon`, `dance`, `sunshine`). A word matches if it equals a keyword or starts with one longer than three letters.
3. The vibe with the most matches wins. No match means Unsorted.

Titles alone carry limited information about mood, so expect some misses. That's what the **Move…** dropdown is for.

## Customize

Everything lives in `index.html`.

**Add or edit a vibe.** Find the `VIBES` array near the top of the script:

```js
{id:'sun', name:'Golden hour', bg:'#FFC93C', fg:'#3A2A00',
 k:['sun','summer','happy','beach', /* ... */]}
```

- `name` is the label shown on the tile
- `bg` and `fg` are the tile and text colors
- `k` is the list of keyword stems

Keep the `none` (Unsorted) entry last.

**Use smarter grouping.** The `classify(title)` function takes a title and returns a vibe `id`. Replace its body with a call to an LLM, or with audio-feature data such as valence and energy from a music API, and the rest of the app keeps working.

## Privacy

All processing happens in your browser. Song titles are never sent to a server. The only external request is the optional Google Fonts stylesheet, and the page falls back to system fonts if it can't load.

## Browser support

Any current version of Chrome, Edge, Firefox or Safari. PNG export uses `CanvasRenderingContext2D.roundRect`, which needs Chrome/Edge 99+, Safari 16+ or Firefox 112+.

## Project structure

```
index.html   the whole app (HTML, CSS and JavaScript)
README.md    this file
```

## Ideas for later

- Drag and drop between tiles
- Import from a Spotify or Apple Music playlist link
- Extra export sizes (square, story)
- Custom vibe editor in the UI

