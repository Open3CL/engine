/**
 * Estimation de la puissance nominale d'un générateur à combustion individuel lorsque `pn` n'est
 * pas connue (repli du moteur quand `donnee_intermediaire.pn` est absente).
 *
 * Méthode 3CL-DPE 2021, §13.2.2.4 « Calcul des puissances nominales » (p.90-91) :
 *  1. Pch = Sh1/Shtot × 1,2 × GV × (19 − Tbase) / (1000 × 0,95³)   (cf. `pnEstimee`)
 *  2. Pecs selon le type de production d'ECS (volume de stockage Vs) ;
 *  3. Pdim = max(Pch ; Pecs) ;
 *  4. Pn des chaudières lue dans la table Pdim → Pn (chaudières murales installées avant 2006 ou
 *     chaudières au sol / chaudières murales installées à partir de 2006).
 *
 * Les autres générateurs à combustion (radiateurs gaz, générateurs d'air chaud, poêles,
 * accumulateurs, chauffe-eau…) conservent Pn = Pdim.
 *
 * Le moteur de référence (Tribu) ne fait pas cette estimation (Pn est une donnée d'entrée
 * obligatoire) : elle relève du logiciel de saisie et sert surtout aux saisies incomplètes et aux
 * recommandations.
 *
 * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.2.4 Calcul des puissances nominales (p.90-91)
 */

/**
 * Année à partir de laquelle les chaudières murales relèvent de la seconde colonne de la table
 * Pdim → Pn.
 */
export const ANNEE_CHAUDIERE_MURALE_RECENTE = 2006;

/**
 * Table Pdim → Pn (kW) des chaudières : [Pdim max (kW), Pn murale < 2006 ou sol, Pn murale ≥ 2006].
 * Au-delà de 40 kW : Pn = (Partie entière(Pdim / 5) + 1) × 5 pour les deux colonnes.
 */
const TABLE_PDIM_PN = [
  [5, 18, 5],
  [10, 18, 10],
  [13, 18, 13],
  [18, 18, 18],
  [24, 24, 24],
  [28, 28, 28],
  [32, 32, 32],
  [40, 40, 40]
];

/**
 * Puissance de dimensionnement nécessaire pour l'ECS (kW) selon le volume de stockage (L).
 *
 * | Type de production | Volume de stockage | Pecs (kW)                  |
 * |--------------------|--------------------|----------------------------|
 * | Instantanée        | Vs = 0             | 21                         |
 * | Semi-instantanée   | 0 < Vs ≤ 20        | 21 − 0,8 × Vs              |
 * | Semi-accumulation  | 20 < Vs ≤ 150      | 5 − 1,751 × (Vs − 20) / 65 |
 * | Accumulation       | 150 < Vs           | (7,14 × Vs + 428) / 1000   |
 *
 * Formules reprises telles que publiées (p.91).
 *
 * @param volumeStockage {number|string|undefined} Vs (L)
 * @returns {number|undefined} Pecs (kW), undefined si le volume n'est pas renseigné
 */
export function puissanceEcs(volumeStockage) {
  if (volumeStockage === undefined || volumeStockage === null || volumeStockage === '') {
    return undefined;
  }
  const vs = Number(volumeStockage);
  if (!Number.isFinite(vs) || vs < 0) return undefined;

  if (vs === 0) return 21;
  if (vs <= 20) return 21 - 0.8 * vs;
  if (vs <= 150) return 5 - (1.751 * (vs - 20)) / 65;
  return (7.14 * vs + 428) / 1000;
}

/**
 * Pn (kW) d'une chaudière à partir de sa puissance de dimensionnement (table §13.2.2.4).
 *
 * @param pdim {number} Pdim (kW)
 * @param muraleRecente {boolean} true pour une chaudière murale installée à partir de 2006,
 * false pour une chaudière murale installée avant 2006 ou une chaudière au sol
 * @returns {number} Pn (kW)
 */
export function pnChaudiere(pdim, muraleRecente) {
  for (const [pdimMax, pnAncienneOuSol, pnMuraleRecente] of TABLE_PDIM_PN) {
    if (pdim <= pdimMax) {
      return muraleRecente ? pnMuraleRecente : pnAncienneOuSol;
    }
  }
  return (Math.floor(pdim / 5) + 1) * 5;
}

/**
 * Le générateur est-il une chaudière (table Pdim → Pn) ?
 * Les « chaudière(s) … multi bâtiment modélisée comme un réseau de chaleur » ne sont pas
 * concernées (générateurs collectifs).
 *
 * @param libelleTypeGenerateur {string|undefined} libellé enum_type_generateur_ch / _ecs
 * @returns {boolean}
 */
export function isChaudiere(libelleTypeGenerateur) {
  const libelle = (libelleTypeGenerateur ?? '').toString().toLowerCase();
  return libelle.includes('chaudière') && !libelle.includes('réseau de chaleur');
}

/**
 * Intervalle [min ; max] des années d'installation possibles d'après le libellé du type de
 * générateur (« avant 1981 », « 2001-2015 », « après 2015 », « à partir de 2012 »…).
 *
 * @param libelleTypeGenerateur {string|undefined}
 * @returns {{min: number, max: number}}
 */
export function periodeInstallationLibelle(libelleTypeGenerateur) {
  const libelle = (libelleTypeGenerateur ?? '').toString().toLowerCase();
  let match = libelle.match(/(\d{4})\s*-\s*(\d{4})/);
  if (match) return { min: Number(match[1]), max: Number(match[2]) };

  match = libelle.match(/avant (\d{4})/);
  if (match) return { min: -Infinity, max: Number(match[1]) - 1 };

  match = libelle.match(/(?:après|à partir de) (\d{4})/);
  if (match) {
    // « après 2015 » succède à « 2001-2015 » : 2015 appartient déjà à la période précédente
    return { min: Number(match[1]) + (libelle.includes('après') ? 1 : 0), max: Infinity };
  }

  return { min: -Infinity, max: Infinity };
}

/**
 * Année d'installation du générateur : année saisie, sinon année de construction ramenée dans la
 * période indiquée par le type de générateur (une « chaudière gaz à condensation après 2015 » d'un
 * bâtiment de 1970 a été installée après 2015).
 *
 * @param anneeInstallation {number|string|undefined} année d'installation saisie
 * @param anneeConstruction {number|string|undefined} année de construction du bâtiment
 * @param libelleTypeGenerateur {string|undefined}
 * @returns {number|undefined}
 */
export function anneeInstallationGenerateur(
  anneeInstallation,
  anneeConstruction,
  libelleTypeGenerateur
) {
  const saisie = parseInt(anneeInstallation, 10);
  if (Number.isFinite(saisie)) return saisie;

  const { min, max } = periodeInstallationLibelle(libelleTypeGenerateur);
  const construction = parseInt(anneeConstruction, 10);
  if (Number.isFinite(construction)) return Math.min(Math.max(construction, min), max);

  // Période entièrement connue d'un seul côté de 2006 : la borne suffit
  if (Number.isFinite(min) && min >= ANNEE_CHAUDIERE_MURALE_RECENTE) return min;
  if (Number.isFinite(max) && max < ANNEE_CHAUDIERE_MURALE_RECENTE) return max;
  return undefined;
}

/**
 * Valeur de la sous-fiche technique « Chaudière murale » → true (oui), false (non), undefined.
 * @param valeur {string|undefined}
 * @returns {boolean|undefined}
 */
export function valeurChaudiereMurale(valeur) {
  const v = (valeur ?? '').toString().trim().toLowerCase();
  if (v.startsWith('oui')) return true;
  if (v.startsWith('non')) return false;
  return undefined;
}

/**
 * Puissance nominale estimée (W) d'un générateur à combustion sans `pn` (§13.2.2.4).
 *
 * Choix de colonne de la table Pdim → Pn :
 *  - chaudière murale (fiche technique « Chaudière murale : oui ») installée à partir de 2006 →
 *    seconde colonne ;
 *  - chaudière au sol (« Chaudière murale : non ») ou installée avant 2006 → première colonne ;
 *  - type de pose inconnu → seconde colonne si installée à partir de 2006 (chaudières récentes
 *    majoritairement murales), première sinon.
 *
 * @param params {{
 *   pch: number,                      // Pch (W), déjà proratisée à la surface desservie
 *   volumeStockage?: number|string,   // Vs (L) de la production d'ECS assurée par le générateur
 *   usageEcs?: boolean,               // le générateur produit de l'ECS (usage ECS ou mixte)
 *   usageChauffage?: boolean,         // le générateur assure le chauffage (défaut true)
 *   libelleTypeGenerateur?: string,
 *   murale?: boolean,                 // pose murale (undefined si inconnue)
 *   anneeInstallation?: number        // année d'installation (undefined si inconnue)
 * }}
 * @returns {number} Pn (W)
 */
export function pnEstimeeDimensionnement({
  pch,
  volumeStockage,
  usageEcs = false,
  usageChauffage = true,
  libelleTypeGenerateur,
  murale,
  anneeInstallation
}) {
  const pchKw = usageChauffage ? pch / 1000 : 0;
  const pecsKw = usageEcs ? puissanceEcs(volumeStockage) : undefined;
  const pdim = Math.max(pchKw, pecsKw ?? 0);

  // Aucune donnée exploitable pour l'ECS d'un générateur ECS seul : comportement historique (Pch)
  if (!usageChauffage && pecsKw === undefined) {
    return pch;
  }

  if (!isChaudiere(libelleTypeGenerateur)) {
    return pdim * 1000;
  }

  const recente =
    anneeInstallation !== undefined && anneeInstallation >= ANNEE_CHAUDIERE_MURALE_RECENTE;
  const muraleRecente = recente && murale !== false;
  return pnChaudiere(pdim, muraleRecente) * 1000;
}
