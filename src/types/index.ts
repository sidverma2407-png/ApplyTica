export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  education: string;
  skills: string;
  workExperience: string;
  projects: string;
  certifications: string;
  completionPercentage: number;
  lastUpdated?: number;
}

export interface DetectedField {
  domId: string;
  name: string;
  type: string;
  tagName: string;
  label: string;
  placeholder: string;
  value: string;
  signals: string; // combined string of all identifying text for easy regex matching
}

export interface MappingResult {
  domId: string;
  detectedLabel: string;
  mappedProfileKey?: keyof UserProfile | 'fullName' | string;
  mappedValue?: string;
  confidence: 'high' | 'low' | 'none';
}

export interface ApplyticaState {
  profile: UserProfile | null;
  status: string;
}
