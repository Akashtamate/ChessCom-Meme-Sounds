// This script runs in the page context and replaces chess.com sounds
// It's injected by content.js

(function() {
    'use strict';
    
    try {
        // Get sound URLs and enabled state from config element
        const configElement = document.getElementById('chess-sounds-config');
        const CAPTURE_SOUND = configElement?.dataset.capture || 'https://www.myinstants.com/media/sounds/fart-with-reverb.mp3';
        const CHECK_SOUND = configElement?.dataset.check || 'https://quicksounds.com/uploads/tracks/1516062671_1563213891_1648330556.mp3';
        const CHECKMATE_SOUND = configElement?.dataset.checkmate || 'https://www.myinstants.com/media/sounds/movie_1.mp3';
        
        // Get initial enabled state (default to true)
        let soundsEnabled = configElement?.dataset.enabled !== 'false';
        
        const captureAudio = new Audio(CAPTURE_SOUND);
        const checkAudio = new Audio(CHECK_SOUND);
        const checkmateAudio = new Audio(CHECKMATE_SOUND);

        captureAudio.load();
        checkAudio.load();
        checkmateAudio.load();

        let soundBatch = [];
        let batchTimer = null;
        let isNavigating = false;
        let lastSoundTime = 0;

        // Listen for toggle messages from content script
        window.addEventListener('message', function(event) {
            if (event.data.type === 'CHESS_SOUNDS_TOGGLE') {
                soundsEnabled = event.data.enabled;
                console.log('Chess Custom Sounds:', soundsEnabled ? 'Enabled' : 'Disabled');
            }
        });

        function playHighestPrioritySound() {
            if (soundBatch.length === 0) return;

            let soundToPlay = null;
            
            if (soundBatch.indexOf('checkmate') !== -1) {
                soundToPlay = 'checkmate';
            } else if (soundBatch.indexOf('check') !== -1) {
                soundToPlay = 'check';
            } else if (soundBatch.indexOf('capture') !== -1) {
                soundToPlay = 'capture';
            }

            try {
                if (soundToPlay === 'checkmate') {
                    checkmateAudio.cloneNode().play().catch(() => {});
                } else if (soundToPlay === 'check') {
                    checkAudio.cloneNode().play().catch(() => {});
                } else if (soundToPlay === 'capture') {
                    captureAudio.cloneNode().play().catch(() => {});
                }
            } catch (e) {
                // Silent fail
            }

            soundBatch = [];
        }

        function addToBatch(soundType) {
            soundBatch.push(soundType);

            if (batchTimer) {
                clearTimeout(batchTimer);
            }

            batchTimer = setTimeout(() => {
                playHighestPrioritySound();
                batchTimer = null;
            }, 150);
        }

        const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;

        if (OriginalAudioContext) {
            const originalCreateBufferSource = OriginalAudioContext.prototype.createBufferSource;

            OriginalAudioContext.prototype.createBufferSource = function() {
                const bufferSource = originalCreateBufferSource.call(this);
                const originalStart = bufferSource.start.bind(bufferSource);

                bufferSource.start = function(when, offset, duration) {
                    if (!duration) {
                        return originalStart(when, offset, duration);
                    }

                    const now = Date.now();
                    const timeSinceLastSound = now - lastSoundTime;

                    if (timeSinceLastSound < 50 && timeSinceLastSound > 0) {
                        if (!isNavigating) {
                            isNavigating = true;
                            setTimeout(() => { 
                                isNavigating = false;
                            }, 500);
                        }
                    }
                    lastSoundTime = now;

                    if (isNavigating) {
                        return originalStart(when, offset, duration);
                    }

                    // CRITICAL: Check if custom sounds are enabled
                    // If disabled, play original chess.com sounds
                    if (!soundsEnabled) {
                        return originalStart(when, offset, duration);
                    }

                    // Only intercept and replace if custom sounds are enabled
                    if (duration >= 0.280 && duration <= 0.290) {
                        addToBatch('checkmate');
                        return;
                    }

                    if (duration >= 0.325 && duration <= 0.340) {
                        addToBatch('check');
                        return;
                    }

                    if (duration >= 0.365 && duration <= 0.375) {
                        addToBatch('capture');
                        return;
                    }

                    return originalStart(when, offset, duration);
                };

                return bufferSource;
            };
        }
        
        console.log('Chess Custom Sounds:', soundsEnabled ? 'Active' : 'Loaded (Disabled)');
        
    } catch (error) {
        console.error('Chess Custom Sounds: Error loading', error);
    }
})();
