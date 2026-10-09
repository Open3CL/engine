import { requestInput, Tbase, tv, tvColumnIDs } from './utils.js';
import { calc_emetteur_ch } from './9_emetteur_ch.js';
import {
  calc_generateur_ch,
  checkForGeneratorType,
  hasConsoForAuxDistribution
} from './9_generateur_ch.js';
import { tv_generateur_combustion } from './13.2_generateur_combustion.js';
import { tv_temp_fonc_30_100 } from './13.2_generateur_combustion_ch.js';
import enums from './enums.js';

/**
 * @param dpe {FullDpe}
 */
/**
 * DPE immeuble (même règle que calc_th du moteur : « appartement » ou « maison » priment).
 * @param map_id {string|number} enum_methode_application_dpe_log_id
 * @return {boolean}
 */
export function isImmeuble(map_id) {
  const map = enums.methode_application_dpe_log?.[map_id] || '';
  return map.includes('immeuble') && !map.includes('appartement') && !map.includes('maison');
}

export default function calc_chauffage(
  dpe,
  ch,
  ca_id,
  zc_id,
  inertie_id,
  map_id,
  bch,
  bch_dep,
  GV,
  Sh,
  hsp,
  ac,
  ilpa,
  besoin_ch_mois
) {
  const de = ch.donnee_entree;
  const di = {};
  const du = {};

  const ca = enums.classe_altitude[ca_id];
  const zc = enums.zone_climatique[zc_id];
  const tbase = Tbase[ca][zc.slice(0, 2)];

  di.besoin_ch = bch;
  di.besoin_ch_depensier = bch_dep;

  const em_ch = ch.emetteur_chauffage_collection.emetteur_chauffage;
  em_ch.forEach((em_ch) => {
    calc_emetteur_ch(em_ch, de, map_id, inertie_id);
  });

  if (de.surface_chauffee !== Sh) {
    bch *= de.surface_chauffee / Sh;
  }

  const Fch = tv_ch_facteur_couverture_solaire(de, zc_id);
  const cfg_id = requestInput(de, du, 'cfg_installation_ch');
  const gen_ch = ch.generateur_chauffage_collection.generateur_chauffage;

  gen_ch.forEach((gen) => {
    const genChDe = gen.donnee_entree;
    const genChDu = gen.donnee_utilisateur || {};
    const genChDi = gen.donnee_intermediaire || {};

    genChDe.ratio_virtualisation = de.ratio_virtualisation || 1;
    genChDe.cle_repartition_ch = de.cle_repartition_ch || 1;
    genChDe.enum_type_installation_id = de.enum_type_installation_id;
    genChDe.surface_chauffee = de.surface_chauffee || Sh;
    genChDe.rdim_installation_ch = isImmeuble(map_id) ? Number(de.rdim) || 1 : 1;
    genChDe.nombre_niveau_installation_ch = de.nombre_niveau_installation_ch || 1;
    genChDe.fch = Fch || 0.5;

    // Récupération du type de générateur
    checkForGeneratorType(dpe, genChDe, genChDi, genChDu);

    if (genChDu.isCombustionGenerator) {
      const methodeSaisie = parseInt(genChDe.enum_methode_saisie_carac_sys_id);
      tv_generateur_combustion(dpe, genChDi, genChDe, 'ch', GV, tbase, methodeSaisie);

      const type_gen_ch_list = tvColumnIDs('temp_fonc_30', 'type_generateur_ch');
      if (type_gen_ch_list.includes(genChDe.enum_type_generateur_ch_id)) {
        /**
         * Si la méthode de saisie n'est pas "Valeur forfaitaire" mais "caractéristiques saisies"
         * Documentation 3CL : "Pour les installations récentes ou recommandées, les caractéristiques réelles des chaudières présentées sur les bases
         * de données professionnelles peuvent être utilisées."
         *
         * 5 - caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, rpn,rpint,qp0,temp_fonc_30,temp_fonc_100
         */
        if (methodeSaisie !== 5 || !genChDi.temp_fonc_30 || !genChDi.temp_fonc_100) {
          tv_temp_fonc_30_100(genChDi, genChDe, genChDu, em_ch, ac);
        }
      }
    }

    gen.donnee_intermediaire = genChDi;
    gen.donnee_utilisateur = genChDu;
    gen.donnee_entree = genChDe;
  });

  /**
   * 13.2.1.3 Cascade de deux générateurs à combustion
   * Une puissance relative pour chaque générateur est calculée et appliquée à la conso globale de chauffage
   * Seuls les générateurs en cascade sont concernés
   *
   * 9.1.4.3 Les pompes à chaleur hybrides
   * Cas particulier des PAC hybrides avec répartition forfaitaire du besoin
   * @type {number|number}
   */
  const nbCascadeAndCombustion = gen_ch.filter(
    (value) =>
      value.donnee_utilisateur.isCombustionGenerator &&
      Number.parseInt(de.enum_cfg_installation_ch_id) === 1
  ).length;

  // Cascade avec priorité : seuls les générateurs principaux assurent le besoin (et dimensionnent
  // le taux de charge) ; les générateurs secondaires (relève) ont un besoin nul.
  const principaux = nbCascadeAndCombustion > 1 ? generateursPrincipauxCascade(gen_ch) : gen_ch;
  const Pnominal = principaux.reduce((acc, gen) => acc + (gen.donnee_intermediaire.pn || 0), 0);
  du.Pnominal = Pnominal;

  // Nombre de générateurs avec une consommation des auxiliaires de distribution
  const nbGenWithAuxConsoDistribution = gen_ch.reduce((acc, gen) => {
    if (hasConsoForAuxDistribution(gen.donnee_entree.enum_type_generateur_ch_id)) {
      acc++;
    }
    return acc;
  }, 0);

  gen_ch.forEach((gen, _pos) => {
    // Nombre de générateurs en cascade pour un même émetteur si l'installation est une installation simple
    const nbEmetteur = em_ch.filter(
      (em) =>
        em.donnee_entree.enum_lien_generateur_emetteur_id ===
        gen.donnee_entree.enum_lien_generateur_emetteur_id
    ).length;
    const nbCascadeForSameEmetteur =
      Number.parseInt(de.enum_cfg_installation_ch_id) === 1 && nbEmetteur === 1
        ? gen_ch.filter(
            (gen_ch) =>
              gen_ch.donnee_entree.enum_lien_generateur_emetteur_id ===
              gen.donnee_entree.enum_lien_generateur_emetteur_id
          ).length
        : 0;

    const prorataGenerateur = getProrataGenerateur(
      gen,
      nbCascadeAndCombustion,
      nbCascadeForSameEmetteur,
      Pnominal,
      zc,
      principaux.includes(gen)
    );
    /* c8 ignore next 2 -- repli défensif inatteignable : donnee_utilisateur est toujours renseignée
       par la première boucle sur gen_ch ci-dessus */
    (gen.donnee_utilisateur = gen.donnee_utilisateur || {}).nbGenerateurCascade =
      reseauCirculateurUnique(de.enum_cfg_installation_ch_id) ? 1 : gen_ch.length;

    calc_generateur_ch(
      dpe,
      gen,
      _pos,
      em_ch,
      cfg_id,
      bch * prorataGenerateur,
      bch_dep * prorataGenerateur,
      GV,
      Sh,
      hsp,
      ca_id,
      zc_id,
      ilpa,
      tbase,
      besoin_ch_mois,
      ch.donnee_entree.surface_chauffee,
      gen_ch
    );

    // Si plusieurs générateurs de chauffage, la consommation des auxiliaires est répartie sur chacun d'eux
    if (
      gen.donnee_intermediaire.conso_auxiliaire_distribution_ch &&
      nbGenWithAuxConsoDistribution > 0
    ) {
      gen.donnee_intermediaire.conso_auxiliaire_distribution_ch /= nbGenWithAuxConsoDistribution;
    }
  });

  di.conso_ch = gen_ch.reduce((acc, gen_ch) => acc + gen_ch.donnee_intermediaire.conso_ch, 0);
  di.conso_ch_depensier = gen_ch.reduce(
    (acc, gen_ch) => acc + gen_ch.donnee_intermediaire.conso_ch_depensier,
    0
  );

  ch.donnee_intermediaire = di;
  ch.donnee_utilisateur = du;
}

/**
 * 13.2.1.3 Cascade de deux générateurs à combustion avec priorité
 *
 * `priorite_generateur_cascade` (modèle DPE ADEME) : 1 = générateur principal, 2 = secondaire…
 * « Dans le cas de deux générateurs en cascade sans priorité, les deux générateurs sont déclarés
 * comme principal. » Les générateurs principaux sont ceux de plus petite priorité ; si aucune
 * priorité n'est renseignée, ou si toutes sont identiques, tous les générateurs sont principaux
 * (cascade sans priorité : prorata des puissances nominales).
 *
 * Comme le moteur de référence CSTB (Tribu, autotests État APP5-0-4/41/43), le générateur
 * prioritaire assure la totalité du besoin et son taux de charge est calculé avec sa seule Pn.
 *
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.1.3
 * @param gen_ch {GenerateurChauffageItem[]}
 * @return {GenerateurChauffageItem[]} générateurs principaux
 */
export function generateursPrincipauxCascade(gen_ch) {
  const priorites = gen_ch.map((gen) => Number(gen.donnee_entree.priorite_generateur_cascade));
  if (priorites.some((p) => !(p > 0))) return gen_ch;
  const prioriteMin = Math.min(...priorites);
  return gen_ch.filter((_gen, i) => priorites[i] === prioriteMin);
}

/**
 * 13.2.1.3 Cascade de deux générateurs à combustion
 * Une puissance relative pour chaque générateur est calculée et appliquée à la conso globale de chauffage
 * Seuls les générateurs en cascade sont concernés
 *
 * 9.1.4.3 Les pompes à chaleur hybrides
 * Cas particulier des PAC hybrides avec répartition forfaitaire du besoin
 * @type {number|number}
 */
/**
 * 15.2.1 Le circulateur est dimensionné pour tout le besoin du réseau (ratio du besoin couvert = 1)
 * lorsque les générateurs alimentent le même réseau hydraulique : installation simple (cfg 1),
 * relève d'une chaudière bois (cfg 6), chaudière en relève de PAC (cfg 8), base + appoint
 * collectif (cfg 10). Le circulateur unique n'est pas divisé par le nombre de générateurs.
 * Autotests CSTB IC4-0-1 (cfg 6, Tribu Caux_dist_ch = 8908,24 kWh), IC5-0-1 (cfg 8, 1777,76 kWh),
 * IC5-0-3 (cfg 10, 1951,90 kWh).
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §15.2.1
 * @param cfgInstallationId {string|number} enum_cfg_installation_ch_id
 * @return {boolean}
 */
export function reseauCirculateurUnique(cfgInstallationId) {
  return [1, 6, 8, 10].includes(Number.parseInt(cfgInstallationId));
}

function getProrataGenerateur(
  genCh,
  nbCascadeAndCombustion,
  nbGenerateurCascade,
  Pnominal,
  zc,
  estPrincipal
) {
  // IDs des pompes à chaleur hybrides
  if (
    genCh.donnee_entree.enum_type_generateur_ch_id >= 145 &&
    genCh.donnee_entree.enum_type_generateur_ch_id <= 170
  ) {
    const zone = zc.slice(0, 2);
    const hybrideProrata = {
      h1: {
        pac: 0.8,
        chaudiere: 0.2
      },
      h2: {
        pac: 0.83,
        chaudiere: 0.17
      },
      h3: {
        pac: 0.88,
        chaudiere: 0.12
      }
    };

    // Partie PAC du générateur
    if (genCh.donnee_intermediaire.scop || genCh.donnee_intermediaire.cop) {
      return hybrideProrata[zone]['pac'];
    } else {
      return hybrideProrata[zone]['chaudiere'];
    }
  }

  if (nbCascadeAndCombustion > 1) {
    // générateur secondaire d'une cascade avec priorité : aucun besoin assuré
    return estPrincipal ? genCh.donnee_intermediaire.pn / Pnominal : 0;
  }
  return 1 / (nbGenerateurCascade || 1);
}

/**
 * Retourne le facteur de couverture solaire pour les maisons avec chauffage solaire
 * @param de {Donnee_entree}
 * @param zc_id {int}
 * @returns {number|*|null}
 */
function tv_ch_facteur_couverture_solaire(de, zc_id) {
  /**
   * 18.4 Facteur de couverture solaire
   * Les facteurs de couverture solaire peuvent être saisi directement quand ils sont connus et peuvent être justifiés.
   */
  if (de.fch_saisi) {
    return de.fch_saisi;
  }

  const matcher = {
    enum_zone_climatique_id: zc_id
  };

  const row = tv('facteur_couverture_solaire', matcher);
  if (row) {
    return Number(row.facteur_couverture_solaire);
  } else {
    console.error('!! pas de valeur forfaitaire trouvée pour facteur_couverture_solaire !!');
    return null;
  }
}

/**
 * 13.2.1.2 Présence d’un ou plusieurs générateurs à combustion indépendants
 * Calcul du taux de charge cdimref et cdimrefDep pour chacun des générateurs
 *
 * @param installationChauffage {InstallationChauffageItem[]}
 * @param GV {number} déperdition de l'enveloppe
 * @param zcId {string} id de la zone climatique du bien
 * @param caId {string} id de la classe d'altitude du bien
 * @param th {string} type d'habitation
 */
export function tauxChargeForGenerator(installationChauffage, GV, caId, zcId, th) {
  // Récupération des installations de chauffage avec générateur à combustion
  const installChauffageWithCombustion = [];
  installationChauffage.forEach((ch) => {
    const gen_ch = ch.generateur_chauffage_collection.generateur_chauffage;

    const genCombustion = gen_ch.reduce((acc, gen) => {
      if (gen.donnee_utilisateur.isCombustionGenerator) {
        acc.push(gen);
      }

      return acc;
    }, []);

    if (genCombustion.length) {
      ch.donnee_utilisateur.genCombustion = genCombustion;
      installChauffageWithCombustion.push(ch);
    }
  });

  const ca = enums.classe_altitude[caId];
  const zc = enums.zone_climatique[zcId];
  const tbase = Tbase[ca][zc.slice(0, 2)];

  // Pour N générateurs à combustion, puissance totale installée sur le périmètre du GV.
  // En immeuble, le GV est celui de tout l'immeuble : la puissance d'une installation individuelle
  // (représentant un logement type) est multipliée par son ratio de dimensionnement rdim.
  // Le taux de charge obtenu est unique et commun à tous les générateurs à combustion.
  // Cf. moteur de référence (Calcul_batiment.cs, CTchx) : Cdimref += Pn × Rdim / (GV × (Tcons − Tbase))
  const Pn = installChauffageWithCombustion.reduce(
    (acc, installCh) =>
      acc + installCh.donnee_utilisateur.Pnominal * ratioDimensionnement(installCh, th),
    0
  );

  const cdimref = Pn / (GV * (19 - tbase));
  const cdimrefDep = Pn / (GV * (21 - tbase));

  installChauffageWithCombustion.forEach((installCh) => {
    /* c8 ignore next 2 -- repli défensif inatteignable : genCombustion est toujours renseignée sur les
       installations ajoutées à installChauffageWithCombustion */
    (installCh.donnee_utilisateur.genCombustion || []).forEach((gen) => {
      gen.donnee_utilisateur.cdimref = cdimref;
      gen.donnee_utilisateur.cdimrefDep = cdimrefDep;
    });
  });
}

/**
 * Ratio de dimensionnement à appliquer à la puissance d'une installation pour le taux de charge.
 * En immeuble, chaque installation est ramenée à l'échelle de l'immeuble par son rdim (y compris les
 * installations collectives : rdim est renseigné par le logiciel et déjà appliqué au GV avant correctif).
 *
 * @param installCh {InstallationChauffageItem}
 * @param th {string} type d'habitation
 * @return {number}
 */
export function ratioDimensionnement(installCh, th) {
  return th === 'immeuble' ? Number(installCh.donnee_entree.rdim) || 1 : 1;
}
