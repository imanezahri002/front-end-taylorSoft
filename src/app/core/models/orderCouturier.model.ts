import { Coutourier } from './couturier.model';
import { FournisseurResponse } from './fournisseur.model';
import { CoutourierOrderItem } from './orderCouturierItem.model';

// CoutourierOrderRequest for API requests
export interface CoutourierOrderRequest {
  couturierId: number;
  fournisseurId: number;
  items: CoutourierOrderItemRequest[];
}

// CoutourierOrderItemRequest for API requests
export interface CoutourierOrderItemRequest {
  tissuColorId: number;
  nombreMetres: number;
}


// Enum for CoutourierOrder Status
export enum CoutourierOrderStatus {
  EN_ATTENTE = 'EN_ATTENTE',
  CONFIRMEE = 'CONFIRMEE',
  EN_COURS = 'EN_COURS',
  LIVREE = 'LIVREE',
  ANNULEE = 'ANNULEE'
}

// Main CoutourierOrder model
export interface CoutourierOrder {
  id?: number;
  status: CoutourierOrderStatus;
  createdAt?: Date;
  updatedAt?: Date;
  prixTotal: number;
  coutourier: Coutourier;
  fournisseur: FournisseurResponse;
  items: CoutourierOrderItem[];
  // Flattened supplier properties returned by API
  fournisseurNomEntreprise?: string;
  fournisseurNom?: string;
  fournisseurPrenom?: string;
  fournisseurEmail?: string;
}

