/** @import { GenerateurChauffageDE, GenerateurChauffageDI } from './features/dpe/domain/models/installation-chauffage.model.js' */
/** @import { GenerateurEcsDE, GenerateurEcsDI } from './features/dpe/domain/models/installation-ecs.model.js' */
import { compat_for_corpus_analysis, requestInputID, tv } from './utils.js';

/**
 * Calcul ou récupération des paramètres scop ou cop
 * @param di {GenerateurChauffageDI|GenerateurEcsDI}
 * @param de {GenerateurChauffageDE|GenerateurEcsDE}
 * @param du {Object}
 * @param zc_id {string}
 * @param ed_id {string|null}
 * @param type {'ecs'|'ch'}
 */
export function scopOrCop(di, de, du, zc_id, ed_id, type) {
  /**
   * Si la méthode de saisie n'est pas "Valeur forfaitaire" mais "caractéristiques saisies"
   * Documentation 3CL : "Pour les installations récentes ou recommandées, les caractéristiques réelles présentées sur les bases
   * de données professionnelles peuvent être utilisées."
   *
   * 6 - caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système thermodynamique : scop/cop/eer
   */
  if (de.enum_methode_saisie_carac_sys_id === '6') {
    di.rg = di.scop || di.cop;
    di.rg_dep = di.scop || di.cop;
  } else {
    tv_scop(di, de, du, zc_id, ed_id, type);
  }
}

function tv_scop(di, de, du, zc_id, ed_id, type) {
  const matcher = {
    enum_zone_climatique_id: zc_id
  };
  matcher[`enum_type_generateur_${type}_id`] = requestInputID(de, du, `type_generateur_${type}`);
  if (ed_id) matcher.enum_type_emission_distribution_id = ed_id;
  const row = tv('scop', matcher);
  if (row) {
    const scop = row.scop_ou_cop;
    const valeurDpe = Number(di[scop]);
    di[scop] = Number(row.scop);

    /**
     * Certains logiciels (LICIEL, moteurs 3cl_tribu_2024.6.1.0 et BBS_Slama_2025.11.1.0) exportent
     * pour un CET sur air ambiant après 2014 (enum_type_generateur_ecs_id 3) le COP de la ligne
     * « air extrait » (2,8 en H1/H2, 2,9 en H3) au lieu de celui de la ligne « air extérieur ou
     * ambiant » (2,5 / 2,8), tout en exportant le tv_scop_id de cette dernière. Le moteur CSTB
     * (Tribu) retient bien 2,5 / 2,8 pour l'air ambiant : la table n'est pas modifiée.
     *
     * Avec l'option `compat_for_corpus_analysis` (analyse du corpus ADEME) uniquement, le COP
     * exporté par le DPE est repris pour l'ECS, afin de reproduire le calcul du logiciel. Par
     * défaut, la valeur de la table est utilisée.
     * @see Methode_de_calcul_3CL_DPE_2021-338.pdf - §14 (tableau des COP des CET)
     */
    if (compat_for_corpus_analysis && type === 'ecs' && valeurDpe > 0 && valeurDpe !== di[scop]) {
      console.error(
        `Le ${scop} exporté par le DPE (${valeurDpe}) diffère de celui de la table (${di[scop]}, tv_scop_id = ${row.tv_scop_id}). La valeur du DPE est conservée.`
      );
      di[scop] = valeurDpe;
    }

    if (de.tv_scop_id && de.tv_scop_id !== Number(row.tv_scop_id)) {
      console.error(`
        Le paramètre ${scop} utilisé par le DPE est erroné. 
        Utilisation de tv_scop_id = ${de.tv_scop_id} alors que devrait être utilisé tv_scop_id = ${row.tv_scop_id} (utilisé dans la suite du calcul) 
      `);
    }

    de.tv_scop_id = Number(row.tv_scop_id);

    // for Ich
    di.rg = di[scop];
    di.rg_dep = di[scop];
  } else {
    console.error('!! pas de valeur forfaitaire trouvée pour scop !!');
  }
}
