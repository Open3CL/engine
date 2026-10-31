import type { TypeDpe, TypeHabitation } from '../../../dpe/domain/models/type-habitation.model.js';

export interface Contexte {
  typeHabitation: TypeHabitation;
  typeDpe: TypeDpe;
  enumPeriodeConstructionId: string;
  anneeConstruction: number;
  surfaceHabitable: number;
  hauteurSousPlafond: number;
  nombreAppartement: number;
  zoneClimatique: {
    id: string;
    value: string;
  };
  altitude: {
    id: string;
    value: string;
  };
  effetJoule: boolean;
  nadeq: number;
  inertie: {
    id: number;
    ilpa: number;
  };
}
