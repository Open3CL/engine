import getFicheTechnique from './ficheTechnique.js';

/**
 * Ids des chaudières fioul classiques / standard pour les différentes périodes d'installation
 * (seuil = première année de la période)
 */
const CHAUDIERES_FIOUL_ECS = {
  1948: '35',
  1970: '36',
  1976: '37',
  1981: '38',
  1991: '39',
  2015: '40'
};

const CHAUDIERES_FIOUL_CH = {
  1948: '75',
  1970: '76',
  1976: '77',
  1981: '78',
  1991: '79',
  2015: '80'
};

/**
 * Retourne l'identifiant associé au plus grand seuil inférieur ou égal à l'année donnée.
 * Pour une année antérieure au premier seuil, l'identifiant du premier seuil est retenu.
 * @param values {Record<string, string>}
 * @param annee {number}
 * @returns {string}
 */
export function findIdForAnnee(values, annee) {
  const entries = Object.entries(values).sort((a, b) => b[0] - a[0]);

  for (const [threshold, value] of entries) {
    if (annee >= Number(threshold)) {
      return value;
    }
  }

  return entries[entries.length - 1][1];
}

/**
 * Système collectif par défaut en absence d'information : chaudière fioul pénalisante
 * (enum_type_generateur_ch_id = 119 / enum_type_generateur_ecs_id = 84)
 *
 * "En présence d'une installation de production collective de chauffage et d'ECS, si aucune information n'est
 * communiquée sur les équipements collectifs, un calcul par défaut se fera avec une chaudière atmosphérique mixte
 * standard datant de la construction du bâtiment. L'énergie utilisée par le système sera du fioul."
 * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - §17.2.1.1
 *
 * Retourne l'identifiant de la chaudière fioul dont la période correspond à l'année de construction du bâtiment,
 * ou undefined si l'année de construction n'est pas connue.
 *
 * Si la ligne tv_generateur_combustion_id saisie correspond à une chaudière fioul dont la période est
 * postérieure ou égale à celle de la construction (chaudière remplacée), l'information est connue et
 * doit être utilisée : "Dans le cas où certaines de ces informations sont connues sur l'installation
 * collective, elles pourront être utilisées" (§17.2.1.1). Seule une période saisie antérieure à la
 * construction, non crédible, est redressée.
 *
 * @param dpe {FullDpe}
 * @param type {'ch' | 'ecs'}
 * @param typeSaisiId {string|undefined} type de chaudière correspondant à la ligne tv saisie
 * @returns {string|undefined}
 */
export function getChaudiereFioulDefautId(dpe, type, typeSaisiId) {
  const anneeConstruction = parseInt(
    dpe?.logement?.caracteristique_generale?.annee_construction,
    10
  );

  if (Number.isNaN(anneeConstruction)) {
    return undefined;
  }

  const chaudieres = type === 'ecs' ? CHAUDIERES_FIOUL_ECS : CHAUDIERES_FIOUL_CH;
  const chaudiereConstructionId = findIdForAnnee(chaudieres, anneeConstruction);
  const ids = Object.values(chaudieres);

  if (
    ids.includes(typeSaisiId) &&
    ids.indexOf(typeSaisiId) >= ids.indexOf(chaudiereConstructionId)
  ) {
    return typeSaisiId;
  }

  return chaudiereConstructionId;
}

/**
 * Pour les générateurs "Autre système à combustion", les calculs sont faits comme pour les chaudières standard
 * @param dpe {FullDpe}
 * @param de {Donnee_entree}
 * @param type {'ch' | 'ecs'}
 */
export function updateGenerateurChaudieres(dpe, de, type) {
  /**
   * enum_type_generateur_ecs_id
   * 78 - autre système à combustion gaz
   * 79 - autre système à combustion fioul
   * 80 - autre système à combustion bois
   * 81 - autre système à combustion autres energies fossiles (charbon,pétrole etc…)
   */
  let ids;

  if (type === 'ecs') {
    // Ids des chaudières bois équivalentes pour les différentes périodes d'installation
    ids = {
      78: {
        1948: '45',
        1981: '46',
        1986: '47',
        1991: '48',
        2001: '49',
        2015: '50'
      },
      79: CHAUDIERES_FIOUL_ECS,
      80: {
        1948: '15',
        1978: '16',
        1995: '17',
        2004: '18',
        2013: '19',
        2018: '20',
        2019: '21'
      },
      81: CHAUDIERES_FIOUL_ECS
    };
  } else {
    /**
     * enum_type_generateur_ch_id
     * 113 - autre système à combustion gaz
     * 114 - autre système à combustion fioul
     * 115 - autre système à combustion bois
     * 116 - autre système à combustion autres energies fossiles (charbon,pétrole etc…)
     */
    // Ids des chaudières bois équivalentes pour les différentes périodes d'installation
    ids = {
      113: {
        1948: '85',
        1981: '86',
        1986: '87',
        1991: '88',
        2001: '89',
        2015: '90'
      },
      114: CHAUDIERES_FIOUL_CH,
      115: {
        1948: '55',
        1978: '56',
        1995: '57',
        2004: '58',
        2013: '59',
        2018: '60',
        2019: '61'
      },
      116: CHAUDIERES_FIOUL_CH
    };
  }

  updateGenerateurChaudiere(dpe, ids, de, type);
}

/**
 * Récupération du générateur équivalent à utiliser à la place du générateur décrit
 * La période du générateur équivalent est choisie par rapport à la date d'installation du générateur décrit
 * Ex:
 *  - Pour un système 'autre système à combustion fioul' granulés installé en 2000, on prendra la chaudière gaz standard 2001-2015
 * @param dpe {FullDpe}
 * @param ids
 * @param de {Donnee_entree}
 * @param type {'ch' | 'ecs'}
 */
function updateGenerateurChaudiere(dpe, ids, de, type) {
  const enumType = `enum_type_generateur_${type}_id`;
  let generateurId = de[enumType];

  const steps = Object.keys(ids);

  if (steps.includes(generateurId)) {
    const values = ids[generateurId];
    de[`previous_${enumType}`] = generateurId;

    // Récupération de l'année d'installation du système ECS ou Chauffage dans les fiches techniques
    const ficheTechnique = getFicheTechnique(dpe, type === 'ch' ? '7' : '8', 'année', [
      'Autre système à combustion'
    ])?.valeur;

    if (ficheTechnique) {
      if (ficheTechnique.toString().toLowerCase() === 'avant 1948') {
        generateurId = values[1948];
      } else {
        const installationDate = parseInt(ficheTechnique, 10);

        const entries = Object.entries(values)
          .map(([key, value]) => [key, value])
          .sort((a, b) => b[0] - a[0]);

        for (const [threshold, value] of entries) {
          if (installationDate >= threshold) {
            generateurId = value;
            break;
          }
        }
      }
    }

    de[enumType] = generateurId;
  }
}
