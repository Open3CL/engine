import { TypeDpe, TypeHabitation } from '../../../dpe/domain/models/dpe.model';

export interface Contexte {
  typeHabitation: TypeHabitation;
  typeDpe: TypeDpe;
  enumPeriodeConstructionId: number;
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
