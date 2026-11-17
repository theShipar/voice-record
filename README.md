# Voice Record

A dependency-free, reusable `<voice-recorder>` component recreated from a 20.6-second, 59.94 fps reference clip (1,235 frames). Record, listen back, and save a voice note — no framework, no build step, no network requests, and no uploads.

**Live demo:** [voicerecorder-app.vercel.app](https://voicerecorder-app.vercel.app)

![Recording state: discard, waveform pill with progress ring, and confirm controls](docs/preview.png)

## Highlights

- **One expressive control** — a 48px microphone that stretches into a 92 × 48px pill while the discard and confirm buttons spring outward. 200px expanded footprint, 6px gaps.
- **Live waveform** — five independent rounded bars respond to microphone input through a Web Audio `AnalyserNode`, with subtle baseline motion when the room is quiet.
- **Progress ring** — a red outline grows clockwise around the pill over the first 10 seconds of a recording, so a 60-second take never feels lost.
- **Playback countdown** — the play triangle contracts into a stop square while rolling digits count down the remaining seconds, then restore the total duration.
- **Automatic stop** — recordings finish at 60 seconds.
- **Saving** — the paper-plane button fires a cancelable `voice-send` event and downloads the audio as WebM, Ogg, or M4A depending on the browser's recorder. No audio leaves the page.
- **Accessible** — labelled controls, keyboard support (`Escape` discards), visible focus outlines, a polite live status region for permission and playback errors, and full `prefers-reduced-motion` support.
- **Private by default** — microphone tracks are stopped whenever recording ends or the element is discarded or disconnected.

## Run

```sh
npm run dev
```

Open the printed localhost URL. If port 5173 is occupied, use `PORT=5186 npm run dev`. Microphone capture requires localhost or HTTPS and browser permission. The page is plain static files; opening `index.html` through any static server works the same way.

## Interaction

- **Microphone:** request access, then expand and record.
- **Check mark** (or recording pill): finish and prepare playback.
- **Play:** listen with a red stop icon and animated remaining seconds.
- **Stop:** return playback to the beginning.
- **Cross or `Escape`:** discard and collapse. Active microphone tracks are stopped.
- **Paper plane:** download the audio and collapse.
- **Recordings** finish automatically at 60 seconds.

Keyboard controls, accessible labels, focus indicators, permission errors, and reduced motion are supported.

## Use in another page

```html
<script type="module" src="./voice-recorder.js"></script>
<voice-recorder></voice-recorder>
```

To connect the paper plane to an application's own submission flow, listen for the cancelable `voice-send` event. Its detail contains `blob`, `duration` (seconds), and `filename`. Call `event.preventDefault()` to suppress the default download. The host owns persistence and submission feedback.

```js
recorder.addEventListener('voice-send', async event => {
  event.preventDefault();
  await upload(event.detail.blob, event.detail.filename);
});
```

## Project structure

```
index.html          static page shell with the component mounted
voice-recorder.js   custom element: state machine, MediaRecorder, Web Audio visualizer
server.mjs          zero-dependency static dev server
docs/preview.png    README preview image
package.json        dev server and syntax-check scripts
```

## Reference inspection

Every source frame was extracted into sequential cropped contact sheets and reviewed. Approximate source timeline:

| Time | Observed behavior |
| --- | --- |
| 0.00–0.48s | Small circular microphone; subtle hover/press feedback. |
| 0.48–0.72s | Center stretches into a pill; side controls spring outward; microphone blurs into waveform. |
| 0.72–2.44s | Five independent rounded red bars; shifting pale pink/cream fill; red outline grows clockwise from the right edge. |
| 2.44–2.85s | Waveform blurs into play/duration; pink fades; check shrinks into paper plane. |
| 3.60–7.85s | Playback turns red; triangle contracts into square; rolling digits count down; completion restores play and total duration. |
| 8.67–8.95s | Discard contracts side controls inward and pill into microphone, with blur. |
| 9.90–12.48s | Second recording cycle, discarded while recording. |
| 13.65–16.15s | Third recording, then confirmed to a 04s preview. |
| 17.25–20.10s | Playback, then discard during playback. |
| 20.10–20.60s | Idle microphone. |

Timing and easing are recreated from the visual reference, not recovered original source values. The reference has no audio track. Live bars respond to microphone input with subtle baseline motion. The reference does not show paper-plane activation; local download is the standalone implementation's behavior.

## Browser support

Tested in current Chrome. Requires `MediaRecorder` and `getUserMedia`; the component degrades to a clear message on unsupported browsers and on `localhost`/HTTPS only. The waveform visualizer is optional — recording still works if `AudioContext` is unavailable.

## Verification

Syntax checked with `npm run check`. Chrome end-to-end checks used a synthetic microphone through the actual `MediaRecorder` API and passed capture, Blob creation, playback, file download, discard, track cleanup, permission denial, and 320px mobile overflow checks, with zero page errors. Physical microphone acoustics were not tested.
