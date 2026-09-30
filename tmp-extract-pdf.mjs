import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfjsPath = path.join(process.env.TEMP, 'pdfjs-tools', 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.mjs');
const { getDocument } = await import(`file://${pdfjsPath.replace(/\\/g, '/')}`);

const docs = [
  'docs/1_Requerimientos.pdf',
  'docs/2_Historias_de_Usuario.pdf',
  'docs/3_Esquema_de_Base_de_Datos.pdf',
  'docs/4_Script_de_Base_de_Datos.pdf',
];

for (const f of docs) {
  try {
    const data = new Uint8Array(fs.readFileSync(f));
    const doc = await getDocument({ data, verbosity: 0 }).promise;
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it) => it.str).join(' ') + '\n';
    }
    console.log(`\n========== ${path.basename(f)} (${doc.numPages} pages) ==========\n`);
    console.log(text);
  } catch (e) {
    console.log('FAIL', path.basename(f), e.message);
  }
}
