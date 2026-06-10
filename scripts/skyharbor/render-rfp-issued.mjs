import { readFileSync, writeFileSync } from 'node:fs';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, Header, Footer, PageNumber, TableOfContents, LevelFormat, convertInchesToTwip } from 'docx';
const d=JSON.parse(readFileSync('/tmp/skyq/iss.json','utf8')); const H=process.env.HOME;
const ACCENT='23423A', GOLD='8A6D1A', GREY='6B6B6B';
const runs=(t,sz)=>{const o=[];const re=/\*\*(.+?)\*\*/g;let last=0,m;while((m=re.exec(t))){if(m.index>last)o.push(new TextRun({text:t.slice(last,m.index),size:sz}));o.push(new TextRun({text:m[1],bold:true,size:sz}));last=re.lastIndex;}if(last<t.length)o.push(new TextRun({text:t.slice(last),size:sz}));return o.length?o:[new TextRun({text:t,size:sz})];};
const tb={style:BorderStyle.SINGLE,size:2,color:'B8B2A6'},cb={top:tb,bottom:tb,left:tb,right:tb};
const body=[];
// ----- COVER -----
const cover=[
 new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:2600,after:0},children:[new TextRun({text:'SkyHarbor Air',font:'Georgia',size:56,color:ACCENT})]}),
 new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:120,after:0},children:[new TextRun({text:'REQUEST FOR PROPOSAL',font:'Georgia',size:30,color:'1A1A1A'})]}),
 new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:60,after:0},children:[new TextRun({text:'Application Management Services (AMS) & Infrastructure Towers',italics:true,size:26,color:GREY})]}),
 new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:900},children:[new TextRun({text:'CONFIDENTIAL — For Recipient Bidder Use Only',bold:true,size:20,color:GOLD})]}),
 new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:80},children:[new TextRun({text:`Prepared with AbarVa Sentinel + Nexus · ${d.model} · governed evidence`,size:16,color:GREY})]}),
];
// completeness scorecard (after cover, before TOC)
cover.push(new Paragraph({heading:HeadingLevel.HEADING_1,pageBreakBefore:true,children:[new TextRun({text:'Completeness Scorecard',font:'Georgia',size:32,color:ACCENT})]}));
cover.push(new Paragraph({spacing:{after:120},children:runs(`19 sections · ${d.intake_pack.length} require Nexus intake · ${d.client_items.length} require client/legal decisions. Disclosure tier: vendor-facing aggregate only (no incumbent names or spend).`,22)}));
const scRows=[['Mode','#','Meaning'],['AUTO-GOVERNED',String(d.tally.auto_governed),'From de-identified aggregate facts'],['AUTO-TEMPLATE',String(d.tally.auto_template),'Standard boilerplate (client/legal review)'],['ELICIT',String(d.tally.elicit),'Nexus asks scoped intake questions'],['CLIENT-COMPLETE',String(d.tally.client_complete),'Client/legal judgment — guided placeholder']];
cover.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:scRows.map((r,i)=>new TableRow({tableHeader:i===0,children:r.map(c=>new TableCell({borders:cb,shading:i===0?{fill:'F1EFE9'}:undefined,margins:{top:40,bottom:40,left:80,right:80},children:[new Paragraph({children:[new TextRun({text:c,bold:i===0,size:21})]})]}))}))}));
cover.push(new Paragraph({heading:HeadingLevel.HEADING_2,spacing:{before:200},children:[new TextRun({text:'Table of Contents',font:'Georgia',size:26,color:ACCENT})]}));
cover.push(new TableOfContents('Contents',{hyperlink:true,headingStyleRange:'1-1'}));
// ----- BODY -----
const lines=d.rfp_markdown.split('\n');let i=0;
while(i<lines.length){const ln=lines[i];
 if(ln.startsWith('|')&&ln.includes('|',1)){const blk=[];while(i<lines.length&&lines[i].startsWith('|')){blk.push(lines[i]);i++;}const rws=blk.filter(r=>!/^\|?[\s:\-|]+\|?$/.test(r)).map(r=>r.replace(/^\||\|$/g,'').split('|').map(c=>c.trim()));if(rws.length){body.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:rws.map((cs,ri)=>new TableRow({tableHeader:ri===0,children:cs.map(c=>new TableCell({borders:cb,shading:ri===0?{fill:'F1EFE9'}:(ri%2?{fill:'FBFAF7'}:undefined),margins:{top:40,bottom:40,left:90,right:90},children:[new Paragraph({children:runs(c,20)})]}))}))}));body.push(new Paragraph({spacing:{after:120},children:[]}));}continue;}
 i++;
 if(ln.startsWith('## ')) body.push(new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:300,after:80},children:[new TextRun({text:ln.slice(3).replace(/\*\*/g,''),font:'Georgia',size:30,color:ACCENT})]}));
 else if(ln.startsWith('### ')) body.push(new Paragraph({heading:HeadingLevel.HEADING_2,spacing:{before:160,after:60},children:[new TextRun({text:ln.slice(4).replace(/\*\*/g,''),font:'Georgia',size:24,color:'1A1A1A'})]}));
 else if(ln.startsWith('# ')) continue;
 else if(ln.trim()==='---') body.push(new Paragraph({border:{bottom:{color:'D9D4C8',space:1,style:BorderStyle.SINGLE,size:6}},children:[]}));
 else if(/^>\s?/.test(ln)) body.push(new Paragraph({shading:{fill:'F4F1E8'},border:{left:{color:GOLD,space:6,style:BorderStyle.SINGLE,size:18}},spacing:{after:40},indent:{left:120},children:runs(ln.replace(/^>\s?/,''),21)}));
 else if(/^\*.*\*$/.test(ln.trim())&&ln.includes('Purpose')) body.push(new Paragraph({spacing:{after:60},children:[new TextRun({text:ln.replace(/\*/g,''),italics:true,size:20,color:GREY})]}));
 else if(/^\s*[-*]\s+/.test(ln)) body.push(new Paragraph({bullet:{level:0},spacing:{after:40},children:runs(ln.replace(/^\s*[-*]\s+/,''),22)}));
 else if(/^\s*\d+\.\s+/.test(ln)) body.push(new Paragraph({spacing:{after:40},children:runs(ln.trim(),22)}));
 else if(ln.trim()==='') body.push(new Paragraph({spacing:{after:40},children:[]}));
 else body.push(new Paragraph({spacing:{after:90,line:276},children:runs(ln,22)}));
}
// appendices
body.push(new Paragraph({heading:HeadingLevel.HEADING_1,pageBreakBefore:true,children:[new TextRun({text:'Appendix A — Nexus Intake Pack (open items)',font:'Georgia',size:28,color:ACCENT})]}));
body.push(new Paragraph({spacing:{after:80},children:runs('Questions Nexus will ask to finalize the ELICIT sections; answers commit through the governed loader and the sections regenerate as cited content.',22)}));
d.intake_pack.forEach(p=>{body.push(new Paragraph({heading:HeadingLevel.HEADING_2,children:[new TextRun({text:p.section,font:'Georgia',size:22})]}));p.questions.forEach(q=>body.push(new Paragraph({bullet:{level:0},children:runs(q,22)})));});
body.push(new Paragraph({heading:HeadingLevel.HEADING_1,pageBreakBefore:true,children:[new TextRun({text:'Appendix B — Client / Legal Decisions Required',font:'Georgia',size:28,color:ACCENT})]}));
d.client_items.forEach(c=>{body.push(new Paragraph({heading:HeadingLevel.HEADING_2,children:[new TextRun({text:c.section,font:'Georgia',size:22})]}));body.push(new Paragraph({children:runs(c.decision,22)}));});
const hdr=new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:'SkyHarbor Air — AMS RFP · Confidential',size:16,color:GREY})]})]});
const ftr=new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Confidential — For Recipient Bidder Use Only   |   Page ',size:16,color:GREY}),new TextRun({children:[PageNumber.CURRENT],size:16,color:GREY})]})]});
const doc=new Document({
 features:{updateFields:true},
 styles:{default:{document:{run:{font:'Calibri',size:22}}},paragraphStyles:[{id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',quickFormat:true,run:{size:30,bold:false,color:ACCENT,font:'Georgia'}},{id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',quickFormat:true,run:{size:24,color:'1A1A1A',font:'Georgia'}}]},
 sections:[
  {properties:{page:{margin:{top:convertInchesToTwip(1),bottom:convertInchesToTwip(1),left:convertInchesToTwip(1),right:convertInchesToTwip(1)}}},children:cover},
  {properties:{page:{margin:{top:convertInchesToTwip(1),bottom:convertInchesToTwip(1),left:convertInchesToTwip(1),right:convertInchesToTwip(1)}}},headers:{default:hdr},footers:{default:ftr},children:body}
 ]});
writeFileSync(`${H}/Downloads/SkyHarbor_AMS_RFP_ISSUED.docx`, await Packer.toBuffer(doc));
console.log('rendered issued RFP DOCX (cover+TOC+header/footer+11pt+banded tables)');
