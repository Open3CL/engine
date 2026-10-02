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
 * Détermine la puissance nominale (pn) et le ratio de virtualisation à utiliser pour calculer les
 * caractéristiques (rpn, rpint, qp0) d'un générateur à combustion collectif virtualisé.
 *
 * @param pn {number} puissance nominale saisie dans le DPE (W)
 * @param ratio {number} ratio de virtualisation de l'installation
 * @param valeursDpe {{rpn?: number, qp0?: number}} valeurs intermédiaires stockées dans le DPE
 * @param caracteristiques {(pn: number, ratio: number) => {rpn?: number, qp0?: number}}
 *   calcul des caractéristiques (rpn, qp0 en W) pour un couple (pn, ratio) ; une caractéristique
 *   non recalculée (saisie) est renvoyée `undefined`
 * @param bugForBugCompat {boolean} reproduire un calcul non virtualisé du logiciel
 * @returns {{pn: number, ratio: number, convention: 'individualisee'|'collective_virtualisee'|'collective_non_virtualisee'}}
 */
export function conventionPuissanceNominale(
  pn,
  ratio,
  valeursDpe,
  caracteristiques,
  bugForBugCompat
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
    return individualisee;
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
