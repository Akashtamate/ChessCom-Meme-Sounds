// Chess.com Custom Sounds Extension
// Injects the sound replacement script into the page context

(function() {
    'use strict';

    //const CAPTURE_SOUND = 'https://www.myinstants.com/media/sounds/fart-with-reverb.mp3';
    //const CHECK_SOUND = 'https://quicksounds.com/uploads/tracks/1516062671_1563213891_1648330556.mp3';
    //const CHECKMATE_SOUND = 'https://www.myinstants.com/media/sounds/movie_1.mp3';
	
	const CAPTURE_SOUND = chrome.runtime.getURL('sounds/capture.mp3');
	const CHECK_SOUND = chrome.runtime.getURL('sounds/check.mp3');
	const CHECKMATE_SOUND = chrome.runtime.getURL('sounds/checkmate.mp3');
	
    // Get enabled state from storage and inject
    chrome.storage.sync.get(['soundsEnabled'], function(result) {
        const isEnabled = result.soundsEnabled !== false; // Default to true
        
        // Create config element with sound URLs and enabled state
        const configElement = document.createElement('div');
        configElement.id = 'chess-sounds-config';
        configElement.style.display = 'none';
        configElement.dataset.capture = CAPTURE_SOUND;
        configElement.dataset.check = CHECK_SOUND;
        configElement.dataset.checkmate = CHECKMATE_SOUND;
        configElement.dataset.enabled = isEnabled.toString();
        (document.head || document.documentElement).appendChild(configElement);

        // Inject the script
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('inject.js');
        script.onload = function() {
            this.remove();
        };
        (document.head || document.documentElement).appendChild(script);
    });

    // Listen for toggle messages from popup
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'toggleSounds') {
            // Update config element
            const configElement = document.getElementById('chess-sounds-config');
            if (configElement) {
                configElement.dataset.enabled = request.enabled.toString();
            }
            
            // Send message to page context via window.postMessage
            window.postMessage({
                type: 'CHESS_SOUNDS_TOGGLE',
                enabled: request.enabled
            }, '*');
        }
    });
})();
