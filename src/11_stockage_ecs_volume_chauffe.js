/**
 * Le stockage ECS d'un générateur est-il en volume chauffé ?
 *
 * Tribu porte l'information au niveau de l'installation (`installation_ECS.Is_volume_chauffee`,
 * Calcul_batiment.cs l.375-377). Dans l'export ADEME, elle se lit, par ordre de priorité :
 * 1. `position_volume_chauffe_stockage` du générateur, s'il est renseigné ;
 * 2. `tv_rendement_distribution_ecs_id` de l'installation : 1 ou 2 (production en volume
 *    habitable) → oui, 3 (production hors volume habitable) → non ;
 * 3. `position_volume_chauffe` du générateur.
 *
 * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - §9.1.1 et §11.3 (rendement de distribution)
 * @param deGenerateur {object} donnee_entree du générateur ECS
 * @param deInstallation {object} donnee_entree de l'installation ECS
 * @returns {boolean}
 */
export function isStockageEcsVolumeChauffe(deGenerateur, deInstallation) {
  const positionStockage = Number.parseInt(deGenerateur.position_volume_chauffe_stockage);
  if (positionStockage === 0 || positionStockage === 1) {
    return positionStockage === 1;
  }

  const rdId = Number.parseInt(deInstallation?.tv_rendement_distribution_ecs_id);
  if (rdId === 1 || rdId === 2) {
    return true;
  }
  if (rdId === 3) {
    return false;
  }

  return Number.parseInt(deGenerateur.position_volume_chauffe) !== 0;
}
