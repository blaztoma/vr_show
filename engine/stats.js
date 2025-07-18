// FPS Counter sistema
class FPSCounter {
    constructor() {
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fps = 0;
        this.minFps = Infinity;
        this.maxFps = 0;
        this.fpsHistory = [];
        this.maxHistoryLength = 60; // 1 sekundė @ 60fps

        this.fpsElement = document.getElementById('fpsValue');
        this.frameTimeElement = document.getElementById('frameTime');
        this.minFpsElement = document.getElementById('minFps');
        this.maxFpsElement = document.getElementById('maxFps');
        this.avgFpsElement = document.getElementById('avgFps');
        this.renderCallsElement = document.getElementById('renderCalls');
        this.trianglesElement = document.getElementById('triangles');

        this.startTime = performance.now();
        this.totalFrames = 0;

        this.init();
    }

    init() {
        this.update();

        // Klavišų kombinacijos FPS counter valdymui
        document.addEventListener('keydown', (e) => {
            if (e.code === 'F3') {
                e.preventDefault();
                this.toggleVisibility();
            }
            if (e.code === 'F4') {
                e.preventDefault();
                this.resetStats();
            }
        });
    }

    update() {
        const now = performance.now();
        const delta = now - this.lastTime;
        this.lastTime = now;

        this.frameCount++;
        this.totalFrames++;

        // Apskaičiuoti FPS
        const currentFps = 1000 / delta;
        this.fpsHistory.push(currentFps);

        if (this.fpsHistory.length > this.maxHistoryLength) {
            this.fpsHistory.shift();
        }

        // Atnaujinti kas 10 kadrų
        if (this.frameCount % 10 === 0) {
            // Vidutinis FPS per paskutinius kadrus
            const avgRecentFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
            this.fps = Math.round(avgRecentFps);

            // Min/Max FPS
            if (this.fps < this.minFps && this.fps > 0) this.minFps = this.fps;
            if (this.fps > this.maxFps) this.maxFps = this.fps;

            // Bendras vidutinis FPS
            const totalTime = (now - this.startTime) / 1000;
            const overallAvgFps = Math.round(this.totalFrames / totalTime);

            this.updateDisplay(delta, overallAvgFps);
        }

        requestAnimationFrame(() => this.update());
    }

    updateDisplay(frameTime, overallAvgFps) {
        // FPS spalva pagal veikimą
        let fpsClass = 'fps-high';
        if (this.fps < 30) fpsClass = 'fps-low';
        else if (this.fps < 50) fpsClass = 'fps-medium';

        this.fpsElement.textContent = this.fps;
        this.fpsElement.className = `fps-value ${fpsClass}`;

        this.frameTimeElement.textContent = frameTime.toFixed(1) + 'ms';
        this.minFpsElement.textContent = this.minFps === Infinity ? '0' : this.minFps;
        this.maxFpsElement.textContent = this.maxFps;
        this.avgFpsElement.textContent = overallAvgFps;

        // Three.js statistikos (jei galimos)
        this.updateThreeJSStats();
    }

    updateThreeJSStats() {
        try {
            const scene = document.querySelector('a-scene');
            if (scene && scene.renderer) {
                const renderer = scene.renderer;
                const info = renderer.info;

                if (info) {
                    this.renderCallsElement.textContent = info.render.calls || 0;
                    this.trianglesElement.textContent = info.render.triangles || 0;
                }
            }
        } catch (e) {
            // Tyliai ignoruoti klaidas
        }
    }

    toggleVisibility() {
        const counter = document.getElementById('fpsCounter');
        counter.style.display = counter.style.display === 'none' ? 'block' : 'none';
    }

    resetStats() {
        this.minFps = Infinity;
        this.maxFps = 0;
        this.fpsHistory = [];
        this.startTime = performance.now();
        this.totalFrames = 0;
        console.log('FPS statistikos atstatytos');
    }
}

// Paleidžiame FPS counter
let fpsCounter;
document.addEventListener('DOMContentLoaded', () => {
    fpsCounter = new FPSCounter();
});


// Konsolės funkcijos FPS testams
window.getFPSStats = function() {
    if (fpsCounter) {
        return {
            current: fpsCounter.fps,
            min: fpsCounter.minFps,
            max: fpsCounter.maxFps,
            avg: Math.round(fpsCounter.totalFrames / ((performance.now() - fpsCounter.startTime) / 1000))
        };
    }
    return null;
};

window.resetFPSStats = function() {
    if (fpsCounter) {
        fpsCounter.resetStats();
    }
};

// Išplėsta diagnostikos sistema
class PerformanceDiagnostics {
    constructor() {
        this.measurements = {
            animations: 0,
            raycasting: 0,
            rendering: 0,
            javascript: 0,
            total: 0
        };
        
        this.animationFrameStart = 0;
        this.renderCalls = 0;
        this.lastRenderCallCount = 0;
        
        this.addDiagnosticUI();
        this.hookIntoSystems();
    }
    
    addDiagnosticUI() {
        const diagnosticsHTML = `
            <div id="diagnosticsPanel" style="
                position: fixed;
                top: 120px;
                right: 10px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                z-index: 10001;
                min-width: 250px;
                display: none;
            ">
                <div style="font-weight: bold; margin-bottom: 5px;">🔍 Performance Diagnostics</div>
                <div>Animation Time: <span id="animTime">0.0ms</span></div>
                <div>Raycasting Time: <span id="rayTime">0.0ms</span></div>
                <div>Rendering Time: <span id="renderTime">0.0ms</span></div>
                <div>JavaScript Time: <span id="jsTime">0.0ms</span></div>
                <div>GPU Memory: <span id="gpuMemory">N/A</span></div>
                <div>Draw Calls: <span id="drawCalls">0</span></div>
                <div>Texture Count: <span id="textureCount">0</span></div>
                <div>Active Animations: <span id="activeAnimations">0</span></div>
                <div>Active Raycasters: <span id="activeRaycasters">0</span></div>
                <div style="margin-top: 10px; font-size: 10px; color: #888;">
                    F5 - Toggle diagnostics<br>
                    F6 - Profile frame
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', diagnosticsHTML);
        
        // Klavišų kombinacijos
        document.addEventListener('keydown', (e) => {
            if (e.code === 'F10') {
                e.preventDefault();
                this.toggleDiagnostics();
            }
            if (e.code === 'F6') {
                e.preventDefault();
                this.profileSingleFrame();
            }
        });
    }
    
    hookIntoSystems() {
        // Hook į A-Frame render loop
        const originalRender = AFRAME.scenes[0]?.render;
        if (originalRender) {
            AFRAME.scenes[0].render = (...args) => {
                const start = performance.now();
                originalRender.apply(this, args);
                this.measurements.rendering = performance.now() - start;
            };
        }
        
        // Periodinė diagnostika
        setInterval(() => {
            this.updateDiagnostics();
        }, 500);
    }
    
    updateDiagnostics() {
        try {
            const scene = document.querySelector('a-scene');
            if (!scene || !scene.renderer) return;
            
            const renderer = scene.renderer;
            const info = renderer.info;
            
            // Animacijų skaičius
            const animatedEntities = document.querySelectorAll('[animation-mixer]');
            const activeAnimations = Array.from(animatedEntities).filter(el => {
                const mixer = el.components?.['animation-mixer']?.mixer;
                return mixer && mixer._actions?.length > 0;
            }).length;
            
            // Raycaster skaičius
            const raycasters = document.querySelectorAll('[raycaster]');
            const activeRaycasters = Array.from(raycasters).filter(el => {
                return el.components?.raycaster?.raycaster;
            }).length;
            
            // Tekstūrų skaičius
            const textures = renderer.info.memory?.textures || 0;
            
            // GPU atminties naudojimas (jei galimas)
            let gpuMemory = 'N/A';
            if (renderer.info.memory?.geometries !== undefined) {
                gpuMemory = `${renderer.info.memory.geometries}G`;
            }
            
            // Atnaujinti UI
            document.getElementById('animTime').textContent = this.measurements.animations.toFixed(1) + 'ms';
            document.getElementById('rayTime').textContent = this.measurements.raycasting.toFixed(1) + 'ms';
            document.getElementById('renderTime').textContent = this.measurements.rendering.toFixed(1) + 'ms';
            document.getElementById('jsTime').textContent = this.measurements.javascript.toFixed(1) + 'ms';
            document.getElementById('gpuMemory').textContent = gpuMemory;
            document.getElementById('drawCalls').textContent = info.render?.calls || 0;
            document.getElementById('textureCount').textContent = textures;
            document.getElementById('activeAnimations').textContent = activeAnimations;
            document.getElementById('activeRaycasters').textContent = activeRaycasters;
            
        } catch (e) {
            console.warn('Diagnostics update error:', e);
        }
    }
    
    profileSingleFrame() {
        console.log('🔍 Profiling single frame...');
        
        const measurements = {};
        
        // Animacijų profiliavimas
        const animStart = performance.now();
        const animatedEntities = document.querySelectorAll('[animation-mixer]');
        animatedEntities.forEach(el => {
            const mixer = el.components?.['animation-mixer']?.mixer;
            if (mixer) {
                mixer.update(0.016);
            }
        });
        measurements.animations = performance.now() - animStart;
        
        // Raycasting profiliavimas
        const rayStart = performance.now();
        const raycasters = document.querySelectorAll('[raycaster]');
        raycasters.forEach(el => {
            const raycaster = el.components?.raycaster?.raycaster;
            if (raycaster) {
                // Simulate raycasting
                raycaster.intersectObjects([]);
            }
        });
        measurements.raycasting = performance.now() - rayStart;
        
        // DOM manipuliacijų profiliavimas
        const domStart = performance.now();
        const menus = document.querySelectorAll('.vr-prebuilt-menu');
        menus.forEach(menu => {
            // Simulate DOM operations
            menu.style.display = menu.style.display;
        });
        measurements.dom = performance.now() - domStart;
        
        console.log('📊 Frame Profile Results:');
        console.log(`  Animations: ${measurements.animations.toFixed(2)}ms`);
        console.log(`  Raycasting: ${measurements.raycasting.toFixed(2)}ms`);
        console.log(`  DOM: ${measurements.dom.toFixed(2)}ms`);
        console.log(`  Total: ${(measurements.animations + measurements.raycasting + measurements.dom).toFixed(2)}ms`);
    }
    
    toggleDiagnostics() {
        const panel = document.getElementById('diagnosticsPanel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

// Paleidžiame diagnostiką
let diagnostics;
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        diagnostics = new PerformanceDiagnostics();
    }, 1000);
});

// Konsolės funkcijos
window.getPerformanceProfile = function() {
    if (diagnostics) {
        diagnostics.profileSingleFrame();
    }
};

window.analyzePerformance = function() {
    console.log('🔍 Performance Analysis:');
    
    // Animacijų analizė
    const animatedEntities = document.querySelectorAll('[animation-mixer]');
    console.log(`📈 Animation Analysis:`);
    console.log(`  Total animated entities: ${animatedEntities.length}`);
    
    animatedEntities.forEach((el, i) => {
        const mixer = el.components?.['animation-mixer']?.mixer;
        if (mixer) {
            console.log(`  Entity ${i + 1}: ${mixer._actions?.length || 0} actions`);
        }
    });
    
    // Raycaster analizė
    const raycasters = document.querySelectorAll('[raycaster]');
    console.log(`🎯 Raycaster Analysis:`);
    console.log(`  Total raycasters: ${raycasters.length}`);
    
    raycasters.forEach((el, i) => {
        const raycaster = el.components?.raycaster;
        if (raycaster) {
            console.log(`  Raycaster ${i + 1}: ${raycaster.data.objects} objects`);
        }
    });
    
    // Tekstūrų analizė
    const scene = document.querySelector('a-scene');
    if (scene?.renderer) {
        const info = scene.renderer.info;
        console.log(`🖼️ Texture Analysis:`);
        console.log(`  Textures: ${info.memory?.textures || 0}`);
        console.log(`  Render calls: ${info.render?.calls || 0}`);
    }
    
    // JavaScript ciklų analizė
    console.log(`⚡ JavaScript Analysis:`);
    console.log(`  Billboard components: ${document.querySelectorAll('[billboard-y]').length}`);
    console.log(`  VR menu buttons: ${document.querySelectorAll('[vr-menu-button]').length}`);
};

// Patobulinta diagnostikos sistema
class AdvancedDiagnostics {
    constructor() {
        this.frameTimings = [];
        this.jsHeapSize = 0;
        this.eventListeners = 0;
        this.domElements = 0;
        
        this.addAdvancedUI();
        this.startContinuousMonitoring();
    }
    
    addAdvancedUI() {
        const advancedHTML = `
            <div id="advancedDiagnostics" style="
                position: fixed;
                top: 250px;
                right: 10px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                z-index: 10002;
                min-width: 280px;
                display: none;
            ">
                <div style="font-weight: bold; margin-bottom: 5px;">🔬 Advanced Diagnostics</div>
                
                <div style="color: #ff6b6b; font-weight: bold;">Performance Bottlenecks:</div>
                <div>Frame Drops: <span id="frameDrops">0</span></div>
                <div>Long Frames (>16ms): <span id="longFrames">0</span></div>
                <div>Avg Frame Time: <span id="avgFrameTime">0.0ms</span></div>
                
                <div style="color: #4ecdc4; font-weight: bold; margin-top: 10px;">Memory Usage:</div>
                <div>JS Heap Size: <span id="jsHeapSize">0 MB</span></div>
                <div>DOM Elements: <span id="domElementCount">0</span></div>
                <div>Event Listeners: <span id="eventListenerCount">0</span></div>
                
                <div style="color: #45b7d1; font-weight: bold; margin-top: 10px;">A-Frame Systems:</div>
                <div>A-Frame Components: <span id="aframeComponents">0</span></div>
                <div>Tick Functions: <span id="tickFunctions">0</span></div>
                <div>Animation Loops: <span id="animationLoops">0</span></div>
                
                <div style="color: #96ceb4; font-weight: bold; margin-top: 10px;">Video/Media:</div>
                <div>Video Playing: <span id="videoPlaying">No</span></div>
                <div>Video Size: <span id="videoSize">N/A</span></div>
                <div>Video Decode: <span id="videoDecodeTime">0ms</span></div>
                
                <div style="margin-top: 10px; font-size: 10px; color: #888;">
                    F7 - Toggle advanced diagnostics<br>
                    F8 - Memory analysis<br>
                    F9 - Profile all systems
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', advancedHTML);
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'F7') {
                e.preventDefault();
                this.toggleAdvancedDiagnostics();
            }
            if (e.code === 'F8') {
                e.preventDefault();
                this.analyzeMemory();
            }
            if (e.code === 'F9') {
                e.preventDefault();
                this.profileAllSystems();
            }
        });
    }
    
    startContinuousMonitoring() {
        let lastFrameTime = performance.now();
        let frameDrops = 0;
        let longFrames = 0;
        
        const monitorFrame = () => {
            const now = performance.now();
            const frameTime = now - lastFrameTime;
            lastFrameTime = now;
            
            this.frameTimings.push(frameTime);
            if (this.frameTimings.length > 120) { // 2 sekundės @ 60fps
                this.frameTimings.shift();
            }
            
            // Aptikti frame drops
            if (frameTime > 20) frameDrops++;
            if (frameTime > 16.67) longFrames++;
            
            requestAnimationFrame(monitorFrame);
        };
        
        requestAnimationFrame(monitorFrame);
        
        // Atnaujinti UI kas 1 sekundę
        setInterval(() => {
            this.updateAdvancedUI(frameDrops, longFrames);
        }, 1000);
    }
    
    updateAdvancedUI(frameDrops, longFrames) {
        try {
            // Frame statistikos
            const avgFrameTime = this.frameTimings.length > 0 ? 
                this.frameTimings.reduce((a, b) => a + b, 0) / this.frameTimings.length : 0;
            
            document.getElementById('frameDrops').textContent = frameDrops;
            document.getElementById('longFrames').textContent = longFrames;
            document.getElementById('avgFrameTime').textContent = avgFrameTime.toFixed(2) + 'ms';
            
            // Atminties statistikos
            if (performance.memory) {
                const heapSize = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
                document.getElementById('jsHeapSize').textContent = heapSize + ' MB';
            }
            
            // DOM elementų skaičius
            const domCount = document.querySelectorAll('*').length;
            document.getElementById('domElementCount').textContent = domCount;
            
            // A-Frame komponentų skaičius
            const aframeComponents = document.querySelectorAll('a-entity, a-scene, a-assets, a-plane, a-box').length;
            document.getElementById('aframeComponents').textContent = aframeComponents;
            
            // Tick funkcijų skaičius
            const scene = document.querySelector('a-scene');
            const tickFunctions = scene?.systems ? Object.keys(scene.systems).length : 0;
            document.getElementById('tickFunctions').textContent = tickFunctions;
            
            // Video analizė
            const video = document.querySelector('#tvvideo');
            if (video) {
                document.getElementById('videoPlaying').textContent = video.paused ? 'No' : 'Yes';
                document.getElementById('videoSize').textContent = `${video.videoWidth}x${video.videoHeight}`;
            }
            
            // Animation loops analizė
            const animationLoops = this.countAnimationLoops();
            document.getElementById('animationLoops').textContent = animationLoops;
            
        } catch (e) {
            console.warn('Advanced diagnostics update error:', e);
        }
    }
    
    countAnimationLoops() {
        let count = 0;
        
        // Tikrinti A-Frame animation-mixer komponentus
        const mixers = document.querySelectorAll('[animation-mixer]');
        mixers.forEach(el => {
            const mixer = el.components?.['animation-mixer']?.mixer;
            if (mixer && mixer._actions) {
                count += mixer._actions.length;
            }
        });
        
        // Tikrinti custom animation loops
        if (window.animationManager) {
            Object.values(window.animationManager.characters || {}).forEach(char => {
                if (char.animationLoopStarted) count++;
            });
        }
        
        return count;
    }
    
    analyzeMemory() {
        console.log('🧠 Memory Analysis:');
        
        if (performance.memory) {
            const memory = performance.memory;
            console.log(`  Used JS Heap: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB`);
            console.log(`  Total JS Heap: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(1)} MB`);
            console.log(`  Heap Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1)} MB`);
        }
        
        // DOM elementų analizė
        const elements = document.querySelectorAll('*');
        console.log(`  Total DOM elements: ${elements.length}`);
        
        // A-Frame objektų analizė
        const scene = document.querySelector('a-scene');
        if (scene && scene.object3D) {
            console.log(`  Three.js objects: ${scene.object3D.children.length}`);
        }
        
        // Event listener analizė
        const elementsWithEvents = Array.from(elements).filter(el => {
            return el.onclick || el.onload || el.onerror || 
                   (el._listeners && Object.keys(el._listeners).length > 0);
        });
        console.log(`  Elements with events: ${elementsWithEvents.length}`);
    }
    
    profileAllSystems() {
        console.log('🔍 Profiling All Systems:');
        
        // 1. DOM manipuliacijų profiliavimas
        const domStart = performance.now();
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            el.style.display = el.style.display; // Simulate DOM read
        });
        const domTime = performance.now() - domStart;
        console.log(`  DOM Operations: ${domTime.toFixed(2)}ms`);
        
        // 2. A-Frame sistemų profiliavimas
        const aframeStart = performance.now();
        const scene = document.querySelector('a-scene');
        if (scene && scene.systems) {
            Object.values(scene.systems).forEach(system => {
                if (system.tick) {
                    system.tick(0.016, 0.016); // Simulate tick
                }
            });
        }
        const aframeTime = performance.now() - aframeStart;
        console.log(`  A-Frame Systems: ${aframeTime.toFixed(2)}ms`);
        
        // 3. Event handling profiliavimas
        const eventStart = performance.now();
        const clickableElements = document.querySelectorAll('.clickable');
        clickableElements.forEach(el => {
            // Simulate event processing
            el.getBoundingClientRect();
        });
        const eventTime = performance.now() - eventStart;
        console.log(`  Event Processing: ${eventTime.toFixed(2)}ms`);
        
        // 4. Video profiliavimas
        const videoStart = performance.now();
        const video = document.querySelector('#tvvideo');
        if (video) {
            video.currentTime = video.currentTime; // Simulate video operation
        }
        const videoTime = performance.now() - videoStart;
        console.log(`  Video Operations: ${videoTime.toFixed(2)}ms`);
        
        console.log(`  Total Profiled: ${(domTime + aframeTime + eventTime + videoTime).toFixed(2)}ms`);
    }
    
    toggleAdvancedDiagnostics() {
        const panel = document.getElementById('advancedDiagnostics');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

// Paleidžiame išplėstą diagnostiką
let advancedDiagnostics;
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        advancedDiagnostics = new AdvancedDiagnostics();
    }, 1500);
});

// Papildoma detektyvas lėtumui
window.detectBottlenecks = function() {
    console.log('🕵️ Detecting Performance Bottlenecks:');
    
    // Tikrinti ar veikia rAF ciklai
    let rafCount = 0;
    const rafTest = () => {
        rafCount++;
        if (rafCount < 60) {
            requestAnimationFrame(rafTest);
        } else {
            console.log(`  RequestAnimationFrame: ${rafCount}/60 - ${rafCount === 60 ? 'OK' : 'PROBLEM'}`);
        }
    };
    requestAnimationFrame(rafTest);
    
    // Tikrinti CSS animacijas
    const animatedElements = document.querySelectorAll('*');
    let cssAnimations = 0;
    animatedElements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.animation !== 'none' || style.transition !== 'none') {
            cssAnimations++;
        }
    });
    console.log(`  CSS Animations: ${cssAnimations}`);
    
    // Tikrinti hidden elementus
    const hiddenElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display === 'none' || style.visibility === 'hidden';
    });
    console.log(`  Hidden Elements: ${hiddenElements.length}`);
    
    // Tikrinti kompleksų CSS
    const elementsWithComplexCSS = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        return style.filter !== 'none' || 
               style.transform !== 'none' || 
               style.boxShadow !== 'none' ||
               style.borderRadius !== '0px';
    });
    console.log(`  Complex CSS Elements: ${elementsWithComplexCSS.length}`);
};