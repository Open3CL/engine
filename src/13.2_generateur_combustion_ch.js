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

export function tv_temp_fonc_30_100(di, de, du, em_ch, ac) {
  for (const em of em_ch) {
    const em_ch_de = em.donnee_entree;
    const em_ch_du = em.donnee_utilisateur;
    const matcher = {
      enum_type_generateur_ch_id: de.enum_type_generateur_ch_id,
      enum_temp_distribution_ch_id: requestInputID(em_ch_de, em_ch_du, 'temp_distribution_ch'),
      periode_emetteurs: requestInput(em_ch_de, em_ch_du, 'periode_installation_emetteur')
    };

    if (!matcher.periode_emetteurs) {
      if (ac < 1981) matcher.periode_emetteurs = 'avant 1981';
      else if (ac < 2000) matcher.periode_emetteurs = 'entre 1981 et 2000';
      else matcher.periode_emetteurs = 'après 2000';
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
  const QP0 = di.qp0 / 1000;

  const rg_pcs = Pmfou / (Pmcons + 0.45 * QP0 + Pveil);
  const rg_pcs_dep = Pmfou_dep / (Pmcons_dep + 0.45 * QP0 + Pveil);

  const rg_pci = rg_pcs * k;
  const rg_pci_dep = rg_pcs_dep * k;
  di.rendement_generation = rg_pci;

  // for Ich
  di.rg = rg_pci;
  di.rg_dep = rg_pci_dep;
}
