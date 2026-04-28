import { saveLead } from './supabase';

const LEAD_CAPTURED_KEY = 'beat-anyone-lead-captured';

export function hasLeadBeenCaptured(): boolean {
  return localStorage.getItem(LEAD_CAPTURED_KEY) === 'true';
}

function markLeadCaptured(): void {
  localStorage.setItem(LEAD_CAPTURED_KEY, 'true');
}

/**
 * Shows the lead capture modal. Returns a promise that resolves when
 * the user successfully submits (lead saved to Supabase), or rejects if dismissed.
 */
export function showLeadModal(): Promise<void> {
  return new Promise((resolve, reject) => {
    const backdrop = document.getElementById('lead-modal') as HTMLElement;
    const form = document.getElementById('lead-form') as HTMLFormElement;
    const nameInput = document.getElementById('lead-name') as HTMLInputElement;
    const phoneInput = document.getElementById('lead-phone') as HTMLInputElement;
    const errorEl = document.getElementById('lead-error') as HTMLElement;
    const submitBtn = document.getElementById('lead-submit') as HTMLButtonElement;
    const submitText = document.getElementById('lead-submit-text') as HTMLElement;

    // Reset state
    form.reset();
    errorEl.classList.add('hidden');
    submitBtn.disabled = false;
    submitText.textContent = 'UNLOCK NOW';

    // Show modal
    backdrop.classList.remove('hidden');
    nameInput.focus();

    function showError(msg: string) {
      errorEl.textContent = msg;
      errorEl.classList.remove('hidden');
    }

    async function handleSubmit(e: Event) {
      e.preventDefault();
      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();

      if (!name) { showError('Please enter your name'); return; }
      if (!phone || phone.length < 6) { showError('Please enter a valid phone number'); return; }

      submitBtn.disabled = true;
      submitText.textContent = 'SAVING...';
      errorEl.classList.add('hidden');

      try {
        await saveLead(name, phone);
        markLeadCaptured();
        backdrop.classList.add('hidden');
        cleanup();
        resolve();
      } catch (err: any) {
        console.error('Supabase error:', err);
        showError(err?.message ?? 'Something went wrong. Try again.');
        submitBtn.disabled = false;
        submitText.textContent = 'UNLOCK NOW';
      }
    }

    function cleanup() {
      form.removeEventListener('submit', handleSubmit);
    }

    form.addEventListener('submit', handleSubmit);
  });
}
