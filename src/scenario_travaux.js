import { isEffetJoule, tv } from './utils.js';

/**
 * Scénario de travaux : purge ciblée des valeurs reprises du DPE d'origine.
 *
 * Pour rester conforme aux DPE publiés par l'ADEME (mode bug_for_bug_compat), le moteur reprend
 * certaines valeurs déjà présentes dans le DPE d'entrée (`tv_*_id`, données intermédiaires, fiches
 * techniques) au lieu de les recalculer. Dans un scénario de travaux, ces valeurs décrivent l'état
 * avant travaux : l'appelant déclare les éléments modifiés via l'option `elementsModifies` de
 * `calcul_3cl`, et seules les valeurs reprises de ces éléments (et des éléments qui en dépendent)
 * sont supprimées avant le calcul. Les éléments non déclarés gardent le comportement habituel.
 *
 * Format d'un identifiant : `'<type>:<reference>'`, où `reference` est la valeur de
 * `donnee_entree.reference` de l'élément et `type` l'une des clés de TYPES_ELEMENTS.
 */

const liste = (x) => (x === undefined || x === null ? [] : Array.isArray(x) ? x : [x]);

const installationsChauffage = (logement) =>
  liste(logement.installation_chauffage_collection?.installation_chauffage);
const installationsEcs = (logement) =>
  liste(logement.installation_ecs_collection?.installation_ecs);

/** Types d'éléments acceptés et accès à leurs listes dans le logement. */
export const TYPES_ELEMENTS = {
  mur: (logement) => liste(logement.enveloppe?.mur_collection?.mur),
  plancher_bas: (logement) => liste(logement.enveloppe?.plancher_bas_collection?.plancher_bas),
  plancher_haut: (logement) => liste(logement.enveloppe?.plancher_haut_collection?.plancher_haut),
  baie_vitree: (logement) => liste(logement.enveloppe?.baie_vitree_collection?.baie_vitree),
  porte: (logement) => liste(logement.enveloppe?.porte_collection?.porte),
  ventilation: (logement) => liste(logement.ventilation_collection?.ventilation),
  generateur_chauffage: (logement) =>
    installationsChauffage(logement).flatMap((installation) =>
      liste(installation.generateur_chauffage_collection?.generateur_chauffage)
    ),
  emetteur_chauffage: (logement) =>
    installationsChauffage(logement).flatMap((installation) =>
      liste(installation.emetteur_chauffage_collection?.emetteur_chauffage)
    ),
  generateur_ecs: (logement) =>
    installationsEcs(logement).flatMap((installation) =>
      liste(installation.generateur_ecs_collection?.generateur_ecs)
    ),
  installation_ecs: (logement) => installationsEcs(logement)
};

/** Types d'éléments d'enveloppe dont la modification change le q4pa_conv de la ventilation. */
const TYPES_ENVELOPPE = ['mur', 'plancher_bas', 'plancher_haut', 'baie_vitree', 'porte'];

/**
 * Données intermédiaires d'un générateur à combustion, saisies dans l'ordre des méthodes de saisie
 * `enum_methode_saisie_carac_sys_id` 2 à 5 : une valeur saisie par l'appelant pour le nouveau
 * générateur (méthode > 1) est conservée, les autres décrivent l'ancien générateur.
 */
const CARACTERISTIQUES_COMBUSTION = [
  ['pn', 2],
  ['rpn', 3],
  ['rpint', 3],
  ['qp0', 4],
  ['temp_fonc_30', 5],
  ['temp_fonc_100', 5]
];

/**
 * Indique si l'option elementsModifies demande une purge : absente (undefined) ou tableau vide =
 * aucune purge, le calcul est strictement celui sans option.
 *
 * @param elementsModifies {*}
 * @returns {boolean}
 */
export function aDesElementsModifies(elementsModifies) {
  if (elementsModifies === undefined) return false;
  return !Array.isArray(elementsModifies) || elementsModifies.length > 0;
}

/**
 * Analyse et valide la liste des identifiants déclarés.
 *
 * @param elementsModifies {string[]}
 * @returns {Map<string, Set<string>>} références déclarées par type
 */
export function parseElementsModifies(elementsModifies) {
  const parType = new Map();
  if (!Array.isArray(elementsModifies)) {
    console.warn(
      `elementsModifies doit être un tableau d'identifiants '<type>:<reference>' : option ignorée`
    );
    return parType;
  }

  for (const identifiant of elementsModifies) {
    const texte = typeof identifiant === 'string' ? identifiant : '';
    const separateur = texte.indexOf(':');
    const type = separateur > 0 ? texte.slice(0, separateur) : '';
    const reference = separateur > 0 ? texte.slice(separateur + 1) : '';

    if (!TYPES_ELEMENTS[type] || !reference) {
      console.warn(
        `elementsModifies : identifiant '${identifiant}' non reconnu (format attendu '<type>:<reference>', types : ${Object.keys(TYPES_ELEMENTS).join(', ')})`
      );
      continue;
    }

    if (!parType.has(type)) parType.set(type, new Set());
    parType.get(type).add(reference);
  }

  return parType;
}

/**
 * Retrouve les éléments déclarés modifiés dans le logement.
 * Référence inconnue ou portée par plusieurs éléments : avertissement explicite. Une référence
 * dupliquée purge tous les éléments qui la portent.
 *
 * @param logement {Logement}
 * @param parType {Map<string, Set<string>>}
 * @returns {Map<string, object[]>} éléments modifiés par type
 */
export function trouverElements(logement, parType) {
  const elements = new Map();
  for (const [type, references] of parType) {
    const candidats = TYPES_ELEMENTS[type](logement);
    const trouves = [];
    for (const reference of references) {
      const correspondances = candidats.filter(
        (element) => String(element?.donnee_entree?.reference) === reference
      );
      if (correspondances.length === 0) {
        console.warn(`elementsModifies : aucun élément '${type}' de référence '${reference}'`);
      } else if (correspondances.length > 1) {
        console.warn(
          `elementsModifies : ${correspondances.length} éléments '${type}' partagent la référence '${reference}', ils sont tous considérés comme modifiés`
        );
      }
      trouves.push(...correspondances);
    }
    elements.set(type, trouves);
  }
  return elements;
}

/** Supprime les clés d'un objet (s'il existe). */
function supprimer(objet, cles) {
  if (!objet) return;
  for (const cle of cles) delete objet[cle];
}

/**
 * Purge les caractéristiques reprises d'un générateur à combustion modifié (pn, rpn, rpint, qp0,
 * temp_fonc_30/100 selon la méthode de saisie, pveilleuse).
 *
 * @param generateur {object} générateur de chauffage ou d'ECS
 */
export function purgerCaracteristiquesCombustion(generateur) {
  const methode = parseInt(generateur.donnee_entree?.enum_methode_saisie_carac_sys_id) || 1;
  const cles = CARACTERISTIQUES_COMBUSTION.filter(
    ([, methodeSaisie]) => methode < methodeSaisie
  ).map(([cle]) => cle);
  supprimer(generateur.donnee_intermediaire, [...cles, 'pveilleuse']);
}

/**
 * Purge temp_fonc_30/100 d'un générateur (période des émetteurs déduite du DPE d'origine), sauf
 * si elles sont saisies (méthode 5).
 */
export function purgerTemperaturesFonctionnement(generateur) {
  const methode = parseInt(generateur.donnee_entree?.enum_methode_saisie_carac_sys_id) || 1;
  if (methode < 5) supprimer(generateur.donnee_intermediaire, ['temp_fonc_30', 'temp_fonc_100']);
}

/**
 * Supprime des fiches techniques (catégorie 7 chauffage, 8 ECS) les sous-fiches décrivant un
 * générateur modifié : de la sous-fiche dont la valeur contient sa description jusqu'au
 * générateur suivant (même règle de découpage que presenceVeilleuse()). Le moteur y lit la
 * veilleuse, la pose murale, l'année ou le ventilateur de combustion de l'ancien générateur.
 *
 * @param dpe {FullDpe}
 * @param description {string} description du générateur modifié
 * @param categorie {'7'|'8'}
 */
export function purgerFichesTechniquesGenerateur(dpe, description, categorie) {
  const aiguille = (description ?? '').toString().toLowerCase();
  if (!aiguille) return;
  const valeur = (sousFiche) => (sousFiche?.valeur ?? '').toString().toLowerCase();
  const libelle = (sousFiche) => (sousFiche?.description ?? '').toString().toLowerCase();

  for (const fiche of liste(dpe.fiche_technique_collection?.fiche_technique)) {
    if (String(fiche?.enum_categorie_fiche_technique_id) !== categorie) continue;
    const collection = fiche.sous_fiche_technique_collection;
    const sousFiches = liste(collection?.sous_fiche_technique);
    const conservees = [];
    let dansBloc = false;
    for (const sousFiche of sousFiches) {
      if (valeur(sousFiche).includes(aiguille)) {
        dansBloc = true;
      } else if (dansBloc && /^type (de )?g[ée]n[ée]rateur/.test(libelle(sousFiche))) {
        dansBloc = false;
      }
      if (!dansBloc) conservees.push(sousFiche);
    }
    if (conservees.length !== sousFiches.length) {
      collection.sous_fiche_technique = conservees;
    }
  }
}

/**
 * Statut effet Joule retenu par le DPE d'origine, lu dans les lignes tv_umur / tv_upb / tv_uph
 * reprises des parois (première ligne trouvée). Le moteur relit ce statut dans ces lignes
 * (cf. tv_umur dans 3.2.1_mur.js) : après un passage effet Joule ↔ autre système, elles doivent
 * être recalculées.
 *
 * @param logement {Logement}
 * @returns {string|undefined} '0' | '1' ou undefined si aucune ligne reprise
 */
export function effetJouleDpeOrigine(logement) {
  const parois = [
    ['umur', TYPES_ELEMENTS.mur(logement)],
    ['upb', TYPES_ELEMENTS.plancher_bas(logement)],
    ['uph', TYPES_ELEMENTS.plancher_haut(logement)]
  ];
  for (const [table, elements] of parois) {
    for (const element of elements) {
      const id = element.donnee_entree?.[`tv_${table}_id`];
      if (!id) continue;
      const row = tv(table, { [`tv_${table}_id`]: id });
      if (row?.effet_joule !== undefined) return String(row.effet_joule);
    }
  }
  return undefined;
}

/**
 * Applique au DPE (déjà assaini) la purge des valeurs reprises pour les éléments déclarés
 * modifiés et les éléments qui en dépendent :
 *
 * - murs, planchers, baies, portes : `tv_q4pa_conv_id` de toutes les ventilations. Les parois et
 *   ponts thermiques liés n'ont rien à purger : leurs `donnee_intermediaire` et `tv_*_id` sont
 *   recalculés à partir des `donnee_entree` (seuls `umur0`/`upb0`/`uph0` de l'état initial sont
 *   repris, ils décrivent la structure) ;
 * - ventilation : `tv_q4pa_conv_id` ;
 * - générateur de chauffage : caractéristiques de combustion, sous-fiches techniques (cat. 7) ;
 *   si le statut effet Joule du logement change, `tv_umur_id`, `tv_upb_id`, `tv_uph_id` de
 *   toutes les parois ;
 * - émetteur : `tv_intermittence_id`, `tv_rendement_distribution_ch_id` (type 41 « autres
 *   équipements »), temp_fonc_30/100 des générateurs de son installation ;
 * - générateur ECS : caractéristiques de combustion, `rendement_generation_stockage`,
 *   sous-fiches techniques (cat. 8) ;
 * - installation ECS : `tv_rendement_distribution_ecs_id`.
 *
 * Baies et portes remplacées : renseigner `presence_joint` (sinon avertissement).
 *
 * Ne sont jamais purgés : `tv_umur0_id`, `tv_coef_reduction_deperdition_id`, `tv_coef_masque_*`,
 * `tv_coef_transparence_ets_id`, `donnee_utilisateur` (structure, local adjacent, masques).
 *
 * @param dpe {FullDpe} DPE assaini, modifié en place (à cloner au préalable)
 * @param elementsModifies {string[]}
 * @returns {number} nombre d'éléments déclarés retrouvés
 */
export function appliquerElementsModifies(dpe, elementsModifies) {
  const logement = dpe.logement;
  const elements = trouverElements(logement, parseElementsModifies(elementsModifies));
  const de = (element) => element.donnee_entree;

  // Enveloppe : ligne q4pa_conv de la ventilation (isolation des surfaces, joints)
  const enveloppeModifiee = TYPES_ENVELOPPE.some((type) => elements.get(type)?.length);
  for (const type of ['baie_vitree', 'porte']) {
    (elements.get(type) ?? []).forEach((menuiserie) => {
      if (de(menuiserie).presence_joint === undefined || de(menuiserie).presence_joint === '') {
        console.warn(
          `elementsModifies : '${type}:${de(menuiserie).reference}' sans presence_joint, la fiche technique du DPE d'origine peut être relue`
        );
      }
    });
  }
  if (enveloppeModifiee || elements.get('ventilation')?.length) {
    TYPES_ELEMENTS.ventilation(logement).forEach((ventilation) =>
      supprimer(de(ventilation), ['tv_q4pa_conv_id'])
    );
  }

  // Générateurs de chauffage
  const generateursCh = elements.get('generateur_chauffage') ?? [];
  generateursCh.forEach((generateur) => {
    purgerCaracteristiquesCombustion(generateur);
    purgerFichesTechniquesGenerateur(dpe, de(generateur).description, '7');
  });
  if (generateursCh.length) {
    const avant = effetJouleDpeOrigine(logement);
    const apres = isEffetJoule(installationsChauffage(logement));
    if (avant !== undefined && avant !== apres) {
      TYPES_ELEMENTS.mur(logement).forEach((mur) => supprimer(de(mur), ['tv_umur_id']));
      TYPES_ELEMENTS.plancher_bas(logement).forEach((pb) => supprimer(de(pb), ['tv_upb_id']));
      TYPES_ELEMENTS.plancher_haut(logement).forEach((ph) => supprimer(de(ph), ['tv_uph_id']));
    }
  }

  // Émetteurs : intermittence, distribution et générateurs associés
  const emetteurs = new Set(elements.get('emetteur_chauffage') ?? []);
  emetteurs.forEach((emetteur) => {
    supprimer(de(emetteur), ['tv_intermittence_id']);
    if (String(de(emetteur).enum_type_emission_distribution_id) === '41') {
      supprimer(de(emetteur), ['tv_rendement_distribution_ch_id']);
    }
  });
  if (emetteurs.size) {
    for (const installation of installationsChauffage(logement)) {
      const emetteursInstallation = liste(
        installation.emetteur_chauffage_collection?.emetteur_chauffage
      );
      if (!emetteursInstallation.some((emetteur) => emetteurs.has(emetteur))) continue;
      liste(installation.generateur_chauffage_collection?.generateur_chauffage).forEach(
        purgerTemperaturesFonctionnement
      );
    }
  }

  // ECS
  (elements.get('generateur_ecs') ?? []).forEach((generateur) => {
    purgerCaracteristiquesCombustion(generateur);
    supprimer(generateur.donnee_intermediaire, ['rendement_generation_stockage']);
    purgerFichesTechniquesGenerateur(dpe, de(generateur).description, '8');
  });
  (elements.get('installation_ecs') ?? []).forEach((installation) =>
    supprimer(de(installation), ['tv_rendement_distribution_ecs_id'])
  );

  return [...elements.values()].reduce((acc, liste) => acc + liste.length, 0);
}
