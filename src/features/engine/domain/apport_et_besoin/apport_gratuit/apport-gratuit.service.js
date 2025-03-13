import { inject } from 'dioma';
import { SurfaceSudEquivalenteService } from '../surface-sud-equivalente.service.js';
import { mois_liste } from '../../../../../utils.js';
import { FrTvStore } from '../../../../dpe/infrastructure/froid/frTv.store.js';

/**
 * Calcul des apports gratuits
 * Chapitre 6 Détermination des apports gratuits
 *
 * Methode_de_calcul_3CL_DPE_2021 - Page 42
 * Octobre 2021
 * @see consolide_anne…arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf
 */
export class ApportGratuitService {
  /**
   * @type {FrTvStore}
   */
  #frTvStore;

  /**
   * @type {SurfaceSudEquivalenteService}
   */
  #surfaceSudEquivalenteService;

  /**
   * @param frTvStore {FrTvStore}
   * @param surfaceSudEquivalenteService {SurfaceSudEquivalenteService}
   */
  constructor(
    frTvStore = inject(FrTvStore),
    surfaceSudEquivalenteService = inject(SurfaceSudEquivalenteService)
  ) {
    this.#frTvStore = frTvStore;
    this.#surfaceSudEquivalenteService = surfaceSudEquivalenteService;
  }

  /**
   * Apports solaires gratuits du logement
   *
   * @param ctx {Contexte}
   * @param logement {Logement}
   * @returns {number}
   */
  apportSolaire(ctx, logement) {
    const clim = logement.climatisation_collection?.climatisation || [];

    return mois_liste.reduce(
      (acc, mois) => {
        const apportSolaire = this.apportSolaireMois(
          ctx,
          logement.enveloppe,
          mois,
          this.#frTvStore.getData(
            'e',
            ctx.altitude.value,
            ctx.zoneClimatique.value,
            mois,
            ctx.inertie.ilpa
          )
        );
        acc.apport_solaire_ch += apportSolaire;
        logement.donnees_de_calcul.apportsSolaire[mois] = apportSolaire;

        if (clim.length > 0) {
          acc.apport_solaire_fr += this.apportSolaireMois(
            ctx,
            logement.enveloppe,
            mois,
            this.#frTvStore.getData('e_fr_28', ctx.altitude.value, ctx.zoneClimatique.value, mois)
          );
        }
        return acc;
      },
      { apport_solaire_ch: 0, apport_solaire_fr: 0 }
    );
  }

  /**
   * Apports internes gratuits du logement
   *
   * @param ctx {Contexte}
   * @param logement {Logement}
   * @returns {number}
   */
  apportInterne(ctx, logement) {
    const clim = logement.climatisation_collection?.climatisation || [];

    return mois_liste.reduce(
      (acc, mois) => {
        const apportInterne = this.apportInterneMois(
          ctx,
          this.#frTvStore.getData(
            'nref19',
            ctx.altitude.value,
            ctx.zoneClimatique.value,
            mois,
            ctx.inertie.ilpa
          )
        );
        acc.apport_interne_ch += apportInterne;
        logement.donnees_de_calcul.apportsInterneCh[mois] = apportInterne;
        logement.donnees_de_calcul.apportsInterneDepensier[mois] = this.apportInterneMois(
          ctx,
          this.#frTvStore.getData(
            'nref21',
            ctx.altitude.value,
            ctx.zoneClimatique.value,
            mois,
            ctx.inertie.ilpa
          )
        );

        if (clim.length > 0) {
          acc.apport_interne_fr += this.apportInterneMois(
            ctx,
            this.#frTvStore.getData('nref28', ctx.altitude.value, ctx.zoneClimatique.value, mois)
          );
        }
        return acc;
      },
      { apport_interne_ch: 0, apport_interne_fr: 0 }
    );
  }

  /**
   * Apports solaires pour un mois donné
   *
   * @param ctx {Contexte}
   * @param enveloppe {Enveloppe}
   * @param mois {string}
   * @param e {number} ensoleillement reçu, pour le mois, par une paroi verticale orientée au sud en absence d'ombrage (kWh/m²)
   * @returns {number}
   */
  apportSolaireMois(ctx, enveloppe, mois, e) {
    return 1000 * this.#surfaceSudEquivalenteService.ssdMois(ctx, enveloppe, mois) * e;
  }

  /**
   * Apports internes dans le logement pour un mois donné
   * Les apports internes de chaleur dus aux équipements prennent en compte l’ensemble des équipements
   * « mobiliers » (cuisson, audiovisuel, informatique, lavage, froid, appareils ménagers)
   *
   * @param ctx {Contexte}
   * @param nref {number} nombre d’heures de chauffage pour le mois
   * @returns {number}
   */
  apportInterneMois(ctx, nref) {
    return ((3.18 + 0.34) * ctx.surfaceHabitable + 90 * (132 / 168) * ctx.nadeq) * nref;
  }
}
