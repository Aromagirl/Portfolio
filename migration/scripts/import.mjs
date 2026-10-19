import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
import Turndown from 'turndown';
import sharp from 'sharp';

const base='https://sites.google.com/view/natalia-isakova';
const pages=[['home','', 'Natalia Isakova','UX/UI & Interactive designer'],['tickeron','/uxui-design/tickeron','Tickeron','Financial Marketplace'],['myhospital','/user-research/myhospital','MyHospital','Medical Service Aggregator'],['kidswearcycle','/user-research/kidswearcycle','KidswearCycle','Online Resale Platform']];
const routes=new Map(pages.map(([slug,path])=>[base+path,slug==='home'?'/':`/work/${slug}/`]));routes.set(base+'/home','/');
const normalize=s=>s.replace(/\s+/g,' ').trim();
const hash=b=>createHash('sha256').update(b).digest('hex');
const md=new Turndown({headingStyle:'atx',bulletListMarker:'-',emDelimiter:'*'});
md.addRule('heading',{filter:['h1','h2','h3','h4','h5','h6'],replacement:(content,node)=>`\n\n${'#'.repeat(Number(node.nodeName.slice(1)))} ${content.replace(/\n+/g,' ').trim()}\n\n`});
md.addRule('blockLink',{filter:node=>node.nodeName==='A',replacement:(content,node)=>`[${content.trim().replace(/\n+/g,' ')}](${node.getAttribute('href')})`});
md.addRule('image',{filter:'img',replacement:(_,node)=>`\n\n![${node.getAttribute('alt')||''}](${node.getAttribute('src')})\n\n`});
await mkdir('src/content/projects',{recursive:true});await mkdir('src/content/home',{recursive:true});
const manifest={createdAt:new Date().toISOString(),pages:[],discoveredPages:[],notes:['Static source extraction. Manual desktop/mobile comparison remains required.','Google Sites image rendition requested at w16383; access to original design files is not implied.']};
const discovered=new Set();
let previous;try{previous=JSON.parse(await readFile('migration/manifest.json','utf8'));}catch{}
for(const [slug,path,title,summary] of pages){
 const html=await readFile(`migration/raw/${slug}.html`,'utf8');const $=load(html);const root=$('[jsname="ZBtY8b"]');if(root.length!==1)throw Error(`Content root not found: ${slug}`);
 $('a[href]').each((_,e)=>{const u=new URL($(e).attr('href'),base);if(u.origin==='https://sites.google.com'&&u.pathname.startsWith('/view/natalia-isakova'))discovered.add(u.origin+u.pathname);});
 root.find('[aria-label="Copy heading link"],script,style,svg').remove();
 const sourceBlocks=root.find('h1,h2,h3,h4,h5,h6,p,li').filter((_,e)=>normalize($(e).text())&& !$(e).parents('li').length).map((_,e)=>({tag:e.tagName,text:normalize($(e).text())})).get();
 const assets=[];let position=0;
 await mkdir(`migration/assets-original/${slug}`,{recursive:true});await mkdir(`public/images/projects/${slug}`,{recursive:true});
 for(const e of root.find('img').toArray()){
  position++;const img=$(e),sourceUrl=img.attr('src'),requestedUrl=sourceUrl.replace(/=w\d+[^?]*$/,'=w16383');const stem=String(position).padStart(2,'0');
  const record={position,sourceUrl,requestedUrl,status:'complete'};
  try{
   const cached=previous?.pages.find(p=>p.slug===slug)?.assets.find(a=>a.position===position&&a.sourceUrl===sourceUrl&&a.status==='complete');
   let data;
   let recovered;try{recovered=await readFile(`migration/assets-original/${slug}/${stem}-recovered`);}catch{}
   if(recovered){data=recovered;record.requestedUrl=sourceUrl;record.note='Recovered source-size rendition; full-resolution original not verified.';}
   else if(cached){data=await readFile(cached.original);record.requestedUrl=cached.requestedUrl;}
   else{
    let response=await fetch(requestedUrl,{signal:AbortSignal.timeout(60000)});
    if(!response.ok){
     const refreshUrl=base+path+'?migration='+Date.now();
     const freshResponse=await fetch(refreshUrl,{signal:AbortSignal.timeout(60000)});if(!freshResponse.ok)throw Error(`Page refresh HTTP ${freshResponse.status}`);
     const freshHtml=await freshResponse.text();await writeFile(`migration/raw/${slug}-refresh-${position}.html`,freshHtml);
     const fresh=load(freshHtml);const freshUrl=fresh('[jsname="ZBtY8b"] img').eq(position-1).attr('src');if(!freshUrl)throw Error('Refreshed image missing');
     record.requestedUrl=freshUrl.replace(/=w\d+[^?]*$/,'=w16383');record.refreshSource=refreshUrl;
     response=await fetch(record.requestedUrl,{signal:AbortSignal.timeout(60000)});
    }
    if(!response.ok)throw Error(`HTTP ${response.status}`);
    data=Buffer.from(await response.arrayBuffer());
   }
   const meta=await sharp(data).metadata();if(!meta.width)throw Error('Invalid image');
   const original=`migration/assets-original/${slug}/${stem}.${meta.format}`;await writeFile(original,data);
   const animated=(meta.pages||1)>1;const poster=`/images/projects/${slug}/${stem}.webp`;let localPath=poster;
   await sharp(data,{limitInputPixels:300000000}).rotate().resize({width:3200,withoutEnlargement:true}).webp({quality:90}).toFile(`public${poster}`);
   if(animated){localPath=`/images/projects/${slug}/${stem}.${meta.format}`;await copyFile(original,`public${localPath}`);}
   const out=await sharp(`public${poster}`).metadata();Object.assign(record,{original,sha256:hash(data),width:meta.width,height:meta.height,localPath,animated,poster:animated?poster:null,outputWidth:out.width,outputHeight:out.height,alt:img.attr('alt')||img.attr('aria-label')||`${title} — ${stem}`});
   img.attr('src',localPath).attr('alt',record.alt);
  }catch(error){record.status='needs-manual-asset';record.error=String(error);img.replaceWith($('<p>').text(`[Image unavailable: ${title}, ${stem}]`));}
  assets.push(record);console.log(`${slug} image ${position}: ${record.status}`);
 }
 const links=[];root.find('a[href]').each((_,e)=>{const a=$(e);let u=new URL(a.attr('href'),base);if(u.hostname==='www.google.com'&&u.pathname==='/url'&&u.searchParams.has('q'))u=new URL(u.searchParams.get('q'));const sourceUrl=u.href;const local=routes.get(u.origin+u.pathname.replace(/\/$/,''));const href=local?local+u.hash:sourceUrl;a.attr('href',href);links.push({text:normalize(a.text()),sourceUrl,href});});
 // Preserve heading anchors (Google Sites links point to the separate preceding node).
 root.find('h1,h2,h3,h4,h5,h6').each((_,e)=>{const heading=$(e);const id=heading.attr('id')?.replace(/_l$/,'');if(id)heading.before($('<span>').attr('data-anchor',id));});
 const sections=[];const gaps=[];
 for(const section of root.find('section').toArray()){
  const parts=[];
  for(const block of $(section).find('.tyJCtd').toArray()){
   const b=$(block).clone();
   b.find('span[data-anchor]').each((_,e)=>{$(e).replaceWith(`PORTFOLIOANCHOR${Buffer.from($(e).attr('data-anchor')).toString('hex')}END`);});
   if(slug!=='home')b.find('h1').each((_,e)=>{$(e).replaceWith($('<h2>').html($(e).html()));});
   let markdown=md.turndown(b.html()||'').replace(/\{/g,'&#123;').replace(/\}/g,'&#125;').replace(/</g,'&lt;');
   markdown=markdown.replace(/PORTFOLIOANCHOR([0-9a-f]+)END/g,(_,hex)=>`\n\n<span id="${Buffer.from(hex,'hex').toString()}" />\n\n`);
   if(normalize(b.text())||b.find('img').length)parts.push(markdown);
   if(/This video shows/.test(b.text())&&!assets.some(a=>a.animated)){parts.push('> Video unavailable in the exported source. Original media link needs to be restored.');gaps.push({status:'broken-embed',context:normalize(b.text()),sourceUrl:base+path});}
  }
  if(parts.length)sections.push(`<section className="source-section">\n\n${parts.join('\n\n')}\n\n</section>`);
 }
 const front={title,summary,sourceUrl:base+path,status:'published',featured:true,sortOrder:pages.findIndex(p=>p[0]===slug),category:slug==='tickeron'?'UI design':'UX/UI design',cover:assets.find(a=>a.localPath)?.localPath||null};
 const markdown=`---\n${Object.entries(front).map(([k,v])=>`${k}: ${JSON.stringify(v)}`).join('\n')}\n---\n\n${sections.join('\n\n')}\n`;
 const target=`src/content/${slug==='home'?'home':'projects'}/${slug}.mdx`;await writeFile(target,markdown);
 // Exact text verification uses the rendered output in validate.mjs; this snapshot records every source block.
 const record={slug,sourceUrl:base+path,target,newPath:slug==='home'?'/':`/work/${slug}/`,status:gaps.length||assets.some(a=>a.status!=='complete')?'review-needed':'complete',sourceSha256:hash(Buffer.from(html)),sourceBlocks,sourceCounts:{textBlocks:sourceBlocks.length,images:assets.length,sections:root.find('section').length},assets,links,gaps};manifest.pages.push(record);
}
manifest.discoveredPages=[...discovered].sort().map(url=>({url,status:routes.has(url)?'included':'outside-current-scope'}));
await writeFile('migration/manifest.json',JSON.stringify(manifest,null,2)+'\n');
const report=['# Migration report','', 'Imported without editorial rewriting. Original HTML and images are ignored by Git.','', '| Page | Text blocks | Images | Status |','| --- | ---: | ---: | --- |',...manifest.pages.map(p=>`| ${p.slug} | ${p.sourceCounts.textBlocks} | ${p.assets.filter(a=>a.status==='complete').length}/${p.assets.length} | ${p.status} |`),'','## Open issues','',...manifest.pages.flatMap(p=>[...p.gaps.map(g=>`- **${p.slug}: ${g.status}** — ${g.context} Source: ${g.sourceUrl}`),...p.assets.filter(a=>a.status!=='complete').map(a=>`- **${p.slug}: needs-manual-asset** — image ${a.position}: ${a.error}`)]), '- Full manual comparison of every source section on desktop/mobile is pending.','- Image alt text missing in the source uses a temporary project/position label; editorial descriptions need review.','- KidswearCycle animation was recovered at the source display size (1280px); full-resolution original not verified.','', '## Restored prototype demonstrations','', '- MyHospital: original animated GIF, 368 frames; playback control and still poster.','- KidswearCycle: original animated GIF, 375 frames; playback control and still poster.','', '## Other discovered pages','',...manifest.discoveredPages.filter(p=>p.status==='outside-current-scope').map(p=>`- ${p.url}`)];
await writeFile('migration/migration-report.md',report.join('\n')+'\n');
