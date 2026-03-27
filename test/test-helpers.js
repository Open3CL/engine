import fs from 'node:fs';
import { xmlParser } from '../src/utils.js';

export async function getAdemeFileJsonOrDownload(dpeCode) {
  if (!process.env.ADEME_CLIENT_ID || !process.env.ADEME_CLIENT_SECRET) {
    throw new Error(`ADEME_CLIENT_ID and ADEME_CLIENT_SECRET environment variables are not set !`);
  }
  const dpeJsonFilePath = `test/fixtures/${dpeCode}.json`;
  let dpe = getAdemeFileJson(dpeCode);
  if (!dpe || !fs.existsSync(dpeJsonFilePath)) {
    const response = await fetch(
      `https://prd-x-ademe-externe-api.de-c1.eu1.cloudhub.io/api/v1/pub/dpe/${dpeCode}`,
      {
        headers: {
          client_id: process.env.ADEME_CLIENT_ID,
          client_secret: process.env.ADEME_CLIENT_SECRET,
          'Content-Type': 'application/json'
        }
      }
    );
    if (response.status !== 200) {
      throw new Error(`Fail to retrieve DPE from ademe: ${dpeCode}`);
    }
    const dpeResponse = await response.json();
    dpe = dpeResponse.dpe;
    fs.writeFileSync(dpeJsonFilePath, JSON.stringify(dpe));
  }
  return dpe;
}

export function getAdemeFileJson(dpeCode) {
  const dpeJsonFilePath = `test/fixtures/${dpeCode}.json`;
  const dpeXmlFilePath = `test/fixtures/${dpeCode}.xml`;
  let dpeRequest;

  if (fs.existsSync(dpeJsonFilePath)) {
    dpeRequest = JSON.parse(fs.readFileSync(dpeJsonFilePath, { encoding: 'utf8', flag: 'r' }));
  } else if (fs.existsSync(dpeXmlFilePath)) {
    const data = fs.readFileSync(dpeXmlFilePath, { encoding: 'utf8', flag: 'r' });
    dpeRequest = xmlParser.parse(data).dpe;
    fs.writeFileSync(dpeJsonFilePath, JSON.stringify(dpeRequest));
  }

  return dpeRequest;
}

export function saveResultFile(ademeId, result) {
  const dpeResultFile = `test/fixtures/${ademeId}-result.json`;
  fs.writeFileSync(dpeResultFile, JSON.stringify(result));
}

export function getResultFile(ademeId) {
  const dpeResultFile = `test/fixtures/${ademeId}-result.json`;
  const data = fs.readFileSync(dpeResultFile, { encoding: 'utf8', flag: 'r' });
  return JSON.parse(data);
}
