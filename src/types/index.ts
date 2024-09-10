// src/types/index.ts

export interface Candidate {
  id: string;
  name: string;
  kelas: string;
  vision: string;
  mission: string;
  photoUrl: string;
  voteCount: number;
}

export interface SchoolInfo {
  name: string;
  logo: string;
}