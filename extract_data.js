const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

function extractData() {
  // 1. 提取化验值 (糖度、酸度等)
  const chemDataPath = path.join(dataDir, '1 化验值 滴定法.xlsx');
  const chemWorkbook = xlsx.readFile(chemDataPath);
  const chemSheet = chemWorkbook.Sheets[chemWorkbook.SheetNames[0]];
  const chemData = xlsx.utils.sheet_to_json(chemSheet, { header: 1 });
  
  // 提取前 10 个样本的糖度、酸度
  const sampleChemData = chemData.slice(1, 11).map(row => ({
    id: row[0],
    ssc: row[1], // 糖度
    ta: row[2],  // 酸度
    ratio: row[3], // 糖酸比
    vc: row[4]   // VC
  }));

  // 2. 提取光谱数据 (澄迈福橙 HSI)
  const hsiCMPath = path.join(dataDir, '3 HSI澄迈福橙数据整理_平均值.xlsx');
  const hsiCMWorkbook = xlsx.readFile(hsiCMPath);
  const hsiCMSheet = hsiCMWorkbook.Sheets[hsiCMWorkbook.SheetNames[0]];
  const hsiCMData = xlsx.utils.sheet_to_json(hsiCMSheet, { header: 1 });
  
  const wavelengths = hsiCMData[0].slice(1, 101); // 取前 100 个波长作为示例
  const cmSpectrum = hsiCMData[1].slice(1, 101); // 取第一个样本的光谱数据

  // 3. 提取光谱数据 (琼中绿橙 HSI)
  const hsiQZPath = path.join(dataDir, '4 HSI琼中绿橙数据整理_平均值.xlsx');
  const hsiQZWorkbook = xlsx.readFile(hsiQZPath);
  const hsiQZSheet = hsiQZWorkbook.Sheets[hsiQZWorkbook.SheetNames[0]];
  const hsiQZData = xlsx.utils.sheet_to_json(hsiQZSheet, { header: 1 });
  
  const qzSpectrum = hsiQZData[1].slice(1, 101); // 取第一个样本的光谱数据

  const output = {
    chemData: sampleChemData,
    spectrum: {
      wavelengths,
      cm: cmSpectrum,
      qz: qzSpectrum
    }
  };

  fs.writeFileSync(path.join(__dirname, 'src/lib/mockData.json'), JSON.stringify(output, null, 2));
  console.log('Data extracted to src/lib/mockData.json');
}

extractData();
