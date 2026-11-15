/**
 * DPE immeuble dont les installations de chauffage desservent aussi une surface tertiaire.
 *
 * Le DPE immeuble ne porte que sur la partie habitation (`surface_habitable_immeuble`, SH), mais les
 * installations de chauffage collectives sont décrites sur toute la surface desservie (habitation +
 * tertiaire : Σ `surface_chauffee` ≈ SH + `surface_tertiaire_immeuble`, ST). LICIEL (Tribu) ramène
 * alors la consommation de chauffage de l'immeuble à la part habitation :
 *
 *   conso_ch (sortie) = Σ_i conso_ch_i × rdim_i × SH / (SH + ST)
 *
 * Mesuré sur les DPE LICIEL du corpus immeuble avec ST > 0 : 179 / 184 reproduisent ce facteur à
 * 0,5 % près (SH / Σ surface_chauffee ne le reproduit pas quand une installation porte un rdim ≠ 1).
 * L'ECS, les auxiliaires et l'éclairage ne sont pas proratisés. Pleiades, Expertec et 7.5 exportent
 * un facteur 1 : ils sont exclus.
 *
 * Le moteur Tribu ne connaît pas le tertiaire (aucune occurrence dans DPE.Core) : Stotal = SH
 * (Calcul_batiment.cs l. 478) et S_ratio = Sh_chauffee × Rdim / Stotal (Calcul_installation.cs
 * l. 79). Le facteur est donc appliqué par LICIEL (entrée SH + ST, puis sortie ramenée à SH).
 * La méthode 3CL (§ 17.4, immeuble collectif mixte) demande de calculer le besoin sur logements +
 * tertiaire puis de le ramener aux seuls logements, sans préciser le prorata : SH / (SH + ST) est
 * une convention du logiciel, appliquée seulement en mode `compat_for_corpus_analysis`.
 *
 * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - § 17.4
 */

/**
 * @param version_logiciel {string|undefined} administratif.diagnostiqueur.version_logiciel
 * @returns {boolean} true si le logiciel est LICIEL
 */
function estLiciel(version_logiciel) {
  return /liciel/i.test(version_logiciel || '');
}

/**
 * Part habitation de la consommation de chauffage d'un DPE immeuble avec surface tertiaire.
 *
 * @param th {string} type de bâtiment (maison, appartement, immeuble)
 * @param cg {object} caracteristique_generale
 * @param version_logiciel {string|undefined} administratif.diagnostiqueur.version_logiciel
 * @param compat {boolean} mode `compat_for_corpus_analysis`
 * @returns {number} facteur appliqué à la consommation de chauffage (1 si non concerné)
 */
export function prorataChauffageTertiaire(th, cg, version_logiciel, compat) {
  if (!compat || th !== 'immeuble' || !estLiciel(version_logiciel)) return 1;

  const SH = Number(cg?.surface_habitable_immeuble);
  const ST = Number(cg?.surface_tertiaire_immeuble);
  if (!(SH > 0) || !(ST > 0)) return 1;

  return SH / (SH + ST);
}
