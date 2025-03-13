import { tvs as tv } from '../../../../tv-v2.js';
import { TvStore } from './../tv.store.js';
import { convertExpression } from '../../../../utils.js';
import enums from '../../../../enums.js';
import { logger } from '../../../../core/util/logger/log-service.js';

/**
 * Accès aux données des tables de valeurs pour le chauffage
 */
export class ChTvStore extends TvStore {
  /**
   * Récupération des ids des générateurs de chauffage à combustion
   * @return {[number]}
   */
  getCombustionGenerateurs() {
    return this.#getTypeGenerateurChId('generateur_combustion');
  }
  /**
   * Récupération des ids des générateurs de chauffage pompes à chaleur
   * @return {[number]}
   */
  getPacGenerateurs() {
    return this.#getTypeGenerateurChId('scop');
  }

  /**
   * @param tv {string}
   * @returns {any[]}
   */
  #getTypeGenerateurChId(tv) {
    return [
      ...new Set(
        tv[tv].flatMap((v) =>
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
        v.enum_type_generateur_ch_id &&
        v.enum_type_generateur_ch_id.split('|').includes(enumTypeGenerateurId) &&
        (!v.critere_pn ||
          eval(`let Pn=${pn} ;${convertExpression(v.critere_pn.replace('≤', '<='))}`))
    );
  }

  /**
   * Récupération de la température de fonctionnement
   *
   * @param pourcentageFonctionnement pourcentage de fonctionnement du générateur (30% ou 100%)
   * @param enumTypeGenerateurId
   * @param enumTemperatureDistribution
   * @param enumPeriodeEmetteurs
   * @return {number}
   */
  temperatureFonctionnement(
    pourcentageFonctionnement,
    enumTypeGenerateurId,
    enumTemperatureDistribution,
    enumPeriodeEmetteurs
  ) {
    const temperatureDistribution = enums.temp_distribution_ch[enumTemperatureDistribution];
    const periodeEmetteur = enums.periode_installation_emetteur[enumPeriodeEmetteurs];

    const temperature = tv[`temp_fonc_${pourcentageFonctionnement}`].find(
      (v) =>
        (!v.enum_type_generateur_ch_id ||
          v.enum_type_generateur_ch_id.split('|').includes(enumTypeGenerateurId)) &&
        v.temp_distribution_ch.toLowerCase() === temperatureDistribution?.toLowerCase() &&
        v.periode_emetteurs.toLowerCase() === periodeEmetteur?.toLowerCase()
    );

    if (!temperature) {
      logger.error(
        `Pas de valeur forfaitaire temp_fonc_${pourcentageFonctionnement} pour enumTypeGenerateurId:${enumTypeGenerateurId}, enumTemperatureDistribution:${enumTemperatureDistribution}, enumPeriodeEmetteurs:${enumPeriodeEmetteurs}`
      );
      return;
    }

    return parseFloat(temperature[`temp_fonc_${pourcentageFonctionnement}`]);
  }
}
