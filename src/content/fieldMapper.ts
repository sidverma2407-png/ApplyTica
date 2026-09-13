import type { DetectedField, MappingResult, UserProfile } from '../types';

export const mapFields = (fields: DetectedField[], profile: UserProfile): MappingResult[] => {
  return fields.map(field => {
    const s = field.signals;
    let mappedKey: keyof UserProfile | 'fullName' | undefined;
    let mappedValue: string | undefined = undefined;
    let confidence: 'high' | 'low' | 'none' = 'none';

    // Heuristics mapping
    if (s.includes('first') && s.includes('name')) {
      mappedKey = 'firstName';
      mappedValue = profile.firstName;
      confidence = 'high';
    } else if (s.includes('last') && s.includes('name')) {
      mappedKey = 'lastName';
      mappedValue = profile.lastName;
      confidence = 'high';
    } else if (s.includes('full name') || (s.includes('name') && !s.includes('company') && !s.includes('university'))) {
      mappedKey = 'fullName';
      mappedValue = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
      confidence = 'high';
    } else if (s.includes('email') || s.includes('e-mail')) {
      mappedKey = 'email';
      mappedValue = profile.email;
      confidence = 'high';
    } else if (s.includes('phone') || s.includes('mobile') || s.includes('cell')) {
      mappedKey = 'phone';
      mappedValue = profile.phone;
      confidence = 'high';
    } else if (s.includes('location') || s.includes('city') || s.includes('address')) {
      mappedKey = 'location';
      mappedValue = profile.location;
      confidence = 'high';
    } else if (s.includes('linkedin')) {
      mappedKey = 'linkedin';
      mappedValue = profile.linkedin;
      confidence = 'high';
    } else if (s.includes('github')) {
      mappedKey = 'github';
      mappedValue = profile.github;
      confidence = 'high';
    } else if (s.includes('portfolio') || s.includes('website')) {
      mappedKey = 'portfolio';
      mappedValue = profile.portfolio;
      confidence = 'high';
    } else if (s.includes('school') || s.includes('university') || s.includes('college') || s.includes('degree')) {
      mappedKey = 'education';
      mappedValue = profile.education;
      confidence = 'low'; // low because dropdowns or large textareas are complex
    } else if (s.includes('company') || s.includes('employer') || s.includes('experience')) {
      mappedKey = 'workExperience';
      mappedValue = profile.workExperience;
      confidence = 'low';
    } else if (s.includes('skill') || s.includes('technologies')) {
      mappedKey = 'skills';
      mappedValue = profile.skills;
      confidence = 'low';
    } else if (s.includes('project')) {
      mappedKey = 'projects';
      mappedValue = profile.projects;
      confidence = 'low';
    }

    // Downgrade confidence if we have no value to fill
    if (!mappedValue) {
      confidence = 'none';
    }

    return {
      domId: field.domId,
      detectedLabel: field.label,
      mappedProfileKey: mappedKey,
      mappedValue,
      confidence
    };
  });
};
