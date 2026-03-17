export enum Role {
  ADMIN = 'ADMIN',
  COUTURIER = 'COUTURIER',
  CLIENT = 'CLIENT'
}

export interface UserResponse {
  id: number;
  email: string;
  role: Role;
  statut: string;
  nom: string;
  prenom: string;
  telephone: string;
  profilePicture: string;
  adresse: string;
  userType: string;
}

export interface UserRequest {
  id?: number;
  email: string;
  password?: string;
  role: Role;
  statut: string;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
}
