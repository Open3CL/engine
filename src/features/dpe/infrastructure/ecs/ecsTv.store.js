import { tvs as tv } from '../../../../tv-v2.js';
import { TvStore } from './../tv.store.js';
import { logger } from '../../../../core/util/logger/log-service.js';

/**
 * Accès aux données des tables de valeurs pour le besoin en eau chaude sanitaire
 */
export class EcsTvStore extends TvStore {
  /**
   * Température moyenne d’eau froide sanitaire sur le mois j (°C).
   * La température d’eau froide est une donnée climatique mensuelle pour chacune des 8 zones climatiques
   * @see 11.1 Calcul du besoin d’ECS : Tefs
   *
   * @param classeAltitude {string}
   * @param zoneClimatique {string}
   * @param mois {string}
   *
   * @return {number|undefined}
   */
  getTefs(classeAltitude, zoneClimatique, mois) {
    return tv['tefs'][classeAltitude][mois][zoneClimatique];
  }

  /**
   * Coefficient de perte du ballon de stockage
   * @see 11.6.2 Pertes des ballons électriques
   *
   * @param enumTypeGenerateurEcsId {string}
   * @param volumeStockage {number}
   *
   * @return {number|undefined}
   */
  getPertesStockage(enumTypeGenerateurEcsId, volumeStockage) {
    let volumeBallon;
    if (volumeStockage <= 100) volumeBallon = '≤ 100';
    else if (volumeStockage <= 200) volumeBallon = '100 <   ≤ 200';
    else if (volumeStockage <= 300) volumeBallon = '200 <   ≤ 300';
    else volumeBallon = '> 300';

    const cr = tv['pertes_stockage'].find(
      (v) =>
        v.enum_type_generateur_ecs_id.split('|').includes(enumTypeGenerateurEcsId) &&
        v.volume_ballon === volumeBallon
    )?.cr;

    if (!cr) {
      logger.error(
        `Pas de valeur forfaitaire cr pour enumTypeGenerateurEcsId:${enumTypeGenerateurEcsId}, volumeBallon:${volumeBallon}`
      );
      return;
    }

    return parseFloat(cr);
  }

  /**
   * Récupération des ids des générateurs électriques ECS
   * @return {[number]}
   */
  getElectriqueEcsGenerateurs() {
    return tv['pertes_stockage'].flatMap((v) =>
      v.enum_type_generateur_ecs_id.split('|').map(Number)
    );
  }
}
