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
