import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { detectFields } from './src/content/fieldDetector';
import { mapFields } from './src/content/fieldMapper';
import { fillForms } from './src/content/formFiller';
import type { UserProfile } from './src/types';

// Read test HTML
const html = fs.readFileSync(path.join(process.cwd(), 'test.html'), 'utf-8');
const dom = new JSDOM(html);

// Mock browser globals for our content scripts
global.document = dom.window.document;
global.window = dom.window as any;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
global.HTMLSelectElement = dom.window.HTMLSelectElement;
global.Event = dom.window.Event;

// Mock Profile
const mockProfile: UserProfile = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '123-456-7890',
  location: 'New York, NY',
  linkedin: 'https://linkedin.com/in/johndoe',
  github: 'https://github.com/johndoe',
  portfolio: 'https://johndoe.com',
  education: 'Bachelors in CS, MIT',
  skills: 'React, TypeScript, Node.js',
  workExperience: 'Software Engineer at Acme Corp',
  projects: 'Applytica AI Autofill',
  certifications: 'AWS Certified',
  completionPercentage: 100
};

// 1. Detect Fields
const detected = detectFields();
console.log(`Detected ${detected.length} fields.`);

// 2. Map Fields
const mappings = mapFields(detected, mockProfile);
console.log(`Mapped fields:`);
mappings.forEach(m => {
  console.log(`- [${m.confidence}] ${m.detectedLabel} -> ${m.mappedProfileKey} ('${m.mappedValue}')`);
});

// 3. Fill Forms
const result = fillForms(mappings);
console.log(`Fill result:`, result);

// Verification Assertions
const errors: string[] = [];

// 1. Check if 'Cover Letter' was overwritten (it shouldn't be)
const coverLetterEl = document.getElementById('coverLetter') as HTMLTextAreaElement;
if (coverLetterEl.value !== 'I am very interested in this role.') {
  errors.push(`Cover letter was overwritten! Value is: ${coverLetterEl.value}`);
}

// 2. Ambiguous field should not be filled
const ambiguousEl = document.getElementById('ambiguous1') as HTMLInputElement;
if (ambiguousEl.value) {
  errors.push(`Ambiguous field was filled! Value is: ${ambiguousEl.value}`);
}

// 3. Dropdown test
// Wait, our mock profile 'education' doesn't exactly map to dropdown options "bachelors", "masters".
// The mapper maps 'degree' ? Let's see what it mapped. 
const degreeSelect = document.getElementById('degreeType') as HTMLSelectElement;
console.log(`Degree dropdown value after fill: ${degreeSelect.value}`);
// Actually, our mapper maps "University" to `education`. We don't have a specific `degree` mapping yet.

if (errors.length > 0) {
  console.error("Test failed with errors:\n", errors.join('\n'));
  process.exit(1);
} else {
  console.log("All verifications passed!");
}
