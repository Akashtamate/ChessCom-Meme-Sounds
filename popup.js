// Popup script for Chess.com Custom Sounds Extension

document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('soundToggle');
    const statusText = document.getElementById('statusText');
    
    // Load saved state from storage
    chrome.storage.sync.get(['soundsEnabled'], function(result) {
        const isEnabled = result.soundsEnabled !== false; // Default to true
        toggle.checked = isEnabled;
        updateStatus(isEnabled);
    });
    
    // Handle toggle change
    toggle.addEventListener('change', function() {
        const isEnabled = this.checked;
        
        // Save state to storage
        chrome.storage.sync.set({ soundsEnabled: isEnabled }, function() {
            updateStatus(isEnabled);
            
            // Send message to content script
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'toggleSounds',
                        enabled: isEnabled
                    }).catch(() => {
                        // Ignore errors if content script not ready
                    });
                }
            });
        });
    });
    
    function updateStatus(enabled) {
        if (enabled) {
            statusText.textContent = 'Enabled';
            statusText.classList.add('active');
        } else {
            statusText.textContent = 'Disabled';
            statusText.classList.remove('active');
        }
    }
});
