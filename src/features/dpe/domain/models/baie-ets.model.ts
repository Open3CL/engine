export interface BaieEts {
  donnee_entree?: BaieEtsDE;
}

export interface BaieEtsDE {
  description?: string;
  reference?: string;
  enum_orientation_id?: number;
  enum_inclinaison_vitrage_id?: number; // ENUM inclinaison_vitrage
  surface_totale_baie?: number;
  nb_baie?: number;
}
