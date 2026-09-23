import { TypeStockage } from '../../../dpe/domain/models/type-stockage.model.js';
import { inject } from 'dioma';
import { EcsTvStore } from '../../../dpe/infrastructure/ecs/ecsTv.store.js';

/**
 * Calcul des données de calcul pour chacun des générateurs
 * Données calculées
 *   — Qgw : pertes liées au stockage de l'ECS pour chaque générateur
 */
export class GenerateurEcsService {
  /**
   * @type {EcsTvStore}
   */
  #tvStore;

  /**
   * @param tvStore {EcsTvStore}
   */
  constructor(tvStore = inject(EcsTvStore)) {
    this.#tvStore = tvStore;
  }

  /**
   * Détermination des données de calcul pour une installation ECS
   *
   * @param installationEcs {InstallationEcs}
   */
  execute(installationEcs) {
    const generateursEcs = installationEcs.generateur_ecs_collection?.generateur_ecs || [];

    generateursEcs.forEach((generateurEcs) => {
      /** @type {GenerateurEcsDE}*/
      const generateurEcsDE = generateurEcs.donnee_entree;

      generateurEcs.donnee_utilisateur = {
        Qgw: this.pertesStockage(generateurEcsDE)
      };
    });
  }

  /**
   * Pertes de stockage d'un générateur ECS.
   * Seules les générateurs avec stockage indépendant et dissocié du générateur sont concernés
   *
   * 11.6.1 - Pertes de stockage des ballons d’accumulation
   * 11.6.2 - Pertes des ballons électriques
   *
   * @param generateurEcsDE {GenerateurEcsDE}
   * @return {number}
   */
  pertesStockage(generateurEcsDE) {
    const electrique = this.generateurElectrique(generateurEcsDE);
    const typeStockage = this.typeStockage(generateurEcsDE);

    if (typeStockage === TypeStockage.INSTANTANE) {
      return 0;
    }

    let Qgw;
    let volumeStockage = generateurEcsDE.volume_stockage;

    if (electrique) {
      const cr = this.#tvStore.getPertesStockage(
        generateurEcsDE.enum_type_generateur_ecs_id,
        volumeStockage
      );
      // Les pertes de stockage des ballons électriques (Wh)
      Qgw = ((8592 * 45) / 24) * volumeStockage * cr;
    } else {
      // La présence d’un ballon de préparation de l’ECS est responsable de pertes de stockage Qgw (Wh)
      Qgw = 67662 * volumeStockage ** 0.55;
    }

    return Qgw;
  }

  /**
   * Return true si le générateur ECS est électrique
   *
   * 1 - abscence de stockage d'ecs (production instantanée)
   * 2 - stockage indépendant de la production
   * 3 - stockage intégré à la production
   *
   * @param generateurEcsDE {GenerateurEcsDE}
   * @return {boolean}
   */
  generateurElectrique(generateurEcsDE) {
    return this.#tvStore
      .getElectriqueEcsGenerateurs()
      .includes(parseInt(generateurEcsDE.enum_type_generateur_ecs_id));
  }

  /**
   * Return le type de stockage d'ECS
   *
   * @param generateurEcsDE {GenerateurEcsDE}
   * @return TypeStockage
   */
  typeStockage(generateurEcsDE) {
    return parseInt(generateurEcsDE.enum_type_stockage_ecs_id) === 1
      ? TypeStockage.INSTANTANE
      : parseInt(generateurEcsDE.enum_type_stockage_ecs_id) === 2
        ? TypeStockage.INDEPENDANT
        : TypeStockage.INTEGRE;
  }
}
