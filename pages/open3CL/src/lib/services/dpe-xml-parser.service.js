import { XMLParser } from 'fast-xml-parser';

const xmlParser = new XMLParser({
  isArray: (name) =>
    [
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
    ].includes(name),
  tagValueProcessor: (tagName, val) => {
    if (tagName.startsWith('enum_')) {
      // Preserve value as string for tags starting with "enum_"
      return null;
    }
    if (Number.isNaN(Number(val))) return val;
    return Number(val);
  }
});

export class DpeXmlParserService {
  /**
   * @param xmlContent {string}
   */
  static convertFileToJson(xmlContent) {
    return xmlParser.parse(xmlContent).dpe;
  }
}
