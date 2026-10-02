document.addEventListener('DOMContentLoaded', () => {
  // Load saved inputs
  chrome.storage?.local?.get(['careerace_profile'], (res) => {
    if (res?.careerace_profile) {
      const p = res.careerace_profile;
      if (p.name) document.getElementById('name').value = p.name;
      if (p.email) document.getElementById('email').value = p.email;
      if (p.phone) document.getElementById('phone').value = p.phone;
      if (p.linkedin) document.getElementById('linkedin').value = p.linkedin;
    }
  });

  document.getElementById('fillBtn').addEventListener('click', () => {
    const profile = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      linkedin: document.getElementById('linkedin').value.trim(),
    };

    chrome.storage?.local?.set({ careerace_profile: profile });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: 'autofill', profile }, (response) => {
        const status = document.getElementById('statusMsg');
        if (response && response.status === 'ok') {
          status.textContent = `Auto-filled ${response.filled} form field(s)!`;
        } else {
          status.textContent = 'Fields scanned and updated.';
        }
      });
    });
  });
});
