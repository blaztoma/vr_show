let currentMenuType = 'language_menu';
let isMenuVisible = false
let currentLanguage = 'en';
let isLanguageSelected = false;
let prebuiltMenus = {};
let menu_translations = null;


function initializeAllMenus() {
    console.log('Building all VR menus...');
    menu_translations = configData.menus;

    if (checkConfigData()) {
        createPrebuiltMenu('main_menu', 'en');
        createPrebuiltMenu('main_menu', 'lt');
        createPrebuiltMenu('language_menu', 'en');
        createPrebuiltMenu('language_menu', 'lt');
        createPrebuiltMenu('topic_menu', 'en');
        createPrebuiltMenu('topic_menu', 'lt');
        console.log('Menus successfully built');
    } else {
        console.warn('Menus were not built due to missing configData or data');
    }
}


function createPrebuiltMenu(menuType, language) {
    const menuKey = `${menuType}_${language}`;
    console.log(`Building menu: ${menuKey}`);

    const menuEntity = buildMenuEntityForLanguage(menuType, language);
    if (menuEntity) {
        menuEntity.setAttribute('id', `vrMenu_${menuKey}`);
        menuEntity.setAttribute('visible', 'false');

        document.querySelector('a-scene').appendChild(menuEntity);
        prebuiltMenus[menuKey] = menuEntity;

        console.log(`✅ Pre-built: ${menuKey}`);
    }
}


function getTranslationForLanguage(category, key, language) {
    if (category === 'topic_menu' && key === 'question') {
        return language === 'lt' ? 'Pasirinkite temą!' : 'Choose a topic!';
    }
    return menu_translations[language]?.[category]?.[key] || `Missing: ${category}.${key}`;
}


function getMenuButtonsForLanguage(menuType, language) {
    if (menuType === 'topic_menu') {
        return generateTopicMenuButtonsForLanguage(language);
    }

    const menuData = menu_translations[language]?.[menuType];
    if (!menuData) return [];

    const buttons = [];
    let answerNumber = 1;

    while (menuData[`answer${answerNumber}`] !== undefined) {
        const text = menuData[`answer${answerNumber}`];

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


function generateTopicMenuButtonsForLanguage(language) {
    if (!configData || !configData.topics) {
        console.warn('Config data arba topics duomenys nėra užkrauti');
        return [];
    }

    const buttons = [];

    configData.topics.forEach((topic, index) => {
        const topicName = topic.name[language] || topic.name.en || topic.id;

        buttons.push({
            answerNumber: index + 1,
            key: `topic_${topic.id}`,
            text: topicName,
            topicId: topic.id
        });
    });

    return buttons;
}

function buildMenuEntityForLanguage(menuType, language) {
    console.log('Building advanced menu entity:', menuType, 'for language:', language);

    const buttonData = getMenuButtonsForLanguage(menuType, language);
    if (!buttonData || buttonData.length === 0) {
        console.error('No button data for menu:', menuType, language);
        return null;
    }

    const menuEntity = document.createElement('a-entity');
    menuEntity.setAttribute('class', 'vr-prebuilt-menu');

    const positions = generateButtonPositions(buttonData.length);
    const menuHeight = calculateMenuHeight(buttonData.length);

    const background = document.createElement('a-plane');
    background.setAttribute('width', '5');
    background.setAttribute('height', menuHeight.toString());
    background.setAttribute('color', '#000000');
    background.setAttribute('opacity', '0.9');
    background.setAttribute('material', 'transparent: true');
    menuEntity.appendChild(background);

    const title = document.createElement('a-troika-text');
    title.setAttribute('value', getTranslationForLanguage(menuType, 'question', language));
    title.setAttribute('position', calculateTitlePosition(menuHeight, buttonData.length));
    title.setAttribute('align', 'center');
    title.setAttribute('color', 'white');
    title.setAttribute('font-size', '0.15');
    menuEntity.appendChild(title);

    buttonData.forEach((btn, index) => {
        if (index >= positions.length) return; // Saugumas

        const buttonEntity = document.createElement('a-box');
        buttonEntity.setAttribute('id', `prebuiltBtn_${menuType}_${language}_${btn.answerNumber}`);
        buttonEntity.setAttribute('width', '2');
        buttonEntity.setAttribute('height', '0.4');
        buttonEntity.setAttribute('depth', '0.1');
        buttonEntity.setAttribute('position', positions[index].position);
        buttonEntity.setAttribute('color', '#2a2a2a');

        buttonEntity.setAttribute('vr-menu-button', {
            menuType: menuType,
            answerNumber: btn.answerNumber,
            color: '#2a2a2a'
        });

        const buttonText = document.createElement('a-troika-text');
        buttonText.setAttribute('value', btn.text);
        buttonText.setAttribute('position', '0 0 0.051');
        buttonText.setAttribute('align', 'center');
        buttonText.setAttribute('color', 'white');
        buttonText.setAttribute('font-size', '0.1');

        buttonEntity.appendChild(buttonText);
        menuEntity.appendChild(buttonEntity);

        console.log('Advanced button created with component:', btn.answerNumber, btn.text);
    });

    return menuEntity;
}


function generateButtonPositions(buttonCount) {
    const positions = [];

    if (buttonCount <= 2) {
        positions.push({ position: '-1.2 -0.1 0.01' });
        positions.push({ position: '1.2 -0.1 0.01' });
    } else if (buttonCount <= 4) {
        positions.push({ position: '-1.2 0.3 0.01' });
        positions.push({ position: '1.2 0.3 0.01' });
        positions.push({ position: '-1.2 -0.3 0.01' });
        positions.push({ position: '1.2 -0.3 0.01' });
    } else if (buttonCount <= 6) {
        positions.push({ position: '-1.2 0.4 0.01' });
        positions.push({ position: '1.2 0.4 0.01' });
        positions.push({ position: '-1.2 -0.2 0.01' });
        positions.push({ position: '1.2 -0.2 0.01' });
        positions.push({ position: '-1.2 -0.8 0.01' });
        positions.push({ position: '1.2 -0.8 0.01' });
    } else {
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


function showInitialLanguageMenu() {
    setTimeout(() => {
        showVRMenu('language_menu');
    }, 1000);
}


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

    const buttonsHeight = rows * buttonHeight + (rows - 1) * buttonSpacing;
    return titleHeight + buttonsHeight + padding;
}


function calculateTitlePosition(menuHeight, buttonCount) {
    const topPadding = 0.2;
    const titleY = (menuHeight / 2) - topPadding - 0.1; // 0.1 - pusė antraštės aukščio
    return `0 ${titleY} 0.01`;
}


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

    const distance = 5;
    const rotation = Math.atan2(-direction.x, -direction.z) * (180 / Math.PI);
    return {
        x: cameraPosition.x + direction.x * distance,
        y: 2.6,
        z: cameraPosition.z + direction.z * distance,
        rotation: rotation
    };
}


// Universalus kontrolių komponentas, kuris palaiko ir desktop, ir VR
AFRAME.registerComponent('smart-controls', {
    init: function () {
        this.desktopRaycaster = null;
        this.gazeCursor = null;
        
        // Iš karto nustatyti desktop režimą
        this.setupDesktopMode();
        
        // Nustatyti VR režimo klausytojus
        this.setupVRModeListener();
    },

    setupDesktopMode: function() {
        if (this.gazeCursor && this.gazeCursor.parentNode) {
            this.gazeCursor.parentNode.removeChild(this.gazeCursor);
        }

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
        console.log('Desktop controls activated');
    },

    setupVRModeListener: function () {
        const sceneEl = this.el.sceneEl;
        
        sceneEl.addEventListener('enter-vr', () => {
            console.log('Entering VR mode - switching to laser controls');
            this.deactivateDesktopMode();
            this.activateVRLasers();
        });

        sceneEl.addEventListener('exit-vr', () => {
            console.log('Exiting VR mode - switching back to desktop controls');
            this.deactivateVRLasers();
            this.setupDesktopMode();
        });
    },

    deactivateDesktopMode: function() {
        if (this.desktopRaycaster && this.desktopRaycaster.parentNode) {
            this.desktopRaycaster.parentNode.removeChild(this.desktopRaycaster);
        }
        console.log('Desktop controls deactivated');
    },

    activateVRLasers: function () {
        const leftHand = document.querySelector('#leftHand');
        const rightHand = document.querySelector('#rightHand');
        
        if (leftHand) {
            this.setupLaserForHand(leftHand, 'left');
        }
        
        if (rightHand) {
            this.setupLaserForHand(rightHand, 'right');
        }
    },

    setupLaserForHand: function (hand, side) {
        // Atnaujinti raycaster parametrus
        hand.setAttribute('raycaster', {
            objects: '.clickable',
            far: 30,
            interval: 100
        });
        
        // Pridėti laser liniją
        hand.setAttribute('line', {
            color: '#ff0000',
            opacity: 0.75,
            visible: false
        });
        
        // Pridėti laser matomumo komponentą
        hand.setAttribute('vr-laser-visibility', '');
        
        console.log(`${side} hand laser configured`);
    },

    deactivateVRLasers: function () {
        const leftHand = document.querySelector('#leftHand');
        const rightHand = document.querySelector('#rightHand');
        
        if (leftHand) {
            leftHand.setAttribute('line', 'visible', false);
            leftHand.removeAttribute('vr-laser-visibility');
        }
        
        if (rightHand) {
            rightHand.setAttribute('line', 'visible', false);
            rightHand.removeAttribute('vr-laser-visibility');
        }
        
        console.log('VR laser controls deactivated');
    },

    remove: function() {
        this.deactivateDesktopMode();
        this.deactivateVRLasers();
    }
});


AFRAME.registerComponent('vr-menu-button', {
    schema: {
        action: {type: 'string'},
        menuType: {type: 'string'},
        answerNumber: {type: 'int'},
        color: {type: 'color', default: '#2a2a2a'}
    },

    init: function() {
        this.el.classList.add('clickable');

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

        hideVRMenu();

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

    }
});


AFRAME.registerComponent('quiz-button', {
    schema: {
        answerNumber: {type: 'int'},
        color: {type: 'color', default: '#2a2a2a'},
        isCorrect: {type: 'boolean', default: false},
        quizType: {type: 'string', default: 'final'}
    },

    init: function() {
        this.el.classList.add('clickable');

        this.el.addEventListener('click', (evt) => {
            console.log('Quiz answer clicked:', this.data.answerNumber, 'isCorrect:', this.data.isCorrect);
            this.handleClick();
        });

        this.el.addEventListener('mouseenter', () => {
            this.el.setAttribute('material', 'color', '#3a3a3a');
            this.el.setAttribute('scale', '1.05 1.05 1');
        });

        this.el.addEventListener('mouseleave', () => {
            this.el.setAttribute('material', 'color', this.data.color);
            this.el.setAttribute('scale', '1 1 1');
        });

        this.el.addEventListener('raycaster-intersected', () => {
            console.log('Quiz raycaster intersected:', this.data.answerNumber);
            this.el.setAttribute('material', 'color', '#4a4a4a');
        });

        this.el.addEventListener('raycaster-intersected-cleared', () => {
            this.el.setAttribute('material', 'color', this.data.color);
        });

        this.el.addEventListener('fusing', () => {
            console.log('Quiz button fusing:', this.data.answerNumber);
            this.el.setAttribute('material', 'color', '#5a5a5a');
        });

        this.el.addEventListener('fuse-reset', () => {
            this.el.setAttribute('material', 'color', this.data.color);
        });
    },

    handleClick: function() {
        const answerNumber = this.data.answerNumber;
        const isCorrect = this.data.isCorrect;
        const quizType = this.data.quizType;

        console.log(`Quiz answer selected: ${answerNumber}, Correct: ${isCorrect}, Type: ${quizType}`);

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

        if (quizType === 'interruption') {
            handleInterruptionAnswer(answerNumber, isCorrect);
        } else if (quizType === 'final') {
            handleQuizAnswer(answerNumber, isCorrect);
        } else {
            console.error('Unknown quiz type:', quizType);
        }
    }
});


function showVRMenu(menuType = 'main_menu') {
    console.log(`📋 Showing menu: ${menuType} (${currentLanguage})`);
    hideAllMenus();

    const menuKey = `${menuType}_${currentLanguage}`;
    const menu = prebuiltMenus[menuKey];

    if (!menu) {
        console.error(`Menu not found: ${menuKey}`);
        if (menuType === 'topic_menu' && configData && configData.topics) {
            console.log('🔄 Creating missing topic menu...');
            createPrebuiltMenu('topic_menu', currentLanguage);
            setTimeout(() => showVRMenu(menuType), 100);
        }
        return;
    }

    updateMenuPosition(menu);
    menu.setAttribute('visible', 'true');

    isMenuVisible = true;
    currentMenuType = menuType;

    console.log(`✅ Menu shown: ${menuKey}`);
}

function hideAllMenus() {
    if (!prebuiltMenus || Object.keys(prebuiltMenus).length === 0) {
        console.log('⚠️ hideAllMenus called before initialization');
        isMenuVisible = false;
        currentMenuType = null;
        return;
    }

    Object.values(prebuiltMenus).forEach(menu => {
        if (menu) {
            menu.setAttribute('visible', 'false');
            menu.setAttribute('position', '0 -1000 0');
        }
    });

    isMenuVisible = false;
    currentMenuType = null;
}


function hideVRMenu() {
    hideAllMenus();
}


function updateMenuPosition(menuEntity) {
    const menuPos = calculateMenuPosition();
    menuEntity.setAttribute('position', `${menuPos.x} ${menuPos.y} ${menuPos.z}`);
    menuEntity.setAttribute('rotation', `0 ${menuPos.rotation} 0`);
}


function handleMainMenuAnswer(answerNumber) {
    switch(answerNumber) {
        case 1:
            startShow();
            break;
        case 2:
            continueShow();
            break;
        case 3:
            showTopicMenu();
            break;
        case 4:
            showNextTopic();
            break;
        case 5:
            showFinalQuiz();
            break;
        case 6:
            explainControls();
            break;
        default:
            console.log('Nežinomas pasirinkimas:', answerNumber);
    }
}

function handleTopicMenuAnswer(answerNumber) {
    if (!configData || !configData.topics) {
        console.error('Config data arba topics duomenys nėra užkrauti');
        return;
    }

    const topicIndex = answerNumber - 1;
    if (topicIndex >= 0 && topicIndex < configData.topics.length) {
        const selectedTopic = configData.topics[topicIndex];
        showTopic(selectedTopic.id);
    } else {
        console.error('Neteisingas topic answer number:', answerNumber);
    }
}

function handleLanguageMenuAnswer(answerNumber) {
    if (answerNumber === 1) {
        setLanguage('lt');
        playInitialSpeech();
    } else if (answerNumber === 2) {
        setLanguage('en');
        playInitialSpeech();
    }
    updateVideoSource();
    console.log(`Kalba pasirinkta: ${currentLanguage}`);
}


function initCamera() {
    const camera = document.querySelector('#camera');
    if (camera) {
        camera.setAttribute('smart-controls', '');
        console.log('Controls initialized');
    }
}

// document.addEventListener('DOMContentLoaded', () => {
//     const camera = document.querySelector('#camera');
//     if (camera) {
//         camera.setAttribute('smart-controls', '');
//         console.log('Controls initialized');
//     }
// });


AFRAME.registerComponent('adaptive-controls', {
    init: function() {
        const sceneEl = this.el.sceneEl;

        sceneEl.addEventListener('enter-vr', () => {
            console.log('Entered VR mode');
            this.switchToVRMode();
        });

        sceneEl.addEventListener('exit-vr', () => {
            console.log('Exited VR mode');
            this.switchToDesktopMode();
        });

        this.switchToDesktopMode();
    },

    switchToVRMode: function() {
        const gazeCursor = document.querySelector('#gaze-cursor');
        if (gazeCursor) {
            gazeCursor.setAttribute('visible', false);
        }

        const leftHand = document.querySelector('#leftHand');
        const rightHand = document.querySelector('#rightHand');
        if (leftHand) leftHand.setAttribute('visible', true);
        if (rightHand) rightHand.setAttribute('visible', true);
    },

    switchToDesktopMode: function() {
        const gazeCursor = document.querySelector('#gaze-cursor');
        if (gazeCursor) {
            gazeCursor.setAttribute('visible', true);
        }

        const leftHand = document.querySelector('#leftHand');
        const rightHand = document.querySelector('#rightHand');
        if (leftHand) leftHand.setAttribute('visible', false);
        if (rightHand) rightHand.setAttribute('visible', false);
    }
});


AFRAME.registerComponent('showman-click', {
    init: function() {
        this.el.addEventListener('click', (evt) => {
            console.log('Showman clicked!');
            console.log(isLanguageSelected);
            if (isLanguageSelected) {
                interruptShow();
                playInterruptionSpeech(() => {
                    if (typeof showVRMenu === 'function') {
                        showVRMenu('main_menu');
                    }
                });
            }
            evt.stopPropagation();
        });
    }
});


function createQuizMenu(questionData, quizType = 'final') {
    const menuEntity = document.createElement('a-entity');
    menuEntity.setAttribute('id', 'quizMenu');
    menuEntity.setAttribute('quiz-type', quizType);

    const menuPos = calculateMenuPosition();
    menuEntity.setAttribute('position', `${menuPos.x} ${menuPos.y} ${menuPos.z}`);
    menuEntity.setAttribute('rotation', `0 ${menuPos.rotation} 0`);

    const answers = [];
    let answerNum = 1;
    while (questionData[`answer${answerNum}`]) {
        answers.push({
            number: answerNum,
            text: questionData[`answer${answerNum}`],
            isCorrect: questionData.correct_answer === `answer${answerNum}`
        });
        answerNum++;
    }

    const menuHeight = calculateMenuHeight(answers.length + 1);
    const positions = generateButtonPositions(answers.length);

    const background = document.createElement('a-plane');
    background.setAttribute('width', '5');
    background.setAttribute('height', menuHeight.toString());
    background.setAttribute('color', '#000000');
    background.setAttribute('opacity', '0.9');
    background.setAttribute('material', 'transparent: true');
    menuEntity.appendChild(background);

    const questionText = document.createElement('a-troika-text');
    questionText.setAttribute('value', questionData.question);
    questionText.setAttribute('position', calculateTitlePosition(menuHeight, answers.length));
    questionText.setAttribute('align', 'center');
    questionText.setAttribute('color', 'white');
    questionText.setAttribute('font-size', '0.12');
    questionText.setAttribute('max-width', '4');
    menuEntity.appendChild(questionText);

    answers.forEach((answer, index) => {
        if (index >= positions.length) return;

        const buttonEntity = document.createElement('a-box');
        buttonEntity.setAttribute('id', `quizBtn_${answer.number}`);
        buttonEntity.setAttribute('width', '2.0');
        buttonEntity.setAttribute('height', '0.4');
        buttonEntity.setAttribute('depth', '0.1');
        buttonEntity.setAttribute('position', positions[index].position);
        buttonEntity.setAttribute('color', '#2a2a2a');

        buttonEntity.setAttribute('quiz-button', {
            answerNumber: answer.number,
            color: '#2a2a2a',
            isCorrect: answer.isCorrect,
            quizType: quizType
        });

        const buttonText = document.createElement('a-troika-text');
        buttonText.setAttribute('value', answer.text);
        buttonText.setAttribute('position', '0 0 0.051');
        buttonText.setAttribute('align', 'center');
        buttonText.setAttribute('color', 'white');
        buttonText.setAttribute('font-size', '0.09');
        buttonText.setAttribute('max-width', '1.8');

        buttonEntity.appendChild(buttonText);
        menuEntity.appendChild(buttonEntity);
    });

    return menuEntity;
}


AFRAME.registerComponent('vr-laser-visibility', {
    init: function () {
        this.onIntersection = this.onIntersection.bind(this);
        this.onIntersectionCleared = this.onIntersectionCleared.bind(this);
        
        this.el.addEventListener('raycaster-intersection', this.onIntersection);
        this.el.addEventListener('raycaster-intersection-cleared', this.onIntersectionCleared);
    },

    onIntersection: function (evt) {
        const sceneEl = this.el.sceneEl;
        if (sceneEl.is('vr-mode')) {
            this.el.setAttribute('line', 'visible', true);
        }
    },

    onIntersectionCleared: function (evt) {
        this.el.setAttribute('line', 'visible', false);
    },

    remove: function () {
        this.el.removeEventListener('raycaster-intersection', this.onIntersection);
        this.el.removeEventListener('raycaster-intersection-cleared', this.onIntersectionCleared);
    }
});

window.initCamera = initCamera;