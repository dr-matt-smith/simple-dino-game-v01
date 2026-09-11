# Simple Dino Game (no web server)

A jumping-dinosaur canvas game, built without any web server code — just
TypeScript compiled to plain JavaScript and static files opened directly in
the browser. This is the "no server" step in a series of simple Deno
projects that ramps up towards full game programming in TypeScript with
Deno; it follows the same `src/` → `public/` → `dist/` build pattern as
`simple_deno_example`.

```
simple_dino_game/
├── build.ts        # the build script (run by Deno, not shipped to the browser)
├── deno.json        # defines the `build` and `dev` tasks below
├── src/              # TypeScript only — every .ts file gets compiled
│   └── game.ts         # the whole game: state, physics, drawing, input
├── public/           # static assets — copied to dist/ as-is, never compiled
│   ├── index.html      # HTML that loads dist/game.js
│   └── css/
│       └── styles.css   # page + canvas styling
└── dist/             # generated output — created by the build, safe to delete
    ├── game.js
    ├── index.html
    └── css/styles.css
```

## Running it

```bash
deno task build     # build once
```

or, while working on it:

```bash
deno task dev        # rebuild automatically on every save
```

Then open `dist/index.html` directly in your browser (double-click it, or
`open dist/index.html` on macOS). There is no server to start — the game
runs entirely from local files.

## Controls

- `Space` to jump

The same key press starts the game from the waiting screen, jumps while
playing, and restarts after game over.

## What's different from `dino-02`

The full `dino-02` project at the repo root serves this same kind of game
through an [Oak](https://jsr.io/@oak/oak) web server (`src/main.ts`,
`deno task start`), and pings `/api/health` on load. This version has no
server and no network calls — everything needed to play lives in static
files, which is the point: it shows that a canvas game is just HTML, CSS
and JavaScript, and doesn't need a backend at all. The high score is still
remembered between visits, using the browser's own `localStorage` rather
than anything server-side.

## How the build works

See `simple_deno_example/README.md` for a full explanation of `build.ts` —
it type-strips every `.ts` file under `src/` into `dist/` and copies every
file under `public/` into `dist/` unchanged. The short version: edit
`src/game.ts`, run `deno task build` (or leave `deno task dev` running),
refresh `dist/index.html` in the browser.
