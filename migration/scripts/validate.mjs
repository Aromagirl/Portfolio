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
 for(const e of $('a[href],img[src],link[href],iframe[src]').toArray()){
  const raw=$(e).attr(['img','iframe'].includes(e.tagName)?'src':'href');if(!raw||(!raw.startsWith('/')&&!raw.startsWith('#'))||raw.startsWith('//'))continue;
  const [route,anchor]=raw.split('#');const target=!route?file:route==='/'?'dist/index.html':route.endsWith('/')?`dist${route}index.html`:`dist${route}`;
  try{await access(path.resolve(target));if(anchor){const targetDoc=load(await readFile(target,'utf8'));if(!targetDoc('[id]').toArray().some(n=>targetDoc(n).attr('id')===decodeURIComponent(anchor)))broken.push(raw);}}catch{broken.push(raw);}
 }
 const imageCount=root.find('img').length;
 const expectedImages=page.assets.filter(a=>a.status==='complete').map(a=>a.poster||a.localPath);
 const renderedImages=root.find('img').map((_,e)=>$(e).attr('src')).get();
 const imageOrderMatches=JSON.stringify(expectedImages)===JSON.stringify(renderedImages);
 results.push({slug:page.slug,sourceTextBlocks:page.sourceBlocks.length,matchedTextBlocks:page.sourceBlocks.length-missing.length,sourceImages:page.assets.length,renderedImages:imageCount,imageOrderMatches,sourceDocuments:page.documents?.length||0,renderedDocuments:root.find('[data-document]').length,missingBlocks:missing,brokenLocalReferences:[...new Set(broken)]});
}
await writeFile('migration/validation.json',JSON.stringify(results,null,2)+'\n');
const failed=results.some(r=>r.missingBlocks.length||r.brokenLocalReferences.length||r.sourceImages!==r.renderedImages||!r.imageOrderMatches||r.sourceDocuments!==r.renderedDocuments);
const reportPath='migration/migration-report.md';
const report=(await readFile(reportPath,'utf8')).split('\n## Automated validation')[0];
await writeFile(reportPath,`${report.trimEnd()}\n\n## Automated validation\n\n- Result: ${failed?'FAILED':'passed'}.\n- Text blocks: ${results.reduce((n,r)=>n+r.matchedTextBlocks,0)}/${results.reduce((n,r)=>n+r.sourceTextBlocks,0)}.\n- Images: ${results.reduce((n,r)=>n+r.renderedImages,0)}/${results.reduce((n,r)=>n+r.sourceImages,0)}; source order checked.\n- Documents: ${results.reduce((n,r)=>n+r.renderedDocuments,0)}/${results.reduce((n,r)=>n+r.sourceDocuments,0)}.\n- Local references and heading anchors checked across all ${results.length} migrated pages.\n`);
console.log(JSON.stringify(results,null,2));
if(failed)process.exitCode=1;
