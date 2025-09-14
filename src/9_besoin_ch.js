import enums from './enums.js';
import tvs from './tv.js';
import { calc_Qdw_j } from './14_generateur_ecs.js';
import { calc_besoin_ecs_j } from './11_besoin_ecs.js';
import { calc_Qrec_gen_j } from './9_generateur_ch.js';
import { calc_ai_j, calc_as_j } from './6.1_apport_gratuit.js';
import { calc_sse_j } from './6.2_surface_sud_equivalente.js';
import { mois_liste } from './utils.js';

export default function calc_besoin_ch(
  ilpa,
  ca_id,
  zc_id,
  inertie_id,
  Sh,
  GV,
  nadeq,
  instal_ecs,
  instal_ch,
  bv,
  ets
) {
  const ca = enums.classe_altitude[ca_id];
  const zc = enums.zone_climatique[zc_id];
  const inertie = enums.classe_inertie[inertie_id];

  let besoin_ch = 0;
  let besoin_ch_depensier = 0;

  const dh21 = tvs.dh21[ilpa];
  const dh19 = tvs.dh19[ilpa];
  const Nref21 = tvs.nref21[ilpa];
  const Nref19 = tvs.nref19[ilpa];

  let sumDh19 = 0;
  let sumDh21 = 0;
  const e = tvs.e[ilpa];

  let pertes_distribution_ecs_recup = 0;
  let pertes_distribution_ecs_recup_depensier = 0;
  let pertes_stockage_ecs_recup = 0;
  let pertes_generateur_ch_recup = 0;
  let pertes_generateur_ch_recup_depensier = 0;
  let fraction_apport_gratuit_ch = 0;
  let fraction_apport_gratuit_depensier_ch = 0;

  // Ensure instal_ecs is always an array
  instal_ecs = Array.isArray(instal_ecs) ? instal_ecs : [];
  // Ensure instal_ch is always an array
  instal_ch = Array.isArray(instal_ch) ? instal_ch : [];

  /**
   * 11.4 Plusieurs systèmes d’ECS (limité à 2 systèmes différents par logement)
   * Les besoins en ECS pour chaque générateur sont / 2
   */
  const prorataEcs = instal_ecs.length > 1 ? 0.5 : 1;

  let Qdw_total_ecs = 0;
  let Qdw_total_ecs_dep = 0;
  let Qgw_total_ecs = 0;
  instal_ecs.forEach((instal_ecs) => {
    let Qgw;
    const gen_ecs = instal_ecs.generateur_ecs_collection.generateur_ecs;

    // 17.2.1.1 Calcul des consommations de chauffage, de refroidissement, d’ECS et d’auxiliaires
    // Pour les installations ECS collectives, pas de récupération de stockage d'ECS
    if (Number.parseInt(instal_ecs.donnee_entree.enum_type_installation_id) !== 1) {
      Qgw = 0;
    } else {
      Qgw = gen_ecs.reduce((acc, gen_ecs) => {
        // Pas de récupération de stockage si le ballon est hors volume chauffé
        if (
          gen_ecs.donnee_entree.position_volume_chauffe_stockage === 0 ||
          gen_ecs.donnee_entree.position_volume_chauffe === 0
        ) {
          return acc;
        }

        return acc + (gen_ecs.donnee_intermediaire.Qgw || 0);
      }, 0);
    }

    Qgw_total_ecs += (0.48 * Qgw * (instal_ecs.donnee_entree.rdim || 1)) / 8760;
  });

  for (const mois of mois_liste) {
    // en kw/h
    const becsj = calc_besoin_ecs_j(ca, mois, zc, nadeq, false) * prorataEcs;
    // en kw/h
    const becs_j_dep = calc_besoin_ecs_j(ca, mois, zc, nadeq, true) * prorataEcs;

    Qdw_total_ecs += instal_ecs.reduce((acc, ecs) => acc + calc_Qdw_j(ecs, becsj), 0);
    Qdw_total_ecs_dep += instal_ecs.reduce((acc, ecs) => acc + calc_Qdw_j(ecs, becs_j_dep), 0);
  }

  /**
   * Création de la liste des générateurs de chauffage pour lesquels il y a une récupération d'énergie
   *
   * 9.1.1 - Pertes récupérées de génération pour le chauffage sur le mois j (Wh)
   * Ce calcul ne s’applique qu’au générateur pour lesquels des pertes à l’arrêt Qp0 sont prises en compte.
   * Seules les pertes des générateurs et des ballons de stockage en volume chauffé sont récupérables. Les pertes
   * récupérées des générateurs d’air chaud sont nulles.
   *
   * @type {GenerateurChauffageItem[]}
   */
  const gen_ch_recup = instal_ch.flatMap((inst_ch) =>
    inst_ch.generateur_chauffage_collection.generateur_chauffage.filter(
      (gen_ch) =>
        gen_ch.donnee_intermediaire.qp0 && (gen_ch.donnee_entree.position_volume_chauffe ?? 0)
    )
  );

  const besoin_ch_mois = {};
  const besoin_ch_mois_dep = {};
  for (const mois of mois_liste) {
    const nref19 = Nref19[ca][mois][zc];
    const nref21 = Nref21[ca][mois][zc];

    // bvj
    const dh19j = dh19[ca][mois][zc];
    sumDh19 += dh19j * GV;
    const dh21j = dh21[ca][mois][zc];
    sumDh21 += dh21j * GV;
    const aij = calc_ai_j(Sh, nadeq, nref19);
    const aij_dep = calc_ai_j(Sh, nadeq, nref21);
    const ssej = calc_sse_j(bv, ets, ca, zc, mois);
    const ej = e[ca][mois][zc];
    const asj = calc_as_j(ssej, ej);
    const Fj = calc_Fj(GV, asj, aij, dh19j, inertie);
    const Fj_dep = calc_Fj(GV, asj, aij_dep, dh21j, inertie);

    fraction_apport_gratuit_ch += Fj * GV * dh19j;
    fraction_apport_gratuit_depensier_ch += Fj_dep * GV * dh21j;

    const bvj = dh19j === 0 ? 0 : calc_bvj(GV, Fj);
    const bvj_dep = dh21j === 0 ? 0 : calc_bvj(GV, Fj_dep);

    const Bch_hp_j = bvj * dh19j;
    const Bch_hp_j_dep = bvj_dep * dh21j;

    let gen_recup = 0;
    let gen_recup_dep = 0;

    gen_ch_recup.forEach((gen_ch) => {
      gen_recup += calc_Qrec_gen_j(gen_ch, nref19, Bch_hp_j);
      gen_recup_dep += calc_Qrec_gen_j(gen_ch, nref21, Bch_hp_j_dep);
    });

    pertes_generateur_ch_recup += gen_recup;
    pertes_generateur_ch_recup_depensier += gen_recup_dep;

    const pertes_distribution_ecs_recup_j = nref19 * Qdw_total_ecs * 1000;
    const pertes_distribution_ecs_recup_j_dep = nref21 * Qdw_total_ecs_dep * 1000;
    pertes_distribution_ecs_recup += pertes_distribution_ecs_recup_j;
    pertes_distribution_ecs_recup_depensier += pertes_distribution_ecs_recup_j_dep;

    const pertes_stockage_ecs_recup_j = nref19 * Qgw_total_ecs;
    pertes_stockage_ecs_recup += pertes_stockage_ecs_recup_j;
    const pertes_stockage_ecs_recup_j_dep = nref21 * Qgw_total_ecs;

    besoin_ch_mois[mois] = bvj * dh19j;
    besoin_ch_mois_dep[mois] = bvj_dep * dh21j;
    besoin_ch_mois[mois] -=
      pertes_distribution_ecs_recup_j + pertes_stockage_ecs_recup_j + gen_recup;
    besoin_ch_mois_dep[mois] -=
      pertes_distribution_ecs_recup_j_dep + pertes_stockage_ecs_recup_j_dep + gen_recup_dep;
    besoin_ch_mois[mois] = Math.max(besoin_ch_mois[mois], 0);
    besoin_ch += besoin_ch_mois[mois] / 1000;

    besoin_ch_depensier += besoin_ch_mois_dep[mois] / 1000;
  }

  fraction_apport_gratuit_ch /= sumDh19;
  fraction_apport_gratuit_depensier_ch /= sumDh21;

  return {
    besoin_ch,
    besoin_ch_depensier,
    besoin_ch_mois,
    pertes_distribution_ecs_recup,
    pertes_distribution_ecs_recup_depensier,
    pertes_stockage_ecs_recup,
    pertes_generateur_ch_recup,
    pertes_generateur_ch_recup_depensier,
    fraction_apport_gratuit_ch,
    fraction_apport_gratuit_depensier_ch
  };
}

function calc_Fj(GV, asj, aij, dhj, inertie) {
  if (dhj === 0) return 0;

  let alpha;
  if (inertie === 'très lourde' || inertie === 'lourde') alpha = 3.6;
  else if (inertie === 'moyenne') alpha = 2.9;
  else if (inertie === 'légère') alpha = 2.5;

  const Xj = (asj + aij) / (GV * dhj);
  return (Xj - Xj ** alpha) / (1 - Xj ** alpha);
}

function calc_bvj(GV, Fj) {
  return GV * (1 - Fj);
}
