// Verifica as traduções das lições do Parlia (LESSON_PHRASES em eliana-voz.html):
// dentro de cada lição, nenhuma palavra de tradução (as formas separadas por "/" e "~") pode repetir-se
// noutra frase da mesma lição, para a mesma língua nativa. Senão, a pergunta de LEMBRAR teria duas respostas certas.
// Uso (na raiz do repositório):  node tools/check-translations.js
// Sai com código 1 se encontrar repetições.
const fs = require('fs');
const path = require('path');
const file = process.argv[2] || path.join(__dirname, '..', 'eliana-voz.html');
const html = fs.readFileSync(file, 'utf8');
const m = html.match(/const LESSON_PHRASES = (\{[\s\S]*?\n\});/);
if (!m) { console.error('LESSON_PHRASES não encontrado em ' + file); process.exit(2); }
const LESSONS = Function('"use strict"; return (' + m[1] + ');')();
const ORDER = ['pt', 'es', 'en', 'fr', 'it']; // colunas das traduções, sem o próprio idioma
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\([^)]*\)/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
let problems = 0;
for (const lang of Object.keys(LESSONS)) {
  const natives = ORDER.filter(c => c !== lang);
  LESSONS[lang].forEach((rows, li) => {
    natives.forEach((nat, col) => {
      const seen = {};
      rows.forEach((row, j) => {
        const gloss = (row.split('|')[1 + col] || '').trim();
        gloss.split('~').forEach(v => v.split('/').forEach(x => {
          const n = norm(x);
          if (!n) return;
          (seen[n] = seen[n] || new Set()).add(j);
        }));
      });
      for (const n of Object.keys(seen)) {
        if (seen[n].size < 2) continue;
        problems++;
        const phrases = [...seen[n]].map(j => rows[j].split('|')[0].trim()).join(' / ');
        console.log(`${lang} · lição ${li + 1} · língua nativa ${nat}: «${n}» em ${phrases}`);
      }
    });
  });
}
console.log(problems ? `${problems} tradução(ões) repetida(s).` : 'OK: nenhuma tradução repetida dentro das lições.');
process.exit(problems ? 1 : 0);
