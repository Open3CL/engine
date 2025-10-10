import enums from './enums.js';
import calc_deperdition from './3_deperdition.js';
import calc_apport_et_besoin from './apport_et_besoin.js';
import calc_clim from './10_clim.js';
import calc_ecs from './11_ecs.js';
import calc_besoin_ch from './9_besoin_ch.js';
import calc_chauffage, { tauxChargeForGenerator } from './9_chauffage.js';
import calc_confort_ete from './2021_04_13_confort_ete.js';
import calc_qualite_isolation from './2021_04_13_qualite_isolation.js';
import calc_conso, { classe_bilan_dpe, classe_emission_ges } from './conso.js';
import {
  add_references,
  bug_for_bug_compat,
  collectionCanBeEmpty,
  containsAnySubstring,
  isEffetJoule,
  sanitize_dpe
} from './utils.js';
import { Inertie } from './7_inertie.js';
import getFicheTechnique from './ficheTechnique.js';
import { ProductionENR } from './16.2_production_enr.js';

function calc_th(map_id) {
  const map = enums.methode_application_dpe_log[map_id];
  if (map.includes('maison')) return 'maison';
  else if (map.includes('appartement')) return 'appartement';
  else if (map.includes('immeuble')) return 'immeuble';
  console.error(`Methode application DPE inconnue ${map_id} ${map}`);
  return null;
}

const inertie = new Inertie();
const productionENR = new ProductionENR();

export function calcul_3cl(dpe) {
  sanitize_dpe(dpe);
  const modele = enums.modele_dpe[dpe.administratif.enum_modele_dpe_id];
  if (modele !== 'dpe 3cl 2021 méthode logement') {
    console.error('Moteur dpe non implémenté pour le modèle: ' + modele);
    return null;
  }
  const logement = dpe.logement;

  const cg = logement.caracteristique_generale;
  const map_id = cg.enum_methode_application_dpe_log_id;
  const th = calc_th(map_id);

  if (logement.enveloppe === undefined) {
    console.warn('vide: logement.enveloppe');
    return null;
  } else if (!logement.enveloppe.mur_collection) {
    console.warn('vide: logement.enveloppe.mur_collection');
    return null;
  } else if (
    !logement.enveloppe.plancher_haut_collection ||
    !logement.enveloppe.plancher_haut_collection.plancher_haut.length
  ) {
    /**
     * Vérification si le plancher haut est considéré comme non déperditif et peut donc être vide
     * - Pas de pont thermique ou pas de pont thermique de type murs / plancher haut
     * (enum_type_liaison_id === 1 : liaison 'plancher haut / mur').
     * - Déperdition plancher_haut === 0 (donne probablement sur un autre local chauffé)
     */
    if (collectionCanBeEmpty(logement, 'plancher_haut', 3)) {
      logement.enveloppe.plancher_haut_collection = {
        plancher_haut: []
      };
    } else {
      console.error('plancher_bas_collection should not be empty');
      return null;
    }
  } else if (
    !logement.enveloppe.plancher_bas_collection ||
    !logement.enveloppe.plancher_bas_collection.plancher_bas.length
  ) {
    /**
     * Vérification si le plancher bas est considéré comme non déperditif et peut donc être vide
     * - Pas de pont thermique ou pas de pont thermique de type murs / plancher bas
     * (enum_type_liaison_id === 1 : liaison 'plancher bas / mur').
     * - Déperdition plancher_bas === 0 (donne probablement sur un autre local chauffé)
     */
    if (collectionCanBeEmpty(logement, 'plancher_bas', 1)) {
      logement.enveloppe.plancher_bas_collection = {
        plancher_bas: []
      };
    } else {
      console.error('plancher_bas_collection should not be empty');
      return null;
    }
  }

  add_references(logement.enveloppe);

  // TODO commit version to package.json during release process
  /* const package_version = require('../package.json').version; */
  const package_version = 'alpha';
  dpe.administratif.diagnostiqueur = { version_moteur_calcul: `Open3CL ${package_version}` };
  const env = logement.enveloppe;
  let Sh;
  let ShChauffageAndEcs;
  // TODO requestInput Sh
  if (th === 'maison' || th === 'appartement') Sh = cg.surface_habitable_logement;
  else if (th === 'immeuble') Sh = cg.surface_habitable_immeuble;

  /**
   * Certains DPE appartement sont générés à partir des données du DPE immeuble, la surface à prendre en compte est
   * celle de l'immeuble pour les besoins ECS
   * 10 - dpe appartement généré à partir des données DPE immeuble chauffage individuel ecs individuel
   * 11 - dpe appartement généré à partir des données DPE immeuble chauffage collectif ecs individuel
   * 12 - dpe appartement généré à partir des données DPE immeuble chauffage individuel ecs collectif
   * 13 - dpe appartement généré à partir des données DPE immeuble chauffage collectif ecs collectif
   * 15 - dpe issu d'une étude thermique réglementaire RT2012 bâtiment : appartement chauffage collectif ecs collectif
   * 16 - dpe issu d'une étude thermique réglementaire RT2012 bâtiment : appartement chauffage individuel ecs collectif
   * 19 - dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : appartement chauffage collectif ecs collectif
   * 20 - dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : appartement chauffage individuel ecs collectif
   * 22 - dpe issu d'une étude thermique réglementaire RT2012 bâtiment : appartement chauffage individuel ecs individuel
   * 23 - dpe issu d'une étude thermique réglementaire RT2012 bâtiment : appartement chauffage collectif ecs individuel
   * 24 - dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : appartement chauffage collectif ecs individuel
   * 25 - dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : appartement chauffage individuel ecs individuel
   * 33 - dpe appartement généré à partir des données DPE immeuble chauffage mixte (collectif-individuel) ecs individuel
   * 34 - dpe appartement généré à partir des données DPE immeuble chauffage mixte (collectif-individuel) ecs collectif
   * 38 - dpe appartement généré à partir des données DPE immeuble chauffage mixte (collectif-individuel) ecs mixte (collectif-individuel)
   * 39 - dpe appartement généré à partir des données DPE immeuble chauffage individuel ecs mixte (collectif-individuel)
   * 40 - dpe appartement généré à partir des données DPE immeuble chauffage collectif ecs mixte (collectif-individuel)
   */
  if (
    [
      '10',
      '11',
      '12',
      '13',
      '15',
      '16',
      '19',
      '20',
      '22',
      '23',
      '24',
      '25',
      '33',
      '34',
      '38',
      '39',
      '40'
    ].includes(map_id)
  ) {
    ShChauffageAndEcs = cg.surface_habitable_immeuble;
  } else {
    ShChauffageAndEcs = Sh;
  }

  const zc_id = logement.meteo.enum_zone_climatique_id;
  const ca_id = logement.meteo.enum_classe_altitude_id;

  const instal_ch = logement.installation_chauffage_collection.installation_chauffage;
  const bv_list = env.baie_vitree_collection.baie_vitree;

  bv_list.forEach((baieVitree) => {
    const donneeEntree = baieVitree.donnee_entree;

    // Si pas d'information sur la présence de joint => vérification dans les fiches techniques
    if (donneeEntree.presence_joint === undefined) {
      const orientation = enums.orientation[donneeEntree.enum_orientation_id];
      const typeVitrage = enums.type_vitrage[donneeEntree.enum_type_vitrage_id];
      const typeBaie = enums.type_baie[donneeEntree.enum_type_baie_id];
      const typeMateriauxMenuiserie =
        enums.type_materiaux_menuiserie[donneeEntree.enum_type_materiaux_menuiserie_id];

      const ficheTechnique = getFicheTechnique(dpe, '4', 'joint', [
        orientation,
        typeVitrage,
        typeBaie,
        typeMateriauxMenuiserie
      ]);

      if (ficheTechnique) {
        if (ficheTechnique.valeur.toLowerCase() === 'oui') {
          donneeEntree.presence_joint = 1;
        } else if (ficheTechnique.valeur.toLowerCase() === 'non') {
          donneeEntree.presence_joint = 0;
        } else {
          console.warn(`
            La valeur de la sous-fiche technique pour la présence de joint de la baie vitrée ${baieVitree.donnee_entree.description} est inconnue
          `);
        }
      }
    }
  });

  /**
   * 4 - Calcul des déperditions par renouvellement d’air
   * Les valeurs des coefficients de protection E et F sont différents si plusieurs façades sont exposées ou non
   */
  const ficheTechniqueFacadesExposees = getFicheTechnique(dpe, '10', 'exposées');
  const ficheTechniqueVentilationPost2012 = getFicheTechnique(
    dpe,
    '10',
    'après 2012',
    [],
    'valeur'
  );

  logement.ventilation_collection.ventilation.forEach((ventilation) => {
    ventilation.donnee_entree.ficheTechniqueFacadesExposees = ficheTechniqueFacadesExposees;
    ventilation.donnee_entree.ficheTechniqueVentilationPost2012 = ficheTechniqueVentilationPost2012;
  });

  const deperdition = calc_deperdition(
    cg,
    zc_id,
    th,
    isEffetJoule(instal_ch),
    dpe,
    ShChauffageAndEcs
  );
  const GV = deperdition.deperdition_enveloppe;

  const calculatedInertie = inertie.calculateInertie(env);

  if (calculatedInertie.enum_classe_inertie_id !== env.inertie.enum_classe_inertie_id) {
    console.error(
      `La classe d'inertie du DPE ${env.inertie.enum_classe_inertie_id} est différente 
      de la classe d'inertie calculée ${calculatedInertie.enum_classe_inertie_id}`
    );
  }

  const inertie_id = env.inertie.enum_classe_inertie_id;

  /**
   * Inertie ID
   * 1 - Très lourde
   * 2 - Lourde
   */
  const ilpa =
    logement.meteo.batiment_materiaux_anciens === 1 && ['1', '2'].includes(inertie_id) ? '1' : '0';

  const ecs = logement.installation_ecs_collection.installation_ecs || [];
  const Nb_lgt = cg.nombre_appartement || 1;
  const hsp = cg.hsp;
  const clim = logement.climatisation_collection.climatisation || [];
  let apport_et_besoin = calc_apport_et_besoin(
    logement,
    th,
    ecs,
    clim,
    ShChauffageAndEcs,
    Nb_lgt,
    GV,
    ilpa,
    ca_id,
    zc_id
  );

  const bfr = apport_et_besoin.besoin_fr;
  const bfr_dep = apport_et_besoin.besoin_fr_depensier;
  clim.forEach((clim) => calc_clim(clim, bfr, bfr_dep, zc_id, ShChauffageAndEcs));

  /**
   * La consommation ECS est obtenu pour certains types de DPE par virtualisation des générateurs collectifs en générateurs individuels virtuels
   * 4 - dpe appartement individuel chauffage individuel ecs collectif
   * 5 - dpe appartement individuel chauffage collectif ecs collectif
   * 32 - dpe appartement individuel chauffage mixte (collectif-individuel) ecs collectif
   * 35 - dpe appartement individuel chauffage mixte (collectif-individuel) ecs mixte (collectif-individuel)
   * 36 - dpe appartement individuel chauffage individuel ecs mixte (collectif-individuel)
   * 37 - dpe appartement individuel chauffage collectif ecs mixte (collectif-individuel)
   */
  const virtualisationECS = ['4', '5', '32', '35', '36', '37'].includes(map_id);

  let becs = apport_et_besoin.besoin_ecs;
  let becs_dep = apport_et_besoin.besoin_ecs_depensier;
  let isImmeubleSystemEcsIndividuels = false;

  /**
   * 11.4 Plusieurs systèmes d’ECS (limité à 2 systèmes différents par logement)
   * Les besoins en ECS pour chaque générateur sont / 2
   */
  if (ecs.length > 1) {
    // Immeuble avec différents systèmes individuels
    isImmeubleSystemEcsIndividuels =
      th === 'immeuble' && ecs.every((e) => e.donnee_entree.enum_type_installation_id === '1');

    if (!isImmeubleSystemEcsIndividuels) {
      becs /= 2;
      becs_dep /= 2;
    }
  }

  ecs.forEach((ecs) => {
    if (bug_for_bug_compat) {
      /**
       * Réalignement si besoin de la variable position_volume_chauffe
       * Si une fiche technique pour cette variable est présente, elle est prise en compte
       * Les valeurs de position_volume_chauffe n'étant pas toujours utilisées de la même manière
       * dans tous les DPEs (parfois 0 = 'Oui', d'autres 0 = 'Non')
       */
      ecs.generateur_ecs_collection.generateur_ecs.forEach((generateur) => {
        if (generateur.donnee_entree.description) {
          const ficheProductionVolumeHabitable = getFicheTechnique(
            dpe,
            '8',
            'hors volume habitable',
            [generateur.donnee_entree.description]
          );

          if (ficheProductionVolumeHabitable) {
            const pvcFicheTechnique = containsAnySubstring(ficheProductionVolumeHabitable.valeur, [
              'hors volume habitable',
              'oui'
            ])
              ? 0
              : 1;

            if (generateur.donnee_entree.position_volume_chauffe !== pvcFicheTechnique) {
              console.error(
                `La valeur de la variable position_volume_chauffe pour le générateur ECS ${generateur.donnee_entree.description} 
                ne correspond pas à celle présente dans la fiche technique "${ficheProductionVolumeHabitable.description}". 
                La valeur de la fiche technique est prise en compte.`
              );

              generateur.donnee_entree.position_volume_chauffe = pvcFicheTechnique;
            }
          }
        }

        /**
         * Si utilisation mixte chauffage + ECS, on compare le type de générateur ECS au générateur de chauffage associé
         * Réalignement si besoin de la donnée. Le type de générateur ECS est quelques fois erroné
         * enum_usage_generateur_id = 3 - chauffage + ecs
         */
        if (generateur.donnee_entree.enum_usage_generateur_id === '3') {
          const referenceGenerateurMixte = generateur.donnee_entree.reference_generateur_mixte;

          if (referenceGenerateurMixte) {
            // Récupération du générateur de chauffage associé à la production ECS
            const generateurMixte = instal_ch
              .flatMap(
                (installation) => installation.generateur_chauffage_collection.generateur_chauffage
              )
              .find(
                (generateurChauffage) =>
                  generateurChauffage.donnee_entree.reference_generateur_mixte ===
                  referenceGenerateurMixte
              );

            if (generateurMixte) {
              const generateurLabel =
                enums.type_generateur_ch[generateurMixte.donnee_entree.enum_type_generateur_ch_id];

              if (generateurLabel) {
                // Récupération s'il existe de l'id du générateur ECS qui a le même libellé que le générateur de chauffage associé
                const newEcsGenerateurId =
                  Object.entries(enums.type_generateur_ecs).find(
                    ([, label]) => label === generateurLabel
                  )?.[0] ?? null;

                if (
                  newEcsGenerateurId &&
                  newEcsGenerateurId !== generateur.donnee_entree.enum_type_generateur_ecs_id
                ) {
                  console.error(
                    `Le type de générateur ECS ${generateur.donnee_entree.description} ne correspond pas à celui 
                  du générateur de chauffage associé "${generateurLabel}". 
                  Le type de générateur de chauffage "${generateurLabel}" est utilisé pour les calculs ECS.`
                  );

                  generateur.donnee_entree.enum_type_generateur_ecs_id = newEcsGenerateurId;
                }
              }
            }
          }
        }
      });
    }
    calc_ecs(
      dpe,
      ecs,
      becs,
      becs_dep,
      GV,
      ca_id,
      zc_id,
      th,
      virtualisationECS,
      dpe.logement.caracteristique_generale.surface_habitable_immeuble,
      dpe.logement.caracteristique_generale.nombre_appartement,
      isImmeubleSystemEcsIndividuels
    );
  });

  /**
   * 8. Modélisation de l’intermittence
   * En immeuble collectif, le chauffage mixte, c'est-à-dire dont une partie est facturée collectivement et une autre
   * individuellement, est traité au niveau de l’intermittence comme un système collectif avec comptage individuel.
   */
  const ficheTechniqueComptage = getFicheTechnique(dpe, '7', 'Présence comptage');

  const ac = cg.annee_construction;
  // needed for apport_et_besoin
  instal_ch.forEach((ch) => {
    ch.donnee_entree.ficheTechniqueComptage = ficheTechniqueComptage;
    calc_chauffage(
      dpe,
      ch,
      ca_id,
      zc_id,
      inertie_id,
      map_id,
      0,
      0,
      GV,
      ShChauffageAndEcs,
      hsp,
      ac,
      ilpa
    );
  });

  const ets = env.ets_collection.ets;

  const besoin_ch = calc_besoin_ch(
    ilpa,
    ca_id,
    zc_id,
    inertie_id,
    ShChauffageAndEcs,
    GV,
    apport_et_besoin.nadeq,
    ecs,
    instal_ch,
    bv_list,
    ets,
    th,
    dpe.logement.caracteristique_generale.nombre_appartement
  );
  apport_et_besoin = { ...apport_et_besoin, ...besoin_ch };

  const bch = apport_et_besoin.besoin_ch;
  const bch_dep = apport_et_besoin.besoin_ch_depensier;
  const besoin_ch_mois = { ...apport_et_besoin.besoin_ch_mois };
  delete apport_et_besoin.besoin_ch_mois;

  /**
   * 13.2.1.2 Présence d’un ou plusieurs générateurs à combustion indépendants
   * Calcul des taux de charge pour chacun des générateurs de chauffage
   */
  tauxChargeForGenerator(instal_ch, GV, ca_id, zc_id);

  instal_ch.forEach((ch) => {
    calc_chauffage(
      dpe,
      ch,
      ca_id,
      zc_id,
      inertie_id,
      map_id,
      bch,
      bch_dep,
      GV,
      ShChauffageAndEcs,
      hsp,
      ac,
      ilpa,
      besoin_ch_mois
    );
  });

  const vt_list = logement.ventilation_collection.ventilation;

  let prorataECS = 1;
  let prorataChauffage = 1;

  /**
   * Besoins ECS pour les DPEs avec ECS collectif et répartition proratisés à la surface
   *
   * 15 - dpe issu d'une étude thermique réglementaire RT2012 bâtiment : appartement chauffage collectif ecs collectif
   * 16 - dpe issu d'une étude thermique réglementaire RT2012 bâtiment : appartement chauffage individuel ecs collectif
   * 19 - dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : appartement chauffage collectif ecs collectif
   * 20 - dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : appartement chauffage individuel ecs collectif
   * 22 - dpe issu d'une étude thermique réglementaire RT2012 bâtiment : appartement chauffage individuel ecs individuel
   * 23 - dpe issu d'une étude thermique réglementaire RT2012 bâtiment : appartement chauffage collectif ecs individuel
   * 24 - dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : appartement chauffage collectif ecs individuel
   * 25 - dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : appartement chauffage individuel ecs individuel
   */
  if (['15', '16', '19', '20', '22', '23', '24', '25'].includes(map_id)) {
    prorataECS = Sh / ShChauffageAndEcs;
  }

  if (
    ['11', '13', '15', '16', '19', '20', '22', '23', '24', '25', /*'33', '34',*/ '40'].includes(
      map_id
    )
  ) {
    prorataChauffage = Sh / ShChauffageAndEcs;
  }

  const conso = calc_conso(
    Sh,
    zc_id,
    ca_id,
    vt_list,
    instal_ch,
    ecs,
    clim,
    prorataECS,
    prorataChauffage
  );

  const production_electricite = productionENR.calculateEnr(
    dpe.logement.production_elec_enr,
    conso,
    Sh,
    th,
    zc_id
  );

  // get all baie_vitree orientations
  const ph_list = env.plancher_haut_collection.plancher_haut || [];
  logement.sortie = {
    deperdition,
    apport_et_besoin,
    confort_ete: calc_confort_ete(inertie_id, bv_list, ph_list),
    qualite_isolation: calc_qualite_isolation(env, deperdition),
    production_electricite,
    ...conso
  };

  const conso_coeff_1_9 = get_conso_coeff_1_9_2026(dpe);
  logement.sortie.ep_conso = { ...logement.sortie.ep_conso, ...conso_coeff_1_9 };

  return dpe;
}

/**
 * Retourne les classes calculées ges dpe.
 * @param dpe {FullDpe}
 * @returns {{dpeClass: string, gesClass: string}}
 */
export function get_classe_ges_dpe(dpe) {
  const zc_id = dpe.logement.meteo.enum_zone_climatique_id;
  const ca_id = dpe.logement.meteo.enum_classe_altitude_id;
  const th = calc_th(dpe.logement.caracteristique_generale.enum_methode_application_dpe_log_id);

  let Sh;
  if (th === 'maison' || th === 'appartement')
    Sh = dpe.logement.caracteristique_generale.surface_habitable_logement;
  else if (th === 'immeuble') Sh = dpe.logement.caracteristique_generale.surface_habitable_immeuble;

  return {
    dpeClass: classe_bilan_dpe(dpe.logement.sortie.ep_conso.ep_conso_5_usages_m2, zc_id, ca_id, Sh),
    gesClass: classe_emission_ges(
      dpe.logement.sortie.emission_ges.emission_ges_5_usages_m2,
      zc_id,
      ca_id,
      Sh
    )
  };
}

/**
 * Calcul de la nouvelle conso suite à la modification du coefficient pour le chauffage électrique
 * Applicable uniquement à partir de janvier 2026
 *
 * {@link https://www.ecologie.gouv.fr/actualites/evolutions-du-calcul-du-dpe-reponses-vos-questions#:~:text=Les%20DPE%20r%C3%A9alis%C3%A9s%20avant%20le,%2DAudit%20de%20l'Ademe.}
 *
 * @param dpe {FullDpe}
 * @returns {{ep_conso_5_usages_2026: number; ep_conso_5_usages_2026_m2: number; classe_bilan_dpe_2026: string}}
 */
export function get_conso_coeff_1_9_2026(dpe) {
  const zc_id = dpe.logement.meteo.enum_zone_climatique_id;
  const ca_id = dpe.logement.meteo.enum_classe_altitude_id;
  const th = calc_th(dpe.logement.caracteristique_generale.enum_methode_application_dpe_log_id);

  const ep_conso_5_usages_2026 =
    (0.9 / 1.3) *
      (Number(dpe.logement.sortie.ep_conso.ep_conso_5_usages) -
        Number(dpe.logement.sortie.ef_conso.conso_5_usages)) +
    Number(dpe.logement.sortie.ef_conso.conso_5_usages);

  let Sh;
  if (th === 'maison' || th === 'appartement')
    Sh = Number(dpe.logement.caracteristique_generale.surface_habitable_logement);
  else if (th === 'immeuble')
    Sh = Number(dpe.logement.caracteristique_generale.surface_habitable_immeuble);

  const ep_conso_5_usages_2026_m2 = Math.floor(ep_conso_5_usages_2026 / Sh);
  const classe_bilan_dpe_2026 = classe_bilan_dpe(ep_conso_5_usages_2026_m2, zc_id, ca_id, Sh);

  return { classe_bilan_dpe_2026, ep_conso_5_usages_2026_m2, ep_conso_5_usages_2026 };
}
