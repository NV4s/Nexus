# Turning ads on

The ad slots are already built and already in the layout, but **nothing renders
and nothing is requested** until a publisher id is set. An unconfigured slot
takes up no space, so the site today looks exactly as it did before the slots
existed. That is the state the code ships in.

To see where they are without signing up for anything, add `?adpreview=1` to any
URL:

```
http://localhost:3000/#/arcade?adpreview=1
```

Every slot then draws a labelled outline at the size the real unit will take.
Nobody else ever sees it — it is a query parameter, not a setting.

## One thing to watch after approval

The layout is dense: an interstitial before the game, two rails, a unit every
three rows, another under the assistant. Dense placements plus a lot of repeat
visits from the same few school networks is the profile that gets flagged as
invalid traffic, and an invalid-traffic suspension takes the whole account, not
just the site.

If you want to be careful, start with the home page and the in-grid unit, leave
the interstitial and the rails empty for a while, and add them once there is a
traffic history. Leaving a slot's `id` blank is all that takes — no code change.

## Setting it up

### 1. Get an account

Go to <https://adsense.google.com>, sign in with a Google account, and add
`nexus-project-site.vercel.app` (or whatever domain you are on) as a site.
AdSense gives you a publisher id that looks like `ca-pub-1234567890123456`.

### 2. Verify the site

AdSense will ask you to prove you own the domain. It offers three ways; the one
that works on Vercel without touching DNS is the **meta tag**. Add it to
`index.html`, inside `<head>`:

```html
<meta name="google-adsense-account" content="ca-pub-XXXXXXXXXXXXXXXX" />
```

Commit, push, wait for Vercel to deploy, then press Verify. Review takes
anywhere from a day to a few weeks.

### 3. Create the ad units

In AdSense: **Ads → By ad unit**. Create one unit per slot. Each one gives you a
**slot id** — a 10-digit number from the `data-ad-slot` attribute in the code it
shows you. You only need the number.

| Create this unit | Type | Put its id in |
|---|---|---|
| Before the game | Display, square | `game-interstitial` |
| Home, after the hero | Display, horizontal | `home-1` |
| Home, mid page | Display, horizontal | `home-2` |
| Home, before the footer | Display, horizontal | `home-3` |
| In the grid | Display, horizontal | `grid-inline` |
| Below the assistant | Display, horizontal | `assistant` |
| Left rail | Display, vertical | `rail-left` |
| Right rail | Display, vertical | `rail-right` |

### 4. Fill in the config

Everything lives in [`src/lib/ads.ts`](../src/lib/ads.ts). Set the publisher id
at the top, then paste each slot id into its `id` field:

```ts
export const PUBLISHER_ID = 'ca-pub-1234567890123456';

export const SLOTS: Record<SlotName, SlotSpec> = {
  'game-interstitial': { id: '9876543210', width: 336, height: 280, label: 'Before the game' },
  // …
};
```

A slot with an empty `id` renders nothing at all, so you can switch them on one
at a time and see the effect of each.

### 5. Test without risking the account

Never click your own ads — that is the fastest way to lose the account. Use
AdSense's own test mode instead: add `?adtest=on` to any URL.

```
https://nexus-project-site.vercel.app/?adtest=on
```

`adTest()` in `ads.ts` picks that up and sets `data-adtest="on"`, so units render
as test ads and any clicks are ignored by AdSense.

## How the code works

- **`src/lib/ads.ts`** — the publisher id, the slot table, and `loadAdsense()`,
  which injects Google's script once per session on the first slot that mounts.
  With no publisher id it makes no network request at all.
- **`src/components/AdSlot.tsx`** — one slot. Renders nothing until it is
  configured; reserves its exact size once it is, so nothing on the page moves
  after the first load. A slot whose script is blocked removes itself rather
  than leaving an empty frame.
- **The rails** only take their grid columns when there is something to put in
  them (`railsClass()`), and the pre-game interstitial does not appear at all
  when its slot is empty — an overlay holding only a "Play now" button would be
  a door with no room behind it.
- **Ad blockers** are common on the machines this site runs on. A blocked script
  is a handled case, not an error; the slot disappears and the page is fine.

## Where each slot lives

| Slot | File |
|---|---|
| `game-interstitial`, `rail-left`, `rail-right` | `src/components/GamePage.tsx` |
| `rail-left`, `rail-right` (emulator) | `src/components/Emulator.tsx` |
| `home-1`, `home-2`, `home-3` | `src/components/Home.tsx` |
| `grid-inline` | `src/components/GameGrid.tsx` |
| `assistant` | `src/components/Assistant.tsx` |

`ROWS_BETWEEN_ADS` in `ads.ts` controls the in-grid spacing. It counts real
rows: the grid is `auto-fill`, so the column count is read back from the
resolved CSS at the current window width rather than guessed.
