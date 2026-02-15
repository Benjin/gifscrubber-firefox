# Firefox GIF Scrubber

Firefox extension that enables play, pause, timeline scrubbing, and frame-by-frame stepping on standalone GIF tabs.

## Scope

- Works on top-level GIF tabs only (`http://`, `https://`, `file://`).
- Does not run on normal pages that merely contain GIF images.

## Controls

- `Space`: Play/Pause
- `Left` / `Right`: Step one frame
- `Shift + Left` / `Shift + Right`: Jump 10 frames
- Overlay buttons:
  - `Play/Pause`
  - `-1` / `+1` frame step
  - speed selector: `10%`, `25%`, `50%`, `75%`, `100%`, `125%`, `150%`, `200%`, `300%`, `500%`
  - looping mode selector:
    - `Respect GIF setting`
    - `Loop forever`
    - `No looping`

## Development

### Prerequisites

- Node.js `>= 20.10.0`
- npm `>= 10.0.0`

1. Install dependencies:
   - `npm install`
2. Build:
   - `npm run build`
3. Load in Firefox:
   - Open `about:debugging#/runtime/this-firefox`
   - Click `Load Temporary Add-on`
   - Select `dist/manifest.json`

For watch mode:
- `npm run watch`

## Local `file://` GIFs

The manifest includes `file:///*` host permission. Firefox may still require local-file extension access settings depending on profile policy.

## Packaging

1. Build first:
   - `npm run build`
2. Package (uses Node script `scripts/package.mjs`):
   - `npm run package`
3. Upload artifact:
   - `web-ext-artifacts/gif-scrubber-0.1.0.zip`

## AMO Submission Checklist

- Verify production `dist/` contains only:
  - `manifest.json`
  - `content.js`
  - `content.js.map` (optional; remove if not desired)
- Confirm host permissions are justified in listing notes.
- Test on latest Firefox desktop release channel.
- Upload packaged zip in AMO developer hub.
