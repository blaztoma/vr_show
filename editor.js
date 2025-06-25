let selectedId = null;
let isUpdating = false;
let mutationObserver = null;
let lastKnownPosition = null;
let lastKnownRotation = null;
let isTickerActive = false;

function populateComponentList() {
    const select = document.getElementById('componentSelect');
    const entities = document.querySelectorAll('a-entity[id]');
    select.innerHTML = '';

    entities.forEach(ent => {
        const id = ent.getAttribute('id');
        if (id) {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = id;
            select.appendChild(opt);
        }
    });

    if (entities.length > 0) {
        selectedId = select.value = entities[0].getAttribute('id');
    }
}

function loadComponentData() {
    if (isUpdating) return;
    
    selectedId = document.getElementById("componentSelect").value;
    const entity = document.querySelector('#' + selectedId);
    if (!entity) return;

    setupMutationObserver(entity);
    startPositionTicker();
    updateLastKnownValues(entity);

    const pos = getEntityPosition(entity);
    const rot = getEntityRotation(entity);

    document.getElementById('posX').value = pos.x.toFixed(2);
    document.getElementById('posY').value = pos.y.toFixed(2);
    document.getElementById('posZ').value = pos.z.toFixed(2);

    const widthAttr = entity.getAttribute('width');
    const heightAttr = entity.getAttribute('height');
    document.getElementById('width').value = widthAttr !== null ? widthAttr : '';
    document.getElementById('height').value = heightAttr !== null ? heightAttr : '';

    document.getElementById('rotY').value = rot.y.toFixed(0);
}

function getEntityPosition(entity) {
    // Pirma bandyti gauti iš object3D (realus pozicija)
    if (entity.object3D) {
        return {
            x: entity.object3D.position.x,
            y: entity.object3D.position.y,
            z: entity.object3D.position.z
        };
    }
    
    // Jei nepavyko, naudoti atributą
    return entity.getAttribute('position') || {x: 0, y: 0, z: 0};
}

function getEntityRotation(entity) {
    // Pirma bandyti gauti iš object3D (realus rotacija)
    if (entity.object3D) {
        return {
            x: THREE.MathUtils.radToDeg(entity.object3D.rotation.x),
            y: THREE.MathUtils.radToDeg(entity.object3D.rotation.y),
            z: THREE.MathUtils.radToDeg(entity.object3D.rotation.z)
        };
    }
    
    // Jei nepavyko, naudoti atributą
    return entity.getAttribute('rotation') || {x: 0, y: 0, z: 0};
}

function updateLastKnownValues(entity) {
    if (!entity) return;
    
    lastKnownPosition = getEntityPosition(entity);
    lastKnownRotation = getEntityRotation(entity);
}

function hasPositionChanged(entity) {
    if (!lastKnownPosition || !entity) return false;
    
    const currentPos = getEntityPosition(entity);
    const threshold = 0.01; // Minimalus skirtumas
    
    return Math.abs(currentPos.x - lastKnownPosition.x) > threshold ||
           Math.abs(currentPos.y - lastKnownPosition.y) > threshold ||
           Math.abs(currentPos.z - lastKnownPosition.z) > threshold;
}

function hasRotationChanged(entity) {
    if (!lastKnownRotation || !entity) return false;
    
    const currentRot = getEntityRotation(entity);
    const threshold = 1; // Minimalus skirtumas laipsniais
    
    return Math.abs(currentRot.x - lastKnownRotation.x) > threshold ||
           Math.abs(currentRot.y - lastKnownRotation.y) > threshold ||
           Math.abs(currentRot.z - lastKnownRotation.z) > threshold;
}

function startPositionTicker() {
    if (isTickerActive) return;
    
    isTickerActive = true;
    
    function tick() {
        if (!selectedId || !isTickerActive) {
            isTickerActive = false;
            return;
        }
        
        const entity = document.querySelector('#' + selectedId);
        if (entity) {
            if (hasPositionChanged(entity) || hasRotationChanged(entity)) {
                updateEditorFromEntity();
                updateLastKnownValues(entity);
            }
        }
        
        requestAnimationFrame(tick);
    }
    
    requestAnimationFrame(tick);
}

function stopPositionTicker() {
    isTickerActive = false;
}

function applyChanges() {
    if (!selectedId) return;
    
    const entity = document.querySelector('#' + selectedId);
    if (!entity) return;

    isUpdating = true;

    const newPos = {
        x: parseFloat(document.getElementById('posX').value),
        y: parseFloat(document.getElementById('posY').value),
        z: parseFloat(document.getElementById('posZ').value)
    };

    const newRotY = parseFloat(document.getElementById('rotY').value);

    // Nustatyti poziciją ir per atributą, ir per object3D
    entity.setAttribute('position', newPos);
    if (entity.object3D) {
        entity.object3D.position.set(newPos.x, newPos.y, newPos.z);
    }

    // Nustatyti rotaciją
    const currentRot = getEntityRotation(entity);
    const newRot = {
        x: currentRot.x,
        y: newRotY,
        z: currentRot.z
    };
    entity.setAttribute('rotation', newRot);
    if (entity.object3D) {
        entity.object3D.rotation.y = THREE.MathUtils.degToRad(newRotY);
    }

    // Width ir height
    const widthValue = document.getElementById('width').value;
    const heightValue = document.getElementById('height').value;
    
    if (widthValue !== '') {
        entity.setAttribute('width', parseFloat(widthValue));
    }
    if (heightValue !== '') {
        entity.setAttribute('height', parseFloat(heightValue));
    }

    updateLastKnownValues(entity);

    setTimeout(() => {
        isUpdating = false;
    }, 100);
}

function setupMutationObserver(entity) {
    if (mutationObserver) {
        mutationObserver.disconnect();
    }

    mutationObserver = new MutationObserver((mutations) => {
        if (isUpdating) return;

        let shouldUpdate = false;
        
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes') {
                const attrName = mutation.attributeName;
                
                if (attrName === 'position' || attrName === 'rotation' || 
                    attrName === 'width' || attrName === 'height') {
                    shouldUpdate = true;
                }
            }
        });

        if (shouldUpdate) {
            updateEditorFromEntity();
            updateLastKnownValues(entity);
        }
    });

    mutationObserver.observe(entity, {
        attributes: true,
        attributeFilter: ['position', 'rotation', 'width', 'height']
    });
}

function updateEditorFromEntity() {
    if (!selectedId || isUpdating) return;
    
    const entity = document.querySelector('#' + selectedId);
    if (!entity) return;

    const pos = getEntityPosition(entity);
    const rot = getEntityRotation(entity);

    const posXInput = document.getElementById('posX');
    const posYInput = document.getElementById('posY');
    const posZInput = document.getElementById('posZ');
    const rotYInput = document.getElementById('rotY');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');

    if (posXInput) posXInput.value = pos.x.toFixed(2);
    if (posYInput) posYInput.value = pos.y.toFixed(2);
    if (posZInput) posZInput.value = pos.z.toFixed(2);
    if (rotYInput) rotYInput.value = rot.y.toFixed(0);

    const widthAttr = entity.getAttribute('width');
    const heightAttr = entity.getAttribute('height');
    if (widthInput) widthInput.value = widthAttr !== null ? parseFloat(widthAttr).toFixed(2) : '';
    if (heightInput) heightInput.value = heightAttr !== null ? parseFloat(heightAttr).toFixed(2) : '';
}

function setupInputListeners() {
    const inputs = ['posX', 'posY', 'posZ', 'rotY', 'width', 'height'];
    
    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', () => {
                if (!isUpdating) {
                    applyChanges();
                }
            });
        }
    });
}

window.addEventListener('load', () => {
    populateComponentList();
    loadComponentData();
    setupInputListeners();
});

window.addEventListener('beforeunload', () => {
    stopPositionTicker();
    if (mutationObserver) {
        mutationObserver.disconnect();
    }
});

// Meniu sistema
let currentLanguage = 'lt';
let menuData = {
    lt: {
        main_menu: {
            question: "Pasirinkite veiksmą:",
            answer1: "Žiūrėti video",
            answer2: "Redaguoti sceną",
            answer3: "Keisti kalbą",
            answer4: "Pristabdyti/Tęsti",
            answer5: "Sustabdyti video",
            answer6: "Iseiti"
        }
    },
    en: {
        main_menu: {
            question: "Choose an action:",
            answer1: "Watch video",
            answer2: "Edit scene",
            answer3: "Change language",
            answer4: "Pause/Resume",
            answer5: "Stop video",
            answer6: "Exit"
        }
    }
};

let isMenuVisible = false;
let currentOnAnswer = null;

function getTranslation(category, key) {
    return menuData[currentLanguage]?.[category]?.[key] || `Missing: ${category}.${key}`;
}

function showChoicePanel(options) {
    const { question, answer1, answer2, answer3, answer4, answer5, answer6, onAnswer } = options;
    
    // Saugoti callback funkciją
    currentOnAnswer = onAnswer;
    
    // Sukurti meniu HTML
    const menuHTML = `
        <div id="choicePanel" class="choice-panel">
            <div class="choice-content">
                <h3>${question}</h3>
                <div class="choice-buttons">
                    <button onclick="selectAnswer(1)" class="choice-btn">${answer1}</button>
                    <button onclick="selectAnswer(2)" class="choice-btn">${answer2}</button>
                    <button onclick="selectAnswer(3)" class="choice-btn">${answer3}</button>
                    <button onclick="selectAnswer(4)" class="choice-btn">${answer4}</button>
                    <button onclick="selectAnswer(5)" class="choice-btn">${answer5}</button>
                    <button onclick="selectAnswer(6)" class="choice-btn">${answer6}</button>
                </div>
                <button onclick="hideChoicePanel()" class="close-btn">×</button>
            </div>
        </div>
    `;
    
    // Pridėti meniu į puslapį
    const existingPanel = document.getElementById('choicePanel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', menuHTML);
    isMenuVisible = true;
    
    // Pristabdyti video kai meniu atidaromas
    const video = document.querySelector('#tvvideo');
    if (video && !video.paused) {
        video.pause();
    }
}

function hideChoicePanel() {
    const panel = document.getElementById('choicePanel');
    if (panel) {
        panel.remove();
    }
    isMenuVisible = false;
}

function selectAnswer(answerNumber) {
    if (currentOnAnswer) {
        currentOnAnswer(answerNumber);
    }
    hideChoicePanel();
}

// Pagrindinė meniu funkcija
function mainMenu(interruption = false) {
    if (interruption) {
        cancelScheduledEvents();
        stopActivities();
        interruptShow();
    } else {
        showChoicePanel({
            question: getTranslation("main_menu", "question"),
            answer1: getTranslation("main_menu", "answer1"),
            answer2: getTranslation("main_menu", "answer2"),
            answer3: getTranslation("main_menu", "answer3"),
            answer4: getTranslation("main_menu", "answer4"),
            answer5: getTranslation("main_menu", "answer5"),
            answer6: getTranslation("main_menu", "answer6"),
            onAnswer: handleAnswer
        });
    }
}

function handleAnswer(answerNumber) {
    switch(answerNumber) {
        case 1: // Žiūrėti video
            startVideo();
            break;
        case 2: // Redaguoti sceną
            toggleEditor();
            break;
        case 3: // Keisti kalbą
            toggleLanguage();
            break;
        case 4: // Pristabdyti/Tęsti
            toggleVideoPlayback();
            break;
        case 5: // Sustabdyti video
            stopVideo();
            break;
        case 6: // Išeiti
            exitApplication();
            break;
        default:
            console.log('Nežinomas pasirinkimas:', answerNumber);
    }
}

// Veiksmai
function startVideo() {
    const video = document.querySelector('#tvvideo');
    const plane = document.querySelector('#tvScreen');
    
    if (video && plane) {
        plane.setAttribute('material', 'opacity', 1);
        video.play();
        startSpeechSync();
        console.log('Video paleistas');
    }
}

function toggleEditor() {
    const editor = document.getElementById('editor');
    if (editor) {
        editor.style.display = editor.style.display === 'none' ? 'block' : 'none';
        console.log('Redaktorius perjungtas');
    }
}

function toggleLanguage() {
    currentLanguage = currentLanguage === 'lt' ? 'en' : 'lt';
    setLanguage(currentLanguage);
    console.log('Kalba pakeista į:', currentLanguage);
    
    // Rodyti pranešimą
    showNotification(`Language changed to: ${currentLanguage}`);
}

function toggleVideoPlayback() {
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

function exitApplication() {
    if (confirm('Ar tikrai norite išeiti?')) {
        stopVideo();
        stopSpeechSync();
        console.log('Programa uždaroma');
        // Jei reikia, galite nukreipti į kitą puslapį
        // window.location.href = 'about:blank';
    }
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