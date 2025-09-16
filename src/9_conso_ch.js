import { mois_liste, requestInputID } from './utils.js';
import { rendement_emission } from './9_emetteur_ch.js';
import { calc_intermittence } from './8_intermittence.js';
import tvs from './tv.js';
import enums from './enums.js';

function coef_ch(Fch) {
  return {
    'installation de chauffage simple': {
      0: 1,
      1: 1
    },
    'installation de chauffage avec chauffage solaire': {
      0: 1 - Fch
    },
    'installation de chauffage avec insert ou poêle bois en appoint': {
      0: 0.75,
      1: 0.25
    },
    // todo: 2 sdb
    'installation de chauffage par insert, poêle bois (ou biomasse) avec un chauffage électrique dans la salle de bain':
      {
        0: 0.9,
        1: 0.1
      },
    'installation de chauffage avec en appoint un insert ou poêle bois et un chauffage électrique dans la salle de bain (différent du chauffage principal)':
      {
        0: 0.75 * 0.9,
        1: 0.25 * 0.9,
        2: 0.1
      },
    'installation de chauffage avec une chaudière ou une pac en relève d’une chaudière bois': {
      0: 0.75,
      1: 0.25
    },
    'installation de chauffage avec chauffage solaire et insert ou poêle bois en appoint': {
      0: 0.75 * (1 - Fch),
      1: 0.25 * (1 - Fch)
    },
    'installation de chauffage avec chaudière en relève de pac': {
      0: 0.8,
      1: 0.2
    },
    'installation de chauffage avec chaudière en relève de pac avec insert ou poêle bois en appoint':
      {
        0: 0.8 * 0.75,
        1: 0.2 * 0.75,
        2: 0.25
      },
    'installation de chauffage collectif avec base + appoint': {
      0: 0.75 * (1 - Fch),
      1: 0.25 * (1 - Fch)
    },
    'convecteurs bi-jonction': {
      0: 0.6,
      1: 0.4
    }
  };
}

export function conso_ch(
  di,
  de,
  du,
  _pos,
  cfg_ch,
  em_list,
  GV,
  Sh,
  hsp,
  bch,
  bch_dep,
  tbase,
  ilpa,
  ca_id,
  zc_id,
  besoin_ch_mois,
  s_chauffee_inst,
  gen_ch_list
) {
  const gen_lge_id = requestInputID(de, du, 'lien_generateur_emetteur');
  const coef = coef_ch(de.fch || 0.5)[cfg_ch][_pos] || 1;

  let conso_ch = 0;
  let conso_ch_dep;

  let em_filt;

  if (em_list.length === 1) {
    em_filt = em_list;
  } else {
    em_filt = em_list.filter(
      (em) => em.donnee_entree.enum_lien_generateur_emetteur_id === gen_lge_id
    );
  }

  switch (cfg_ch) {
    case 'installation de chauffage collectif avec base + appoint': {
      calc_ch_base_appoint(
        di,
        de,
        bch,
        besoin_ch_mois,
        zc_id,
        ca_id,
        em_list,
        gen_ch_list,
        _pos,
        GV,
        Sh,
        hsp,
        s_chauffee_inst,
        ilpa,
        tbase
      );
      break;
    }
    default: {
      const hasMultipleEmetteur = em_filt.length > 1;

      const emetteur_eq = em_filt.reduce((acc, em) => {
        const int = calc_intermittence(GV, Sh, hsp, em.donnee_intermediaire.i0);
        const r_em = rendement_emission(em);

        /**
         * 9.1.3 Installation avec plusieurs émissions pour un même générateur
         * La part de la consommation traitée par chaque émetteur est proratisé par le ratio des surfaces habitables.
         * @type {number|number}
         */
        const ratio_s = hasMultipleEmetteur
          ? em.donnee_entree.surface_chauffee / de.surface_chauffee
          : 1;

        const Ich = 1 / r_em;
        return acc + ratio_s * int * Ich;
      }, 0);

      const Ich = emetteur_eq / di.rg;
      const Ich_dep = emetteur_eq / di.rg_dep;
      conso_ch = coef * Ich * bch;
      conso_ch_dep = coef * Ich_dep * bch_dep;

      di.conso_ch = conso_ch;
      di.conso_ch_depensier = conso_ch_dep;
      break;
    }
  }
}

/**
 * 9.8 Installation de chauffage collectif avec base + appoint
 */
function calc_ch_base_appoint(
  di,
  de,
  bch,
  besoin_ch_mois,
  zc_id,
  ca_id,
  em_list,
  gen_ch_list,
  _pos,
  GV,
  Sh,
  hsp,
  s_chauffee_inst,
  ilpa,
  tbase
) {
  if (bch > 0) {
    let bch_base = 0;

    const zc = enums.zone_climatique[zc_id];
    const ca = enums.classe_altitude[ca_id];

    const emBase = em_list[0];
    const genBase = gen_ch_list[0];
    const emAppoint = em_list[1];
    const genAppoint = gen_ch_list[1];
    const em = _pos === 0 ? emBase : emAppoint;
    const gen = _pos === 0 ? genBase : genAppoint;
    const isAppoint = _pos !== 0;
    const Int = calc_intermittence(GV, Sh, hsp, em.donnee_intermediaire.i0);
    const Rend = rendement_emission(em);
    const Ich = 1 / (gen.donnee_intermediaire.rendement_generation || 1);

    const rd = emBase.donnee_intermediaire.rendement_distribution;
    const rr = emBase.donnee_intermediaire.rendement_regulation;
    const re = emBase.donnee_intermediaire.rendement_emission;

    const pn = genBase.donnee_intermediaire.pn;
    const pe = pn > 0 ? (pn / 1000) * rd * rr * re : 0;

    const dh14 = tvs.dh14;
    const text = tvs.text;
    const nrefs = tvs.nref19;
    const idx_ilpa = ilpa ? 1 : 0;

    const dh14Saison = mois_liste.reduce((acc, mois) => acc + dh14[idx_ilpa][ca][mois][zc], 0);
    const rdim = de.rdim || 1;
    const ratio_s = (s_chauffee_inst * rdim) / Sh;
    const bch1 = (bch * ratio_s) / rdim;
    const t = 14 - (pe * dh14Saison) / bch1;

    di.conso_ch = 0;
    for (const mois of mois_liste) {
      let bch_base_j = 0;

      if (pe > 0) {
        // Nombre d’heures de chauffage sur le mois j
        const nrefj = nrefs[idx_ilpa][ca][mois][zc];
        // Température extérieure moyenne dans la zone climatique sur le mois j (°C)
        const textj = text[idx_ilpa][ca][mois][zc];
        // Degrés heures de base 14 pour le mois j (°Ch)
        const dh14j = dh14[idx_ilpa][ca][mois][zc];

        const xj = 0.5 * ((t - tbase) / (textj - tbase));

        // Degré heure base T sur le mois j
        let dhtj =
          nrefj *
          (textj - tbase) *
          Math.pow(xj, 5) *
          (14 - 28 * xj + 20 * Math.pow(xj, 2) - 5 * Math.pow(xj, 3));
        if (dhtj < 0) {
          dhtj = 0;
        }

        let ratioDh = dh14j > 0 ? 1 - dhtj / dh14j : 0;
        if (ratioDh <= 0) {
          bch_base_j = 0;
        } else {
          bch_base_j = besoin_ch_mois[mois] * ratioDh;
        }
      } else {
        bch_base_j = besoin_ch_mois[mois] * 0.5;
      }
      bch_base += bch_base_j;
    }
    if (!isAppoint) {
      const ratio_s_em = em.donnee_entree.surface_chauffee / de.surface_chauffee;
      di.conso_ch = (ratio_s_em * (bch_base / 1000) * Ich * Int) / Rend;
    } else {
      const ratio_s_em =
        em.donnee_entree.surface_chauffee / emAppoint.donnee_entree.surface_chauffee;
      di.conso_ch = (ratio_s_em * (bch - bch_base / 1000) * Int * Ich) / Rend;
    }

    di.conso_ch = Math.max(di.conso_ch, 0);
  }
}
