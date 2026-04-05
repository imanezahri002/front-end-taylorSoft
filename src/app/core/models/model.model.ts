import { Tissu } from './tissu.model';
import { Color } from './color.model';

// Enum for photo order
export enum PhotoOrder {
  PREMIERE = 'PREMIERE',
  DEUXIEME = 'DEUXIEME',
  TROISIEME = 'TROISIEME',
  QUATRIEME = 'QUATRIEME'
}

// Model Photo Response
export interface ModelPhoto {
  id?: number;
  photoUrl: string;
  principal: boolean;
  order: PhotoOrder;
}

// Model Color Response
export interface ModelColor {
  id?: number;
  couleur?: Color;
  couleurId?: number;
  couleurNom?: string;
  photos: ModelPhoto[];
}

// Main Model Response
export interface Model {
  id?: number;
  nom: string;
  description: string;
  prix: number;
  tissu?: Tissu;
  tissuId?: number;
  categorieId?: number;
  couturierId?: number;
  couleurs: ModelColor[];
  active: boolean;
}

// Model Request for creation
export interface ModelRequest {
  nom: string;
  description: string;
  tissuId: number;
  categorieId: number;
  couturierId: number;
  prix: number;
  couleurs: ModelColorRequest[];
  active?: boolean;
}

// Model Color Request
export interface ModelColorRequest {
  couleurId: number;
  photos: ModelPhotoRequest[];
}

// Model Photo Request
export interface ModelPhotoRequest {
  principal: boolean;
  photo_order: PhotoOrder;
}
