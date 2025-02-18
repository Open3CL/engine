import { DpePreProcessor } from '../../../../../preprocessor/index.js';

/**
 * Service de normalisation du DPE d'entrée
 * Permet de redresser / complèter des données d'entrées
 */
export class DpeNormalizerService {
  /**
   * @param dpe {Dpe}
   * @return {Dpe} Normalized DPE
   */
  normalize(dpe) {
    /**
     * On clone le DPE d'origine pour ne pas le modifier
     * @type {Dpe}
     */
    let normalizedDpe = JSON.parse(JSON.stringify(dpe));

    const dpePreProcessor = new DpePreProcessor();
    dpePreProcessor.preprocess(normalizedDpe);

    return normalizedDpe;
  }
}
