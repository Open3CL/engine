import enums from './enums.js';
import { bug_for_bug_compat, requestInput, requestInputID, tv } from './utils.js';

const coef_pond = {
  0.05: 0.1,
  0.15: 0.25,
  0.25: 0.2,
  0.35: 0.15,
  0.45: 0.1,
  0.55: 0.1,
  0.65: 0.05,
  0.75: 0.025,
  0.85: 0.025,
  0.95: 0
};

const K = {
  électricité: 1,
  'gaz naturel': 1.11,
  gpl: 1.09,
  'fioul domestique': 1.07,
  'bois – bûches': 1.08,
  'bois – granulés (pellets) ou briquettes': 1.08,
  'bois – plaquettes forestières': 1.08,
  'bois – plaquettes d’industrie': 1.08,
  'réseau de chauffage urbain': 1,
  charbon: 1.04,
  propane: 1.11,
  butane: 1.11,
  "électricité d'origine renouvelable utilisée dans le bâtiment": undefined,
  'autre combustible fossile': undefined,
  'réseau de froid urbain': undefined
};

/**
 * Planchers / plafonds chauffants sur réseau d'eau chaude « basse ou moyenne température
 * (inf 65°c) » (enum_type_emission_distribution_id 12, 14, 16, 18).
 */
export const EMISSION_PLANCHER_PLAFOND_CHAUFFANT_BT = ['12', '14', '16', '18'];

/**
 * Température de distribution à utiliser pour les tables temp_fonc_30 / temp_fonc_100.
 *
 * Un plancher (ou plafond) chauffant à eau < 65 °C fonctionne en basse température : comme le
 * moteur de référence CSTB (Tribu), qui déduit la ligne « basse » du type d'émetteur plancher
 * chauffant, on retient « basse » (id 2) lorsque le DPE déclare « moyenne » (id 3) pour ces
 * émetteurs. Les logiciels du marché (ex. LICIEL) calculent ainsi mais exportent « moyenne ».
 *
 * @param emChDe {object} donnee_entree de l'émetteur
 * @param emChDu {object} donnee_utilisateur de l'émetteur
 * @return {string|undefined}
 */
export function tempDistributionChPourTempFonc(emChDe, emChDu) {
  const tempDistribution = requestInputID(emChDe, emChDu, 'temp_distribution_ch');
  const typeEmission = String(emChDe?.enum_type_emission_distribution_id ?? '');
  if (
    String(tempDistribution) === '3' &&
    EMISSION_PLANCHER_PLAFOND_CHAUFFANT_BT.includes(typeEmission)
  ) {
    return '2';
  }
  return tempDistribution;
}

/**
 * Périodes d'installation des émetteurs (table temp_fonc_30 / temp_fonc_100), de la plus ancienne
 * à la plus récente.
 */
export const PERIODES_INSTALLATION_EMETTEUR = ['avant 1981', 'entre 1981 et 2000', 'après 2000'];

/**
 * Tolérance (°C) pour considérer qu'une température de fonctionnement issue des tables reproduit
 * celle stockée dans le DPE.
 */
export const TOLERANCE_TEMP_FONC = 0.01;

/**
 * 13.2.1.5 Chaudières basse température et condensation
 * « Si l'année d'installation des émetteurs est inconnue, prendre l'année de construction du
 * bâtiment. »
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.1.5
 *
 * @param ac {number} année de construction du bâtiment
 * @return {string} période d'installation des émetteurs
 */
export function periodeEmetteurAnneeConstruction(ac) {
  if (ac < 1981) return PERIODES_INSTALLATION_EMETTEUR[0];
  if (ac < 2000) return PERIODES_INSTALLATION_EMETTEUR[1];
  return PERIODES_INSTALLATION_EMETTEUR[2];
}

function estNumerique(valeur) {
  return (
    valeur !== null && valeur !== undefined && valeur !== '' && Number.isFinite(Number(valeur))
  );
}

/**
 * Lignes des tables temp_fonc_30 / temp_fonc_100 retenues pour un générateur (maximum sur les
 * émetteurs), en affectant `periodeParDefaut` aux émetteurs dont la période d'installation n'est
 * pas saisie. Les émetteurs sans réseau de distribution (enum_temp_distribution_ch_id = 1) sont
 * exclus. Utilisé uniquement pour la déduction de période en mode bug_for_bug_compat.
 *
 * @param de {object} donnee_entree du générateur
 * @param em_ch {object[]} émetteurs de l'installation
 * @param periodeParDefaut {string} période affectée aux émetteurs sans période saisie
 * @return {{row_30: object|null, row_100: object|null}}
 */
export function temp_fonc_pour_periode(de, em_ch, periodeParDefaut) {
  let row_30 = null;
  let row_100 = null;
  for (const em of em_ch) {
    const em_ch_de = em.donnee_entree;
    const em_ch_du = em.donnee_utilisateur;
    if (String(requestInputID(em_ch_de, em_ch_du, 'temp_distribution_ch')) === '1') continue;
    const matcher = {
      enum_type_generateur_ch_id: de.enum_type_generateur_ch_id,
      enum_temp_distribution_ch_id: tempDistributionChPourTempFonc(em_ch_de, em_ch_du),
      periode_emetteurs:
        requestInput(em_ch_de, em_ch_du, 'periode_installation_emetteur') || periodeParDefaut
    };
    const r30 = tv('temp_fonc_30', matcher);
    const r100 = tv('temp_fonc_100', matcher);
    if (r30 && (!row_30 || Number(r30.temp_fonc_30) > Number(row_30.temp_fonc_30))) row_30 = r30;
    if (r100 && (!row_100 || Number(r100.temp_fonc_100) > Number(row_100.temp_fonc_100))) {
      row_100 = r100;
    }
  }
  return { row_30, row_100 };
}

/**
 * Mode bug_for_bug_compat uniquement (issue #220).
 *
 * Certains logiciels (ex. 4.1.1 / moteur 3cl-2024.6.1.0, LICIEL) calculent les températures de
 * fonctionnement avec une période d'installation des émetteurs qu'ils n'exportent pas, mais
 * stockent temp_fonc_30 / temp_fonc_100 dans les données intermédiaires du générateur. La période
 * est alors retrouvée en testant chaque période candidate (appliquée à tous les émetteurs sans
 * période saisie) et en ne retenant que celles qui reproduisent les DEUX valeurs du DPE.
 *
 * - une seule candidate : retenue ;
 * - plusieurs : celle de l'année de construction si elle en fait partie, sinon la plus récente ;
 * - aucune : null (repli sur l'année de construction, valeurs hors tables).
 *
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.1.5
 *
 * @param tempFonc30Dpe {number} temp_fonc_30 d'origine du DPE
 * @param tempFonc100Dpe {number} temp_fonc_100 d'origine du DPE
 * @param de {object} donnee_entree du générateur
 * @param em_ch {object[]} émetteurs de l'installation
 * @param ac {number} année de construction
 * @return {string|null} période déduite, ou null si aucune période ne reproduit le DPE
 */
export function periodeEmetteursDeduiteDuDpe(tempFonc30Dpe, tempFonc100Dpe, de, em_ch, ac) {
  const candidates = PERIODES_INSTALLATION_EMETTEUR.filter((periode) => {
    const { row_30, row_100 } = temp_fonc_pour_periode(de, em_ch, periode);
    return (
      row_30 &&
      row_100 &&
      Math.abs(Number(row_30.temp_fonc_30) - tempFonc30Dpe) <= TOLERANCE_TEMP_FONC &&
      Math.abs(Number(row_100.temp_fonc_100) - tempFonc100Dpe) <= TOLERANCE_TEMP_FONC
    );
  });
  if (candidates.length === 0) return null;
  const periodeConstruction = periodeEmetteurAnneeConstruction(ac);
  if (candidates.includes(periodeConstruction)) return periodeConstruction;
  return candidates[candidates.length - 1];
}

/**
 * Indique si la déduction de la période des émetteurs à partir des données intermédiaires du DPE
 * doit être tentée : mode bug_for_bug_compat, au moins un émetteur (avec réseau de distribution)
 * sans période saisie, et temp_fonc_30 ET temp_fonc_100 d'origine présentes et numériques.
 *
 * @param tempFonc30Dpe {*} temp_fonc_30 d'origine du DPE
 * @param tempFonc100Dpe {*} temp_fonc_100 d'origine du DPE
 * @param em_ch {object[]} émetteurs de l'installation
 * @return {boolean}
 */
export function deductionPeriodeEmetteursActive(tempFonc30Dpe, tempFonc100Dpe, em_ch) {
  if (!bug_for_bug_compat) return false;
  if (!estNumerique(tempFonc30Dpe) || !estNumerique(tempFonc100Dpe)) return false;
  return em_ch.some(
    (em) =>
      String(requestInputID(em.donnee_entree, em.donnee_utilisateur, 'temp_distribution_ch')) !==
        '1' &&
      !requestInput(em.donnee_entree, em.donnee_utilisateur, 'periode_installation_emetteur')
  );
}

/**
 * Températures de fonctionnement à 30 % et 100 % de charge.
 *
 * `di` est la donnee_intermediaire du générateur issue du DPE d'entrée : à l'appel, temp_fonc_30 /
 * temp_fonc_100 contiennent les valeurs d'origine du DPE (jamais une valeur recalculée par
 * Open3CL). En mode bug_for_bug_compat, elles servent uniquement à retrouver la période
 * d'installation des émetteurs non exportée (issue #220) ; les valeurs retenues proviennent
 * toujours des tables (tv_temp_fonc_30_id / tv_temp_fonc_100_id renseignés).
 *
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.1.5
 */
export function tv_temp_fonc_30_100(di, de, du, em_ch, ac) {
  const tempFonc30Dpe = di.temp_fonc_30;
  const tempFonc100Dpe = di.temp_fonc_100;
  if (deductionPeriodeEmetteursActive(tempFonc30Dpe, tempFonc100Dpe, em_ch)) {
    const periode = periodeEmetteursDeduiteDuDpe(
      Number(tempFonc30Dpe),
      Number(tempFonc100Dpe),
      de,
      em_ch,
      ac
    );
    if (periode) {
      const { row_30, row_100 } = temp_fonc_pour_periode(de, em_ch, periode);
      console.warn(
        `période d'installation des émetteurs déduite des données intermédiaires du DPE : ${periode} (générateur ${de.description}, temp_fonc_30 = ${row_30.temp_fonc_30}, temp_fonc_100 = ${row_100.temp_fonc_100})`
      );
      de.tv_temp_fonc_30_id = row_30.tv_temp_fonc_30_id;
      di.temp_fonc_30 = Number(row_30.temp_fonc_30);
      de.tv_temp_fonc_100_id = row_100.tv_temp_fonc_100_id;
      di.temp_fonc_100 = Number(row_100.temp_fonc_100);
      return;
    }
    console.warn(
      `période d'installation des émetteurs non déductible pour le générateur ${de.description} : valeurs hors tables / donnée d'entrée incohérente (temp_fonc_30 = ${tempFonc30Dpe}, temp_fonc_100 = ${tempFonc100Dpe}). Repli sur l'année de construction.`
    );
  }

  for (const em of em_ch) {
    const em_ch_de = em.donnee_entree;
    const em_ch_du = em.donnee_utilisateur;
    const matcher = {
      enum_type_generateur_ch_id: de.enum_type_generateur_ch_id,
      enum_temp_distribution_ch_id: tempDistributionChPourTempFonc(em_ch_de, em_ch_du),
      periode_emetteurs: requestInput(em_ch_de, em_ch_du, 'periode_installation_emetteur')
    };

    if (!matcher.periode_emetteurs) {
      matcher.periode_emetteurs = periodeEmetteurAnneeConstruction(ac);
    }

    const row_30 = tv('temp_fonc_30', matcher);
    const row_100 = tv('temp_fonc_100', matcher);

    if (row_30) {
      if (!di.temp_fonc_30 || Number(row_30.temp_fonc_30) > di.temp_fonc_30) {
        de.tv_temp_fonc_30_id = row_30.tv_temp_fonc_30_id;
        di.temp_fonc_30 = Number(row_30.temp_fonc_30);
      }
    } else {
      console.error('!! pas de valeur forfaitaire trouvée pour temp_fonc_30 !!');
    }

    if (row_100) {
      if (!di.temp_fonc_100 || Number(row_100.temp_fonc_100) > di.temp_fonc_100) {
        de.tv_temp_fonc_100_id = row_100.tv_temp_fonc_100_id;
        di.temp_fonc_100 = Number(row_100.temp_fonc_100);
      }
    } else {
      console.error('!! pas de valeur forfaitaire trouvée pour temp_fonc_100 !!');
    }
  }
}

function Tch_xfinal(x, Cdimref) {
  return Math.min(1, x / Cdimref);
}

function QPx(x, de, di) {
  const type_gen_ch = enums.type_generateur_ch[de.enum_type_generateur_ch_id];
  const type_energie = enums.type_energie[de.enum_type_energie_id];
  const k = K[type_energie];
  const pn = di.pn / 1000;
  const rpn = (100 * di.rpn) / k;
  const rpint = (100 * di.rpint) / k;
  let qp0 = (di.qp0 * k) / 1000;
  const tf30 = di.temp_fonc_30;
  const tf100 = di.temp_fonc_100;

  let QPx;
  if (type_gen_ch.includes('radiateur à gaz')) {
    QPx = ((1.04 * (100 - rpn)) / rpn) * pn * x;
  } else if (type_gen_ch.includes('chaudière bois') || type_gen_ch.includes('chaudière charbon')) {
    const QP50 = (0.5 * pn * (100 - rpint)) / rpint;
    const QP100 = (pn * (100 - rpn)) / rpn;
    if (x < 0.5) QPx = 0.15 * qp0 + ((QP50 - 0.15 * qp0) * x) / 0.5;
    else QPx = 2 * QP50 - QP100 + ((QP100 - QP50) * x) / 0.5;
  } else if (type_gen_ch.includes('chaudière')) {
    let tf;
    if (de.presence_regulation_combustion) tf = tf30;
    else tf = tf100;
    let QP30, a, b;
    if (type_gen_ch.includes('basse température')) {
      a = 0.1;
      b = 40;
    } else if (type_gen_ch.includes('condensation')) {
      a = 0.2;
      b = 33;
    } else {
      a = 0.1;
      b = 50;
    }
    QP30 = (0.3 * pn * (100 - (rpint + a * (b - tf)))) / (rpint + a * (b - tf));
    const QP100 = (pn * (100 - (rpn + 0.1 * (70 - tf100)))) / (rpn + 0.1 * (70 - tf100));
    const QP15 = QP30 / 2;
    if (type_gen_ch.includes('basse température') || type_gen_ch.includes('condensation')) {
      if (x < 0.15) QPx = 0.15 * qp0 + ((QP15 - 0.15 * qp0) * x) / 0.15;
      else if (x < 0.3) QPx = QP15 + ((QP30 - QP15) * (x - 0.15)) / 0.15;
      else QPx = QP30 + ((QP100 - QP30) * (x - 0.3)) / 0.7;
    } else {
      if (x < 0.3) QPx = 0.15 * qp0 + ((QP30 - 0.15 * qp0) * x) / 0.3;
      else QPx = QP30 + ((QP100 - QP30) * (x - 0.3)) / 0.7;
    }
  } else if (type_gen_ch.includes('générateur à air chaud')) {
    // Change QP0 to be in decimal
    di.qp0 = di.qp0 / 100;
    qp0 = (di.qp0 * k) / 1000;

    const QP50 = (0.5 * pn * (100 - rpint)) / rpint;
    const QP100 = (pn * (100 - rpn)) / rpn;
    if (x < 0.5) QPx = 0.15 * qp0 + ((QP50 - 0.15 * qp0) * x) / 0.5;
    else QPx = 2 * QP50 - QP100 + ((QP100 - QP50) * x) / 0.5;
  } else {
    console.warn('!! type_generateur_ch n’est pas connu !!');
  }
  /* console.warn('QPx', QPx) */
  return QPx;
}

function Px(x, di, Cdimref) {
  const Px = (di.pn / 1000) * Tch_xfinal(x, Cdimref);
  return Px;
}

function Pfou(x, di, Cdimref) {
  // find coef_pond[x] in coef_pond where x is closest to x_final
  return Px(x, di, Cdimref) * coef_pond[x];
}

function Pcons(x, de, di, Cdimref) {
  const x_final = Tch_xfinal(x, Cdimref);
  return Pfou(x, di, Cdimref) * (1 + QPx(x_final, de, di) / Px(x, di, Cdimref));
}

export function calc_generateur_combustion_ch(dpe, di, de, du) {
  if (bug_for_bug_compat) {
    if (di.qp0 < 1) {
      di.qp0 *= 1000;
      console.warn(
        `Correction di.qp0 pour le générateur de chauffage ${de.description}. Passage de la valeur en W`
      );
    }
  }

  // La puissance de la veilleuse est à prendre en compte seulement si elle est présente dans l'installation
  if (!di.pveilleuse) {
    di.pveil = 0;
  }

  const Cdimref = du.cdimref || 0;
  const Cdimref_dep = du.cdimrefDep || 0;
  const Pmfou = Object.keys(coef_pond).reduce((acc, x) => acc + Pfou(x, di, Cdimref), 0);
  const Pmcons = Object.keys(coef_pond).reduce((acc, x) => acc + Pcons(x, de, di, Cdimref), 0);
  const Pmfou_dep = Object.keys(coef_pond).reduce((acc, x) => acc + Pfou(x, di, Cdimref_dep), 0);
  const Pmcons_dep = Object.keys(coef_pond).reduce(
    (acc, x) => acc + Pcons(x, de, di, Cdimref_dep),
    0
  );
  const type_energie = requestInput(de, du, 'type_energie');
  const k = K[type_energie];

  // Pveil and QP0 are in kW
  const Pveil = di.pveil / 1000;
  // rg est d'abord calculé sur PCS (puis × k pour revenir en PCI) : QP0 doit donc être exprimé
  // sur PCS, comme dans QPx() (qp0 × k). Cf. issue #205.
  const QP0 = (di.qp0 * k) / 1000;

  const rg_pcs = Pmfou / (Pmcons + 0.45 * QP0 + Pveil);
  const rg_pcs_dep = Pmfou_dep / (Pmcons_dep + 0.45 * QP0 + Pveil);

  const rg_pci = rg_pcs * k;
  const rg_pci_dep = rg_pcs_dep * k;
  di.rendement_generation = rg_pci;

  // for Ich
  di.rg = rg_pci;
  di.rg_dep = rg_pci_dep;
}
