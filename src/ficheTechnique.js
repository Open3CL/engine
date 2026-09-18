/**
 * Recherche dans les fiches techniques d'un DPE.
 *
 * L'implémentation précédente rebalayait la totalité des fiches à chaque appel, concaténait les
 * sous-fiches dans un `reduce` (`acc.concat(...)` recopie l'accumulateur à chaque itération) et
 * remettait en minuscules des valeurs qui ne changent jamais. Le coût par appel croissait en
 * `fiches^1,3`.
 *
 * Sur un DPE de logement individuel, une poignée de fiches : invisible. Sur un DPE collectif,
 * les fiches suivent les installations — un DPE mesuré comptait 235 fiches et 1597 sous-fiches
 * pour 73 générateurs — et la fonction représentait alors **54 % du temps de `calcul_3cl`**,
 * le ramasse-miettes des concaténations comptant pour 10 % de plus.
 *
 * Les fiches techniques ne sont jamais modifiées pendant un calcul : elles sont donc indexées
 * une fois par DPE, par catégorie, avec les minuscules pré-calculées. L'index est mémorisé dans
 * une `WeakMap` sur le DPE lui-même, donc libéré avec lui — rien à vider, aucune fuite possible
 * sur un process qui enchaîne les calculs.
 */

/** @type {WeakMap<object, Map<string, {sousFiches: any[], valeursMinuscules: (string|null)[], champsMinuscules: Map<string, (string|null)[]>}[]>>} */
const indexParDpe = new WeakMap();

/**
 * Regroupe les sous-fiches par catégorie, en conservant l'ordre du document — l'ordre détermine
 * quelle correspondance est retournée en premier.
 *
 * @param dpe {FullDpe}
 */
function indexerFichesTechniques(dpe) {
  const parCategorie = new Map();

  /** @type {FicheTechniqueItem[]} */
  let fichesTechniques = dpe.fiche_technique_collection?.fiche_technique || [];
  if (!Array.isArray(fichesTechniques)) {
    fichesTechniques = [fichesTechniques];
  }

  for (const ficheTechnique of fichesTechniques) {
    if (!ficheTechnique) continue;

    const categorie = ficheTechnique.enum_categorie_fiche_technique_id;
    let groupes = parCategorie.get(categorie);
    if (!groupes) {
      groupes = [];
      parCategorie.set(categorie, groupes);
    }

    const brut = ficheTechnique.sous_fiche_technique_collection?.sous_fiche_technique;
    const sousFiches = brut === undefined ? [] : Array.isArray(brut) ? brut : [brut];

    groupes.push({
      sousFiches,
      // `valeur` en minuscules, calculée une fois ; null quand ce n'est pas une chaîne, auquel
      // cas la comparaison se fait par identité stricte comme avant.
      valeursMinuscules: sousFiches.map((sousFiche) =>
        typeof sousFiche?.valeur === 'string' ? sousFiche.valeur.toLowerCase() : null
      ),
      // Les autres champs sont mis en minuscules à la demande : seuls `description` et `valeur`
      // sont interrogés en pratique, inutile de préparer le reste.
      champsMinuscules: new Map()
    });
  }

  return parCategorie;
}

/**
 * @param groupe {{sousFiches: any[], champsMinuscules: Map<string, (string|null)[]>}}
 * @param field {string}
 * @returns {(string|null)[]}
 */
function champEnMinuscules(groupe, field) {
  let valeurs = groupe.champsMinuscules.get(field);
  if (valeurs === undefined) {
    valeurs = groupe.sousFiches.map((sousFiche) =>
      sousFiche && sousFiche[field] ? sousFiche[field].toString().toLowerCase() : null
    );
    groupe.champsMinuscules.set(field, valeurs);
  }
  return valeurs;
}

/**
 * Retourne si elle existe la fiche technique contenant le texte description et
 * présente dans la catégorie de fiches techniques ayant pour catégorie categoryFicheTechiqueId
 * et contenant la valeur classification
 * @param dpe {FullDpe}
 * @param categoryFicheTechiqueId {string}
 * @param description {string}
 * @param classifications {[string]}
 * @param field {'description' | 'valeur'}
 */
export default function getFicheTechnique(
  dpe,
  categoryFicheTechiqueId,
  description,
  classifications = [],
  field = 'description'
) {
  let index = indexParDpe.get(dpe);
  if (index === undefined) {
    index = indexerFichesTechniques(dpe);
    indexParDpe.set(dpe, index);
  }

  const groupes = index.get(categoryFicheTechiqueId);
  if (!groupes) {
    return null;
  }

  classifications = classifications.filter((classification) => classification);
  const aiguilles = classifications.map((classification) =>
    classification.toString().toLowerCase()
  );
  const descriptionMinuscule = description.toLowerCase();

  for (const groupe of groupes) {
    /**
     * Plusieurs collections de fiches techniques peuvent exister pour la même catégorie (pour 2
     * systèmes ECS par exemple). Le champ classification permet de trouver la collection qui
     * convient en filtrant sur une seconde donnée.
     */
    if (classifications.length) {
      let toutesPresentes = true;

      for (let i = 0; i < classifications.length; i++) {
        const aiguille = aiguilles[i];
        let presente = false;

        for (let j = 0; j < groupe.sousFiches.length; j++) {
          const valeurMinuscule = groupe.valeursMinuscules[j];
          if (valeurMinuscule !== null) {
            if (valeurMinuscule.indexOf(aiguille) !== -1) {
              presente = true;
              break;
            }
          } else if (groupe.sousFiches[j].valeur === classifications[i]) {
            presente = true;
            break;
          }
        }

        if (!presente) {
          toutesPresentes = false;
          break;
        }
      }

      if (!toutesPresentes) continue;
    }

    // L'ancienne implémentation aplatissait toutes les catégories correspondantes avant de
    // filtrer : la première correspondance du tableau aplati est la première correspondance du
    // premier groupe qui en contient une. Parcourir les groupes dans l'ordre donne le même
    // résultat, sans construire le tableau intermédiaire.
    const champs = champEnMinuscules(groupe, field);
    for (let j = 0; j < groupe.sousFiches.length; j++) {
      const champ = champs[j];
      if (champ !== null && champ.indexOf(descriptionMinuscule) !== -1) {
        return groupe.sousFiches[j];
      }
    }
  }

  return null;
}
