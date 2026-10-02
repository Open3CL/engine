/**
 * Puissance nominale d'un générateur à combustion collectif virtualisé (DPE appartement).
 *
 * 17.2.1 - Génération d’un DPE à l’appartement / Traitement des usages collectifs :
 * le générateur collectif est « virtualisé » pour le logement. Le champ `pn` attend alors la
 * puissance virtualisée Pe = a × Pn(collectif) (cf. documentation XSD de `pn`), `a` étant le
 * `ratio_virtualisation` de l'installation. Le moteur retrouve Pn(collectif) = pn / a pour lire
 * les tables (critère de puissance, rendements rpn/rpint, pertes à l'arrêt qp0).
 *
 * Tous les logiciels ne respectent pas cette convention (issue #124) : certains (ex. DPEWin)
 * saisissent dans `pn` la puissance du générateur collectif (Pn), d'autres (ex. Liciel) la
 * puissance virtualisée (Pe). Le moteur ne peut pas le savoir a priori, mais les valeurs
 * intermédiaires stockées dans le DPE (rpn, qp0) trahissent la convention réellement utilisée
 * par le logiciel. Même esprit que l'issue #75 (volume de stockage ECS collectif / individualisé).
 *
 * Hypothèses confrontées aux valeurs du DPE :
 *  - individualisée (convention 3CL, comportement par défaut) : pn = Pe -> Pn(collectif) = pn / a ;
 *  - collective virtualisée : pn = Pn(collectif) mais le logiciel a bien virtualisé qp0
 *    -> on ramène pn à Pe = pn × a (la troncature éventuelle de Pn saisi est sans effet notable :
 *    on recalcule Pe à partir de Pn plutôt que de chercher une valeur non tronquée) ;
 *  - collective non virtualisée : pn = Pn(collectif) et le logiciel n'a pas virtualisé du tout
 *    (rendements et qp0 calculés sur Pn) -> reproduit uniquement en mode `bug_for_bug_compat`,
 *    sinon on applique la méthode (pn ramené à Pe = pn × a).
 */

/**
 * Nombre de décimales d'un nombre (notation décimale ou scientifique).
 * @param valeur {number}
 * @returns {number}
 */
export function nombreDecimales(valeur) {
  const [mantisse, exposant] = String(valeur).toLowerCase().split('e');
  const decimales = (mantisse.split('.')[1] || '').length;
  return Math.max(0, decimales - Number(exposant || 0));
}

/**
 * Vrai si la valeur calculée correspond à la valeur stockée dans le DPE, compte tenu de
 * l'arrondi de la valeur stockée et d'une tolérance relative de 0,1 % couvrant la troncature de
 * la puissance saisie. Les logiciels arrondissent au plus à 2 décimales (0.9 vaut 0.90) : la
 * tolérance d'arrondi est la demi-unité de la dernière décimale, au plus 0,005.
 *
 * @param stockee {number} valeur du DPE
 * @param calculee {number} valeur recalculée
 * @returns {boolean}
 */
export function valeurCoherente(stockee, calculee) {
  const tolerance = Math.max(
    0.5 * 10 ** -Math.max(nombreDecimales(stockee), 2),
    1e-3 * Math.abs(stockee)
  );
  return Math.abs(stockee - calculee) <= tolerance * (1 + 1e-9);
}

/**
 * qp0 stocké en W ou en kW selon les logiciels : on accepte les deux unités.
 * @param qp0Stocke {number} qp0 du DPE (W ou kW)
 * @param qp0Calcule {number} qp0 recalculé (W)
 * @returns {boolean}
 */
export function qp0Coherent(qp0Stocke, qp0Calcule) {
  return valeurCoherente(qp0Stocke, qp0Calcule) || valeurCoherente(qp0Stocke, qp0Calcule / 1000);
}

function estNombre(valeur) {
  return typeof valeur === 'number' && Number.isFinite(valeur);
}

/**
 * Inverse une formule de rendement de la table generateur_combustion, de la forme
 * « A + B × log10(Pn) » (en %, Pn en kW) : renvoie Pn (W) tel que formule(Pn) = rendement.
 * La forme est vérifiée numériquement (affine en log10(Pn)) : toute autre forme, ou un rendement
 * indépendant de Pn (B = 0), n'est pas inversible.
 *
 * @param rendement {number} rendement stocké dans le DPE (fraction)
 * @param formule {(pnW: number) => number} rendement (fraction) en fonction de Pn (W)
 * @returns {number|undefined} Pn (W)
 */
export function inverserRendement(rendement, formule) {
  const a = formule(1000);
  const b = formule(10000) - a;
  const affine = Math.abs(formule(100000) - (a + 2 * b)) <= 1e-9;
  if (!estNombre(a) || !estNombre(b) || !affine || Math.abs(b) < 1e-9) {
    return undefined;
  }
  return 1000 * 10 ** ((rendement - a) / b);
}

/**
 * Puissance du générateur collectif Pn (W) retrouvée à partir du rpn stocké dans le DPE, en
 * inversant la formule rpn de la ligne de table. La ligne dépendant elle-même de Pn (critère de
 * puissance), la ligne est re-sélectionnée sur le Pn obtenu jusqu'à stabilité (3 itérations au
 * plus) : le rpn de la ligne finale évalué sur Pn doit redonner exactement le rpn du DPE.
 *
 * @param pnCollectif {number} Pn (W) servant à sélectionner la première ligne
 * @param rpnDpe {number}
 * @param formuleRpn {(pnCollectifW: number) => ((pnW: number) => number)|undefined} formule rpn
 *   (fraction, fonction de Pn en W) de la ligne de table sélectionnée pour un Pn donné
 * @returns {number|undefined} Pn (W)
 */
export function puissanceDepuisRpn(pnCollectif, rpnDpe, formuleRpn) {
  let reference = pnCollectif;
  for (let iteration = 0; iteration < 3; iteration++) {
    const formule = formuleRpn(reference);
    const pn = formule && inverserRendement(rpnDpe, formule);
    if (!estNombre(pn)) {
      return undefined;
    }
    const formuleFinale = formuleRpn(pn);
    if (formuleFinale && Math.abs(formuleFinale(pn) - rpnDpe) <= 1e-9) {
      return pn;
    }
    reference = pn;
  }
  return undefined;
}

/**
 * Vrai si la puissance saisie est une puissance de référence décalée d'une puissance de dix
 * (virgule mal placée ou zéro perdu lors de la saisie : 69600 W pour 696 kW).
 *
 * @param pnSaisi {number} puissance saisie dans le DPE (W)
 * @param puissance {number} puissance de référence (W)
 * @returns {boolean}
 */
export function decalageDecimal(pnSaisi, puissance) {
  return [-3, -2, -1, 1, 2, 3].some((k) => valeurCoherente(pnSaisi, puissance * 10 ** k));
}

/**
 * 4e hypothèse : pn saisi incohérent avec le rpn stocké, que l'on interprète pn comme Pe ou comme
 * Pn(collectif) (ex. puissance tronquée d'un facteur 10). Le rpn stocké, calculé par le logiciel
 * à partir de la table, permet de retrouver Pn(collectif) en inversant la formule rpn de la table ;
 * on retient alors Pe = a × Pn (convention 3CL).
 *
 * Le Pn retrouvé doit être confirmé par une autre valeur du DPE :
 *  - rpint stocké et recalculé : doit être cohérent (sinon abandon) et confirme l'hypothèse ;
 *  - qp0 stocké cohérent (W ou kW, virtualisé ou non) avec le qp0 recalculé ;
 *  - ou pn saisi égal à Pn ou Pe à une puissance de dix près (erreur de saisie de la puissance).
 *
 * @param pn {number} puissance nominale saisie dans le DPE (W)
 * @param ratio {number} ratio de virtualisation (0 < ratio < 1)
 * @param valeursDpe {{rpn: number, rpint?: number, qp0?: number}}
 * @param caracteristiques {(pn: number, ratio: number) => {rpn?: number, rpint?: number, qp0?: number}}
 * @param formuleRpn {(pnCollectif: number) => ((pnCollectif: number) => number)|undefined}
 * @returns {{pn: number, ratio: number, convention: 'puissance_depuis_rpn', pnCollectif: number}|undefined}
 */
export function puissanceRecalculeeDepuisRpn(pn, ratio, valeursDpe, caracteristiques, formuleRpn) {
  const pnCollectif = puissanceDepuisRpn(pn / ratio, valeursDpe.rpn, formuleRpn);
  if (!estNombre(pnCollectif)) {
    return undefined;
  }

  const pe = pnCollectif * ratio;
  const recalcule = caracteristiques(pe, ratio);
  const { rpint: rpintDpe, qp0: qp0Dpe } = valeursDpe;

  const rpintControle = estNombre(rpintDpe) && estNombre(recalcule.rpint);
  if (rpintControle && !valeurCoherente(rpintDpe, recalcule.rpint)) {
    return undefined;
  }

  const qp0Confirme =
    estNombre(qp0Dpe) &&
    [recalcule.qp0, caracteristiques(pnCollectif, 1).qp0].some(
      (qp0) => estNombre(qp0) && qp0Coherent(qp0Dpe, qp0)
    );

  if (rpintControle || qp0Confirme || decalageDecimal(pn, pnCollectif) || decalageDecimal(pn, pe)) {
    return { pn: pe, ratio, convention: 'puissance_depuis_rpn', pnCollectif };
  }
  return undefined;
}

/**
 * Détermine la puissance nominale (pn) et le ratio de virtualisation à utiliser pour calculer les
 * caractéristiques (rpn, rpint, qp0) d'un générateur à combustion collectif virtualisé.
 *
 * @param pn {number} puissance nominale saisie dans le DPE (W)
 * @param ratio {number} ratio de virtualisation de l'installation
 * @param valeursDpe {{rpn?: number, rpint?: number, qp0?: number}} valeurs intermédiaires
 *   stockées dans le DPE
 * @param caracteristiques {(pn: number, ratio: number) => {rpn?: number, rpint?: number, qp0?: number}}
 *   calcul des caractéristiques (rpn, rpint, qp0 en W) pour un couple (pn, ratio) ; une
 *   caractéristique non recalculée (saisie) est renvoyée `undefined`
 * @param bugForBugCompat {boolean} reproduire un calcul non virtualisé du logiciel
 * @param [formuleRpn] {(pnCollectif: number) => ((pnCollectif: number) => number)|undefined}
 *   formule rpn (fraction, fonction de Pn collectif en W) de la ligne de table sélectionnée pour
 *   un Pn collectif donné ; absente, la 4e hypothèse (pn recalculé depuis rpn) n'est pas testée
 * @returns {{pn: number, ratio: number, convention: 'individualisee'|'collective_virtualisee'|'collective_non_virtualisee'|'puissance_depuis_rpn', pnCollectif?: number}}
 */
export function conventionPuissanceNominale(
  pn,
  ratio,
  valeursDpe,
  caracteristiques,
  bugForBugCompat,
  formuleRpn
) {
  const individualisee = { pn, ratio, convention: 'individualisee' };
  const rpnDpe = valeursDpe?.rpn;
  const qp0Dpe = valeursDpe?.qp0;

  if (!(ratio > 0 && ratio < 1) || !pn || !estNombre(rpnDpe)) {
    return individualisee;
  }

  /**
   * Le rendement à pleine charge rpn dépend de Pn(collectif) : s'il est cohérent avec pn / a,
   * le pn saisi est bien la puissance virtualisée (convention 3CL).
   */
  const rpnIndividualise = caracteristiques(pn, ratio).rpn;
  if (!estNombre(rpnIndividualise) || valeurCoherente(rpnDpe, rpnIndividualise)) {
    return individualisee;
  }

  /**
   * rpn cohérent avec pn : le logiciel a considéré pn comme la puissance du générateur collectif.
   */
  const virtualisee = caracteristiques(pn * ratio, ratio);
  if (!valeurCoherente(rpnDpe, virtualisee.rpn)) {
    /**
     * pn n'est ni Pe ni Pn(collectif) : Pn(collectif) est retrouvé à partir de rpn (4e hypothèse).
     */
    return (
      (formuleRpn &&
        puissanceRecalculeeDepuisRpn(pn, ratio, valeursDpe, caracteristiques, formuleRpn)) ||
      individualisee
    );
  }

  /**
   * qp0 permet de savoir si le logiciel a malgré tout virtualisé les pertes à l'arrêt.
   * Faute de qp0 exploitable, rpn suffit à établir que pn est la puissance collective.
   */
  if (!estNombre(qp0Dpe) || !estNombre(virtualisee.qp0) || qp0Coherent(qp0Dpe, virtualisee.qp0)) {
    return { pn: pn * ratio, ratio, convention: 'collective_virtualisee' };
  }

  const nonVirtualisee = caracteristiques(pn, 1);
  if (estNombre(nonVirtualisee.qp0) && qp0Coherent(qp0Dpe, nonVirtualisee.qp0)) {
    return bugForBugCompat
      ? { pn, ratio: 1, convention: 'collective_non_virtualisee' }
      : { pn: pn * ratio, ratio, convention: 'collective_virtualisee' };
  }

  return individualisee;
}
