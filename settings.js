document.addEventListener('DOMContentLoaded', () => {
    const websitesTextarea = document.getElementById('websites');
    const searchToggle = document.getElementById('searchToggle');
    const saveButton = document.getElementById('save');
  
    // Load saved settings from Chrome storage
    chrome.storage.sync.get(['preferredWebsites', 'searchEnabled'], (data) => {
      const websites = data.preferredWebsites || ['reddit.com', 'ycombinator.com', 'x.com'];
      websitesTextarea.value = websites.join('\n');
      searchToggle.checked = data.searchEnabled !== false; // default to true
    });
  
    saveButton.addEventListener('click', () => {
      const websites = websitesTextarea.value
        .split('\n')
        .map(website => website.trim())
        .filter(website => website); // Remove empty lines
  
      const searchEnabled = searchToggle.checked;
  
      // Save settings to Chrome storage
      chrome.storage.sync.set({
        preferredWebsites: websites,
        searchEnabled
      }, () => {
        // Show a subtle saved indication
        const originalText = saveButton.textContent;
        saveButton.textContent = 'Saved!';
        setTimeout(() => {
          saveButton.textContent = originalText;
        }, 2000);
      });
    });
  });
