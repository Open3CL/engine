/**
 * Génére un contexte du logement à étudier avec des données persistées durant l'analyse
 */
export class ContexteBuilder {
  /**
   * @param dpe {any} Fichier DPE au format json
   * @return {Contexte}
   */
  fromDpe(dpe) {
    return {
      zoneClimatiqueId: dpe.logement.meteo.enum_zone_climatique_id.toString(),
      enumPeriodeConstructionId:
        dpe.logement.caracteristique_generale.enum_periode_construction_id.toString(),
      effetJoule: this.#hasEffetJoule(dpe)
    };
  }

  /**
   * Si un générateur de chauffage par résistance électrique existe, alors effet joule vaut vrai
   * @param dpe {any} Fichier DPE au format json
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
}
