import tvs from './tv.js';
import { mois_liste } from './utils.js';
import { calc_sse_j } from './6.2_surface_sud_equivalente.js';

export function calc_ai_j(Sh, nadeq, nrefj) {
  /**
   * L'unité retenue est le Wh conformément à la spécification, cependant
   * il est possible de rencontrer des valeurs avec une unité en kWh dans les DPE.
   */
  return ((3.18 + 0.34) * Sh + (132 / 168) * nadeq * 90) * nrefj;
}

export function calc_as_j(ssej, ej) {
  /**
   * L'unité retenue est le Wh conformément à la spécification, cependant
   * il est possible de rencontrer des valeurs avec une unité en kWh dans les DPE.
   */
  return 1000 * ssej * ej;
}

export function calc_ai(ilpa, ca, zc, Sh, nadeq) {
  const Nref19 = tvs.nref19[ilpa];
  const Nref28 = tvs.nref28;

  const ret = {
    apport_interne_ch: 0,
    /* apport_interne_ch_depensier: 0, */
    apport_interne_fr: 0
    /* apport_interne_fr_depensier: 0 */
  };
  for (const mois of mois_liste) {
    const nref19 = Nref19[ca][mois][zc];
    const nref28 = Nref28[ca][mois][zc];
    ret.apport_interne_ch += calc_ai_j(Sh, nadeq, nref19);
    /* ret.apport_interne_ch_depensier += calc_ai_j(Sh, nadeq, nref21) */
    ret.apport_interne_fr += calc_ai_j(Sh, nadeq, nref28);
    /* ret.apport_interne_fr_depensier += calc_ai_j(Sh, nadeq, nref26) */
  }
  return ret;
}

export function calc_as(ilpa, ca, zc, bv, ets) {
  const e = tvs.e[ilpa];
  const e_fr_28 = tvs.e_fr_28;

  const ret = {
    apport_solaire_ch: 0,
    apport_solaire_fr: 0
    /* apport_solaire_fr_depensier: 0 */
  };
  for (const mois of mois_liste) {
    const ssej = calc_sse_j(bv, ets, ca, zc, mois);
    const ej = e[ca][mois][zc];
    const ej_fr_28 = e_fr_28[ca][mois][zc];

    ret.apport_solaire_ch += calc_as_j(ssej, ej);
    ret.apport_solaire_fr += calc_as_j(ssej, ej_fr_28);
    /* ret.apport_solaire_fr_depensier += calc_as_j(ssej, ej_fr_26) */
  }
  return ret;
}
