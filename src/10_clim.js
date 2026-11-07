import { requestInputID, tv } from './utils.js';

function tv_seer(di, de, du, zc_id) {
  const matcher = {
    enum_zone_climatique_id: zc_id,
    enum_periode_installation_fr_id: requestInputID(de, du, 'periode_installation_fr')
  };
  const row = tv('seer', matcher);
  if (row) {
    de.tv_seer_id = Number(row.tv_seer_id);
    di.eer = row.eer;
  } else {
    console.error('!! pas de valeur forfaitaire trouvée pour seer !!');
  }
}

/**
 * @param clim {object} climatisation
 * @param bfr {number} besoin de froid du bâtiment
 * @param bfr_dep {number} besoin de froid dépensier du bâtiment
 * @param zc_id {string} zone climatique
 * @param Sh {number} surface de référence du calcul (SH immeuble pour un DPE généré depuis l'immeuble)
 * @param prorataLogement {number} part du logement dans la consommation de froid de l'installation
 * (Sh_logement / SH_immeuble pour un DPE appartement généré à partir de l'immeuble, 1 sinon). Les
 * données intermédiaires restent à l'échelle de l'installation, comme dans le DPE de référence ;
 * le prorata n'est appliqué qu'à l'agrégation des consommations du logement (conso.js).
 * @see https://github.com/Open3CL/engine/issues/303
 */
export default function calc_clim(clim, bfr, bfr_dep, zc_id, Sh, prorataLogement = 1) {
  const de = clim.donnee_entree;
  const di = clim.donnee_intermediaire || {};
  const du = { prorata_logement: prorataLogement };

  const rs = de.surface_clim / Sh;
  di.besoin_fr = bfr * rs;
  di.besoin_fr_depensier = bfr_dep * rs;

  /**
   * Si la méthode de saisie n'est pas "Valeur forfaitaire" mais "caractéristiques saisies"
   * Documentation 3CL : "Pour les installations récentes ou recommandées, les caractéristiques réelles des chaudières présentées sur les bases
   * de données professionnelles peuvent être utilisées."
   *
   * 6 - caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système thermodynamique : scop/cop/eer
   * 7 - déterminé à partir du rset/rsee( etude rt2012/re2020)
   * 8 - seer saisi pour permettre la saisie de réseau de froid ou de système de climatisations qui ne sont pas éléctriques
   */
  const methodeSaisie = parseInt(de.enum_methode_saisie_carac_sys_id);
  if (![6, 7, 8].includes(methodeSaisie) || !di.eer) {
    tv_seer(di, de, du, zc_id);
  }

  di.conso_fr = (0.9 * di.besoin_fr) / di.eer;
  di.conso_fr_depensier = (0.9 * di.besoin_fr_depensier) / di.eer;

  clim.donnee_intermediaire = di;
  clim.donnee_utilisateur = du;
}
