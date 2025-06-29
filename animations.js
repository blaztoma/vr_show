// animations.js - Su showman veikėju (Rimas)

class CharacterAnimationManager {
  constructor() {
    this.characters = {
      woman: {
        entity: null,
        mixer: null,
        idleAction: null,
        talkAction: null,
        animations: {},
        initialized: false,
        isTalking: false
      },
      man: {
        entity: null,
        mixer: null,
        idleAction: null,
        talkAction: null,
        animations: {},
        initialized: false,
        isTalking: false
      },
      showman: {
        entity: null,
        mixer: null,
        idleAction: null,
        talkAction: null,
        animations: {},
        initialized: false,
        isTalking: false
      }
    };
    
    this.animationMappings = {
      idle: ['idle', 'rest', 'neutral'],
      talk: ['talk', 'speak', 'key']
    };
    
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('Initializing character animations...');
      setTimeout(() => this.initializeAllCharacters(), 3000);
    });
  }

  initializeAllCharacters() {
    Object.keys(this.characters).forEach(characterName => {
      const entity = document.querySelector(`#${characterName}`);
      if (entity) {
        console.log(`Found ${characterName} entity`);
        this.characters[characterName].entity = entity;
        this.initializeCharacter(characterName);
      } else {
        console.error(`${characterName} entity not found`);
      }
    });
  }

  async initializeCharacter(characterName) {
    const character = this.characters[characterName];
    const entity = character.entity;

    console.log(`Starting initialization for ${characterName}...`);

    // Laukti kol modelis užsikraus
    if (!entity.hasLoaded) {
      console.log(`Waiting for ${characterName} model to load...`);
      await new Promise(resolve => {
        entity.addEventListener('model-loaded', () => {
          console.log(`${characterName} model loaded event received`);
          resolve();
        });
        
        // Timeout jei per ilgai laukiame
        setTimeout(() => {
          console.log(`${characterName} model load timeout, trying anyway...`);
          resolve();
        }, 10000);
      });
    }

    // Papildomas timeout kad modelis pilnai sukonfigūruotų
    setTimeout(() => {
      this.initializeThreeJSCharacter(characterName);
    }, 1000);
  }

  initializeThreeJSCharacter(characterName) {
    const character = this.characters[characterName];
    const model = character.entity.getObject3D('mesh');

    console.log(`Initializing Three.js character: ${characterName}`);

    if (!model?.animations?.length) {
      console.error(`${characterName}: No animations found, retrying...`);
      setTimeout(() => this.initializeThreeJSCharacter(characterName), 2000);
      return;
    }

    console.log(`${characterName} animations:`, model.animations.map(a => a.name));

    // Sukurti mixer
    character.mixer = new THREE.AnimationMixer(model);
    
    model.animations.forEach(clip => {
      character.animations[clip.name] = character.mixer.clipAction(clip);
    });

    // Rasti ir nustatyti idle animaciją
    const idleClip = this.findAnimation(characterName, 'idle') || model.animations[0];
    character.idleAction = character.mixer.clipAction(idleClip);

    // Rasti talk animaciją
    const talkClip = this.findAnimation(characterName, 'talk') || model.animations[1] || model.animations[0];
    character.talkAction = character.mixer.clipAction(talkClip);

    // Paleisti idle animaciją
    character.idleAction.setLoop(THREE.LoopRepeat);
    character.idleAction.play();
    character.idleAction.setEffectiveWeight(1.0);

    // Paruošti talk animaciją (tik paruošti, bet nepaleisti)
    character.talkAction.setLoop(THREE.LoopRepeat);
    character.talkAction.setEffectiveWeight(1.0); // Pilnas svoris!

    character.initialized = true;
    this.startAnimationLoop(characterName);
    
    console.log(`${characterName}: Simple dual animations initialized`);
    console.log(`Idle: ${idleClip.name}, Talk: ${talkClip.name}`);
  }

  startAnimationLoop(characterName) {
    const character = this.characters[characterName];
    
    if (character.animationLoopStarted) return;
    
    character.animationLoopStarted = true;
    
    const animate = () => {
      if (character.mixer) {
        character.mixer.update(0.016);
      }
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  findAnimation(characterName, type) {
    const character = this.characters[characterName];
    const searchTerms = this.animationMappings[type] || [type];
    
    const model = character.entity.getObject3D('mesh');
    return model.animations.find(clip => 
      searchTerms.some(term => clip.name.toLowerCase().includes(term.toLowerCase()))
    );
  }

  startTalking(characterName) {
    const character = this.characters[characterName];
    
    console.log(`Attempting to start talking for ${characterName}`);
    console.log(`Initialized: ${character.initialized}, Already talking: ${character.isTalking}`);
    
    if (!character.initialized) {
      console.error(`${characterName} not initialized yet. Try again in a few seconds.`);
      
      // Bandyti dar kartą po 2 sekundžių
      setTimeout(() => {
        if (character.initialized) {
          this.startTalking(characterName);
        } else {
          console.error(`${characterName} still not initialized after retry`);
        }
      }, 2000);
      return;
    }

    if (character.isTalking) {
      console.log(`${characterName} already talking, ignoring`);
      return;
    }

    character.isTalking = true;

    // Tiesiog paleisti talk animaciją šalia idle (kaip GLTF viewer)
    character.talkAction.play();

    console.log(`${characterName}: Started talking (both animations running)`);
  }

  stopTalking(characterName) {
    const character = this.characters[characterName];
    
    console.log(`Attempting to stop talking for ${characterName}`);
    
    if (!character.initialized || !character.isTalking) {
      console.log(`${characterName}: Not initialized or not talking, ignoring stop`);
      return;
    }

    character.isTalking = false;
    character.talkAction.stop();
    
    console.log(`${characterName}: Stopped talking (only idle running)`);
  }

  // Patikrinimo funkcija
  checkStatus(characterName = null) {
    if (characterName) {
      const character = this.characters[characterName];
      console.log(`=== ${characterName.toUpperCase()} STATUS ===`);
      console.log(`Initialized: ${character.initialized}`);
      console.log(`Is talking: ${character.isTalking}`);
      console.log(`Entity:`, character.entity);
      console.log(`Mixer:`, character.mixer);
      console.log(`Idle action:`, character.idleAction);
      console.log(`Talk action:`, character.talkAction);
      
      if (character.mixer) {
        console.log('Idle weight:', character.idleAction?.getEffectiveWeight());
        console.log('Idle enabled:', character.idleAction?.enabled);
        console.log('Talk weight:', character.talkAction?.getEffectiveWeight());
        console.log('Talk enabled:', character.talkAction?.enabled);
      }
    } else {
      Object.keys(this.characters).forEach(name => this.checkStatus(name));
    }
  }

  // Senesnė API palaikymo funkcija
  setAnimation(characterName, animationType) {
    if (animationType === 'talk') {
      this.startTalking(characterName);
    } else if (animationType === 'idle') {
      this.stopTalking(characterName);
    }
  }

  test(characterName) {
    console.log(`Testing ${characterName} animations...`);
    
    setTimeout(() => {
      console.log('Starting talk...');
      this.startTalking(characterName);
    }, 2000);
    
    setTimeout(() => {
      console.log('Stopping talk...');
      this.stopTalking(characterName);
    }, 8000);
  }
}

// Sukurti globalų egzempliorių
const animationManager = new CharacterAnimationManager();

// Eksportuoti funkcijas
window.startCharacterTalking = (character) => {
  const characterName = character === 'Lina' ? 'woman' : 
                       character === 'Tomas' ? 'man' : 
                       character === 'Rimas' ? 'showman' : character;
  animationManager.startTalking(characterName);
};

window.stopCharacterTalking = (character) => {
  const characterName = character === 'Lina' ? 'woman' : 
                       character === 'Tomas' ? 'man' : 
                       character === 'Rimas' ? 'showman' : character;
  animationManager.stopTalking(characterName);
};

window.setCharacterAnimation = (character, animationType) => {
  const characterName = character === 'Lina' ? 'woman' : 
                       character === 'Tomas' ? 'man' : 
                       character === 'Rimas' ? 'showman' : character;
  animationManager.setAnimation(characterName, animationType);
};

// Debug funkcijos
window.checkAnimationStatus = (character) => animationManager.checkStatus(character);
window.testAnimations = (character) => animationManager.test(character);