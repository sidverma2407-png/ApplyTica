import type { UserProfile, MappingResult } from '../types';
import { detectFields } from './fieldDetector';
import { mapFields } from './fieldMapper';
import { fillForms } from './formFiller';

console.log('Applytica Content Script Loaded');

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'SCAN_FORMS') {
    const profile = request.profile as UserProfile;
    if (!profile) {
      sendResponse({ success: false, error: 'No profile found' });
      return true;
    }

    const fields = detectFields();
    const mappings = mapFields(fields, profile);
    
    console.log('Applytica detected and mapped fields:', mappings);
    sendResponse({ success: true, mappings });
  } 
  else if (request.type === 'FILL_FORM') {
    const mappings = request.mappings as MappingResult[];
    const result = fillForms(mappings);
    sendResponse({ success: true, ...result });
  }

  return true;
});
