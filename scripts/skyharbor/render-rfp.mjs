import { readFileSync, writeFileSync } from 'node:fs';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import ExcelJS from 'exceljs';
const d = JSON.parse(readFileSync('/tmp/skyq/rfp.json','utf8'));
const md = d.rfp_markdown, ex = d.exhibits, reg = d.source_register;
const HOME = process.env.HOME;

// ---- markdown -> docx ----
const runs = (text) => { const out=[]; const re=/\*\*(.+?)\*\*/g; let last=0,m;
  while((m=re.exec(text))){ if(m.index>last) out.push(new TextRun(text.slice(last,m.index))); out.push(new TextRun({text:m[1],bold:true})); last=re.lastIndex; }
  if(last<text.length) out.push(new TextRun(text.slice(last))); return out.length?out:[new TextRun(text)]; };
const children=[]; const lines=md.split('\n'); let i=0;
const thin={style:BorderStyle.SINGLE,size:1,color:'CCCCCC'};
const cellBorders={top:thin,bottom:thin,left:thin,right:thin};
while(i<lines.length){ const ln=lines[i];
  if(ln.startsWith('| ')&&ln.includes('|',2)){ const block=[]; while(i<lines.length&&lines[i].startsWith('|')){block.push(lines[i]);i++;}
    const rowsRaw=block.filter(r=>!/^\|[\s:\-|]+\|?$/.test(r)).map(r=>r.replace(/^\||\|$/g,'').split('|').map(c=>c.trim()));
    if(rowsRaw.length){ const trs=rowsRaw.map((cells,ri)=>new TableRow({children:cells.map(c=>new TableCell({borders:cellBorders,width:{size:100/cells.length,type:WidthType.PERCENTAGE},children:[new Paragraph({children:runs(c),spacing:{before:20,after:20}})]}))}));
      children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:trs})); children.push(new Paragraph({text:'',spacing:{after:120}})); }
    continue; }
  i++;
  if(ln.startsWith('### ')) children.push(new Paragraph({heading:HeadingLevel.HEADING_2,children:runs(ln.slice(4))}));
  else if(ln.startsWith('## ')) children.push(new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:240,after:80},children:runs(ln.slice(3))}));
  else if(ln.startsWith('# ')) children.push(new Paragraph({heading:HeadingLevel.TITLE,children:runs(ln.slice(2))}));
  else if(ln.trim()==='---') children.push(new Paragraph({border:{bottom:{color:'999999',space:1,style:BorderStyle.SINGLE,size:6}},children:[]}));
  else if(/^\s*[-*]\s+/.test(ln)) children.push(new Paragraph({bullet:{level:0},children:runs(ln.replace(/^\s*[-*]\s+/,''))}));
  else if(/^\s*\d+\.\s+/.test(ln)) children.push(new Paragraph({numbering:{reference:'num',level:0},children:runs(ln.replace(/^\s*\d+\.\s+/,''))}));
  else if(ln.trim()==='') children.push(new Paragraph(''));
  else children.push(new Paragraph({children:runs(ln),spacing:{after:80}}));
}
// appendix: source register
children.push(new Paragraph({heading:HeadingLevel.HEADING_1,text:'Appendix — Source Register (governed evidence)',pageBreakBefore:true}));
reg.forEach(r=>children.push(new Paragraph({children:runs(`[${r.n}] ${r.type||''} — ${r.doc} (chunk ${r.chunk_id})`),spacing:{after:40}})));
const doc=new Document({numbering:{config:[{reference:'num',levels:[{level:0,format:'decimal',text:'%1.',alignment:AlignmentType.START}]}]},
  styles:{default:{document:{run:{font:'Calibri',size:21}}}},
  sections:[{children}]});
const buf=await Packer.toBuffer(doc); writeFileSync(`${HOME}/Downloads/SkyHarbor_AMS_RFP.docx`, buf);

// ---- XLSX companions: pricing template + SLA schedule ----
const wb=new ExcelJS.Workbook();
const p=wb.addWorksheet('Pricing Template');
p.addRow(d.pricing_template.columns); p.getRow(1).font={bold:true};
d.pricing_template.towers.forEach(t=>p.addRow([t,'','','','','','']));
p.columns.forEach(c=>c.width=20);
const s=wb.addWorksheet('SLA Schedule');
s.addRow(['Tower','Metric','Target','Current actual','Breaches','Credit-at-risk USD']); s.getRow(1).font={bold:true};
ex.sla.forEach(r=>s.addRow([r.tower,r.metric,r.target,r.actual,r.breaches,r.credit]));
s.getColumn(6).numFmt='$#,##0'; s.columns.forEach(c=>c.width=18);
const v=wb.addWorksheet('Vendor Baseline');
v.addRow(['Vendor','Annual USD','Renewal','Scope']); v.getRow(1).font={bold:true};
ex.vendor_top.forEach(r=>v.addRow([r.vendor,r.annual,r.renewal,r.scope])); v.getColumn(2).numFmt='$#,##0'; v.columns.forEach(c=>c.width=22);
await wb.xlsx.writeFile(`${HOME}/Downloads/SkyHarbor_AMS_RFP_Companions.xlsx`);

console.log('rendered DOCX + XLSX');
