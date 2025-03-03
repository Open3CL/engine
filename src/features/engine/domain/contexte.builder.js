import { TypeDpe, TypeHabitation } from '../../dpe/domain/models/type-habitation.model.js';
import enums from '../../../enums.js';

/**
 * Génère un contexte du logement à étudier avec des données persistées durant l'analyse
 */
export class ContexteBuilder {
  constructor() {}

  /**
   * @param dpe {Dpe}
   * @return {Contexte}
   */
  fromDpe(dpe) {
    const caracteristiqueGenerale = dpe.logement.caracteristique_generale;

    return {
      zoneClimatique: this.#zoneClimatique(dpe),
      typeHabitation: this.#getTypeHabitation(caracteristiqueGenerale),
      typeDpe: this.#getTypeDpe(caracteristiqueGenerale),
      enumPeriodeConstructionId: caracteristiqueGenerale.enum_periode_construction_id?.toString(),
      effetJoule: this.#hasEffetJoule(dpe),
      surfaceHabitable: this.#getSurfaceHabitable(caracteristiqueGenerale),
      hauteurSousPlafond: caracteristiqueGenerale.hsp,
      nombreAppartement: caracteristiqueGenerale.nombre_appartement
    };
  }

  /**
   * La zone climatique à partir du type de DPE
   * @param dpe {Dpe}
   * @return {{id: number, value: string}}
   */
  #zoneClimatique(dpe) {
    const zoneClimatiqueId = parseInt(dpe.logement.meteo?.enum_zone_climatique_id);
    return {
      id: zoneClimatiqueId.toString(),
      value: enums.zone_climatique[zoneClimatiqueId]
    };
  }

  /**
   * Si un générateur de chauffage par résistance électrique existe, alors effet joule vaut vrai
   * @param dpe {Dpe}
   * @return {boolean}
   */
  #hasEffetJoule(dpe) {
    return (
      dpe.logement.installation_chauffage_collection?.installation_chauffage?.find((ic) =>
        ic.emetteur_chauffage_collection?.emetteur_chauffage?.find(
          (emetteur) => parseInt(emetteur.donnee_entree.enum_type_emission_distribution_id) <= 10
        )
      ) !== undefined
    );
  }

  /**
   * Le type d'habitation est détecté à partir du type de DPE
   * @param caracteristiqueGenerale {CaracteristiqueGenerale}
   * @return {TypeHabitation}
   */
  #getTypeHabitation(caracteristiqueGenerale) {
    const methodeApplication = parseInt(
      caracteristiqueGenerale.enum_methode_application_dpe_log_id
    );

    if ([1, 14, 18].includes(methodeApplication)) {
      return TypeHabitation.MAISON;
    } else if (
      [
        2, 3, 4, 5, 10, 11, 12, 13, 15, 16, 19, 20, 22, 23, 24, 25, 31, 32, 33, 34, 35, 36, 37, 38,
        39, 40
      ].includes(methodeApplication)
    ) {
      return TypeHabitation.APPARTEMENT;
    }
    return TypeHabitation.IMMEUBLE;
  }

  /**
   * Le type de DPE est détecté à partir du type de DPE
   * @param caracteristiqueGenerale {CaracteristiqueGenerale}
   * @return {TypeDpe}
   */
  #getTypeDpe(caracteristiqueGenerale) {
    const methodeApplication = parseInt(
      caracteristiqueGenerale.enum_methode_application_dpe_log_id
    );

    if ([1, 14, 18].includes(methodeApplication)) {
      return TypeDpe.MAISON;
    } else if ([2, 3, 4, 5, 31, 32, 35, 36, 37].includes(methodeApplication)) {
      return TypeDpe.APPARTEMENT;
    }
    return TypeDpe.IMMEUBLE;
  }

  /**
   * @param caracteristiqueGenerale {CaracteristiqueGenerale}
   * @return {number}
   */
  #getSurfaceHabitable(caracteristiqueGenerale) {
    /**
     * Certains DPE appartement sont générés à partir des données du DPE immeuble, la surface à prendre en compte est
     * celle de l'immeuble pour les besoins ECS
     * 10 - dpe appartement généré à partir des données DPE immeuble chauffage individuel ecs individuel
     * 11 - dpe appartement généré à partir des données DPE immeuble chauffage collectif ecs individuel
     * 12 - dpe appartement généré à partir des données DPE immeuble chauffage individuel ecs collectif
     * 13 - dpe appartement généré à partir des données DPE immeuble chauffage collectif ecs collectif
     * 15 - dpe issu d'une étude thermique réglementaire RT2012 bâtiment : appartement chauffage collectif ecs collectif
     * 16 - dpe issu d'une étude thermique réglementaire RT2012 bâtiment : appartement chauffage individuel ecs collectif
     * 19 - dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : appartement chauffage collectif ecs collectif
     * 20 - dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : appartement chauffage individuel ecs collectif
     * 22 - dpe issu d'une étude thermique réglementaire RT2012 bâtiment : appartement chauffage individuel ecs individuel
     * 23 - dpe issu d'une étude thermique réglementaire RT2012 bâtiment : appartement chauffage collectif ecs individuel
     * 24 - dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : appartement chauffage collectif ecs individuel
     * 25 - dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : appartement chauffage individuel ecs individuel
     * 33 - dpe appartement généré à partir des données DPE immeuble chauffage mixte (collectif-individuel) ecs individuel
     * 34 - dpe appartement généré à partir des données DPE immeuble chauffage mixte (collectif-individuel) ecs collectif
     * 38 - dpe appartement généré à partir des données DPE immeuble chauffage mixte (collectif-individuel) ecs mixte (collectif-individuel)
     * 39 - dpe appartement généré à partir des données DPE immeuble chauffage individuel ecs mixte (collectif-individuel)
     * 40 - dpe appartement généré à partir des données DPE immeuble chauffage collectif ecs mixte (collectif-individuel)
     */
    if (
      [10, 11, 12, 13, 15, 16, 19, 20, 22, 23, 24, 25, 33, 34, 38, 39, 40].includes(
        parseInt(caracteristiqueGenerale.enum_methode_application_dpe_log_id)
      )
    ) {
      return caracteristiqueGenerale.surface_habitable_immeuble;
    }

    return this.#getTypeHabitation(caracteristiqueGenerale) === TypeHabitation.IMMEUBLE
      ? caracteristiqueGenerale.surface_habitable_immeuble
      : caracteristiqueGenerale.surface_habitable_logement;
  }
}
