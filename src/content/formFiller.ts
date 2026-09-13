import type { MappingResult } from '../types';

export const fillForms = (mappings: MappingResult[]): { filledCount: number, reviewCount: number } => {
  let filledCount = 0;
  let reviewCount = 0;

  mappings.forEach(mapping => {
    if (mapping.confidence === 'none' || !mapping.mappedValue) {
      reviewCount++;
      return;
    }

    const el = document.querySelector(`[data-applytica-id="${mapping.domId}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
    
    if (!el) {
      reviewCount++;
      return;
    }

    // Do not overwrite existing user values
    if (el.value && el.value.trim().length > 0) {
      return;
    }

    try {
      if (el.tagName.toLowerCase() === 'select') {
        const select = el as HTMLSelectElement;
        // Basic match for selects
        let matched = false;
        for (let i = 0; i < select.options.length; i++) {
          const opt = select.options[i];
          if (
            (opt.value && mapping.mappedValue.toLowerCase().includes(opt.value.toLowerCase())) ||
            (opt.text && mapping.mappedValue.toLowerCase().includes(opt.text.toLowerCase().replace(/['"']/g, '')))
          ) {
            select.selectedIndex = i;
            matched = true;
            break;
          }
        }
        if (!matched) {
          reviewCount++;
          return;
        }
      } else {
        // Handle React/Angular input intercepts by using native setter
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        )?.set;
        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, 'value'
        )?.set;

        if (el.tagName.toLowerCase() === 'textarea' && nativeTextAreaValueSetter) {
          nativeTextAreaValueSetter.call(el, mapping.mappedValue);
        } else if (nativeInputValueSetter) {
          nativeInputValueSetter.call(el, mapping.mappedValue);
        } else {
          el.value = mapping.mappedValue;
        }
      }

      // Dispatch events so frontend frameworks pick up the change
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      
      filledCount++;

      // Visually indicate the field was autofilled
      el.style.backgroundColor = '#f0fdf4'; // Light green
      el.style.transition = 'background-color 0.5s ease';
      setTimeout(() => {
        el.style.backgroundColor = '';
      }, 3000);

    } catch (err) {
      console.error('Applytica: Failed to fill field', err);
      reviewCount++;
    }
  });

  return { filledCount, reviewCount };
};
