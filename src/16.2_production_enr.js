import enums from './enums.js';
import { mois_liste, tv } from './utils.js';
import tvs from './tv.js';
import { DEFAULT_COEFF_EP } from './conso.js';

/**
 * Méthodes d'application « appartement chauffage individuel ECS individuel » : l'installation PV
 * déclarée est celle du logement, aucune proratisation (exports ADEME non proratisés, cf. 2528E1249844E).
 */
const MAP_APPARTEMENT_INDIVIDUEL = ['2', '22', '25'];

/**
 * Coefficient de proratisation au logement de la production d'une installation PV d'immeuble.
 *
 * Le moteur de référence (Tribu, `Calcul_batiment.cs` l.1142-1156) calcule le taux de couverture
 * Tcv = Ppv / Celec_tot avec la surface du logement : pour un appartement desservi par une
 * installation d'immeuble, la surface de capteurs doit être ramenée au logement
 * (S_capteur × Sh_logement / Sh_immeuble), comme pour les générateurs collectifs (l.253, l.303).
 *
 * @param th {string} type de bâtiment ('maison', 'appartement', 'immeuble')
 * @param map_id {string} enum_methode_application_dpe_log_id
 * @param surfaceLogement {number|string} surface_habitable_logement
 * @param surfaceImmeuble {number|string} surface_habitable_immeuble
 * @returns {number} 1 si aucune proratisation, sinon Sh_logement / Sh_immeuble
 */
export function ratioProrataPvLogement(th, map_id, surfaceLogement, surfaceImmeuble) {
  const shl = Number(surfaceLogement);
  const shi = Number(surfaceImmeuble);
  if (th !== 'appartement' || MAP_APPARTEMENT_INDIVIDUEL.includes(String(map_id))) {
    return 1;
  }
  if (!(shl > 0) || !(shi > shl)) {
    return 1;
  }
  return shl / shi;
}

export class ProductionENR {
  /**
   * Taux d'autoproduction limite par poste Taplpi (§16.2).
   * Auxiliaires de distribution : 0,1 (valeur du moteur de référence CSTB, autotests MI5-0-2/21 :
   * Celec_ac_aux_dist_ch / Celec_ac reproduit à 1e-15 avec 0,1 ; 9 fixtures ADEME PV sur 21 à ±0,1 %
   * sur conso_elec_ac au lieu de 4 avec 0,05).
   */
  #taplpi = {
    chauffage: 0.02,
    ecs: 0.05,
    refroidissement: 0.25,
    eclairage: 0.05,
    auxiliaire_ventilation: 0.5,
    auxiliaire_distribution: 0.1,
    autres: 0.45
  };

  /**
   * Calcul des consommations d'électricité auto-consommée par enveloppe
   * Mise à jour des conso ef en prenant en compte ces auto-consommations
   * @param productionElecEnr
   * @param conso
   * @param Sh {number}
   * @param th {string}
   * @param zc_id {string}
   * @param coeff_ep_override {number?}
   * @param ratioPv {number?} proratisation au logement d'une installation d'immeuble (cf. ratioProrataPvLogement)
   */
  calculateEnr(productionElecEnr, conso, Sh, th, zc_id, coeff_ep_override, ratioPv = 1) {
    const productionElectricite = {
      conso_elec_ac: 0,
      production_pv: 0,
      conso_elec_ac_ch: 0,
      conso_elec_ac_auxiliaire_generation_ch: 0,
      conso_elec_ac_ecs: 0,
      conso_elec_ac_auxiliaire_generation_ecs: 0,
      conso_elec_ac_fr: 0,
      conso_elec_ac_ventilation: 0,
      conso_elec_ac_eclairage: 0,
      conso_elec_ac_auxiliaire_distribution_ecs: 0,
      conso_elec_ac_auxiliaire_distribution_ch: 0,
      conso_elec_ac_auxiliaire: 0,
      conso_elec_ac_autre_usage: 0
    };

    if (productionElecEnr && productionElecEnr.donnee_entree?.presence_production_pv === 1) {
      // Calcul de l'électricité auto-consommée pour chaque enveloppe
      this.calculateConsoElecAc(
        productionElectricite,
        productionElecEnr,
        conso,
        zc_id,
        th,
        Sh,
        ratioPv
      );

      // Mise à jour des consommations d'énergie finale en minorant l'énergie consommée par l'énergie autoconsommée par le poste
      this.updateEfConso(productionElectricite, conso, Sh);

      // Mise à jour des consommations d'énergie primaire en minorant l'énergie consommée par l'énergie autoconsommée par le poste
      this.updateEPConso(productionElectricite, conso, Sh, coeff_ep_override);
    }

    return {
      production_pv: productionElectricite.production_pv,
      conso_elec_ac: productionElectricite.conso_elec_ac,
      conso_elec_ac_ch: productionElectricite.conso_elec_ac_ch,
      conso_elec_ac_ecs: productionElectricite.conso_elec_ac_ecs,
      conso_elec_ac_fr: productionElectricite.conso_elec_ac_fr,
      conso_elec_ac_eclairage: productionElectricite.conso_elec_ac_eclairage,
      conso_elec_ac_auxiliaire: productionElectricite.conso_elec_ac_auxiliaire,
      conso_elec_ac_autre_usage: productionElectricite.conso_elec_ac_autre_usage
    };
  }

  /**
   * Calcul de l'électricité auto-consommée pour chaque enveloppe
   * @param productionElectricite production ENR totale du logement
   * @param productionElecEnr installation ENR
   * @param conso
   * @param zc_id
   * @param th
   * @param Sh
   * @param ratioPv {number?}
   */
  calculateConsoElecAc(productionElectricite, productionElecEnr, conso, zc_id, th, Sh, ratioPv = 1) {
    // Production d’électricité par des capteurs photovoltaïques Ppv (en kWh/m²)
    const Ppv = this.getPpv(productionElecEnr, zc_id, ratioPv);

    // Consommation annuelle d’électricité pour les autres usages (kWhef/an)
    const CelecTotAu = this.getCelecAu(th, Sh);

    /**
     * Récupération des consommations électriques pour ch et ecs
     * @type {SortieParEnergieItem}
     */
    let consoElec = conso.sortie_par_energie_collection.sortie_par_energie.find(
      (sortie) => sortie.enum_type_energie_id === '1'
    );

    /**
     * Consommation totale annuelle d’électricité pour les 5 usages réglementaires et les usages mobiliers (kWhef/an)
     */
    const Celec_tot = consoElec.conso_5_usages + CelecTotAu;

    // Autoconsommation proratisée à chaque usage
    const production = this.getTapl(conso.ef_conso, consoElec, CelecTotAu, Celec_tot);

    /**
     * Coefficient de calage représentant le taux d’auto-production maximum pouvant être atteint lorsque
     * la production d’électricité renouvelable augmente
     */
    const Tapl = Object.values(production).reduce((acc, valeur) => acc + valeur, 0);

    /**
     * Taux de couverture, correspondant au ratio entre la production totale du site et la consommation
     * annuelle tous usages (%)
     */
    const Tcv = Ppv / Celec_tot;

    /**
     * Taux d’autoproduction, correspondant au rapport entre la production d’électricité autoconsommée et la
     * consommation d’énergie (tous usages) du bâtiment (%)
     */
    const Tap = 1 / (1 / Tcv + 1 / Tapl);

    // Electricité photovoltaïque autoconsommée (kWhef/an)
    const consoElecAc = Celec_tot * Tap;

    // Mise à jour des données intermédiaires pour l'installation ENR
    productionElecEnr.donnee_intermediaire = productionElecEnr.donnee_intermediaire
      ? productionElecEnr.donnee_intermediaire
      : {};
    productionElecEnr.donnee_intermediaire.conso_elec_ac = consoElecAc;
    productionElecEnr.donnee_intermediaire.taux_autoproduction = Tap;
    productionElecEnr.donnee_intermediaire.production_pv = Ppv;

    productionElectricite.conso_elec_ac = consoElecAc;
    productionElectricite.production_pv = Ppv;

    productionElectricite.conso_elec_ac_ch = (consoElecAc * production.conso_elec_ac_ch) / Tapl;
    productionElectricite.conso_elec_ac_auxiliaire_generation_ch =
      (consoElecAc * production.conso_elec_ac_auxiliaire_generation_ch) / Tapl;
    productionElectricite.conso_elec_ac_ecs = (consoElecAc * production.conso_elec_ac_ecs) / Tapl;
    productionElectricite.conso_elec_ac_auxiliaire_generation_ecs =
      (consoElecAc * production.conso_elec_ac_auxiliaire_generation_ecs) / Tapl;
    productionElectricite.conso_elec_ac_fr = (consoElecAc * production.conso_elec_ac_fr) / Tapl;
    productionElectricite.conso_elec_ac_eclairage =
      (consoElecAc * production.conso_elec_ac_eclairage) / Tapl;
    productionElectricite.conso_elec_ac_ventilation =
      (consoElecAc * production.conso_elec_ac_ventilation) / Tapl;
    productionElectricite.conso_elec_ac_auxiliaire_distribution_ecs =
      (consoElecAc * production.conso_elec_ac_auxiliaire_distribution_ecs) / Tapl;
    productionElectricite.conso_elec_ac_auxiliaire_distribution_ch =
      (consoElecAc * production.conso_elec_ac_auxiliaire_distribution_ch) / Tapl;
    productionElectricite.conso_elec_ac_autre_usage =
      CelecTotAu * production.conso_elec_ac_autre_usage;

    // Energies autoconsommée par les auxiliaires
    const consoAcAuxiliaires =
      productionElectricite.conso_elec_ac_auxiliaire_generation_ch +
      productionElectricite.conso_elec_ac_auxiliaire_generation_ecs +
      productionElectricite.conso_elec_ac_auxiliaire_distribution_ecs +
      productionElectricite.conso_elec_ac_auxiliaire_distribution_ch +
      productionElectricite.conso_elec_ac_ventilation;

    productionElectricite.conso_elec_ac_auxiliaire = consoAcAuxiliaires;
  }

  /**
   * Mise à jour des consommations ef en minorant l'énergie finale consommée par l'énergie autoconsommée par chaque enveloppe
   * @param productionElectricite
   * @param conso
   * @param Sh
   */
  updateEfConso(productionElectricite, conso, Sh) {
    conso.ef_conso.conso_ecs -= productionElectricite.conso_elec_ac_ecs;
    conso.ef_conso.conso_ch -= productionElectricite.conso_elec_ac_ch;
    conso.ef_conso.conso_fr -= productionElectricite.conso_elec_ac_fr;
    conso.ef_conso.conso_eclairage -= productionElectricite.conso_elec_ac_eclairage;
    conso.ef_conso.conso_totale_auxiliaire -= productionElectricite.conso_elec_ac_auxiliaire;

    conso.ef_conso.conso_5_usages -=
      productionElectricite.conso_elec_ac_ecs +
      productionElectricite.conso_elec_ac_ch +
      productionElectricite.conso_elec_ac_fr +
      productionElectricite.conso_elec_ac_eclairage +
      productionElectricite.conso_elec_ac_auxiliaire;

    conso.ef_conso.conso_5_usages_m2 = Math.floor(conso.ef_conso.conso_5_usages / Sh);
  }

  /**
   * Mise à jour des consommations ef en minorant l'énergie primaire consommée par l'énergie autoconsommée par chaque enveloppe
   * @param productionElectricite
   * @param conso {{ep_conso: Ep_conso}}
   * @param Sh {number}
   * @param coeff_ep_override {number?} coeff ep à surcharger si définit
   */
  updateEPConso(productionElectricite, conso, Sh, coeff_ep_override) {
    if (coeff_ep_override) {
      conso.ep_conso.ep_conso_ecs -= coeff_ep_override * productionElectricite.conso_elec_ac_ecs;
      conso.ep_conso.ep_conso_ch -= coeff_ep_override * productionElectricite.conso_elec_ac_ch;
      conso.ep_conso.ep_conso_fr -= coeff_ep_override * productionElectricite.conso_elec_ac_fr;
      conso.ep_conso.ep_conso_eclairage -=
        coeff_ep_override * productionElectricite.conso_elec_ac_eclairage;
      conso.ep_conso.ep_conso_totale_auxiliaire -=
        coeff_ep_override * productionElectricite.conso_elec_ac_auxiliaire;

      const conso_elec =
        productionElectricite.conso_elec_ac_ecs +
        productionElectricite.conso_elec_ac_ch +
        productionElectricite.conso_elec_ac_fr +
        productionElectricite.conso_elec_ac_eclairage +
        productionElectricite.conso_elec_ac_auxiliaire;

      conso.ep_conso.ep_conso_5_usages -= coeff_ep_override * conso_elec;

      conso.ep_conso.ep_conso_5_usages_m2 = Math.floor(conso.ep_conso.ep_conso_5_usages / Sh);
    } else {
      conso.ep_conso.ep_conso_ecs -= DEFAULT_COEFF_EP * productionElectricite.conso_elec_ac_ecs;
      conso.ep_conso.ep_conso_ch -= DEFAULT_COEFF_EP * productionElectricite.conso_elec_ac_ch;
      conso.ep_conso.ep_conso_fr -= DEFAULT_COEFF_EP * productionElectricite.conso_elec_ac_fr;
      conso.ep_conso.ep_conso_eclairage -=
        DEFAULT_COEFF_EP * productionElectricite.conso_elec_ac_eclairage;
      conso.ep_conso.ep_conso_totale_auxiliaire -=
        DEFAULT_COEFF_EP * productionElectricite.conso_elec_ac_auxiliaire;

      const conso_elec =
        productionElectricite.conso_elec_ac_ecs +
        productionElectricite.conso_elec_ac_ch +
        productionElectricite.conso_elec_ac_fr +
        productionElectricite.conso_elec_ac_eclairage +
        productionElectricite.conso_elec_ac_auxiliaire;

      conso.ep_conso.ep_conso_5_usages -= DEFAULT_COEFF_EP * conso_elec;

      conso.ep_conso.ep_conso_5_usages_m2 = Math.floor(conso.ep_conso.ep_conso_5_usages / Sh);
    }
  }

  /**
   * Calcul des taux d'autoproduction consommés pour chaque enveloppe
   * @param efConso {Ef_conso}
   * @param consoElec
   * @param ccom {number}
   * @param consoElecTotale {number}
   */
  getTapl(efConso, consoElec, ccom, consoElecTotale) {
    const productionElectricite = {
      conso_elec_ac_ch: 0,
      conso_elec_ac_auxiliaire_generation_ch: 0,
      conso_elec_ac_ecs: 0,
      conso_elec_ac_auxiliaire_generation_ecs: 0,
      conso_elec_ac_fr: 0,
      conso_elec_ac_ventilation: 0,
      conso_elec_ac_eclairage: 0,
      conso_elec_ac_auxiliaire_distribution_ecs: 0,
      conso_elec_ac_auxiliaire_distribution_ch: 0,
      conso_elec_ac_autre_usage: 0
    };

    // Consommation de chauffage récupérée directement depuis les consommations par énergie "électricité"
    const chauffage = consoElec?.conso_ch;
    if (chauffage) {
      productionElectricite.conso_elec_ac_ch =
        (this.#taplpi.chauffage * chauffage) / consoElecTotale;
    }

    const auxiliaireGenerationCh = efConso.conso_auxiliaire_generation_ch;
    if (auxiliaireGenerationCh) {
      productionElectricite.conso_elec_ac_auxiliaire_generation_ch =
        (this.#taplpi.chauffage * auxiliaireGenerationCh) / consoElecTotale;
    }

    // Consommation ECS récupérée directement depuis les consommations par énergie "électricité"
    const ecs = consoElec?.conso_ecs;
    if (ecs) {
      productionElectricite.conso_elec_ac_ecs = (this.#taplpi.ecs * ecs) / consoElecTotale;
    }

    const auxiliaireGenerationEcs = efConso.conso_auxiliaire_generation_ecs;
    if (auxiliaireGenerationEcs) {
      productionElectricite.conso_elec_ac_auxiliaire_generation_ecs =
        (this.#taplpi.ecs * auxiliaireGenerationEcs) / consoElecTotale;
    }

    const refroidissement = efConso.conso_fr;
    if (refroidissement) {
      productionElectricite.conso_elec_ac_fr =
        (this.#taplpi.refroidissement * refroidissement) / consoElecTotale;
    }

    const eclairage = efConso.conso_eclairage;
    if (eclairage) {
      productionElectricite.conso_elec_ac_eclairage =
        (this.#taplpi.eclairage * eclairage) / consoElecTotale;
    }

    const auxiliaireVentilation = efConso.conso_auxiliaire_ventilation;
    if (auxiliaireVentilation) {
      productionElectricite.conso_elec_ac_ventilation =
        (this.#taplpi.auxiliaire_ventilation * auxiliaireVentilation) / consoElecTotale;
    }

    const auxiliaireDistributionEcs = efConso.conso_auxiliaire_distribution_ecs;
    if (auxiliaireDistributionEcs) {
      productionElectricite.conso_elec_ac_auxiliaire_distribution_ecs =
        (this.#taplpi.auxiliaire_distribution * auxiliaireDistributionEcs) / consoElecTotale;
    }

    const auxiliaireDistributionCh = efConso.conso_auxiliaire_distribution_ch;
    if (auxiliaireDistributionCh) {
      productionElectricite.conso_elec_ac_auxiliaire_distribution_ch =
        (this.#taplpi.auxiliaire_distribution * auxiliaireDistributionCh) / consoElecTotale;
    }

    productionElectricite.conso_elec_ac_autre_usage =
      (this.#taplpi.autres * ccom) / consoElecTotale;

    return productionElectricite;
  }

  /**
   * Consommation annuelle d’électricité pour "autres usages" (kWhef/an)
   * @param th
   * @param Sh
   * @returns {number}
   */
  getCelecAu(th, Sh) {
    /**
     * Cum : consommation annuelle d’électricité des usages mobiliers
     * Maison individuelle 29
     * Immeuble collectif 27
     */
    const Cum = th === 'maison' ? 29 : 27;

    // Consommation annuelle d’éclairage des parties communes en logement collectif
    const CcomEcl = th === 'maison' ? 0 : 1.1;

    return (CcomEcl + Cum) * Sh;
  }

  /**
   * Production d’électricité par l'ensemble des capteurs photovoltaïques Ppv (en kWh/m²)
   *
   * @param productionElecEnr
   * @param zc_id
   * @param ratioPv {number?} proratisation au logement (1 = aucune). Si l'installation exporte un
   * ratio_virtualisation, celui-ci est retenu en priorité.
   * @returns {number}
   */
  getPpv(productionElecEnr, zc_id, ratioPv = 1) {
    const ePvValues = tvs.e_pv;
    const zc = enums.zone_climatique[zc_id];

    let panneaux_pv_collection = productionElecEnr.panneaux_pv_collection?.panneaux_pv || [];

    if (!Array.isArray(panneaux_pv_collection)) {
      panneaux_pv_collection = [panneaux_pv_collection];
    }

    return panneaux_pv_collection.reduce((acc, panneaux_pv) => {
      const row = tv('coef_orientation_pv', {
        enum_orientation_pv_id: panneaux_pv.enum_orientation_pv_id,
        enum_inclinaison_pv_id: panneaux_pv.enum_inclinaison_pv_id
      });

      if (!row) {
        return acc;
      }

      /**
       * Coefficient de pondération prenant en compte l’altération par rapport à l’orientation optimale (30° auSud)
       * des panneaux photovoltaïques
       */
      const k = row.coef_orientation_pv;

      /**
       * Surface des panneaux photovoltaïques orientés et inclinés de la même manière (m²).
       * Le moteur de référence n'a que S_capteur en entrée (Tribu `photovoltaique.cs` l.8) : la
       * surface saisie est prioritaire, le forfait 1,6 m²/module ne sert qu'à défaut de surface.
       */
      let Scapteur = panneaux_pv.surface_totale_capteurs || 1.6 * panneaux_pv.nombre_module;

      // Installation d'immeuble : surface ramenée au logement
      if (ratioPv !== 1) {
        Scapteur *= Number(panneaux_pv.ratio_virtualisation) || ratioPv;
      }

      // Rendement moyen des modules
      const r = 0.17;

      // Coefficient de perte
      const C = 0.86;

      for (const mois of mois_liste) {
        // Ensoleillement en kWh/m² pour le mois
        const Epv = ePvValues[mois][zc];
        acc += k * Scapteur * r * Epv * C;
      }

      return acc;
    }, 0);
  }
}
