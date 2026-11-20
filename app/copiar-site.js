// Copia o código da Parlia do repositório do site para www/ (o que vai dentro do app) e escreve a versão do app.
// O site e o app usam o MESMO eliana-voz.html; a ponte parlia-nativo.js só age dentro do app.
const fs = require('fs'), path = require('path');
const SITE = 'C:/Users/HP 840 G1/eliana-gomes.github.io';
const WWW = path.join(__dirname, 'www');
const v = JSON.parse(fs.readFileSync(path.join(__dirname, 'versao-app.json'), 'utf8'));
fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(path.join(WWW, 'fonts'), { recursive: true });
let html = fs.readFileSync(path.join(SITE, 'eliana-voz.html'), 'utf8');
const site = (html.match(/const APP_VERSION = (\d+)/) || [])[1];
if (!site) throw new Error('APP_VERSION não encontrada no eliana-voz.html');
// Versão do app e do site, mostradas no fim do Perfil (só no app).
html = html.replace('<script src="parlia-nativo.js"></script>', `<script>window.PARLIA_APP = ${JSON.stringify({ version: v.versionName, code: v.versionCode, site: Number(site) })};</script>\n<script src="parlia-nativo.js"></script>`);
fs.writeFileSync(path.join(WWW, 'index.html'), html);
for (const f of ['parlia-nativo.js', 'parlia-logo.webp', 'parlia-logo.png', 'tutora-icon-192.png', 'tutora-icon-512.png', 'tutora-icon-maskable-512.png', 'tutora-manifest.json', 'privacidade.html'])
  fs.copyFileSync(path.join(SITE, f), path.join(WWW, f));
for (const f of fs.readdirSync(path.join(SITE, 'fonts'))) fs.copyFileSync(path.join(SITE, 'fonts', f), path.join(WWW, 'fonts', f));
// Versão no projeto Android (versionCode / versionName).
const g = path.join(__dirname, 'android', 'app', 'build.gradle');
if (fs.existsSync(g)) {
  let b = fs.readFileSync(g, 'utf8');
  b = b.replace(/versionCode \d+/, 'versionCode ' + v.versionCode).replace(/versionName "[^"]*"/, 'versionName "' + v.versionName + '"');
  fs.writeFileSync(g, b);
}
console.log(`www/ pronto: app ${v.versionName} (código ${v.versionCode}), feito do site v${site}`);
