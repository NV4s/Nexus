# Local asset pack

Anything you put in this folder stays on your machine. The folder is gitignored,
so it never enters version control and never reaches the deployed site.

The game ships drawing everything procedurally. If a `manifest.json` is present
here, the renderer uses your files instead, and falls back to procedural for
anything the manifest does not name. A partial pack is fine.

## manifest.json

```json
{
  "name": "my pack",
  "sprites": {
    "hud.frame": "ui/hud.png",
    "hud.crosshair": "ui/crosshair.png",
    "soldierBlue": "enemies/blue.png"
  },
  "sounds": {
    "shot.handgun": "sfx/handgun.wav",
    "reload": "sfx/reload.wav"
  }
}
```

Sprite keys are the archetype ids in `content/enemies.js`, plus the `hud.*`,
`fx.*` and `cover.*` names listed in `render/assets.js`. Sound keys are listed
there too. Paths are relative to this folder; a pack cannot reference anything
outside it.

Open the game with `?debug` to see which keys your pack is covering and which
are still falling back.
