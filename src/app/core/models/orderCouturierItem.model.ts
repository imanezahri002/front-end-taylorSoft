import { TissuColor } from './tissuColor.model';

// Main CoutourierOrderItem model
export interface CoutourierOrderItem {
  id?: number;
  nombreMetres: number;
  prixTotalMetres: number;
  createdAt?: Date;
  updatedAt?: Date;
  coutourierOrderId?: number;
  tissuColorId?: number;
  tissuColor?: TissuColor;
}

