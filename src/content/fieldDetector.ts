import type { DetectedField } from '../types';

export const detectFields = (): DetectedField[] => {
  const fields: DetectedField[] = [];
  const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), textarea, select');
  
  let counter = 0;

  inputs.forEach((input) => {
    const el = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    
    // Assign a temporary unique ID for Applytica to find it later
    const domId = el.getAttribute('data-applytica-id') || `applytica_field_${Date.now()}_${counter++}`;
    el.setAttribute('data-applytica-id', domId);
    
    let label = '';
    
    // 1. Check associated label by ID
    if (el.id) {
      const labelEl = document.querySelector(`label[for="${el.id}"]`);
      if (labelEl && labelEl.textContent) {
        label = labelEl.textContent.trim();
      }
    }
    
    // 2. Check if wrapped in label
    if (!label && el.parentElement?.tagName.toLowerCase() === 'label') {
      label = el.parentElement.textContent?.replace(el.textContent || '', '').trim() || '';
    }

    // 3. Aria label
    const ariaLabel = el.getAttribute('aria-label') || '';
    
    // 4. Placeholder & Name
    const placeholder = el.getAttribute('placeholder') || '';
    const name = el.name || '';
    const idAttr = el.id || '';
    const autocomplete = el.getAttribute('autocomplete') || '';

    // Combine signals for easy heuristic matching
    const signals = [name, idAttr, label, ariaLabel, placeholder, autocomplete]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    // Determine best display label for the UI
    const displayLabel = label || ariaLabel || placeholder || name || idAttr || 'Unknown Field';

    fields.push({
      domId,
      name,
      type: el.type || 'text',
      tagName: el.tagName.toLowerCase(),
      label: displayLabel,
      placeholder,
      value: el.value,
      signals
    });
  });

  return fields;
};
