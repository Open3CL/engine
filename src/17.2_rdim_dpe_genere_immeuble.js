/**
 * DPE appartement généré à partir d'un DPE immeuble (méthodes 10 à 13, 33-34, 38-40).
 *
 * Certains logiciels (LICIEL / BBS_Slama) exportent une installation individuelle décrite sur la
 * surface de l'immeuble entier (Sh_i ≈ SH immeuble) avec un `rdim` égal à 1, alors que le calcul
 * (Tribu) a été fait avec un Rdim implicite égal au nombre de logements desservis. La consommation
 * sortie ADEME vaut alors : clé × Σ C_i × (na × Sh_i / SH).
 *
 * En mode `bug_for_bug_compat`, on reconstitue ce rdim (`rdim = na × Sh_i / SH`), on calcule
 * l'installation à l'échelle de l'immeuble, puis on applique la clé de répartition exportée :
 *  - chauffage individuel, gestion homogène : coef_IFC = 1 → Cch_ap = Clé_ap × Cch (et Caux_ch) ;
 *  - ECS : Cecs_ap = Cecs × Becs_ap / Becs (chaîne existante cle_ecs × rdim).
 *
 * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - § 17.2.2.2.2 (p. 115) et § 17.2.2.3.1 (p. 116)
 * @see Tribu : Calcul_installation.cs l. 62 (Rdim lu en entrée), Calcul_batiment.cs l. 836-958
 * (conso = Cch1 × Rdim) et l. 1560 (Cdimref = Pn × Rdim)
 * @see https://github.com/Open3CL/engine/issues/287
 */

/** Ratio na × Sh_i / SH au-delà duquel l'installation est considérée comme « immeuble » */
export const SEUIL_RDIM_IMPLICITE = 1.5;

/**
 * Rdim implicite d'une installation individuelle exportée avec rdim = 1, ou null si l'installation
 * n'est pas concernée.
 *
 * @param de {object} donnee_entree de l'installation (chauffage ou ECS)
 * @param surface {number|string} surface desservie par l'installation (Sh_i)
 * @param nombreAppartement {number|string} nombre de logements de l'immeuble (na)
 * @param surfaceHabitableImmeuble {number|string} surface habitable de l'immeuble (SH)
 * @return {number|null}
 */
export function rdimImplicite(de, surface, nombreAppartement, surfaceHabitableImmeuble) {
  if (!de || de.enum_type_installation_id !== '1') return null;
  if ((Number(de.rdim) || 1) !== 1) return null;

  const na = Number(nombreAppartement);
  const SH = Number(surfaceHabitableImmeuble);
  const Shi = Number(surface);
  if (!(na > 1) || !(SH > 0) || !(Shi > 0)) return null;

  const rdim = (na * Shi) / SH;
  return rdim > SEUIL_RDIM_IMPLICITE ? rdim : null;
}

/**
 * Reconstitue le rdim des installations individuelles d'un DPE appartement généré depuis un DPE
 * immeuble. Les installations concernées reçoivent `rdim` reconstitué et le flag `rdim_reconstitue`.
 * Chauffage et ECS sont traités indépendamment.
 *
 * @param cg {object} caracteristique_generale
 * @param instal_ch {Array} installation_chauffage
 * @param instal_ecs {Array} installation_ecs
 * @return {{ch: boolean, ecs: boolean}} installations reconstituées
 */
export function reconstituerRdimDpeGenereImmeuble(cg, instal_ch, instal_ecs) {
  const na = cg?.nombre_appartement;
  const SH = cg?.surface_habitable_immeuble;

  const appliquer = (installations, champSurface) =>
    (installations || []).reduce((found, inst) => {
      const de = inst.donnee_entree;
      const rdim = rdimImplicite(de, de?.[champSurface], na, SH);
      if (rdim === null) return found;
      de.rdim = rdim;
      de.rdim_reconstitue = true;
      return true;
    }, false);

  const ch = appliquer(instal_ch, 'surface_chauffee');
  const ecs = appliquer(instal_ecs, 'surface_habitable');
  return { ch, ecs };
}
