import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ShadingType } from 'docx';
import { readFileSync, writeFileSync } from 'fs';

const md = readFileSync('PRD.md', 'utf-8');
const lines = md.split('\n');

const PRIMARY = '6B2D3E';
const GRAY = 'F0EBE3';
const INK = '1A1714';

function makeHeading(text, level) {
  const sizes = { 1: 36, 2: 28, 3: 24 };
  const sz = sizes[level] || 22;
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: sz, color: level === 1 ? PRIMARY : INK })],
    heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
    spacing: { before: level === 1 ? 480 : 320, after: 120 },
  });
}

function makeParagraph(text) {
  // Handle inline bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const runs = parts.map(p => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return new TextRun({ text: p.slice(2, -2), bold: true, size: 22, color: INK });
    }
    // Remove markdown links/formatting
    const clean = p.replace(/~~([^~]+)~~/g, '$1').replace(/`([^`]+)`/g, '$1');
    return new TextRun({ text: clean, size: 22, color: INK });
  });
  return new Paragraph({ children: runs, spacing: { after: 80 } });
}

function makeBullet(text, level = 0) {
  const clean = text.replace(/^\s*[-*]\s*/, '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/~~([^~]+)~~/g, '$1');
  return new Paragraph({
    children: [new TextRun({ text: clean, size: 22, color: INK })],
    bullet: { level },
    spacing: { after: 60 },
  });
}

function makeNumbered(text, num) {
  const clean = text.replace(/^\d+\.\s*/, '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1');
  return new Paragraph({
    children: [new TextRun({ text: clean, size: 22, color: INK })],
    numbering: { reference: 'main-numbering', level: 0 },
    spacing: { after: 80 },
  });
}

function makeCode(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Courier New', size: 18, color: '555555' })],
    spacing: { after: 40 },
    shading: { type: ShadingType.CLEAR, fill: 'F5F5F5' },
    indent: { left: 400 },
  });
}

function makeHr() {
  return new Paragraph({
    children: [new TextRun({ text: '' })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D4B8BE', space: 1 } },
    spacing: { before: 200, after: 200 },
  });
}

// Parse table
function parseTable(tableLines) {
  const rows = tableLines.filter(l => l.trim().startsWith('|') && !l.match(/^\|[-|: ]+\|$/));
  if (rows.length === 0) return [];

  const tableRows = rows.map((row, rowIdx) => {
    const cells = row.split('|').slice(1, -1).map(c => c.trim());
    return new TableRow({
      children: cells.map(cellText => {
        const clean = cellText.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/~~([^~]+)~~/g, '$1');
        return new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: clean, size: 20, bold: rowIdx === 0, color: rowIdx === 0 ? 'FFFFFF' : INK })],
            spacing: { before: 60, after: 60 },
            alignment: AlignmentType.LEFT,
          })],
          shading: rowIdx === 0 ? { type: ShadingType.CLEAR, fill: PRIMARY } : rowIdx % 2 === 0 ? { type: ShadingType.CLEAR, fill: GRAY } : { type: ShadingType.CLEAR, fill: 'FFFFFF' },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
        });
      }),
    });
  });

  return [new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: { top: 80, bottom: 80, left: 0, right: 0 },
  }), new Paragraph({ children: [new TextRun('')], spacing: { after: 160 } })];
}

const children = [];
let i = 0;
let inCodeBlock = false;
let inTable = false;
let tableBuffer = [];
let inNumberedSection = false;

while (i < lines.length) {
  const line = lines[i];

  // Code block
  if (line.startsWith('```')) {
    if (!inCodeBlock) {
      inCodeBlock = true;
      i++;
      continue;
    } else {
      inCodeBlock = false;
      i++;
      continue;
    }
  }
  if (inCodeBlock) {
    children.push(makeCode(line));
    i++;
    continue;
  }

  // Table detection
  if (line.trim().startsWith('|')) {
    tableBuffer.push(line);
    i++;
    continue;
  } else if (tableBuffer.length > 0) {
    children.push(...parseTable(tableBuffer));
    tableBuffer = [];
  }

  // HR
  if (line.trim() === '---') {
    children.push(makeHr());
    i++;
    continue;
  }

  // Headings
  if (line.startsWith('### ')) {
    children.push(makeHeading(line.slice(4), 3));
    i++;
    continue;
  }
  if (line.startsWith('## ')) {
    children.push(makeHeading(line.slice(3), 2));
    i++;
    continue;
  }
  if (line.startsWith('# ')) {
    children.push(makeHeading(line.slice(2), 1));
    i++;
    continue;
  }

  // Metadata lines (version/date/status)
  if (line.startsWith('**版本') || line.startsWith('**日期') || line.startsWith('**状态')) {
    const clean = line.replace(/\*\*([^*]+)\*\*/g, '$1');
    children.push(new Paragraph({
      children: [new TextRun({ text: clean, size: 20, color: '777777', italics: true })],
      spacing: { after: 40 },
    }));
    i++;
    continue;
  }

  // Numbered list
  if (/^\d+\.\s/.test(line)) {
    children.push(makeNumbered(line));
    i++;
    continue;
  }

  // Bullet list
  if (/^\s*[-*]\s/.test(line)) {
    const level = line.match(/^(\s*)/)[1].length > 0 ? 1 : 0;
    children.push(makeBullet(line, level));
    i++;
    continue;
  }

  // Empty line
  if (line.trim() === '') {
    i++;
    continue;
  }

  // Bold standalone line (section title in bold)
  if (line.startsWith('**') && line.endsWith('**')) {
    children.push(new Paragraph({
      children: [new TextRun({ text: line.slice(2, -2), bold: true, size: 22, color: PRIMARY })],
      spacing: { before: 200, after: 80 },
    }));
    i++;
    continue;
  }

  // Regular paragraph
  children.push(makeParagraph(line));
  i++;
}

// Flush remaining table
if (tableBuffer.length > 0) {
  children.push(...parseTable(tableBuffer));
}

const doc = new Document({
  numbering: {
    config: [{
      reference: 'main-numbering',
      levels: [{
        level: 0,
        format: 'decimal',
        text: '%1.',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 400, hanging: 300 } } },
      }],
    }],
  },
  styles: {
    default: {
      document: {
        run: { font: 'Microsoft YaHei', size: 22, color: INK },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, bottom: 1440, left: 1800, right: 1800 },
      },
    },
    children,
  }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync('PRD.docx', buffer);
console.log('✅ PRD.docx 已生成：C:\\Users\\zhouchen\\luolai-pdca\\PRD.docx');
