import { set_bug_for_bug_compat, set_tv_match_optimized_version } from '../../src/utils.js';
import { calcul_3cl } from '../../src/index.js';
import { XMLParser } from 'fast-xml-parser';
import { existsSync, writeFileSync } from 'node:fs';
import enums from '../../src/enums.js';
import { readFileSync } from 'fs';
import { get } from 'lodash-es';
import { parentPort } from 'node:worker_threads';
import {
  DPE_PROPERTIES_TO_CHECK,
  DPE_PROPERTIES_TO_VALIDATE,
  setLoggerOff,
  setLoggerOn
} from './corpus_utils.js';

const DIFF_VALUE_THRESHOLD = 5;

const xmlParser = new XMLParser({
  // We want to make sure collections of length 1 are still parsed as arrays
  isArray: (name, jpath, isLeafNode, isAttribute) => {
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

/**
 * Ajout des informations id et label des générateurs ECS et CH dans le fichier de sortie
 * @param inputDpe {FullDpe}
 * @param csvOutputDpe {Array}
 */
const addGenerateurs = (inputDpe, csvOutputDpe) => {
  ['ecs', 'chauffage'].forEach((type) => {
    const typeGenerateur = `type_generateur_${type === 'ecs' ? 'ecs' : 'ch'}`;
    const generateurCollection = `generateur_${type}_collection`;
    const generateur = `generateur_${type}`;

    const installations =
      inputDpe.logement[`installation_${type}_collection`][`installation_${type}`];

    if (installations) {
      const generateurs =
        installations[0][generateurCollection][generateur][0].donnee_entree[
          `enum_${typeGenerateur}_id`
        ];

      csvOutputDpe.push(generateurs);
      csvOutputDpe.push(enums[typeGenerateur][generateurs]);

      if (installations.length > 1) {
        const generateur2 =
          installations[1][generateurCollection][generateur][0].donnee_entree[
            `enum_${typeGenerateur}_id`
          ];
        csvOutputDpe.push(generateur2);
        csvOutputDpe.push(enums[typeGenerateur][generateur2]);
      } else {
        csvOutputDpe.push('');
        csvOutputDpe.push('');
      }
    }
  });
};

/**
 * @param inputDpe {FullDpe}
 * @param outputDpe {FullDpe}
 * @param propertyPath {string}
 * @param dpeOutput {any}
 * @return {number}
 */
const getDpeOutputValueDiff = (inputDpe, outputDpe, propertyPath, dpeOutput) => {
  let originalValue = parseFloat(get(inputDpe, propertyPath));
  const outputValue = outputDpe ? parseFloat(get(outputDpe, propertyPath)) : undefined;

  if (propertyPath.indexOf('m2') !== -1) {
    originalValue = Math.floor(originalValue);
  }

  const diff =
    originalValue !== 0
      ? Number(((Math.abs(originalValue - outputValue) / originalValue) * 100).toFixed(2))
      : outputValue === 0
        ? 0
        : 100;

  if (dpeOutput) {
    dpeOutput.push(originalValue);
    dpeOutput.push(isNaN(outputValue) ? 'ERROR' : outputValue);
    dpeOutput.push(isNaN(diff) ? 'ERROR' : diff);
  }

  return diff;
};

/**
 * @param inputDpe {FullDpe}
 * @param dpeOutputs {object[]}
 */
const runEngineAndVerifyOutput = (inputDpe, dpeOutputs) => {
  let outputDpe;
  let csvOutputDpe = [
    inputDpe.numero_dpe,
    inputDpe.logement.caracteristique_generale.enum_methode_application_dpe_log_id,
    inputDpe.administratif.enum_version_id,
    inputDpe.administratif.diagnostiqueur.version_logiciel,
    inputDpe.administratif.diagnostiqueur.version_moteur_calcul
  ];

  addGenerateurs(inputDpe, csvOutputDpe);

  setLoggerOff(true);
  try {
    /**
     * @type {FullDpe}
     */
    set_bug_for_bug_compat();
    set_tv_match_optimized_version();
    outputDpe = calcul_3cl(structuredClone(inputDpe));
  } catch (error) {
    parentPort.postMessage({ action: 'addFailedDpe', dpeCode: inputDpe.numero_dpe });
  }

  if (inputDpe.administratif.enum_modele_dpe_id !== '1') {
    parentPort.postMessage({ action: 'incrementInvalidDpeVersion' });
    return;
  }
  setLoggerOn(true);

  let isValid = true;

  DPE_PROPERTIES_TO_CHECK.forEach((propertyPath) => {
    const properties = propertyPath.split('.');
    const property = properties[properties.length - 1];

    const diff = getDpeOutputValueDiff(inputDpe, outputDpe, propertyPath, csvOutputDpe);
    if (diff < DIFF_VALUE_THRESHOLD) {
      parentPort.postMessage({
        action: 'incrementCheckPropertyThreshold',
        property
      });
    }
  });

  DPE_PROPERTIES_TO_VALIDATE.forEach((propertyPath) => {
    // Si plusieurs champs à valider, au moins un d'entre eux doit être valide
    const propertySegments = propertyPath.split('#');
    const isDiffBelowThreshold = propertySegments.some((property) => {
      const diff = getDpeOutputValueDiff(inputDpe, outputDpe, property, null);
      return diff <= DIFF_VALUE_THRESHOLD;
    });

    if (!isDiffBelowThreshold) {
      isValid = false;
    }
  });

  if (isValid) {
    csvOutputDpe.push('OK');
    parentPort.postMessage({ action: 'incrementAllChecksThreshold' });
  } else {
    csvOutputDpe.push('KO');
    parentPort.postMessage({ action: 'addDpeExceedThresholdInList', dpeCode: inputDpe.numero_dpe });
  }

  dpeOutputs.push(csvOutputDpe);
};

const waitFor = (milliseconds) => {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

/**
 * @param dpeCode {string}
 * @param dpesFilePath {string}
 * @return {Promise<string>}
 */
const downloadDpe = (dpeCode, dpesFilePath) => {
  const filePath = `${dpesFilePath}/${dpeCode}.xml`;
  return waitFor(process.env.API_ADEME_DONWLOAD_WAIT || 1000).then(() => {
    return fetch(
      `https://prd-x-ademe-externe-api.de-c1.eu1.cloudhub.io/api/v1/pub/dpe/${dpeCode}/xml`,
      {
        headers: {
          client_id: process.env.ADEME_API_CLIENT_ID,
          client_secret: process.env.ADEME_API_CLIENT_SECRET
        }
      }
    )
      .then(async (resp) => {
        if (resp.status !== 200) {
          /** @type {{error: string}} **/
          const errorPayload = await resp.json();
          throw new Error(
            `Could not retrieve DPE: ${dpeCode}, code: ${resp.status}, error: ${errorPayload.error}`
          );
        }
        return resp.text();
      })
      .then((fileContent) => {
        writeFileSync(filePath, fileContent, { encoding: 'utf8' });
        return fileContent;
      });
  });
};

/**
 * @param dpeCode {string}
 * @param dpesFilePath {string}
 * @return {Promise<string>}
 */
const readOrDownloadDpe = (dpeCode, dpesFilePath) => {
  const filePath = `${dpesFilePath}/${dpeCode}.xml`;
  if (!existsSync(filePath)) {
    if (!process.env.ADEME_API_CLIENT_ID) {
      throw new Error('Environment variable ADEME_API_CLIENT_ID not set');
    }
    if (!process.env.ADEME_API_CLIENT_SECRET) {
      throw new Error('Environment variable ADEME_API_CLIENT_SECRET not set');
    }
    return downloadDpe(dpeCode, dpesFilePath);
  } else {
    return Promise.resolve(readFileSync(filePath, { encoding: 'utf8' }));
  }
};

/**
 *
 * @param chunk {{dpeCode: string}[]}
 * @param dpesToExclude {string[]}
 * @param dpesFilePath {string}
 * @return {Promise<any[]>}
 */
export default async function ({ chunk, dpesToExclude, dpesFilePath = [] }) {
  const dpeOutputs = [];

  for (const data of chunk) {
    try {
      /** @type {string} **/
      const dpeXmlContent = await readOrDownloadDpe(data.dpeCode, dpesFilePath).then((result) => {
        parentPort.postMessage({ action: 'fileProcessed' });
        return result;
      });

      /** @type {FullDpe} **/
      const dpe = xmlParser.parse(dpeXmlContent).dpe;

      if (dpe.administratif.enum_version_id !== '1.1') {
        parentPort.postMessage({ action: 'incrementTotalReport' });

        if (dpesToExclude.includes(dpe.numero_dpe)) {
          parentPort.postMessage({ action: 'incrementExcludedDpe' });
          console.log(`Exclusion du DPE ${dpe.numero_dpe}.`);
        } else {
          runEngineAndVerifyOutput(dpe, dpeOutputs);
        }
      } else {
        parentPort.postMessage({ action: 'incrementInvalidDpeVersion' });
      }
    } catch (ex) {
      console.error(ex);
      parentPort.postMessage({ action: 'decrementTotalReport' });
      dpeOutputs.push([data.dpeCode, 'true']);
    }
  }
  return dpeOutputs;
}
