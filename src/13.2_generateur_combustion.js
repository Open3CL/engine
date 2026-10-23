import { bug_for_bug_compat, convertExpression, dpe_original, tv, tvColumnLines } from './utils.js';
import enums from './enums.js';
import { updateGenerateurBouilleurs } from './13.2_generateur_combustion_bouilleur.js';
import {
  getChaudiereFioulDefautId,
  updateGenerateurChaudieres
} from './13.2_generateur_combustion_chaudiere.js';
import { updateGenerateurPacs } from './13.2_generateur_pac.js';
import getFicheTechnique from './ficheTechnique.js';
import { evaluateFormula as evaluateTvFormula } from './formula.js';
import { conventionPuissanceNominale } from './13.2_generateur_combustion_pn.js';
import {
  anneeInstallationGenerateur,
  pnEstimeeDimensionnement,
  valeurChaudiereMurale
} from './13.2_generateur_combustion_pdim.js';

function criterePn(Pn, matcher) {
  let critere_list = tvColumnLines('generateur_combustion', 'critere_pn', matcher);
  critere_list = critere_list.filter((critere) => critere);
  let ret;
  if (critere_list.length === 0) {
    ret = null;
  } else {
    // change ≤ to <= in all critere_list
    critere_list = critere_list.map((c) => c.replace('≤', '<='));
    // find critere in critere_list that is true when executed
    for (const critere of critere_list) {
      if (eval(`let Pn=${Pn} ;${convertExpression(critere)}`)) {
        ret = critere.replace('<=', '≤');
        break;
      }
    }
    if (!ret) console.warn('!! pas de critere trouvé pour pn !!');
  }
  return ret;
}

const E_tab = {
  0: 2.5,
  1: 1.75
};

const F_tab = {
  0: -0.8,
  1: -0.55
};

function evaluateFormula(formulaOrValue, pn, E, F) {
  return evaluateTvFormula(formulaOrValue, pn, E, F);
}

/**
 * Méthodes de saisie des caractéristiques (enum_methode_saisie_carac_sys_id) pour lesquelles la
 * puissance nominale pn est saisie (plaque signalétique ou documentation technique).
 */
export const METHODES_SAISIE_PN = [2, 3, 4, 5];

/**
 * Puissance nominale maximale (W) retenue dans la formule Qp0 = Pn × (E + F × log Pn) / 100 des
 * chaudières gaz standard et basse température installées après 2015.
 */
export const PN_MAX_QP0_CHAUDIERE_GAZ = 400000;

/**
 * Puissance (W) à utiliser dans la formule qp0 de la ligne de table.
 *
 * Pour les chaudières gaz après 2015 (qp0 = Pn × (E + F × log Pn) / 100), le moteur de référence
 * (Tribu, `Calcul_generateur.cs` Rpn_chaudieregaz, `Math.Min(400.0, Pn)`) plafonne Pn à 400 kW :
 * au-delà, la formule n'est plus représentative (elle décroît et devient négative vers 1 500 kW).
 * Le plafond ne s'applique pas aux chaudières fioul (Rpn_chaudierefioul : Pn non plafonné).
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.2
 *
 * @param row {object} ligne de la table generateur_combustion
 * @param pnCollectif {number} puissance nominale du générateur (W)
 * @returns {number}
 */
export function puissanceFormuleQp0(row, pnCollectif) {
  const formuleEF = /E\s*\+\s*F/.test(row.qp0_perc || '');
  const chaudiereGaz = /chaudi[eè]re gaz/i.test(row.type_generateur || '');
  return formuleEF && chaudiereGaz ? Math.min(pnCollectif, PN_MAX_QP0_CHAUDIERE_GAZ) : pnCollectif;
}

/**
 * Caractéristiques forfaitaires (rpn, rpint, qp0) d'un générateur à combustion.
 *
 * Si la consommation est obtenue par virtualisation du générateur collectif pour les besoins
 * individuels, les formules sont évaluées sur la puissance du générateur collectif
 * Pn(collectif) = pn / ratio, et qp0 est ramené au logement (× ratio).
 * 17.2.1 - Génération d’un DPE à l’appartement / Traitement des usages collectifs
 *
 * Seules les caractéristiques non saisies (selon la méthode de saisie) sont renvoyées.
 *
 * @param row {object} ligne de la table generateur_combustion
 * @param pn {number} puissance nominale du générateur (W)
 * @param ratio {number} ratio de virtualisation
 * @param E {number}
 * @param F {number}
 * @param type {'ecs'|'ch'}
 * @param methodeSaisie {number}
 * @returns {{rpn?: number, rpint?: number, qp0?: number}}
 */
export function caracteristiquesGenerateurCombustion(row, pn, ratio, E, F, type, methodeSaisie) {
  const caracteristiques = {};

  if (![3, 4, 5].includes(methodeSaisie)) {
    if (row.rpn) {
      caracteristiques.rpn = evaluateFormula(row.rpn, pn / ratio, E, F) / 100;
    }
    if (type === 'ch' && row.rpint) {
      caracteristiques.rpint = evaluateFormula(row.rpint, pn / ratio, E, F) / 100;
    }
  }

  if (![4, 5].includes(methodeSaisie)) {
    if (row.qp0_perc) {
      const qp0_calc = evaluateFormula(row.qp0_perc, puissanceFormuleQp0(row, pn / ratio), E, F);
      // Certaines chaudières ont un qp0 en % de pn, d'autres ont des valeurs constantes
      if (row.qp0_perc.includes('Pn')) {
        caracteristiques.qp0 = qp0_calc * 1000 * ratio;
      } else {
        if (row.qp0_perc.includes('%')) {
          caracteristiques.qp0 = qp0_calc * pn;
        } else {
          caracteristiques.qp0 = qp0_calc * 1000 * ratio;
        }
      }
    } else {
      caracteristiques.qp0 = 0;
    }
  }

  return caracteristiques;
}

/**
 * Estimation de la puissance nominale (W) d'un générateur à combustion dont la puissance n'est pas connue :
 * Pch = Sh1 / Shtot × 1,2 × GV × (19 − Tbase) / 0,95³
 *
 * Si le générateur n'alimente qu'une partie du logement, la puissance est proratisée à la surface desservie.
 * Le ratio est borné à ]0 ; 1] : une surface absente, nulle ou supérieure à Sh ne modifie pas Pch.
 *
 * Remarque : la méthode ne prévoit cette estimation que pour les générateurs individuels. Pour un générateur
 * collectif sans pn, la même formule (GV du logement, convention pn = Pe) est une extrapolation.
 *
 * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.2.4 Calcul des puissances nominales (p.90-91)
 *
 * @param GV {number} déperditions enveloppe + renouvellement d'air (W/K)
 * @param tbase {number} température extérieure de base (°C)
 * @param ratioSurface {number} Sh_installation / Sh
 * @returns {number}
 */
export function pnEstimee(GV, tbase, ratioSurface = 1) {
  const prorata = ratioSurface > 0 && ratioSurface < 1 ? ratioSurface : 1;
  return (prorata * 1.2 * GV * (19 - tbase)) / 0.95 ** 3;
}

/**
 * Pose murale d'une chaudière, lue dans la sous-fiche technique « Chaudière murale » (catégorie 7
 * pour le chauffage, 8 pour l'ECS) du générateur.
 *
 * @param dpe {FullDpe}
 * @param de {Donnee_entree}
 * @param type {'ch' | 'ecs'}
 * @returns {boolean|undefined} undefined si non renseigné
 */
export function chaudiereMurale(dpe, de, type) {
  const fiche = getFicheTechnique(dpe, type === 'ch' ? '7' : '8', 'Chaudière murale', [
    de.description
  ]);
  return valeurChaudiereMurale(fiche?.valeur);
}

/**
 * Volume de stockage (L) de la production d'ECS assurée par un générateur de chauffage mixte :
 * générateur ECS mixte de même `reference_generateur_mixte`, sinon générateur ECS mixte unique.
 *
 * @param dpe {FullDpe}
 * @param de {Donnee_entree} données du générateur de chauffage
 * @returns {number|undefined}
 */
export function volumeStockageEcsMixte(dpe, de) {
  const liste = (x) => (x === undefined || x === null ? [] : Array.isArray(x) ? x : [x]);
  const generateursEcsMixtes = liste(dpe?.logement?.installation_ecs_collection?.installation_ecs)
    .flatMap((installation) => liste(installation.generateur_ecs_collection?.generateur_ecs))
    .filter((generateur) => String(generateur?.donnee_entree?.enum_usage_generateur_id) === '3');

  const reference = de.reference_generateur_mixte;
  const jumeau =
    (reference !== undefined &&
      reference !== null &&
      generateursEcsMixtes.find(
        (generateur) =>
          String(generateur.donnee_entree.reference_generateur_mixte) === String(reference)
      )) ||
    (generateursEcsMixtes.length === 1 ? generateursEcsMixtes[0] : undefined);

  return jumeau?.donnee_entree.volume_stockage;
}

/**
 * Puissance nominale estimée (W) d'un générateur à combustion dont `pn` est absente.
 *
 * Méthode 3CL-DPE 2021 §13.2.2.4 : Pdim = max(Pch ; Pecs), puis table Pdim → Pn pour les chaudières
 * (cf. 13.2_generateur_combustion_pdim.js). La méthode ne vise que les générateurs individuels :
 * pour une installation collective, Pch est conservée (comportement historique).
 *
 * @param dpe {FullDpe}
 * @param de {Donnee_entree} données du générateur
 * @param type {'ch' | 'ecs'}
 * @param pch {number} Pch (W) proratisée à la surface desservie
 * @param optionsPn {{installationIndividuelle?: boolean, volumeStockage?: number}}
 * @returns {number} Pn (W)
 */
export function pnEstimeeGenerateur(dpe, de, type, pch, optionsPn = {}) {
  const installationIndividuelle =
    optionsPn.installationIndividuelle ?? String(de.enum_type_installation_id) === '1';
  if (!installationIndividuelle) {
    return pch;
  }

  const usage = String(de.enum_usage_generateur_id);
  const usageEcs = type === 'ecs' || usage === '3';
  const usageChauffage = type === 'ch' || usage === '3';
  const volumeStockage =
    optionsPn.volumeStockage ??
    (type === 'ecs' ? de.volume_stockage : usageEcs ? volumeStockageEcsMixte(dpe, de) : undefined);

  const libelleTypeGenerateur =
    enums[`type_generateur_${type}`]?.[de[`enum_type_generateur_${type}_id`]];

  return pnEstimeeDimensionnement({
    pch,
    volumeStockage,
    usageEcs,
    usageChauffage,
    libelleTypeGenerateur,
    murale: chaudiereMurale(dpe, de, type),
    anneeInstallation: anneeInstallationGenerateur(
      de.annee_installation,
      dpe?.logement?.caracteristique_generale?.annee_construction,
      libelleTypeGenerateur
    )
  });
}

/**
 * Si la méthode de saisie n'est pas "Valeur forfaitaire" mais "caractéristiques saisies"
 * Documentation 3CL : "Pour les installations récentes ou recommandées, les caractéristiques réelles des chaudières présentées sur les bases
 * de données professionnelles peuvent être utilisées."
 *
 * 2 - caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, autres données forfaitaires
 * 3 - caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, rpn,rpint, autres données forfaitaires
 * 4 - caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, rpn,rpint,qp0, autres données forfaitaires
 * 5 - caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, rpn,rpint,qp0,temp_fonc_30,temp_fonc_100
 *
 * @param dpe {FullDpe}
 * @param di {Donnee_intermediaire} données du générateur
 * @param de {Donnee_entree} données du générateur
 * @param type {'ecs'|'ch'}
 * @param GV {number} déperdition de l'enveloppe
 * @param tbase {number} température de fonctionnement du générateur
 * @param methodeSaisie {number} méthode de saisie des caractéristiques du générateur
 * @param ratioSurface {number} part de la surface du logement desservie par le générateur
 * (Sh_installation / Sh), utilisée pour proratiser la puissance nominale estimée (§13.2.2.4)
 * @param optionsPn {{installationIndividuelle?: boolean, volumeStockage?: number}} données de
 * l'installation pour l'estimation de Pn par Pdim (§13.2.2.4, cf. pnEstimeeGenerateur)
 */
export function tv_generateur_combustion(
  dpe,
  di,
  de,
  type,
  GV,
  tbase,
  methodeSaisie,
  ratioSurface = 1,
  optionsPn = {}
) {
  const typeGenerateurKey = `enum_type_generateur_${type}_id`;
  let enumTypeGenerateurId = de[typeGenerateurKey];
  let row;
  let selectionLigne;

  /**
   * Certains DPE configurent mal les données du générateur ECS lorsque c'est un générateur mixte Chauffage + ECS
   * Confrontation du type de générateur ECS et CH et prise en compte des données du générateur de chauffage
   *
   * enum_usage_generateur_id = 3 - 'chauffage + ecs'
   */
  if (bug_for_bug_compat && type === 'ecs' && de.enum_usage_generateur_id === '3') {
    enumTypeGenerateurId = checkEcsVsChauffageForMixteGeneration(dpe, de, typeGenerateurKey);
  }

  /**
   * Système collectif par défaut : chaudière fioul standard datant de la construction du bâtiment.
   * Si tv_generateur_combustion_id pointe vers une chaudière fioul compatible avec le système par défaut,
   * la période de la chaudière est déterminée à partir de l'année de construction du bâtiment.
   * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - §17.2.1.1
   */
  if (
    ((type === 'ecs' && enumTypeGenerateurId === '84') ||
      (type === 'ch' && enumTypeGenerateurId === '119')) &&
    de.tv_generateur_combustion_id
  ) {
    const rowDpe = tv('generateur_combustion', {
      tv_generateur_combustion_id: de.tv_generateur_combustion_id
    });
    const chaudiereFioulDefautId = getChaudiereFioulDefautId(
      dpe,
      type,
      rowDpe?.[typeGenerateurKey]?.split('|')[0]
    );

    if (
      chaudiereFioulDefautId &&
      rowDpe?.[typeGenerateurKey]?.split('|').includes(enumTypeGenerateurId)
    ) {
      enumTypeGenerateurId = chaudiereFioulDefautId;
      de[typeGenerateurKey] = chaudiereFioulDefautId;
    }
  }

  /**
   * Si le type de générateur est
   * 84 - ECS - système collectif par défaut en abscence d'information : chaudière fioul pénalisante
   * 119 - CH - système collectif par défaut en abscence d'information : chaudière fioul pénalisante
   * On garde l'information à partir de tv_generateur_combustion_id.
   */
  if (
    bug_for_bug_compat &&
    ((type === 'ecs' && enumTypeGenerateurId === '84') ||
      (type === 'ch' && enumTypeGenerateurId === '119')) &&
    de.tv_generateur_combustion_id
  ) {
    row = tv('generateur_combustion', {
      tv_generateur_combustion_id: de.tv_generateur_combustion_id
    });
    console.warn(`
      Le générateur ${de.description} est caractérisé 'système collectif par défaut'. 
      Utilisation de tv_generateur_combustion_id pour récupération des informations techniques du générateur.
    `);
  } else {
    /**
     * DPE modifié (option isOriginal = false) : en valeurs forfaitaires, la puissance nominale des
     * données intermédiaires est celle retenue par le logiciel d'origine pour le générateur
     * d'origine. Elle n'est pas reprise et est réestimée par la méthode (§13.2.2.4). Une puissance
     * saisie (méthodes 2 à 5 : plaque signalétique ou documentation technique) est conservée.
     */
    if (!dpe_original && !METHODES_SAISIE_PN.includes(methodeSaisie)) {
      delete di.pn;
    }

    // Calcul de la puissance nominale si non définie
    if (!di.pn) {
      di.pn = pnEstimeeGenerateur(dpe, de, type, pnEstimee(GV, tbase, ratioSurface), optionsPn);
    }

    selectionLigne = (pn, ratio) => {
      let matcher = {};
      matcher[typeGenerateurKey] = enumTypeGenerateurId;
      matcher.critere_pn = criterePn(pn / (ratio * 1000), matcher);
      return tv('generateur_combustion', matcher);
    };

    row = selectionLigne(di.pn, de.ratio_virtualisation);

    /**
     * Si l'identifiant du générateur à combustion utilisé n'est pas le bon, avertissement
     */
    if (
      bug_for_bug_compat &&
      type === 'ecs' &&
      row &&
      row.tv_generateur_combustion_id !== de.tv_generateur_combustion_id
    ) {
      const rowDpe = tv('generateur_combustion', {
        tv_generateur_combustion_id: de.tv_generateur_combustion_id
      });

      // Si tv_generateur_combustion_id utilisé n'est pas
      if (
        rowDpe &&
        (!rowDpe.enum_type_generateur_ecs_id ||
          !rowDpe.enum_type_generateur_ecs_id.split('|').includes(de.enum_type_generateur_ecs_id))
      ) {
        console.error(`
          Le DPE utilise les caractéristiques liées à tv_generateur_combustion_id = '${de.tv_generateur_combustion_id}' qui ne correspond pas au 
          générateur ECS enum_type_generateur_ecs_id = '${de.enum_type_generateur_ecs_id}'. Les données utilisées par le DPE et les résultats
          qui en découlent sont probablement erronés.
        `);
      }
    }
  }

  if (!row) {
    console.error(
      `Pas de valeur forfaitaire trouvée pour le générateur à combustion ${de.description} (${typeGenerateurKey} = '${enumTypeGenerateurId}')`
    );
    return;
  }

  de.tv_generateur_combustion_id = Number(row.tv_generateur_combustion_id);

  /**
   * Les coefficients (E, F) dépendent de la présence d'un ventilateur ou autre dispositif de
   * circulation d'air dans le circuit de combustion, et non de la ventouse (qui n'intervient que
   * dans Cper). Le XML ne transporte pas cette donnée : elle est lue dans la fiche technique du
   * générateur. Sans fiche technique, la ventouse est conservée comme approximation (choix
   * Open3CL, la méthode ne prévoyant pas de valeur par défaut).
   * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.2
   * @see : Tribu Calcul_generateur.cs (ventilateur_combustion)
   */
  const indexEF = de.ventilateurCombustion ?? de.presence_ventouse;
  const E = E_tab[indexEF];
  const F = F_tab[indexEF];

  let ratioVirtualisation = de.ratio_virtualisation || 1;

  /**
   * Générateur collectif virtualisé : la puissance saisie dans le DPE peut être la puissance
   * virtualisée Pe = a × Pn (convention 3CL) ou la puissance du générateur collectif Pn selon les
   * logiciels (issue #124). La convention réellement utilisée est déduite des valeurs
   * intermédiaires (rpn, qp0) présentes dans le DPE.
   * Pas de détection sur un DPE modifié (option isOriginal = false) : les valeurs intermédiaires
   * du DPE d'origine ne décrivent plus forcément le générateur.
   */
  if (selectionLigne && dpe_original) {
    const ligneOuDefaut = (pn, ratio) => selectionLigne(pn, ratio) || row;
    const caracteristiques = (pn, ratio) =>
      caracteristiquesGenerateurCombustion(
        ligneOuDefaut(pn, ratio),
        pn,
        ratio,
        E,
        F,
        type,
        methodeSaisie
      );
    /**
     * Formule rpn de la ligne sélectionnée pour un Pn(collectif) donné (W) : permet de retrouver
     * Pn(collectif) à partir du rpn stocké (4e hypothèse).
     */
    const formuleRpn = (pnCollectif) => {
      const ligne = selectionLigne(pnCollectif, 1);
      return ligne?.rpn ? (p) => evaluateFormula(ligne.rpn, p, E, F) / 100 : undefined;
    };
    const puissance = conventionPuissanceNominale(
      di.pn,
      ratioVirtualisation,
      { rpn: di.rpn, rpint: di.rpint, qp0: di.qp0 },
      caracteristiques,
      bug_for_bug_compat,
      formuleRpn
    );

    if (puissance.convention === 'puissance_depuis_rpn') {
      console.warn(
        `La puissance nominale du générateur ${de.description} (${di.pn} W) n'est cohérente ni avec la puissance
        virtualisée ni avec celle du générateur collectif. Puissance du générateur collectif recalculée à partir
        du rpn du DPE (${di.rpn}) : Pn = ${puissance.pnCollectif / 1000} kW, utilisation de Pe = a × Pn = ${puissance.pn} W.`
      );
    } else if (puissance.convention !== 'individualisee') {
      console.warn(
        `La puissance nominale du générateur ${de.description} (${di.pn} W) est celle du générateur collectif : 
        utilisation de la puissance ${puissance.pn} W et du ratio de virtualisation ${puissance.ratio} (${puissance.convention}).`
      );
    }

    if (puissance.convention !== 'individualisee') {
      di.pn = puissance.pn;
      ratioVirtualisation = puissance.ratio;
      row = ligneOuDefaut(di.pn, ratioVirtualisation);
      de.tv_generateur_combustion_id = Number(row.tv_generateur_combustion_id);
    }
  }

  Object.assign(
    di,
    caracteristiquesGenerateurCombustion(row, di.pn, ratioVirtualisation, E, F, type, methodeSaisie)
  );

  if (methodeSaisie === 1 || !di.pveilleuse) {
    di.pveil = Number(row.pveil) || 0;
  } else {
    // La branche else n'est atteinte que si di.pveilleuse est vrai, donc le repli `|| 0` est mort.
    /* c8 ignore next */
    di.pveil = di.pveilleuse || 0;
  }
}

/**
 * Mise à jour du type de générateur si besoin
 * @param dpe {FullDpe}
 * @param de {Donnee_entree}
 * @param type {'ch' | 'ecs'}
 */
export function updateGenerateurCombustion(dpe, de, type) {
  updateGenerateurBouilleurs(dpe, de, type);
  updateGenerateurChaudieres(dpe, de, type);
  updateGenerateurPacs(dpe, de, type);
  addInfosFromFichesTechniques(dpe, de, type);
}

/**
 * Valeur de la sous-fiche « Présence d'une veilleuse » → 1 (oui), 0 (non) ou undefined (NC, autre).
 * Valeurs observées : « oui », « non », « Non », « NC », « Générateur sans veilleuse ».
 * @param valeur {string|number|undefined}
 * @returns {1 | 0 | undefined}
 */
export function valeurVeilleuse(valeur) {
  const v = (valeur ?? '').toString().trim().toLowerCase();
  if (v.startsWith('oui')) return 1;
  if (v.startsWith('non') || v.includes('sans veilleuse') || v.startsWith('absence')) return 0;
  return undefined;
}

/**
 * Présence d'une veilleuse sur un générateur à combustion, lue dans la sous-fiche technique
 * « Présence d'une veilleuse » (catégorie 7 pour le chauffage, 8 pour l'ECS) du générateur.
 *
 * Le modèle ADEME n'a pas de donnée d'entrée « veilleuse » : la fiche technique est la seule trace
 * de la saisie. Le moteur de référence (Tribu) prend cette information en entrée (`Is_veilleuse`,
 * DPE.DataClasses/generateur.cs) et annule Pveil en son absence
 * (DPE.Core/Calcul_generateur.cs, `Pveil1 = 0` si `Is_veilleuse != oui`).
 *
 * Une même fiche peut décrire plusieurs générateurs à la suite (ex. LICIEL : deux chaudières dans
 * la même fiche de catégorie 7). getFicheTechnique() renverrait alors la veilleuse du premier
 * générateur pour tous : la sous-fiche retenue est la première « veilleuse » qui suit la sous-fiche
 * dont la valeur contient la description du générateur, avant le générateur suivant. En cas de
 * réponses contradictoires (descriptions identiques) ou d'absence, la présence est non renseignée.
 *
 * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.4 / §14.1 (« Pveil : si veilleuse »)
 *
 * @param dpe {FullDpe}
 * @param de {Donnee_entree}
 * @param type {'ch' | 'ecs'}
 * @returns {1 | 0 | undefined} 1 si veilleuse, 0 si pas de veilleuse, undefined si non renseigné
 */
export function presenceVeilleuse(dpe, de, type) {
  const description = (de.description ?? '').toString().toLowerCase();
  if (!description) return undefined;

  const categorie = type === 'ecs' ? '8' : '7';
  const liste = (x) => (x === undefined || x === null ? [] : Array.isArray(x) ? x : [x]);
  const valeurs = new Set();

  for (const fiche of liste(dpe.fiche_technique_collection?.fiche_technique)) {
    if (fiche?.enum_categorie_fiche_technique_id !== categorie) continue;
    const sousFiches = liste(fiche.sous_fiche_technique_collection?.sous_fiche_technique);
    const valeurMinuscule = (i) => (sousFiches[i]?.valeur ?? '').toString().toLowerCase();

    for (let i = 0; i < sousFiches.length; i++) {
      if (!valeurMinuscule(i).includes(description)) continue;
      for (let j = i + 1; j < sousFiches.length; j++) {
        const libelle = (sousFiches[j]?.description ?? '').toString().toLowerCase();
        // début du générateur suivant
        if (
          valeurMinuscule(j).includes(description) ||
          /^type (de )?g[ée]n[ée]rateur/.test(libelle)
        ) {
          break;
        }
        if (libelle.includes('veilleuse')) {
          valeurs.add(valeurVeilleuse(sousFiches[j].valeur));
          break;
        }
      }
    }
  }

  return valeurs.size === 1 ? [...valeurs][0] : undefined;
}

/**
 * Récupération d'informations complémentaires issues des fiches techniques pour les générateurs
 *
 * @param dpe {FullDpe}
 * @param de {Donnee_entree}
 * @param type {'ch' | 'ecs'}
 */
function addInfosFromFichesTechniques(dpe, de, type) {
  /**
   * Sur un DPE modifié (option isOriginal = false), la fiche technique décrit le générateur
   * d'origine : la description d'un générateur remplacé peut avoir été conservée, la présence de
   * veilleuse n'y est donc pas lue (issue #39).
   */
  const veilleuse = dpe_original ? presenceVeilleuse(dpe, de, type) : undefined;
  if (veilleuse !== undefined) {
    de.presence_veilleuse = veilleuse;
  }

  // Récupération de la présence ou non d'un système de ventilation
  // Fiches techniques : catégorie 7 pour le chauffage, catégorie 8 pour l'ECS
  const ficheTechnique = getFicheTechnique(
    dpe,
    type === 'ch' ? '7' : '8',
    'Présence ventilateur / dispositif circulation air dans circuit combustion',
    [de.description]
  )?.valeur;

  if (ficheTechnique && ficheTechnique === 'oui') {
    de.presenceVentilateur = 1;
  }

  // Présence d'un ventilateur dans le circuit de combustion (choix des coefficients E, F de qp0)
  if (ficheTechnique === 'oui' || ficheTechnique === 'non') {
    de.ventilateurCombustion = ficheTechnique === 'oui' ? 1 : 0;
  }
}

/**
 * Vérifier que les informations du générateur ECS sont bien les mêmes que celles du générateur de chauffage
 * Dans le cas d'une génération mixte, le type du générateur doit être le même
 * @param dpe {FullDpe}
 * @param de {Donnee_entree}
 * @param typeGenerateurKey {string}
 * @returns {string}
 */
function checkEcsVsChauffageForMixteGeneration(dpe, de, typeGenerateurKey) {
  const ecsGenerateurId = de[typeGenerateurKey];

  /**
   * Si le générateur ECS est un générateur par défaut, pas d'information assez précise pour redresser la donnée
   *
   * 78 - autre système à combustion gaz
   * 79 - autre système à combustion fioul
   * 80 - autre système à combustion bois
   * 81 - autre système à combustion autres energies fossiles (charbon,pétrole etc…)
   * 82 - autre système thermodynamique électrique
   * 83 - autre système thermodynamique gaz
   */
  if (['78', '79', '80', '81', '82', '83'].includes(de[`previous_${typeGenerateurKey}`])) {
    return ecsGenerateurId;
  }

  /**
   * @type {InstallationChauffageItem[]}
   */
  const installationsCh = dpe.logement.installation_chauffage_collection.installation_chauffage;

  // Récupération des générateurs de chauffage ayant pour usage ECS + Chauffage également
  const generateursChMixtes = installationsCh.reduce((acc, ch) => {
    return acc.concat(
      ch.generateur_chauffage_collection.generateur_chauffage.filter(
        (value) => value.donnee_entree.enum_usage_generateur_id === '3'
      )
    );
  }, []);

  const chGenerateurMixte = findGenerateurChMixteJumeau(generateursChMixtes, de);

  if (chGenerateurMixte) {
    const chGenerateurMixteId = chGenerateurMixte.donnee_entree.enum_type_generateur_ch_id;
    const typeGenerateurEcs = enums.type_generateur_ecs;
    const typeGenerateurCh = enums.type_generateur_ch;

    const ecsGenerateurType = typeGenerateurEcs[ecsGenerateurId];
    const chGenerateurType = typeGenerateurCh[chGenerateurMixteId];

    // Si les 2 générateurs n'ont pas le même type
    if (ecsGenerateurType !== chGenerateurType) {
      // Recherche de l'identifiant du générateur ECS identique au générateur de chauffage
      const newEcsGenerateurId = Object.keys(typeGenerateurEcs).find(
        (key) => typeGenerateurEcs[key] === typeGenerateurCh[chGenerateurMixteId]
      );

      if (newEcsGenerateurId) {
        console.error(`
          Le générateur mixte ECS + CH identifié pour la génération ECS '${ecsGenerateurType}' n'est pas le même que celui identifié pour le générateur de chauffage '${chGenerateurType}'.
          On conserve le type de générateur de chauffage '${chGenerateurType}' pour la suite des calculs ECS.
        `);

        return newEcsGenerateurId;
      }
    }
  }

  return ecsGenerateurId;
}

/**
 * Recherche du générateur de chauffage mixte « jumeau » du générateur ECS mixte.
 * Méthode 3CL-DPE 2021 §13.2 et §14 : un générateur mixte chauffage + ECS est un seul et même
 * appareil, avec les mêmes caractéristiques pour les deux usages. Il ne faut donc pas apparier le
 * générateur ECS avec n'importe quel générateur de chauffage mixte du DPE (issue #210).
 *
 * Ordre de recherche :
 * 1. même `reference_generateur_mixte` ;
 * 2. même `tv_generateur_combustion_id` ;
 * 3. même énergie (`enum_type_energie_id`), si un seul générateur de chauffage mixte correspond ;
 * 4. générateur de chauffage mixte unique du DPE, si son énergie n'est pas incompatible.
 *
 * @param generateursChMixtes {GenerateurChauffageItem[]} générateurs de chauffage d'usage 'chauffage + ecs'
 * @param de {Donnee_entree} données du générateur ECS
 * @returns {GenerateurChauffageItem|null} null si aucun jumeau ne peut être identifié sans ambiguïté
 */
export function findGenerateurChMixteJumeau(generateursChMixtes, de) {
  const sameValue = (a, b) =>
    a !== undefined && a !== null && b !== undefined && b !== null && String(a) === String(b);

  if (de.reference_generateur_mixte) {
    const generateur = generateursChMixtes.find((ch) =>
      sameValue(ch.donnee_entree.reference_generateur_mixte, de.reference_generateur_mixte)
    );
    if (generateur) return generateur;
  }

  if (de.tv_generateur_combustion_id) {
    const generateur = generateursChMixtes.find((ch) =>
      sameValue(ch.donnee_entree.tv_generateur_combustion_id, de.tv_generateur_combustion_id)
    );
    if (generateur) return generateur;
  }

  if (de.enum_type_energie_id) {
    const generateurs = generateursChMixtes.filter((ch) =>
      sameValue(ch.donnee_entree.enum_type_energie_id, de.enum_type_energie_id)
    );
    if (generateurs.length === 1) return generateurs[0];
    // Plusieurs générateurs de même énergie et de même type : jumeaux identiques,
    // aucune ambiguïté sur le type à retenir pour l'ECS (cas 2275E1945671L)
    const type = generateurs[0]?.donnee_entree.enum_type_generateur_ch_id;
    if (
      generateurs.length > 1 &&
      generateurs.every((ch) => sameValue(ch.donnee_entree.enum_type_generateur_ch_id, type))
    ) {
      return generateurs[0];
    }
  }

  if (generateursChMixtes.length === 1) {
    const generateur = generateursChMixtes[0];
    const energieCh = generateur.donnee_entree.enum_type_energie_id;
    if (!de.enum_type_energie_id || !energieCh || sameValue(energieCh, de.enum_type_energie_id)) {
      return generateur;
    }
  }

  return null;
}
