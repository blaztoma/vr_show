let womanAnimationInitialized = false;
let manAnimationInitialized = false;

// Animacijų inicializavimas
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing animations...');
  
  setTimeout(() => {
    initializeAllAnimations();
  }, 3000);
});

function initializeAllAnimations() {
  console.log('Starting animation initialization...');

  const woman = document.querySelector('#woman');
  const man = document.querySelector('#man');

  if (woman) {
    console.log('Woman entity found');
    setupWomanAnimationDirect(); // Use Three.js for woman
  } else {
    console.error('Woman entity not found');
  }

  if (man) {
    console.log('Man entity found');
    setupManAnimationDirect(); // Use Three.js for man
  } else {
    console.error('Man entity not found');
  }
}

// Moters animacijų valdymas (Three.js tiesiogiai)
function setupWomanAnimationDirect() {
  console.log('Setting up woman animation directly with Three.js...');
  
  const woman = document.querySelector('#woman');
  
  // Laukti kol modelis pilnai užsikraus
  if (woman.hasLoaded) {
    initializeWomanAnimations();
  } else {
    woman.addEventListener('model-loaded', function() {
      console.log('Woman model loaded event received');
      setTimeout(initializeWomanAnimations, 1000);
    });
  }
}

function initializeWomanAnimations() {
  const woman = document.querySelector('#woman');
  const model = woman.getObject3D('mesh');
  
  if (!model || !model.animations || model.animations.length === 0) {
    console.error('Woman: No model or animations found');
    setTimeout(initializeWomanAnimations, 2000); // Bandyti dar kartą po 2 sek
    return;
  }
  
  console.log('Woman animations found:', model.animations.map(a => a.name));
  
  // Sukurti Three.js AnimationMixer tiesiogiai
  const mixer = new THREE.AnimationMixer(model);
  
  // Pasirinkti idle animaciją (pirmą, kuri atrodo kaip pagrindinė)
  const idleClip = model.animations[0];
  console.log('Selected idle animation:', idleClip.name);
  
  // Sukurti ir paleisti idle animacijos veiksmą
  const idleAction = mixer.clipAction(idleClip);
  idleAction.setLoop(THREE.LoopRepeat);
  idleAction.play();
  
  console.log('Woman animation started successfully!');
  
  // Išsaugoti mixer ir veiksmus entity objekte
  woman.mixer = mixer;
  woman.idleAction = idleAction;
  woman.currentAction = idleAction;
  woman.animations = {};
  
  // Sukurti visus galimus veiksmus
  model.animations.forEach(clip => {
    woman.animations[clip.name] = mixer.clipAction(clip);
  });
  
  // Paleisti animacijos atnaujinimo ciklą
  if (!womanAnimationInitialized) {
    womanAnimationInitialized = true;
    startWomanAnimationLoop();
  }
}

function startWomanAnimationLoop() {
  const woman = document.querySelector('#woman');
  
  function animate() {
    if (woman && woman.mixer) {
      woman.mixer.update(0.016); // ~60fps
    }
    requestAnimationFrame(animate);
  }
  
  animate();
}

function startManAnimationLoop() {
  const man = document.querySelector('#man');

  function animate() {
    if (man && man.mixer) {
      man.mixer.update(0.016); // ~60fps
    }
    requestAnimationFrame(animate);
  }

  animate();
}

function setupManAnimationDirect() {
  console.log('Setting up man animation directly with Three.js...');

  const man = document.querySelector('#man');

  // Wait for the model to fully load
  if (man.hasLoaded) {
    initializeManAnimations();
  } else {
    man.addEventListener('model-loaded', function () {
      console.log('Man model loaded event received');
      setTimeout(initializeManAnimations, 1000);
    });
  }
}

function initializeManAnimations() {
  const man = document.querySelector('#man');
  const model = man.getObject3D('mesh');

  if (!model || !model.animations || model.animations.length === 0) {
    console.error('Man: No model or animations found');
    setTimeout(initializeManAnimations, 2000); // Retry after 2 seconds
    return;
  }

  console.log('Man animations found:', model.animations.map(a => a.name));

  // Create a Three.js AnimationMixer for the man's model
  const mixer = new THREE.AnimationMixer(model);

  // Select the "idle" animation (or the first one if idle isn't labeled)
  const idleClip = model.animations[0];
  console.log('Selected idle animation:', idleClip.name);

  // Create and play the idle animation action
  const idleAction = mixer.clipAction(idleClip);
  idleAction.setLoop(THREE.LoopRepeat);
  idleAction.play();

  console.log('Man animation started successfully!');

  // Save the mixer and actions on the entity object for future reference
  man.mixer = mixer;
  man.idleAction = idleAction;
  man.currentAction = idleAction;
  man.animations = {};

  // Create all possible actions
  model.animations.forEach(clip => {
    man.animations[clip.name] = mixer.clipAction(clip);
  });

  // Start the animation update loop
  if (!manAnimationInitialized) {
    manAnimationInitialized = true;
    startManAnimationLoop();
  }
}

function tryStartManAnimation(entity) {
  const mixer = entity.components['animation-mixer'];
  
  if (mixer && mixer.mixer && mixer.mixer._actions) {
    const animations = Object.keys(mixer.mixer._actions);
    console.log('Man available animations:', animations);
    
    if (animations.length > 0) {
      // Ieškoti idle animacijos
      let idleAnim = animations.find(name => 
        name.toLowerCase().includes('idle') ||
        name.toLowerCase().includes('rest') ||
        name.toLowerCase().includes('neutral')
      );
      
      // Jei nerasta, naudoti pirmą
      if (!idleAnim) {
        idleAnim = animations[0];
      }
      
      console.log('Man: Starting animation:', idleAnim);
      
      // Paleisti animaciją
      entity.setAttribute('animation-mixer', {
        clip: idleAnim,
        loop: 'repeat'
      });
      
      manAnimationInitialized = true;
      console.log('Man: Animation started successfully');
    } else {
      console.warn('Man: No animations found');
    }
  } else {
    console.log('Man: Mixer not ready, trying later...');
    
    // Bandyti dar kartą po 2 sekundžių
    setTimeout(() => {
      tryStartManAnimation(entity);
    }, 2000);
  }
}

// Moters animacijos keitimo funkcija
function setWomanAnimation(animationName) {
  const woman = document.querySelector('#woman');
  
  if (!woman.mixer || !woman.animations) {
    console.error('Woman animations not initialized');
    return;
  }
  
  console.log(`Changing woman animation to: ${animationName}`);
  
  let targetAction = null;
  
  // Rasti tinkamą animaciją
  if (animationName === 'idle' || animationName === 'Idle') {
    targetAction = woman.idleAction;
  } else if (animationName === 'talk' || animationName === 'Talk neutral') {
    // Ieškoti talk animacijos
    const talkClipName = Object.keys(woman.animations).find(name => 
      name.toLowerCase().includes('talk') ||
      name.toLowerCase().includes('speak') ||
      name.toLowerCase().includes('key') // Gali būti "Key|Scene"
    );
    
    if (talkClipName) {
      targetAction = woman.animations[talkClipName];
    } else {
      // Jei nerasta talk animacijos, naudoti antrą animaciją arba idle
      const animationNames = Object.keys(woman.animations);
      targetAction = woman.animations[animationNames[1]] || woman.idleAction;
    }
  } else {
    // Bandyti rasti animaciją pagal tikslų pavadinimą
    const clipName = Object.keys(woman.animations).find(name => 
      name.includes(animationName)
    );
    
    if (clipName) {
      targetAction = woman.animations[clipName];
    } else {
      targetAction = woman.idleAction;
    }
  }
  
  if (targetAction && targetAction !== woman.currentAction) {
    // Sustabdyti dabartinę animaciją
    if (woman.currentAction) {
      woman.currentAction.fadeOut(0.3);
    }
    
    // Paleisti naują animaciją
    targetAction.reset();
    targetAction.setLoop(THREE.LoopRepeat);
    targetAction.fadeIn(0.3);
    targetAction.play();
    
    woman.currentAction = targetAction;
    
    console.log(`Woman animation changed to: ${targetAction.getClip().name}`);
  }
}

// Vyro animacijos keitimo funkcija (A-Frame)
function setManAnimation(animationName) {
  const man = document.querySelector('#man');

  if (!man.mixer || !man.animations) {
    console.error('Man animations not initialized');
    return;
  }

  console.log(`Changing man animation to: ${animationName}`);

  let targetAction = null;

  // Rasti tinkamą animaciją
  if (animationName === 'idle' || animationName === 'Idle') {
    targetAction = man.idleAction;
  } else if (animationName === 'talk' || animationName === 'Talk neutral') {
    // Ieškoti talk animacijos
    const talkClipName = Object.keys(man.animations).find(name =>
        name.toLowerCase().includes('talk') ||
        name.toLowerCase().includes('speak') ||
        name.toLowerCase().includes('key') // Gali būti "Key|Scene"
    );

    if (talkClipName) {
      targetAction = man.animations[talkClipName];
    } else {
      // Jei nerasta talk animacijos, naudoti antrą animaciją arba idle
      const animationNames = Object.keys(man.animations);
      targetAction = man.animations[animationNames[1]] || man.idleAction;
    }
  } else {
    // Bandyti rasti animaciją pagal tikslų pavadinimą
    const clipName = Object.keys(man.animations).find(name =>
        name.includes(animationName)
    );

    if (clipName) {
      targetAction = man.animations[clipName];
    } else {
      targetAction = man.idleAction;
    }
  }

  if (targetAction && targetAction !== man.currentAction) {
    // Sustabdyti dabartinę animaciją
    if (man.currentAction) {
      man.currentAction.fadeOut(0.3);
    }

    // Paleisti naują animaciją
    targetAction.reset();
    targetAction.setLoop(THREE.LoopRepeat);
    targetAction.fadeIn(0.3);
    targetAction.play();

    man.currentAction = targetAction;

    console.log(`Man animation changed to: ${targetAction.getClip().name}`);
  }
}

// Universali animacijos valdymo funkcija
function setCharacterAnimation(character, animationName) {
  if (character === 'Lina' || character === 'woman') {
    setWomanAnimation(animationName);
  } else if (character === 'Tomas' || character === 'man') {
    setManAnimation(animationName);
  } else {
    console.error('Unknown character:', character);
  }
}

// Debug funkcijos
function debugWomanAnimations() {
  console.log('=== DEBUGGING WOMAN ANIMATIONS ===');
  
  const woman = document.querySelector('#woman');
  console.log('Woman entity:', woman);
  
  if (woman) {
    console.log('Woman mixer:', woman.mixer);
    console.log('Woman animations:', woman.animations);
    console.log('Woman current action:', woman.currentAction);
    
    const model = woman.getObject3D('mesh');
    if (model && model.animations) {
      console.log('Available animation clips:', model.animations.map(a => a.name));
    }
  }
}

function debugManAnimations() {
  console.log('=== DEBUGGING MAN ANIMATIONS ===');
  
  const man = document.querySelector('#man');
  console.log('Man entity:', man);
  
  if (man) {
    const mixer = man.components['animation-mixer'];
    console.log('Man mixer component:', mixer);
    
    if (mixer && mixer.mixer && mixer.mixer._actions) {
      console.log('Man available animations:', Object.keys(mixer.mixer._actions));
    }
  }
}

// Test funkcijos
function testWomanAnimations() {
  console.log('Testing woman animations...');
  
  setTimeout(() => {
    console.log('Switching to talk animation...');
    setWomanAnimation('talk');
  }, 2000);
  
  setTimeout(() => {
    console.log('Switching back to idle animation...');
    setWomanAnimation('idle');
  }, 5000);
}

function testManAnimations() {
  console.log('Testing woman animations...');

  setTimeout(() => {
    console.log('Switching to talk animation...');
    setManAnimation('talk');
  }, 2000);

  setTimeout(() => {
    console.log('Switching back to idle animation...');
    setManAnimation('idle');
  }, 5000);
}

// Eksportuoti funkcijas globaliai
window.setWomanAnimation = setWomanAnimation;
window.setManAnimation = setManAnimation;
window.setCharacterAnimation = setCharacterAnimation;
window.debugWomanAnimations = debugWomanAnimations;
window.debugManAnimations = debugManAnimations;
window.testWomanAnimations = testWomanAnimations;
