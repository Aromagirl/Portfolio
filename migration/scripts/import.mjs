import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
import Turndown from 'turndown';
import sharp from 'sharp';

const base='https://sites.google.com/view/natalia-isakova';
const pages=[
 ['home','', 'Natalia Isakova','UX/UI & Interactive designer'],
 ['tickeron','/uxui-design/tickeron','Tickeron','Financial Marketplace'],
 ['myhospital','/user-research/myhospital','MyHospital','Medical Service Aggregator'],
 ['kidswearcycle','/user-research/kidswearcycle','KidswearCycle','Online Resale Platform'],
 ['about-me','/about-me','About me','Interactive and graphic designer','pages','/about/'],
 ['user-research','/user-research','User research','KidswearCycle and MyHospital','pages','/user-research/'],
 ['uxui-design','/uxui-design','UX/UI design','Tickeron and i-Jet Media','pages','/uxui-design/'],
 ['ijet-media','/uxui-design/ijet-media','i-Jet Media','Online Games'],
 ['marketing-design','/marketing-design','Marketing design','FraudScore — marketing and visual design','pages','/marketing-design/'],
];
const outputPath=([slug,,,,,route])=>route||(slug==='home'?'/':`/work/${slug}/`);
const routes=new Map(pages.map(page=>[base+page[1],outputPath(page)]));routes.set(base+'/home','/');
const selected=new Set(process.argv.slice(2));
for(const slug of selected)if(!pages.some(page=>page[0]===slug))throw Error(`Unknown page: ${slug}`);
const normalize=s=>s.replace(/\s+/g,' ').trim();
const hash=b=>createHash('sha256').update(b).digest('hex');
const md=new Turndown({headingStyle:'atx',bulletListMarker:'-',emDelimiter:'*'});
md.addRule('heading',{filter:['h1','h2','h3','h4','h5','h6'],replacement:(content,node)=>`\n\n${'#'.repeat(Number(node.nodeName.slice(1)))} ${content.replace(/\n+/g,' ').trim()}\n\n`});
md.addRule('blockLink',{filter:node=>node.nodeName==='A',replacement:(content,node)=>`[${content.trim().replace(/\n+/g,' ')}](${node.getAttribute('href')})`});
md.addRule('image',{filter:'img',replacement:(_,node)=>`\n\n![${node.getAttribute('alt')||''}](${node.getAttribute('src')})\n\n`});
md.addRule('gallery',{filter:node=>node.hasAttribute('data-import-gallery'),replacement:content=>`\n\nPORTFOLIOGALLERYSTART\n\n${content}\n\nPORTFOLIOGALLERYEND\n\n`});
md.addRule('document',{filter:node=>node.hasAttribute('data-import-embed'),replacement:(_,node)=>`\n\nPORTFOLIOEMBED${node.getAttribute('data-import-embed')}END\n\n`});
function prepareRoot($){
 const root=$('[jsname="ZBtY8b"]');
 root.find('[aria-label="Copy heading link"],script,style,svg').remove();
 root.find('[aria-label="Image carousel"]').each((_,e)=>{
  const carousel=$(e),gallery=$('<div>').attr('data-import-gallery','true');
  const captions=carousel.find('[jsname="fQjHAd"]').map((_,n)=>normalize($(n).text())).get();
  carousel.find('[role="img"][style*="background-image"]').each((i,n)=>{
   const url=$(n).attr('style').match(/background-image:\s*url\(["']?([^\s)"']+)/)?.[1];
   if(!url)throw Error('Carousel image URL missing');
   gallery.append($('<p>').append($('<img>').attr('src',url).attr('alt',captions[i]||`Social media post ${i+1}`)));
   if(captions[i])gallery.append($('<p>').text(captions[i]));
  });
  carousel.replaceWith(gallery);
 });
 // Drive's product icon is interface chrome, not a portfolio image.
 root.find('[data-embed-doc-id] img').remove();
 return root;
}
for(const collection of ['projects','pages'])await mkdir(`src/content/${collection}`,{recursive:true});
const manifest={createdAt:new Date().toISOString(),pages:[],discoveredPages:[],notes:['Static source extraction. Manual desktop/mobile comparison remains required.','Google Sites image rendition requested at w16383; access to original design files is not implied.']};
const discovered=new Set();
let previous;try{previous=JSON.parse(await readFile('migration/manifest.json','utf8'));}catch{}
if(selected.size&&previous){manifest.pages=previous.pages.filter(p=>!selected.has(p.slug));for(const p of previous.discoveredPages)discovered.add(p.url);}
for(const page of pages){
 const [slug,path,title,summary,kind]=page;
 if(selected.size&&!selected.has(slug))continue;
 const collection=kind||(slug==='home'?'pages':'projects');
 const html=await readFile(`migration/raw/${slug}.html`,'utf8');const $=load(html);const root=prepareRoot($);if(root.length!==1)throw Error(`Content root not found: ${slug}`);
 if(collection==='pages'&&!root.find('h1').length){const heading=root.find('h2,h3').filter((_,e)=>normalize($(e).text()).toLowerCase()===title.toLowerCase()).first();if(heading.length)heading.replaceWith($('<h1>').attr('id',heading.attr('id')).html(heading.html()));}
 $('a[href]').each((_,e)=>{const u=new URL($(e).attr('href'),base);if(u.origin==='https://sites.google.com'&&u.pathname.startsWith('/view/natalia-isakova'))discovered.add(u.origin+u.pathname);});
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
    let response;
    try{response=await fetch(requestedUrl,{signal:AbortSignal.timeout(30000)});}catch{}
    if(!response?.ok){
     const refreshUrl=base+path+'?migration='+Date.now();
     const freshResponse=await fetch(refreshUrl,{signal:AbortSignal.timeout(60000)});if(!freshResponse.ok)throw Error(`Page refresh HTTP ${freshResponse.status}`);
     const freshHtml=await freshResponse.text();await writeFile(`migration/raw/${slug}-refresh-${position}.html`,freshHtml);
     const fresh=load(freshHtml);const freshUrl=prepareRoot(fresh).find('img').eq(position-1).attr('src');if(!freshUrl)throw Error('Refreshed image missing');
     record.requestedUrl=freshUrl.replace(/=w\d+[^?]*$/,'=w16383');record.refreshSource=refreshUrl;
     try{response=await fetch(record.requestedUrl,{signal:AbortSignal.timeout(30000)});}catch{response=undefined;}
     if(!response?.ok){record.requestedUrl=freshUrl;record.note='Recovered source-size rendition; full-resolution original not verified.';response=await fetch(freshUrl,{signal:AbortSignal.timeout(30000)});}
    }
    if(!response?.ok)throw Error(`HTTP ${response?.status||'request failed'}`);
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
 const documents=[];
 for(const element of root.find('[data-embed-doc-id]').toArray()){
  const doc=$(element),id=doc.attr('data-embed-doc-id');
  const record={title:normalize(doc.find('.pB4Yfc').text())||'Presentation',sourceUrl:doc.attr('data-embed-open-url'),previewUrl:doc.find('iframe').attr('data-src'),downloadUrl:doc.attr('data-embed-download-url'),status:'complete'};
  const original=`migration/assets-original/${slug}/${record.title.toLowerCase().replace(/[^a-z0-9.]+/g,'-')}`;
  try{
   let data;try{data=await readFile(original);}catch{const response=await fetch(record.downloadUrl,{signal:AbortSignal.timeout(40000)});if(!response.ok)throw Error(`HTTP ${response.status}`);data=Buffer.from(await response.arrayBuffer());}
   if(data.subarray(0,5).toString()!=='%PDF-')throw Error('Download is not a PDF');
   await writeFile(original,data);await mkdir(`public/documents/${slug}`,{recursive:true});
   record.localPath=`/documents/${slug}/${record.title.toLowerCase().replace(/[^a-z0-9.]+/g,'-')}`;
   await writeFile(`public${record.localPath}`,data);Object.assign(record,{original,sha256:hash(data),bytes:data.length});
  }catch(error){record.status='needs-manual-document';record.error=String(error);}
  doc.replaceWith($('<div>').attr('data-import-embed',String(documents.length)).text(record.title));
  documents.push(record);
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
   if(collection==='projects')b.find('h1').each((_,e)=>{$(e).replaceWith($('<h2>').html($(e).html()));});
   let markdown=md.turndown(b.html()||'').replace(/\{/g,'&#123;').replace(/\}/g,'&#125;').replace(/</g,'&lt;');
   markdown=markdown.replace(/PORTFOLIOANCHOR([0-9a-f]+)END/g,(_,hex)=>`\n\n<span id="${Buffer.from(hex,'hex').toString()}" />\n\n`);
   markdown=markdown.replace(/PORTFOLIOGALLERYSTART/g,'<div className="image-gallery">').replace(/PORTFOLIOGALLERYEND/g,'</div>');
   markdown=markdown.replace(/PORTFOLIOEMBED(\d+)END/g,(_,index)=>{const doc=documents[Number(index)];return `<DocumentEmbed src=${JSON.stringify(doc.localPath||doc.previewUrl)} title=${JSON.stringify(doc.title)} sourceUrl=${JSON.stringify(doc.sourceUrl)} />`;});
   if(normalize(b.text())||b.find('img,[data-import-embed]').length){
    const isIndex=['user-research','uxui-design'].includes(slug);
    if(isIndex&&b.find('img').length)parts.push('<div className="project-overview">');
    parts.push(markdown);
    if(isIndex&&b.find('a[href^="/work/"]').length)parts.push('</div>');
   }
   if(/This video shows/.test(b.text())&&!assets.some(a=>a.animated)){parts.push('> Video unavailable in the exported source. Original media link needs to be restored.');gaps.push({status:'broken-embed',context:normalize(b.text()),sourceUrl:base+path});}
  }
  if(parts.length)sections.push(`<section className="source-section">\n\n${parts.join('\n\n')}\n\n</section>`);
 }
 const front={title,summary,sourceUrl:base+path,status:'published',featured:true,sortOrder:pages.findIndex(p=>p[0]===slug),category:slug==='tickeron'?'UI design':'UX/UI design',cover:assets.find(a=>a.localPath)?.localPath||null};
 const markdown=`---\n${Object.entries(front).map(([k,v])=>`${k}: ${JSON.stringify(v)}`).join('\n')}\n---\n\n${documents.length?"import DocumentEmbed from '../../components/DocumentEmbed.astro';\n\n":''}${sections.join('\n\n')}\n`;
 const target=`src/content/${collection}/${slug}.mdx`;await writeFile(target,markdown);
 // Exact text verification uses the rendered output in validate.mjs; this snapshot records every source block.
 const record={slug,sourceUrl:base+path,target,newPath:outputPath(page),status:gaps.length||assets.some(a=>a.status!=='complete')||documents.some(d=>d.status!=='complete')?'review-needed':'complete',sourceSha256:hash(Buffer.from(html)),sourceBlocks,sourceCounts:{textBlocks:sourceBlocks.length,images:assets.length,sections:root.find('section').length},assets,links,gaps};if(documents.length)record.documents=documents;manifest.pages.push(record);
}
manifest.pages.sort((a,b)=>pages.findIndex(p=>p[0]===a.slug)-pages.findIndex(p=>p[0]===b.slug));
// Update only migrated link destinations in retained MDX; leave prose and metadata intact.
for(const page of manifest.pages){
 let content=await readFile(page.target,'utf8');const original=content;
 for(const [source,target] of routes)content=content.replaceAll(`](${source})`,`](${target})`);
 if(content!==original)await writeFile(page.target,content);
 for(const link of page.links){const url=new URL(link.sourceUrl);const target=routes.get(url.origin+url.pathname.replace(/\/$/,''));if(target)link.href=target+url.hash;}
}
manifest.discoveredPages=[...discovered].sort().map(url=>({url,status:routes.has(url)?'included':'outside-current-scope'}));
await writeFile('migration/manifest.json',JSON.stringify(manifest,null,2)+'\n');
const report=['# Migration report','', 'Imported without editorial rewriting. Original HTML and images are ignored by Git.','', '| Page | Text blocks | Images | Status |','| --- | ---: | ---: | --- |',...manifest.pages.map(p=>`| ${p.slug} | ${p.sourceCounts.textBlocks} | ${p.assets.filter(a=>a.status==='complete').length}/${p.assets.length} | ${p.status} |`),'','## Open issues','',...manifest.pages.flatMap(p=>[...p.gaps.map(g=>`- **${p.slug}: ${g.status}** — ${g.context} Source: ${g.sourceUrl}`),...p.assets.filter(a=>a.status!=='complete').map(a=>`- **${p.slug}: needs-manual-asset** — image ${a.position}: ${a.error}`)]), '- Full manual comparison of every source section on desktop/mobile is pending.','- Image alt text missing in the source uses a temporary project/position label; editorial descriptions need review.','- KidswearCycle animation was recovered at the source display size (1280px); full-resolution original not verified.','', '## Restored prototype demonstrations','', '- MyHospital: original animated GIF, 368 frames; playback control and still poster.','- KidswearCycle: original animated GIF, 375 frames; playback control and still poster.','', '## Other discovered pages','',...manifest.discoveredPages.filter(p=>p.status==='outside-current-scope').map(p=>`- ${p.url}`)];
report.push('', '## Embedded documents', '');
for(const page of manifest.pages)for(const doc of page.documents||[]){
 report.push(`- **${page.slug}: ${doc.status}** — ${doc.title}${doc.localPath?` → ${doc.localPath}`:''}${doc.error?` (${doc.error})`:''}`);
}
report.push('', '## Image galleries', '', '- Marketing design: all nine social-media carousel images preserved in source order as a responsive gallery. The decorative Google Drive icon is excluded.');
await writeFile('migration/migration-report.md',report.join('\n')+'\n');
