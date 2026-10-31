/**
 * Fichier généré par scripts/generate_types_from_xsd.js — ne pas modifier.
 * Source : https://gitlab.com/observatoire-dpe/observatoire-dpe/-/raw/master/modele_donnee/DPEv2.7.xsd
 * Version V10.0.0 - 2026-10-16 : DPE 2.7 - intégration EPBD et nouvelles technologies
 * Régénération : npm run types:generate
 *
 * Les extensions propres à Open3CL (donnees de calcul, DU, champs calculés par le moteur) ne sont
 * pas ici : voir les fichiers *.model.ts voisins.
 */
/* eslint-disable */

/** Version V10.0.0 - 2026-10-16 : DPE 2.7 - intégration EPBD et nouvelles technologies */
export interface XsdDpe {
  administratif: XsdAdministratif;
  dpe_immeuble?: XsdDpeImmeuble | null;
  descriptif_enr_collection: { descriptif_enr?: XsdDescriptifEnr | XsdDescriptifEnr[] };
  descriptif_simplifie_collection: {
    descriptif_simplifie: XsdDescriptifSimplifie | XsdDescriptifSimplifie[];
  };
  fiche_technique_collection: { fiche_technique?: XsdFicheTechnique | XsdFicheTechnique[] };
  justificatif_collection: { justificatif?: XsdJustificatif | XsdJustificatif[] };
  descriptif_geste_entretien_collection: {
    descriptif_geste_entretien?: XsdDescriptifGesteEntretien | XsdDescriptifGesteEntretien[];
  };
  descriptif_travaux?: XsdDescriptifTravaux | null;
  /** Modele 3cl logement */
  logement?: XsdLogement;
  /** Tertiaire */
  tertiaire?: XsdTertiaire;
  /** Logement neuf */
  logement_neuf?: XsdLogementNeuf;
  /** clé de hachage (attribut XML) */
  hashkey?: string;
  /** id (attribut XML) */
  id?: string;
  /** Version schéma (attribut XML) */
  version: string;
}

export interface XsdAdministratif {
  /** numéro du DPE à remplacer dans le cas d'une opération de remplacement du DPE */
  dpe_a_remplacer?: string | null;
  /** référence interne logiciel du projet. Mis en place pour réidentification du projet en cas d'import depuis l'observatoire */
  reference_interne_projet?: string | null;
  /** motif du remplacement du DPE : texte libre */
  motif_remplacement?: string | null;
  /** numéro du DPE immeuble associé au DPE logement utilisant la méthode de génération des DPE à l'appartement à partir du DPE immeuble */
  dpe_immeuble_associe?: string | null;
  /** version du DPE. Cenuméro de version permet de tracer les évolutions de modèle de données, de contexte réglementaire et de contrôle mis en place sur les DPE. Chaque nouvelle version induit un certain nombre de changements substantiels. Certaines données ne sont disponible ou obligatoires qu'à partir d'une certaine version — Valeurs : 1=version du 1er juillet 2021, 2=version avec modèle complet sans contrôle de cohérence, 1.1=version corrective du 1er novembre, 2.1=version de fin de validation incluant les contrôles de cohérences, 2.2=version de préparation de compatibilité audit/dpe, 2.3=version corrective de janvier 2023, 2.4=version correspondant à l'arrêté des seuils pour les petites surfaces, 2.5=version correspondant à l'… */
  enum_version_id: string;
  /** date de visite du diagnostiqueur */
  date_visite_diagnostiqueur: string;
  /** denomination ou raison sociale du propriétaire */
  nom_proprietaire: string;
  /** siren du propriétaire lorsque celui-ci est une personne morale. */
  siren_proprietaire?: string | null;
  /** dénomination ou raison sociale du propriétaire des installations communes */
  nom_proprietaire_installation_commune?: string | null;
  /** date de l'établissement du dpe */
  date_etablissement_dpe: string;
  /** modèle de dpe (3CL logement / tertiaire ou neuf) — Valeurs : 1=dpe 3cl 2021 méthode logement, 2=dpe neuf logement : rt2012, 3=dpe neuf logement : re2020, 4=dpe 2006 tertiaire et erp */
  enum_modele_dpe_id: string;
  diagnostiqueur: XsdAdministratifDiagnostiqueur;
  geolocalisation: XsdAdministratifGeolocalisation;
  /** A partir du 1er juillet 2024, lors de toutes ses interventions, le diagnostiqueur recueille le consentement de ses clients en vue de la transmission de leurs coordonnées à l’organisme de certification à des fins de contrôles, selon un modèle de formulaire fourni par les services du ministère chargé de la construction. — Valeurs : 0=absence de consentement, 1=consentement fourni, 2=consentement non requis */
  enum_consentement_formulaire_id: string;
  information_formulaire_consentement?: XsdAdministratifInformationFormulaireConsentement | null;
  /** nature du commanditaire du DPE ou de l'audit. S'il s'agit d'un propriétaire alors la fourniture du numéro fiscal du logement est obligatoire pour les DPE existants et les audits. — Valeurs : 1=propriétaire, 2=non propriétaire */
  enum_commanditaire_id: string;
  /** Horodatage (timestamp) de génération du XML au format ISO 8601 (YYYY-MM-DDThh:mm:ss+01:00 ou +02:00). Fuseau horaire imposé : Europe/Paris (hiver = +01:00, été = +02:00). */
  horodatage_historisation?: string | null;
}

export interface XsdAdministratifDiagnostiqueur {
  /** identifiant de logiciel dpe unique */
  usr_logiciel_id: number;
  /** version du logiciel utilisé */
  version_logiciel: string;
  /** version du moteur de calcul utilisé par le logiciel */
  version_moteur_calcul?: string | null;
  /** nom du diagnostiqueur */
  nom_diagnostiqueur: string;
  /** prénom du diagnostiqueur */
  prenom_diagnostiqueur: string;
  /** mail du diagnostiqueur */
  mail_diagnostiqueur: string;
  /** numéro de téléphone du diagnostiqueur */
  telephone_diagnostiqueur: string;
  /** adresse postale du diagnostiqueur */
  adresse_diagnostiqueur: string;
  /** entreprise du diagnostiqueur */
  entreprise_diagnostiqueur: string;
  /** numero de certification du diagnostiqueur */
  numero_certification_diagnostiqueur: string;
  /** nom de l'organisme certificateur */
  organisme_certificateur: string;
}

export interface XsdAdministratifGeolocalisation {
  /** invariant fiscal du logement (10 caractères) : OBSOLETE, remplacé par numero_fiscal_local */
  invar_logement?: string | null;
  /** numero fiscal du logement (12 caractères). Cette information peut être récupérée sur la plateforme gérer mes biens immobiliers du site particulier des impots. (REMPLACE invar_logement) */
  numero_fiscal_local?: string | null;
  /** identifiant batiment du Référentiel National des Bâtiments (RNB) à venir sur les bâtiments en France (https://beta.gouv.fr/startups/bat-id.html) */
  id_batiment_rnb?: string | null;
  /** identifiant Repertoire Logement Social (RPLS) du logement (dans le cas d'un propriétaire bailleur social) */
  rpls_log_id?: string | null;
  /** identifiant Repertoire Logement Social (RPLS) de l'organisation de bailleur social propriétaire du logement (dans le cas d'un propriétaire bailleur social) */
  rpls_org_id?: string | null;
  /** identifiant de parcelle cadastrale (14 caractères) */
  idpar?: string | null;
  /** numéro d'immatriculation de la copropriété au registre des copropriétés (9 caractères XX0000000) */
  immatriculation_copropriete?: string | null;
  /** Adresses bien, propriétaire, installations */
  adresses: XsdAdministratifGeolocalisationAdresses;
}

/** Adresses bien, propriétaire, installations */
export interface XsdAdministratifGeolocalisationAdresses {
  adresse_bien: XsdTAdresse;
  adresse_proprietaire: XsdTAdresse;
  adresse_proprietaire_installation_commune?: XsdTAdresse | null;
}

export interface XsdTAdresse {
  /** libéllé l'adresse postale du bien saisi par le diagnostiqueur sans le code postal ni la commune (FORMAT ATTENDU : Numéro de l’adresse dans la voie + Indice de répétition associé au numéro (par exemple bis, a…) + Nom de la voie en minuscules accentuées) */
  adresse_brut: string;
  /** code postal de l'adresse brute saisie par le diagnostiqueur */
  code_postal_brut: string;
  /** nom de commune brute saisie par le diagnostiqueur */
  nom_commune_brut: string;
  /** libellé complet de l'adresse postale du bien saisi par le diagnostiqueur (FORMAT ATTENDU : Numéro de l’adresse dans la voie + Indice de répétition associé au numéro (par exemple bis, a…) + Nom de la voie en minuscules accentuées + Code postal du bureau de distribution de la voie + Nom officiel de la commune actuelle */
  label_brut: string;
  /** libellé complet d'adresse complète qui est l'adresse postale du bien précédé par l'ensemble des compléments d'adresses nécessaires à la bonne localisation du bien saisi par le diagnostiqueur (FORMAT ATTENDU : Compléments d'adresses + Numéro de l’adresse dans la voie + Indice de répétition associé au numéro (par exemple bis, a…) + Nom de la voie en minuscules accentuées + Code postal du bureau de distribution de la voie + Nom officiel de la commune actuelle) */
  label_brut_avec_complement: string;
  /** statut de l'appareillement à la BAN de l'adresse — Valeurs : 1=adresse géocodée ban à l'adresse, 2=adresse non géocodée ban car aucune correspondance trouvée */
  enum_statut_geocodage_ban_id: string;
  /** date d'appel à la ban */
  ban_date_appel: string;
  /** clé d'intéropérabilité de la BAN referençant l'adresse. (id dans l'API adresse d'etalab). Attention Il ne s'agit pas de l'identifiant BAN stable (banId) */
  ban_id?: string | null;
  /** identifant BAN stable officiel de l'adresse. Le nom du champs est celui du format BAL 1.4 ( https://aitf-sig-topo.github.io/voies-adresses/files/AITF_SIG_Topo_Format_Base_Adresse_Locale_v1.4.pdf ) (ce champs s'appelle banId dans l'API adresse d'etalab) */
  ban_id_ban_adresse?: string | null;
  /** label de l'adresse au format ban */
  ban_label?: string | null;
  /** Numéro éventuel de l’adresse dans la voie (champ BAN) */
  ban_housenumber?: string | null;
  /** Nom de la voie en minuscules accentuées avec les noms alternatifs éventuels (champ BAN) */
  ban_street?: string | null;
  /** code insee de la commune de l'adresse géocodée ban */
  ban_citycode?: string | null;
  /** code postal de la commune de l'adresse géocodée ban */
  ban_postcode?: string | null;
  /** nom de la commune de l'adresse géocodée ban */
  ban_city?: string | null;
  /** type de résultat ban : housenumber/street/locality/municipality */
  ban_type?: 'housenumber' | 'street' | 'municipality' | 'locality' | null;
  /** score de match entre le label brut et le résultat de géocodage de la BAN */
  ban_score?: number | null;
  /** coordonnée x du géolocalisant ban dans le referentiel epsg 2154 lambert 93 */
  ban_x?: number | null;
  /** coordonnée y du géolocalisant ban dans le referentiel epsg 2154 lambert 93 */
  ban_y?: number | null;
  /** complement d'adresses : nom de la residence */
  compl_nom_residence?: string | null;
  /** complement d'adresse : référence du bâtiment ( ex. A,B ,1,2,3,4) */
  compl_ref_batiment?: string | null;
  /** complement d'adresses : etage du logement (cas de l'appartement) sous format entier 0 =RDC */
  compl_etage_appartement?: number | null;
  /** complement d'adresses : reference de cage d'escalire> */
  compl_ref_cage_escalier?: string | null;
  /** complement d'adresses : reference du logement dans le bâtiment (appartement ex. 10, A13, 3eme gauche) */
  compl_ref_logement?: string | null;
}

export interface XsdAdministratifInformationFormulaireConsentement {
  /** denomination ou raison sociale du commanditaire */
  nom_formulaire: string;
  /** le propriétaire est-il une personne morale */
  personne_morale: 0 | 1;
  /** siren de la personne commanditaire, saisie obligatoire lorsqu'il s'agit d'une personne morale. */
  siren_formulaire?: string | null;
  /** numéro de téléphone du propriétaire */
  telephone?: string | null;
  /** adresse mail du proprietaire */
  mail?: string | null;
  /** libellé complet de l'adresse postale du bien saisi par le diagnostiqueur (FORMAT ATTENDU : Numéro de l’adresse dans la voie + Indice de répétition associé au numéro (par exemple bis, a…) + Nom de la voie en minuscules accentuées + Code postal du bureau de distribution de la voie + Nom officiel de la commune actuelle */
  label_adresse: string;
  /** libellé complet d'adresse complète qui est l'adresse postale du bien précédé par l'ensemble des compléments d'adresses nécessaires à la bonne localisation du bien saisi par le diagnostiqueur (FORMAT ATTENDU : Compléments d'adresses + Numéro de l’adresse dans la voie + Indice de répétition associé au numéro (par exemple bis, a…) + Nom de la voie en minuscules accentuées + Code postal du bureau de distribution de la voie + Nom officiel de la commune actuelle) */
  label_adresse_avec_complement: string;
}

export interface XsdDpeImmeuble {
  logement_visite_collection: {
    logement_visite: XsdDpeImmeubleLogementVisite | XsdDpeImmeubleLogementVisite[];
  };
}

export interface XsdDpeImmeubleLogementVisite {
  /** description du logement visité dans le cadre d'un DPE immeuble */
  description: string;
  /** position du logement visité dans l'immeuble en terme d'étage — Valeurs : 1=rdc, 2=étage intermédiaire, 3=dernier étage */
  enum_position_etage_logement_id: string;
  /** typologie de logement visité (T1… T6) — Valeurs : 1=t1, 2=t2, 3=t3, 4=t4, 5=t5, 6=t6, 7=t7 ou plus */
  enum_typologie_logement_id: string;
  /** surface habitable du logement visité dans le cadre d'un DPE immeuble */
  surface_habitable_logement: number;
}

export interface XsdDescriptifEnr {
  /** description du système d'ENR */
  description: string;
  /** catégorie de système ENR — Valeurs : 1=pompe à chaleur, 2=chauffe-eau thermodynamique, 3=panneaux solaires photovoltaïques, 4=panneaux solaires thermiques, 5=géothermie, 6=réseau de chaleur ou de froid vertueux, 7=chauffage au bois, 8=éolienne, 9=cogénération */
  enum_categorie_enr_descriptif_id: string;
}

export interface XsdDescriptifSimplifie {
  /** description du composant */
  description: string;
  /** catégorie de composant — Valeurs : 1=murs, 2=planchers bas, 3=toiture/plafond, 4=portes et fenêtres, 5=système de chauffage, 6=système d'ecs, 7=sytème de refroidissement, 8=système de ventilation, 9=dispositifs de pilotage chauffage/climatisation, 10=système de production d'électricité d'origine renouvelable */
  enum_categorie_descriptif_simplifie_id: string;
}

export interface XsdFicheTechnique {
  /** catégorie de composant — Valeurs : 1=murs, 2=planchers bas, 3=toiture/plafond, 4=baies vitrées, 5=portes, 6=pont thermique, 7=système de chauffage, 8=système d'ecs, 9=sytème de refroidissement, 10=système de ventilation, 11=général, 12=description échantillon logement pour dpe immeuble */
  enum_categorie_fiche_technique_id: string;
  sous_fiche_technique_collection: {
    sous_fiche_technique:
      XsdFicheTechniqueSousFicheTechnique | XsdFicheTechniqueSousFicheTechnique[];
  };
}

export interface XsdFicheTechniqueSousFicheTechnique {
  /** description de la sous catégorie */
  description: string;
  /** valeur de la sous catégorie */
  valeur: string;
  /** description détail de l'origne de la donnée ( type de document,type de mesure etc..) */
  detail_origine_donnee?: string | null;
  /** origine de la donnée — Valeurs : 1=valeur par défaut, 2=mesuré/observé, 3=issu d'un document justificatif autorisé, 4=obtenu en ligne, 5=estimé, 6=valeur par défaut pénalisante */
  enum_origine_donnee_id: string;
}

export interface XsdJustificatif {
  /** description du justificatif adjoint au DPE */
  description: string;
  /** type de justificatif — Valeurs : 1=plans de la maison, de l’appartement ou de l’immeuble, 2=plan de situation ou plan de masse du bâtiment, 3=diagnostic surface habitable, 4=avis de taxe d’habitation, 5=relevé de propriété, 6=règlement de copropriété, 7=descriptifs des équipements collectifs fournis par le propriétaire des installations collectives ou le syndic de copropriété, 8=descriptifs des équipements individuels des logemen… */
  enum_type_justificatif_id: string;
}

export interface XsdDescriptifGesteEntretien {
  /** description du geste d'entretien */
  description: string;
  /** catégorie de composant concerné — Valeurs : 1=ventilation, 2=chaudière, 3=radiateur, 4=éclairage, 5=vitrages, 6=circuit de distribution, 7=pompe à chaleur, 8=insert/poêle bois, 9=chauffe-eau, 10=chauffe-eau thermodynamique, 11=panneau solaire, 12=picto "neutre", 13=isolation, 14=climatisation, 15=système chauffage, 16=système ecs, 17=baies et portes */
  enum_picto_geste_entretien_id: string;
  /** catégorie de composant concerné */
  categorie_geste_entretien: string;
}

export interface XsdDescriptifTravaux {
  pack_travaux_collection: {
    pack_travaux?: XsdDescriptifTravauxPackTravaux | XsdDescriptifTravauxPackTravaux[];
  };
  /** commentaires généraux sur les travaux à réaliser */
  commentaire_travaux: string;
}

export interface XsdDescriptifTravauxPackTravaux {
  /** numéro du pack travaux (1,2,1+2) — Valeurs : 1=1, 2=2, 3=1+2 */
  enum_num_pack_travaux_id: string;
  /** consommation 5 usages après travaux en energie primaire (kWhEP/m²/an) */
  conso_5_usages_apres_travaux?: number | null;
  /** emissions C02 5 usages après travaux (kgCO2/m²/an) */
  emission_ges_5_usages_apres_travaux?: number | null;
  /** fourchette basse de l'estimation des coûts du pack travaux(€) */
  cout_pack_travaux_min?: number | null;
  /** fourchette haute de l'estimation des coûts du pack travaux(€) */
  cout_pack_travaux_max?: number | null;
  travaux_collection: {
    travaux?: XsdDescriptifTravauxPackTravauxTravaux | XsdDescriptifTravauxPackTravauxTravaux[];
  };
}

export interface XsdDescriptifTravauxPackTravauxTravaux {
  /** description textuelle des travaux envisagés sur le lot */
  description_travaux: string;
  /** lot concerné par les travaux — Valeurs : 1=murs, 2=planchers bas, 3=toiture/plafond, 4=portes et fenêtres, 5=système de chauffage, 6=système d'ecs, 7=sytème de refroidissement, 8=système de ventilation, 9=energie renouvelable */
  enum_lot_travaux_id: string;
  /** avertissement concernant les travaux à réaliser */
  avertissement_travaux?: string | null;
  /** performance recommandé des composants rénovés */
  performance_recommande: string;
}

/** Modele 3cl logement */
export interface XsdLogement {
  caracteristique_generale: XsdLogementCaracteristiqueGenerale;
  meteo: XsdLogementMeteo;
  enveloppe: XsdLogementEnveloppe;
  ventilation_collection: { ventilation: XsdLogementVentilation[] };
  climatisation_collection: { climatisation?: XsdLogementClimatisation[] };
  production_elec_enr?: XsdLogementProductionElecEnr | null;
  installation_ecs_collection: { installation_ecs?: XsdLogementInstallationEcs[] };
  installation_chauffage_collection: {
    installation_chauffage?: XsdLogementInstallationChauffage[];
  };
  sortie: XsdLogementSortie;
}

export interface XsdLogementCaracteristiqueGenerale {
  /** annee de construction */
  annee_construction?: number | null;
  /** période de construction — Valeurs : 1=avant 1948, 2=1948-1974, 3=1975-1977, 4=1978-1982, 5=1983-1988, 6=1989-2000, 7=2001-2005, 8=2006-2012, 9=2013-2021, 10=après 2021 */
  enum_periode_construction_id: string;
  /** méthode d'application du DPE logement — Valeurs : 1=dpe maison individuelle, 2=dpe appartement individuel chauffage individuel ecs individuel, 3=dpe appartement individuel chauffage collectif ecs individuel, 4=dpe appartement individuel chauffage individuel ecs collectif, 5=dpe appartement individuel chauffage collectif ecs collectif, 6=dpe immeuble collectif chauffage individuel ecs individuel, 7=dpe immeuble collectif chauffage collectif ecs in… */
  enum_methode_application_dpe_log_id: string;
  /** quel type d'échantillonnage a été appliqué pour le calcul du DPE immeuble (dans le cas d'un DPE immeuble) — Valeurs : 1=absence de méthode d’échantillonnage, 2=calcul de l’échantillonnage effectué par un logiciel validé, 3=calcul de l’échantillonnage effectué par le diagnostiqueur */
  enum_calcul_echantillonnage_id?: string | null;
  /** surface habitable du logement renseignée sauf dans le cas du dpe à l'immeuble */
  surface_habitable_logement?: number | null;
  /** nombre de niveaux total de l'immeuble */
  nombre_niveau_immeuble?: number | null;
  /** nombre de niveaux du logement (maison ou appartement) */
  nombre_niveau_logement?: number | null;
  /** hauteur sous plafond moyenne du logement/de l'immeuble */
  hsp: number;
  /** surface habitable totale de l'immeuble dans le cas d'un DPE appartement avec usage collectif ou d'un DPE immeuble. */
  surface_habitable_immeuble?: number | null;
  /** surface tertiaire totale de l'immeuble dans le cas d'un DPE immeuble. La surface tertiaire est prise en compte pour le calcul des besoins dans le cas d'une installation collective mixte tertiaire/residentiel */
  surface_tertiaire_immeuble?: number | null;
  /** nombre d'appartements de l'immeuble dans le cas d'un DPE appartement avec usage collectif ou d'un DPE immeuble. */
  nombre_appartement?: number | null;
  /** est ce que l'appartement est un appartement non visité dans le cas d'un DPE appartement généré à partir d'un immeuble. (application de système individuel les moins performants de l'immeuble) */
  appartement_non_visite?: 0 | 1 | null;
  /** Indique si le bâtiment ou logement peut modifier ou décaler certains usages énergétiques en réponse à des signaux extérieurs. Donnée facultative réservée à l'état initial de l'audit. */
  flexibilite_reseau: 0 | 1;
}

export interface XsdLogementMeteo {
  /** zone climatique du logement — Valeurs : 1=h1a, 2=h1b, 3=h1c, 4=h2a, 5=h2b, 6=h2c, 7=h2d, 8=h3 */
  enum_zone_climatique_id: string;
  /** altitude du logement (m) */
  altitude?: number | null;
  /** classe d'altitude du logement — Valeurs : 1=inférieur à 400m, 2=400-800m, 3=supérieur à 800m */
  enum_classe_altitude_id: string;
  /** est ce que le bâtiment est principalement composé de matériaux anciens pour ses murs 0 : non 1 : oui */
  batiment_materiaux_anciens: 0 | 1;
}

export interface XsdLogementEnveloppe {
  inertie: XsdLogementEnveloppeInertie;
  mur_collection: { mur?: XsdLogementEnveloppeMur[] };
  plancher_bas_collection: { plancher_bas?: XsdLogementEnveloppePlancherBas[] };
  plancher_haut_collection: { plancher_haut?: XsdLogementEnveloppePlancherHaut[] };
  baie_vitree_collection: { baie_vitree?: XsdLogementEnveloppeBaieVitree[] };
  porte_collection: { porte?: XsdLogementEnveloppePorte[] };
  ets_collection: { ets?: XsdLogementEnveloppeEts | XsdLogementEnveloppeEts[] };
  pont_thermique_collection: { pont_thermique?: XsdLogementEnveloppePontThermique[] };
}

export interface XsdLogementEnveloppeInertie {
  /** est ce que le plancher bas est considéré comme lourd 0 : non 1 : oui */
  inertie_plancher_bas_lourd: 0 | 1;
  /** est ce que le plancher haud est considéré comme lourd 0 : non 1 : oui */
  inertie_plancher_haut_lourd: 0 | 1;
  /** est ce que les parois verticales sont considérées comme lourdes 0 : non 1 : oui */
  inertie_paroi_verticale_lourd: 0 | 1;
  /** classe d'inertie globale du bâtiment — Valeurs : 1=très lourde, 2=lourde, 3=moyenne, 4=légère */
  enum_classe_inertie_id: string;
}

export interface XsdLogementEnveloppeMur {
  donnee_entree: XsdLogementEnveloppeMurDonneeEntree;
  donnee_intermediaire: XsdLogementEnveloppeMurDonneeIntermediaire;
}

export interface XsdLogementEnveloppeMurDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference: string;
  /** reference projet de l'objet local non chauffé qui peut être associé à la paroi . Dans le cas d'un espace tampon solarisé cette référence est celle de l'espace tampon. */
  reference_lnc?: string | null;
  /** id de la ligne de la table utilisée pour le calcul du coefficient de reduction des deperditions */
  tv_coef_reduction_deperdition_id?: number | null;
  /** surface aiu : surface des parois du local non chauffé qui donnent sur des locaux chauffés. */
  surface_aiu?: number | null;
  /** surface aue : surface des parois du local non chauffé en contact avec l'extérieur ou le sol */
  surface_aue?: number | null;
  /** configuration de l'adjacence avec local non chauffé : local chauffé (non) isolé/local non chauffé (non) isolé/orientation véranda qui permet de calculer le b — Valeurs : 1=local chauffé non accessible, 2=lc non isolé + lnc non isolé, 3=lc non isolé + lnc isolé, 4=lc isolé + lnc non isolé, 5=lc isolé + lnc isolé, 6=lc isolé + espace tampon solarisé orienté nord, 7=lc isolé + espace tampon solarisé orienté sud, 8=lc isolé + espace tampon solarisé orienté est/ouest, 9=lc non isolé + espace tampon solarisé orienté nord, 10=lc non isolé + espace tampon solarisé orienté… */
  enum_cfg_isolation_lnc_id?: string | null;
  /** type d'adjacence de la paroi — Valeurs : 1=extérieur, 2=paroi enterrée, 3=vide sanitaire, 4=bâtiment ou local à usage autre que d'habitation, 5=terre-plein, 6=sous-sol non chauffé, 7=locaux non chauffés non accessible, 8=garage, 9=cellier, 10=espace tampon solarisé (véranda,loggia fermée), 11=comble fortement ventilé, 12=comble faiblement ventilé, 13=comble très faiblement ventilé, 14=circulation sans ouverture directe sur l'extérieur, 1… */
  enum_type_adjacence_id: string;
  /** orientation du mur — Valeurs : 1=sud, 2=nord, 3=est, 4=ouest, 5=horizontal */
  enum_orientation_id: string;
  /** Surface de paroi opaque + paroi vitrée de la paroi + surface des portes */
  surface_paroi_totale?: number | null;
  /** Surface de paroi opaque (sans baies vitrées sans portes) */
  surface_paroi_opaque: number;
  /** la paroi est elle considérée comme lourde pour le calcul de l'inertie */
  paroi_lourde: 0 | 1;
  /** Coefficient de transmission thermique du mur non isolé Saisi en direct par l'utilisateur (à justifier). Coefficient de transmission thermique du mur non isolé (avec pris en compte de l'enduit et du doublage). C'est bien le U du mur "nu" avec l'ensemble des éléments hors isolations rapportée */
  umur0_saisi?: number | null;
  /** id de la ligne de la table utilisée pour le calcul du Umur0 */
  tv_umur0_id?: number | null;
  /** epaisseur de la partie structure de la paroi (sans l'isolation intérieure ou extérieure) (cm) */
  epaisseur_structure?: number | null;
  /** matériaux de structure de la paroi — Valeurs : 1=inconnu, 2=murs en pierre de taille et moellons constitué d'un seul matériaux, 3=murs en pierre de taille et moellons avec remplissage tout venant, 4=murs en pisé ou béton de terre stabilisé (à partir d'argile crue), 5=murs en pan de bois sans remplissage tout venant, 6=murs en pan de bois avec remplissage tout venant, 7=murs bois (rondin), 8=murs en briques pleines simples, 9=murs en briques pl… */
  enum_materiaux_structure_mur_id: string;
  /** methode de saisie de U0 (inclus les justifications à produire en cas de saisie directe) — Valeurs : 1=type de paroi inconnu (valeur par défaut), 2=déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire, 3=saisie direct u0 justifiée à partir des documents justificatifs autorisés, 4=saisie direct u0 correspondant à la performance de la paroi avec son isolation antérieure iti (umur_iti) lorsqu'il y a une surisolation ite réalisée, 5=u0 non saisi car le u est saisi connu… */
  enum_methode_saisie_u0_id: string;
  /** est ce qu'un enduit isolant est présent sur la paroi si celle-ci est une paroi ancienne (pierres, terre, mur à colombage, brique ancienne)(Renduit=0,7m².K.W-1) 0 : non 1 : oui. (renommage de la propriété paroi_ancienne -> enduit_isolant_paroi_ancienne) */
  enduit_isolant_paroi_ancienne: 0 | 1;
  /** Coefficient de transmission thermique du mur saisi en direct par le diagnostiqueur(à justifier) */
  umur_saisi?: number | null;
  /** type de doublage intérieur du mur.(précision de la nature du doublage ou de l'epaisseur de la lame d'air en cas de doublage indéterminé.) — Valeurs : 1=inconnu, 2=absence de doublage, 3=doublage indéterminé ou lame d'air inf 15 mm, 4=doublage indéterminé avec lame d'air sup 15 mm, 5=doublage connu (plâtre brique bois) */
  enum_type_doublage_id: string;
  /** type d'isolation du mur (ITI/ITE…..) — Valeurs : 1=inconnu, 2=non isolé, 3=iti, 4=ite, 5=itr, 6=iti+ite, 7=iti+itr, 8=ite+itr, 9=isolé mais type d'isolation inconnu */
  enum_type_isolation_id: string;
  /** periode d'isolation à saisir si différent de la période de construction (cas d'une rénovation de la paroi) — Valeurs : 1=avant 1948, 2=1948-1974, 3=1975-1977, 4=1978-1982, 5=1983-1988, 6=1989-2000, 7=2001-2005, 8=2006-2012, 9=2013-2021, 10=après 2021 */
  enum_periode_isolation_id?: string | null;
  /** resistance isolation */
  resistance_isolation?: number | null;
  /** epaisseur de l'isolation (si plusieurs isolant différents sommer leurs épaisseurs) (cm) */
  epaisseur_isolation?: number | null;
  /** id de la ligne de la table utilisée pour le calcul du coefficient de transmission thermique umur */
  tv_umur_id?: number | null;
  /** methode de saisie du U (inclus les justifications à produire en cas de saisie directe) — Valeurs : 1=non isolé, 2=isolation inconnue (table forfaitaire), 3=epaisseur isolation saisie justifiée par mesure ou observation, 4=epaisseur isolation saisie justifiée à partir des documents justificatifs autorisés, 5=resistance isolation saisie justifiée observation de l'isolant installé et mesure de son épaisseur, 6=resistance isolation saisie justifiée à partir des documents justificatifs autorisés, 7=… */
  enum_methode_saisie_u_id: string;
}

export interface XsdLogementEnveloppeMurDonneeIntermediaire {
  /** coefficient de réduction des déperditions du mur */
  b: number;
  /** Coefficient de transmission thermique du mur */
  umur: number;
  /** Coefficient de transmission thermique du mur non isolé final (avec pris en compte de l'enduit et du doublage). C'est bien le U du mur "nu" avec l'ensemble des éléments hors isolations rapportée */
  umur0?: number | null;
}

export interface XsdLogementEnveloppePlancherBas {
  donnee_entree: XsdLogementEnveloppePlancherBasDonneeEntree;
  donnee_intermediaire: XsdLogementEnveloppePlancherBasDonneeIntermediaire;
}

export interface XsdLogementEnveloppePlancherBasDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference: string;
  /** reference projet de l'objet local non chauffé qui peut être associé à la paroi . Dans le cas d'un espace tampon solarisé cette référence est celle de l'espace tampon. */
  reference_lnc?: string | null;
  /** id de la ligne de la table utilisée pour le calcul de coefficient de reduction des déperditions */
  tv_coef_reduction_deperdition_id?: number | null;
  /** surface aiu : surface des parois du local non chauffé qui donnent sur des locaux chauffés. */
  surface_aiu?: number | null;
  /** surface aue : surface des parois du local non chauffé en contact avec l'extérieur ou le sol */
  surface_aue?: number | null;
  /** configuration de l'adjacence avec local non chauffé : local chauffé (non) isolé/local non chauffé (non) isolé/orientation véranda qui permet de calculer le b — Valeurs : 1=local chauffé non accessible, 2=lc non isolé + lnc non isolé, 3=lc non isolé + lnc isolé, 4=lc isolé + lnc non isolé, 5=lc isolé + lnc isolé, 6=lc isolé + espace tampon solarisé orienté nord, 7=lc isolé + espace tampon solarisé orienté sud, 8=lc isolé + espace tampon solarisé orienté est/ouest, 9=lc non isolé + espace tampon solarisé orienté nord, 10=lc non isolé + espace tampon solarisé orienté… */
  enum_cfg_isolation_lnc_id?: string | null;
  /** type d'adjacence de la paroi — Valeurs : 1=extérieur, 2=paroi enterrée, 3=vide sanitaire, 4=bâtiment ou local à usage autre que d'habitation, 5=terre-plein, 6=sous-sol non chauffé, 7=locaux non chauffés non accessible, 8=garage, 9=cellier, 10=espace tampon solarisé (véranda,loggia fermée), 11=comble fortement ventilé, 12=comble faiblement ventilé, 13=comble très faiblement ventilé, 14=circulation sans ouverture directe sur l'extérieur, 1… */
  enum_type_adjacence_id: string;
  /** Surface de paroi opaque */
  surface_paroi_opaque: number;
  /** la paroi est elle considérée comme lourde pour le calcul de l'inertie */
  paroi_lourde: 0 | 1;
  /** Coefficient de transmission thermique du planchers bas non isolé Saisi en direct par l'utilisateur (à justifier) */
  upb0_saisi?: number | null;
  /** id de la ligne de la table utilisée pour le calcul du coefficient de transmission thermique upb0 */
  tv_upb0_id?: number | null;
  /** type de plancher bas — Valeurs : 1=inconnu, 2=plancher avec ou sans remplissage, 3=plancher entre solives métalliques avec ou sans remplissage, 4=plancher entre solives bois avec ou sans remplissage, 5=plancher bois sur solives métalliques, 6=bardeaux et remplissage, 7=voutains sur solives métalliques, 8=voutains en briques ou moellons, 9=dalle béton, 10=plancher bois sur solives bois, 11=plancher lourd type entrevous terre-cuite… */
  enum_type_plancher_bas_id: string;
  /** methode de saisie de U0 (inclus les justifications à produire en cas de saisie directe) — Valeurs : 1=type de paroi inconnu (valeur par défaut), 2=déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire, 3=saisie direct u0 justifiée à partir des documents justificatifs autorisés, 4=saisie direct u0 correspondant à la performance de la paroi avec son isolation antérieure iti (umur_iti) lorsqu'il y a une surisolation ite réalisée, 5=u0 non saisi car le u est saisi connu… */
  enum_methode_saisie_u0_id: string;
  /** Coefficient de transmission thermique du planchers_bas saisi en direct par le diagnostiqueur(à justifier) */
  upb_saisi?: number | null;
  /** type d'isolation du plancher bas (ITI/ITE…..) — Valeurs : 1=inconnu, 2=non isolé, 3=iti, 4=ite, 5=itr, 6=iti+ite, 7=iti+itr, 8=ite+itr, 9=isolé mais type d'isolation inconnu */
  enum_type_isolation_id: string;
  /** periode d'isolation à saisir si différent de la période de construction (cas d'une rénovation de la paroi) — Valeurs : 1=avant 1948, 2=1948-1974, 3=1975-1977, 4=1978-1982, 5=1983-1988, 6=1989-2000, 7=2001-2005, 8=2006-2012, 9=2013-2021, 10=après 2021 */
  enum_periode_isolation_id?: string | null;
  /** resistance isolation */
  resistance_isolation?: number | null;
  /** epaisseur de l'isolation (si plusieurs isolant différents sommer leurs épaisseurs) */
  epaisseur_isolation?: number | null;
  /** id de la ligne de la table utilisée pour le calcul du coefficient de transmission thermique upb */
  tv_upb_id?: number | null;
  /** methode de saisie du U (inclus les justifications à produire en cas de saisie directe) — Valeurs : 1=non isolé, 2=isolation inconnue (table forfaitaire), 3=epaisseur isolation saisie justifiée par mesure ou observation, 4=epaisseur isolation saisie justifiée à partir des documents justificatifs autorisés, 5=resistance isolation saisie justifiée observation de l'isolant installé et mesure de son épaisseur, 6=resistance isolation saisie justifiée à partir des documents justificatifs autorisés, 7=… */
  enum_methode_saisie_u_id: string;
  /** est ce que le plancher bas est passé par le calcul du Ue 0 : non 1 : oui */
  calcul_ue: 0 | 1;
  /** périmètredu plancher lorsqu'il est en contact avec un terre plein/sous sol non chauffé ou vide sanitaire (à renseigner lorsque calcul du Ue) */
  perimetre_ue?: number | null;
  /** surface de plancher qui est en contact avec un terre plein/sous sol non chauffé ou vide sanitaire (à renseigner lorsque calcul du Ue) */
  surface_ue?: number | null;
  /** Ue coefficient remplaçant Upb dans le cas sur terre plein */
  ue?: number | null;
}

export interface XsdLogementEnveloppePlancherBasDonneeIntermediaire {
  /** coefficient de réduction des déperditions du planchers_bas */
  b: number;
  /** Coefficient de transmission thermique du planchers_bas Upb */
  upb: number;
  /** Coefficient de transmission thermique du planchers_bas (Ue ou Upb en fonction du type d'adjacence) */
  upb_final: number;
  /** Coefficient de transmission thermique du planchers bas non isolé final */
  upb0?: number | null;
}

export interface XsdLogementEnveloppePlancherHaut {
  donnee_entree: XsdLogementEnveloppePlancherHautDonneeEntree;
  donnee_intermediaire: XsdLogementEnveloppePlancherHautDonneeIntermediaire;
}

export interface XsdLogementEnveloppePlancherHautDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference: string;
  /** reference projet de l'objet local non chauffé qui peut être associé à la paroi . Dans le cas d'un espace tampon solarisé cette référence est celle de l'espace tampon. */
  reference_lnc?: string | null;
  /** id de la ligne de la table utilisée pour le calcul du coefficient de reduction des deperditions */
  tv_coef_reduction_deperdition_id?: number | null;
  /** surface aiu : surface des parois du local non chauffé qui donnent sur des locaux chauffés. */
  surface_aiu?: number | null;
  /** surface aue : surface des parois du local non chauffé en contact avec l'extérieur ou le sol */
  surface_aue?: number | null;
  /** configuration de l'adjacence avec local non chauffé : local chauffé (non) isolé/local non chauffé (non) isolé/orientation véranda qui permet de calculer le b — Valeurs : 1=local chauffé non accessible, 2=lc non isolé + lnc non isolé, 3=lc non isolé + lnc isolé, 4=lc isolé + lnc non isolé, 5=lc isolé + lnc isolé, 6=lc isolé + espace tampon solarisé orienté nord, 7=lc isolé + espace tampon solarisé orienté sud, 8=lc isolé + espace tampon solarisé orienté est/ouest, 9=lc non isolé + espace tampon solarisé orienté nord, 10=lc non isolé + espace tampon solarisé orienté… */
  enum_cfg_isolation_lnc_id?: string | null;
  /** type d'adjacence de la paroi — Valeurs : 1=extérieur, 2=paroi enterrée, 3=vide sanitaire, 4=bâtiment ou local à usage autre que d'habitation, 5=terre-plein, 6=sous-sol non chauffé, 7=locaux non chauffés non accessible, 8=garage, 9=cellier, 10=espace tampon solarisé (véranda,loggia fermée), 11=comble fortement ventilé, 12=comble faiblement ventilé, 13=comble très faiblement ventilé, 14=circulation sans ouverture directe sur l'extérieur, 1… */
  enum_type_adjacence_id: string;
  /** Surface de paroi opaque */
  surface_paroi_opaque: number;
  /** la paroi est elle considérée comme lourde pour le calcul de l'inertie */
  paroi_lourde: 0 | 1;
  /** Coefficient de transmission thermique du planchers hauts non isolé Saisi en direct par l'utilisateur (à justifier) */
  uph0_saisi?: number | null;
  /** id de la ligne de la table utilisée pour le calcul du coefficient de transmission thermique uph0 */
  tv_uph0_id?: number | null;
  /** type de plancher haut — Valeurs : 1=inconnu, 2=plafond avec ou sans remplissage, 3=plafond entre solives métalliques avec ou sans remplissage, 4=plafond entre solives bois avec ou sans remplissage, 5=plafond bois sur solives métalliques, 6=plafond bois sous solives métalliques, 7=bardeaux et remplissage, 8=dalle béton, 9=plafond bois sur solives bois, 10=plafond bois sous solives bois, 11=plafond lourd type entrevous terre-cuite, … */
  enum_type_plancher_haut_id: string;
  /** methode de saisie de U0 (inclus les justifications à produire en cas de saisie directe) — Valeurs : 1=type de paroi inconnu (valeur par défaut), 2=déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire, 3=saisie direct u0 justifiée à partir des documents justificatifs autorisés, 4=saisie direct u0 correspondant à la performance de la paroi avec son isolation antérieure iti (umur_iti) lorsqu'il y a une surisolation ite réalisée, 5=u0 non saisi car le u est saisi connu… */
  enum_methode_saisie_u0_id: string;
  /** Coefficient de transmission thermique du planchers_hauts saisi en direct par le diagnostiqueur(à justifier) */
  uph_saisi?: number | null;
  /** type d'isolation du plancher haut (ITI/ITE…..) — Valeurs : 1=inconnu, 2=non isolé, 3=iti, 4=ite, 5=itr, 6=iti+ite, 7=iti+itr, 8=ite+itr, 9=isolé mais type d'isolation inconnu */
  enum_type_isolation_id: string;
  /** periode d'isolation à saisir si différent de la période de construction (cas d'une rénovation de la paroi) — Valeurs : 1=avant 1948, 2=1948-1974, 3=1975-1977, 4=1978-1982, 5=1983-1988, 6=1989-2000, 7=2001-2005, 8=2006-2012, 9=2013-2021, 10=après 2021 */
  enum_periode_isolation_id?: string | null;
  /** resistance isolation */
  resistance_isolation?: number | null;
  /** epaisseur de l'isolation (si plusieurs isolant différents sommer leurs épaisseurs) */
  epaisseur_isolation?: number | null;
  /** id de la ligne de la table utilisée pour le calcul du coefficient de transmission thermique uph */
  tv_uph_id?: number | null;
  /** methode de saisie du U (inclus les justifications à produire en cas de saisie directe) — Valeurs : 1=non isolé, 2=isolation inconnue (table forfaitaire), 3=epaisseur isolation saisie justifiée par mesure ou observation, 4=epaisseur isolation saisie justifiée à partir des documents justificatifs autorisés, 5=resistance isolation saisie justifiée observation de l'isolant installé et mesure de son épaisseur, 6=resistance isolation saisie justifiée à partir des documents justificatifs autorisés, 7=… */
  enum_methode_saisie_u_id: string;
}

export interface XsdLogementEnveloppePlancherHautDonneeIntermediaire {
  /** coefficient de réduction des déperditions du planchers_hauts */
  b: number;
  /** Coefficient de transmission thermique du planchers_hauts uph */
  uph: number;
  /** Coefficient de transmission thermique du planchers hauts non isolé final */
  uph0?: number | null;
}

export interface XsdLogementEnveloppeBaieVitree {
  donnee_entree: XsdLogementEnveloppeBaieVitreeDonneeEntree;
  donnee_intermediaire: XsdLogementEnveloppeBaieVitreeDonneeIntermediaire;
  baie_vitree_double_fenetre?: XsdLogementEnveloppeBaieVitreeBaieVitreeDoubleFenetre | null;
}

export interface XsdLogementEnveloppeBaieVitreeDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference: string;
  /** reference projet de l'objet paroi qui est associé à l'objet baie vitrée. La codification et utilisation des références peut différer entre logiciels mais il devrait être attendu que reference_paroi est la référence d'une paroi de type mur,plancher_haut ou plancher_bas */
  reference_paroi?: string | null;
  /** reference projet de l'objet local non chauffé qui peut être associé à la paroi . Dans le cas d'un espace tampon solarisé cette référence est celle de l'espace tampon. */
  reference_lnc?: string | null;
  /** id de la ligne de la table utilisée pour le calcul du coefficient de reduction des deperditions */
  tv_coef_reduction_deperdition_id?: number | null;
  /** surface aiu : surface des parois du local non chauffé qui donnent sur des locaux chauffés. */
  surface_aiu?: number | null;
  /** surface aue : surface des parois du local non chauffé en contact avec l'extérieur ou le sol */
  surface_aue?: number | null;
  /** configuration de l'adjacence avec local non chauffé : local chauffé (non) isolé/local non chauffé (non) isolé/orientation véranda qui permet de calculer le b — Valeurs : 1=local chauffé non accessible, 2=lc non isolé + lnc non isolé, 3=lc non isolé + lnc isolé, 4=lc isolé + lnc non isolé, 5=lc isolé + lnc isolé, 6=lc isolé + espace tampon solarisé orienté nord, 7=lc isolé + espace tampon solarisé orienté sud, 8=lc isolé + espace tampon solarisé orienté est/ouest, 9=lc non isolé + espace tampon solarisé orienté nord, 10=lc non isolé + espace tampon solarisé orienté… */
  enum_cfg_isolation_lnc_id?: string | null;
  /** type d'adjacence de la paroi — Valeurs : 1=extérieur, 2=paroi enterrée, 3=vide sanitaire, 4=bâtiment ou local à usage autre que d'habitation, 5=terre-plein, 6=sous-sol non chauffé, 7=locaux non chauffés non accessible, 8=garage, 9=cellier, 10=espace tampon solarisé (véranda,loggia fermée), 11=comble fortement ventilé, 12=comble faiblement ventilé, 13=comble très faiblement ventilé, 14=circulation sans ouverture directe sur l'extérieur, 1… */
  enum_type_adjacence_id: string;
  /** surface totale de paroi vitrée pour ce type de vitrage et sur cette orientation (nombre de baies x surface unitaire). La surface est la surface de la baie dans son ensemble. (vitrage + menuiserie inclus) */
  surface_totale_baie: number;
  /** nombre de baies */
  nb_baie: number;
  /** id de la ligne de la table utilisée pour le calcul du coefficent de transmission thermique du vitrage ug */
  tv_ug_id?: number | null;
  /** type de vitrage — Valeurs : 1=simple vitrage, 2=double vitrage, 3=triple vitrage, 4=survitrage, 5=brique de verre, 6=polycarbonate */
  enum_type_vitrage_id: string;
  /** inclinaison du vitrage — Valeurs : 1=inf25°, 2=25°-75°, 3=sup75°, 4=horizontal */
  enum_inclinaison_vitrage_id: string;
  /** type de gaz présent dans la lame — Valeurs : 1=air, 2=argon ou krypton, 3=inconnu */
  enum_type_gaz_lame_id?: string | null;
  /** epaisseur de la lame */
  epaisseur_lame?: number | null;
  /** est ce que le vitrage est à isolation renforcée 0 : non 1 : oui */
  vitrage_vir?: 0 | 1 | null;
  /** methode de saisie des caractéristiques thermiques des vitrage (valeurs forfaitaires ou saisies en direct lorsque issu d'un justificatif) — Valeurs : 1=ug(opt),uw,ujn(opt) et sw saisi à l'aide des tables de valeurs forfaitaires et des relèves mesurées/observées, 2=ug saisi directementà partir des documents justificatifs autorisés , autres paramètres calculés avec les tables forfaitaires, 3=ug,uw saisi directement à partir des documents justificatifs autorisés , autres paramètres calculés avec les tables forfaitaires, 4=ug,uw,sw saisi directemen… */
  enum_methode_saisie_perf_vitrage_id: string;
  /** coefficient de transmission thermique du vitrage saisi directement (nécessite une justification) */
  ug_saisi?: number | null;
  /** id de la ligne de la table utilisée pour le calcul du coefficent de transmission thermique de la baie uw. Dans le cas d'une interpolation/extrapolation prendre la valeur tabulée la plus proche */
  tv_uw_id?: number | null;
  /** type de matériaux des menuiseries — Valeurs : 1=brique de verre, 2=polycarbonate, 3=bois, 4=bois/métal, 5=pvc, 6=métal avec rupture de pont thermique, 7=métal sans rupture de pont thermique */
  enum_type_materiaux_menuiserie_id: string;
  /** type de baie — Valeurs : 1=paroi en brique de verre pleine, 2=paroi en brique de verre creuse, 3=paroi en polycarbonnate, 4=fenêtres battantes, 5=fenêtres coulissantes, 6=portes-fenêtres coulissantes, 7=portes-fenêtres battantes sans soubassement, 8=portes-fenêtres battantes avec soubassement */
  enum_type_baie_id: string;
  /** coefficient de transmission thermique de la baie saisi directement (nécessite une justification) */
  uw_saisi?: number | null;
  /** est ce qu'il s'agit d'une double fenetre. DANS LE CAS D'UNE DOUBLE FENETRE LES DONNEES DU MODELE SONT FOURNIES POUR LE VITRAGE LE PLUS PERFORMANT OU POUR LA BAIE DANS SON ENSEMBLE A L'EXCEPTION DE Uw2 ET Sw2 QUI SONT LES CARACTERISTIQUES DU DEUXIEME VITRAGE (le moins performant) 0 : non 1 : oui */
  double_fenetre: 0 | 1;
  /** Uw de la première fenêtre dans le cas d'une double fenêtre (par défaut la première fenêtre est toujours celle avec le Uw le plus élevé -> plus performante) */
  uw_1?: number | null;
  /** Sw de la première fenêtre dans le cas d'une double fenêtre (par défaut la première fenêtre est toujours celle avec le Uw le plus élevé -> plus performante) */
  sw_1?: number | null;
  /** Uw de la deuxième fenêtre dans le cas d'une double fenêtre (par défaut la deuxième fenêtre est toujours celle avec le Uw le plus faible -> moins performante) */
  uw_2?: number | null;
  /** Sw de la deuxième fenêtre dans le cas d'une double fenêtre (par défaut la deuxième fenêtre est toujours celle avec le Uw le plus faible -> moins performante) */
  sw_2?: number | null;
  /** id de la ligne de la table utilisée pour le calcul du delta de resistance de la protection mobile. (volets persienne etc..) */
  tv_deltar_id?: number | null;
  /** id de la ligne de la table utilisée pour le calcul du coefficient de transmissiion de la baie jour/nuit Ujn. Dans le cas d'une interpolation/extrapolation prendre la valeur tabulée la plus proche */
  tv_ujn_id?: number | null;
  /** type de fermeture associé à la baie (volets/persiennes etc..) — Valeurs : 1=abscence de fermeture pour la baie vitrée, 2=jalousie accordéon, fermeture à lames orientables y compris les vénitiens extérieurs tout métal, volets battants ou persiennes avec ajours fixes, 3=fermeture sans ajours en position déployée, volets roulants alu, 4=volets roulants pvc ou bois (e inf 12 mm), 5=persienne coulissante et volet battant pvc ou bois (e inf 22 mm), 6=volets roulants pvc ou bo… */
  enum_type_fermeture_id: string;
  /** y a-t-il une protection solaire qui n'est pas considérée comme une fermeture (R=0 pour le calcul de Ujn) mais qui est prise en compte pour le calcul du confort d'été. */
  presence_protection_solaire_hors_fermeture: 0 | 1;
  /** coefficient de transmission thermique de la baie avec ses protection solaires saisi directement (nécessite une justification) */
  ujn_saisi?: number | null;
  /** y a-t-il un retour d'isolant de la paroi opaque sur la baie 0 : non 1 : oui */
  presence_retour_isolation: 0 | 1;
  /** y a-t-il présence de joints sur la baie (utilisé pour le calcul de la perméabilité) 0 : non 1 : oui */
  presence_joint: 0 | 1;
  /** largeur du dormant de la baie (cm) */
  largeur_dormant: number;
  /** id de la ligne de la table utilisée pour le calcul du facteur solaire de la baie sw */
  tv_sw_id?: number | null;
  /** facteur solaire de la baie saisi directement (nécessite une justification) */
  sw_saisi?: number | null;
  /** type de pose de la baie — Valeurs : 1=nu extérieur, 2=nu intérieur, 3=tunnel, 4=sans objet (brique de verre/polycarbonate) */
  enum_type_pose_id: string;
  /** orientation de la baie — Valeurs : 1=sud, 2=nord, 3=est, 4=ouest, 5=horizontal */
  enum_orientation_id: string;
  /** id de la ligne de la table utilisée pour le calcul du coefficent de masque proche */
  tv_coef_masque_proche_id: number;
  /** id de la ligne de la table utilisée pour le calcul du coefficient de masque homogène lointain */
  tv_coef_masque_lointain_homogene_id?: number | null;
  masque_lointain_non_homogene_collection?: {
    masque_lointain_non_homogene:
      | XsdLogementEnveloppeBaieVitreeDonneeEntreeMasqueLointainNonHomogene
      | XsdLogementEnveloppeBaieVitreeDonneeEntreeMasqueLointainNonHomogene[];
  } | null;
}

export interface XsdLogementEnveloppeBaieVitreeDonneeEntreeMasqueLointainNonHomogene {
  /** id de la ligne de la table utilisée pour le calcul du coefficient de masque non homogène lointain */
  tv_coef_masque_lointain_non_homogene_id: number;
}

export interface XsdLogementEnveloppeBaieVitreeDonneeIntermediaire {
  /** coefficient de réduction des déperditions de la baie vitrée */
  b: number;
  /** Ug final de la baie : soit saisi directement soit issu des tables forfaitaires */
  ug?: number | null;
  /** Uw final de la baie : soit saisi directement soit issu des tables forfaitaires */
  uw: number;
  /** Ujn final de la baie : soit saisi directement soit issu des tables forfaitaires */
  ujn?: number | null;
  /** U final de la menuiserie utilisé dans le calcul : soit Ujn dans le cas d'une baie avec protection solaire soit Uw dans le cas d'une baie sans protection solaire */
  u_menuiserie: number;
  /** sw final de la baie: soit saisi directement soit issu des tables forfaitaires */
  sw: number;
  /** fe1 facteur d'ensoleillement calculé à partir de la table sur les masques proches */
  fe1: number;
  /** fe2 facteur d'ensoleillement calculé soit à l'aide de la méthode masque lointain homogène ou méthode des masques lointains proches */
  fe2: number;
}

export interface XsdLogementEnveloppeBaieVitreeBaieVitreeDoubleFenetre {
  donnee_entree: XsdLogementEnveloppeBaieVitreeBaieVitreeDoubleFenetreDonneeEntree;
  donnee_intermediaire: XsdLogementEnveloppeBaieVitreeBaieVitreeDoubleFenetreDonneeIntermediaire;
}

export interface XsdLogementEnveloppeBaieVitreeBaieVitreeDoubleFenetreDonneeEntree {
  /** id de la ligne de la table utilisée pour le calcul du coefficent de transmission thermique du vitrage ug */
  tv_ug_id?: number | null;
  /** type de vitrage — Valeurs : 1=simple vitrage, 2=double vitrage, 3=triple vitrage, 4=survitrage, 5=brique de verre, 6=polycarbonate */
  enum_type_vitrage_id: string;
  /** inclinaison du vitrage — Valeurs : 1=inf25°, 2=25°-75°, 3=sup75°, 4=horizontal */
  enum_inclinaison_vitrage_id: string;
  /** type de gaz présent dans la lame — Valeurs : 1=air, 2=argon ou krypton, 3=inconnu */
  enum_type_gaz_lame_id?: string | null;
  /** epaisseur de la lame */
  epaisseur_lame?: number | null;
  /** est ce que le vitrage est à isolation renforcée 0 : non 1 : oui */
  vitrage_vir?: 0 | 1 | null;
  /** methode de saisie des caractéristiques thermiques des vitrage (valeurs forfaitaires ou saisies en direct lorsque issu d'un justificatif) — Valeurs : 1=ug(opt),uw,ujn(opt) et sw saisi à l'aide des tables de valeurs forfaitaires et des relèves mesurées/observées, 2=ug saisi directementà partir des documents justificatifs autorisés , autres paramètres calculés avec les tables forfaitaires, 3=ug,uw saisi directement à partir des documents justificatifs autorisés , autres paramètres calculés avec les tables forfaitaires, 4=ug,uw,sw saisi directemen… */
  enum_methode_saisie_perf_vitrage_id: string;
  /** coefficient de transmission thermique du vitrage saisi directement (nécessite une justification) */
  ug_saisi?: number | null;
  /** id de la ligne de la table utilisée pour le calcul du coefficent de transmission thermique de la baie uw. Dans le cas d'une interpolation/extrapolation prendre la valeur tabulée la plus proche */
  tv_uw_id?: number | null;
  /** type de matériaux des menuiseries — Valeurs : 1=brique de verre, 2=polycarbonate, 3=bois, 4=bois/métal, 5=pvc, 6=métal avec rupture de pont thermique, 7=métal sans rupture de pont thermique */
  enum_type_materiaux_menuiserie_id: string;
  /** type de baie — Valeurs : 1=paroi en brique de verre pleine, 2=paroi en brique de verre creuse, 3=paroi en polycarbonnate, 4=fenêtres battantes, 5=fenêtres coulissantes, 6=portes-fenêtres coulissantes, 7=portes-fenêtres battantes sans soubassement, 8=portes-fenêtres battantes avec soubassement */
  enum_type_baie_id: string;
  /** coefficient de transmission thermique de la baie saisi directement (nécessite une justification) */
  uw_saisi?: number | null;
  /** id de la ligne de la table utilisée pour le calcul du facteur solaire de la baie sw */
  tv_sw_id?: number | null;
  /** facteur solaire de la baie saisi directement (nécessite une justification) */
  sw_saisi?: number | null;
  /** type de pose de la baie — Valeurs : 1=nu extérieur, 2=nu intérieur, 3=tunnel, 4=sans objet (brique de verre/polycarbonate) */
  enum_type_pose_id: string;
}

export interface XsdLogementEnveloppeBaieVitreeBaieVitreeDoubleFenetreDonneeIntermediaire {
  /** Ug final de la baie : soit saisi directement soit issu des tables forfaitaires */
  ug?: number | null;
  /** Uw final de la baie : soit saisi directement soit issu des tables forfaitaires */
  uw: number;
  /** sw final de la baie: soit saisi directement soit issu des tables forfaitaires */
  sw: number;
}

export interface XsdLogementEnveloppePorte {
  donnee_entree: XsdLogementEnveloppePorteDonneeEntree;
  donnee_intermediaire: XsdLogementEnveloppePorteDonneeIntermediaire;
}

export interface XsdLogementEnveloppePorteDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference: string;
  /** reference projet de l'objet paroi qui est associé à l'objet porte. La codification et utilisation des références peut différer entre logiciels mais il devrait être attendu que reference_paroi est la référence d'une paroi de type mur,plancher_haut ou plancher_bas */
  reference_paroi?: string | null;
  /** reference projet de l'objet local non chauffé qui peut être associé à la paroi . Dans le cas d'un espace tampon solarisé cette référence est celle de l'espace tampon. */
  reference_lnc?: string | null;
  /** configuration de l'adjacence avec local non chauffé : local chauffé (non) isolé/local non chauffé (non) isolé/orientation véranda qui permet de calculer le b — Valeurs : 1=local chauffé non accessible, 2=lc non isolé + lnc non isolé, 3=lc non isolé + lnc isolé, 4=lc isolé + lnc non isolé, 5=lc isolé + lnc isolé, 6=lc isolé + espace tampon solarisé orienté nord, 7=lc isolé + espace tampon solarisé orienté sud, 8=lc isolé + espace tampon solarisé orienté est/ouest, 9=lc non isolé + espace tampon solarisé orienté nord, 10=lc non isolé + espace tampon solarisé orienté… */
  enum_cfg_isolation_lnc_id?: string | null;
  /** type d'adjacence de la paroi — Valeurs : 1=extérieur, 2=paroi enterrée, 3=vide sanitaire, 4=bâtiment ou local à usage autre que d'habitation, 5=terre-plein, 6=sous-sol non chauffé, 7=locaux non chauffés non accessible, 8=garage, 9=cellier, 10=espace tampon solarisé (véranda,loggia fermée), 11=comble fortement ventilé, 12=comble faiblement ventilé, 13=comble très faiblement ventilé, 14=circulation sans ouverture directe sur l'extérieur, 1… */
  enum_type_adjacence_id: string;
  /** id de la ligne de la table utilisée pour le calcul du coefficient de reduction des deperditions */
  tv_coef_reduction_deperdition_id?: number | null;
  /** surface aiu : surface des parois du local non chauffé qui donnent sur des locaux chauffés. */
  surface_aiu?: number | null;
  /** surface aue : surface des parois du local non chauffé en contact avec l'extérieur ou le sol */
  surface_aue?: number | null;
  /** surface totale de portes déclaré (nb_porte x surface unitaire de porte dans le cas de plusieurs portes) */
  surface_porte: number;
  /** id de la ligne de la table utilisée pour le calcul du coefficient de transfert thermique de la porte */
  tv_uporte_id?: number | null;
  /** méthode de saisie du U de la porte — Valeurs : 1=valeur forfaitaire, 2=valeur justifiée saisie à partir des documents justificatifs autorisés, 3=saisie direct u depuis rset/rsee( etude rt2012/re2020) */
  enum_methode_saisie_uporte_id: string;
  /** type de porte — Valeurs : 1=porte simple en bois porte opaque pleine, 2=porte simple en bois porte avec moins de 30% de vitrage simple, 3=porte simple en bois porte avec 30-60% de vitrage simple, 4=porte simple en bois porte avec double vitrage, 5=porte simple en pvc porte opaque pleine, 6=porte simple en pvc porte avec moins de 30% de vitrage simple, 7=porte simple en pvc porte avec 30-60% de vitrage simple, 8=porte simpl… */
  enum_type_porte_id: string;
  /** coefficient de transmission thermique de la porte saisi directement (nécessite une justification) */
  uporte_saisi?: number | null;
  /** nombre de portes */
  nb_porte?: number | null;
  /** largeur du dormant de la porte (cm) */
  largeur_dormant?: number | null;
  /** y a-t-il un retour d'isolant de la paroi opaque sur la porte 0 : non 1 : oui */
  presence_retour_isolation?: 0 | 1 | null;
  /** y a-t-il présence de joints sur la porte (utilisé pour le calcul de la perméabilité) 0 : non 1 : oui */
  presence_joint: 0 | 1;
  /** type de pose de la porte — Valeurs : 1=nu extérieur, 2=nu intérieur, 3=tunnel, 4=sans objet (brique de verre/polycarbonate) */
  enum_type_pose_id: string;
}

export interface XsdLogementEnveloppePorteDonneeIntermediaire {
  /** coefficient de transmission thermique de la porte final : soit saisi directement soit issu des tables de valeurs forfaitaires */
  uporte: number;
  /** coefficient de transmission thermique de la porte final : soit saisi directement soit issu des tables de valeurs forfaitaires */
  b: number;
}

export interface XsdLogementEnveloppeEts {
  baie_ets_collection: {
    baie_ets: XsdLogementEnveloppeEtsBaieEts | XsdLogementEnveloppeEtsBaieEts[];
  };
  donnee_entree: XsdLogementEnveloppeEtsDonneeEntree;
  donnee_intermediaire: XsdLogementEnveloppeEtsDonneeIntermediaire;
}

export interface XsdLogementEnveloppeEtsBaieEts {
  donnee_entree: XsdLogementEnveloppeEtsBaieEtsDonneeEntree;
}

export interface XsdLogementEnveloppeEtsBaieEtsDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference: string;
  /** orientation de la baie — Valeurs : 1=sud, 2=nord, 3=est, 4=ouest, 5=horizontal */
  enum_orientation_id: string;
  /** inclinaison du vitrage — Valeurs : 1=inf25°, 2=25°-75°, 3=sup75°, 4=horizontal */
  enum_inclinaison_vitrage_id: string;
  /** surface totale de paroi vitrée pour ce type de vitrage et sur cette orientation (nombre de baies x surface unitaire). La surface est la surface de la baie dans son ensemble. (vitrage + menuiserie inclus) */
  surface_totale_baie: number;
  /** nombre de baies */
  nb_baie: number;
}

export interface XsdLogementEnveloppeEtsDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference: string;
  /** id de la ligne de la table utilisée pour le calcul du coefficient de reduction des deperditions */
  tv_coef_reduction_deperdition_id?: number | null;
  /** configuration de l'adjacence avec local non chauffé : local chauffé (non) isolé/local non chauffé (non) isolé/orientation véranda qui permet de calculer le b — Valeurs : 1=local chauffé non accessible, 2=lc non isolé + lnc non isolé, 3=lc non isolé + lnc isolé, 4=lc isolé + lnc non isolé, 5=lc isolé + lnc isolé, 6=lc isolé + espace tampon solarisé orienté nord, 7=lc isolé + espace tampon solarisé orienté sud, 8=lc isolé + espace tampon solarisé orienté est/ouest, 9=lc non isolé + espace tampon solarisé orienté nord, 10=lc non isolé + espace tampon solarisé orienté… */
  enum_cfg_isolation_lnc_id: string;
  /** id de la ligne de la table utilisée pour le calcul du coefficient de transparence de l'espace tampon solarisé */
  tv_coef_transparence_ets_id: number;
}

export interface XsdLogementEnveloppeEtsDonneeIntermediaire {
  /** coefficient de transparence de l'espace tampon solarisé T (déterminé à partir des parois vitrées de l'espace tampon solarisé) */
  coef_transparence_ets: number;
  /** coefficient de reduction des déperditions de l'espace tampon solarisé */
  bver: number;
}

export interface XsdLogementEnveloppePontThermique {
  donnee_entree: XsdLogementEnveloppePontThermiqueDonneeEntree;
  donnee_intermediaire: XsdLogementEnveloppePontThermiqueDonneeIntermediaire;
}

export interface XsdLogementEnveloppePontThermiqueDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference: string;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels. Pour les ponts thermique il est laissé la possibilité d'avoir 2 références complémentaires correspondant aux référence de chacun des deux objets concernés par le pont thermique */
  reference_1?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels. Pour les ponts thermique il est laissé la possibilité d'avoir 2 références complémentaires correspondant aux référence de chacun des deux objets concernés par le pont thermique */
  reference_2?: string | null;
  /** id de la ligne de la table utilisée pour le calcul de la valeur du pont thermique k */
  tv_pont_thermique_id?: number | null;
  /** pourcentage de prise en compte de la valeur du pont thermique (dans le cas des pont thermiques refend/mur et plancher intermediaire/mur cette valeur est à 0,5 au lieu de 1) */
  pourcentage_valeur_pont_thermique: number;
  /** longueur du pont thermique(m) */
  l: number;
  /** methode de saisie des ponts thermiques — Valeurs : 1=valeur forfaitaire, 2=valeur justifiée saisie à partir des documents justificatifs autorisés, 3=saisie direct k depuis rset/rsee( etude rt2012/re2020) */
  enum_methode_saisie_pont_thermique_id: string;
  /** type de liaison de pont thermique — Valeurs : 1=plancher bas / mur, 2=plancher intermédiaire lourd / mur, 3=plancher haut lourd / mur, 4=refend / mur, 5=menuiserie / mur */
  enum_type_liaison_id: string;
  /** valeur du pont thermique saisie */
  k_saisi?: number | null;
}

export interface XsdLogementEnveloppePontThermiqueDonneeIntermediaire {
  /** valeur du pont thermique */
  k: number;
}

export interface XsdLogementVentilation {
  donnee_entree: XsdLogementVentilationDonneeEntree;
  donnee_intermediaire: XsdLogementVentilationDonneeIntermediaire;
}

export interface XsdLogementVentilationDonneeEntree {
  /** surface ventilée. Dans le cas d'une seule ventilation c'est la surface habitable totale. Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la surface de l'installation à l'immeuble qu'il faut renseigner */
  surface_ventile: number;
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference: string;
  /** est ce qu'il y a plusieurs facades exposées au vent 0 : non 1 : oui */
  plusieurs_facade_exposee: 0 | 1;
  /** id de la ligne de la table utilisée pour le calcul du q4pa conventionnel. valeur conventionnelle de la perméabilité sous 4Pa (m3/(h.m2)) */
  tv_q4pa_conv_id?: number | null;
  /** q4paconv saisi directement quand la valeur est donnée par une mesure d'étanchéité à l'air. valeur conventionnelle de la perméabilité sous 4Pa (m3/(h.m2)) */
  q4pa_conv_saisi?: number | null;
  /** code de la methode de saisie du q4paconv — Valeurs : 1=valeur forfaitaire, 2=déterminé à partir d'une mesure d'étanchéité à l'air de moins de deux ans, 3=déterminé à partir du rset/rsee( etude rt2012/re2020) */
  enum_methode_saisie_q4pa_conv_id: string;
  /** code de la méthode de détermination de la puissance moyenne des auxiliaires de ventilation — Valeurs : 1=valeur forfaitaire, 2=déterminé à partir de la plaque signalétique ou d'une documentation technique du système, 3=déterminé à partir du rset/rsee (étude rt2012/re2020) */
  enum_methode_saisie_pvent_moy_id?: string | null;
  /** id de la ligne de la table utilisée pour le calcul des débits de ventilations */
  tv_debits_ventilation_id: number;
  /** code du type de ventilation — Valeurs : 1=aération par ouverture des fenêtres, 2=ventilation par entrées d'air hautes et basses, 3=vmc sf auto réglable avant 1982, 4=vmc sf auto réglable de 1982 à 2000, 5=vmc sf auto réglable de 2001 à 2012, 6=vmc sf auto réglable après 2012, 7=vmc sf hygro a avant 2001, 8=vmc sf hygro a de 2001 à 2012, 9=vmc sf hygro a après 2012, 10=vmc sf gaz avant 2001, 11=vmc sf gaz de 2001 à 2012, 12=vmc sf gaz ap… */
  enum_type_ventilation_id: string;
  /** est ce que le système de ventilation est postérieur à 2012 0 : non 1 : oui */
  ventilation_post_2012: 0 | 1;
  /** référence produit et marque du système de ventilation */
  ref_produit_ventilation?: string | null;
  /** clé de répartition pour passer des consommations bâtiments au consommation logement dans le cas DPE appartement calculé à partir du DPE immeuble UNIQUEMENT. Voir section 8.5.4 du document guide pour plus de détail. Pour la ventilation il s'agit du rapport surface habitable logement / surface habitable immeuble */
  cle_repartition_ventilation?: number | null;
}

export interface XsdLogementVentilationDonneeIntermediaire {
  /** puissance de la ventilation moyenne soit saisie soit calculée avec la méthode proposée */
  pvent_moy?: number | null;
  /** q4pa conv final soit issue d'une saisie de mesure à l'étanchéité à l'air soit d'une valeur forfaitaire. valeur conventionnelle de la perméabilité sous 4Pa (m3/(h.m2)) */
  q4pa_conv: number;
  /** Consommation des auxilliaires de ventilation. Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation de l'installation à l'immeuble qu'il faut saisir. */
  conso_auxiliaire_ventilation: number;
  /** déperdition thermique par renouvellement d'air due au vent */
  hperm: number;
  /** déperdition thermique par renouvellement d'air due au système de ventilation */
  hvent: number;
}

export interface XsdLogementClimatisation {
  donnee_entree: XsdLogementClimatisationDonneeEntree;
  donnee_intermediaire: XsdLogementClimatisationDonneeIntermediaire;
}

export interface XsdLogementClimatisationDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference: string;
  /** surface climatisée : si le logement n'est pas climatisé dans son ensemble la surface climatisée peut être inférieure à la surface totale du logement.Dans le cas spécifique d'un DPE immeuble avec installation individuelle échantillonée :saisir la surface climatisée par la totalité des logements représentés par le logement moyen surface_clim = Shmoy*Nblgt. Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la surface de l'installation à l'immeuble qu'il faut renseigner */
  surface_clim: number;
  /** id de la ligne de la table utilisée pour le calcul du coefficient d'efficience énergétique du système de climatisation seer */
  tv_seer_id?: 1 | 2 | 4 | 5 | 7 | 8 | null;
  /** nombre de logements représentés par le logement échantillon dans le cas d'un DPE immeuble avec installation de climatisation individuelle. (à ne renseigner que dans ce cas précis) */
  nombre_logement_echantillon?: number | null;
  /** méthode de calcul de consommation de froid : simple, ou cas particuliers installation collective virtualisée ou installation individuelle échantilonnée (dpe immeuble) — Valeurs : 1=calcul simple, 2=installation collective rapportée à un logement : cas générateur à combustion virtuel ou ecs collective virtuelle, 3=installation collective rapportée à un logement : cas générateurs simples (réseau de chaleur, effet joule, pac, cet), 4=échantillonage des installations individuelles pour le calcul dpe immeuble (calcul effectué sur un logement représentatif d'un ensemble de logem… */
  enum_methode_calcul_conso_id: string;
  /** période d'installation du système de refroidissement — Valeurs : 1=avant 2008, 2=2008-2014, 3=a partir de 2015 */
  enum_periode_installation_fr_id: string;
  /** clé de répartition pour passer des consommations bâtiments au consommation logement dans le cas DPE appartement calculé à partir du DPE immeuble UNIQUEMENT. Voir section 8.5.4 du document guide pour plus de détail. */
  cle_repartition_clim?: number | null;
  /** type de générateur de froid — Valeurs : 1=pac air/air installée avant 2008, 2=pac air/air installée entre 2008 et 2014, 3=pac air/air installée à partir de 2015, 4=pac air/eau installée avant 2008, 5=pac air/eau installée entre 2008 et 2014, 6=pac air/eau installée entre 2015 et 2016, 7=pac air/eau installée après 2017, 8=pac eau/eau installée avant 2008, 9=pac eau/eau installée entre 2008 et 2014, 10=pac eau/eau installée entre 2015 et… */
  enum_type_generateur_fr_id: string;
  /** type d'énergie consommée par le générateur de froid — Valeurs : 1=électricité, 2=gaz naturel, 3=fioul domestique, 4=bois – bûches, 5=bois – granulés (pellets) ou briquettes, 6=bois – plaquettes forestières, 7=bois – plaquettes d’industrie, 8=réseau de chauffage urbain, 9=propane, 10=butane, 11=charbon, 12=électricité d'origine renouvelable utilisée dans le bâtiment, 13=gpl, 14=autre combustible fossile, 15=réseau de froid urbain */
  enum_type_energie_id?: string | null;
  /** identifiant réseau de froid utilisé (utilisé à partir du 18 janvier 2022). Cet identifiant doit correspondre à un identifiant déclaré dans la liste des réseaux de chaleurs spécifiés dans l'arrêté en vigueur qui modifie l'annexe 7 de l'arrêté du 15 septembre 2006 relatif au diagnostic de performance energétique */
  identifiant_reseau_chaleur?: string | null;
  /** date de l'arrêté relatif au réseau de chaleur ou de froid utilisé */
  date_arrete_reseau_chaleur?: string | null;
  /** methode de saisie du seer : lecture de table forfaitaire ou saisie justifiée — Valeurs : 1=valeurs forfaitaires, 2=caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, autres données forfaitaires, 3=caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, rpn,rpint, autres données forfaitaires, 4=caractéristiques saisies à partir de la plaque signalét… */
  enum_methode_saisie_carac_sys_id: string;
  /** référence produit et marque du générateur de froid */
  ref_produit_fr?: string | null;
  /** Estimation de la durée de vie restante du système de climatisation, en années. Donnée facultative réservée à l'état initial et à renseigner uniquement si le système existe. */
  clim_duree_vie_restante: number;
}

export interface XsdLogementClimatisationDonneeIntermediaire {
  /** coefficient d'efficience energétique du système de climatisation final (SEER *0,95) */
  eer: number;
  /** besoin de refroidissement annuel. Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est le besoin de l'installation à l'immeuble qu'il faut saisir. */
  besoin_fr: number;
  /** consommation de refroidissement annuel (kWh). Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation de l'installation à l'immeuble qu'il faut saisir. */
  conso_fr: number;
  /** consommation de refroidissement annuel pour le scénario dépensier (kWh) . Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation de l'installation à l'immeuble qu'il faut saisir. */
  conso_fr_depensier: number;
}

export interface XsdLogementProductionElecEnr {
  donnee_entree: XsdLogementProductionElecEnrDonneeEntree;
  donnee_intermediaire?: XsdLogementProductionElecEnrDonneeIntermediaire | null;
  panneaux_pv_collection: {
    panneaux_pv?: XsdLogementProductionElecEnrPanneauxPv | XsdLogementProductionElecEnrPanneauxPv[];
  };
}

export interface XsdLogementProductionElecEnrDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference: string;
  /** est ce qu'il y a de la production de photovoltaique renouvelable 0 : non 1 : oui */
  presence_production_pv: 0 | 1;
  /** enumérateur listant les systèmes de production d'éléctricité d'origine renouvelables présents dans le bâtiment — Valeurs : 1=solaire photovoltaïque, 2=eolien, 3=solaire photovoltaïque + eolien, 4=cogénération, 5=solaire photovoltaïque + cogénération, 6=eolien + cogénération, 7=solaire photovoltaïque + eolien + cogénération */
  enum_type_enr_id: string;
}

export interface XsdLogementProductionElecEnrDonneeIntermediaire {
  /** taux d'autoproduction Tap de la production d'éléctricité d'origne renouvelable */
  taux_autoproduction?: number | null;
  /** production d'éléctricité photovoltaique (kWh) */
  production_pv: number;
  /** éléctricité photovoltaique autoconsommée (kWh) */
  conso_elec_ac: number;
}

export interface XsdLogementProductionElecEnrPanneauxPv {
  /** surface totale de capteurs photovoltaïque. Dans le cas d'une installation collective de PV pour un DPE appartement, la surface est celle proratisé */
  surface_totale_capteurs?: number | null;
  /** ratio de virtualisation de l'installation PV collective lorsque l'on rapporte des usages collectifs à un appartement (a = Shabappartement/Shabtotale) */
  ratio_virtualisation?: number | null;
  /** nombre de modules photovoltaïque standards posés. */
  nombre_module?: number | null;
  /** id de la ligne de la table utilisée pour le calcul du coefficient d'orientation des panneaux photovoltaïques */
  tv_coef_orientation_pv_id?: number | null;
  /** orientation des panneaux photovoltaïques — Valeurs : 1=est, 2=sud-est, 3=sud, 4=sud-ouest, 5=ouest */
  enum_orientation_pv_id?: string | null;
  /** inclinaison des panneaux photovoltaïques — Valeurs : 1=≤ 15°, 2=15° < ≤ 45°, 3=45° < ≤ 75°, 4=> 75° */
  enum_inclinaison_pv_id?: string | null;
}

export interface XsdLogementInstallationEcs {
  donnee_entree: XsdLogementInstallationEcsDonneeEntree;
  donnee_intermediaire: XsdLogementInstallationEcsDonneeIntermediaire;
  generateur_ecs_collection: { generateur_ecs: XsdLogementInstallationEcsGenerateurEcs[] };
}

export interface XsdLogementInstallationEcsDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference: string;
  /** code de configuration de l'installation d'ECS (installation simple, avec solaire ou avec plusieurs systèmes d'ECS) — Valeurs : 1=un seul système d'ecs sans solaire, 2=un seul système d'ecs avec solaire, 3=deux systèmes d'ecs dans une maison ou un appartement */
  enum_cfg_installation_ecs_id: string;
  /** code du type d'installation d'ECS (collective ou individuelle) — Valeurs : 1=installation individuelle, 2=installation collective, 3=installation collective multi-bâtiment : modélisée comme un réseau de chaleur, 4=installation hybride collective-individuelle (chauffage base + appoint individuel ou convecteur bi-jonction) */
  enum_type_installation_id: string;
  /** méthode de calcul de consommation d'ECS : simple, ou cas particuliers installation collective virtualisée ou installation individuelle échantilonnée (dpe immeuble) — Valeurs : 1=calcul simple, 2=installation collective rapportée à un logement : cas générateur à combustion virtuel ou ecs collective virtuelle, 3=installation collective rapportée à un logement : cas générateurs simples (réseau de chaleur, effet joule, pac, cet), 4=échantillonage des installations individuelles pour le calcul dpe immeuble (calcul effectué sur un logement représentatif d'un ensemble de logem… */
  enum_methode_calcul_conso_id: string;
  /** ratio de virtualisation de l'installation collective lorsque l'on rapporte des usages collectifs à un appartement (a = Shabappartement/Shabtotale) */
  ratio_virtualisation?: number | null;
  /** clé de répartition pour passer des consommations bâtiments au consommation logement dans le cas DPE appartement calculé à partir du DPE immeuble UNIQUEMENT. Voir section 8.5.4 du document guide pour plus de détail */
  cle_repartition_ecs?: number | null;
  /** surface habitable correspondant au(x) logement(x) desservi(s) par l'installation d'ECS.(surface habitable du logement ou de la totalité des logements de l'immeuble) Dans le cas spécifique d'un DPE immeuble avec installation individuelle échantillonée :saisir la surface de la totalité des logements représentés par le logement moyen surface_habitable= Shmoy*Nblgt. Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la surface de l'installation à l'immeuble qu'il faut renseigner */
  surface_habitable: number;
  /** nombre de logements desservis par l'installation d'ECS. Dans le cas d'un DPE immeuble avec installation individuelle échantillonée : saisir le nombre de logements qui sont équipés de ce type d'installation d'ECS. */
  nombre_logement: number;
  /** nombre d'installations identiques. Ce paramètre est utilisé pour dénombrer les installations identiques considérées lors d'un calcul d'échantillonage. Ce nombre peut être non entier en cas d'application de la méthode d'échantillonage (pour une installation sans échantillonage rdim=1) */
  rdim: number;
  /** nombre de niveaux desservis par l'installation d'ECS (très souvent égal au nombre de niveaux du bâtiment) */
  nombre_niveau_installation_ecs: number;
  /** facteur de couverture solaire pour l'ECS saisi directement lorsque celui-ci peut être justifié */
  fecs_saisi?: number | null;
  /** id de la ligne de la table utilisée pour le calcul du facteur de couverture solaire */
  tv_facteur_couverture_solaire_id?:
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 25
    | 26
    | 27
    | 28
    | 29
    | 30
    | 31
    | 32
    | 49
    | 50
    | 51
    | 52
    | 53
    | 54
    | 55
    | 56
    | 57
    | 58
    | 59
    | 60
    | 61
    | 62
    | 63
    | 64
    | 65
    | 66
    | 67
    | 68
    | 69
    | 70
    | 71
    | 72
    | null;
  /** méthode de saisie du facteur de couverture solaire pour l'ECS (saisi en direct justifié ou calculé à partir de la table) — Valeurs : 1=valeur forfaitaire, 2=déterminé à partir d'un document justificatif autorisé */
  enum_methode_saisie_fact_couv_sol_id?: string | null;
  /** type d'installation solaire (ECS+Chauffage , ECS solaire seule etc…) — Valeurs : 1=chauffage solaire (seul ou combiné), 2=ecs solaire seule sup 5 ans, 3=ecs solaire seule inf 5 ans, 4=chauffage + ecs solaire, 5=ecs solaire seule */
  enum_type_installation_solaire_id?: string | null;
  /** id de la ligne de la table utilisée pour le calcul du rendement de distribution de l'installation d'ECS */
  tv_rendement_distribution_ecs_id: number;
  /** type de bouclage du réseau d'ECS pour la prise en compte des consommations d'auxiliaires de distribution — Valeurs : 1=réseau d'ecs non bouclé, 2=réseau d'ecs bouclé, 3=réseau d'ecs avec présence d'un traceur chauffant, 4=réseau d'ecs avec module thermique d'appartement (mta) */
  enum_bouclage_reseau_ecs_id: string;
  /** est ce que le réseau de distribution est isolé 0 : non 1 : oui */
  reseau_distribution_isole?: 0 | 1 | null;
  /** présence d'un système de récupération de chaleur sur eaux grises associé à l'installation d'ECS. 0 : non 1 : oui */
  presence_rceg?: 0 | 1 | null;
  /** méthode de détermination des facteurs de récupération de chaleur sur eaux grises — Valeurs : 1=valeur forfaitaire, 2=déterminé à partir d'un document justificatif autorisé */
  enum_methode_saisie_rceg_id?: string | null;
  /** efficacité de l'échangeur du système de récupération de chaleur sur eaux grises à iso-débit, saisie à partir d'un document justificatif autorisé */
  fech_saisi?: number | null;
  /** coefficient transitoire du système de récupération de chaleur sur eaux grises, saisi à partir d'un document justificatif autorisé */
  ftrans_saisi?: number | null;
}

export interface XsdLogementInstallationEcsDonneeIntermediaire {
  /** rendement de distribution de l'installation d'ECS (0-1) */
  rendement_distribution: number;
  /** besoin d'ECS annuel pour l'ensemble de l'installation (kWh). Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation de l'installation à l'immeuble qu'il faut saisir. */
  besoin_ecs: number;
  /** besoin d'ECS annuel pour l'ensemble de l'installation dans le cas du scénario dépensier (kWh). Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation de l'installation à l'immeuble qu'il faut saisir. */
  besoin_ecs_depensier: number;
  /** besoin d'ECS annuel pour l'ensemble de l'installation (kWh), adjusté selon les gains d'énergie récupérés (RCEG). Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation de l'installation à l'immeuble qu'il faut saisir. */
  besoin_ecs_rceg?: number | null;
  /** facteur de couverture solaire de l'ECS */
  fecs?: number | null;
  /** production d'ecs solaire annuelle (kWh). Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation de l'installation à l'immeuble qu'il faut saisir. */
  production_ecs_solaire?: number | null;
  /** consommation d'energie annuelle de l'installation d'ECS en energie finale kWh. Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation de l'installation à l'immeuble qu'il faut saisir. */
  conso_ecs: number;
  /** consommation d'energie annuelle de l'installation d'ECS pour le scénario dépensier en energie finale kWh. Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation de l'installation à l'immeuble qu'il faut saisir. */
  conso_ecs_depensier: number;
  /** facteur de couverture F_ecs_eg = 0.92 * F_trans * F_ech utilisé pour corriger le besoin ECS. */
  fecs_rceg?: number | null;
}

export interface XsdLogementInstallationEcsGenerateurEcs {
  donnee_entree: XsdLogementInstallationEcsGenerateurEcsDonneeEntree;
  donnee_intermediaire: XsdLogementInstallationEcsGenerateurEcsDonneeIntermediaire;
}

export interface XsdLogementInstallationEcsGenerateurEcsDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference: string;
  /** référence commune pour un générateur mixte chauffage ECS. Cette référence est identique pour les deux parties du générateur (chauffage et ECS) et est utilisé pour faire le lien entre les deux */
  reference_generateur_mixte?: string | null;
  /** type de generateur d'ecs — Valeurs : 1=cet sur air ambiant (sur local non chauffé) avant 2010, 2=cet sur air ambiant (sur local non chauffé) 2010-2014, 3=cet sur air ambiant (sur local non chauffé) 2015-2026, 4=cet sur air extérieur avant 2010, 5=cet sur air extérieur 2010-2014, 6=cet sur air extérieur 2015-2026, 7=cet sur air extrait avant 2010, 8=cet sur air extrait 2010-2014, 9=cet sur air extrait 2015-2026, 10=pac double service … */
  enum_type_generateur_ecs_id: string;
  /** référence produit et marque du générateur d'ECS */
  ref_produit_generateur_ecs?: string | null;
  /** usages assurés par le générateur (chauffage/ecs/chauffage+ecs) — Valeurs : 1=chauffage, 2=ecs, 3=chauffage + ecs */
  enum_usage_generateur_id: string;
  /** type d'énergie consommée par le générateur d'ECS — Valeurs : 1=électricité, 2=gaz naturel, 3=fioul domestique, 4=bois – bûches, 5=bois – granulés (pellets) ou briquettes, 6=bois – plaquettes forestières, 7=bois – plaquettes d’industrie, 8=réseau de chauffage urbain, 9=propane, 10=butane, 11=charbon, 12=électricité d'origine renouvelable utilisée dans le bâtiment, 13=gpl, 14=autre combustible fossile, 15=réseau de froid urbain */
  enum_type_energie_id: string;
  /** id de la ligne de la table utilisée pour le calcul des paramètres du générateur à combustion Rpn,Rpint,Qp0,Pveil */
  tv_generateur_combustion_id?: number | null;
  /** méthode de saisie des performances du système d'ECS — Valeurs : 1=valeurs forfaitaires, 2=caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, autres données forfaitaires, 3=caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, rpn,rpint, autres données forfaitaires, 4=caractéristiques saisies à partir de la plaque signalét… */
  enum_methode_saisie_carac_sys_id: string;
  /** id de la ligne de la table utilisée pour le calcul des pertes de stockage pour les ballons éléctriques */
  tv_pertes_stockage_id?: number | null;
  /** id de la ligne de la table utilisée pour le calcul du coefficient de performance du système thermodynamique (SCOP) */
  tv_scop_id?: number | null;
  /** periode installation du système thermodynamique — Valeurs : 1=avant 2010, 2=2010-2014, 3=2015-2026, 4=a partir de 2027 */
  enum_periode_installation_ecs_thermo_id?: string | null;
  /** identifiant réseau de chaleur ou de froid utilisé (utilisé à partir du 18 janvier 2022). Cet identifiant doit correspondre à un identifiant déclaré dans la liste des réseaux de chaleurs spécifiés dans l'arrêté en vigueur qui modifie l'annexe 7 de l'arrêté du 15 septembre 2006 relatif au diagnostic de performance energétique */
  identifiant_reseau_chaleur?: string | null;
  /** date de l'arrêté qui modifie l'annexe 7 de l'arrêté du 15 septembre 2006 relatif au diagnostic de performance énergétique. (https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000788395?isAdvancedResult=&page=3&pageSize=10&query=Arr%C3%AAt%C3%A9+relatif+au+classement+des+r%C3%A9seaux+de+chaleur+et+de+froid&searchField=ALL&searchProximity=&searchType=ALL&tab_selection=all&typePagination=DEFAULT). L'arrêté publie la liste des réseaux de chaleurs référencés pour le calcul du DPE et publie les taux de CO2 et ENR associés. La fréquence de ces arrêtés est d'une année en général mais ils ne sont pas publiés à des dates stables. Ce champ est obligatoire lorsqu'un réseau de chaleur est renseigné. les informations sur les arrêtés de réseaux de chaleur sont disponibles dans observatoire_dpe.modele_donnee.arrete_reseau_chaleur.json */
  date_arrete_reseau_chaleur?: string | null;
  /** id de la ligne de la table utilisée pour le calcul du contenu CO2 des réseaux de chaleurs (OBSOLETE et remplacé par identifiant_reseau_chaleur à partir du 18 janvier 2022 et la prise en compte du nouvel arrêté réseau de chaleur). */
  tv_reseau_chaleur_id?: number | null;
  /** Type de stockage d'ECS (intégré à la production ou indépendant) — Valeurs : 1=abscence de stockage d'ecs (production instantanée), 2=stockage indépendant de la production, 3=stockage intégré à la production */
  enum_type_stockage_ecs_id: string;
  /** est ce que le générateur est positionné dans le volume chauffé. (pour le calcul des pertes de génération récupérables) */
  position_volume_chauffe: 0 | 1;
  /** est ce que le ballon de stockage est positionné dans le volume chauffé. (pour le calcul des pertes de stockage récupérables) */
  position_volume_chauffe_stockage?: 0 | 1 | null;
  /** volume de stockage associé au générateur d'ECS */
  volume_stockage: number;
  /** présence d'un système de ventouse ou avec un ventilateur pour l'évacuation des fumées d'un système à combustion 0 : non 1 : oui */
  presence_ventouse?: 0 | 1 | null;
  /** méthode de détermination du facteur de commande intelligente "SCF" du chauffe-eau électrique à accumulation — Valeurs : 1=valeur forfaitaire, 2=déterminé à partir d'un document justificatif autorisé */
  enum_methode_saisie_scf_id?: string | null;
  /** facteur de gain d'efficacité permis par la commande intelligente "SCF" du chauffe-eau électrique à accumulation, saisie à partir d'un document justificatif autorisé, (0-0,75 pour 75%) */
  scf_saisi?: number | null;
}

export interface XsdLogementInstallationEcsGenerateurEcsDonneeIntermediaire {
  /** puissance nominale du générateur à combustion. Dans le cas d'un générateur virtualisé pour DPE appartement avec ECS collective saisir Pe = a*Pn(collectif) (W) */
  pn?: number | null;
  /** pertes à l'arret du générateur à combustion. Dans le cas d'un générateur virtualisé pour DPE appartement avec ECS collective saisir Qp0 correspondant à Pe = a*Pn(collectif) */
  qp0?: number | null;
  /** puissance de la veilleuse du générateur à combustion (W) */
  pveilleuse?: number | null;
  /** rendement de génération à pleine charge du générateur à combustion (0-1,5) */
  rpn?: number | null;
  /** COP du chauffe-eau thermodynamique (inclus le rendement de stockage) (0-20) */
  cop?: number | null;
  /** facteur de gain d'efficacité permis par la commande intelligente "SCF" du chauffe-eau électrique à accumulation (0-0,75 pour 75%) */
  scf?: number | null;
  /** ratio du besoin ecs de l'installation affecté au générateur. Ce ratio est de 1 pour les installations classiques et de 0,5 pour les installations d'ECS avec deux générateurs */
  ratio_besoin_ecs: number;
  /** Rg : rendement de génération dans le cas où le rendement de stockage est séparé du rendement de génération (ballon éléctrique ou ballon séparé de la production) (0-1,5) */
  rendement_generation?: number | null;
  /** RgxRs : rendement de génération x rendement de stockage pour les systèmes pour lesquels le ballon est intégré au système de production ou réseau de chaleur (0-1,5) */
  rendement_generation_stockage?: number | null;
  /** consommation d'energie annuelle du générateur d'ECS (kWh) (Exprimé en kWh PCI pour les combustibles ). Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation du générateur à l'immeuble qu'il faut saisir. */
  conso_ecs: number;
  /** consommation d'énergie annuelle du générateur d'ECS pour le scénario dépensier en énergie finale (kWh) (Exprimé en kWh PCI pour les combustibles ). Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation du générateur à l'immeuble qu'il faut saisir. */
  conso_ecs_depensier: number;
  /** Rs : rendement de stockage dans le cas où le rendement de stockage est séparé du rendement de génération (ballon éléctrique ou ballon séparé de la production) sinon égal à 1 (0-1) */
  rendement_stockage?: number | null;
}

export interface XsdLogementInstallationChauffage {
  donnee_entree: XsdLogementInstallationChauffageDonneeEntree;
  donnee_intermediaire: XsdLogementInstallationChauffageDonneeIntermediaire;
  emetteur_chauffage_collection: {
    emetteur_chauffage: XsdLogementInstallationChauffageEmetteurChauffage[];
  };
  generateur_chauffage_collection: {
    generateur_chauffage: XsdLogementInstallationChauffageGenerateurChauffage[];
  };
}

export interface XsdLogementInstallationChauffageDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference: string;
  /** surface chauffée par l'installation de chauffage(surface du logement ou de l'immeuble). Dans le cas spécifique d'un DPE immeuble avec installation individuelle échantillonée :saisir la surface chauffée de la totalité des logements représentés par le logement moyen surface_habitable= Shmoy*Nblgt. Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la surface de l'installation à l'immeuble qu'il faut renseigner */
  surface_chauffee: number;
  /** nombre de logements représentés par le logement échantillon dans le cas d'un DPE immeuble avec installation de chauffage individuelle. (à ne renseigner que dans ce cas précis) */
  nombre_logement_echantillon?: number | null;
  /** nombre d'installations identiques. Ce paramètre est utilisé pour dénombrer les installations identiques considérées lors d'un calcul d'échantillonage. Ce nombre peut être non entier en cas d'application de la méthode d'échantillonage (pour une installation sans échantillonage rdim=1) */
  rdim: number;
  /** nombre de niveaux desservis par l'installation de chauffage (très souvent égal au nombre de niveaux du bâtiment) */
  nombre_niveau_installation_ch: number;
  /** configuration de l'installation de chauffage — Valeurs : 1=installation de chauffage simple, 2=installation de chauffage avec chauffage solaire, 3=installation de chauffage avec insert ou poêle bois en appoint, 4=installation de chauffage par insert, poêle bois (ou biomasse) avec un chauffage électrique dans la salle de bain, 5=installation de chauffage avec en appoint un insert ou poêle bois et un chauffage électrique dans la salle de bain (différent d… */
  enum_cfg_installation_ch_id: string;
  /** méthode de détermination de la part du besoin de chauffage assurée par la PAC d'une pompe à chaleur hybride — Valeurs : 1=valeur forfaitaire, 2=déterminé à partir d'un document justificatif autorisé */
  enum_methode_saisie_couv_pac_hyb_id?: string | null;
  /** Part du besoin de chauffage assurée par la PAC d'une pompe à chaleur hybride, saisie directement lorsqu'elle est connue et justifiée. Valeur exprimée en fraction ; à défaut, la répartition conventionnelle dépend de la zone climatique (H1 : 0,80 ; H2 : 0,83 ; H3 : 0,88). */
  couverture_pac_hybride_saisi?: number | null;
  /** ratio de virtualisation de l'installation collective lorsque l'on rapporte des usages collectifs à un appartement (a = Shabappartement/Shabtotale) */
  ratio_virtualisation?: number | null;
  /** coefficient d'individualisation des frais de chauffage dans le cas d'un DPE appartement calculé à partir d'un DPE immeuble */
  coef_ifc?: number | null;
  /** clé de répartition pour passer des consommations bâtiments au consommation logement dans le cas DPE appartement calculé à partir du DPE immeuble UNIQUEMENT. Voir section 8.5.4 du document guide pour plus de détail */
  cle_repartition_ch?: number | null;
  /** type d'installation de chauffage (collective ou individuelle ou collective multi batiment — Valeurs : 1=installation individuelle, 2=installation collective, 3=installation collective multi-bâtiment : modélisée comme un réseau de chaleur, 4=installation hybride collective-individuelle (chauffage base + appoint individuel ou convecteur bi-jonction) */
  enum_type_installation_id: string;
  /** méthode de calcul de consommation de chauffage : simple, ou cas particuliers installation collective virtualisée ou installation individuelle échantilonnée (dpe immeuble) — Valeurs : 1=calcul simple, 2=installation collective rapportée à un logement : cas générateur à combustion virtuel ou ecs collective virtuelle, 3=installation collective rapportée à un logement : cas générateurs simples (réseau de chaleur, effet joule, pac, cet), 4=échantillonage des installations individuelles pour le calcul dpe immeuble (calcul effectué sur un logement représentatif d'un ensemble de logem… */
  enum_methode_calcul_conso_id: string;
  /** méthode de saisie du facteur de couverture solaire pour le chauffage (saisi en direct justifié ou calculé à partir de la table) — Valeurs : 1=valeur forfaitaire, 2=déterminé à partir d'un document justificatif autorisé */
  enum_methode_saisie_fact_couv_sol_id?: string | null;
  /** id de la ligne de la table utilisée pour le calcul du facteur de couverture solaire */
  tv_facteur_couverture_solaire_id?:
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 25
    | 26
    | 27
    | 28
    | 29
    | 30
    | 31
    | 32
    | 49
    | 50
    | 51
    | 52
    | 53
    | 54
    | 55
    | 56
    | 57
    | 58
    | 59
    | 60
    | 61
    | 62
    | 63
    | 64
    | 65
    | 66
    | 67
    | 68
    | 69
    | 70
    | 71
    | 72
    | null;
  /** Facteur de couverture solaire pour l'installation de chauffage(saisi) */
  fch_saisi?: number | null;
}

export interface XsdLogementInstallationChauffageDonneeIntermediaire {
  /** Besoin de chauffage total de l'installation (kWh) */
  besoin_ch: number;
  /** Besoin de chauffage total de l'installation pour le scénario dépensier (DH21) (kWh) */
  besoin_ch_depensier: number;
  /** Production de chauffage solaire (kWh) */
  production_ch_solaire?: number | null;
  /** Facteur de couverture solaire pour l'installation de chauffage */
  fch?: number | null;
  /** consommation d'energie annuelle de l'installation de chauffage en energie finale kWh. Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation de l'installation à l'immeuble qu'il faut saisir. */
  conso_ch: number;
  /** consommation d'energie annuelle de l'installation de chauffage pour le scénario dépensier (scénario DH21) en energie finale kWh. Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation de l'installation à l'immeuble qu'il faut saisir. */
  conso_ch_depensier: number;
}

export interface XsdLogementInstallationChauffageEmetteurChauffage {
  donnee_entree: XsdLogementInstallationChauffageEmetteurChauffageDonneeEntree;
  donnee_intermediaire: XsdLogementInstallationChauffageEmetteurChauffageDonneeIntermediaire;
}

export interface XsdLogementInstallationChauffageEmetteurChauffageDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference: string;
  /** surface chauffée par l'emetteur (sous ensemble de la surface chauffée par l'installation). Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la surface de l'installation à l'immeuble qu'il faut renseigner */
  surface_chauffee: number;
  /** id de la ligne de la table utilisée pour le calcul du rendement d'emission de l'émetteur de chauffage */
  tv_rendement_emission_id: number;
  /** id de la ligne de la table utilisée pour le calcul du rendement de distribution de la distribution associée à l'émission */
  tv_rendement_distribution_ch_id: number;
  /** id de la ligne de la table utilisée pour le calcul du rendement de régulation associé à l'émission */
  tv_rendement_regulation_id: number;
  /** enumérateur qui couple les notions d'emission et de distribution pour produire une description complète des emetteurs de chauffage — Valeurs : 1=convecteur électrique nfc, nf** et nf***, 2=panneau rayonnant nfc, nf** et nf***, 3=radiateur électrique nfc, nf** et nf***, 4=autres émetteurs à effet joule, 5=soufflage d'air chaud (air soufflé) avec distribution par réseau aéraulique, 6=plafond rayonnant électrique avec régulation terminale, 7=plafond rayonnant électrique sans régulation, 8=plancher rayonnant électrique avec régulation termin… */
  enum_type_emission_distribution_id: string;
  /** id de la ligne de la table utilisée pour le calcul du coefficient d'intermittence de l'installation I0 */
  tv_intermittence_id: number;
  /** est ce que le réseau de distribution est isolé 0 : non 1 : oui */
  reseau_distribution_isole?: 0 | 1 | null;
  /** type d'équipement d'intermittence associé à la génération — Valeurs : 1=absent, 2=central sans minimum de température, 3=central avec minimum de température, 4=par pièce avec minimum de température, 5=par pièce avec minimum de température et détection de présence, 6=central collectif, 7=central collectif avec détection de présence, 8=algorithme de régulation prédictif du chauffage */
  enum_equipement_intermittence_id: string;
  /** type de régulation associée au générateur — Valeurs : 1=sans régulation pièce par pièce, 2=avec régulation pièce par pièce */
  enum_type_regulation_id: string;
  /** période d'installation des émetteurs de chauffage (utilisé pour le calcul des températures de fonctionnement des systèmes à combustion de type chaudière gaz ou fioul) — Valeurs : 1=avant 1981, 2=entre 1981 et 2000, 3=après 2000 */
  enum_periode_installation_emetteur_id?: string | null;
  /** type de chauffage : Central ou Divisé — Valeurs : 1=chauffage divisé, 2=chauffage central */
  enum_type_chauffage_id: string;
  /** température de distribution de l'installation de chauffage (pour le calcul des auxiliaires de distribution) — Valeurs : 1=abscence de réseau de distribution, 2=basse, 3=moyenne, 4=haute */
  enum_temp_distribution_ch_id: string;
  /** lien entre le générateur et l'émetteur associé — Valeurs : 1=génération principale - emetteur lié à la génération principale, 2=génération appoint - emetteur lié à la génération d'appoint, 3=génération appoint electrique salle de bain - emetteur lié à la génération appoint electrique salle de bain */
  enum_lien_generateur_emetteur_id: string;
  /** Indique si le réseau de distribution et les émetteurs de chauffage peuvent fonctionner à basse température ou à une température favorisant une meilleure efficacité du générateur. Pour les systèmes de distribution non-hydrauliques, cette balise doit être renseignée comme "non". */
  basse_temperature: 0 | 1;
}

export interface XsdLogementInstallationChauffageEmetteurChauffageDonneeIntermediaire {
  /** coefficient d'intermittence de l'installation */
  i0: number;
  /** Re : rendement d'émission du système de chauffage (0-1) */
  rendement_emission: number;
  /** Rd : rendement de distribution du système de chauffage (0-1) */
  rendement_distribution: number;
  /** Rr : rendement de régulation du système de chauffage (0-1) */
  rendement_regulation: number;
}

export interface XsdLogementInstallationChauffageGenerateurChauffage {
  donnee_entree: XsdLogementInstallationChauffageGenerateurChauffageDonneeEntree;
  donnee_intermediaire: XsdLogementInstallationChauffageGenerateurChauffageDonneeIntermediaire;
}

export interface XsdLogementInstallationChauffageGenerateurChauffageDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference: string;
  /** référence commune pour un générateur mixte chauffage ECS. Cette référence est identique pour les deux parties du générateur (chauffage et ECS) et est utilisé pour faire le lien entre les deux */
  reference_generateur_mixte?: string | null;
  /** référence produit et marque du générateur de chauffage */
  ref_produit_generateur_ch?: string | null;
  /** type de generateur de chauffage — Valeurs : 1=pac air/air installée avant 2008, 2=pac air/air installée entre 2008 et 2014, 3=pac air/air installée entre 2015 et 2026, 4=pac air/eau installée avant 2008, 5=pac air/eau installée entre 2008 et 2014, 6=pac air/eau installée entre 2015 et 2016, 7=pac air/eau installée entre 2017 et 2026, 8=pac eau/eau installée avant 2008, 9=pac eau/eau installée entre 2008 et 2014, 10=pac eau/eau installée ent… */
  enum_type_generateur_ch_id: string;
  /** usages assurés par le générateur (chauffage/ecs/chauffage+ecs) — Valeurs : 1=chauffage, 2=ecs, 3=chauffage + ecs */
  enum_usage_generateur_id: string;
  /** type d'énergie consommée par le générateur de chauffage — Valeurs : 1=électricité, 2=gaz naturel, 3=fioul domestique, 4=bois – bûches, 5=bois – granulés (pellets) ou briquettes, 6=bois – plaquettes forestières, 7=bois – plaquettes d’industrie, 8=réseau de chauffage urbain, 9=propane, 10=butane, 11=charbon, 12=électricité d'origine renouvelable utilisée dans le bâtiment, 13=gpl, 14=autre combustible fossile, 15=réseau de froid urbain */
  enum_type_energie_id: string;
  /** est ce que le générateur est positionné dans le volume chauffé. (pour le calcul des pertes de génération récupérables) */
  position_volume_chauffe: 0 | 1;
  /** id de la ligne de la table utilisée pour le calcul des rendements de générations forfaitaires des générateurs autres qu'à combustion */
  tv_rendement_generation_id?: number | null;
  /** id de la ligne de la table utilisée pour le calcul du coefficient de performance du système thermodynamique (SCOP) */
  tv_scop_id?: number | null;
  /** id de la ligne de la table utilisée pour le calcul de la température à 100% de charge du système à combustion(SUPPRIME) */
  tv_temp_fonc_100_id?: number | null;
  /** id de la ligne de la table utilisée pour le calcul de la température à 30% de charge du système à combustion(SUPPRIME) */
  tv_temp_fonc_30_id?: number | null;
  /** id de la ligne de la table utilisée pour le calcul des paramètres du générateur à combustion Rpn,Rpint,Qp0,Pveil */
  tv_generateur_combustion_id?: number | null;
  /** id de la ligne de la table utilisée pour le calcul du contenu CO2 des réseaux de chaleurs (OBSOLETE et remplacé par identifiant_reseau_chaleur à partir du 18 janvier 2022 et la prise en compte du nouvel arrêté réseau de chaleur). */
  tv_reseau_chaleur_id?: number | null;
  /** identifiant réseau de chaleur ou de froid utilisé (utilisé à partir du 18 janvier 2022). Cet identifiant doit correspondre à un identifiant déclaré dans la liste des réseaux de chaleurs spécifiés dans l'arrêté en vigueur qui modifie l'annexe 7 de l'arrêté du 15 septembre 2006 relatif au diagnostic de performance energétique */
  identifiant_reseau_chaleur?: string | null;
  /** identifiant réseau de chaleur ou de froid utilisé (utilisé à partir du 18 janvier 2022) */
  date_arrete_reseau_chaleur?: string | null;
  /** nombre de radiateurs gaz */
  n_radiateurs_gaz?: number | null;
  /** ordre de priorité du générateur en cascade (ordonné de manière croissante 1 : générateur principal , 2: genérateur secondaire etc…). Dans le cas de deux générateurs en cascade sans priorité, les deux générateurs sont déclarés comme principal */
  priorite_generateur_cascade?: number | null;
  /** présence d'un système de ventouse ou avec un ventilateur pour l'évacuation des fumées d'un système à combustion 0 : non 1 : oui */
  presence_ventouse?: 0 | 1 | null;
  /** présence d'un organe de régulation pour le système de chauffage à combustion 0 : non 1 : oui */
  presence_regulation_combustion?: 0 | 1 | null;
  /** méthode de saisie des performances du système de chauffage — Valeurs : 1=valeurs forfaitaires, 2=caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, autres données forfaitaires, 3=caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, rpn,rpint, autres données forfaitaires, 4=caractéristiques saisies à partir de la plaque signalét… */
  enum_methode_saisie_carac_sys_id: string;
  /** lien entre le générateur et l'émetteur associé — Valeurs : 1=génération principale - emetteur lié à la génération principale, 2=génération appoint - emetteur lié à la génération d'appoint, 3=génération appoint electrique salle de bain - emetteur lié à la génération appoint electrique salle de bain */
  enum_lien_generateur_emetteur_id: string;
  /** Estimation de la durée de vie restante du système de chauffage, en années. */
  chauffage_duree_vie_restante: number;
}

export interface XsdLogementInstallationChauffageGenerateurChauffageDonneeIntermediaire {
  /** scop du générateur thermodynamique (en remplacement du Rg pour les générateurs thermodynamique) (0-20) */
  scop?: number | null;
  /** puissance nominale du générateur à combustion (W) */
  pn?: number | null;
  /** pertes à l'arret du générateur à combustion. Dans le cas d'un générateur virtualisé pour DPE appartement avec chauffage collectif saisir Qp0 correspondant à Pe = a*Pn(collectif) (W) */
  qp0?: number | null;
  /** puissance de la veilleuse du générateur à combustion (W) */
  pveilleuse?: number | null;
  /** température de fonctionnement à 30% de charge (°C) */
  temp_fonc_30?: number | null;
  /** température de fonctionnement à 100% de charge (°C) */
  temp_fonc_100?: number | null;
  /** rendement de génération à pleine charge du générateur à combustion (0-1,5) */
  rpn?: number | null;
  /** rendement de génération à charge intermédiaire du générateur à combustion (0-1,5) */
  rpint?: number | null;
  /** Rg : rendement de génération du système de chauffage pour tous les générateurs sauf thermodynamique. Pour les générateurs à combustion il faut saisir le rendement sur PCI (0-1,5) */
  rendement_generation?: number | null;
  /** consommation d'energie annuelle du générateur de chauffage en energie finale kWh (exprimée en kWh PCI pour les combustibles). Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation du générateur à l'immeuble qu'il faut saisir. */
  conso_ch: number;
  /** consommation d'énergie annuelle du générateur de chauffage pour le scénario dépensier (scénario DH21) en energie finale kWh (exprimée en kWh PCI pour les combustibles). Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation du générateur à l'immeuble qu'il faut saisir. */
  conso_ch_depensier: number;
}

export interface XsdLogementSortie {
  deperdition: XsdLogementSortieDeperdition;
  apport_et_besoin: XsdLogementSortieApportEtBesoin;
  ef_conso: XsdLogementSortieEfConso;
  ep_conso: XsdLogementSortieEpConso;
  emission_ges: XsdLogementSortieEmissionGes;
  cout: XsdLogementSortieCout;
  production_electricite: XsdLogementSortieProductionElectricite;
  sortie_par_energie_collection: { sortie_par_energie: XsdLogementSortieSortieParEnergie[] };
  confort_ete?: XsdLogementSortieConfortEte | null;
  qualite_isolation: XsdLogementSortieQualiteIsolation;
  /** Productions et consommations renouvelables agrégées pour l'état calculé du logement, exprimées en kWhEF/an, ainsi que leur part dans la consommation d'énergie finale. Obligatoire pour le DPE et pour chaque état ou étape de l'Audit. */
  production_enr: XsdLogementSortieProductionEnr;
  /** Indique si le bâtiment ou logement satisfait, pour l'état calculé, les conditions réglementaires de la mention A0 « émissions nulles ». Résultat calculé par le logiciel, obligatoire pour le DPE et pour chaque état ou étape de l'Audit. */
  mention_a0: 0 | 1;
}

export interface XsdLogementSortieDeperdition {
  /** part des deperditions de renouvellement d'air liées au système de(W/K) ventilation. Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  hvent: number;
  /** part des deperditions de renouvellement d'air liées à la perméabilité à l'air du bâtiment(W/K). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  hperm: number;
  /** deperditions par renouvellement d'air totale (hvent + hperm)(W/K). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  deperdition_renouvellement_air: number;
  /** deperditions par les murs(W/K). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  deperdition_mur: number;
  /** deperditions par les planchers bas(W/K). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  deperdition_plancher_bas: number;
  /** deperditions par les planchers hauts(W/K). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  deperdition_plancher_haut: number;
  /** deperditions par les baies vitrées (W/K). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  deperdition_baie_vitree: number;
  /** deperditions par les ponts thermiques(W/K). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  deperdition_porte: number;
  /** deperditions par les ponts thermiques(W/K). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  deperdition_pont_thermique: number;
  /** deperditions par l'enveloppe (GV). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  deperdition_enveloppe: number;
}

export interface XsdLogementSortieApportEtBesoin {
  /** surface sud équivalente. Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  surface_sud_equivalente: number;
  /** apports solaires totaux durant la saison de froid As (kWh). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  apport_solaire_fr: number;
  /** apports internes totaux durant la saison de froid Ai (kWh). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  apport_interne_fr: number;
  /** apports solaires totaux durant la saison de chauffe As (kWh). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  apport_solaire_ch: number;
  /** apports internes totaux durant la saison de chauffe Ai (kWh). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  apport_interne_ch: number;
  /** fraction des apports gratuits sur la saison de chauffe F. Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  fraction_apport_gratuit_ch: number;
  /** fraction des apports gratuits sur la saison de chauffe F pour le scénario dépensier (DH21). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  fraction_apport_gratuit_depensier_ch: number;
  /** pertes de distribution d'ECS récupérées(kWh). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  pertes_distribution_ecs_recup: number;
  /** pertes de distribution d'ECS récupérées(kWh) pour le scénario dépensier. Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  pertes_distribution_ecs_recup_depensier: number;
  /** pertes de stockage d'ECS récupérées(kWh). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  pertes_stockage_ecs_recup: number;
  /** pertes des générateurs de chauffage récupérées(kWh). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  pertes_generateur_ch_recup: number;
  /** pertes des générateurs de chauffage récupérées(kWh) pour le scénario dépensier. Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  pertes_generateur_ch_recup_depensier: number;
  /** nombre d'adulte équivalent calculés pour le besoin d'ECS. Pour les DPE immeubles ces données sont à l'immeuble. Pour les dpe appartements à partir de l'immeuble ces données sont à l'appartement */
  nadeq: number;
  /** consommation en l d'ecs à 40°C sur une journée. Pour les DPE immeubles ces données sont à l'immeuble. Pour les dpe appartements à partir de l'immeuble ces données sont à l'appartement */
  v40_ecs_journalier: number;
  /** consommation en l d'ecs à 40°C sur une journée scénario dépensier. Pour les DPE immeubles ces données sont à l'immeuble. Pour les dpe appartements à partir de l'immeuble ces données sont à l'appartement */
  v40_ecs_journalier_depensier: number;
  /** besoin de chauffage annuel total du logement ou immeuble (kWh) . Pour les DPE immeubles ces données sont à l'immeuble. Pour les dpe appartements à partir de l'immeuble ces données sont à l'appartement */
  besoin_ch: number;
  /** besoin de chauffage total du bâtiment pour le scénario dépensier (kWh) (DH21). Pour les DPE immeubles ces données sont à l'immeuble. Pour les dpe appartements à partir de l'immeuble ces données sont à l'appartement */
  besoin_ch_depensier: number;
  /** besoin d'ecs annuel total du bâtiment (kWh). Pour les DPE immeubles ces données sont à l'immeuble. Pour les dpe appartements à partir de l'immeuble ces données sont à l'appartement */
  besoin_ecs: number;
  /** besoin d'ecs total du bâtiment pour le scénario dépensier (kWh). Pour les DPE immeubles ces données sont à l'immeuble. Pour les dpe appartements à partir de l'immeuble ces données sont à l'appartement */
  besoin_ecs_depensier: number;
  /** besoin de refroidissement annuel (kWh).Pour les DPE immeubles ces données sont à l'immeuble. Pour les dpe appartements à partir de l'immeuble ces données sont à l'appartement */
  besoin_fr: number;
  /** besoin de refroidissement annuel pour le scénario dépensier (kWh). Pour les DPE immeubles ces données sont à l'immeuble. Pour les dpe appartements à partir de l'immeuble ces données sont à l'appartement */
  besoin_fr_depensier: number;
}

export interface XsdLogementSortieEfConso {
  /** consommation annuelle de chauffage en energie finale (déduit de la production pv autoconsommée) (kWhef/an) */
  conso_ch: number;
  /** consommation annuelle de chauffage en energie finale pour le scénario dépensier(déduit de la production pv autoconsommée) (kWhef/an) */
  conso_ch_depensier: number;
  /** consommation annuelle d'ECS en energie finale (déduit de la production pv autoconsommée) (kWhef/an) */
  conso_ecs: number;
  /** consommation annuelle d'ECS en energie finale pour le scénario dépensier (déduit de la production pv autoconsommée) (kWhef/an) */
  conso_ecs_depensier: number;
  /** consommation annuelle d'eclairage en energie finale (déduit de la production pv autoconsommée) (kWhef/an) */
  conso_eclairage: number;
  /** consommation annuelle d'auxilliaires de génération de chauffage en energie finale (kWhef/an) */
  conso_auxiliaire_generation_ch: number;
  /** consommation annuelle d'auxilliaires de génération de chauffage en energie finale pour le scénario dépensier (kWhef/an) */
  conso_auxiliaire_generation_ch_depensier: number;
  /** consommation annuelle d'auxilliaires de distribution de chauffage en energie finale (kWhef/an) */
  conso_auxiliaire_distribution_ch: number;
  /** consommation annuelle d'auxillaires de generation d'ECS en energie finale (kWhef/an) */
  conso_auxiliaire_generation_ecs: number;
  /** consommation annuelle d'auxillaires de generation d'ECS en energie finale pour le scénario dépensier (kWhef/an) */
  conso_auxiliaire_generation_ecs_depensier: number;
  /** consommation annuelle d'auxilliaires de distribution d'ECS en energie finale (kWhef/an) */
  conso_auxiliaire_distribution_ecs: number;
  /** consommation annuelle d'auxilliaires de distribution de froid en energie finale (kWhef/an) */
  conso_auxiliaire_distribution_fr?: number | null;
  /** consommation annuelle d'auxilliaires de ventilation en energie finale (kWhef/an) */
  conso_auxiliaire_ventilation: number;
  /** consommation annuelle de l'ensemble des auxiliaires en énergie finale(déduit de la production pv autoconsommée) (kWhef/an) */
  conso_totale_auxiliaire: number;
  /** consommation de refroidissement annuel en energie finale (déduit de la production pv autoconsommée) (kWhef/an) */
  conso_fr: number;
  /** consommation de refroidissement annuel en energie finale pour le scénario dépensier (déduit de la production pv autoconsommée) (kWhef/an) */
  conso_fr_depensier: number;
  /** consommation annuelle 5 usages (ecs/chauffage/climatisation/eclairage/auxiliaires)en energie finale(déduit de la production pv autoconsommée) (kWhef/an) */
  conso_5_usages: number;
  /** consommation annuelle 5 usages (ecs/chauffage/climatisation/eclairage/auxiliaires)en energie finale(déduit de la production pv autoconsommée) (kWhef/m²/an) */
  conso_5_usages_m2: number;
}

export interface XsdLogementSortieEpConso {
  /** consommation annuelle de chauffage en energie primaire(déduit de la production pv autoconsommée) (kWhep/an) */
  ep_conso_ch: number;
  /** consommation annuelle de chauffage en energie primaire pour le scénario dépensier (déduit de la production pv autoconsommée) (kWhep/an) */
  ep_conso_ch_depensier: number;
  /** consommation annuelle d'ECS en energie primaire (déduit de la production pv autoconsommée) (kWhep/an) */
  ep_conso_ecs: number;
  /** consommation annuelle d'ECS en energie primaire pour le scénario dépensier (déduit de la production pv autoconsommée) (kWhep/an) */
  ep_conso_ecs_depensier: number;
  /** consommation annuelle d'eclairage en energie primaire (déduit de la production pv autoconsommée) (kWhep/an) */
  ep_conso_eclairage: number;
  /** consommation annuelle d'auxilliaires de génération de chauffage en energie primaire (kWhep/an) */
  ep_conso_auxiliaire_generation_ch: number;
  /** consommation annuelle d'auxilliaires de génération de chauffage en energie primaire pour le scénario dépensier (kWhep/an) */
  ep_conso_auxiliaire_generation_ch_depensier: number;
  /** consommation annuelle d'auxilliaires de distribution de chauffage en energie primaire (kWhep/an) */
  ep_conso_auxiliaire_distribution_ch: number;
  /** consommation annuelle d'auxillaires de generation d'ECS en energie primaire (kWhep/an) */
  ep_conso_auxiliaire_generation_ecs: number;
  /** consommation annuelle d'auxillaires de generation d'ECS en energie primaire pour le scénario dépensier (kWhep/an) */
  ep_conso_auxiliaire_generation_ecs_depensier: number;
  /** consommation annuelle d'auxilliaires de distribution d'ECS en energie primaire (kWhep/an) */
  ep_conso_auxiliaire_distribution_ecs: number;
  /** consommation annuelle d'auxilliaires de distribution de froid en energie primaire (kWhep/an) SUPPRIME */
  ep_conso_auxiliaire_distribution_fr?: number | null;
  /** consommation annuelle d'auxilliaires de ventilation en energie primaire (kWhep/an) */
  ep_conso_auxiliaire_ventilation: number;
  /** consommation annuelle de l'ensemble des auxiliaires en energie primaire (déduit de la production pv autoconsommée) (kWhep/an) */
  ep_conso_totale_auxiliaire: number;
  /** consommation de refroidissement annuel en énergie primaire (déduit de la production pv autoconsommée) (kWhep/an) */
  ep_conso_fr: number;
  /** consommation de refroidissement annuel en énergie primaire pour le scénario dépensier (déduit de la production pv autoconsommée) (kWhep/an) */
  ep_conso_fr_depensier: number;
  /** consommation annuelle 5 usages (ecs/chauffage/climatisation/eclairage/auxiliaires)en energie primaire (déduit de la production pv autoconsommée) (kWhep/an) */
  ep_conso_5_usages: number;
  /** consommation annuelle 5 usages (ecs/chauffage/climatisation/eclairage/auxiliaires)en energie primaire (déduit de la production pv autoconsommée) (kWhep/m²/an) */
  ep_conso_5_usages_m2: number;
  /** Classe du DPE issu de la synthèse du double seuil sur les consommations énergie primaire et les émissions de CO2 sur les 5 usages (ecs/chauffage/climatisation/eclairage/auxiliaires) */
  classe_bilan_dpe: string;
}

export interface XsdLogementSortieEmissionGes {
  /** estimation GES de chauffage (déduit de la production pv autoconsommée) (kgCO2/an) */
  emission_ges_ch: number;
  /** estimation GES de chauffage pour le scénario dépensier(déduit de la production pv autoconsommée) (kgCO2/an) */
  emission_ges_ch_depensier: number;
  /** estimation GES d'ECS (déduit de la production pv autoconsommée) (kgCO2/an) */
  emission_ges_ecs: number;
  /** estimation GES d'ECS pour le scénario dépensier (déduit de la production pv autoconsommée) (kgCO2/an) */
  emission_ges_ecs_depensier: number;
  /** estimation GES d'eclairage (déduit de la production pv autoconsommée) (kgCO2/an) */
  emission_ges_eclairage: number;
  /** estimation GES d'auxilliaires de génération de chauffage (kgCO2/an) */
  emission_ges_auxiliaire_generation_ch: number;
  /** estimation GES d'auxilliaires de génération de chauffage pour le scénario dépensier (kgCO2/an) */
  emission_ges_auxiliaire_generation_ch_depensier: number;
  /** estimation GES d'auxilliaires de distribution de chauffage (kgCO2/an) */
  emission_ges_auxiliaire_distribution_ch: number;
  /** estimation GES d'auxillaires de generation d'ECS (kgCO2/an) */
  emission_ges_auxiliaire_generation_ecs: number;
  /** estimation GES d'auxillaires de generation d'ECS pour le scénario dépensier (kgCO2/an) */
  emission_ges_auxiliaire_generation_ecs_depensier: number;
  /** estimation GES d'auxilliaires de distribution d'ECS (kgCO2/an) */
  emission_ges_auxiliaire_distribution_ecs: number;
  /** estimation GES d'auxilliaires de distribution de froid (kgCO2/an) SUPPRIME */
  emission_ges_auxiliaire_distribution_fr?: number | null;
  /** estimation GES d'auxilliaires de ventilation (kgCO2/an) */
  emission_ges_auxiliaire_ventilation: number;
  /** estimation GES de l'ensemble des auxiliaires (déduit de la production pv autoconsommée) (kgCO2/an) */
  emission_ges_totale_auxiliaire: number;
  /** estimation GES de refroidissement annuel (déduit de la production pv autoconsommée) (kgCO2/an) */
  emission_ges_fr: number;
  /** estimation GES de refroidissement pour le scénario dépensier (déduit de la production pv autoconsommée) (kgCO2/an) */
  emission_ges_fr_depensier: number;
  /** estimation GES totale 5 usages (déduit de la production pv autoconsommée) (ecs/chauffage/climatisation/eclairage/auxiliaires)(kgCO2/an) */
  emission_ges_5_usages: number;
  /** estimation GES totale 5 usages rapportée au m² (déduit de la production pv autoconsommée) (ecs/chauffage/climatisation/eclairage/auxiliaires)(kgCO2/m2/an) */
  emission_ges_5_usages_m2: number;
  /** classe d'estimation ges du DPE 5 usages */
  classe_emission_ges: string;
}

export interface XsdLogementSortieCout {
  /** coût de chauffage(déduit de la production pv autoconsommée) (€) */
  cout_ch: number;
  /** coût de chauffage pour le scénario dépensier (déduit de la production pv autoconsommée) (€) */
  cout_ch_depensier: number;
  /** coût de l'ECS (déduit de la production pv autoconsommée) (€) */
  cout_ecs: number;
  /** coût de l'ECS pour le scénario dépensier (déduit de la production pv autoconsommée) (€) */
  cout_ecs_depensier: number;
  /** coût des eclairage (déduit de la production pv autoconsommée) (€) */
  cout_eclairage: number;
  /** coût des auxilliaires de génération de chauffage (€) */
  cout_auxiliaire_generation_ch: number;
  /** coût des auxilliaires de génération de chauffage pour le scénario dépensier (€) */
  cout_auxiliaire_generation_ch_depensier: number;
  /** coût des auxilliaires de distribution de chauffage (€) */
  cout_auxiliaire_distribution_ch: number;
  /** coût des auxillaires de generation de l'ECS (€) */
  cout_auxiliaire_generation_ecs: number;
  /** coût des auxillaires de generation de l'ECS pour le scénario dépensier (€) */
  cout_auxiliaire_generation_ecs_depensier: number;
  /** coût des auxilliaires de distribution de l'ECS (€) */
  cout_auxiliaire_distribution_ecs: number;
  /** coût des auxilliaires de distribution de froid (€) SUPPRIME */
  cout_auxiliaire_distribution_fr?: number | null;
  /** coût des auxilliaires de ventilation (€) */
  cout_auxiliaire_ventilation: number;
  /** coût des auxilliaires de l'ensemble des auxiliaires (déduit de la production pv autoconsommée) (€) */
  cout_total_auxiliaire: number;
  /** coût de refroidissement annuel (déduit de la production pv autoconsommée) (€) */
  cout_fr: number;
  /** coût de refroidissement pour le scénario dépensier (déduit de la production pv autoconsommée) (€) */
  cout_fr_depensier: number;
  /** coût totale 5 usages (ecs/chauffage/climatisation/eclairage/auxiliaires) (déduit de la production pv autoconsommée) (€) */
  cout_5_usages: number;
}

export interface XsdLogementSortieProductionElectricite {
  /** production d'éléctricité photovoltaique(kWhep/an) */
  production_pv: number;
  /** éléctricité photovoltaique autoconsommée(kWhep/an) */
  conso_elec_ac: number;
  /** éléctricité photovoltaique autoconsommée pour l'usage chauffage (les consommations finales sont déduites de cette valeur) (kWhep/an) */
  conso_elec_ac_ch: number;
  /** éléctricité photovoltaique autoconsommée pour l'usage ecs (les consommations finales sont déduites de cette valeur) (kWhep/an) */
  conso_elec_ac_ecs: number;
  /** éléctricité photovoltaique autoconsommée pour l'usage climatisation (les consommations finales sont déduites de cette valeur) (kWhep/an) */
  conso_elec_ac_fr: number;
  /** éléctricité photovoltaique autoconsommée pour l'usage eclairage (les consommations finales sont déduites de cette valeur) (kWhep/an) */
  conso_elec_ac_eclairage: number;
  /** éléctricité photovoltaique autoconsommée pour l'usage auxiliaire (les consommations finales sont déduites de cette valeur) (kWhep/an) */
  conso_elec_ac_auxiliaire: number;
  /** éléctricité photovoltaique autoconsommée pour les autres usages de l'éléctricité (kWhep/an) */
  conso_elec_ac_autre_usage: number;
}

export interface XsdLogementSortieSortieParEnergie {
  /** type d'énergie — Valeurs : 1=électricité, 2=gaz naturel, 3=fioul domestique, 4=bois – bûches, 5=bois – granulés (pellets) ou briquettes, 6=bois – plaquettes forestières, 7=bois – plaquettes d’industrie, 8=réseau de chauffage urbain, 9=propane, 10=butane, 11=charbon, 12=électricité d'origine renouvelable utilisée dans le bâtiment, 13=gpl, 14=autre combustible fossile, 15=réseau de froid urbain */
  enum_type_energie_id: string;
  /** consommation de chauffage en énergie finale pour l'énergie considérée (kWhef/an) */
  conso_ch: number;
  /** consommation d'ECS en énergie finale pour l'énergie considérée (kWhef/an) */
  conso_ecs: number;
  /** consommation totale en énergie finale pour l'énergie considérée (kWhef/an) */
  conso_5_usages: number;
  /** estimation GES de chauffage pour l'énergie considérée (kgCO2/an) */
  emission_ges_ch: number;
  /** estimation GES d'ECS pour l'énergie considérée (kgCO2/an) */
  emission_ges_ecs: number;
  /** estimation GES totale pour l'énergie considérée (kgCO2/an) */
  emission_ges_5_usages: number;
  /** coût lié au chauffage pour l'énergie considérée (€) */
  cout_ch: number;
  /** coût lié à l'ECS pour l'énergie considérée (€) */
  cout_ecs: number;
  /** coût totale pour l'énergie considérée (€) */
  cout_5_usages: number;
}

export interface XsdLogementSortieConfortEte {
  /** as-t-on une isolation de toiture 0 : non 1 : oui */
  isolation_toiture?: 0 | 1 | null;
  /** as-t-on une protection solair exteriaire sur les facades vitrées (exception nord) 0 : non 1 : oui */
  protection_solaire_exterieure: 0 | 1;
  /** est ce que le logement est traversant 0 : non 1 : oui */
  aspect_traversant?: 0 | 1 | null;
  /** est ce que le logement est équipé de brasseurs d'air 0 : non 1 : oui */
  brasseur_air?: 0 | 1 | null;
  /** est ce que le logement possède une inerte lourde ou très lourde 0 : non 1 : oui */
  inertie_lourde: 0 | 1;
  /** indicateur confort été (bon moyen ou mauvais) — Valeurs : 1=insuffisant, 2=moyen, 3=bon */
  enum_indicateur_confort_ete_id: string;
}

export interface XsdLogementSortieQualiteIsolation {
  /** Ubat(W/m²K) */
  ubat: number;
  /** qualité d'isolation de l'enveloppe */
  qualite_isol_enveloppe: 1 | 2 | 3 | 4;
  /** qualité d'isolation des murs */
  qualite_isol_mur?: 1 | 2 | 3 | 4 | null;
  /** qualité d'isolation de la toiture/planchers hauts partie toit terrasse */
  qualite_isol_plancher_haut_toit_terrasse?: 1 | 2 | 3 | 4 | null;
  /** qualité d'isolation de la toiture/planchers hauts partie comble perdue */
  qualite_isol_plancher_haut_comble_perdu?: 1 | 2 | 3 | 4 | null;
  /** qualité d'isolation de la toiture/planchers hauts partie comble aménagé */
  qualite_isol_plancher_haut_comble_amenage?: 1 | 2 | 3 | 4 | null;
  /** qualité de l'isolation des planchers */
  qualite_isol_plancher_bas?: 1 | 2 | 3 | 4 | null;
  /** qualité d'isolation des menuiseries */
  qualite_isol_menuiserie: 1 | 2 | 3 | 4;
}

/** Productions et consommations renouvelables agrégées pour l'état calculé du logement, exprimées en kWhEF/an, ainsi que leur part dans la consommation d'énergie finale. Obligatoire pour le DPE et pour chaque état ou étape de l'Audit. */
export interface XsdLogementSortieProductionEnr {
  /** Production photovoltaïque totale sur site, en kWhEF/an. */
  prod_enr_pv: number;
  /** Production solaire thermique sur site, en kWhEF/an. */
  prod_enr_solaire_thermique: number;
  /** Chaleur ambiante renouvelable captée par les pompes à chaleur, en kWhEF/an. */
  prod_enr_chaleur_ambiante_pac: number;
  /** Chaleur géothermique captée par les pompes à chaleur, en kWhEF/an. */
  prod_enr_geothermie_pac: number;
  /** Chaleur ambiante renouvelable captée par les chauffe-eau thermodynamiques, en kWhEF/an. */
  prod_enr_chaleur_ambiante_cet: number;
  /** Part renouvelable du réseau de chaleur appliquée à la consommation du réseau sur site, en kWhEF/an. */
  prod_enr_rcfu: number;
  /** Énergie renouvelable associée à la consommation de biomasse bois, en kWhEF/an. */
  prod_enr_bois: number;
  /** Somme des composantes de production ou consommation renouvelable du bloc, en kWhEF/an. */
  prod_enr_totale: number;
  /** Production renouvelable rapportée à la consommation d'énergie finale, en fraction. Formule : prod_enr_totale / (Cef + prod_enr_solaire_thermique + prod_enr_chaleur_ambiante_pac + prod_enr_geothermie_pac + prod_enr_chaleur_ambiante_cet + conso_elec_autoconso), avec Cef = sortie/ef_conso/conso_5_usages et conso_elec_autoconso = production_elec_enr/donnee_intermediaire/conso_elec_ac (0 si l'élément est absent ou sans texte). La fraction peut être supérieure à 1. */
  prod_enr_pourcentage: number;
}

/** Tertiaire */
export interface XsdTertiaire {
  /** Caractéristiques Générales du DPE Tertiaire */
  caracteristique_generale: XsdTertiaireCaracteristiqueGenerale;
  /** bilan consommation */
  bilan_consommation?: XsdTertiaireBilanConsommation | null;
  /** consommations par usage et energie */
  consommation_collection: { consommation?: XsdTertiaireConsommation | XsdTertiaireConsommation[] };
}

/** Caractéristiques Générales du DPE Tertiaire */
export interface XsdTertiaireCaracteristiqueGenerale {
  /** type d'usage fonctionnel du batiment tertiaire ou batiment recevant du public — Valeurs : 1=j : structures d’accueil pour personnes âgées ou personnes handicapées, 2=l : salles d'auditions, de conférences, de réunions, de spectacles ou à usage multiple, 3=m : magasins de vente, centres commerciaux, 4=n : restaurants et débits de boisson, 5=o : hôtels et pensions de famille, 6=p : salles de danse et salles de jeux, 7=r : établissements d’éveil, d’enseignement, de formation, centres de v… */
  enum_usage_fonctionnel_batiment_id: string;
  /** categorie d'ERP — Valeurs : 1=1ère catégorie, 2=2ème catégorie, 3=3ème catégorie, 4=4ème catégorie, 5=5ème catégorie */
  enum_categorie_erp_id?: string | null;
  /** methode d'application du DPE tertiaire (facture, vierge ou neuf) — Valeurs : 1=dpe tertiaire facture, 2=dpe tertiaire bâtiment neuf, 3=dpe tertiaire vierge, 4=dpe tertiaire vierge neuf, 5=dpe tertiaire facture dans un bâtiment de logement, 6=dpe tertiaire bâtiment neuf dans un bâtiment de logement, 7=dpe tertiaire vierge dans un bâtiment de logement, 8=dpe tertiaire vierge neuf dans un bâtiment de logement */
  enum_methode_application_dpe_ter_id: string;
  /** sous modèle de DPE tertiaire correspondant aux catégories en vigueur (https://rt-re-batiment.developpement-durable.gouv.fr/dpe-tertiaire-r378.html) — Valeurs : 1=bureaux, services administratifs, enseignement, 2=bâtiments à occupation continue, 3=autres, 4=centre commercial */
  enum_sous_modele_dpe_ter_id?: string | null;
  /** surface de référence utile du bâtiment auquelle la consommation est rapportée */
  surface_utile: number;
  /** surface hors œuvre nette du bâtiment */
  shon?: number | null;
  /** nombre d'occupants du bâtiment tertiaire */
  nombre_occupant?: number | null;
  /** période de construction — Valeurs : 1=avant 1948, 2=1948-1974, 3=1975-1977, 4=1978-1982, 5=1983-1988, 6=1989-2000, 7=2001-2005, 8=2006-2012, 9=2013-2021, 10=après 2021 */
  enum_periode_construction_id: string;
  /** annee de construction */
  annee_construction?: number | null;
}

/** bilan consommation */
export interface XsdTertiaireBilanConsommation {
  /** classe de consommation d'energie suivant le referentiel DPE 2006 (energie primaire) */
  classe_conso_energie: string;
  /** classe d'estimation ges suivant le referentiel DPE 2006 */
  classe_emission_ges: string;
  /** consommation d'énergie primaire totale rapportée à la surface (kWhep/m²/an) */
  conso_energie_primaire: number;
  /** estimation ges totale rapportée à la surface (kgCO2/m²/an) */
  emission_ges: number;
}

export interface XsdTertiaireConsommation {
  /** consommation d'energie finale du poste de consommation en kWh */
  conso_energie_finale: number;
  /** consommation d'energie primaire du poste de consommation en kWhep */
  conso_energie_primaire: number;
  /** type d'usage associé à la consommation — Valeurs : 1=chauffage, 2=eau chaude sanitaire, 3=refroidissement, 4=eclairage, 5=bureautique, 6=ascenseur(s), 7=autres usages, 8=production d'électricité à demeure, 9=abonnements, 10=transports mécaniques, 11=chauffage et eau chaude sanitaire, 12=périmètre de l'usage inconnu, 13=chauffage, eau chaude sanitaire et climatisation, 14=chauffage et climatisation, 15=eau chaude sanitaire et climatisation, 16=auxi… */
  enum_type_usage_id: string;
  /** type d'énergie associée à la consommaton — Valeurs : 1=électricité, 2=gaz naturel, 3=fioul domestique, 4=bois – bûches, 5=bois – granulés (pellets) ou briquettes, 6=bois – plaquettes forestières, 7=bois – plaquettes d’industrie, 8=réseau de chauffage urbain, 9=propane, 10=butane, 11=charbon, 12=électricité d'origine renouvelable utilisée dans le bâtiment, 13=gpl, 14=autre combustible fossile, 15=réseau de froid urbain */
  enum_type_energie_id: string;
  /** frais d'energies associés à la consommation (en euros) */
  frais_annuels_energie: number;
  /** année de relève de la consommation/production electricité */
  annee_consommation?: number | null;
}

/** Logement neuf */
export interface XsdLogementNeuf {
  repartition_chauffage?: XsdLogementNeufRepartitionChauffage | null;
  repartition_ecs?: XsdLogementNeufRepartitionEcs | null;
  caracteristique_generale: XsdLogementNeufCaracteristiqueGenerale;
  meteo?: XsdLogementNeufMeteo | null;
  enveloppe?: XsdLogementNeufEnveloppe | null;
  ventilation_collection?: { ventilation?: XsdLogementNeufVentilation[] } | null;
  climatisation_collection?: { climatisation?: XsdLogementNeufClimatisation[] } | null;
  production_elec_enr?: XsdLogementNeufProductionElecEnr | null;
  installation_ecs_collection?: { installation_ecs?: XsdLogementNeufInstallationEcs[] } | null;
  installation_chauffage_collection?: {
    installation_chauffage?: XsdLogementNeufInstallationChauffage[];
  } | null;
  sortie: XsdLogementNeufSortie;
  rset?: XsdLogementNeufRset | null;
  rsee?: XsdLogementNeufRsee | null;
}

export interface XsdLogementNeufRepartitionChauffage {
  /** surface des baies du logement orientées nord */
  surface_baie_nord: number;
  /** surface des baies du logement orientées sud */
  surface_baie_sud: number;
  /** surface des baies du logement orientées est ou ouest */
  surface_baie_est_ouest: number;
  /** surface des parois verticales donnant sur l'extérieur */
  surface_paroi_verticale_ext: number;
  /** surface des planchers hauts du logement */
  surface_plancher_haut: number;
  /** surface des planchers bas du logement */
  surface_plancher_bas: number;
  /** coefficient d'individualisation des frais de chauffage dans le cas d'un DPE appartement calculé à partir d'un DPE immeuble */
  coef_ifc: number;
  /** calcul de deperdition logement pour de la clé de répartition de chauffage */
  deperdition_totale_logement: number;
  /** calcul de deperdition batiment pour de la clé de répartition de chauffage */
  deperdition_totale_batiment: number;
  /** clé de répartition de chauffage à appliquer au logement */
  cle_repartition_ch: number;
}

export interface XsdLogementNeufRepartitionEcs {
  /** besoin d'ECS du bâtiment calculé pour la clé de répartition d'ECS */
  besoin_ecs_batiment: number;
  /** besoin d'ECS du logement calculé pour la clé de répartition d'ECS */
  besoin_ecs_logement: number;
  /** clé de répartition de l'ECS */
  cle_repartition_ecs: number;
}

export interface XsdLogementNeufCaracteristiqueGenerale {
  /** annee de construction */
  annee_construction: number;
  /** période de construction — Valeurs : 1=avant 1948, 2=1948-1974, 3=1975-1977, 4=1978-1982, 5=1983-1988, 6=1989-2000, 7=2001-2005, 8=2006-2012, 9=2013-2021, 10=après 2021 */
  enum_periode_construction_id: string;
  /** méthode d'application du DPE logement — Valeurs : 1=dpe maison individuelle, 2=dpe appartement individuel chauffage individuel ecs individuel, 3=dpe appartement individuel chauffage collectif ecs individuel, 4=dpe appartement individuel chauffage individuel ecs collectif, 5=dpe appartement individuel chauffage collectif ecs collectif, 6=dpe immeuble collectif chauffage individuel ecs individuel, 7=dpe immeuble collectif chauffage collectif ecs in… */
  enum_methode_application_dpe_log_id: string;
  /** surface habitable du logement renseignée sauf dans le cas du dpe à l'immeuble */
  surface_habitable_logement?: number | null;
  /** nombre de niveaux total de l'immeuble */
  nombre_niveau_immeuble?: number | null;
  /** nombre de niveaux du logement (maison ou appartement) */
  nombre_niveau_logement?: number | null;
  /** hauteur sous plafond moyenne du logement/de l'immeuble */
  hsp: number;
  /** surface habitable totale de l'immeuble dans le cas d'un DPE appartement avec usage collectif ou d'un DPE immeuble. */
  surface_habitable_immeuble?: number | null;
  /** surface tertiaire totale de l'immeuble dans le cas d'un DPE immeuble. La surface tertiaire est prise en compte pour le calcul des besoins dans le cas d'une installation collective mixte tertiaire/residentiel */
  surface_tertiaire_immeuble?: number | null;
  /** nombre d'appartements de l'immeuble dans le cas d'un DPE appartement avec usage collectif ou d'un DPE immeuble. */
  nombre_appartement?: number | null;
  /** est ce que l'appartement est un appartement non visité dans le cas d'un DPE appartement généré à partir d'un immeuble. (application de système individuel les moins performants de l'immeuble) */
  appartement_non_visite?: 0 | 1 | null;
  /** Indique si le bâtiment ou logement peut modifier ou décaler certains usages énergétiques en réponse à des signaux extérieurs. Donnée facultative réservée à l'état initial de l'audit. */
  flexibilite_reseau: 0 | 1;
}

export interface XsdLogementNeufMeteo {
  /** zone climatique du logement — Valeurs : 1=h1a, 2=h1b, 3=h1c, 4=h2a, 5=h2b, 6=h2c, 7=h2d, 8=h3 */
  enum_zone_climatique_id?: string | null;
  /** classe d'altitude du logement — Valeurs : 1=inférieur à 400m, 2=400-800m, 3=supérieur à 800m */
  enum_classe_altitude_id?: string | null;
  /** est ce que le bâtiment est principalement composé de matériaux anciens pour ses murs 0 : non 1 : oui */
  batiment_materiaux_anciens?: 0 | 1 | null;
}

export interface XsdLogementNeufEnveloppe {
  inertie?: XsdLogementNeufEnveloppeInertie | null;
  mur_collection?: { mur?: XsdLogementNeufEnveloppeMur[] } | null;
  plancher_bas_collection?: { plancher_bas?: XsdLogementNeufEnveloppePlancherBas[] } | null;
  plancher_haut_collection?: { plancher_haut?: XsdLogementNeufEnveloppePlancherHaut[] } | null;
  baie_vitree_collection?: { baie_vitree?: XsdLogementNeufEnveloppeBaieVitree[] } | null;
  porte_collection?: { porte?: XsdLogementNeufEnveloppePorte[] } | null;
  pont_thermique_collection?: { pont_thermique?: XsdLogementNeufEnveloppePontThermique[] } | null;
}

export interface XsdLogementNeufEnveloppeInertie {
  /** classe d'inertie globale du bâtiment — Valeurs : 1=très lourde, 2=lourde, 3=moyenne, 4=légère */
  enum_classe_inertie_id?: string | null;
}

export interface XsdLogementNeufEnveloppeMur {
  donnee_entree?: XsdLogementNeufEnveloppeMurDonneeEntree | null;
  donnee_intermediaire?: XsdLogementNeufEnveloppeMurDonneeIntermediaire | null;
}

export interface XsdLogementNeufEnveloppeMurDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference?: string | null;
  /** surface aiu : surface des parois du local non chauffé qui donnent sur des locaux chauffés. */
  surface_aiu?: number | null;
  /** surface aue : surface des parois du local non chauffé en contact avec l'extérieur ou le sol */
  surface_aue?: number | null;
  /** configuration de l'adjacence avec local non chauffé : local chauffé (non) isolé/local non chauffé (non) isolé/orientation véranda qui permet de calculer le b — Valeurs : 1=local chauffé non accessible, 2=lc non isolé + lnc non isolé, 3=lc non isolé + lnc isolé, 4=lc isolé + lnc non isolé, 5=lc isolé + lnc isolé, 6=lc isolé + espace tampon solarisé orienté nord, 7=lc isolé + espace tampon solarisé orienté sud, 8=lc isolé + espace tampon solarisé orienté est/ouest, 9=lc non isolé + espace tampon solarisé orienté nord, 10=lc non isolé + espace tampon solarisé orienté… */
  enum_cfg_isolation_lnc_id?: string | null;
  /** type d'adjacence de la paroi — Valeurs : 1=extérieur, 2=paroi enterrée, 3=vide sanitaire, 4=bâtiment ou local à usage autre que d'habitation, 5=terre-plein, 6=sous-sol non chauffé, 7=locaux non chauffés non accessible, 8=garage, 9=cellier, 10=espace tampon solarisé (véranda,loggia fermée), 11=comble fortement ventilé, 12=comble faiblement ventilé, 13=comble très faiblement ventilé, 14=circulation sans ouverture directe sur l'extérieur, 1… */
  enum_type_adjacence_id?: string | null;
  /** orientation du mur — Valeurs : 1=sud, 2=nord, 3=est, 4=ouest, 5=horizontal */
  enum_orientation_id?: string | null;
  /** Surface de paroi opaque + paroi vitrée de la paroi + surface des portes */
  surface_paroi_totale?: number | null;
  /** Surface de paroi opaque (sans baies vitrées sans portes) */
  surface_paroi_opaque?: number | null;
  /** epaisseur de la partie structure de la paroi (sans l'isolation intérieure ou extérieure) (cm) */
  epaisseur_structure?: number | null;
  /** matériaux de structure de la paroi — Valeurs : 1=inconnu, 2=murs en pierre de taille et moellons constitué d'un seul matériaux, 3=murs en pierre de taille et moellons avec remplissage tout venant, 4=murs en pisé ou béton de terre stabilisé (à partir d'argile crue), 5=murs en pan de bois sans remplissage tout venant, 6=murs en pan de bois avec remplissage tout venant, 7=murs bois (rondin), 8=murs en briques pleines simples, 9=murs en briques pl… */
  enum_materiaux_structure_mur_id?: string | null;
  /** est ce qu'un enduit isolant est présent sur la paroi si celle-ci est une paroi ancienne (pierres, terre, mur à colombage, brique ancienne)(Renduit=0,7m².K.W-1) 0 : non 1 : oui. (renommage de la propriété paroi_ancienne -> enduit_isolant_paroi_ancienne) */
  enduit_isolant_paroi_ancienne?: 0 | 1 | null;
  /** type de doublage intérieur du mur.(précision de la nature du doublage ou de l'epaisseur de la lame d'air en cas de doublage indéterminé.) — Valeurs : 1=inconnu, 2=absence de doublage, 3=doublage indéterminé ou lame d'air inf 15 mm, 4=doublage indéterminé avec lame d'air sup 15 mm, 5=doublage connu (plâtre brique bois) */
  enum_type_doublage_id?: string | null;
  /** type d'isolation du mur (ITI/ITE…..) — Valeurs : 1=inconnu, 2=non isolé, 3=iti, 4=ite, 5=itr, 6=iti+ite, 7=iti+itr, 8=ite+itr, 9=isolé mais type d'isolation inconnu */
  enum_type_isolation_id?: string | null;
  /** resistance isolation */
  resistance_isolation?: number | null;
  /** epaisseur de l'isolation (si plusieurs isolant différents sommer leurs épaisseurs) (cm) */
  epaisseur_isolation?: number | null;
  /** methode de saisie du U (inclus les justifications à produire en cas de saisie directe) — Valeurs : 1=non isolé, 2=isolation inconnue (table forfaitaire), 3=epaisseur isolation saisie justifiée par mesure ou observation, 4=epaisseur isolation saisie justifiée à partir des documents justificatifs autorisés, 5=resistance isolation saisie justifiée observation de l'isolant installé et mesure de son épaisseur, 6=resistance isolation saisie justifiée à partir des documents justificatifs autorisés, 7=… */
  enum_methode_saisie_u_id?: string | null;
}

export interface XsdLogementNeufEnveloppeMurDonneeIntermediaire {
  /** coefficient de réduction des déperditions du mur */
  b?: number | null;
  /** Coefficient de transmission thermique du mur */
  umur?: number | null;
  /** Coefficient de transmission thermique du mur non isolé final (avec pris en compte de l'enduit et du doublage). C'est bien le U du mur "nu" avec l'ensemble des éléments hors isolations rapportée */
  umur0?: number | null;
}

export interface XsdLogementNeufEnveloppePlancherBas {
  donnee_entree?: XsdLogementNeufEnveloppePlancherBasDonneeEntree | null;
  donnee_intermediaire?: XsdLogementNeufEnveloppePlancherBasDonneeIntermediaire | null;
}

export interface XsdLogementNeufEnveloppePlancherBasDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference?: string | null;
  /** surface aiu : surface des parois du local non chauffé qui donnent sur des locaux chauffés. */
  surface_aiu?: number | null;
  /** surface aue : surface des parois du local non chauffé en contact avec l'extérieur ou le sol */
  surface_aue?: number | null;
  /** configuration de l'adjacence avec local non chauffé : local chauffé (non) isolé/local non chauffé (non) isolé/orientation véranda qui permet de calculer le b — Valeurs : 1=local chauffé non accessible, 2=lc non isolé + lnc non isolé, 3=lc non isolé + lnc isolé, 4=lc isolé + lnc non isolé, 5=lc isolé + lnc isolé, 6=lc isolé + espace tampon solarisé orienté nord, 7=lc isolé + espace tampon solarisé orienté sud, 8=lc isolé + espace tampon solarisé orienté est/ouest, 9=lc non isolé + espace tampon solarisé orienté nord, 10=lc non isolé + espace tampon solarisé orienté… */
  enum_cfg_isolation_lnc_id?: string | null;
  /** type d'adjacence de la paroi — Valeurs : 1=extérieur, 2=paroi enterrée, 3=vide sanitaire, 4=bâtiment ou local à usage autre que d'habitation, 5=terre-plein, 6=sous-sol non chauffé, 7=locaux non chauffés non accessible, 8=garage, 9=cellier, 10=espace tampon solarisé (véranda,loggia fermée), 11=comble fortement ventilé, 12=comble faiblement ventilé, 13=comble très faiblement ventilé, 14=circulation sans ouverture directe sur l'extérieur, 1… */
  enum_type_adjacence_id?: string | null;
  /** Surface de paroi opaque */
  surface_paroi_opaque?: number | null;
  /** type de plancher bas — Valeurs : 1=inconnu, 2=plancher avec ou sans remplissage, 3=plancher entre solives métalliques avec ou sans remplissage, 4=plancher entre solives bois avec ou sans remplissage, 5=plancher bois sur solives métalliques, 6=bardeaux et remplissage, 7=voutains sur solives métalliques, 8=voutains en briques ou moellons, 9=dalle béton, 10=plancher bois sur solives bois, 11=plancher lourd type entrevous terre-cuite… */
  enum_type_plancher_bas_id?: string | null;
  /** type d'isolation du plancher bas (ITI/ITE…..) — Valeurs : 1=inconnu, 2=non isolé, 3=iti, 4=ite, 5=itr, 6=iti+ite, 7=iti+itr, 8=ite+itr, 9=isolé mais type d'isolation inconnu */
  enum_type_isolation_id?: string | null;
  /** resistance isolation */
  resistance_isolation?: number | null;
  /** epaisseur de l'isolation (si plusieurs isolant différents sommer leurs épaisseurs) */
  epaisseur_isolation?: number | null;
  /** methode de saisie du U (inclus les justifications à produire en cas de saisie directe) — Valeurs : 1=non isolé, 2=isolation inconnue (table forfaitaire), 3=epaisseur isolation saisie justifiée par mesure ou observation, 4=epaisseur isolation saisie justifiée à partir des documents justificatifs autorisés, 5=resistance isolation saisie justifiée observation de l'isolant installé et mesure de son épaisseur, 6=resistance isolation saisie justifiée à partir des documents justificatifs autorisés, 7=… */
  enum_methode_saisie_u_id?: string | null;
}

export interface XsdLogementNeufEnveloppePlancherBasDonneeIntermediaire {
  /** coefficient de réduction des déperditions du planchers_bas */
  b?: number | null;
  /** Coefficient de transmission thermique du planchers_bas (Ue ou Upb en fonction du type d'adjacence) */
  upb_final?: number | null;
  /** Coefficient de transmission thermique du planchers bas non isolé final */
  upb0?: number | null;
}

export interface XsdLogementNeufEnveloppePlancherHaut {
  donnee_entree?: XsdLogementNeufEnveloppePlancherHautDonneeEntree | null;
  donnee_intermediaire?: XsdLogementNeufEnveloppePlancherHautDonneeIntermediaire | null;
}

export interface XsdLogementNeufEnveloppePlancherHautDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference?: string | null;
  /** surface aiu : surface des parois du local non chauffé qui donnent sur des locaux chauffés. */
  surface_aiu?: number | null;
  /** surface aue : surface des parois du local non chauffé en contact avec l'extérieur ou le sol */
  surface_aue?: number | null;
  /** configuration de l'adjacence avec local non chauffé : local chauffé (non) isolé/local non chauffé (non) isolé/orientation véranda qui permet de calculer le b — Valeurs : 1=local chauffé non accessible, 2=lc non isolé + lnc non isolé, 3=lc non isolé + lnc isolé, 4=lc isolé + lnc non isolé, 5=lc isolé + lnc isolé, 6=lc isolé + espace tampon solarisé orienté nord, 7=lc isolé + espace tampon solarisé orienté sud, 8=lc isolé + espace tampon solarisé orienté est/ouest, 9=lc non isolé + espace tampon solarisé orienté nord, 10=lc non isolé + espace tampon solarisé orienté… */
  enum_cfg_isolation_lnc_id?: string | null;
  /** type d'adjacence de la paroi — Valeurs : 1=extérieur, 2=paroi enterrée, 3=vide sanitaire, 4=bâtiment ou local à usage autre que d'habitation, 5=terre-plein, 6=sous-sol non chauffé, 7=locaux non chauffés non accessible, 8=garage, 9=cellier, 10=espace tampon solarisé (véranda,loggia fermée), 11=comble fortement ventilé, 12=comble faiblement ventilé, 13=comble très faiblement ventilé, 14=circulation sans ouverture directe sur l'extérieur, 1… */
  enum_type_adjacence_id?: string | null;
  /** Surface de paroi opaque */
  surface_paroi_opaque?: number | null;
  /** type de plancher haut — Valeurs : 1=inconnu, 2=plafond avec ou sans remplissage, 3=plafond entre solives métalliques avec ou sans remplissage, 4=plafond entre solives bois avec ou sans remplissage, 5=plafond bois sur solives métalliques, 6=plafond bois sous solives métalliques, 7=bardeaux et remplissage, 8=dalle béton, 9=plafond bois sur solives bois, 10=plafond bois sous solives bois, 11=plafond lourd type entrevous terre-cuite, … */
  enum_type_plancher_haut_id?: string | null;
  /** type d'isolation du plancher haut (ITI/ITE…..) — Valeurs : 1=inconnu, 2=non isolé, 3=iti, 4=ite, 5=itr, 6=iti+ite, 7=iti+itr, 8=ite+itr, 9=isolé mais type d'isolation inconnu */
  enum_type_isolation_id?: string | null;
  /** resistance isolation */
  resistance_isolation?: number | null;
  /** epaisseur de l'isolation (si plusieurs isolant différents sommer leurs épaisseurs) */
  epaisseur_isolation?: number | null;
  /** methode de saisie du U (inclus les justifications à produire en cas de saisie directe) — Valeurs : 1=non isolé, 2=isolation inconnue (table forfaitaire), 3=epaisseur isolation saisie justifiée par mesure ou observation, 4=epaisseur isolation saisie justifiée à partir des documents justificatifs autorisés, 5=resistance isolation saisie justifiée observation de l'isolant installé et mesure de son épaisseur, 6=resistance isolation saisie justifiée à partir des documents justificatifs autorisés, 7=… */
  enum_methode_saisie_u_id?: string | null;
}

export interface XsdLogementNeufEnveloppePlancherHautDonneeIntermediaire {
  /** coefficient de réduction des déperditions du planchers_hauts */
  b?: number | null;
  /** Coefficient de transmission thermique du planchers_hauts uph */
  uph?: number | null;
  /** Coefficient de transmission thermique du planchers hauts non isolé final */
  uph0?: number | null;
}

export interface XsdLogementNeufEnveloppeBaieVitree {
  donnee_entree?: XsdLogementNeufEnveloppeBaieVitreeDonneeEntree | null;
  donnee_intermediaire?: XsdLogementNeufEnveloppeBaieVitreeDonneeIntermediaire | null;
}

export interface XsdLogementNeufEnveloppeBaieVitreeDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference?: string | null;
  /** reference projet de l'objet paroi qui est associé à l'objet baie vitrée. La codification et utilisation des références peut différer entre logiciels mais il devrait être attendu que reference_paroi est la référence d'une paroi de type mur,plancher_haut ou plancher_bas */
  reference_paroi?: string | null;
  /** surface aiu : surface des parois du local non chauffé qui donnent sur des locaux chauffés. */
  surface_aiu?: number | null;
  /** surface aue : surface des parois du local non chauffé en contact avec l'extérieur ou le sol */
  surface_aue?: number | null;
  /** configuration de l'adjacence avec local non chauffé : local chauffé (non) isolé/local non chauffé (non) isolé/orientation véranda qui permet de calculer le b — Valeurs : 1=local chauffé non accessible, 2=lc non isolé + lnc non isolé, 3=lc non isolé + lnc isolé, 4=lc isolé + lnc non isolé, 5=lc isolé + lnc isolé, 6=lc isolé + espace tampon solarisé orienté nord, 7=lc isolé + espace tampon solarisé orienté sud, 8=lc isolé + espace tampon solarisé orienté est/ouest, 9=lc non isolé + espace tampon solarisé orienté nord, 10=lc non isolé + espace tampon solarisé orienté… */
  enum_cfg_isolation_lnc_id?: string | null;
  /** type d'adjacence de la paroi — Valeurs : 1=extérieur, 2=paroi enterrée, 3=vide sanitaire, 4=bâtiment ou local à usage autre que d'habitation, 5=terre-plein, 6=sous-sol non chauffé, 7=locaux non chauffés non accessible, 8=garage, 9=cellier, 10=espace tampon solarisé (véranda,loggia fermée), 11=comble fortement ventilé, 12=comble faiblement ventilé, 13=comble très faiblement ventilé, 14=circulation sans ouverture directe sur l'extérieur, 1… */
  enum_type_adjacence_id?: string | null;
  /** surface totale de paroi vitrée pour ce type de vitrage et sur cette orientation (nombre de baies x surface unitaire). La surface est la surface de la baie dans son ensemble. (vitrage + menuiserie inclus) */
  surface_totale_baie?: number | null;
  /** nombre de baies */
  nb_baie?: number | null;
  /** type de vitrage — Valeurs : 1=simple vitrage, 2=double vitrage, 3=triple vitrage, 4=survitrage, 5=brique de verre, 6=polycarbonate */
  enum_type_vitrage_id?: string | null;
  /** inclinaison du vitrage — Valeurs : 1=inf25°, 2=25°-75°, 3=sup75°, 4=horizontal */
  enum_inclinaison_vitrage_id?: string | null;
  /** type de gaz présent dans la lame — Valeurs : 1=air, 2=argon ou krypton, 3=inconnu */
  enum_type_gaz_lame_id?: string | null;
  /** epaisseur de la lame */
  epaisseur_lame?: number | null;
  /** est ce que le vitrage est à isolation renforcée 0 : non 1 : oui */
  vitrage_vir?: 0 | 1 | null;
  /** methode de saisie des caractéristiques thermiques des vitrage (valeurs forfaitaires ou saisies en direct lorsque issu d'un justificatif) — Valeurs : 1=ug(opt),uw,ujn(opt) et sw saisi à l'aide des tables de valeurs forfaitaires et des relèves mesurées/observées, 2=ug saisi directementà partir des documents justificatifs autorisés , autres paramètres calculés avec les tables forfaitaires, 3=ug,uw saisi directement à partir des documents justificatifs autorisés , autres paramètres calculés avec les tables forfaitaires, 4=ug,uw,sw saisi directemen… */
  enum_methode_saisie_perf_vitrage_id?: string | null;
  /** type de matériaux des menuiseries — Valeurs : 1=brique de verre, 2=polycarbonate, 3=bois, 4=bois/métal, 5=pvc, 6=métal avec rupture de pont thermique, 7=métal sans rupture de pont thermique */
  enum_type_materiaux_menuiserie_id?: string | null;
  /** type de baie — Valeurs : 1=paroi en brique de verre pleine, 2=paroi en brique de verre creuse, 3=paroi en polycarbonnate, 4=fenêtres battantes, 5=fenêtres coulissantes, 6=portes-fenêtres coulissantes, 7=portes-fenêtres battantes sans soubassement, 8=portes-fenêtres battantes avec soubassement */
  enum_type_baie_id?: string | null;
  /** type de fermeture associé à la baie (volets/persiennes etc..) — Valeurs : 1=abscence de fermeture pour la baie vitrée, 2=jalousie accordéon, fermeture à lames orientables y compris les vénitiens extérieurs tout métal, volets battants ou persiennes avec ajours fixes, 3=fermeture sans ajours en position déployée, volets roulants alu, 4=volets roulants pvc ou bois (e inf 12 mm), 5=persienne coulissante et volet battant pvc ou bois (e inf 22 mm), 6=volets roulants pvc ou bo… */
  enum_type_fermeture_id?: string | null;
  /** y a-t-il présence de joints sur la baie (utilisé pour le calcul de la perméabilité) 0 : non 1 : oui */
  presence_protection_solaire_hors_fermeture?: 0 | 1 | null;
  /** type de pose de la baie — Valeurs : 1=nu extérieur, 2=nu intérieur, 3=tunnel, 4=sans objet (brique de verre/polycarbonate) */
  enum_type_pose_id?: string | null;
  /** y a-t-il un retour d'isolant de la paroi opaque sur la baie 0 : non 1 : oui */
  presence_retour_isolation?: 0 | 1 | null;
  /** y a-t-il présence de joints sur la baie (utilisé pour le calcul de la perméabilité) 0 : non 1 : oui */
  presence_joint?: 0 | 1 | null;
  /** orientation de la baie — Valeurs : 1=sud, 2=nord, 3=est, 4=ouest, 5=horizontal */
  enum_orientation_id?: string | null;
}

export interface XsdLogementNeufEnveloppeBaieVitreeDonneeIntermediaire {
  /** coefficient de réduction des déperditions de la baie vitrée */
  b?: number | null;
  /** Ug final de la baie : soit saisi directement soit issu des tables forfaitaires */
  ug?: number | null;
  /** Uw final de la baie : soit saisi directement soit issu des tables forfaitaires */
  uw?: number | null;
  /** Ujn final de la baie : soit saisi directement soit issu des tables forfaitaires */
  ujn?: number | null;
  /** U final de la menuiserie utilisé dans le calcul : soit Ujn dans le cas d'une baie avec protection solaire soit Uw dans le cas d'une baie sans protection solaire */
  u_menuiserie?: number | null;
  /** sw final de la baie: soit saisi directement soit issu des tables forfaitaires */
  sw?: number | null;
}

export interface XsdLogementNeufEnveloppePorte {
  donnee_entree?: XsdLogementNeufEnveloppePorteDonneeEntree | null;
  donnee_intermediaire?: XsdLogementNeufEnveloppePorteDonneeIntermediaire | null;
}

export interface XsdLogementNeufEnveloppePorteDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference?: string | null;
  /** reference projet de l'objet paroi qui est associé à l'objet porte. La codification et utilisation des références peut différer entre logiciels mais il devrait être attendu que reference_paroi est la référence d'une paroi de type mur,plancher_haut ou plancher_bas */
  reference_paroi?: string | null;
  /** configuration de l'adjacence avec local non chauffé : local chauffé (non) isolé/local non chauffé (non) isolé/orientation véranda qui permet de calculer le b — Valeurs : 1=local chauffé non accessible, 2=lc non isolé + lnc non isolé, 3=lc non isolé + lnc isolé, 4=lc isolé + lnc non isolé, 5=lc isolé + lnc isolé, 6=lc isolé + espace tampon solarisé orienté nord, 7=lc isolé + espace tampon solarisé orienté sud, 8=lc isolé + espace tampon solarisé orienté est/ouest, 9=lc non isolé + espace tampon solarisé orienté nord, 10=lc non isolé + espace tampon solarisé orienté… */
  enum_cfg_isolation_lnc_id?: string | null;
  /** type d'adjacence de la paroi — Valeurs : 1=extérieur, 2=paroi enterrée, 3=vide sanitaire, 4=bâtiment ou local à usage autre que d'habitation, 5=terre-plein, 6=sous-sol non chauffé, 7=locaux non chauffés non accessible, 8=garage, 9=cellier, 10=espace tampon solarisé (véranda,loggia fermée), 11=comble fortement ventilé, 12=comble faiblement ventilé, 13=comble très faiblement ventilé, 14=circulation sans ouverture directe sur l'extérieur, 1… */
  enum_type_adjacence_id?: string | null;
  /** surface aiu : surface des parois du local non chauffé qui donnent sur des locaux chauffés. */
  surface_aiu?: number | null;
  /** surface aue : surface des parois du local non chauffé en contact avec l'extérieur ou le sol */
  surface_aue?: number | null;
  /** surface totale de portes déclaré (nb_porte x surface unitaire de porte dans le cas de plusieurs portes) */
  surface_porte?: number | null;
  /** méthode de saisie du U de la porte — Valeurs : 1=valeur forfaitaire, 2=valeur justifiée saisie à partir des documents justificatifs autorisés, 3=saisie direct u depuis rset/rsee( etude rt2012/re2020) */
  enum_methode_saisie_uporte_id?: string | null;
  /** type de porte — Valeurs : 1=porte simple en bois porte opaque pleine, 2=porte simple en bois porte avec moins de 30% de vitrage simple, 3=porte simple en bois porte avec 30-60% de vitrage simple, 4=porte simple en bois porte avec double vitrage, 5=porte simple en pvc porte opaque pleine, 6=porte simple en pvc porte avec moins de 30% de vitrage simple, 7=porte simple en pvc porte avec 30-60% de vitrage simple, 8=porte simpl… */
  enum_type_porte_id?: string | null;
  /** nombre de portes */
  nb_porte?: number | null;
  /** largeur du dormant de la porte (cm) */
  largeur_dormant?: number | null;
  /** y a-t-il un retour d'isolant de la paroi opaque sur la porte 0 : non 1 : oui */
  presence_retour_isolation?: 0 | 1 | null;
  /** y a-t-il présence de joints sur la porte (utilisé pour le calcul de la perméabilité) 0 : non 1 : oui */
  presence_joint?: 0 | 1 | null;
  /** type de pose de la porte — Valeurs : 1=nu extérieur, 2=nu intérieur, 3=tunnel, 4=sans objet (brique de verre/polycarbonate) */
  enum_type_pose_id?: string | null;
}

export interface XsdLogementNeufEnveloppePorteDonneeIntermediaire {
  /** coefficient de transmission thermique de la porte final : soit saisi directement soit issu des tables de valeurs forfaitaires */
  uporte?: number | null;
  /** coefficient de transmission thermique de la porte final : soit saisi directement soit issu des tables de valeurs forfaitaires */
  b?: number | null;
}

export interface XsdLogementNeufEnveloppePontThermique {
  donnee_entree?: XsdLogementNeufEnveloppePontThermiqueDonneeEntree | null;
  donnee_intermediaire?: XsdLogementNeufEnveloppePontThermiqueDonneeIntermediaire | null;
}

export interface XsdLogementNeufEnveloppePontThermiqueDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels. Pour les ponts thermique il est laissé la possibilité d'avoir 2 références complémentaires correspondant aux référence de chacun des deux objets concernés par le pont thermique */
  reference_1?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels. Pour les ponts thermique il est laissé la possibilité d'avoir 2 références complémentaires correspondant aux référence de chacun des deux objets concernés par le pont thermique */
  reference_2?: string | null;
  /** methode de saisie des ponts thermiques — Valeurs : 1=valeur forfaitaire, 2=valeur justifiée saisie à partir des documents justificatifs autorisés, 3=saisie direct k depuis rset/rsee( etude rt2012/re2020) */
  enum_methode_saisie_pont_thermique_id?: string | null;
  /** longueur du pont thermique(m) */
  l?: number | null;
  /** type de liaison de pont thermique — Valeurs : 1=plancher bas / mur, 2=plancher intermédiaire lourd / mur, 3=plancher haut lourd / mur, 4=refend / mur, 5=menuiserie / mur */
  enum_type_liaison_id?: string | null;
}

export interface XsdLogementNeufEnveloppePontThermiqueDonneeIntermediaire {
  /** valeur du pont thermique */
  k?: number | null;
}

export interface XsdLogementNeufVentilation {
  donnee_entree?: XsdLogementNeufVentilationDonneeEntree | null;
  donnee_intermediaire?: XsdLogementNeufVentilationDonneeIntermediaire | null;
}

export interface XsdLogementNeufVentilationDonneeEntree {
  /** surface ventilée. Dans le cas d'une seule ventilation c'est la surface habitable totale. Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la surface de l'installation à l'immeuble qu'il faut renseigner */
  surface_ventile?: number | null;
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference?: string | null;
  /** est ce qu'il y a plusieurs facades exposées au vent 0 : non 1 : oui */
  plusieurs_facade_exposee?: 0 | 1 | null;
  /** code de la methode de saisie du q4paconv — Valeurs : 1=valeur forfaitaire, 2=déterminé à partir d'une mesure d'étanchéité à l'air de moins de deux ans, 3=déterminé à partir du rset/rsee( etude rt2012/re2020) */
  enum_methode_saisie_q4pa_conv_id?: string | null;
  /** code de la méthode de détermination de la puissance moyenne des auxiliaires de ventilation — Valeurs : 1=valeur forfaitaire, 2=déterminé à partir de la plaque signalétique ou d'une documentation technique du système, 3=déterminé à partir du rset/rsee (étude rt2012/re2020) */
  enum_methode_saisie_pvent_moy_id?: string | null;
  /** code du type de ventilation — Valeurs : 1=aération par ouverture des fenêtres, 2=ventilation par entrées d'air hautes et basses, 3=vmc sf auto réglable avant 1982, 4=vmc sf auto réglable de 1982 à 2000, 5=vmc sf auto réglable de 2001 à 2012, 6=vmc sf auto réglable après 2012, 7=vmc sf hygro a avant 2001, 8=vmc sf hygro a de 2001 à 2012, 9=vmc sf hygro a après 2012, 10=vmc sf gaz avant 2001, 11=vmc sf gaz de 2001 à 2012, 12=vmc sf gaz ap… */
  enum_type_ventilation_id?: string | null;
  /** est ce que le système de ventilation est postérieur à 2012 0 : non 1 : oui */
  ventilation_post_2012?: 0 | 1 | null;
  /** référence produit et marque du système de ventilation */
  ref_produit_ventilation?: string | null;
}

export interface XsdLogementNeufVentilationDonneeIntermediaire {
  /** puissance de la ventilation moyenne soit saisie soit calculée avec la méthode proposée */
  pvent_moy?: number | null;
  /** q4pa conv final soit issue d'une saisie de mesure à l'étanchéité à l'air soit d'une valeur forfaitaire. valeur conventionnelle de la perméabilité sous 4Pa (m3/(h.m2)) */
  q4pa_conv?: number | null;
  /** Consommation des auxilliaires de ventilation. Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation de l'installation à l'immeuble qu'il faut saisir. */
  conso_auxiliaire_ventilation?: number | null;
  /** déperdition thermique par renouvellement d'air due au vent */
  hperm?: number | null;
  /** déperdition thermique par renouvellement d'air due au système de ventilation */
  hvent?: number | null;
}

export interface XsdLogementNeufClimatisation {
  donnee_entree?: XsdLogementNeufClimatisationDonneeEntree | null;
  donnee_intermediaire?: XsdLogementNeufClimatisationDonneeIntermediaire | null;
}

export interface XsdLogementNeufClimatisationDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference?: string | null;
  /** surface climatisée : si le logement n'est pas climatisé dans son ensemble la surface climatisée peut être inférieure à la surface totale du logement.Dans le cas spécifique d'un DPE immeuble avec installation individuelle échantillonée :saisir la surface climatisée par la totalité des logements représentés par le logement moyen surface_clim = Shmoy*Nblgt. Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la surface de l'installation à l'immeuble qu'il faut renseigner */
  surface_clim?: number | null;
  /** type de générateur de froid — Valeurs : 1=pac air/air installée avant 2008, 2=pac air/air installée entre 2008 et 2014, 3=pac air/air installée à partir de 2015, 4=pac air/eau installée avant 2008, 5=pac air/eau installée entre 2008 et 2014, 6=pac air/eau installée entre 2015 et 2016, 7=pac air/eau installée après 2017, 8=pac eau/eau installée avant 2008, 9=pac eau/eau installée entre 2008 et 2014, 10=pac eau/eau installée entre 2015 et… */
  enum_type_generateur_fr_id?: string | null;
  /** type d'énergie consommée par le générateur de froid — Valeurs : 1=électricité, 2=gaz naturel, 3=fioul domestique, 4=bois – bûches, 5=bois – granulés (pellets) ou briquettes, 6=bois – plaquettes forestières, 7=bois – plaquettes d’industrie, 8=réseau de chauffage urbain, 9=propane, 10=butane, 11=charbon, 12=électricité d'origine renouvelable utilisée dans le bâtiment, 13=gpl, 14=autre combustible fossile, 15=réseau de froid urbain */
  enum_type_energie_id?: string | null;
  /** identifiant réseau de froid utilisé (utilisé à partir du 18 janvier 2022). Cet identifiant doit correspondre à un identifiant déclaré dans la liste des réseaux de chaleurs spécifiés dans l'arrêté en vigueur qui modifie l'annexe 7 de l'arrêté du 15 septembre 2006 relatif au diagnostic de performance energétique */
  identifiant_reseau_chaleur?: string | null;
  /** date de l'arrêté relatif au réseau de chaleur ou de froid utilisé */
  date_arrete_reseau_chaleur?: string | null;
  /** methode de saisie du seer : lecture de table forfaitaire ou saisie justifiée — Valeurs : 1=valeurs forfaitaires, 2=caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, autres données forfaitaires, 3=caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, rpn,rpint, autres données forfaitaires, 4=caractéristiques saisies à partir de la plaque signalét… */
  enum_methode_saisie_carac_sys_id?: string | null;
  /** référence produit et marque du générateur de froid */
  ref_produit_fr?: string | null;
  /** Estimation de la durée de vie restante du système de climatisation, en années. Donnée facultative réservée à l'état initial et à renseigner uniquement si le système existe. */
  clim_duree_vie_restante?: number | null;
}

export interface XsdLogementNeufClimatisationDonneeIntermediaire {
  /** coefficient d'efficience energétique du système de climatisation final (SEER *0,95) */
  eer?: number | null;
  /** besoin de refroidissement annuel. Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est le besoin de l'installation à l'immeuble qu'il faut saisir. */
  besoin_fr?: number | null;
  /** consommation de refroidissement annuel (kWh). Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation de l'installation à l'immeuble qu'il faut saisir. */
  conso_fr?: number | null;
}

export interface XsdLogementNeufProductionElecEnr {
  donnee_entree?: XsdLogementNeufProductionElecEnrDonneeEntree | null;
  donnee_intermediaire?: XsdLogementNeufProductionElecEnrDonneeIntermediaire | null;
  panneaux_pv_collection?: {
    panneaux_pv?:
      XsdLogementNeufProductionElecEnrPanneauxPv | XsdLogementNeufProductionElecEnrPanneauxPv[];
  } | null;
}

export interface XsdLogementNeufProductionElecEnrDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference?: string | null;
  /** est ce qu'il y a de la production de photovoltaique renouvelable 0 : non 1 : oui */
  presence_production_pv?: 0 | 1 | null;
  /** enumérateur listant les systèmes de production d'éléctricité d'origine renouvelables présents dans le bâtiment — Valeurs : 1=solaire photovoltaïque, 2=eolien, 3=solaire photovoltaïque + eolien, 4=cogénération, 5=solaire photovoltaïque + cogénération, 6=eolien + cogénération, 7=solaire photovoltaïque + eolien + cogénération */
  enum_type_enr_id?: string | null;
}

export interface XsdLogementNeufProductionElecEnrDonneeIntermediaire {
  /** taux d'autoproduction Tap de la production d'éléctricité d'origne renouvelable */
  taux_autoproduction?: number | null;
  /** production d'éléctricité photovoltaique (kWh) */
  production_pv?: number | null;
  /** éléctricité photovoltaique autoconsommée (kWh) */
  conso_elec_ac?: number | null;
}

export interface XsdLogementNeufProductionElecEnrPanneauxPv {
  /** surface totale de capteurs photovoltaïque. Dans le cas d'une installation collective de PV pour un DPE appartement, la surface est celle proratisé */
  surface_totale_capteurs?: number | null;
  /** nombre de modules photovoltaïque standards posés. */
  nombre_module?: number | null;
}

export interface XsdLogementNeufInstallationEcs {
  donnee_entree?: XsdLogementNeufInstallationEcsDonneeEntree | null;
  donnee_intermediaire?: XsdLogementNeufInstallationEcsDonneeIntermediaire | null;
  generateur_ecs_collection?: {
    generateur_ecs?: XsdLogementNeufInstallationEcsGenerateurEcs[];
  } | null;
}

export interface XsdLogementNeufInstallationEcsDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference?: string | null;
  /** code de configuration de l'installation d'ECS (installation simple, avec solaire ou avec plusieurs systèmes d'ECS) — Valeurs : 1=un seul système d'ecs sans solaire, 2=un seul système d'ecs avec solaire, 3=deux systèmes d'ecs dans une maison ou un appartement */
  enum_cfg_installation_ecs_id?: string | null;
  /** code du type d'installation d'ECS (collective ou individuelle) — Valeurs : 1=installation individuelle, 2=installation collective, 3=installation collective multi-bâtiment : modélisée comme un réseau de chaleur, 4=installation hybride collective-individuelle (chauffage base + appoint individuel ou convecteur bi-jonction) */
  enum_type_installation_id?: string | null;
  /** surface habitable correspondant au(x) logement(x) desservi(s) par l'installation d'ECS.(surface habitable du logement ou de la totalité des logements de l'immeuble) Dans le cas spécifique d'un DPE immeuble avec installation individuelle échantillonée :saisir la surface de la totalité des logements représentés par le logement moyen surface_habitable= Shmoy*Nblgt. Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la surface de l'installation à l'immeuble qu'il faut renseigner */
  surface_habitable?: number | null;
  /** nombre de logements desservis par l'installation d'ECS. Dans le cas d'un DPE immeuble avec installation individuelle échantillonée : saisir le nombre de logements qui sont équipés de ce type d'installation d'ECS. */
  nombre_logement?: number | null;
  /** nombre d'installations identiques. Ce paramètre est utilisé pour dénombrer les installations identiques considérées lors d'un calcul d'échantillonage. Ce nombre peut être non entier en cas d'application de la méthode d'échantillonage (pour une installation sans échantillonage rdim=1) */
  rdim?: number | null;
  /** type d'installation solaire (ECS+Chauffage , ECS solaire seule etc…) — Valeurs : 1=chauffage solaire (seul ou combiné), 2=ecs solaire seule sup 5 ans, 3=ecs solaire seule inf 5 ans, 4=chauffage + ecs solaire, 5=ecs solaire seule */
  enum_type_installation_solaire_id?: string | null;
  /** type de bouclage du réseau d'ECS pour la prise en compte des consommations d'auxiliaires de distribution — Valeurs : 1=réseau d'ecs non bouclé, 2=réseau d'ecs bouclé, 3=réseau d'ecs avec présence d'un traceur chauffant, 4=réseau d'ecs avec module thermique d'appartement (mta) */
  enum_bouclage_reseau_ecs_id?: string | null;
  /** est ce que le réseau de distribution est isolé 0 : non 1 : oui */
  reseau_distribution_isole?: 0 | 1 | null;
  /** présence d'un système de récupération de chaleur sur eaux grises associé à l'installation d'ECS. 0 : non 1 : oui */
  presence_rceg?: 0 | 1 | null;
  /** méthode de détermination des facteurs de récupération de chaleur sur eaux grises — Valeurs : 1=valeur forfaitaire, 2=déterminé à partir d'un document justificatif autorisé */
  enum_methode_saisie_rceg_id?: string | null;
  /** efficacité de l'échangeur du système de récupération de chaleur sur eaux grises à iso-débit, saisie à partir d'un document justificatif autorisé */
  fech_saisi?: number | null;
  /** coefficient transitoire du système de récupération de chaleur sur eaux grises, saisi à partir d'un document justificatif autorisé */
  ftrans_saisi?: number | null;
}

export interface XsdLogementNeufInstallationEcsDonneeIntermediaire {
  /** besoin d'ECS annuel pour l'ensemble de l'installation (kWh). Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation de l'installation à l'immeuble qu'il faut saisir. */
  besoin_ecs?: number | null;
  /** besoin d'ECS annuel pour l'ensemble de l'installation (kWh), adjusté selon les gains d'énergie récupérés (RCEG). Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation de l'installation à l'immeuble qu'il faut saisir. */
  besoin_ecs_rceg?: number | null;
  /** production d'ecs solaire annuelle (kWh). Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation de l'installation à l'immeuble qu'il faut saisir. */
  production_ecs_solaire?: number | null;
  /** consommation d'energie annuelle de l'installation d'ECS en energie finale kWh. Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation de l'installation à l'immeuble qu'il faut saisir. */
  conso_ecs?: number | null;
  /** facteur de couverture F_ecs_eg = 0.92 * F_trans * F_ech utilisé pour corriger le besoin ECS. */
  fecs_rceg?: number | null;
}

export interface XsdLogementNeufInstallationEcsGenerateurEcs {
  donnee_entree?: XsdLogementNeufInstallationEcsGenerateurEcsDonneeEntree | null;
  donnee_intermediaire?: XsdLogementNeufInstallationEcsGenerateurEcsDonneeIntermediaire | null;
}

export interface XsdLogementNeufInstallationEcsGenerateurEcsDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference?: string | null;
  /** type de generateur d'ecs — Valeurs : 1=cet sur air ambiant (sur local non chauffé) avant 2010, 2=cet sur air ambiant (sur local non chauffé) 2010-2014, 3=cet sur air ambiant (sur local non chauffé) 2015-2026, 4=cet sur air extérieur avant 2010, 5=cet sur air extérieur 2010-2014, 6=cet sur air extérieur 2015-2026, 7=cet sur air extrait avant 2010, 8=cet sur air extrait 2010-2014, 9=cet sur air extrait 2015-2026, 10=pac double service … */
  enum_type_generateur_ecs_id?: string | null;
  /** référence produit et marque du générateur d'ECS */
  ref_produit_generateur_ecs?: string | null;
  /** usages assurés par le générateur (chauffage/ecs/chauffage+ecs) — Valeurs : 1=chauffage, 2=ecs, 3=chauffage + ecs */
  enum_usage_generateur_id?: string | null;
  /** type d'énergie consommée par le générateur d'ECS — Valeurs : 1=électricité, 2=gaz naturel, 3=fioul domestique, 4=bois – bûches, 5=bois – granulés (pellets) ou briquettes, 6=bois – plaquettes forestières, 7=bois – plaquettes d’industrie, 8=réseau de chauffage urbain, 9=propane, 10=butane, 11=charbon, 12=électricité d'origine renouvelable utilisée dans le bâtiment, 13=gpl, 14=autre combustible fossile, 15=réseau de froid urbain */
  enum_type_energie_id?: string | null;
  /** méthode de saisie des performances du système d'ECS — Valeurs : 1=valeurs forfaitaires, 2=caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, autres données forfaitaires, 3=caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, rpn,rpint, autres données forfaitaires, 4=caractéristiques saisies à partir de la plaque signalét… */
  enum_methode_saisie_carac_sys_id?: string | null;
  /** Type de stockage d'ECS (intégré à la production ou indépendant) — Valeurs : 1=abscence de stockage d'ecs (production instantanée), 2=stockage indépendant de la production, 3=stockage intégré à la production */
  enum_type_stockage_ecs_id?: string | null;
  /** est ce que le générateur est positionné dans le volume chauffé. (pour le calcul des pertes de génération récupérables) */
  position_volume_chauffe?: 0 | 1 | null;
  /** est ce que le ballon de stockage est positionné dans le volume chauffé. (pour le calcul des pertes de stockage récupérables) */
  position_volume_chauffe_stockage?: 0 | 1 | null;
  /** volume de stockage associé au générateur d'ECS */
  volume_stockage?: number | null;
  /** présence d'un système de ventouse ou avec un ventilateur pour l'évacuation des fumées d'un système à combustion 0 : non 1 : oui */
  presence_ventouse?: 0 | 1 | null;
  /** méthode de détermination du facteur de commande intelligente "SCF" du chauffe-eau électrique à accumulation — Valeurs : 1=valeur forfaitaire, 2=déterminé à partir d'un document justificatif autorisé */
  enum_methode_saisie_scf_id?: string | null;
  /** facteur de gain d'efficacité permis par la commande intelligente "SCF" du chauffe-eau électrique à accumulation, saisie à partir d'un document justificatif autorisé, (0-0,75 pour 75%) */
  scf_saisi?: number | null;
  /** identifiant réseau de chaleur ou de froid utilisé (utilisé à partir du 18 janvier 2022). Cet identifiant doit correspondre à un identifiant déclaré dans la liste des réseaux de chaleurs spécifiés dans l'arrêté en vigueur qui modifie l'annexe 7 de l'arrêté du 15 septembre 2006 relatif au diagnostic de performance energétique */
  identifiant_reseau_chaleur?: string | null;
  /** date de l'arrêté qui modifie l'annexe 7 de l'arrêté du 15 septembre 2006 relatif au diagnostic de performance énergétique. (https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000788395?isAdvancedResult=&page=3&pageSize=10&query=Arr%C3%AAt%C3%A9+relatif+au+classement+des+r%C3%A9seaux+de+chaleur+et+de+froid&searchField=ALL&searchProximity=&searchType=ALL&tab_selection=all&typePagination=DEFAULT). L'arrêté publie la liste des réseaux de chaleurs référencés pour le calcul du DPE et publie les taux de CO2 et ENR associés. La fréquence de ces arrêtés est d'une année en général mais ils ne sont pas publiés à des dates stables. Ce champ est obligatoire lorsqu'un réseau de chaleur est renseigné. les informations sur les arrêtés de réseaux de chaleur sont disponibles dans observatoire_dpe.modele_donnee.arrete_reseau_chaleur.json */
  date_arrete_reseau_chaleur?: string | null;
}

export interface XsdLogementNeufInstallationEcsGenerateurEcsDonneeIntermediaire {
  /** puissance nominale du générateur à combustion. Dans le cas d'un générateur virtualisé pour DPE appartement avec ECS collective saisir Pe = a*Pn(collectif) (W) */
  pn?: number | null;
  /** pertes à l'arret du générateur à combustion. Dans le cas d'un générateur virtualisé pour DPE appartement avec ECS collective saisir Qp0 correspondant à Pe = a*Pn(collectif) */
  qp0?: number | null;
  /** puissance de la veilleuse du générateur à combustion (W) */
  pveilleuse?: number | null;
  /** rendement de génération à pleine charge du générateur à combustion (0-1,5) */
  rpn?: number | null;
  /** COP du chauffe-eau thermodynamique (inclus le rendement de stockage) (0-20) */
  cop?: number | null;
  /** facteur de gain d'efficacité permis par la commande intelligente "SCF" du chauffe-eau électrique à accumulation (0-0,75 pour 75%) */
  scf?: number | null;
  /** ratio du besoin ecs de l'installation affecté au générateur. Ce ratio est de 1 pour les installations classiques et de 0,5 pour les installations d'ECS avec deux générateurs */
  ratio_besoin_ecs?: number | null;
  /** consommation d'energie annuelle du générateur d'ECS (kWh) (Exprimé en kWh PCI pour les combustibles ). Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation du générateur à l'immeuble qu'il faut saisir. */
  conso_ecs?: number | null;
}

export interface XsdLogementNeufInstallationChauffage {
  donnee_entree?: XsdLogementNeufInstallationChauffageDonneeEntree | null;
  donnee_intermediaire?: XsdLogementNeufInstallationChauffageDonneeIntermediaire | null;
  emetteur_chauffage_collection?: {
    emetteur_chauffage?: XsdLogementNeufInstallationChauffageEmetteurChauffage[];
  } | null;
  generateur_chauffage_collection?: {
    generateur_chauffage?: XsdLogementNeufInstallationChauffageGenerateurChauffage[];
  } | null;
}

export interface XsdLogementNeufInstallationChauffageDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference?: string | null;
  /** surface chauffée par l'installation de chauffage(surface du logement ou de l'immeuble). Dans le cas spécifique d'un DPE immeuble avec installation individuelle échantillonée :saisir la surface chauffée de la totalité des logements représentés par le logement moyen surface_habitable= Shmoy*Nblgt. Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la surface de l'installation à l'immeuble qu'il faut renseigner */
  surface_chauffee?: number | null;
  /** nombre d'installations identiques. Ce paramètre est utilisé pour dénombrer les installations identiques considérées lors d'un calcul d'échantillonage. Ce nombre peut être non entier en cas d'application de la méthode d'échantillonage (pour une installation sans échantillonage rdim=1) */
  rdim?: number | null;
  /** configuration de l'installation de chauffage — Valeurs : 1=installation de chauffage simple, 2=installation de chauffage avec chauffage solaire, 3=installation de chauffage avec insert ou poêle bois en appoint, 4=installation de chauffage par insert, poêle bois (ou biomasse) avec un chauffage électrique dans la salle de bain, 5=installation de chauffage avec en appoint un insert ou poêle bois et un chauffage électrique dans la salle de bain (différent d… */
  enum_cfg_installation_ch_id?: string | null;
  /** méthode de détermination de la part du besoin de chauffage assurée par la PAC d'une pompe à chaleur hybride — Valeurs : 1=valeur forfaitaire, 2=déterminé à partir d'un document justificatif autorisé */
  enum_methode_saisie_couv_pac_hyb_id?: string | null;
  /** part du besoin de chauffage assurée par la PAC d'une pompe à chaleur hybride lorsqu'elle est connue et justifiée. Valeur exprimée en fraction ; à défaut, la répartition conventionnelle est H1 : 0,80, H2 : 0,83, H3 : 0,88. */
  couverture_pac_hybride_saisi?: number | null;
  /** type d'installation de chauffage (collective ou individuelle ou collective multi batiment — Valeurs : 1=installation individuelle, 2=installation collective, 3=installation collective multi-bâtiment : modélisée comme un réseau de chaleur, 4=installation hybride collective-individuelle (chauffage base + appoint individuel ou convecteur bi-jonction) */
  enum_type_installation_id?: string | null;
  /** Indique si le réseau de distribution et les émetteurs de chauffage peuvent fonctionner à basse température ou à une température favorisant une meilleure efficacité du générateur. */
  basse_temperature?: 0 | 1 | null;
}

export interface XsdLogementNeufInstallationChauffageDonneeIntermediaire {
  /** Besoin de chauffage total de l'installation (kWh) */
  besoin_ch?: number | null;
  /** consommation d'energie annuelle de l'installation de chauffage en energie finale kWh. Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation de l'installation à l'immeuble qu'il faut saisir. */
  conso_ch?: number | null;
}

export interface XsdLogementNeufInstallationChauffageEmetteurChauffage {
  donnee_entree?: XsdLogementNeufInstallationChauffageEmetteurChauffageDonneeEntree | null;
}

export interface XsdLogementNeufInstallationChauffageEmetteurChauffageDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference?: string | null;
  /** surface chauffée par l'emetteur (sous ensemble de la surface chauffée par l'installation). Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la surface de l'installation à l'immeuble qu'il faut renseigner */
  surface_chauffee?: number | null;
  /** enumérateur qui couple les notions d'emission et de distribution pour produire une description complète des emetteurs de chauffage — Valeurs : 1=convecteur électrique nfc, nf** et nf***, 2=panneau rayonnant nfc, nf** et nf***, 3=radiateur électrique nfc, nf** et nf***, 4=autres émetteurs à effet joule, 5=soufflage d'air chaud (air soufflé) avec distribution par réseau aéraulique, 6=plafond rayonnant électrique avec régulation terminale, 7=plafond rayonnant électrique sans régulation, 8=plancher rayonnant électrique avec régulation termin… */
  enum_type_emission_distribution_id?: string | null;
  /** est ce que le réseau de distribution est isolé 0 : non 1 : oui */
  reseau_distribution_isole?: 0 | 1 | null;
  /** période d'installation des émetteurs de chauffage (utilisé pour le calcul des températures de fonctionnement des systèmes à combustion de type chaudière gaz ou fioul) — Valeurs : 1=avant 1981, 2=entre 1981 et 2000, 3=après 2000 */
  enum_periode_installation_emetteur_id?: string | null;
  /** température de distribution de l'installation de chauffage (pour le calcul des auxiliaires de distribution) — Valeurs : 1=abscence de réseau de distribution, 2=basse, 3=moyenne, 4=haute */
  enum_temp_distribution_ch_id?: string | null;
}

export interface XsdLogementNeufInstallationChauffageGenerateurChauffage {
  donnee_entree?: XsdLogementNeufInstallationChauffageGenerateurChauffageDonneeEntree | null;
  donnee_intermediaire?: XsdLogementNeufInstallationChauffageGenerateurChauffageDonneeIntermediaire | null;
}

export interface XsdLogementNeufInstallationChauffageGenerateurChauffageDonneeEntree {
  /** description textuelle de l'objet */
  description?: string | null;
  /** reference projet de l'objet (cette référence permet de faire d'éventuels liens entre objets). La codification et utilisation des références peut différer entre logiciels */
  reference?: string | null;
  /** référence produit et marque du générateur de chauffage */
  ref_produit_generateur_ch?: string | null;
  /** type de generateur de chauffage — Valeurs : 1=pac air/air installée avant 2008, 2=pac air/air installée entre 2008 et 2014, 3=pac air/air installée entre 2015 et 2026, 4=pac air/eau installée avant 2008, 5=pac air/eau installée entre 2008 et 2014, 6=pac air/eau installée entre 2015 et 2016, 7=pac air/eau installée entre 2017 et 2026, 8=pac eau/eau installée avant 2008, 9=pac eau/eau installée entre 2008 et 2014, 10=pac eau/eau installée ent… */
  enum_type_generateur_ch_id?: string | null;
  /** usages assurés par le générateur (chauffage/ecs/chauffage+ecs) — Valeurs : 1=chauffage, 2=ecs, 3=chauffage + ecs */
  enum_usage_generateur_id?: string | null;
  /** type d'énergie consommée par le générateur de chauffage — Valeurs : 1=électricité, 2=gaz naturel, 3=fioul domestique, 4=bois – bûches, 5=bois – granulés (pellets) ou briquettes, 6=bois – plaquettes forestières, 7=bois – plaquettes d’industrie, 8=réseau de chauffage urbain, 9=propane, 10=butane, 11=charbon, 12=électricité d'origine renouvelable utilisée dans le bâtiment, 13=gpl, 14=autre combustible fossile, 15=réseau de froid urbain */
  enum_type_energie_id?: string | null;
  /** est ce que le générateur est positionné dans le volume chauffé. (pour le calcul des pertes de génération récupérables) */
  position_volume_chauffe?: 0 | 1 | null;
  /** id de la ligne de la table utilisée pour le calcul du contenu CO2 des réseaux de chaleurs (OBSOLETE et remplacé par identifiant_reseau_chaleur à partir du 18 janvier 2022 et la prise en compte du nouvel arrêté réseau de chaleur). */
  tv_reseau_chaleur_id?: number | null;
  /** identifiant réseau de chaleur ou de froid utilisé (utilisé à partir du 18 janvier 2022). Cet identifiant doit correspondre à un identifiant déclaré dans la liste des réseaux de chaleurs spécifiés dans l'arrêté en vigueur qui modifie l'annexe 7 de l'arrêté du 15 septembre 2006 relatif au diagnostic de performance energétique */
  identifiant_reseau_chaleur?: string | null;
  /** identifiant réseau de chaleur ou de froid utilisé (utilisé à partir du 18 janvier 2022) */
  date_arrete_reseau_chaleur?: string | null;
  /** nombre de radiateurs gaz */
  n_radiateurs_gaz?: number | null;
  /** présence d'un système de ventouse ou avec un ventilateur pour l'évacuation des fumées d'un système à combustion 0 : non 1 : oui */
  presence_ventouse?: 0 | 1 | null;
  /** présence d'un organe de régulation pour le système de chauffage à combustion 0 : non 1 : oui */
  presence_regulation_combustion?: 0 | 1 | null;
  /** méthode de saisie des performances du système de chauffage — Valeurs : 1=valeurs forfaitaires, 2=caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, autres données forfaitaires, 3=caractéristiques saisies à partir de la plaque signalétique ou d'une documentation technique du système à combustion : pn, rpn,rpint, autres données forfaitaires, 4=caractéristiques saisies à partir de la plaque signalét… */
  enum_methode_saisie_carac_sys_id?: string | null;
  /** Estimation de la durée de vie restante du système de chauffage, en années. */
  chauffage_duree_vie_restante?: number | null;
}

export interface XsdLogementNeufInstallationChauffageGenerateurChauffageDonneeIntermediaire {
  /** scop du générateur thermodynamique (en remplacement du Rg pour les générateurs thermodynamique) (0-20) */
  scop?: number | null;
  /** puissance nominale du générateur à combustion (W) */
  pn?: number | null;
  /** pertes à l'arret du générateur à combustion. Dans le cas d'un générateur virtualisé pour DPE appartement avec chauffage collectif saisir Qp0 correspondant à Pe = a*Pn(collectif) (W) */
  qp0?: number | null;
  /** puissance de la veilleuse du générateur à combustion (W) */
  pveilleuse?: number | null;
  /** température de fonctionnement à 30% de charge (°C) */
  temp_fonc_30?: number | null;
  /** température de fonctionnement à 100% de charge (°C) */
  temp_fonc_100?: number | null;
  /** rendement de génération à pleine charge du générateur à combustion (0-1,5) */
  rpn?: number | null;
  /** rendement de génération à charge intermédiaire du générateur à combustion (0-1,5) */
  rpint?: number | null;
  /** consommation d'energie annuelle du générateur de chauffage en energie finale kWh (exprimée en kWh PCI pour les combustibles). Dans le cas d'un DPE immeuble ou d'un DPE appartement à partir de l'immeuble c'est la consommation du générateur à l'immeuble qu'il faut saisir. */
  conso_ch?: number | null;
}

export interface XsdLogementNeufSortie {
  deperdition?: XsdLogementNeufSortieDeperdition | null;
  apport_et_besoin?: XsdLogementNeufSortieApportEtBesoin | null;
  ef_conso: XsdLogementNeufSortieEfConso;
  ep_conso: XsdLogementNeufSortieEpConso;
  emission_ges: XsdLogementNeufSortieEmissionGes;
  cout: XsdLogementNeufSortieCout;
  production_electricite: XsdLogementNeufSortieProductionElectricite;
  sortie_par_energie_collection: { sortie_par_energie: XsdLogementNeufSortieSortieParEnergie[] };
  confort_ete?: XsdLogementNeufSortieConfortEte | null;
  qualite_isolation: XsdLogementNeufSortieQualiteIsolation;
  /** Productions et consommations renouvelables agrégées pour l'état calculé du logement, exprimées en kWhEF/an, ainsi que leur part dans la consommation d'énergie finale. Obligatoire pour le DPE neuf. */
  production_enr: XsdLogementNeufSortieProductionEnr;
  /** Indique si le bâtiment ou logement satisfait, pour l'état calculé, les conditions réglementaires de la mention A0 « émissions nulles ». Résultat calculé par le logiciel, obligatoire pour le DPE neuf. */
  mention_a0: 0 | 1;
}

export interface XsdLogementNeufSortieDeperdition {
  /** part des deperditions de renouvellement d'air liées au système de(W/K) ventilation. Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  hvent?: number | null;
  /** part des deperditions de renouvellement d'air liées à la perméabilité à l'air du bâtiment(W/K). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  hperm?: number | null;
  /** deperditions par renouvellement d'air totale (hvent + hperm)(W/K). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  deperdition_renouvellement_air?: number | null;
  /** deperditions par les murs(W/K). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  deperdition_mur?: number | null;
  /** deperditions par les planchers bas(W/K). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  deperdition_plancher_bas?: number | null;
  /** deperditions par les planchers hauts(W/K). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  deperdition_plancher_haut?: number | null;
  /** deperditions par les baies vitrées (W/K). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  deperdition_baie_vitree?: number | null;
  /** deperditions par les ponts thermiques(W/K). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  deperdition_porte?: number | null;
  /** deperditions par les ponts thermiques(W/K). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  deperdition_pont_thermique?: number | null;
  /** deperditions par l'enveloppe (GV). Pour les DPE immeubles et appartement à partir de l'immeuble ces données sont à l'immeuble. */
  deperdition_enveloppe?: number | null;
}

export interface XsdLogementNeufSortieApportEtBesoin {
  /** besoin de chauffage annuel total du logement ou immeuble (kWh) . Pour les DPE immeubles ces données sont à l'immeuble. Pour les dpe appartements à partir de l'immeuble ces données sont à l'appartement */
  besoin_ch?: number | null;
  /** besoin d'ecs annuel total du bâtiment (kWh). Pour les DPE immeubles ces données sont à l'immeuble. Pour les dpe appartements à partir de l'immeuble ces données sont à l'appartement */
  besoin_ecs?: number | null;
  /** besoin de refroidissement annuel (kWh).Pour les DPE immeubles ces données sont à l'immeuble. Pour les dpe appartements à partir de l'immeuble ces données sont à l'appartement */
  besoin_fr?: number | null;
}

export interface XsdLogementNeufSortieEfConso {
  /** consommation annuelle de chauffage en energie finale (déduit de la production pv autoconsommée) (kWhef/an) */
  conso_ch: number;
  /** consommation annuelle de chauffage en energie finale pour le scénario dépensier(déduit de la production pv autoconsommée) (kWhef/an) */
  conso_ch_depensier: number;
  /** consommation annuelle d'ECS en energie finale (déduit de la production pv autoconsommée) (kWhef/an) */
  conso_ecs: number;
  /** consommation annuelle d'ECS en energie finale pour le scénario dépensier (déduit de la production pv autoconsommée) (kWhef/an) */
  conso_ecs_depensier: number;
  /** consommation annuelle d'eclairage en energie finale (déduit de la production pv autoconsommée) (kWhef/an) */
  conso_eclairage: number;
  /** consommation annuelle d'auxilliaires de ventilation en energie finale (kWhef/an) */
  conso_auxiliaire_ventilation: number;
  /** consommation annuelle de l'ensemble des auxiliaires en énergie finale(déduit de la production pv autoconsommée) (kWhef/an) */
  conso_totale_auxiliaire: number;
  /** consommation de refroidissement annuel en energie finale (déduit de la production pv autoconsommée) (kWhef/an) */
  conso_fr: number;
  /** consommation de refroidissement annuel en energie finale pour le scénario dépensier (déduit de la production pv autoconsommée) (kWhef/an) */
  conso_fr_depensier: number;
  /** consommation annuelle 5 usages (ecs/chauffage/climatisation/eclairage/auxiliaires)en energie finale(déduit de la production pv autoconsommée) (kWhef/an) */
  conso_5_usages: number;
  /** consommation annuelle 5 usages (ecs/chauffage/climatisation/eclairage/auxiliaires)en energie finale(déduit de la production pv autoconsommée) (kWhef/m²/an) */
  conso_5_usages_m2: number;
}

export interface XsdLogementNeufSortieEpConso {
  /** consommation annuelle de chauffage en energie primaire(déduit de la production pv autoconsommée) (kWhep/an) */
  ep_conso_ch: number;
  /** consommation annuelle de chauffage en energie primaire pour le scénario dépensier (déduit de la production pv autoconsommée) (kWhep/an) */
  ep_conso_ch_depensier: number;
  /** consommation annuelle d'ECS en energie primaire (déduit de la production pv autoconsommée) (kWhep/an) */
  ep_conso_ecs: number;
  /** consommation annuelle d'ECS en energie primaire pour le scénario dépensier (déduit de la production pv autoconsommée) (kWhep/an) */
  ep_conso_ecs_depensier: number;
  /** consommation annuelle d'eclairage en energie primaire (déduit de la production pv autoconsommée) (kWhep/an) */
  ep_conso_eclairage: number;
  /** consommation annuelle d'auxilliaires de ventilation en energie primaire (kWhep/an) */
  ep_conso_auxiliaire_ventilation: number;
  /** consommation annuelle de l'ensemble des auxiliaires en energie primaire (déduit de la production pv autoconsommée) (kWhep/an) */
  ep_conso_totale_auxiliaire: number;
  /** consommation de refroidissement annuel en énergie primaire (déduit de la production pv autoconsommée) (kWhep/an) */
  ep_conso_fr: number;
  /** consommation de refroidissement annuel en énergie primaire pour le scénario dépensier (déduit de la production pv autoconsommée) (kWhep/an) */
  ep_conso_fr_depensier: number;
  /** consommation annuelle 5 usages (ecs/chauffage/climatisation/eclairage/auxiliaires)en energie primaire (déduit de la production pv autoconsommée) (kWhep/an) */
  ep_conso_5_usages: number;
  /** consommation annuelle 5 usages (ecs/chauffage/climatisation/eclairage/auxiliaires)en energie primaire (déduit de la production pv autoconsommée) (kWhep/m²/an) */
  ep_conso_5_usages_m2: number;
  /** Classe du DPE issu de la synthèse du double seuil sur les consommations énergie primaire et les émissions de CO2 sur les 5 usages (ecs/chauffage/climatisation/eclairage/auxiliaires) */
  classe_bilan_dpe: string;
}

export interface XsdLogementNeufSortieEmissionGes {
  /** estimation GES de chauffage (déduit de la production pv autoconsommée) (kgCO2/an) */
  emission_ges_ch: number;
  /** estimation GES de chauffage pour le scénario dépensier(déduit de la production pv autoconsommée) (kgCO2/an) */
  emission_ges_ch_depensier: number;
  /** estimation GES d'ECS (déduit de la production pv autoconsommée) (kgCO2/an) */
  emission_ges_ecs: number;
  /** estimation GES d'ECS pour le scénario dépensier (déduit de la production pv autoconsommée) (kgCO2/an) */
  emission_ges_ecs_depensier: number;
  /** estimation GES d'eclairage (déduit de la production pv autoconsommée) (kgCO2/an) */
  emission_ges_eclairage: number;
  /** estimation GES d'auxilliaires de ventilation (kgCO2/an) */
  emission_ges_auxiliaire_ventilation: number;
  /** estimation GES de l'ensemble des auxiliaires (déduit de la production pv autoconsommée) (kgCO2/an) */
  emission_ges_totale_auxiliaire: number;
  /** estimation GES de refroidissement annuel (déduit de la production pv autoconsommée) (kgCO2/an) */
  emission_ges_fr: number;
  /** estimation GES de refroidissement pour le scénario dépensier (déduit de la production pv autoconsommée) (kgCO2/an) */
  emission_ges_fr_depensier: number;
  /** estimation GES totale 5 usages (déduit de la production pv autoconsommée) (ecs/chauffage/climatisation/eclairage/auxiliaires)(kgCO2/an) */
  emission_ges_5_usages: number;
  /** estimation GES totale 5 usages rapportée au m² (déduit de la production pv autoconsommée) (ecs/chauffage/climatisation/eclairage/auxiliaires)(kgCO2/m2/an) */
  emission_ges_5_usages_m2: number;
  /** classe d'estimation ges du DPE 5 usages */
  classe_emission_ges: string;
}

export interface XsdLogementNeufSortieCout {
  /** coût de chauffage(déduit de la production pv autoconsommée) (€) */
  cout_ch: number;
  /** coût de chauffage pour le scénario dépensier (déduit de la production pv autoconsommée) (€) */
  cout_ch_depensier: number;
  /** coût de l'ECS (déduit de la production pv autoconsommée) (€) */
  cout_ecs: number;
  /** coût de l'ECS pour le scénario dépensier (déduit de la production pv autoconsommée) (€) */
  cout_ecs_depensier: number;
  /** coût des eclairage (déduit de la production pv autoconsommée) (€) */
  cout_eclairage: number;
  /** coût des auxilliaires de ventilation (€) */
  cout_auxiliaire_ventilation: number;
  /** coût des auxilliaires de l'ensemble des auxiliaires (déduit de la production pv autoconsommée) (€) */
  cout_total_auxiliaire: number;
  /** coût de refroidissement annuel (déduit de la production pv autoconsommée) (€) */
  cout_fr: number;
  /** coût de refroidissement pour le scénario dépensier (déduit de la production pv autoconsommée) (€) */
  cout_fr_depensier: number;
  /** coût totale 5 usages (ecs/chauffage/climatisation/eclairage/auxiliaires) (déduit de la production pv autoconsommée) (€) */
  cout_5_usages: number;
}

export interface XsdLogementNeufSortieProductionElectricite {
  /** production d'éléctricité photovoltaique(kWhep/an) */
  production_pv: number;
}

export interface XsdLogementNeufSortieSortieParEnergie {
  /** type d'énergie — Valeurs : 1=électricité, 2=gaz naturel, 3=fioul domestique, 4=bois – bûches, 5=bois – granulés (pellets) ou briquettes, 6=bois – plaquettes forestières, 7=bois – plaquettes d’industrie, 8=réseau de chauffage urbain, 9=propane, 10=butane, 11=charbon, 12=électricité d'origine renouvelable utilisée dans le bâtiment, 13=gpl, 14=autre combustible fossile, 15=réseau de froid urbain */
  enum_type_energie_id: string;
  /** consommation de chauffage en énergie finale pour l'énergie considérée (kWhef/an) */
  conso_ch: number;
  /** consommation d'ECS en énergie finale pour l'énergie considérée (kWhef/an) */
  conso_ecs: number;
  /** consommation totale en énergie finale pour l'énergie considérée (kWhef/an) */
  conso_5_usages: number;
  /** estimation GES de chauffage pour l'énergie considérée (kgCO2/an) */
  emission_ges_ch: number;
  /** estimation GES d'ECS pour l'énergie considérée (kgCO2/an) */
  emission_ges_ecs: number;
  /** estimation GES totale pour l'énergie considérée (kgCO2/an) */
  emission_ges_5_usages: number;
  /** coût lié au chauffage pour l'énergie considérée (€) */
  cout_ch: number;
  /** coût lié à l'ECS pour l'énergie considérée (€) */
  cout_ecs: number;
  /** coût totale pour l'énergie considérée (€) */
  cout_5_usages: number;
}

export interface XsdLogementNeufSortieConfortEte {
  /** as-t-on une isolation de toiture 0 : non 1 : oui */
  isolation_toiture?: 0 | 1 | null;
  /** as-t-on une protection solair exteriaire sur les facades vitrées (exception nord) 0 : non 1 : oui */
  protection_solaire_exterieure: 0 | 1;
  /** est ce que le logement est traversant 0 : non 1 : oui */
  aspect_traversant?: 0 | 1 | null;
  /** est ce que le logement est équipé de brasseurs d'air 0 : non 1 : oui */
  brasseur_air?: 0 | 1 | null;
  /** est ce que le logement possède une inerte lourde ou très lourde 0 : non 1 : oui */
  inertie_lourde: 0 | 1;
  /** indicateur confort été (bon moyen ou mauvais) — Valeurs : 1=insuffisant, 2=moyen, 3=bon */
  enum_indicateur_confort_ete_id: string;
}

export interface XsdLogementNeufSortieQualiteIsolation {
  /** Ubat(W/m²K) */
  ubat: number;
  /** qualité d'isolation de l'enveloppe */
  qualite_isol_enveloppe: 1 | 2 | 3 | 4;
  /** qualité d'isolation des murs */
  qualite_isol_mur: 1 | 2 | 3 | 4;
  /** qualité d'isolation de la toiture/planchers hauts partie toit terrasse */
  qualite_isol_plancher_haut_toit_terrasse?: 1 | 2 | 3 | 4 | null;
  /** qualité d'isolation de la toiture/planchers hauts partie comble perdue */
  qualite_isol_plancher_haut_comble_perdu?: 1 | 2 | 3 | 4 | null;
  /** qualité d'isolation de la toiture/planchers hauts partie comble aménagé */
  qualite_isol_plancher_haut_comble_amenage?: 1 | 2 | 3 | 4 | null;
  /** qualité de l'isolation des planchers */
  qualite_isol_plancher_bas?: 1 | 2 | 3 | 4 | null;
  /** qualité d'isolation des menuiseries */
  qualite_isol_menuiserie: 1 | 2 | 3 | 4;
}

/** Productions et consommations renouvelables agrégées pour l'état calculé du logement, exprimées en kWhEF/an, ainsi que leur part dans la consommation d'énergie finale. Obligatoire pour le DPE neuf. */
export interface XsdLogementNeufSortieProductionEnr {
  /** Production photovoltaïque totale sur site, en kWhEF/an. */
  prod_enr_pv: number;
  /** Production solaire thermique sur site, en kWhEF/an. */
  prod_enr_solaire_thermique: number;
  /** Chaleur ambiante renouvelable captée par les pompes à chaleur, en kWhEF/an. */
  prod_enr_chaleur_ambiante_pac: number;
  /** Chaleur géothermique captée par les pompes à chaleur, en kWhEF/an. */
  prod_enr_geothermie_pac: number;
  /** Chaleur ambiante renouvelable captée par les chauffe-eau thermodynamiques, en kWhEF/an. */
  prod_enr_chaleur_ambiante_cet: number;
  /** Part renouvelable du réseau de chaleur appliquée à la consommation du réseau sur site, en kWhEF/an. */
  prod_enr_rcfu: number;
  /** Énergie renouvelable associée à la consommation de biomasse bois, en kWhEF/an. */
  prod_enr_bois: number;
  /** Somme des composantes de production ou consommation renouvelable du bloc, en kWhEF/an. */
  prod_enr_totale: number;
  /** Production renouvelable rapportée à la consommation d'énergie finale, en fraction. Formule : prod_enr_totale / (Cef + prod_enr_solaire_thermique + prod_enr_chaleur_ambiante_pac + prod_enr_geothermie_pac + prod_enr_chaleur_ambiante_cet + conso_elec_autoconso), avec Cef = sortie/ef_conso/conso_5_usages et conso_elec_autoconso = production_elec_enr/donnee_intermediaire/conso_elec_ac (0 si l'élément est absent ou sans texte). La fraction peut être supérieure à 1. La formule n'est pas définie pour un dénominateur nul. */
  prod_enr_pourcentage: number;
}

export interface XsdLogementNeufRset {
  [key: string]: any;
}

export interface XsdLogementNeufRsee {
  [key: string]: any;
}
