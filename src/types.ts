// src/types.ts

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

export interface Token {
  id: string;
  token: string;
  used: boolean;
  candidateId: string | null;
  originalIndex: number;
  type: 'student' | 'teacher';
}

export interface Admin {
  id: string;
  username: string;
  password: string;
}