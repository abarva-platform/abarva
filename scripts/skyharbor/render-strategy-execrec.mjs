import { readFileSync, writeFileSync } from 'node:fs';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import PptxGenJS from 'pptxgenjs';
const d=JSON.parse(readFileSync('/tmp/skyq/se.json','utf8')); const H=process.env.HOME;
const ACCENT='23423A', GOLD='9A7B2E', INK='1A1A1A';

// ---------- markdown -> DOCX (narrative) ----------
const runs=(t)=>{const o=[];const re=/\*\*(.+?)\*\*/g;let last=0,m;while((m=re.exec(t))){if(m.index>last)o.push(new TextRun(t.slice(last,m.index)));o.push(new TextRun({text:m[1],bold:true}));last=re.lastIndex;}if(last<t.length)o.push(new TextRun(t.slice(last)));return o.length?o:[new TextRun(t)];};
function md2docx(md,title){ const ch=[];const lines=md.split('\n');let i=0;const tb={style:BorderStyle.SINGLE,size:1,color:'CCCCCC'};const cb={top:tb,bottom:tb,left:tb,right:tb};
 while(i<lines.length){const ln=lines[i];
  if(ln.startsWith('|')&&ln.includes('|',1)){const blk=[];while(i<lines.length&&lines[i].startsWith('|')){blk.push(lines[i]);i++;}const rws=blk.filter(r=>!/^\|?[\s:\-|]+\|?$/.test(r)).map(r=>r.replace(/^\||\|$/g,'').split('|').map(c=>c.trim()));if(rws.length){ch.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:rws.map(cs=>new TableRow({children:cs.map(c=>new TableCell({borders:cb,children:[new Paragraph({children:runs(c),spacing:{before:20,after:20}})]}))}))}));ch.push(new Paragraph(''));}continue;}
  i++;
  if(ln.startsWith('## ')) ch.push(new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:220,after:70},children:runs(ln.slice(3))}));
  else if(ln.startsWith('# ')) ch.push(new Paragraph({heading:HeadingLevel.TITLE,children:runs(ln.slice(2))}));
  else if(ln.trim()==='---') ch.push(new Paragraph({border:{bottom:{color:'999999',space:1,style:BorderStyle.SINGLE,size:6}},children:[]}));
  else if(/^\s*[-*]\s+/.test(ln)) ch.push(new Paragraph({bullet:{level:0},children:runs(ln.replace(/^\s*[-*]\s+/,''))}));
  else if(ln.trim()==='') ch.push(new Paragraph(''));
  else ch.push(new Paragraph({children:runs(ln),spacing:{after:80}}));
 }
 ch.push(new Paragraph({heading:HeadingLevel.HEADING_1,text:'Appendix — Source Register (governed evidence)',pageBreakBefore:true}));
 d.source_register.forEach(r=>ch.push(new Paragraph({children:runs(`[${r.n}] ${r.type||''} — ${r.doc}`),spacing:{after:30}})));
 return new Document({styles:{default:{document:{run:{font:'Calibri',size:21}}}},sections:[{children:ch}]});
}
const sbuf=await Packer.toBuffer(md2docx(d.strategy_markdown,'Strategy')); writeFileSync(`${H}/Downloads/SkyHarbor_AMS_Strategy_Memo.docx`, sbuf);

// ---------- markdown slides -> PPTX ----------
function slidesFromMd(md){ const out=[];let cur=null; for(const ln of md.split('\n')){
  let m=ln.match(/^#{1,3}\s+(.*)/);
  if(m){ if(cur)out.push(cur); cur={title:m[1].replace(/\*\*/g,''),bullets:[]}; continue; }
  let b=ln.match(/^\s*[-*]\s+(.*)/);
  if(b&&cur){ cur.bullets.push(b[1].replace(/\*\*/g,'')); continue; }
  if(ln.trim()&&cur&&cur.bullets.length===0){ cur.bullets.push(ln.replace(/\*\*/g,'').trim()); }
 } if(cur)out.push(cur); return out; }
function buildPptx(slides,deckTitle,sub){ const p=new PptxGenJS(); p.defineLayout({name:'W',width:13.33,height:7.5}); p.layout='W';
 const t=p.addSlide(); t.background={color:'F8F7F4'};
 t.addText(deckTitle,{x:0.6,y:2.6,w:12,h:1.2,fontSize:34,bold:true,color:ACCENT,fontFace:'Georgia'});
 t.addText(sub,{x:0.6,y:3.9,w:12,h:0.6,fontSize:16,color:'6B6B6B'});
 t.addText('SkyHarbor Air · governed evidence · synthetic',{x:0.6,y:6.7,w:12,h:0.4,fontSize:11,color:'9A7B2E'});
 for(const s of slides){ const sl=p.addSlide(); sl.background={color:'F8F7F4'};
  sl.addText(s.title,{x:0.6,y:0.4,w:12.1,h:0.9,fontSize:22,bold:true,color:ACCENT,fontFace:'Georgia'});
  sl.addShape(p.ShapeType.line,{x:0.6,y:1.35,w:12.1,h:0,line:{color:GOLD,width:1.5}});
  const items=s.bullets.slice(0,7).map(b=>({text:b,options:{fontSize:15,color:INK,bullet:{indent:18},paraSpaceAfter:8}}));
  if(items.length) sl.addText(items,{x:0.7,y:1.6,w:11.9,h:5.4,valign:'top'});
 }
 return p; }
await buildPptx(slidesFromMd(d.execrec_slides),'AMS Executive Recommendation','Board decision paper — SkyHarbor Air').writeFile({fileName:`${H}/Downloads/SkyHarbor_AMS_Executive_Recommendation.pptx`});
// strategy exec readout PPTX (section titles + their bullets/first line)
await buildPptx(slidesFromMd(d.strategy_markdown),'AMS Sourcing Strategy','Executive readout — SkyHarbor Air').writeFile({fileName:`${H}/Downloads/SkyHarbor_AMS_Strategy_Readout.pptx`});
console.log('rendered: Strategy DOCX, Strategy readout PPTX, Exec rec PPTX');
