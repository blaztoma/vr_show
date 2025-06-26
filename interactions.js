let woman_lt = null;
let woman_en = null;
let man_lt = null;
let man_en = null;

let lastSpokenTomas = null;
let lastSpokenLina = null;
let syncInterval = null;
let tomasLastAnimation = null;
let linaLastAnimation = null;

function getCurrentVideoTime() {
    const video = document.querySelector('#tvvideo');
    return video ? video.currentTime : 0;
}

function needsStop(lastSpoken, newStartTime) {
    return lastSpoken === null || (newStartTime - lastSpoken.end > 0.5);
}

function sayText(character, text) {
    let textElementId, characterEntityId;

    // Nustatyti tinkamus ID pagal veikėją
    if (character === 'Tomas') {
        textElementId = '#manText';
        characterEntityId = '#man';
    } else if (character === 'Lina') {
        textElementId = '#womanText';
        characterEntityId = '#woman';
    } else {
        console.error('Nežinomas veikėjas:', character);
        return;
    }

    // Atnaujinti tekstą
    const textElement = document.querySelector(textElementId);
    if (textElement) {
        textElement.setAttribute('troika-text', 'value', text);
        textElement.setAttribute('visible', true);

        // Parodyti burbulą
        const bubbleId = character === 'Tomas' ? '#manBubble' : '#womanBubble';
        const bubbleElement = document.querySelector(bubbleId);
        if (bubbleElement) {
            bubbleElement.setAttribute('visible', true);
        }
    }

    // Paleisti kalbėjimo animaciją
    const currentAnimation = "talk";

    // Patikrinti ar reikia keisti animaciją
    if (character === 'Tomas' && tomasLastAnimation !== currentAnimation) {
        setCharacterAnimation('Tomas', 'Talk neutral');
        tomasLastAnimation = currentAnimation;
    } else if (character === 'Lina' && linaLastAnimation !== currentAnimation) {
        setCharacterAnimation('Lina', 'talk');
        linaLastAnimation = currentAnimation;
    }

    console.log(`${character}: ${text}`);
}

function stopTalking(character) {
    let textElementId, characterEntityId;

    // Nustatyti tinkamus ID pagal veikėją
    if (character === 'Tomas') {
        textElementId = '#manText';
        characterEntityId = '#man';
    } else if (character === 'Lina') {
        textElementId = '#womanText';
        characterEntityId = '#woman';
    } else {
        console.error('Nežinomas veikėjas:', character);
        return;
    }

    // Paslėpti tekstą ir burbulą
    const textElement = document.querySelector(textElementId);
    if (textElement) {
        textElement.setAttribute('visible', false);

        // Paslėpti burbulą
        const bubbleId = character === 'Tomas' ? '#manBubble' : '#womanBubble';
        const bubbleElement = document.querySelector(bubbleId);
        if (bubbleElement) {
            bubbleElement.setAttribute('visible', false);
        }
    }

    // Sustabdyti kalbėjimo animaciją (grįžti į neutralią pozą)
    if (character === 'Tomas') {
        setCharacterAnimation('Tomas', 'Idle');
        tomasLastAnimation = 'Idle';
    } else if (character === 'Lina') {
        setCharacterAnimation('Lina', 'idle');
        linaLastAnimation = 'Idle';
    }

    console.log(`${character} stops talking`);
}

// Likusią interactions.js kodą palikite nepakeistą

function checkForVideoInterruption() {
    // Patikrinti ar video nėra pristabdytas ar kitaip nutrauktas
    const video = document.querySelector('#tvvideo');
    if (video && video.paused) {
        // Galite pridėti logiką sustabdymui
    }
}

function setLanguage(lang) {
    currentLanguage = lang;
    console.log('Kalba pakeista į:', lang);
}

// Funkcija kalbos duomenų pasirinkimui pagal dabartinę kalbą
function getCurrentSpeechData() {
    if (currentLanguage === 'lt') {
        return { man: man_lt, woman: woman_lt };
    } else {
        return { man: man_en, woman: woman_en };
    }
}

// Atnaujinta sync_speech funkcija
function syncSpeech() {
    const speechData = getCurrentSpeechData();

    if (!speechData.man || !speechData.woman) {
        console.log('Dialogue data not loaded yet');
        return;
    }

    const currentTime = getCurrentVideoTime();

    // Vyro kalbos sinchronizacija
    for (let i = 0; i < speechData.man.length; i++) {
        const line = speechData.man[i];
        if (line.start <= currentTime && currentTime <= line.end) {
            if (lastSpokenTomas !== line) {
                if (needsStop(lastSpokenTomas, line.start)) {
                    stopTalking('Tomas');
                }
                sayText('Tomas', line.text);
                lastSpokenTomas = line;

                if ((i + 1 >= speechData.man.length) || (speechData.man[i + 1].start - line.end > 0.5)) {
                    const stopDelay = (line.end - currentTime) * 1000;
                    if (stopDelay > 0) {
                        setTimeout(() => stopTalking('Tomas'), stopDelay);
                    }
                }
            }
        }
    }

    // Moters kalbos sinchronizacija
    for (let i = 0; i < speechData.woman.length; i++) {
        const line = speechData.woman[i];
        if (line.start <= currentTime && currentTime <= line.end) {
            if (lastSpokenLina !== line) {
                if (needsStop(lastSpokenLina, line.start)) {
                    stopTalking('Lina');
                }
                sayText('Lina', line.text);
                lastSpokenLina = line;

                if ((i + 1 >= speechData.woman.length) || (speechData.woman[i + 1].start - line.end > 0.5)) {
                    const stopDelay = (line.end - currentTime) * 1000;
                    if (stopDelay > 0) {
                        setTimeout(() => stopTalking('Lina'), stopDelay);
                    }
                }
            }
        }
    }

    checkForVideoInterruption();
}

// Funkcija sinchronizacijos paleidimui
function startSpeechSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
    }
    // Vykdyti kas 100ms (0.1 sekundės)
    syncInterval = setInterval(syncSpeech, 100);
}

// Funkcija sinchronizacijos sustabdymui
function stopSpeechSync() {
    if (syncInterval) {
        clearInterval(syncInterval);function toggleVideoPlayback() {
            const video = document.querySelector('#tvvideo');
            if (video) {
                if (video.paused) {
                    video.play();
                    startSpeechSync();
                    console.log('Video tęsiamas');
                } else {
                    video.pause();
                    stopSpeechSync();
                    console.log('Video pristabdytas');
                }
            }
        }

        function stopVideo() {
            const video = document.querySelector('#tvvideo');
            const plane = document.querySelector('#tvScreen');

            if (video) {
                video.pause();
                video.currentTime = 0;
                stopSpeechSync();

                // Paslėpti veikėjų tekstus
                stopTalking('Tomas');
                stopTalking('Lina');
            }

            if (plane) {
                plane.setAttribute('material', 'opacity', 0);
            }

            console.log('Video sustabdytas');
        }

// Pagalbinės funkcijos
        function cancelScheduledEvents() {
            stopSpeechSync();
            console.log('Suplanuoti įvykiai atšaukti');
        }

        function stopActivities() {
            const video = document.querySelector('#tvvideo');
            if (video && !video.paused) {
                video.pause();
            }
            stopTalking('Tomas');
            stopTalking('Lina');
            console.log('Veikla sustabdyta');
        }

        function interruptShow() {
            stopVideo();
            showNotification('Show interrupted');
            console.log('Šou nutrauktas');
        }

        function showNotification(message) {
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

// Klaviatūros šortcutai
        document.addEventListener('keydown', function(e) {
            if (e.code === 'Escape') {
                e.preventDefault();
                if (isMenuVisible) {
                    hideChoicePanel();
                } else {
                    mainMenu();
                }
            }

            if (e.code === 'Space') {
                e.preventDefault();
                toggleVideoPlayback();
            }

            // Skaičių klavišai meniu
            if (isMenuVisible && e.code.startsWith('Digit')) {
                const number = parseInt(e.code.replace('Digit', ''));
                if (number >= 1 && number <= 6) {
                    selectAnswer(number);
                }
            }
        });
        syncInterval = null;
    }
}

async function loadDialogues() {
    try {
        const response_woman_lt = await fetch('woman_lt.json');
        woman_lt = await response_woman_lt.json();
        const response_woman_en = await fetch('woman_en.json');
        woman_en = await response_woman_en.json();
        const response_man_lt = await fetch('man_lt.json');
        man_lt = await response_man_lt.json();
        const response_man_en = await fetch('man_en.json');
        man_en = await response_man_en.json();
    } catch (error) {
        console.error('Klaida kraunant pokalbio duomenis:', error);
    }
}

window.addEventListener('load', () => {
    loadDialogues();
});