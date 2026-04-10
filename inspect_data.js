const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

function inspectExcel(filename) {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filename}`);
    return;
  }
  
  console.log(`\n--- Inspecting ${filename} ---`);
  const workbook = xlsx.readFile(filePath);
  console.log(`Sheet Names: ${workbook.SheetNames.join(', ')}`);
  
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  console.log(`Total rows: ${data.length}`);
  if (data.length > 0) {
    console.log('First row (headers/data):', Object.keys(data[0]));
    console.log('First row values:', data[0]);
  }
}

const files = [
  '1 化验值 滴定法.xlsx',
  '2 液质 糖+有机酸+氨基酸.xlsx',
  '3 HSI澄迈福橙数据整理_平均值.xlsx',
  '4 HSI琼中绿橙数据整理_平均值.xlsx',
  '5 R210 CM1-200.xlsx',
  '6 R210 QZ 1-200.xlsx',
  '7 S960 CM1-200 去波段对齐.xlsx',
  '8 S960 QZ 1-200.xlsx'
];

files.forEach(inspectExcel);
