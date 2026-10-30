/**
 * Façade de compatibilité : noms de types globaux historiques utilisés dans les JSDoc legacy
 * (`@param dpe {FullDpe}`, `{Donnee_entree}`, ...). Ils sont désormais de simples alias des types
 * du modèle (`src/features/dpe/domain/models/*.model.ts`), eux-mêmes générés depuis le XSD DPE
 * (`npm run types:generate`). Ne plus ajouter de définitions ici : modifier le modèle.
 *
 * Ce fichier reste un script global (aucun import/export de premier niveau).
 */

type FullDpe = import('./src/features/dpe/domain/models/dpe.model').Dpe;
type Administratif = import('./src/features/dpe/domain/models/dpe.model').Administratif;
type Diagnostiqueur = import('./src/features/dpe/domain/models/dpe.model').Diagnostiqueur;
type Geolocalisation = import('./src/features/dpe/domain/models/dpe.model').Geolocalisation;
type Adresses = Geolocalisation['adresses'];
type Adresse_bien = Adresses['adresse_bien'];
type Logement = import('./src/features/dpe/domain/models/dpe.model').Logement;
type Caracteristique_generale =
  import('./src/features/dpe/domain/models/dpe.model').CaracteristiqueGenerale;
type Meteo = import('./src/features/dpe/domain/models/dpe.model').Meteo;
type Enveloppe = import('./src/features/dpe/domain/models/dpe.model').Enveloppe;
type Inertie = Enveloppe['inertie'];
type Mur_collection = Enveloppe['mur_collection'];
type MurItem = import('./src/features/dpe/domain/models/mur.model').Mur;
type Plancher_bas_collection = Enveloppe['plancher_bas_collection'];
type PlancherBasItem = import('./src/features/dpe/domain/models/plancher.model').PlancherBas;
type Plancher_haut_collection = Enveloppe['plancher_haut_collection'];
type PlancherHautItem = import('./src/features/dpe/domain/models/plancher.model').PlancherHaut;
type Baie_vitree_collection = Enveloppe['baie_vitree_collection'];
type BaieVitreeItem = import('./src/features/dpe/domain/models/baie-vitree.model').BaieVitree;
type Porte_collection = Enveloppe['porte_collection'];
type PorteItem = import('./src/features/dpe/domain/models/porte.model').Porte;
type PontThermique_collection = Enveloppe['pont_thermique_collection'];
type PontThermiqueItem =
  import('./src/features/dpe/domain/models/pont-thermique.model').PontThermique;
type Ventilation_collection = Logement['ventilation_collection'];
type VentilationItem = import('./src/features/dpe/domain/models/ventilation.model').Ventilation;
type Installation_ecs_collection = Logement['installation_ecs_collection'];
type InstallationEcsItem =
  import('./src/features/dpe/domain/models/installation-ecs.model').InstallationEcs;
type Generateur_ecs_collection = InstallationEcsItem['generateur_ecs_collection'];
type GenerateurEcsItem =
  import('./src/features/dpe/domain/models/installation-ecs.model').GenerateurEcs;
type Installation_chauffage_collection = Logement['installation_chauffage_collection'];
type InstallationChauffageItem =
  import('./src/features/dpe/domain/models/installation-chauffage.model').InstallationChauffage;
type Emetteur_chauffage_collection = InstallationChauffageItem['emetteur_chauffage_collection'];
type EmetteurChauffageItem =
  import('./src/features/dpe/domain/models/installation-chauffage.model').EmetteurChauffage;
type Generateur_chauffage_collection = InstallationChauffageItem['generateur_chauffage_collection'];
type GenerateurChauffageItem =
  import('./src/features/dpe/domain/models/installation-chauffage.model').GenerateurChauffage;
type Sortie = import('./src/features/dpe/domain/models/sortie.model').Sortie;
type Deperdition = import('./src/features/dpe/domain/models/sortie.model').Deperdition;
type Apport_et_besoin = import('./src/features/dpe/domain/models/sortie.model').ApportEtBesoin;
type Ef_conso = import('./src/features/dpe/domain/models/sortie.model').EfConso;
type Ep_conso = import('./src/features/dpe/domain/models/sortie.model').EpConso;
type Emission_ges = import('./src/features/dpe/domain/models/sortie.model').EmissionGes;
type Cout = import('./src/features/dpe/domain/models/sortie.model').Cout;
type Production_electricite =
  import('./src/features/dpe/domain/models/sortie.model').ProductionElectricite;
type Sortie_par_energie_collection = Sortie['sortie_par_energie_collection'];
type SortieParEnergieItem =
  import('./src/features/dpe/domain/models/sortie.model').SortieParEnergie;
type Confort_ete = import('./src/features/dpe/domain/models/sortie.model').ConfortEte;
type Qualite_isolation = import('./src/features/dpe/domain/models/sortie.model').QualiteIsolation;
type Descriptif_simplifie_collection = FullDpe['descriptif_simplifie_collection'];
type DescriptifSimplifieItem = Exclude<
  Descriptif_simplifie_collection['descriptif_simplifie'],
  any[]
>;
type Fiche_technique_collection = FullDpe['fiche_technique_collection'];
type FicheTechniqueItem = Exclude<Fiche_technique_collection['fiche_technique'], any[]>;
type Sous_fiche_technique_collection = Extract<
  FicheTechniqueItem,
  object
>['sous_fiche_technique_collection'];
type SousFicheTechniqueItem = Exclude<
  Sous_fiche_technique_collection['sous_fiche_technique'],
  any[]
>;
type Justificatif_collection = FullDpe['justificatif_collection'];
type Justificatif = Exclude<Justificatif_collection['justificatif'], any[]>;
type Descriptif_geste_entretien_collection = FullDpe['descriptif_geste_entretien_collection'];
type DescriptifGesteEntretienItem = Exclude<
  Descriptif_geste_entretien_collection['descriptif_geste_entretien'],
  any[]
>;
type Descriptif_travaux = FullDpe['descriptif_travaux'];
type Pack_travaux_collection = Descriptif_travaux['pack_travaux_collection'];
type PackTravauxItem = Exclude<Pack_travaux_collection['pack_travaux'], any[]>;
type Travaux_collection = PackTravauxItem['travaux_collection'];
type TravauxItem = Exclude<Travaux_collection['travaux'], any[]>;

/**
 * Union de toutes les `donnee_entree` (mur, plancher, baie, porte, ...), lue comme un objet unique
 * par le code legacy : toutes les propriétés de toutes les variantes sont accessibles (en optionnel).
 */
type AllKeysOptional<U> = {
  [K in U extends any ? keyof U : never]?: U extends any
    ? K extends keyof U
      ? U[K]
      : never
    : never;
};
type Donnee_entree = AllKeysOptional<
  | import('./src/features/dpe/domain/models/mur.model').MurDE
  | import('./src/features/dpe/domain/models/plancher.model').PlancherBasDE
  | import('./src/features/dpe/domain/models/plancher.model').PlancherHautDE
  | import('./src/features/dpe/domain/models/baie-vitree.model').BaieVitreeDE
  | import('./src/features/dpe/domain/models/porte.model').PorteDE
  | import('./src/features/dpe/domain/models/pont-thermique.model').PontThermiqueDE
  | import('./src/features/dpe/domain/models/ventilation.model').VentilationDE
  | import('./src/features/dpe/domain/models/installation-ecs.model').InstallationEcsDE
  | import('./src/features/dpe/domain/models/installation-ecs.model').GenerateurEcsDE
  | import('./src/features/dpe/domain/models/installation-chauffage.model').InstallationChauffageDE
  | import('./src/features/dpe/domain/models/installation-chauffage.model').EmetteurChauffageDE
  | import('./src/features/dpe/domain/models/installation-chauffage.model').GenerateurChauffageDE
>;
type Donnee_intermediaire = AllKeysOptional<
  | import('./src/features/dpe/domain/models/mur.model').MurDI
  | import('./src/features/dpe/domain/models/plancher.model').PlancherBasDI
  | import('./src/features/dpe/domain/models/plancher.model').PlancherHautDI
  | import('./src/features/dpe/domain/models/baie-vitree.model').BaieVitreeDI
  | import('./src/features/dpe/domain/models/porte.model').PorteDI
  | import('./src/features/dpe/domain/models/pont-thermique.model').PontThermiqueDI
  | import('./src/features/dpe/domain/models/ventilation.model').VentilationDI
  | import('./src/features/dpe/domain/models/installation-ecs.model').InstallationEcsDI
  | import('./src/features/dpe/domain/models/installation-ecs.model').GenerateurEcsDI
  | import('./src/features/dpe/domain/models/installation-chauffage.model').InstallationChauffageDI
  | import('./src/features/dpe/domain/models/installation-chauffage.model').EmetteurChauffageDI
  | import('./src/features/dpe/domain/models/installation-chauffage.model').GenerateurChauffageDI
>;
