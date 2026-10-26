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

/**
 * DPE immeuble avec plusieurs installations ECS individuelles, chacune décrite pour un logement type.
 *
 * Même convention d'export que l'installation unique (3.0.x, 2.0.x, 1.1.x) : pour chaque
 * installation i, `surface_habitable` = Sh_i d'un logement type et `nombre_logement` = N_i, sans
 * `rdim`, avec Σ Sh_i × N_i = SH. Tribu traite chaque installation indépendamment avec Rdim_i = N_i :
 * Becs_i = Becs_immeuble × Sh_i × Rdim_i / SH / Rdim_i, puis Cecs = Σ Cecs_i × Rdim_i. L'export ADEME
 * le confirme : besoin_ecs_i = Becs_immeuble × Sh_i / SH et conso_ecs = Σ conso_ecs_i × N_i.
 *
 * Sans rdim, Σ Sh_i ≠ SH : Open3CL se replie sur Becs_immeuble / nombre_appartement par
 * installation et ne remultiplie pas la conso par N_i.
 *
 * Gardes :
 * - Σ Sh_i × N_i ≈ SH (TOLERANCE_SURFACE_LOGEMENT_TYPE) : exclut les exports où Sh_i est déjà
 *   la surface totale desservie (Σ Sh_i = SH, ex. N_i fractionnaires) ;
 * - au moins un N_i > 1 : sinon rdim = 1 partout, sans effet (LICIEL, nombre_logement = 1).
 *
 * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - § 11.4 et § 17.1.3.2
 * @see Tribu : Calcul_batiment.cs l. 581-588 (boucle par installation, Ratio = Sh·Rdim/SH,
 * Becs / Rdim), l. 1660-1662 (Cecs_i / Rdim puis × Rdim) ; Calcul_installation_ECS.cs l. 75
 * @see Guide Tribu TE-211208 « Particularités d'une répétition de systèmes d'ECS individuel dans un
 * immeuble collectif » (Sh_ecs = surface d'un logement, Rdim = nombre d'installations identiques)
 */

/**
 * Rdim implicites des installations ECS individuelles multiples d'un immeuble (dans l'ordre des
 * installations), ou null si non concernées.
 *
 * @param th {string} type de bâtiment (maison, appartement, immeuble)
 * @param instal_ecs {Array} installation_ecs
 * @param surfaceHabitableImmeuble {number|string} surface habitable de l'immeuble (SH)
 * @return {number[]|null}
 */
export function rdimsImplicitesEcsIndividuellesMultiples(th, instal_ecs, surfaceHabitableImmeuble) {
  if (th !== 'immeuble' || !Array.isArray(instal_ecs) || instal_ecs.length < 2) return null;

  const des = instal_ecs.map((inst) => inst?.donnee_entree);
  const concernees = des.every(
    (de) => de && String(de.enum_type_installation_id) === '1' && !de.rdim
  );
  if (!concernees) return null;

  const SH = Number(surfaceHabitableImmeuble);
  if (!(SH > 0)) return null;

  const surfaces = des.map((de) => Number(de.surface_habitable));
  const rdims = des.map((de) => Number(de.nombre_logement) || 1);
  if (!surfaces.every((sh) => sh > 0) || !rdims.every((n) => n > 0)) return null;
  if (!rdims.some((n) => n > 1)) return null;

  const sommeShN = surfaces.reduce((acc, sh, i) => acc + sh * rdims[i], 0);
  return Math.abs(sommeShN - SH) <= TOLERANCE_SURFACE_LOGEMENT_TYPE * SH ? rdims : null;
}

/**
 * Reconstitue le rdim des installations ECS individuelles multiples d'un immeuble décrites pour un
 * logement type. Chaque installation reçoit `rdim` = nombre_logement (1 si absent) et le flag
 * `rdim_reconstitue`.
 *
 * @param th {string} type de bâtiment
 * @param instal_ecs {Array} installation_ecs
 * @param surfaceHabitableImmeuble {number|string} surface habitable de l'immeuble (SH)
 * @return {boolean} true si les rdim ont été reconstitués
 */
export function reconstituerRdimEcsIndividuellesMultiples(
  th,
  instal_ecs,
  surfaceHabitableImmeuble
) {
  const rdims = rdimsImplicitesEcsIndividuellesMultiples(th, instal_ecs, surfaceHabitableImmeuble);
  if (rdims === null) return false;
  instal_ecs.forEach((inst, i) => {
    inst.donnee_entree.rdim = rdims[i];
    inst.donnee_entree.rdim_reconstitue = true;
  });
  return true;
}
