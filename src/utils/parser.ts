import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import mammoth from 'mammoth';
import type { UserProfile } from '../types';

// Setup pdf.js worker using standard URL (bundled locally by Vite for Manifest V3)
if (typeof window !== 'undefined' && 'document' in window) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export const extractTextFromFile = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();

  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    return extractTextFromPdf(arrayBuffer);
  } else if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
    file.name.endsWith('.docx')
  ) {
    return extractTextFromDocx(arrayBuffer);
  } else {
    throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
  }
};

const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  console.log('Initializing PDF parsing task...');
  let pdf;
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    pdf = await loadingTask.promise;
    console.log(`PDF loaded successfully. Total pages: ${pdf.numPages}`);
  } catch (error) {
    console.error('Error loading PDF document:', error);
    throw new Error('Failed to load PDF document.');
  }

  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      console.log(`Extracting page ${i}...`);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += strings.join(' ') + '\n';
    } catch (error) {
      console.error(`Error extracting text from page ${i}:`, error);
      throw new Error(`Failed to extract text from PDF page ${i}.`);
    }
  }
  
  console.log('PDF text extraction complete.');
  return fullText;
};

const extractTextFromDocx = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to parse DOCX file.');
  }
};

export const parseProfileFromText = (text: string): Partial<UserProfile> => {
  const profile: Partial<UserProfile> = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
    education: '',
    skills: '',
    workExperience: '',
    projects: '',
    certifications: '',
  };

  // Basic regex extractions
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) profile.email = emailMatch[0];

  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/);
  if (phoneMatch) profile.phone = phoneMatch[0];

  const linkedinMatch = text.match(/linkedin\.com\/in\/([\w-]+)/i);
  if (linkedinMatch) profile.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;

  const githubMatch = text.match(/github\.com\/([\w-]+)/i);
  if (githubMatch) profile.github = `https://github.com/${githubMatch[1]}`;

  // Simple name extraction (assume first 2 words in text are name if they are title cased)
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length >= 2) {
    profile.firstName = words[0];
    profile.lastName = words[1];
  }

  // Section extraction based on keywords (naive approach)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentSection = '';
  const sections: Record<string, string[]> = {
    education: [],
    skills: [],
    workExperience: [],
    projects: [],
    certifications: []
  };

  for (const line of lines) {
    const upperLine = line.toUpperCase();
    if (upperLine.includes('EDUCATION') || upperLine.includes('ACADEMICS')) {
      currentSection = 'education';
      continue;
    } else if (upperLine.includes('SKILL') || upperLine.includes('TECHNOLOGIES')) {
      currentSection = 'skills';
      continue;
    } else if (upperLine.includes('EXPERIENCE') || upperLine.includes('WORK HISTORY')) {
      currentSection = 'workExperience';
      continue;
    } else if (upperLine.includes('PROJECT')) {
      currentSection = 'projects';
      continue;
    } else if (upperLine.includes('CERTIFICATION') || upperLine.includes('CERTIFICATE')) {
      currentSection = 'certifications';
      continue;
    }

    if (currentSection && sections[currentSection]) {
      sections[currentSection].push(line);
    }
  }

  profile.education = sections.education.join('\n');
  profile.skills = sections.skills.join('\n');
  profile.workExperience = sections.workExperience.join('\n');
  profile.projects = sections.projects.join('\n');
  profile.certifications = sections.certifications.join('\n');

  return profile;
};

export const calculateCompletion = (profile: Partial<UserProfile>): number => {
  const fields = [
    'firstName', 'lastName', 'email', 'phone', 'location', 
    'linkedin', 'education', 'skills', 'workExperience'
  ];
  let filled = 0;
  
  fields.forEach(field => {
    if (profile[field as keyof UserProfile] && (profile[field as keyof UserProfile] as string).trim().length > 0) {
      filled++;
    }
  });

  return Math.round((filled / fields.length) * 100);
};
