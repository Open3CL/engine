import enums from './enums.js';
import tvs from './tv.js';
import { mois_liste, Njj, Tbase } from './utils.js';

const G_CHAUDIERE = 20;
const G_RADIATEURS_GAZ = 40;
const G_CHAUDIERE_BOIS = 73.3;
const H_CHAUDIERE = 1.6;
const H_GENERATEUR_AIR_CHAUD = 4;
const H_CHAUDIERE_BOIS = 10.5;

/**
 * 15.1 Consommation des auxiliaires de génération
 * @param di {Donnee_intermediaire}
 * @param de {Donnee_entree}
 * @param type {'ecs'|'ch'}
 * @param besoin {number} Besoin en chauffage ou ecs pour ce générateur
 * @param besoin_dep {number} Besoin en chauffage ou ecs pour ce générateur (mode dépensier)
 */
export function conso_aux_gen(di, de, type, besoin, besoin_dep) {
  const typeGenerateur = parseInt(de[`enum_type_generateur_${type}_id`]);

  const presenceVentilateur = de.presenceVentilateur || 0;

  const g = getG(type, typeGenerateur, presenceVentilateur === 1);
  const h = getH(type, typeGenerateur, presenceVentilateur === 1);

  /**
   * Caux_g = Paux_g × Bch / Pn : les plafonds ci-dessous (400 / 300 / 70 kW) ne s'appliquent
   * qu'à la puissance utilisée dans Paux_g = G + H × Pn ; le dénominateur reste la puissance
   * nominale réelle du générateur, comme le moteur de référence CSTB (Tribu) et comme le calcul
   * dépensier. Autotests CSTB APP3-0-3 (chaudière bois collective 150 kW, Tribu Qaux_ch =
   * 13,27 kWh) et IC4-0-1 (chaudière bois 300 kW, Tribu Qaux_ch = 864,60 kWh).
   * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §15.1
   */
  const pnReel = di.pn / (de.ratio_virtualisation || 1);
  let pe = pnReel;

  // Pour les chaudières gaz ou fioul : si Pn > 400 kW alors Pn = 400 kW
  if (g === G_CHAUDIERE && pe > 400000) {
    pe = 400000;
  }
  // Pour les générateurs d’air chaud : si Pn > 300 kW alors Pn = 300 kW
  if (h === H_GENERATEUR_AIR_CHAUD && pe > 300000) {
    pe = 300000;
  }
  // Pour les chaudières bois : si Pn > 70 kW alors Pn = 70 kW
  if (g === G_CHAUDIERE_BOIS && pe > 70000) {
    pe = 70000;
  }

  /**
   * Installation collective virtualisée : Paux_g (W) est celle du générateur de l'immeuble
   * (Pn = pe, puissance immeuble) et Caux_g = Paux_g × Bch_logement / Pn. Le terme G ne doit pas
   * être proratisé par ratio_virtualisation (sinon G × ratio), comme le moteur CSTB (Tribu).
   * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §15.1
   */
  const Paux_g_ch = g + h * (pe / 1000);

  /**
   * Pour les installations collectives, la conso des auxiliaires est calculée à partir du besoin
   * de l'appartement (clé de répartition).
   * Pour une installation de chauffage individuelle (enum_type_installation_id = 1), la clé
   * n'est pas appliquée : le besoin reçu est déjà proratisé par Sc / Sh dans calc_chauffage, et
   * le moteur de référence CSTB (Tribu) n'utilise aucune clé de répartition pour ces
   * installations (DPE.Core : Calcul_installation.cs l.79-80, Calcul_generateur.cs l.1497,
   * Calcul_batiment.cs l.652). La clé reste appliquée au collectif et à l'ECS.
   * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §15.1
   */
  const ignoreCle = type === 'ch' && String(de.enum_type_installation_id) === '1';
  const cle = ignoreCle ? 1 : de[`cle_repartition_${type}`] || 1;
  let besoinAppart = besoin * cle;
  let besoinAppartDep = besoin_dep * cle;

  /**
   * Le besoin reçu est déjà celui de l'installation : calc_chauffage le proratise par
   * Sc / Sh (surface chauffée de l'installation / surface habitable). Ne pas le proratiser une
   * seconde fois (sinon Bch × (Sc / Sh)²), comme le moteur de référence CSTB (Tribu).
   * Autotest CSTB MI5-0-8 : radiateur gaz, Sc = 96 m², Sh = 136 m², Tribu Qaux_ch = 84,69 kWh
   * (59,78 kWh avec le double prorata, −29 %).
   * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §15.1
   */
  di[`conso_auxiliaire_generation_${type}`] = (Paux_g_ch * besoinAppart) / pnReel || 0;
  di[`conso_auxiliaire_generation_${type}_depensier`] = (Paux_g_ch * besoinAppartDep) / pnReel || 0;
}

/**
 * Récupération du facteur G en fonction du type de générateur
 * @param type {'ecs'|'ch'}
 * @param id {number}
 * @param presenceVentilateur {boolean} - Seules les chaudières bois assistées par ventilateur sont concernées
 */
function getG(type, id, presenceVentilateur) {
  const values = {
    ch: [
      { min: 85, max: 97, value: G_CHAUDIERE }, // Chaudières à gaz
      { min: 148, max: 149, value: G_CHAUDIERE }, // PAC hybride : partie chaudière gaz
      { min: 127, max: 139, value: G_CHAUDIERE }, // Chaudière gpl/propane/butane
      { min: 160, max: 161, value: G_CHAUDIERE }, // PAC hybride : partie chaudière gpl/propane/butane
      { min: 75, max: 84, value: G_CHAUDIERE }, // Chaudières fioul
      { min: 150, max: 151, value: G_CHAUDIERE }, // PAC hybride : partie chaudière fioul
      { min: 53, max: 54, value: G_RADIATEURS_GAZ }, // Radiateur à gaz
      { min: 55, max: 74, value: G_CHAUDIERE_BOIS, withVentilateur: true }, // Chaudières bois assistées par ventilateur
      { min: 152, max: 156, value: G_CHAUDIERE_BOIS, withVentilateur: true } // PAC hybride : partie chaudière bois
    ],
    ecs: [
      { min: 45, max: 57, value: G_CHAUDIERE }, // Chaudières à gaz
      { min: 120, max: 121, value: G_CHAUDIERE }, // PAC hybride : partie chaudière gaz
      { min: 92, max: 104, value: G_CHAUDIERE }, // Chaudière gpl/propane/butane
      { min: 132, max: 133, value: G_CHAUDIERE }, // PAC hybride : partie chaudière gpl/propane/butane
      { min: 35, max: 44, value: G_CHAUDIERE }, // Chaudières fioul
      { min: 122, max: 123, value: G_CHAUDIERE }, // PAC hybride : partie chaudière fioul
      { min: 13, max: 34, value: G_CHAUDIERE_BOIS, withVentilateur: true }, // Chaudières bois assistées par ventilateur
      { min: 122, max: 123, value: G_CHAUDIERE_BOIS, withVentilateur: true } // PAC hybride : partie chaudière bois
    ]
  };

  return getFacteur(values, type, id, presenceVentilateur);
}

/**
 * Récupération du facteur H en fonction du type de générateur
 * @param type {'ecs'|'ch'}
 * @param id {number}
 * @param presenceVentilateur {boolean} - Seules les chaudières bois assistées par ventilateur sont concernées
 */
function getH(type, id, presenceVentilateur) {
  const values = {
    ch: [
      { min: 85, max: 97, value: H_CHAUDIERE }, // Chaudières à gaz
      { min: 148, max: 149, value: H_CHAUDIERE }, // PAC hybride : partie chaudière gaz
      { min: 127, max: 139, value: H_CHAUDIERE }, // Chaudière gpl/propane/butane
      { min: 160, max: 161, value: H_CHAUDIERE }, // PAC hybride : partie chaudière gpl/propane/butane
      { min: 75, max: 84, value: H_CHAUDIERE }, // Chaudières fioul
      { min: 150, max: 151, value: H_CHAUDIERE }, // PAC hybride : partie chaudière fioul
      { min: 50, max: 52, value: H_GENERATEUR_AIR_CHAUD }, // Générateurs à air chaud
      { min: 55, max: 74, value: H_CHAUDIERE_BOIS, withVentilateur: true }, // Chaudières bois assistées par ventilateur
      { min: 152, max: 156, value: H_CHAUDIERE_BOIS, withVentilateur: true } // PAC hybride : partie chaudière bois
    ],
    ecs: [
      { min: 45, max: 57, value: H_CHAUDIERE }, // Chaudières à gaz
      { min: 120, max: 121, value: H_CHAUDIERE }, // PAC hybride : partie chaudière gaz
      { min: 92, max: 104, value: H_CHAUDIERE }, // Chaudière gpl/propane/butane
      { min: 132, max: 133, value: H_CHAUDIERE }, // PAC hybride : partie chaudière gpl/propane/butane
      { min: 35, max: 44, value: H_CHAUDIERE }, // Chaudières fioul
      { min: 122, max: 123, value: H_CHAUDIERE }, // PAC hybride : partie chaudière fioul
      { min: 13, max: 34, value: H_CHAUDIERE_BOIS, withVentilateur: true }, // Chaudières bois assistées par ventilateur
      { min: 122, max: 123, value: H_CHAUDIERE_BOIS, withVentilateur: true } // PAC hybride : partie chaudière bois
    ]
  };

  return getFacteur(values, type, id, presenceVentilateur);
}

function getFacteur(values, type, id, presenceVentilateur) {
  const ranges = values[type] || [];
  for (const range of ranges) {
    if (id >= range.min && id <= range.max) {
      if (!range.withVentilateur || presenceVentilateur) {
        return range.value;
      }
    }
  }

  return 0;
}

/**
 * Calcul de la consommation des auxiliaires de distribution de chauffage
 * @param em_ch { EmetteurChauffageItem[]}
 * @param de {Donnee_entree} donnée du générateur de chauffage
 * @param di {Donnee_intermediaire} donnée intermédiaire du générateur de chauffage
 * @param du {object} donnée utilisateur du générateur de chauffage
 * @param surfaceHabitable {number}
 * @param zcId {number} id de la zone climatique du bien
 * @param caId {number} id de la classe d'altitude du bien
 * @param ilpa {number} 1 si bien à inertie lourde, 0 sinon
 * @param GV {number} déperdition de l'enveloppe
 */
export function conso_aux_distribution_ch(
  em_ch,
  de,
  di,
  du,
  surfaceHabitable,
  zcId,
  caId,
  ilpa,
  GV
) {
  const ca = enums.classe_altitude[caId];
  const zc = enums.zone_climatique[zcId];

  const Nref19 = tvs.nref19[ilpa];

  let nref19 = 0;

  for (const mois of mois_liste) {
    nref19 += Nref19[ca][mois][zc];
  }

  const Pcircem19 = getPuissanceCirculateur(
    em_ch,
    de,
    di,
    du,
    surfaceHabitable,
    GV,
    Tbase[ca][zc.slice(0, 2)]
  );

  di[`conso_auxiliaire_distribution_ch`] = (Pcircem19 * nref19) / 1000;
}

/**
 * 15.2.1 Puissance des circulateurs de chauffage
 * @param em_ch { EmetteurChauffageItem[]}
 * @param de {Donnee_entree} donnée du générateur de chauffage
 * @param di {Donnee_intermediaire} donnée intermédiaire du générateur de chauffage
 * @param du {object} donnée utilisateur du générateur de chauffage
 * @param surfaceHabitable {number}
 * @param GV {number} déperdition de l'enveloppe
 * @param Tbase {number} température
 */
function getPuissanceCirculateur(em_ch, de, di, du, surfaceHabitable, GV, Tbase) {
  /**
   * Le circulateur dessert les émetteurs reliés au générateur (enum_lien_generateur_emetteur_id),
   * et non ceux d'un autre générateur de l'installation (ex. convecteurs électriques d'appoint).
   * Autotest CSTB IC5-0-3 : chaudière gaz sur plancher chauffant (lien 1) + convecteurs (lien 2),
   * Tribu Caux_dist_ch = 1951,90 kWh (Fcot du plancher, 0,156).
   */
  const emetteursLies = em_ch.filter(
    (em) =>
      em.donnee_entree.enum_lien_generateur_emetteur_id === de.enum_lien_generateur_emetteur_id
  );
  if (emetteursLies.length > 0) {
    em_ch = emetteursLies;
  }
  const typeEmetteur = parseInt(em_ch[0].donnee_entree.enum_type_emission_distribution_id);

  // Perte de charge de l’émetteur
  let deltaPem = 35;
  let Fcot = 0.802;

  /**
   * 15.2.1 Puissance des circulateurs de chauffage
   * Plancher/plafond chauffant => deltaPemnom = 15
   * Radiateurs monotube => deltaPemnom = 30
   * Radiateurs autres => deltaPemnom = 10
   */
  if ([6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 43, 44].includes(typeEmetteur)) {
    deltaPem = 15;
    Fcot = 0.156;
  } else if ([24, 25, 26, 27, 28, 29, 30, 31].includes(typeEmetteur)) {
    deltaPem = 30;
  } else if ([10, 19, 32, 33, 34, 35, 36, 37, 38, 39, 45].includes(typeEmetteur)) {
    deltaPem = 10;
  }

  /**
   * En présence de plusieurs types d’émetteurs, le coefficient Fcot le plus défavorable sera pris, c’est-à-dire pour
   * l’émetteur « Autre ».
   */
  if (em_ch.length > 1) {
    Fcot = 0.802;
  }

  const nbNiveauChauffage = de.nombre_niveau_installation_ch || 1;

  /**
   * Surface desservie par l'installation : le réseau (Lem) et le nombre de circulateurs
   * (Sh / 400) sont ceux de l'installation, pas ceux du bâtiment entier (ex. immeuble à
   * installations individuelles par logement), comme le moteur de référence CSTB (Tribu).
   *
   * En DPE immeuble, une installation décrite représente rdim logements identiques : le
   * circulateur est dimensionné pour un logement (surface / rdim) puis multiplié par rdim
   * (Tribu, Calcul_batiment.cs : Caux_dist_ch += Caux_dist_ch_installation × Rdim).
   */
  const rdim = de.rdim_installation_ch || 1;
  const surfaceInstallation = (de.surface_chauffee || surfaceHabitable) / rdim;
  const nbCirculateurs = Math.max(1, surfaceInstallation / 400);

  // Calcul de la longueur du réseau le plus défavorisé
  const Lem = 5 * Fcot * (nbNiveauChauffage + (surfaceInstallation / nbNiveauChauffage) ** 0.5);

  // Pertes de charge du réseau (kPa)
  const deltaPemnom = 0.15 * Lem + deltaPem;

  // Ratio du besoin couvert par l’équipement
  const nbGenerateurCascade = du.nbGenerateurCascade || 1;
  const ratioSurfaceChauffage = surfaceInstallation / (surfaceHabitable * nbGenerateurCascade);

  // Chute nominale de température de dimensionnement
  const deltaDim = getDeltaDim(em_ch);

  // Puissance nominale en chaud (kW)
  const Pnc = 10 ** -3 * GV * (20 - Tbase);

  const Qvemnom = (Pnc * ratioSurfaceChauffage) / (1.163 * deltaDim);

  return (
    rdim * Math.max(30, 6.44 * ((deltaPemnom * Qvemnom) / nbCirculateurs) ** 0.676 * nbCirculateurs)
  );
}

/**
 * 15.2.1 Chute nominale de température de dimensionnement ΔθDim (°C)
 * - 15 °C pour une distribution haute température (enum_temp_distribution_ch_id 4) ou un
 *   soufflage d'air chaud sur réseau aéraulique (enum_type_emission_distribution_id 5) ;
 * - 7,5 °C sinon (basse ou moyenne température).
 *
 * L'installation est dimensionnée pour l'ensemble de ses émetteurs : un seul émetteur haute
 * température impose 15 °C, quel que soit l'ordre de saisie des émetteurs (comme le moteur de
 * référence CSTB Tribu). Auparavant, seul le premier émetteur était considéré.
 *
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §15.2.1
 * @param em_ch {EmetteurChauffageItem[]}
 * @return {number}
 */
export function getDeltaDim(em_ch) {
  const hauteTemperature = em_ch.some(
    (em) =>
      parseInt(em.donnee_entree.enum_temp_distribution_ch_id) === 4 ||
      parseInt(em.donnee_entree.enum_type_emission_distribution_id) === 5
  );
  return hauteTemperature ? 15 : 7.5;
}

/**
 * 15.2.3 Consommation des auxiliaires de distribution d'ECS
 * Calcul installation par installation pour le cas appartement
 *
 * SI installation individuelle : conso = 0
 * SI installation collective :
 *   CAS 1 - enum_bouclage_reseau_ecs_id = 1 (non bouclé) : conso = 0
 *   CAS 2 - enum_bouclage_reseau_ecs_id = 2 (bouclé) : calcul selon étapes 1-9
 *   CAS 3 - enum_bouclage_reseau_ecs_id = 3 (traçage) : conso = 0.14 * BECS_annuel * Sh_install / Sh_logement
 *
 * @param ecs {object} installation ECS
 * @param de {Donnee_entree} donnée d'entrée de l'installation ECS
 * @param di {Donnee_intermediaire} donnée intermédiaire de l'installation ECS
 * @param Sh_logement {number} surface habitable du logement
 * @param Sh_immeuble {number} surface habitable de l'immeuble
 * @param caId {number} id de la classe d'altitude
 * @param zcId {number} id de la zone climatique
 * @param nadeq {number} nombre d'unités d'équivalence
 * @param nombre_niveau_immeuble {number} nombre de niveaux de l'immeuble
 */
export function conso_aux_distribution_ecs(
  ecs,
  de,
  di,
  Sh_logement,
  Sh_immeuble,
  caId,
  zcId,
  nadeq,
  nombre_niveau_immeuble
) {
  const typeInstallation = parseInt(de.enum_type_installation_id);

  if (typeInstallation === 1) {
    di.conso_auxiliaire_distribution_ecs = 0;
    return;
  }

  const enumBouclage = parseInt(de.enum_bouclage_reseau_ecs_id);

  // CAS 1 - enum_bouclage_reseau_ecs_id =1 (réseau d'ECS non bouclé)
  if (enumBouclage === 1 || isNaN(enumBouclage)) {
    di.conso_auxiliaire_distribution_ecs = 0;
    return;
  }

  // CAS 3 - enum_bouclage_reseau_ecs_id = 3 (traçage)
  if (enumBouclage === 3) {
    const BECS_annuel = di.besoin_ecs;
    /**
     * Appartement : le besoin du logement est porté à l'échelle de l'installation (Sh_install / Sh).
     * Immeuble (Sh_immeuble = Sh_logement) : di.besoin_ecs est déjà le besoin de l'installation
     * (proratisé par di.ratio_besoin_ecs), aucune mise à l'échelle supplémentaire.
     * @see Moteur_DPE.dll Calcul_installation_ECS.cs l.378 (Qtrac = 0,14 × Becs / ratio_batiment,
     * ratio_batiment = 1 hors appartement : Calcul_batiment.cs l.303-309)
     */
    const Sh_install =
      Sh_immeuble > Sh_logement ? de.surface_habitable || Sh_logement : Sh_logement;
    di.conso_auxiliaire_distribution_ecs = (0.14 * BECS_annuel * Sh_install) / Sh_logement;
    return;
  }

  // CAS 2 - enum_bouclage_reseau_ecs_id = 2 (réseau bouclé)
  const ca = enums.classe_altitude[caId];
  const zc = enums.zone_climatique[zcId];

  const ratioVirtu = parseFloat(de.ratio_virtualisation);
  let Sh_immeuble_ratio = Sh_immeuble;
  let Sh_install = de.surface_habitable || Sh_logement;
  let Niv_inst_ecs = de.nombre_niveau_installation_ecs || 1;

  if (!(Sh_immeuble > Sh_logement) && ratioVirtu > 0 && ratioVirtu < 1) {
    Sh_immeuble_ratio = Sh_logement / ratioVirtu;
    Sh_install = Sh_logement;
    Niv_inst_ecs = nombre_niveau_immeuble || Niv_inst_ecs;
  }

  // Etape 3: Lb - longueur par défaut du bouclage ECS (m)
  // Sh est la surface habitable des logements desservis par l'installation d'ECS
  // Pour l'appartement, on utilise la surface à l'échelle de l'immeuble
  const Sh = (Sh_install / Sh_logement) * Sh_immeuble_ratio;
  const Lb = 4 * Math.pow(Sh / Niv_inst_ecs, 0.5) + 6 * (Niv_inst_ecs - 0.5);

  // Etape 4: DeltaPb (kPa) - perte de charge dans le bouclage
  const DeltaPb = 0.2 * Lb + 10;

  let conso = 0;

  for (const mois of mois_liste) {
    // Besoin ECS mensuel pour le logement (kWh)
    // spec : https://rt-re-batiment.developpement-durable.gouv.fr/IMG/pdf/consolide_annexe_1_arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf
    // page 71-72
    const tefsj = tvs.tefs[ca][mois][zc];
    const njj = Njj[mois];
    const BECS_j = (1.163 * nadeq * 56 * (40 - tefsj) * njj) / 1000;

    // Etape 1: Qdwj_i (Wh) - pertes de distribution à l'échelle de l'immeuble
    // Qd,w,j = (0.5 * Lvc / Sh + 0.112 + 0.028) * BECS_j
    // Pour Ratecs=1 (bouclé): Lvc = 0.2 * Sh * Ratecs = 0.2 * Sh
    // So Qd,w,j = (0.1 + 0.112 + 0.028) * BECS_j = 0.24 * BECS_j (kWh)
    // Pour l'appartement: Qd,w,j est multiplié par Sh_immeuble_ratio / Sh_logement
    const Qdwj_i =
      (0.24 * BECS_j * 1000 * Sh_install * Sh_immeuble_ratio) / (Sh_logement * Sh_logement);

    // Etape 2: qdwj_i (m³/h) - débit de distribution ECS
    const Nh_puisage_j = njj * 5;
    const qdwj_i = Qdwj_i / (5.815 * Nh_puisage_j) / 1000;

    // Etape 5: Phyd,j (W) - puissance hydraulique du bouclage
    const Phyd_j = (qdwj_i * DeltaPb) / 3.6;

    // Etape 6: Effcirb,j - efficacité du circulateur
    const Effcirb_j = Math.pow(Phyd_j, 0.324) / 15.3;

    // Etape 7: Pcirb,j (W) - puissance électrique du circulateur
    const Pcirb_j = Math.max(20, Phyd_j / Effcirb_j);

    // Etape 8: Qcirb,j (Wh) - consommation mensuelle du circulateur
    const Nh_mois_j = njj * 24;
    const Qcirb_j = Nh_puisage_j * Pcirb_j + (Nh_mois_j - Nh_puisage_j) * 20;

    conso += Qcirb_j;
  }

  // Etape 9: conso annuelle ramenée à l'appartement (kWh)
  di.conso_auxiliaire_distribution_ecs = (conso * Sh_logement) / Sh_immeuble_ratio / 1000;
}
