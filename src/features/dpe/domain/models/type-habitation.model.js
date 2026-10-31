/**
 * Valeur d'un type d'habitation (MAISON | APPARTEMENT | IMMEUBLE).
 * @typedef {'MAISON' | 'APPARTEMENT' | 'IMMEUBLE'} TypeHabitation
 */
export const TypeHabitation = /** @type {const} */ ({
  MAISON: 'MAISON',
  APPARTEMENT: 'APPARTEMENT',
  IMMEUBLE: 'IMMEUBLE'
});
/**
 * Valeur d'un type de DPE.
 * @typedef {'MAISON' | 'APPARTEMENT' | 'APPARTEMENT_A_PARTIR_IMMEUBLE' | 'IMMEUBLE'} TypeDpe
 */
export const TypeDpe = /** @type {const} */ ({
  MAISON: 'MAISON',
  APPARTEMENT: 'APPARTEMENT',
  APPARTEMENT_A_PARTIR_IMMEUBLE: 'APPARTEMENT_A_PARTIR_IMMEUBLE',
  IMMEUBLE: 'IMMEUBLE'
});
