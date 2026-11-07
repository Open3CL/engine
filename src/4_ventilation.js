import {
  tv,
  requestInputID,
  requestInput,
  bug_for_bug_compat,
  compat_for_corpus_analysis
} from './utils.js';
import calc_pvent from './5_conso_ventilation.js';

function tv_debits_ventilation(di, de, du) {
  const matcher = {
    enum_type_ventilation_id: requestInputID(de, du, 'type_ventilation')
  };

  const row = tv('debits_ventilation', matcher);
  if (row) {
    di.qvarep_conv = Number(row.qvarep_conv);
    di.qvasouf_conv = Number(row.qvasouf_conv);
    di.smea_conv = Number(row.smea_conv);
    de.tv_debits_ventilation_id = Number(row.tv_debits_ventilation_id);
  } else {
    console.error('!! pas de valeur forfaitaire trouvée pour debits_ventilation !!');
  }
}

/**
 * Vrai si la ligne de la table `q4pa_conv` couvre la période de construction du DPE.
 */
export function isLigneQ4paMemePeriode(rowQ4paConv, cg) {
  return String(rowQ4paConv?.enum_periode_construction_id ?? '')
    .split('|')
    .includes(String(cg.enum_periode_construction_id));
}

/**
 * Vrai si la ligne `q4pa_conv` du DPE ne s'écarte des valeurs recalculées que dans le sens
 * « surfaces isolées » et/ou « avec joints » : chaque critère porté par la ligne est supérieur ou
 * égal à la valeur recalculée, et au moins un est strictement supérieur. Un critère absent de la
 * ligne (ex. joints sur les lignes « surfaces isolées ») n'est pas comparé.
 */
export function isLigneQ4paPlusFavorable(rowQ4paConv, isolationSurfaces, presenceJoints) {
  let plusFavorable = false;
  for (const [valeurLigne, valeurRecalculee] of [
    [rowQ4paConv.isolation_surfaces, isolationSurfaces],
    [rowQ4paConv.presence_joints_menuiserie, presenceJoints]
  ]) {
    if ([undefined, null, ''].includes(valeurLigne)) continue;
    if (String(valeurLigne) < String(valeurRecalculee)) return false;
    if (String(valeurLigne) > String(valeurRecalculee)) plusFavorable = true;
  }
  return plusFavorable;
}

function tv_q4pa_conv(di, de, cg, mur_list, ph_list, porte_list, bv_list) {
  const surfaces = mur_list.concat(ph_list);
  const surface_isolee = surfaces.reduce((acc, s) => {
    if (s.donnee_intermediaire.b === 0) return acc;

    const typeIsolation = parseInt(s.donnee_entree.enum_type_isolation_id);

    // Si le type isolation est inconnu mais avec que la période d'isolation est connue et > 1974 alors on considère la surface isolée
    if (typeIsolation === 1 && parseInt(s.donnee_entree.enum_periode_isolation_id) >= 3) {
      return acc + s.donnee_entree.surface_paroi_opaque;
    }

    // Si type d'isolation "1 - inconnu" ou "2 - non isolé"
    if ([1, 2].includes(typeIsolation)) return acc;
    else return acc + s.donnee_entree.surface_paroi_opaque;
  }, 0);
  const surface_non_isolee = surfaces.reduce((acc, s) => {
    if (s.donnee_intermediaire.b === 0) return acc;

    const typeIsolation = parseInt(s.donnee_entree.enum_type_isolation_id);

    // Si le type isolation est inconnu mais avec que la période d'isolation est connue et > 1974 alors on considère la surface isolée
    if (typeIsolation === 1 && parseInt(s.donnee_entree.enum_periode_isolation_id) >= 3) {
      return acc;
    }

    // Si type d'isolation "1 - inconnu" ou "2 - non isolé"
    if ([1, 2].includes(typeIsolation)) {
      return acc + s.donnee_entree.surface_paroi_opaque;
    } else return acc;
  }, 0);
  let isolation_surfaces = surface_isolee > surface_non_isolee ? '1' : '0';

  // presence joints menuiserie
  let surface_bv_avec_joint = bv_list.reduce((acc, bv) => {
    if (bv.donnee_entree.presence_joint) return acc + bv.donnee_entree.surface_totale_baie;
    else return acc;
  }, 0);
  surface_bv_avec_joint += porte_list.reduce((acc, porte) => {
    if (porte.donnee_entree.presence_joint) return acc + porte.donnee_entree.surface_porte;
    else return acc;
  }, 0);
  let surface_bv_sans_joint = bv_list.reduce((acc, bv) => {
    if (!bv.donnee_entree.presence_joint) return acc + bv.donnee_entree.surface_totale_baie;
    else return acc;
  }, 0);
  surface_bv_sans_joint += porte_list.reduce((acc, porte) => {
    if (!porte.donnee_entree.presence_joint) return acc + porte.donnee_entree.surface_porte;
    else return acc;
  }, 0);
  const ratioSurfaceJoint = surface_bv_avec_joint / (surface_bv_avec_joint + surface_bv_sans_joint);
  let pjt = ratioSurfaceJoint > 0.5 ? '1' : '0';
  if (bug_for_bug_compat) {
    pjt = ratioSurfaceJoint >= 0.5 ? '1' : '0';
  }

  if (bug_for_bug_compat && de.tv_q4pa_conv_id) {
    const rowQ4paConv = tv('q4pa_conv', {
      tv_q4pa_conv_id: de.tv_q4pa_conv_id
    });

    if (rowQ4paConv) {
      /**
       * Le moteur de référence reçoit Q4Pa_conv en entrée : c'est le logiciel de saisie qui choisit
       * la ligne de la table. Certains logiciels retiennent une ligne qui contredit les parois ou
       * les menuiseries déclarées (ex. ligne 10 « avant 1948, surfaces isolées » alors que les
       * parois sont non isolées (#312), ligne 12 « avant 1948, avec joints » alors que les
       * menuiseries sont sans joint (#332) ou n'exportent pas `presence_joint` (#294)).
       *
       * Avec l'option `compat_for_corpus_analysis` (analyse du corpus ADEME) uniquement, une seule
       * règle : si la ligne du DPE couvre la période de construction et qu'elle ne s'écarte du
       * recalcul que dans le sens « surfaces isolées » / « avec joints », elle est reprise en
       * entier, pour reproduire le calcul du logiciel.
       *
       * Sinon (mode par défaut, ligne d'une autre période ou écart dans le sens inverse, cas d'un
       * scénario de travaux qui améliore les parois ou les menuiseries) : q4pa_conv est recalculé
       * selon la méthode et les écarts sont seulement signalés.
       * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - §4
       */
      if (
        compat_for_corpus_analysis &&
        isLigneQ4paMemePeriode(rowQ4paConv, cg) &&
        isLigneQ4paPlusFavorable(rowQ4paConv, isolation_surfaces, pjt)
      ) {
        console.error(
          `Calcul de hperm pour la ventilation ${de.description}. La ligne q4pa_conv ${de.tv_q4pa_conv_id} du DPE (isolation_surfaces = ${rowQ4paConv.isolation_surfaces}, presence_joints_menuiserie = ${rowQ4paConv.presence_joints_menuiserie}) 
          contredit les valeurs recalculées (isolation_surfaces = ${isolation_surfaces}, presence_joints_menuiserie = ${pjt}). La ligne du DPE est conservée.`
        );
        isolation_surfaces = rowQ4paConv.isolation_surfaces === '1' ? '1' : '0';
        pjt = rowQ4paConv.presence_joints_menuiserie === '1' ? '1' : '0';
      } else {
        if (rowQ4paConv.isolation_surfaces !== isolation_surfaces) {
          console.error(
            `Calcul de hperm pour la ventilation ${de.description}. Le DPE considère isolation_surfaces = ${rowQ4paConv.isolation_surfaces} \n          alors que ce devrait être isolation_surfaces = ${isolation_surfaces}. La valeur recalculée isolation_surfaces = ${isolation_surfaces} est utilisée.`
          );
        }
        if (rowQ4paConv.presence_joints_menuiserie !== pjt) {
          console.error(
            `Calcul de hperm pour la ventilation ${de.description}. Le DPE considère presence_joints_menuiserie = ${rowQ4paConv.presence_joints_menuiserie} 
          alors que ce devrait être presence_joints_menuiserie = ${pjt}. La valeur recalculée presence_joints_menuiserie = ${pjt} est utilisée.`
          );
        }
      }
    }
  }

  const matcher = {
    enum_periode_construction_id: cg.enum_periode_construction_id,
    enum_methode_application_dpe_log_id: cg.enum_methode_application_dpe_log_id,
    isolation_surfaces,
    presence_joints_menuiserie: pjt
  };
  const row = tv('q4pa_conv', matcher);
  if (row) {
    di.q4pa_conv = Number(row.q4pa_conv);
    de.tv_q4pa_conv_id = Number(row.tv_q4pa_conv_id);
  } else {
    console.error('!! pas de valeur forfaitaire trouvée pour q4pa_conv !!');
  }
}

const e_tab = {
  1: 0.07,
  0: 0.02
};

const f_tab = {
  1: 15,
  0: 20
};

export function calc_hperm(di, surface_ventile, Hsp, Sdep, pfe) {
  const e = e_tab[pfe];
  const f = f_tab[pfe];
  const Q4pa_env = di.q4pa_conv * Sdep;
  const Q4pa = Q4pa_env + 0.45 * di.smea_conv * surface_ventile;
  const n50 = Q4pa / ((4 / 50) ** (2 / 3) * Hsp * surface_ventile);
  const Qvinf =
    (Hsp * surface_ventile * n50 * e) /
    (1 + (f / e) * ((di.qvasouf_conv - di.qvarep_conv) / (Hsp * n50)) ** 2);
  di.hperm = 0.34 * Qvinf;
}

export default function calc_ventilation(
  vt,
  cg,
  th,
  Sdep,
  Sh,
  mur_list,
  ph_list,
  porte_list,
  bv_list
) {
  const de = vt.donnee_entree;
  const du = {};
  const di = {};

  let surface_ventile = requestInput(de, du, 'surface_ventile', 'float');

  if (!surface_ventile) {
    surface_ventile = Sh;
  } else if (surface_ventile !== Sh) {
    // S'il y a une répartition alors c'est que la vmc est collective. La surface à prendre en compte est la surface de l'immeuble
    surface_ventile /= de.cle_repartition_ventilation || 1;
  }

  const Hsp = cg.hsp;

  tv_debits_ventilation(di, de, du);

  // Pour les bâtiments qui ont fait l’objet d’une mesure d’étanchéité à l’air moins de deux ans avant le diagnostic, la valeur
  // mesurée de Q4Paconv/m² peut être saisie.
  if (de.q4pa_conv_saisi) {
    di.q4pa_conv = de.q4pa_conv_saisi;
  } else {
    tv_q4pa_conv(di, de, cg, mur_list, ph_list, porte_list, bv_list);
  }

  di.hvent = 0.34 * di.qvarep_conv * surface_ventile;

  let pfe = requestInput(de, du, 'plusieurs_facade_exposee', 'bool');

  /**
   * Si une fiche technique pour cette variable est présente, elle est prise en compte
   * Les valeurs de plusieurs_facade_exposee n'étant pas toujours utilisées de la même manière
   * dans tous les DPEs (parfois 0 = 'Oui', d'autres 0 = 'Non')
   */
  if (de.ficheTechniqueFacadesExposees) {
    const pfeFicheTechnique = ['non', 'une'].includes(
      de.ficheTechniqueFacadesExposees.valeur.toLowerCase()
    )
      ? 0
      : 1;

    if (pfeFicheTechnique !== pfe) {
      console.error(
        `La valeur de la variable plusieurs_facade_exposee ne correspond pas à celle présente 
        dans la fiche technique "${de.ficheTechniqueFacadesExposees.description}". 
        La valeur de la fiche technique est prise en compte.`
      );
    }

    pfe = pfeFicheTechnique;
  }

  /**
   * Si une fiche technique pour cette variable est présente, elle est prise en compte
   * Les valeurs de ventilation_post_2012 n'étant pas toujours utilisées de la même manière
   * dans tous les DPEs (parfois 0 = 'Oui', d'autres 0 = 'Non')
   */
  if (de.ficheTechniqueVentilationPost2012 && de.ventilation_post_2012 === 0) {
    console.error(
      `La valeur de la variable ventilation_post_2012 ne correspond pas à celle présente 
      dans la fiche technique "${de.ficheTechniqueVentilationPost2012.description}". 
      La valeur de la fiche technique est prise en compte.`
    );

    de.ventilation_post_2012 = 1;
  }

  calc_hperm(di, surface_ventile, Hsp, Sdep, pfe);
  calc_pvent(di, de, du, th);

  delete di.qvarep_conv;
  delete di.qvasouf_conv;
  delete di.smea_conv;

  vt.donnee_intermediaire = di;
  vt.donnee_utilisateur = du;
}
