import { bug_for_bug_compat, tv } from './utils.js';
import { TvsStore } from './core/tv/infrastructure/tvs.store.js';

const tvsStore = new TvsStore();

export function rendement_emission(em, rg = 1) {
  const re = em.donnee_intermediaire.rendement_emission;
  const rd = em.donnee_intermediaire.rendement_distribution;
  const rr = em.donnee_intermediaire.rendement_regulation;
  return rg * re * rd * rr;
}

function tv_rendement_distribution_ch(di, de) {
  let row;

  // Pour les 'Autres équipements' (id=41), si le DPE original a déjà un tv_rendement_distribution_ch_id,
  // on conserve cette valeur plutôt que de prendre la première ligne de la table (bug).
  if (de.enum_type_emission_distribution_id === '41' && de.tv_rendement_distribution_ch_id) {
    row = tvsStore.getRendementDistributionChById(de.tv_rendement_distribution_ch_id);
  }

  if (!row) {
    row = tvsStore.getRendementDistributionCh(
      de.enum_type_emission_distribution_id,
      de.reseau_distribution_isole
    );
  }

  if (!row && de.tv_rendement_distribution_ch_id) {
    // Find rendement distribution by id if it exists
    row = tvsStore.getRendementDistributionChById(de.tv_rendement_distribution_ch_id);
  }

  if (row) {
    di.rendement_distribution = Number(row.rd);
    de.tv_rendement_distribution_ch_id = Number(row.tv_rendement_distribution_ch_id);
  } else {
    console.error('!! pas de valeur forfaitaire trouvée pour rendement_distribution_ch !!');
  }
}

function tv_rendement_emission(di, de) {
  const matcher = {
    enum_type_emission_distribution_id: de.enum_type_emission_distribution_id
  };
  const row = tv('rendement_emission', matcher);
  if (row) {
    di.rendement_emission = Number(row.re);
    de.tv_rendement_emission_id = Number(row.tv_rendement_emission_id);
  } else {
    console.error('!! pas de valeur forfaitaire trouvée pour rendement_emission !!');
  }
}

function tv_rendement_regulation(di, de) {
  const matcher = {
    enum_type_emission_distribution_id: de.enum_type_emission_distribution_id
  };
  const row = tv('rendement_regulation', matcher);
  if (row) {
    di.rendement_regulation = Number(row.rr);
    de.tv_rendement_regulation_id = Number(row.tv_rendement_regulation_id);
  } else {
    console.error('!! pas de valeur forfaitaire trouvée pour rendement_regulation !!');
  }
}

/**
 * En bug_for_bug_compat, indique si l'intermittence saisie par le logiciel (tv_intermittence_id)
 * correspond à une ligne de la table réservée aux installations collectives.
 * @param {object} de donnee_entree de l'émetteur
 * @returns {boolean}
 */
export function isIntermittenceCollectiveSaisie(de) {
  if (!bug_for_bug_compat || !de.tv_intermittence_id) return false;
  const row = tv('intermittence', { tv_intermittence_id: de.tv_intermittence_id });
  if (!row || !row.enum_type_installation_id) return false;
  return !row.enum_type_installation_id.split('|').includes('1');
}

function tv_intermittence(di, de, inst_ch_de, map_id, inertie_id, isAppointIndividuel) {
  let hasComptage = false;
  let row;

  if (inst_ch_de.ficheTechniqueComptage) {
    // Si une fiche technique permet de connaitre la présence ou non d'un comptage individuel pour le chauffage
    const ficheTechniqueValue = inst_ch_de.ficheTechniqueComptage.valeur;
    hasComptage =
      ficheTechniqueValue &&
      (Number.parseInt(ficheTechniqueValue) === 1 || ficheTechniqueValue.toLowerCase() === 'oui');
  } else {
    if (bug_for_bug_compat) {
      // Si info inconnue, on se base sur tv_intermittence_id pour récupérer cette info
      const inertie = {
        tv_intermittence_id: de.tv_intermittence_id
      };
      row = tv('intermittence', inertie);

      if (row && row.comptage_individuel) {
        hasComptage = row.comptage_individuel.includes('Présence');
      }
    }
  }

  const matcher = {
    enum_methode_application_dpe_log_id: map_id,
    enum_type_installation_id: inst_ch_de.enum_type_installation_id,
    enum_type_chauffage_id: de.enum_type_chauffage_id,
    enum_equipement_intermittence_id: de.enum_equipement_intermittence_id,
    enum_type_regulation_id: de.enum_type_regulation_id,
    enum_type_emission_distribution_id: de.enum_type_emission_distribution_id,
    comptage_individuel: hasComptage ? 'Présence' : 'Absence'
  };

  // Pas de valeur d'inertie pour les méthodes d'applications différentes de "dpe maison individuelle"
  // dans le fichier de table de valeur sur l'onglet "intermittence", si on le précise on ne trouve aucune correspondance
  // et la mauvaise valeur est sélectionnée
  if (map_id === '1') {
    matcher.enum_classe_inertie_id = inertie_id;
  }

  // Émetteur d'appoint individuel d'une installation base collective + appoint individuel :
  // table « chauffage individuel », sans notion de comptage individuel (§9.8).
  // En bug_for_bug_compat, on conserve la table collective si le logiciel l'a retenue pour cet
  // émetteur (tv_intermittence_id saisi sur une ligne sans installation individuelle).
  if (isAppointIndividuel && !isIntermittenceCollectiveSaisie(de)) {
    matcher.enum_type_installation_id = '1';
    delete matcher.comptage_individuel;
  }

  row = tv('intermittence', matcher);
  if (row) {
    di.i0 = Number(row.i0);
    de.tv_intermittence_id = Number(row.tv_intermittence_id);
  } else {
    console.error('!! pas de valeur forfaitaire trouvée pour intermittence !!');
  }
}

export function calc_emetteur_ch(
  em_ch,
  inst_ch_de,
  map_id,
  inertie_id,
  isAppointIndividuel = false
) {
  const de = em_ch.donnee_entree;
  const di = {};
  const du = {};

  tv_rendement_distribution_ch(di, de);
  tv_rendement_emission(di, de);
  tv_rendement_regulation(di, de);
  tv_intermittence(di, de, inst_ch_de, map_id, inertie_id, isAppointIndividuel);

  em_ch.donnee_intermediaire = di;
  em_ch.donnee_utilisateur = du;
}
