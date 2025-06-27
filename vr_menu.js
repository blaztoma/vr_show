let currentMenuType = 'language_menu';
let isVRMenuVisible = false;
let currentLanguage = 'en';
let isLanguageSelected = false;

const menu_translations = {
    "en": {
        "main_menu": {
            "question": "What would you like to do now?",
            "answer1": "Start the show!",
            "answer2": "Continue show!",
            "answer3": "Choose a topic!",
            "answer4": "Show next topic!",
            "answer5": "Show final quiz!",
            "answer6": "Explain controls!"
        },
        "topic_menu": {
            "question": "Choose a topic!",
            "answer1": "What is a software process?",
            "answer2": "Waterfall model",
            "answer3": "Spiral model",
            "answer4": "Prototyping",
            "answer5": "RUP model",
            "answer6": "Process improvement"
        },
        "language_menu": {
            "question": "Choose a language!",
            "answer1": "Lithuanian",
            "answer2": "English"
        }
    },
    "lt": {
        "main_menu": {
            "question": "Ką norėtumėte daryti dabar?",
            "answer1": "Pradėti šou!",
            "answer2": "Tęsti šou!",
            "answer3": "Pasirinkti temą!",
            "answer4": "Rodyti kitą temą!",
            "answer5": "Rodyti galutinį testą!",
            "answer6": "Paaiškink valdymą!"
        },
        "topic_menu": {
            "question": "Pasirinkite temą!",
            "answer1": "Kas yra programinės įrangos procesas?",
            "answer2": "Krioklio modelis",
            "answer3": "Spiralinė metodika",
            "answer4": "Prototipavimas",
            "answer5": "RUP modelis",
            "answer6": "Proceso tobulinimas"
        },
        "language_menu": {
            "question": "Pasirinkite kalbą!",
            "answer1": "Lietuvių",
            "answer2": "Anglų"
        }
    }
};

function getTranslation(category, key) {
    return menu_translations[currentLanguage]?.[category]?.[key] || `Missing: ${category}.${key}`;
}

// Funkcija kuri dinamiškai generuoja mygtukų pozicijas pagal kiekį
function generateButtonPositions(buttonCount) {
    const positions = [];

    if (buttonCount <= 2) {
        // 2 mygtukai - horizontaliai
        positions.push({ position: '-1.2 -0.1 0.01' });
        positions.push({ position: '1.2 -0.1 0.01' });
    } else if (buttonCount <= 4) {
        // 4 mygtukai - 2x2 tinklelis
        positions.push({ position: '-1.2 0.3 0.01' });
        positions.push({ position: '1.2 0.3 0.01' });
        positions.push({ position: '-1.2 -0.3 0.01' });
        positions.push({ position: '1.2 -0.3 0.01' });
    } else if (buttonCount <= 6) {
        // 6 mygtukai - 2x3 tinklelis
        positions.push({ position: '-1.2 0.4 0.01' });
        positions.push({ position: '1.2 0.4 0.01' });
        positions.push({ position: '-1.2 -0.2 0.01' });
        positions.push({ position: '1.2 -0.2 0.01' });
        positions.push({ position: '-1.2 -0.8 0.01' });
        positions.push({ position: '1.2 -0.8 0.01' });
    } else {
        // Daugiau nei 6 - sukurti tinklelį
        const cols = 3;
        const rows = Math.ceil(buttonCount / cols);
        const startY = 0.8;
        const stepY = 0.6;
        const startX = -1.2;
        const stepX = 1.2;

        for (let i = 0; i < buttonCount; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = startX + col * stepX;
            const y = startY - row * stepY;
            positions.push({ position: `${x} ${y} 0.01` });
        }
    }

    return positions.slice(0, buttonCount);
}

function getMenuButtons(menuType) {
    const menuData = menu_translations[currentLanguage]?.[menuType];
    if (!menuData) return [];

    const buttons = [];
    let answerNumber = 1;

    // Ieškoti visų answer* raktų
    while (menuData[`answer${answerNumber}`] !== undefined) {
        const text = menuData[`answer${answerNumber}`];

        // Praleisti tuščius tekstus
        if (text && text.trim() !== '') {
            buttons.push({
                answerNumber: answerNumber,
                key: `answer${answerNumber}`,
                text: text
            });
        }
        answerNumber++;
    }

    return buttons;
}

// Funkcija kuri automatiškai rodo kalbos meniu pradėjus programą
function showInitialLanguageMenu() {
    setTimeout(() => {
        showVRMenu('language_menu');
    }, 1000);
}

// Funkcija kuri apskaičiuoja meniu aukštį pagal mygtukų kiekį
function calculateMenuHeight(buttonCount) {
    const titleHeight = 0.5; // Vietos antraštei
    const padding = 0.4; // Viršutinis ir apatinis padding
    const buttonHeight = 0.4; // Vieno mygtuko aukštis
    const buttonSpacing = 0.2; // Tarpas tarp mygtukų eilučių

    let rows;
    if (buttonCount <= 2) {
        rows = 1;
    } else if (buttonCount <= 4) {
        rows = 2;
    } else if (buttonCount <= 6) {
        rows = 3;
    } else {
        const cols = 3;
        rows = Math.ceil(buttonCount / cols);
    }

    // Apskaičiuoti bendrą aukštį
    const buttonsHeight = rows * buttonHeight + (rows - 1) * buttonSpacing;
    return titleHeight + buttonsHeight + padding;
}

// Funkcija kuri apskaičiuoja antraštės poziciją
function calculateTitlePosition(menuHeight, buttonCount) {
    const topPadding = 0.2;
    const titleY = (menuHeight / 2) - topPadding - 0.1; // 0.1 - pusė antraštės aukščio
    return `0 ${titleY} 0.01`;
}

function createVRMenu(menuType = 'main_menu') {
    console.log('Creating VR menu:', menuType);

    const menuEntity = document.createElement('a-entity');
    menuEntity.setAttribute('id', 'vrMenu');

    // Apskaičiuoti poziciją ir rotaciją pagal kameros kryptį
    const menuPos = calculateMenuPosition();
    menuEntity.setAttribute('position', `${menuPos.x} ${menuPos.y} ${menuPos.z}`);
    menuEntity.setAttribute('rotation', `0 ${menuPos.rotation} 0`);

    // Gauti mygtukų duomenis dinamiškai
    const buttonData = getMenuButtons(menuType);
    const positions = generateButtonPositions(buttonData.length);

    // Apskaičiuoti meniu aukštį pagal mygtukų kiekį
    const menuHeight = calculateMenuHeight(buttonData.length);

    // Fono panel su dinamišku aukščiu
    const background = document.createElement('a-plane');
    background.setAttribute('width', '5');
    background.setAttribute('height', menuHeight.toString());
    background.setAttribute('color', '#000000');
    background.setAttribute('opacity', '0.9');
    background.setAttribute('material', 'transparent: true');
    menuEntity.appendChild(background);

    // Antraštė su dinamiška pozicija
    const title = document.createElement('a-troika-text');
    title.setAttribute('value', getTranslation(menuType, 'question'));
    title.setAttribute('position', calculateTitlePosition(menuHeight, buttonData.length));
    title.setAttribute('align', 'center');
    title.setAttribute('color', 'white');
    menuEntity.appendChild(title);

    // Sukurti mygtukus
    buttonData.forEach((btn, index) => {
        if (index >= positions.length) return; // Saugumas

        const buttonEntity = document.createElement('a-box');
        buttonEntity.setAttribute('width', '2');
        buttonEntity.setAttribute('height', '0.4');
        buttonEntity.setAttribute('depth', '0.1');
        buttonEntity.setAttribute('position', positions[index].position);
        buttonEntity.setAttribute('color', '#2a2a2a');

        // Pridėti komponentą su duomenimis
        buttonEntity.setAttribute('vr-menu-button', {
            menuType: menuType,
            answerNumber: btn.answerNumber
        });

        // Mygtuko tekstas
        const buttonText = document.createElement('a-troika-text');
        buttonText.setAttribute('value', btn.text);
        buttonText.setAttribute('position', '0 0 0.051');
        buttonText.setAttribute('align', 'center');
        buttonText.setAttribute('color', 'white');
        buttonText.setAttribute('font-size', '0.1');

        buttonEntity.appendChild(buttonText);
        menuEntity.appendChild(buttonEntity);

        console.log('Button created:', btn.answerNumber, btn.text);
    });

    return menuEntity;
}

// Funkcija apskaičiuoti meniu poziciją pagal kameros kryptį
function calculateMenuPosition() {
    const camera = document.querySelector('#camera');
    if (!camera) return { x: 0, y: 2, z: -5 };

    const cameraObj = camera.object3D;
    const cameraPosition = cameraObj.position;

    const direction = new THREE.Vector3();
    cameraObj.getWorldDirection(direction);
    direction.multiplyScalar(-1);
    direction.y = 0;
    direction.normalize();

    const distance = 5; // Pakeista iš 3 į 5 - dabar meniu bus toliau
    const rotation = Math.atan2(-direction.x, -direction.z) * (180 / Math.PI);
    return {
        x: cameraPosition.x + direction.x * distance,
        y: 2.6,
        z: cameraPosition.z + direction.z * distance,
        rotation: rotation
    };
}

// Komponentas, kuris automatiškai prisitaiko prie režimo
AFRAME.registerComponent('smart-controls', {
    init: function() {
        this.sceneEl = this.el.sceneEl;
        this.gazeCursor = null;
        this.desktopRaycaster = null;

        // Klausytis VR režimo pasikeitimų
        this.sceneEl.addEventListener('enter-vr', this.onEnterVR.bind(this));
        this.sceneEl.addEventListener('exit-vr', this.onExitVR.bind(this));

        // Pradinis nustatymas - desktop režimas
        setTimeout(() => {
            this.setupDesktopMode();
        }, 100);
    },

    onEnterVR: function() {
        console.log('Įjungtas VR režimas - naudojamas gaze valdymas');
        this.setupVRMode();
    },

    onExitVR: function() {
        console.log('Išjungtas VR režimas - naudojamas pelės valdymas');
        this.setupDesktopMode();
    },

    setupVRMode: function() {
        // Pašalinti desktop raycaster
        if (this.desktopRaycaster && this.desktopRaycaster.parentNode) {
            this.desktopRaycaster.parentNode.removeChild(this.desktopRaycaster);
        }

        // VR režime pridėti gaze cursor
        if (!this.gazeCursor) {
            this.gazeCursor = document.createElement('a-cursor');
            this.gazeCursor.setAttribute('position', '0 0 -0.5');
            this.gazeCursor.setAttribute('geometry', {
                primitive: 'ring',
                radiusInner: 0.02,
                radiusOuter: 0.03
            });
            this.gazeCursor.setAttribute('material', {
                color: 'white',
                shader: 'flat',
                opacity: 0.8
            });
            this.gazeCursor.setAttribute('cursor', {
                fuse: true,
                fuseTimeout: 1500
            });
            this.gazeCursor.setAttribute('raycaster', 'objects: .clickable');

            // Animacijos
            this.gazeCursor.setAttribute('animation__click', {
                property: 'scale',
                startEvents: 'click',
                easing: 'easeInCubic',
                dur: 150,
                from: '0.1 0.1 0.1',
                to: '1 1 1'
            });
            this.gazeCursor.setAttribute('animation__fusing', {
                property: 'scale',
                startEvents: 'fusing',
                easing: 'easeInCubic',
                dur: 1500,
                from: '1 1 1',
                to: '0.1 0.1 0.1'
            });
        }

        // Pridėti cursor prie kameros
        this.el.appendChild(this.gazeCursor);
    },

    setupDesktopMode: function() {
        // Desktop režime pašalinti gaze cursor
        if (this.gazeCursor && this.gazeCursor.parentNode) {
            this.gazeCursor.parentNode.removeChild(this.gazeCursor);
        }

        // Pridėti desktop raycaster pelės valdymui
        if (!this.desktopRaycaster) {
            this.desktopRaycaster = document.createElement('a-entity');
            this.desktopRaycaster.setAttribute('raycaster', {
                objects: '.clickable',
                showLine: false
            });
            this.desktopRaycaster.setAttribute('cursor', {
                rayOrigin: 'mouse'
            });
        }

        this.el.appendChild(this.desktopRaycaster);
    },

    remove: function() {
        if (this.gazeCursor && this.gazeCursor.parentNode) {
            this.gazeCursor.parentNode.removeChild(this.gazeCursor);
        }
        if (this.desktopRaycaster && this.desktopRaycaster.parentNode) {
            this.desktopRaycaster.parentNode.removeChild(this.desktopRaycaster);
        }
    }
});

// Pagerinta VR meniu mygtuko komponentas
AFRAME.registerComponent('vr-menu-button', {
    schema: {
        action: {type: 'string'},
        menuType: {type: 'string'},
        answerNumber: {type: 'int'},
        color: {type: 'color', default: '#2a2a2a'}
    },

    init: function() {
        // Pridėti clickable klasę
        this.el.classList.add('clickable');

        // Debug log
        console.log('VR Menu Button created:', this.data.answerNumber);

        // Desktop ir VR click event
        this.el.addEventListener('click', (evt) => {
            console.log('Button clicked:', this.data.answerNumber);
            this.handleClick();
        });

        // Hover effects (veiks ir desktop, ir VR)
        this.el.addEventListener('mouseenter', () => {
            this.el.setAttribute('material', 'color', '#3a3a3a');
            this.el.setAttribute('scale', '1.05 1.05 1');
        });

        this.el.addEventListener('mouseleave', () => {
            this.el.setAttribute('material', 'color', this.data.color);
            this.el.setAttribute('scale', '1 1 1');
        });

        // VR kontrolierių events
        this.el.addEventListener('raycaster-intersected', () => {
            console.log('Raycaster intersected:', this.data.answerNumber);
            this.el.setAttribute('material', 'color', '#4a4a4a');
        });

        this.el.addEventListener('raycaster-intersected-cleared', () => {
            this.el.setAttribute('material', 'color', this.data.color);
        });
    },

    handleClick: function() {
        const menuType = this.data.menuType;
        const answerNumber = this.data.answerNumber;

        console.log('VR Menu action:', menuType, answerNumber);

        // Vizualus feedback
        this.el.setAttribute('animation', {
            property: 'scale',
            from: '1 1 1',
            to: '0.95 0.95 0.95',
            dur: 100,
            easing: 'easeInOutQuad',
            autoplay: true,
            loop: false
        });

        setTimeout(() => {
            this.el.setAttribute('scale', '1 1 1');
        }, 100);

        // Iškviesti atitinkamą handler
        try {
            if (menuType === 'main_menu') {
                handleMainMenuAnswer(answerNumber);
            } else if (menuType === 'topic_menu') {
                handleTopicMenuAnswer(answerNumber);
            } else if (menuType === 'language_menu') {
                handleLanguageMenuAnswer(answerNumber);
            }
        } catch (error) {
            console.error('Error handling menu action:', error);
        }

        hideVRMenu();
    }
});

// Meniu rodymas
function showVRMenu(menuType = 'main_menu') {
    if (isVRMenuVisible) return;

    const scene = document.querySelector('a-scene');
    const existingMenu = document.getElementById('vrMenu');

    if (existingMenu) {
        existingMenu.remove();
    }

    currentMenuType = menuType;
    const menu = createVRMenu(menuType);
    scene.appendChild(menu);

    isVRMenuVisible = true;

    // Pristabdyti video
    const video = document.querySelector('#tvvideo');
    if (video && !video.paused) {
        video.pause();
    }
}

function hideVRMenu() {
    const menu = document.getElementById('vrMenu');
    if (menu) {
        menu.remove();
    }
    isVRMenuVisible = false;
}

function toggleVRMenu() {
    if (isVRMenuVisible) {
        hideVRMenu();
    } else {
        showVRMenu('main_menu');
    }
}

// Menu handlers
function handleMainMenuAnswer(answerNumber) {
    switch(answerNumber) {
        case 1: // Pradėti šou!
            startShow();
            break;
        case 2: // Tęsti šou!
            continueShow();
            break;
        case 3: // Pasirinkti temą!
            showTopicMenu();
            break;
        case 4: // Rodyti kitą temą!
            showNextTopic();
            break;
        case 5: // Rodyti galutinį testą!
            showFinalQuiz();
            break;
        case 6: // Paaiškink valdymą!
            explainControls();
            break;
        default:
            console.log('Nežinomas pasirinkimas:', answerNumber);
    }
}

function handleTopicMenuAnswer(answerNumber) {
    const topics = [
        'software_process',
        'waterfall_model',
        'spiral_model',
        'prototyping',
        'rup_model',
        'process_improvement'
    ];

    if (answerNumber >= 1 && answerNumber <= 6) {
        const selectedTopic = topics[answerNumber - 1];
        showTopic(selectedTopic);
    }
}

function handleLanguageMenuAnswer(answerNumber) {
    if (answerNumber === 1) {
        setLanguage('lt');
        playVideo('lt');
    } else if (answerNumber === 2) {
        setLanguage('en');
        playVideo('en');
    }
    console.log(`Kalba pasirinkta: ${currentLanguage}`);
}

function setLanguage(lang) {
    currentLanguage = lang;
    console.log('Kalba pakeista į:', lang);
    isLanguageSelected = true;
    console.log('Kalba pasirinkta:', isLanguageSelected);
}

// Pakoreguoti mainMenu funkciją kad rodytų kalbos meniu jei kalba dar nepasirinkta
function mainMenu(interruption = false) {
    if (interruption) {
        cancelScheduledEvents();
        stopActivities();
        interruptShow();
    } else {
        // Jei dar nėra pasirinkta kalba, rodyti kalbos meniu
        const video = document.querySelector('#tvvideo');
        if (!video.src || video.currentTime === 0) {
            showVRMenu('language_menu');
        } else {
            showVRMenu('main_menu');
        }
    }
}

// Veiksmai
function startShow() {
    const video = document.querySelector('#tvvideo');
    const plane = document.querySelector('#tvScreen');

    if (video && plane) {
        plane.setAttribute('material', 'opacity', 1);
        video.currentTime = 0; // Pradėti nuo pradžios
        video.play();
        startSpeechSync();
        console.log('Šou pradėtas');
        showNotification('Šou pradėtas!');
    }
}

function continueShow() {
    const video = document.querySelector('#tvvideo');

    if (video) {
        if (video.paused) {
            video.play();
            startSpeechSync();
            console.log('Šou tęsiamas');
            showNotification('Šou tęsiamas!');
        } else {
            console.log('Šou jau vyksta');
            showNotification('Šou jau vyksta!');
        }
    }
}

function showTopicMenu() {
    showVRMenu('topic_menu');
}

function showTopic(topicName) {
    console.log('Pasirinkta tema:', topicName);
    showNotification(`Rodoma tema: ${topicName}`);
    // Čia galite pridėti logiką konkrečios temos rodymui
}

function showNextTopic() {
    console.log('Rodoma kita tema');
    showNotification('Rodoma kita tema!');
    // Čia galite pridėti logiką kitos temos rodymui
}

function showFinalQuiz() {
    console.log('Rodomas galutinis testas');
    showNotification('Rodomas galutinis testas!');
    // Čia galite pridėti testo logiką
}

function explainControls() {
    const controlsText = currentLanguage === 'lt' ?
        'Valdymas:\n- Žiūrėkite į mygtuką 1.5 sek\n- Naudokite VR kontrolerius\n- Judėkite galva aplink sceną' :
        'Controls:\n- Look at button for 1.5 sec\n- Use VR controllers\n- Move your head around the scene';

    showNotification(controlsText, 5000);
}

// Atnaujinta showNotification funkcija taip pat naudoja kameros kryptį
function showNotification(message, duration = 3000) {
    const scene = document.querySelector('a-scene');
    const notification = document.createElement('a-entity');
    notification.setAttribute('id', 'vrNotification');

    // Apskaičiuoti poziciją pagal kameros kryptį
    const notificationPos = calculateMenuPosition();
    // Pranešimas šiek tiek aukščiau ir arčiau nei meniu
    notificationPos.y += 0.5;
    notificationPos.z += 1;

    notification.setAttribute('position', `${notificationPos.x} ${notificationPos.y} ${notificationPos.z}`);

    const background = document.createElement('a-plane');
    background.setAttribute('width', '4');
    background.setAttribute('height', '1');
    background.setAttribute('color', '#333333');
    background.setAttribute('opacity', '0.9');
    background.setAttribute('material', 'transparent: true');
    notification.appendChild(background);

    const text = document.createElement('a-text');
    text.setAttribute('value', message);
    text.setAttribute('position', '0 0 0.01');
    text.setAttribute('align', 'center');
    text.setAttribute('color', 'white');
    text.setAttribute('width', '6');
    notification.appendChild(text);

    scene.appendChild(notification);

    setTimeout(() => {
        const existingNotification = document.getElementById('vrNotification');
        if (existingNotification) {
            existingNotification.remove();
        }
    }, duration);
}

// Pagalbinės funkcijos iš originalaus kodo
function cancelScheduledEvents() {
    if (typeof stopSpeechSync === 'function') {
        stopSpeechSync();
    }
    console.log('Suplanuoti įvykiai atšaukti');
}

function stopActivities() {
    const video = document.querySelector('#tvvideo');
    if (video && !video.paused) {
        video.pause();
    }
    if (typeof stopTalking === 'function') {
        stopTalking('Tomas');
        stopTalking('Lina');
    }
    console.log('Veikla sustabdyta');
}

function interruptShow() {
    const video = document.querySelector('#tvvideo');
    const plane = document.querySelector('#tvScreen');

    if (video) {
        video.pause();
        video.currentTime = 0;
    }

    if (plane) {
        plane.setAttribute('material', 'opacity', 0);
    }

    if (typeof stopSpeechSync === 'function') {
        stopSpeechSync();
    }
    if (typeof stopTalking === 'function') {
        stopTalking('Tomas');
        stopTalking('Lina');
    }

    showNotification('Šou nutrauktas');
    console.log('Šou nutrauktas');
}

// Komponentas, kuris aptinka VR/Desktop režimą ir prisitaiko
AFRAME.registerComponent('adaptive-controls', {
    init: function() {
        const sceneEl = this.el.sceneEl;

        // Klausytis VR režimo pasikeitimų
        sceneEl.addEventListener('enter-vr', () => {
            console.log('Entered VR mode');
            this.switchToVRMode();
        });

        sceneEl.addEventListener('exit-vr', () => {
            console.log('Exited VR mode');
            this.switchToDesktopMode();
        });

        // Pradinis nustatymas
        this.switchToDesktopMode();
    },

    switchToVRMode: function() {
        // VR režime paslėpti gaze cursor
        const gazeCursor = document.querySelector('#gaze-cursor');
        if (gazeCursor) {
            gazeCursor.setAttribute('visible', false);
        }

        // Rodyti VR kontrolierius
        const leftHand = document.querySelector('#leftHand');
        const rightHand = document.querySelector('#rightHand');
        if (leftHand) leftHand.setAttribute('visible', true);
        if (rightHand) rightHand.setAttribute('visible', true);
    },

    switchToDesktopMode: function() {
        // Desktop režime rodyti gaze cursor
        const gazeCursor = document.querySelector('#gaze-cursor');
        if (gazeCursor) {
            gazeCursor.setAttribute('visible', true);
        }

        // Paslėpti VR kontrolierius
        const leftHand = document.querySelector('#leftHand');
        const rightHand = document.querySelector('#rightHand');
        if (leftHand) leftHand.setAttribute('visible', false);
        if (rightHand) rightHand.setAttribute('visible', false);
    }
});

// Pridėti komponentą prie kameros
document.addEventListener('DOMContentLoaded', function() {
    const camera = document.querySelector('#camera');
    if (camera) {
        camera.setAttribute('adaptive-controls', '');
    }
});

// Inicializacija
document.addEventListener('DOMContentLoaded', () => {
    // Pradžioje rodyti kalbos pasirinkimo meniu
    showInitialLanguageMenu();

    // Pridėti smart-controls komponentą prie kameros
    const camera = document.querySelector('#camera');
    if (camera) {
        camera.setAttribute('smart-controls', '');
        console.log('Controls initialized');
    }
});

// Pridėti showman click komponentą (galima įdėti į vr_menu.js pabaigą)
AFRAME.registerComponent('showman-click', {
    init: function() {
        this.el.addEventListener('click', (evt) => {
            console.log('Showman clicked!');
            console.log(isLanguageSelected);
            if (isLanguageSelected) {
                console.log('Language selected, showing main menu');
                showVRMenu('main_menu');
            }
            
            evt.stopPropagation();
        });
    }
});