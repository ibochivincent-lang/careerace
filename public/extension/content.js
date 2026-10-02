// Career Ace ATS Auto-Fill Content Script
(function () {
  console.log('[Career Ace] ATS Form Assistant loaded.');

  // Listen for fill commands from popup or keyboard shortcut
  chrome.runtime?.onMessage?.addListener((request, sender, sendResponse) => {
    if (request.action === 'autofill') {
      const profile = request.profile || {};
      const filledCount = autofillForm(profile);
      sendResponse({ status: 'ok', filled: filledCount });
    }
  });

  function autofillForm(profile) {
    let count = 0;
    const inputs = document.querySelectorAll('input, textarea, select');

    inputs.forEach((input) => {
      const name = (input.getAttribute('name') || '').toLowerCase();
      const id = (input.getAttribute('id') || '').toLowerCase();
      const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();
      const aria = (input.getAttribute('aria-label') || '').toLowerCase();
      const descriptor = `${name} ${id} ${placeholder} ${aria}`;

      function setValue(val) {
        if (!val || input.value) return;
        input.value = val;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        count++;
      }

      // First Name
      if (descriptor.includes('first_name') || descriptor.includes('firstname') || descriptor.includes('first name')) {
        setValue(profile.first_name || profile.name?.split(' ')[0] || '');
      }
      // Last Name
      else if (descriptor.includes('last_name') || descriptor.includes('lastname') || descriptor.includes('last name')) {
        const parts = profile.name?.split(' ') || [];
        setValue(parts.length > 1 ? parts.slice(1).join(' ') : 'Candidate');
      }
      // Full Name
      else if (descriptor.includes('full_name') || descriptor.includes('fullname') || descriptor.includes('name')) {
        setValue(profile.name || '');
      }
      // Email
      else if (descriptor.includes('email') || input.type === 'email') {
        setValue(profile.email || '');
      }
      // Phone
      else if (descriptor.includes('phone') || descriptor.includes('mobile') || input.type === 'tel') {
        setValue(profile.phone || '');
      }
      // LinkedIn
      else if (descriptor.includes('linkedin')) {
        setValue(profile.linkedin || '');
      }
      // GitHub
      else if (descriptor.includes('github') || descriptor.includes('git')) {
        setValue(profile.github || '');
      }
      // Website / Portfolio
      else if (descriptor.includes('website') || descriptor.includes('portfolio') || descriptor.includes('url')) {
        setValue(profile.portfolio || profile.passport_url || '');
      }
      // Cover Letter
      else if (descriptor.includes('cover_letter') || descriptor.includes('cover letter') || descriptor.includes('comments')) {
        setValue(profile.cover_letter || '');
      }
    });

    return count;
  }
})();
