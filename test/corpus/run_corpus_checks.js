import { chunk, get } from 'lodash-es';
import { getAdemeFileJson } from '../test-helpers.js';
import { calcul_3cl } from '../../src/index.js';
import { format } from 'fast-csv';
import { set_bug_for_bug_compat, set_tv_match_optimized_version } from '../../src/utils.js';
import {
  DIFF_VALUE_THRESHOLD,
  DPE_PROPERTIES_TO_CHECK,
  DPE_PROPERTIES_TO_VALIDATE,
  GLOBAL_REPORT,
  OUTPUT_CSV_HEADERS,
  setLoggerOff,
  setLoggerOn
} from './corpus_utils.js';
import enums from '../../src/enums.js';
import { createWriteStream, readFileSync, writeFileSync } from 'node:fs';

let diffThreshold = DIFF_VALUE_THRESHOLD;
let compatibilityMode = false;
let diffThresholdStr = process.argv.find((cmd) => cmd.startsWith('threshold='));
let compatibilityStr = process.argv.find((cmd) => cmd.startsWith('compatibility'));

compatibilityMode = !!compatibilityStr;
GLOBAL_REPORT.compatibilityMode = compatibilityMode;
if (diffThresholdStr) {
  diffThreshold = Number(diffThresholdStr.split('=').pop());
  GLOBAL_REPORT.threshold = diffThreshold;
}

/** @type {{}[]} **/
const dpeOutputs = [];

const waitFor = (milliseconds) => {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

const createCsv = (rows, headers, filename) => {
  const csvStream = format({ headers });

  // loop over nested row arrays
  for (let i = 0; i < rows.length; i++) {
    let row = rows[i];
    csvStream.write(row);
  }
  csvStream.pipe(createWriteStream(filename, { encoding: 'utf8' }));
  csvStream.end();
  return `Finished writing data to: ${filename}`;
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
  });
};

/**
 * @param inputDpe {FullDpe}
 */
const runEngineAndVerifyOutput = (inputDpe) => {
  let outputDpe;
  let csvOutputDpe = [
    inputDpe.numero_dpe,
    inputDpe.logement.caracteristique_generale.enum_methode_application_dpe_log_id,
    inputDpe.administratif.enum_version_id,
    inputDpe.administratif.diagnostiqueur.version_logiciel,
    inputDpe.administratif.diagnostiqueur.version_moteur_calcul
  ];

  addGenerateurs(inputDpe, csvOutputDpe);

  try {
    if (compatibilityMode) {
      set_bug_for_bug_compat();
    }
    set_tv_match_optimized_version();
    outputDpe = calcul_3cl(structuredClone(inputDpe));
  } catch (error) {
    GLOBAL_REPORT.dpeRunFailed.push(inputDpe.numero_dpe);
  }

  if (inputDpe.administratif.enum_modele_dpe_id !== '1') {
    GLOBAL_REPORT.nbInvalidDpeVersion++;
    return;
  }

  let isValid = true;

  DPE_PROPERTIES_TO_CHECK.forEach((propertyPath) => {
    const properties = propertyPath.split('.');
    const property = properties[properties.length - 1];

    if (!GLOBAL_REPORT.checks[property]) {
      GLOBAL_REPORT.checks[property] = { nbBelowThreshold: 0 };
    }

    const diff = getDpeOutputValueDiff(inputDpe, outputDpe, propertyPath, csvOutputDpe);
    if (diff < diffThreshold) {
      GLOBAL_REPORT.checks[property].nbBelowThreshold++;
    }
  });

  DPE_PROPERTIES_TO_VALIDATE.forEach((propertyPath) => {
    // Si plusieurs champs à valider, au moins un d'entre eux doit être valide
    const propertySegments = propertyPath.split('#');
    const isDiffBelowThreshold = propertySegments.some((property) => {
      const diff = getDpeOutputValueDiff(inputDpe, outputDpe, property, null);
      return diff <= diffThreshold;
    });

    if (!isDiffBelowThreshold) {
      isValid = false;
    }
  });

  if (isValid) {
    csvOutputDpe.push('OK');
    GLOBAL_REPORT.nbAllChecksBelowThreshold++;
  } else {
    csvOutputDpe.push('KO');
  }

  dpeOutputs.push(csvOutputDpe);
};

/**
 * @return {Promise<void>}
 */
export const validateCorpus = async () => {
  /** @type {string[]} **/
  const dpesCodesToAnalyze = JSON.parse(
    readFileSync('test/corpus-sano.json', { encoding: 'utf8' }).toString()
  );

  console.log(
    `About to analyze ${dpesCodesToAnalyze.length} DPE, with a tolerance error gap of: ${diffThreshold}%`
  );
  GLOBAL_REPORT.nbDpe = dpesCodesToAnalyze.length;
  let nbAnalyzedDpe = 0;

  /**
   * @type {string[][]}
   */
  const dpeCodesChunks = chunk(dpesCodesToAnalyze, 10);
  for (const dpeCodes of dpeCodesChunks) {
    nbAnalyzedDpe += dpeCodes.length;
    console.log(
      `Processing ${nbAnalyzedDpe}/${dpesCodesToAnalyze.length} DPE (${Math.round((nbAnalyzedDpe / dpesCodesToAnalyze.length) * 100)} %)`
    );
    setLoggerOff(true);
    for (const dpeCode of dpeCodes) {
      try {
        const dpe = await getAdemeFileJson(dpeCode);
        GLOBAL_REPORT.total++;
        runEngineAndVerifyOutput(dpe);
      } catch (ex) {
        console.error(ex);
        GLOBAL_REPORT.total--;
        dpeOutputs.push([dpeCode, 'true']);
      }
    }
    setLoggerOn(false);
    await waitFor(10);
  }
};

export function runEngineOnCorpus() {
  return validateCorpus().then(() => {
    const suffixFile = compatibilityMode
      ? `report_compatibility_threshold_${diffThreshold}`
      : `report_threshold_${diffThreshold}`;
    createCsv(
      dpeOutputs,
      OUTPUT_CSV_HEADERS,
      `dist/reports/corpus/corpus_detailed_${suffixFile}.csv`
    );
    writeFileSync(
      `dist/reports/corpus/corpus_global_${suffixFile}.json`,
      JSON.stringify(GLOBAL_REPORT),
      {
        encoding: 'utf8'
      }
    );
    const validDpesPercentage = Math.round(
      (GLOBAL_REPORT.nbAllChecksBelowThreshold / GLOBAL_REPORT.total) * 100
    );
    console.log(
      `Corpus analyze complete, ${GLOBAL_REPORT.nbAllChecksBelowThreshold}/${GLOBAL_REPORT.total} (${validDpesPercentage}%)`
    );
  });
}

runEngineOnCorpus().then();
