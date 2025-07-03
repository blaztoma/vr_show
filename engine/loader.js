let globalLoadingManager = null;

class LoadingManager {
    constructor() {
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.dataLoaded = false;
        this.assetsLoaded = false;
        this.loadingCompleted = false;
        this.progressBar = document.getElementById('progressBar');
        this.loadingText = document.getElementById('loadingText');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.scene = document.getElementById('mainScene');

        console.log('🏗️ LoadingManager constructed');

        this.setupAssetLoading();
        this.startDataLoading();
    }

    setupAssetLoading() {
        const scene = document.querySelector('a-scene');

        scene.addEventListener('loaded', () => {
            console.log('📦 A-Frame scene loaded event');
            this.assetsLoaded = true;
            this.checkComplete();
        });

        const assets = document.querySelectorAll('a-asset-item, video');
        this.totalAssets = assets.length;
        console.log(`🎯 Total assets to load: ${this.totalAssets}`);

        assets.forEach((asset, index) => {
            if (asset.tagName === 'VIDEO') {
                asset.addEventListener('loadeddata', () => {
                    this.assetLoaded(`Video ${index + 1}`);
                });
                asset.addEventListener('error', () => {
                    console.warn(`Video ${index + 1} failed to load`);
                    this.assetLoaded(`Video ${index + 1} (error)`);
                });
            } else {
                asset.addEventListener('loaded', () => {
                    this.assetLoaded(`Model ${index + 1}`);
                });
                asset.addEventListener('error', () => {
                    console.warn(`Model ${index + 1} failed to load`);
                    this.assetLoaded(`Model ${index + 1} (error)`);
                });
            }
        });
    }

    assetLoaded(assetName) {
        this.loadedAssets++;
        console.log(`📦 Asset loaded: ${assetName} (${this.loadedAssets}/${this.totalAssets})`);

        const assetProgress = (this.loadedAssets / this.totalAssets) * 50;
        const dataProgress = this.dataLoaded ? 50 : 0;
        const totalProgress = assetProgress + dataProgress;

        this.updateProgress(totalProgress, `Loading 3D models... ${this.loadedAssets}/${this.totalAssets}`);

        if (this.loadedAssets >= this.totalAssets) {
            // console.log('All individual assets loaded');
        }
        this.checkComplete();
    }

    async startDataLoading() {
        try {
            this.updateProgress(10, 'Loading data...');
            const loaded = await loadAllData();

            if (loaded) {
                console.log('Data loading completed successfully');
                this.dataLoaded = true;
                this.updateProgress(50, 'Data loaded!');
                this.checkComplete();
            } else {
                console.warn('Data loading failed');
                this.updateProgress(25, 'Error loading data...');
                setTimeout(() => this.checkComplete(), 2000);
            }
        } catch (error) {
            console.error('Data loading error:', error);
            this.updateProgress(25, 'Error loading data...');
            setTimeout(() => this.checkComplete(), 2000);
        }
    }

    updateProgress(percentage, text) {
        this.progressBar.style.width = percentage + '%';
        this.loadingText.textContent = text;
    }

    checkComplete() {
        console.log(`🔍 checkComplete: data=${this.dataLoaded}, assets=${this.assetsLoaded}, completed=${this.loadingCompleted}`);

        if (this.loadingCompleted) {
            return;
        }

        if (this.dataLoaded && this.assetsLoaded) {
            this.loadingCompleted = true;
            this.completeLoading();
        } else {
            console.log(`⏳ Still waiting: data=${this.dataLoaded}, assets=${this.assetsLoaded}`);
        }
    }

    completeLoading() {
        this.updateProgress(100, 'Ready! Start...');
        setTimeout(() => {
            this.loadingScreen.classList.add('hidden');
            this.scene.classList.add('loaded');
            setTimeout(() => {
                this.initializeApp();
            }, 1000);

        }, 1000);
    }

    initializeApp() {
        try {
            if (typeof initializeAllMenus === 'function') {
                initializeAllMenus();
            }
            if (typeof showInitialLanguageMenu === 'function') {
                showInitialLanguageMenu();
            }

            if (typeof initializeVideoInterruptions === 'function') {
                initializeVideoInterruptions();
            }
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (globalLoadingManager) {
        console.warn('🚨 LoadingManager already exists! Ignoring duplicate creation.');
        return;
    }
    globalLoadingManager = new LoadingManager();
});