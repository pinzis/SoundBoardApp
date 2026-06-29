// Rasterizes assets/icon.svg → build/icon.png (1024x1024) using Electron's
// renderer, so no native image tooling (ImageMagick/Inkscape/sharp) is needed.
// electron-builder then generates the Windows .ico from build/icon.png.
//
//   npm run icon     (electron scripts/render-icon.js)
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const SIZE = 1024;

app.disableHardwareAcceleration();
// Force 1:1 device pixels so the capture is exactly SIZE×SIZE regardless of the
// display's DPI scaling (otherwise a 125% display yields a non-square 1280×1020).
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.commandLine.appendSwitch('high-dpi-support', '1');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: SIZE,
    height: SIZE,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    useContentSize: true,
    webPreferences: { offscreen: false }
  });

  const svg = fs.readFileSync(path.join(__dirname, '..', 'assets', 'icon.svg'), 'utf8');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;width:${SIZE}px;height:${SIZE}px;background:transparent;overflow:hidden}
    svg{display:block;width:${SIZE}px;height:${SIZE}px}
  </style></head><body>${svg}</body></html>`;

  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  // Give filters/gradients a frame to settle before capturing.
  await new Promise(r => setTimeout(r, 500));

  let image = await win.webContents.capturePage();
  // Guarantee an exact square source for electron-builder's .ico generation.
  if (image.getSize().width !== SIZE || image.getSize().height !== SIZE) {
    image = image.resize({ width: SIZE, height: SIZE, quality: 'best' });
  }
  const png = image.toPNG();

  const outDir = path.join(__dirname, '..', 'build');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, 'icon.png');
  fs.writeFileSync(out, png);
  console.log(`Wrote ${out} (${image.getSize().width}x${image.getSize().height}, ${png.length} bytes)`);

  app.quit();
});
