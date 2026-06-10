import { readFileSync, writeFileSync } from 'node:fs';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';
const d=JSON.parse(readFileSync('/tmp/skyq/rm.json','utf8')); const H=process.env.HOME;
const runs=(t)=>{const o=[];const re=/\*\*(.+?)\*\*/g;let last=0,m;while((m=re.exec(t))){if(m.index>last)o.push(new TextRun(t.slice(last,m.index)));o.push(new TextRun({text:m[1],bold:true}));last=re.lastIndex;}if(last<t.length)o.push(new TextRun(t.slice(last)));return o.length?o:[new TextRun(t)];};
const tb={style:BorderStyle.SINGLE,size:1,color:'CCCCCC'},cb={top:tb,bottom:tb,left:tb,right:tb};
const ch=[];
// cover
ch.push(new Paragraph({heading:HeadingLevel.TITLE,children:[new TextRun({text:'SkyHarbor Air',color:'23423A'})]}));
ch.push(new Paragraph({children:[new TextRun({text:'Application Management Services (AMS) — Request for Proposal',italics:true,size:26})],spacing:{after:120}}));
ch.push(new Paragraph({children:runs(`Generated with AbarVa Sentinel + Nexus on ${d.model}. Governed facts cited [n]; template and elicitation content flagged per section.`),spacing:{after:160}}));
// completeness scorecard
ch.push(new Paragraph({heading:HeadingLevel.HEADING_1,text:'Completeness Scorecard'}));
ch.push(new Paragraph({children:runs(`14 sections · ${d.intake_pack.length} require Nexus intake · ${d.client_items.length} require client decisions.`),spacing:{after:80}}));
const scRows=[['Mode','Sections','Meaning']].concat([
 ['AUTO-GOVERNED',String(d.tally.auto_governed),'Written from cited agent_ready client facts'],
 ['AUTO-TEMPLATE',String(d.tally.auto_template),'Standard boilerplate (client to review)'],
 ['ELICIT',String(d.tally.elicit),'Nexus asks scoped intake questions to finalize'],
 ['CLIENT-COMPLETE',String(d.tally.client_complete),'Client judgment/policy — guided placeholder'],
]);
ch.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:scRows.map((r,i)=>new TableRow({children:r.map(c=>new TableCell({borders:cb,children:[new Paragraph({children:[new TextRun({text:c,bold:i===0})]})]}))}))}));
ch.push(new Paragraph({heading:HeadingLevel.HEADING_1,text:'Section status',spacing:{before:160}}));
d.sections.forEach(s=>ch.push(new Paragraph({children:runs(`${s.n}. ${s.title} — **${s.mode}**`),spacing:{after:20}})));
// RFP body
ch.push(new Paragraph({heading:HeadingLevel.TITLE,text:'Request for Proposal',pageBreakBefore:true}));
const lines=d.rfp_markdown.split('\n');let i=0;
while(i<lines.length){const ln=lines[i];
 if(ln.startsWith('|')&&ln.includes('|',1)){const blk=[];while(i<lines.length&&lines[i].startsWith('|')){blk.push(lines[i]);i++;}const rws=blk.filter(r=>!/^\|?[\s:\-|]+\|?$/.test(r)).map(r=>r.replace(/^\||\|$/g,'').split('|').map(c=>c.trim()));if(rws.length){ch.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:rws.map(cs=>new TableRow({children:cs.map(c=>new TableCell({borders:cb,children:[new Paragraph({children:runs(c),spacing:{before:20,after:20}})]}))}))}));ch.push(new Paragraph(''));}continue;}
 i++;
 if(ln.startsWith('## ')) ch.push(new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:220,after:60},children:runs(ln.slice(3))}));
 else if(ln.startsWith('### ')) ch.push(new Paragraph({heading:HeadingLevel.HEADING_2,children:runs(ln.slice(4))}));
 else if(ln.startsWith('# ')) ch.push(new Paragraph({heading:HeadingLevel.HEADING_1,children:runs(ln.slice(2))}));
 else if(ln.trim()==='---') ch.push(new Paragraph({border:{bottom:{color:'999999',space:1,style:BorderStyle.SINGLE,size:6}},children:[]}));
 else if(/^>\s?/.test(ln)) ch.push(new Paragraph({shading:{fill:'F1EFE9'},children:runs(ln.replace(/^>\s?/,'')),spacing:{after:30}}));
 else if(/^\s*[-*]\s+/.test(ln)) ch.push(new Paragraph({bullet:{level:0},children:runs(ln.replace(/^\s*[-*]\s+/,''))}));
 else if(/^\s*\d+\.\s+/.test(ln)) ch.push(new Paragraph({children:runs(ln.trim())}));
 else if(ln.trim()==='') ch.push(new Paragraph(''));
 else ch.push(new Paragraph({children:runs(ln),spacing:{after:70}}));
}
// intake pack appendix
ch.push(new Paragraph({heading:HeadingLevel.TITLE,text:'Appendix A — Nexus Intake Pack (open items)',pageBreakBefore:true}));
ch.push(new Paragraph({children:runs('The questions Nexus will ask to finalize the ELICIT sections. Answers commit through the governed loader and the sections regenerate as cited content.'),spacing:{after:80}}));
d.intake_pack.forEach(p=>{ch.push(new Paragraph({heading:HeadingLevel.HEADING_2,text:p.section}));p.questions.forEach(q=>ch.push(new Paragraph({bullet:{level:0},children:runs(q)})));});
ch.push(new Paragraph({heading:HeadingLevel.TITLE,text:'Appendix B — Client-to-Complete decisions',pageBreakBefore:true}));
d.client_items.forEach(c=>{ch.push(new Paragraph({heading:HeadingLevel.HEADING_2,text:c.section}));ch.push(new Paragraph({children:runs(c.decision)}));});
ch.push(new Paragraph({heading:HeadingLevel.TITLE,text:'Appendix C — Source Register (governed evidence)',pageBreakBefore:true}));
d.source_register.forEach(r=>ch.push(new Paragraph({children:runs(`[${r.n}] ${r.type||''} — ${r.doc}`),spacing:{after:24}})));
const doc=new Document({styles:{default:{document:{run:{font:'Calibri',size:21}}}},sections:[{children:ch}]});
writeFileSync(`${H}/Downloads/SkyHarbor_AMS_RFP_v2_Issuable.docx`, await Packer.toBuffer(doc));
console.log('rendered issuable RFP DOCX with scorecard + intake pack');
