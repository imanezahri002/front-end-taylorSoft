export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  telephone: string;
  profilePicture?: string;
  role?: string;
}

export interface UserResponse {
    id: number;
    email: string;
    role: string;
    statut: string;
    nom: string;
    prenom: string;
    telephone?: string;
    profilePicture?: string;
    adresse?: string;
    userType?: string;
}
