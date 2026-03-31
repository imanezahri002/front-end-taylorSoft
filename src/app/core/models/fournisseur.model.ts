import { User, UserResponse, UserRequest } from './user.model';

// Main Fournisseur model (extends User)
export interface Fournisseur extends User {
  nomEntreprise?: string;
  registreCommerce?: string;
  ice?: string; // identifiant entreprise Maroc
  siteWeb?: string;
  description?: string;
}

// Fournisseur Response model (from API)
export interface FournisseurResponse extends UserResponse {
  nomEntreprise?: string;
  registreCommerce?: string;
  ice?: string; // identifiant entreprise Maroc
  siteWeb?: string;
  description?: string;
}

// Fournisseur Request model (to API)
export interface FournisseurRequest extends UserRequest {
  nomEntreprise?: string;
  registreCommerce?: string;
  ice?: string; // identifiant entreprise Maroc
  siteWeb?: string;
  description?: string;
}
