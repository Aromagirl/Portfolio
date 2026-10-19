import { readFile, access, writeFile } from 'node:fs/promises';
import { load } from 'cheerio';
import path from 'node:path';
const manifest=JSON.parse(await readFile('migration/manifest.json','utf8'));
const compact=s=>s.replace(/\s+/g,'');
const results=[];
for(const page of manifest.pages){
 const file=page.newPath==='/'?'dist/index.html':`dist${page.newPath}index.html`;
 const $=load(await readFile(file,'utf8'));const root=$('[data-source-content]');
 const text=compact(root.text());let cursor=0;const missing=[];
 for(const block of page.sourceBlocks){const needle=compact(block.text);const index=text.indexOf(needle,cursor);if(index<0)missing.push(block);else cursor=index+needle.length;}
 const broken=[];
 for(const e of $('a[href],img[src],link[href]').toArray()){
  const raw=$(e).attr(e.tagName==='img'?'src':'href');if(!raw||!raw.startsWith('/')||raw.startsWith('//'))continue;
  const [route,anchor]=raw.split('#');const target=route==='/'?'dist/index.html':route.endsWith('/')?`dist${route}index.html`:`dist${route}`;
  try{await access(path.resolve(target));if(anchor){const targetDoc=load(await readFile(target,'utf8'));if(!targetDoc('[id]').toArray().some(n=>targetDoc(n).attr('id')===decodeURIComponent(anchor)))broken.push(raw);}}catch{broken.push(raw);}
 }
 const imageCount=root.find('img').length;
 results.push({slug:page.slug,sourceTextBlocks:page.sourceBlocks.length,matchedTextBlocks:page.sourceBlocks.length-missing.length,sourceImages:page.assets.length,renderedImages:imageCount,missingBlocks:missing,brokenLocalReferences:[...new Set(broken)]});
}
await writeFile('migration/validation.json',JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
if(results.some(r=>r.missingBlocks.length||r.brokenLocalReferences.length||r.sourceImages!==r.renderedImages))process.exitCode=1;
