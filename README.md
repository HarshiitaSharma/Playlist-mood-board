# Playlist Mood Board

Paste a list of song titles (or import a Spotify playlist), get them sorted into vibes, and export the result as a shareable image or link.

It's a static site: plain HTML, CSS and JavaScript. No build step, no dependencies, and nothing is uploaded anywhere. Spotify import is optional.

<img width="1157" height="868" alt="Playlist Mood Board screenshot" src="https://github.com/user-attachments/assets/479522ce-6590-4f35-967f-1cfca74e8226" />

## Features

- **Paste and sort.** One song per line. Plain titles, `Artist - Title`, and numbered or bulleted lists all work.
- **Spotify import (optional).** Log in and load one of your own playlists straight onto the board. See [Spotify import](#spotify-import-optional).
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

## Spotify import (optional)

The import runs fully in the browser using Spotify's Authorization Code flow with PKCE, so no client secret or server is needed.

1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and choose **Web API**.
2. Add your page URL as a **Redirect URI**, exactly as it appears in the address bar (for example `https://<your-username>.github.io/<repo-name>/`). For local testing use `http://127.0.0.1:PORT/`. Spotify does not accept `localhost`.
3. Copy the app's **Client ID** into `SPOTIFY_CLIENT_ID` at the top of `spotify.js`. A Client ID is safe to commit. Never put the Client Secret in the repo.
4. Open the page, click **Import from Spotify**, log in, pick a playlist and click **Load playlist**.

Limitations to know about (Spotify's rules, not this app's):

- Development Mode apps require the app owner to have Spotify Premium, and only users you add to the app's allowlist can log in. Everyone else can still paste songs as usual.
- Playlist contents only load for playlists you own or collaborate on.
- Spotify's audio-features and recommendations endpoints are no longer available to new apps, so sorting stays keyword based.
- Spotify changes its API from time to time. If the import stops working, check the [Web API changelog](https://developer.spotify.com/documentation/web-api/references/changes).

## How the grouping works

Grouping is keyword based and runs entirely in your browser:

1. Each title is lowercased and split into words. If a line looks like `Artist - Title`, only the title part is used.
2. Every vibe has a list of keyword stems (for example `midnight`, `neon`, `dance`, `sunshine`). A word matches if it equals a keyword or starts with one longer than three letters.
3. The vibe with the most matches wins. No match means Unsorted.

Titles alone carry limited information about mood, so expect some misses. That's what the **Move…** dropdown is for.

## Customize

**Add or edit a vibe.** Find the `VIBES` array at the top of `app.js`:

```js
{id:'sun', name:'Golden hour', bg:'#FFC93C', fg:'#3A2A00',
 k:['sun','summer','happy','beach', /* ... */]}
```

- `name` is the label shown on the tile
- `bg` and `fg` are the tile and text colors
- `k` is the list of keyword stems

Keep the `none` (Unsorted) entry last.

**Use smarter grouping.** The `classify(title)` function in `app.js` takes a title and returns a vibe `id`. Replace its body with a call to an LLM or any other classifier and the rest of the app keeps working.

**Change the look.** Colors and layout live in `style.css`.

## Privacy

Pasted song titles are processed in your browser and never sent to a server. The external requests the page can make:

- the optional Google Fonts stylesheet (the page falls back to system fonts if it can't load)
- Spotify, only if you click **Import from Spotify**. Login tokens are kept in `sessionStorage` and disappear when you close the tab.

## Browser support

Any current version of Chrome, Edge, Firefox or Safari. PNG export uses `CanvasRenderingContext2D.roundRect`, which needs Chrome/Edge 99+, Safari 16+ or Firefox 112+.

## Project structure

```
index.html   page markup
style.css    styles and light/dark theme
app.js       vibes, classifier, rendering, share link, PNG export
spotify.js   optional Spotify login and playlist import
README.md    this file
```

## Ideas for later

- Drag and drop between tiles
- Import from a `.txt` or `.csv` file
- Extra export sizes (square, story)
- Custom vibe editor in the UI
- Hindi, Punjabi and Hinglish keywords
