# Eaglercraft: client and relay

Two separate pieces, neither of which lives in the Nexus repo:

1. **The client** — the browser build of EaglercraftX 1.8.8. Deploy it as its own
   static site, then point Nexus at it.
2. **The relay** — a small Java service that lets two browsers find each other so
   they can share a world peer to peer.

Nexus itself only embeds the client URL. Keeping both out of this repo keeps the
site deploy small, and keeps a takedown against the client from touching the
arcade.

## 1. Deploy the client

The client is a folder of static files. Any static host works; a second Vercel
project is the least friction if the arcade is already there.

```bash
vercel deploy --prod ./eaglercraft-client
```

Then set the URL for the Nexus build:

```bash
# .env.local, or a Vercel environment variable
VITE_EAGLERCRAFT_URL=https://your-eaglercraft-deploy.vercel.app/
```

Without that variable the Eaglercraft card does not appear at all — better than a
card that opens a blank frame.

Singleplayer works as soon as the client is up. Multiplayer needs the relay below.

## 2. Deploy the relay

Vercel cannot host this: relays hold a WebSocket open for the length of a
session, and serverless functions are not allowed to. Fly.io's free allowance is
enough for a group of friends.

```bash
# In this directory, with SharedWorldRelay.jar downloaded from the client's
# Multiplayer -> Network Settings screen:
fly launch --no-deploy --name nexus-eagler-relay
fly deploy
```

The relay listens on plain `ws` inside the container; Fly terminates TLS at the
edge, so players connect to `wss://nexus-eagler-relay.fly.dev`. Add that address
in the client under Multiplayer -> Network Settings -> Relays.

`auto_stop_machines` suspends the machine when nobody is connected, so an idle
relay costs nothing. The first connection after an idle period takes a couple of
seconds to wake.

## Notes

- The relay never sees world data. It brokers the connection and steps out; the
  world runs in the host player's browser, so the host has to stay online.
- If you would rather not run anything, the client ships with community relays
  already configured and they work fine for casual play. The only reason to
  self-host is not depending on someone else's uptime.
- Eaglercraft is repeatedly taken down from GitHub. Keep your own copy of
  whatever client build you deploy — do not rely on a link staying up.
