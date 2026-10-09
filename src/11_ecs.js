import enums from './enums.js';
import calc_gen_ecs from './14_generateur_ecs.js';
import { tv, requestInput, mois_liste, Njj } from './utils.js';

function tv_rendement_distribution_ecs(di, de, du, pvc) {
  let matcher = {};

  if (de.tv_rendement_distribution_ecs_id) {
    matcher['tv_rendement_distribution_ecs_id'] = de.tv_rendement_distribution_ecs_id;
  } else {
    const type_installation = enums.type_installation[de.enum_type_installation_id];

    let configuration_logement;
    if (type_installation.includes('individuelle')) {
      if (pvc === 1) {
        // Motif ancré « ^…+…$ » : compatible avec les deux matchers de tv().
        // - tvMatchLegacy échappe le « + » d'un motif ancré avant le .match() regex ;
        // - tvMatchOptimized retire les ancres puis compare la chaîne littérale.
        // L'ancien « [+] » (échappement regex) ne matchait jamais en version optimisée (#206).
        configuration_logement = '^production volume habitable + pièces alimentées contiguës$';
      } else configuration_logement = 'production hors volume habitable';
    } else if (type_installation.includes('collective')) {
      let type_reseau_collectif;
      if (type_installation.includes('multi-bâtiment')) {
        configuration_logement = 'majorité des logements avec pièces alimentées non contiguës';
      } else {
        configuration_logement = 'majorité des logements avec pièces alimentées contiguës';
      }
      const isole = requestInput(de, du, 'reseau_distribution_isole', 'bool');
      if (isole === 0) {
        type_reseau_collectif = 'Réseau collectif non isolé';
      } else {
        const type_bouclage = requestInput(de, du, 'bouclage_reseau_ecs');
        if (type_bouclage === "réseau d'ecs bouclé") {
          type_reseau_collectif = 'Réseau collectif isolé bouclé';
        } else {
          configuration_logement = null;
          type_reseau_collectif =
            'Réseau collectif isolé avec traçage ou Réseau collectif isolé sans traçage ni bouclage';
        }
      }
      matcher.type_reseau_collectif = type_reseau_collectif;
    }
    if (configuration_logement) matcher.configuration_logement = configuration_logement;
  }

  const row = tv('rendement_distribution_ecs', matcher);
  if (row) {
    di.rendement_distribution = Number(row.rd);
    de.tv_rendement_distribution_ecs_id = Number(row.tv_rendement_distribution_ecs_id);
  } else {
    console.error('!! pas de valeur forfaitaire trouvée pour rd !!');
  }
}

/**
 * Calcul de la consommation des auxiliaires de distribution ECS - CAS IMMEUBLE
 * Calcul installation par installation pour les réseaux collectifs bouclés ou avec traçage.
 *
 * @param {object} de - donnee_entree de l'installation ECS
 * @param {number} surfaceImmeuble - surface habitable totale de l'immeuble (m²)
 * @param {object} becsParMois - besoin ECS mensuel de l'immeuble {Janvier: X, Février: X, ...} [kWh]
 * @returns {number} conso_auxiliaire_distribution_ecs_installation [Wh]
 */
function calc_auxiliaire_distribution_ecs_immeuble(de, surfaceImmeuble, becsParMois) {
  const type_installation = enums.type_installation[de.enum_type_installation_id];

  // Seulement pour les installations collectives
  if (!type_installation || !type_installation.includes('collective')) {
    return 0;
  }

  const enum_bouclage_id = String(de.enum_bouclage_reseau_ecs_id);
  const surface_installation = de.surface_habitable || 0;
  const surface_immeuble_total = surfaceImmeuble || 1;
  const ratio_surface = surface_installation / surface_immeuble_total;

  // CAS 1 : réseau non bouclé → 0
  if (enum_bouclage_id === '1') {
    return 0;
  }

  // CAS 3 : traçage → 0.14 × BECS_annuel × ratio_surface [Wh]
  if (enum_bouclage_id === '3') {
    const becs_annuel_kwh = Object.values(becsParMois).reduce((acc, v) => acc + v, 0);
    // becs_annuel est en kWh → × 1000 pour obtenir des Wh
    return 0.14 * becs_annuel_kwh * 1000 * ratio_surface;
  }

  // CAS 2 : réseau bouclé → calcul complet 9 étapes [Wh]
  if (enum_bouclage_id === '2') {
    const Sh_inst = surface_installation;
    const Niv_inst = Number(de.nombre_niveau_installation_ecs) || 1;

    // Étape 3 : Calcul de Lb pour l'installation i
    // Lb = 1.2 × (1.1 × Sh_inst/nombre_niveaux + 4 × nombre_niveaux)
    const Lb = 1.2 * (1.1 * (Sh_inst / Niv_inst) + 4 * Niv_inst);

    // Étape 4 : DeltaPb = 0.2 × Lb + 10
    const DeltaPb = 0.2 * Lb + 10;

    let Qcirc_annuel = 0;

    for (const mois of mois_liste) {
      const Njj_mois = Njj[mois];
      const becs_immeuble_j_kwh = becsParMois[mois] || 0;

      // Étape 1 : Qdwj_i [kWh]
      const Qdwj_i = 0.24 * becs_immeuble_j_kwh * ratio_surface;

      // Étape 2 : qdwj_i [m³/h]
      // Note: la spec officielle utilise Qdwj en Wh et divise par 1000 ensuite.
      // Le moteur fournit becs en kWh, donc Qdwj est en kWh → on ne divise pas par 1000.
      const qdwj_i = Qdwj_i / (5.815 * 5 * Njj_mois);

      // Étape 5 : Phyd,j [W]
      // Phyd,j = DeltaPb [kPa] × 1000 × qdwj_i [m³/h] / 3600
      const Phyd_j = (DeltaPb * 1000 * qdwj_i) / 3600;

      // Étape 6 : Effcirb,j (rendement pompe)
      const Effcirb_j = Phyd_j > 0 ? 0.035 * Math.pow(Phyd_j, 0.45) : 0;

      // Étape 7 : Pcirb,j [W] = max(Phyd,j / Effcirb,j, 20)
      const Pcirb_j = Effcirb_j > 0 ? Math.max(Phyd_j / Effcirb_j, 20) : 20;

      // Étape 8 : Qcirb,j [Wh]
      const Qcirb_j = (5 * Pcirb_j + 19 * 20) * Njj_mois;

      Qcirc_annuel += Qcirb_j;
    }

    // Étape 9 : conso annuelle en Wh
    return Qcirc_annuel;
  }

  return 0;
}

/** Écart relatif toléré entre la somme des surfaces ECS exportées et SH. */
const TOLERANCE_SURFACE_ECS = 0.05;

/**
 * Ratio de besoin ECS d'une installation individuelle d'un immeuble (par unité dimensionnée).
 *
 * Tribu (Moteur_DPE.dll, Calcul_batiment.Calcul_Cecs) : Ratio = Sh_ecs × Rdim / SH puis
 * Becs = Becs_immeuble × Ratio / Rdim, la consommation étant remultipliée par rdim à l'agrégation
 * (conso.js, cle_repartition_ecs). Les logiciels n'exportent pas tous Sh_ecs de la même façon :
 * - surface d'un logement (Σ Sh × rdim ≈ SH) → ratio = Sh / SH ;
 * - surface totale desservie par l'installation (Σ Sh ≈ SH) → ratio = Sh / SH / rdim.
 * La convention est détectée sur l'ensemble des installations ECS du DPE. Repli sur
 * 1 / nombre d'appartements si la surface est absente, si aucune des deux sommes ne retrouve SH
 * (à TOLERANCE_SURFACE_ECS près) ou si le ratio est ≥ 1.
 * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - §11.4
 */
export function ratio_besoin_ecs_individuel(dpe, de, surfaceImmeuble, nombreAppartements) {
  const sh = Number(de.surface_habitable);
  const SH = Number(surfaceImmeuble);
  if (!(sh > 0 && SH > 0)) return 1 / nombreAppartements;

  const installations = dpe?.logement?.installation_ecs_collection?.installation_ecs || [
    { donnee_entree: de }
  ];
  const des = installations.map((inst) => inst.donnee_entree);
  const sommeSh = des.reduce((acc, d) => acc + (Number(d.surface_habitable) || 0), 0);
  const sommeShRdim = des.reduce(
    (acc, d) => acc + (Number(d.surface_habitable) || 0) * (Number(d.rdim) || 1),
    0
  );
  const ecartParLogement = Math.abs(sommeShRdim - SH);
  const ecartParInstallation = Math.abs(sommeSh - SH);
  const surfaceParLogement = ecartParLogement < ecartParInstallation;

  // Surfaces exportées incohérentes avec SH (installations partielles, surface moyenne…) : repli
  if (Math.min(ecartParLogement, ecartParInstallation) > TOLERANCE_SURFACE_ECS * SH) {
    return 1 / nombreAppartements;
  }

  const ratio = surfaceParLogement ? sh / SH : sh / SH / (Number(de.rdim) || 1);
  return ratio < 1 ? ratio : 1 / nombreAppartements;
}

export default function calc_ecs(
  dpe,
  ecs,
  becs,
  becs_dep,
  GV,
  ca_id,
  zc_id,
  th,
  virtualisationECS,
  surfaceImmeuble,
  nombreAppartements,
  isImmeubleSystemEcsIndividuels,
  becsParMois,
  isImmeubleMultiEcs = false
) {
  const de = ecs.donnee_entree;
  const di = {};
  const du = {};

  // La conso de chaque générateur ECS doit être ramenée au prorata de la surface du logement
  di.ratio_besoin_ecs = 1;
  if (isImmeubleMultiEcs) {
    /**
     * Immeuble avec plusieurs installations ECS (collectives ou mixtes) : ratio de besoin =
     * surface habitable desservie par l'installation / surface habitable de l'immeuble,
     * sans normalisation ni plafonnement. Le besoin est exprimé par unité dimensionnée (/ rdim),
     * la consommation étant remultipliée par rdim lors de l'agrégation (conso.js, cle_repartition_ecs).
     * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - §11.4
     * @see Moteur_DPE.dll Calcul_batiment.Calcul_Cecs() et Calcul_Cecs_installation_2()
     */
    di.ratio_besoin_ecs =
      Number(de.surface_habitable) / Number(surfaceImmeuble) / (Number(de.rdim) || 1);
  } else if (virtualisationECS) {
    di.ratio_besoin_ecs = de.cle_repartition_ecs || 1;
  } else if (isImmeubleSystemEcsIndividuels) {
    if (nombreAppartements) {
      di.ratio_besoin_ecs = ratio_besoin_ecs_individuel(
        dpe,
        de,
        surfaceImmeuble,
        nombreAppartements
      );
    } else {
      di.ratio_besoin_ecs =
        ((de.surface_habitable / (surfaceImmeuble || 1)) * (de.rdim || 1)) /
        (de.nombre_logement * nombreAppartements);
    }
  } else if (de.rdim) {
    di.ratio_besoin_ecs = 1 / de.rdim || 1;
  }

  di.besoin_ecs = becs * di.ratio_besoin_ecs;
  di.besoin_ecs_depensier = becs_dep * di.ratio_besoin_ecs;

  const pvc = ecs.generateur_ecs_collection.generateur_ecs[0].donnee_entree.position_volume_chauffe;
  tv_rendement_distribution_ecs(di, de, du, pvc);

  const gen_ecs_list = ecs.generateur_ecs_collection.generateur_ecs;
  gen_ecs_list.forEach((gen_ecs) => calc_gen_ecs(dpe, gen_ecs, di, de, GV, ca_id, zc_id, th));

  di.conso_ecs = gen_ecs_list.reduce(
    (acc, gen_ecs) => acc + gen_ecs.donnee_intermediaire.conso_ecs,
    0
  );
  di.conso_ecs_depensier = gen_ecs_list.reduce(
    (acc, gen_ecs) => acc + gen_ecs.donnee_intermediaire.conso_ecs_depensier,
    0
  );

  // Calcul de la consommation des auxiliaires de distribution ECS pour l'immeuble
  // Résultat en Wh, converti en kWh pour cohérence avec le reste du moteur
  if (th === 'immeuble' && becsParMois && Object.keys(becsParMois).length > 0) {
    const conso_aux_wh = calc_auxiliaire_distribution_ecs_immeuble(
      de,
      surfaceImmeuble,
      becsParMois
    );
    di.conso_auxiliaire_distribution_ecs = conso_aux_wh / 1000;
  } else {
    di.conso_auxiliaire_distribution_ecs = 0;
  }

  ecs.donnee_intermediaire = di;
  ecs.donnee_utilisateur = du;
}
