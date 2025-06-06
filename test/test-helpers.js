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

export function getAdemeFileJson(ademeId) {
  const dpeRequestFile = `test/fixtures/${ademeId}.json`;
  const dpeFile = `test/fixtures/${ademeId}.xml`;
  let dpeRequest;

  if (fs.existsSync(dpeRequestFile)) {
    dpeRequest = JSON.parse(fs.readFileSync(dpeRequestFile, { encoding: 'utf8', flag: 'r' }));
  } else {
    const data = fs.readFileSync(dpeFile, { encoding: 'utf8', flag: 'r' });
    dpeRequest = xmlParser.parse(data).dpe;
    fs.writeFileSync(dpeRequestFile, JSON.stringify(dpeRequest));
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
