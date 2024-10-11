document.addEventListener('DOMContentLoaded', () => {
    const searchToggle = document.getElementById('searchToggle');
    const openSettingsLink = document.getElementById('openSettings');
  
    // Load the toggle state from Chrome storage
    chrome.storage.sync.get(['searchEnabled'], (data) => {
      searchToggle.checked = data.searchEnabled !== false; // default to true
    });
  
    // Save the search toggle state to Chrome storage when changed
    searchToggle.addEventListener('change', () => {
      chrome.storage.sync.set({ searchEnabled: searchToggle.checked });
    });
  
    // Open the extension settings when the link is clicked
    openSettingsLink.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  });
