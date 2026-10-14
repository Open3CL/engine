/**
 * DPE immeuble avec une installation ECS individuelle unique décrite pour un logement type.
 *
 * Certains logiciels (3.0.x, 2.0.x, 1.1.x) exportent l'installation ECS individuelle unique d'un
 * immeuble avec `surface_habitable` = SH / N et `nombre_logement` = N, sans `rdim`. Le calcul de
 * référence (Tribu) a été fait avec Rdim = N : le besoin est ramené à un logement
 * (Becs = Becs_immeuble × Sh × Rdim / SH / Rdim = Becs_immeuble / N), les pertes de stockage sont
 * celles d'un seul ballon (Vs non multiplié), puis la consommation est multipliée par Rdim.
 *
 * Sans rdim, Open3CL impute le besoin de tout l'immeuble à un seul ballon : conso_ecs −25 à −30 %.
 * On reconstitue donc rdim = N, ce qui réutilise la chaîne existante (11_ecs.js : besoin / rdim,
 * conso.js : conso × rdim).
 *
 * LICIEL (nombre_logement = 1, Rdim non exporté) n'est pas concerné.
 *
 * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - § 11.6, § 11.6.2 (p. 74-75) et § 17.2.2.3
 * @see Tribu : Calcul_batiment.cs l. 583-588 (Ratio = Sh·Rdim/SH), l. 602-604 (Vs non multiplié),
 * l. 1654-1664 et l. 1052 (Cecs / Rdim puis × Rdim)
 * @see https://github.com/Open3CL/engine/issues/288
 */

/** Tolérance relative sur Sh_ecs × N ≈ SH */
export const TOLERANCE_SURFACE_LOGEMENT_TYPE = 0.05;

/**
 * Rdim implicite de l'installation ECS individuelle unique d'un immeuble, ou null si non concernée.
 *
 * @param th {string} type de bâtiment (maison, appartement, immeuble)
 * @param instal_ecs {Array} installation_ecs
 * @param surfaceHabitableImmeuble {number|string} surface habitable de l'immeuble (SH)
 * @return {number|null}
 */
export function rdimImpliciteEcsIndividuelleUnique(th, instal_ecs, surfaceHabitableImmeuble) {
  if (th !== 'immeuble' || !Array.isArray(instal_ecs) || instal_ecs.length !== 1) return null;

  const de = instal_ecs[0].donnee_entree;
  if (!de || String(de.enum_type_installation_id) !== '1' || de.rdim) return null;

  const N = Number(de.nombre_logement);
  const SH = Number(surfaceHabitableImmeuble);
  const sh = Number(de.surface_habitable);
  if (!(N > 1) || !(SH > 0) || !(sh > 0)) return null;

  return Math.abs(sh * N - SH) <= TOLERANCE_SURFACE_LOGEMENT_TYPE * SH ? N : null;
}

/**
 * Reconstitue le rdim de l'installation ECS individuelle unique d'un immeuble décrite pour un
 * logement type. L'installation reçoit `rdim` = nombre_logement et le flag `rdim_reconstitue`.
 *
 * @param th {string} type de bâtiment
 * @param instal_ecs {Array} installation_ecs
 * @param surfaceHabitableImmeuble {number|string} surface habitable de l'immeuble (SH)
 * @return {boolean} true si le rdim a été reconstitué
 */
export function reconstituerRdimEcsIndividuelleUnique(th, instal_ecs, surfaceHabitableImmeuble) {
  const rdim = rdimImpliciteEcsIndividuelleUnique(th, instal_ecs, surfaceHabitableImmeuble);
  if (rdim === null) return false;
  instal_ecs[0].donnee_entree.rdim = rdim;
  instal_ecs[0].donnee_entree.rdim_reconstitue = true;
  return true;
}
