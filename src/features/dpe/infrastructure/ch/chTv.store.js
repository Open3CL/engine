import { tvs as tv } from '../../../../tv-v2.js';
import { TvStore } from './../tv.store.js';
import { convertExpression } from '../../../../utils.js';

/**
 * Accès aux données des tables de valeurs pour le chauffage
 */
export class ChTvStore extends TvStore {
  /**
   * Récupération des ids des générateurs de chauffage à combustion
   * @return {[number]}
   */
  getCombustionGenerateurs() {
    return [
      ...new Set(
        tv['generateur_combustion'].flatMap((v) =>
          (v.enum_type_generateur_ch_id
            ? v.enum_type_generateur_ch_id.split('|').map(Number)
            : []
          ).filter(Number.isFinite)
        )
      )
    ].sort((a, b) => a - b);
  }
  /**
   * Récupération des ids des générateurs de chauffage pompes à chaleur
   * @return {[number]}
   */
  getPacGenerateurs() {
    return [
      ...new Set(
        tv['scop'].flatMap((v) =>
          (v.enum_type_generateur_ch_id
            ? v.enum_type_generateur_ch_id.split('|').map(Number)
            : []
          ).filter(Number.isFinite)
        )
      )
    ].sort((a, b) => a - b);
  }

  /**
   * Récupération des informations du générateur à combustion
   * @param enumTypeGenerateurId
   * @param pn
   * @return {{tv_generateur_combustion_id: string, enum_type_generateur_ch_id: string, type_generateur: string, critere_pn: string, pveil: string, qp0_perc: string, rpint: string, rpn: string}}
   */
  getGenerateurCombustion(enumTypeGenerateurId, pn) {
    return tv['generateur_combustion'].find(
      (v) =>
        v.enum_type_generateur_ch_id.split('|').includes(enumTypeGenerateurId) &&
        (!v.critere_pn ||
          eval(`let Pn=${pn} ;${convertExpression(v.critere_pn.replace('≤', '<='))}`))
    );
  }
}
