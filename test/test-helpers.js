import { XMLParser } from 'fast-xml-parser';
import fs from 'node:fs';

const xmlParser = new XMLParser({
  // We want to make sure collections of length 1 are still parsed as arrays
  isArray: (name) => {
    const collectionNames = [
      'mur',
      'plancher_bas',
      'plancher_haut',
      'baie_vitree',
      'porte',
      'pont_thermique',
      'ventilation',
      'installation_ecs',
      'generateur_ecs',
      'climatisation',
      'installation_chauffage',
      'generateur_chauffage',
      'emetteur_chauffage',
      'sortie_par_energie'
    ];
    if (collectionNames.includes(name)) return true;
  },
  tagValueProcessor: (tagName, val) => {
    if (tagName.startsWith('enum_')) {
      // Preserve value as string for tags starting with "enum_"
      return null;
    }
    if (Number.isNaN(Number(val))) return val;
    return Number(val);
  }
});

export function parseXml(data) {
  return xmlParser.parse(data).dpe;
}

export async function getAdemeFileJsonOrDownload(dpeCode) {
  if (!process.env.ADEME_CLIENT_ID || !process.env.ADEME_CLIENT_SECRET) {
    throw new Error(`ADEME_CLIENT_ID and ADEME_CLIENT_SECRET environment variables are not set !`);
  }
  const dpeJsonFilePath = `test/fixtures/${dpeCode}.json`;
  const dpeXmlFilePath = `test/fixtures/${dpeCode}.xml`;
  let dpe = getAdemeFileJson(dpeCode);
  if (!dpe) {
    const response = await fetch(
      `https://prd-x-ademe-externe-api.de-c1.eu1.cloudhub.io/api/v1/pub/dpe/${dpeCode}/xml`,
      {
        headers: {
          client_id: process.env.ADEME_CLIENT_ID,
          client_secret: process.env.ADEME_CLIENT_SECRET
        }
      }
    );
    if (response.status !== 200) {
      throw new Error(`Fail to retrieve DPE from ademe: ${dpeCode}`);
    }
    const body = await response.text();
    fs.writeFileSync(dpeXmlFilePath, body, { encoding: 'utf-8' });
    dpe = xmlParser.parse(body).dpe;
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
