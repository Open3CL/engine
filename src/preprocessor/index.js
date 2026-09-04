/**
 * Pré-traitement du DPE d'entrée.
 *
 * Placeholder minimal : la migration vers la nouvelle architecture `features/` prévoit un
 * pré-processeur chargé de redresser / compléter les données d'entrée avant calcul. Tant que
 * cette étape n'est pas implémentée, `preprocess` est un no-op qui laisse le DPE inchangé.
 *
 * Ce module existe pour que {@link DpeNormalizerService} soit chargeable (son import était cassé,
 * pointant vers un fichier inexistant). Il n'est pas câblé dans le moteur legacy (`engine.js`).
 */
export class DpePreProcessor {
  /**
   * @param dpe {Dpe} DPE à pré-traiter (modifié sur place)
   * @return {void}
   */
  preprocess(dpe) {
    // no-op : voir la description du module
    return dpe;
  }
}
