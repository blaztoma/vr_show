let scormAPI = null;
let scormVersion = null;
let isScormAvailable = false;
let useVideoProgressForCompletion = false;

function checkConfigData() {
    // console.log('ConfigData status:', {
    //     configData: configData,
    //     topics: configData?.topics,
    //     topicsLength: configData?.topics?.length,
    //     menus: configData?.menus
    // });

    if (!configData) {
        console.log('configData nėra užkrautas');
        return false;
    }

    if (!configData.topics) {
        console.log('configData.topics nėra užkrautas');
        return false;
    }

    return true;
}


async function loadSpeeches() {
    try {
        const response = await fetch('data/speeches.json');
        speechData = await response.json();
        return true;
    } catch (error) {
        console.error('Klaida kraunant pokalbio duomenis:', error);
        return false;
    }
}


async function loadDialogues() {
    try {
        const [response_woman_lt, response_woman_en, response_man_lt, response_man_en] = await Promise.all([
            fetch('data/woman_lt.json'),
            fetch('data/woman_en.json'),
            fetch('data/man_lt.json'),
            fetch('data/man_en.json')
        ]);

        woman_lt = await response_woman_lt.json();
        woman_en = await response_woman_en.json();
        man_lt = await response_man_lt.json();
        man_en = await response_man_en.json();

        return true;
    } catch (error) {
        console.error('Klaida kraunant pokalbio duomenis:', error);
        return false;
    }
}

async function loadConfig() {
    try {
        const response = await fetch('data/config.json');
        configData = await response.json();
        return true;
    } catch (error) {
        console.error('Klaida kraunant konfigūracijos duomenis:', error);
        return false;
    }
}

async function loadQuizData() {
    try {
        const response = await fetch('data/quiz_data.json');
        quizData = await response.json();
        return true;
    } catch (error) {
        console.error('Klaida kraunant kvizų duomenis:', error);
        return false;
    }
}


async function loadAllData() {
    try {

        const results = await Promise.allSettled([
            loadConfig(),
            loadSpeeches(),
            loadQuizData(),
            loadDialogues()
        ]);

        const configLoaded = results[0].status === 'fulfilled' && results[0].value;
        const speechesLoaded = results[1].status === 'fulfilled' && results[1].value;
        const quizLoaded = results[2].status === 'fulfilled' && results[2].value;
        const dialoguesLoaded = results[3].status === 'fulfilled' && results[3].value;

        // console.log('📊 Data loading results:', {
        //     config: configLoaded,
        //     speeches: speechesLoaded,
        //     quizzes: quizLoaded,
        //     dialogues: dialoguesLoaded
        // });

        const criticalDataLoaded = configLoaded && speechesLoaded;

        if (criticalDataLoaded) {
            return true;
        } else {
            console.warn('⚠️ Some critical data failed to load');
            return false;
        }

    } catch (error) {
        console.error('Fatal error loading data:', error);
        return false;
    }
}


function getMasteryScore() {
    if (!isScormAvailable || !scormAPI) {
        console.log('SCORM nepasiekiamas, naudojama numatytoji mastery score: 60%');
        return 60;
    }

    try {
        if (scormVersion === 'SCORM 1.2') {
            const masteryScore = scormAPI.LMSGetValue('cmi.student_data.mastery_score');
            if (masteryScore && masteryScore !== '' && masteryScore !== 'false') {
                const score = parseFloat(masteryScore);
                console.log(`Mastery score perskaitytas iš SCORM 1.2: ${score}%`);
                return score;
            }
        } else if (scormVersion === 'SCORM 2004') {
            const scaledPassingScore = scormAPI.GetValue('cmi.scaled_passing_score');
            if (scaledPassingScore && scaledPassingScore !== '' && scaledPassingScore !== 'false') {
                const score = parseFloat(scaledPassingScore) * 100;
                console.log(`Scaled passing score perskaitytas iš SCORM 2004: ${score}%`);
                return score;
            }
        }
    } catch (error) {
        console.error('Klaida skaitant mastery score:', error);
    }

    return 60; // Numatytoji reikšmė
}

function findSCORMAPI() {
    console.log('Ieškomas SCORM API...');
    
    // Tikrinti tiesiogiai window objekte
    if (typeof window.API_1484_11 !== 'undefined' && window.API_1484_11) {
        console.log('SCORM 2004 API rastas window objekte');
        return window.API_1484_11;
    }
    
    if (typeof window.API !== 'undefined' && window.API) {
        console.log('SCORM 1.2 API rastas window objekte');
        return window.API;
    }
    
    // Ieškoti parent frame'uose (Moodle dažnai naudoja iframe)
    let currentWindow = window;
    let attempts = 0;
    const maxAttempts = 10; // Apsisaugoti nuo begalinio ciklo
    
    while (currentWindow.parent && currentWindow.parent !== currentWindow && attempts < maxAttempts) {
        attempts++;
        currentWindow = currentWindow.parent;
        
        console.log(`Tikrinamas parent frame ${attempts}:`, currentWindow.location.href);
        
        // Tikrinti SCORM 2004
        if (typeof currentWindow.API_1484_11 !== 'undefined' && currentWindow.API_1484_11) {
            console.log(`SCORM 2004 API rastas parent frame ${attempts}`);
            return currentWindow.API_1484_11;
        }
        
        // Tikrinti SCORM 1.2
        if (typeof currentWindow.API !== 'undefined' && currentWindow.API) {
            console.log(`SCORM 1.2 API rastas parent frame ${attempts}`);
            return currentWindow.API;
        }
    }
    
    console.log('SCORM API nerastas nė viename frame');
    return null;
}

function initializeSCORM() {
    console.log('Inicializuojamas SCORM...');

    try {
        // Nustatomas sesijos pradžios laikas
        window.sessionStartTime = new Date();

        const api = findSCORMAPI();
        
        if (!api) {
            console.warn('SCORM API nerastas');
            isScormAvailable = false;
            scormAPI = null;
            scormVersion = null;
            return false;
        }

        // Nustatyti, kuri SCORM versija
        if (typeof api.Initialize !== 'undefined') {
            // SCORM 2004
            console.log('Bandomas SCORM 2004 Initialize...');
            const initResult = api.Initialize('');
            console.log('SCORM 2004 Initialize rezultatas:', initResult);
            
            if (initResult === 'true' || initResult === true) {
                scormAPI = api;
                scormVersion = 'SCORM 2004';
                isScormAvailable = true;
                console.log('SCORM 2004 sėkmingai inicializuotas');

                // Nustatomas pradinis statusas
                try {
                    scormAPI.SetValue('cmi.completion_status', 'incomplete');
                    scormAPI.SetValue('cmi.success_status', 'unknown');
                    
                    const commitResult = scormAPI.Commit('');
                    console.log('SCORM 2004 commit rezultatas:', commitResult);
                } catch (statusError) {
                    console.warn('SCORM 2004 status nustatymo klaida:', statusError);
                }

                return true;
            } else {
                // Parodyt klaidą
                const errorCode = api.GetLastError();
                const errorString = api.GetErrorString(errorCode);
                console.error('SCORM 2004 inicializacijos klaida:', errorCode, errorString);
            }
        } else if (typeof api.LMSInitialize !== 'undefined') {
            // SCORM 1.2
            console.log('Bandomas SCORM 1.2 LMSInitialize...');
            const initResult = api.LMSInitialize('');
            console.log('SCORM 1.2 Initialize rezultatas:', initResult);
            
            if (initResult === 'true' || initResult === true) {
                scormAPI = api;
                scormVersion = 'SCORM 1.2';
                isScormAvailable = true;
                console.log('SCORM 1.2 sėkmingai inicializuotas');

                // Nustatomas pradinis statusas
                try {
                    scormAPI.LMSSetValue('cmi.completion_status', 'incomplete');
                    scormAPI.LMSSetValue('cmi.success_status', 'unknown');
                    
                    const commitResult = scormAPI.LMSCommit('');
                    console.log('SCORM 1.2 commit rezultatas:', commitResult);
                } catch (statusError) {
                    console.warn('SCORM 1.2 status nustatymo klaida:', statusError);
                }

                return true;
            } else {
                // Parodyt klaidą
                const errorCode = api.LMSGetLastError();
                const errorString = api.LMSGetErrorString(errorCode);
                console.error('SCORM 1.2 inicializacijos klaida:', errorCode, errorString);
            }
        }

        console.warn('SCORM API rastas bet nepavyko inicializuoti');
        isScormAvailable = false;
        scormAPI = null;
        scormVersion = null;
        return false;

    } catch (error) {
        console.error('SCORM inicializacijos klaida:', error);
        isScormAvailable = false;
        scormAPI = null;
        scormVersion = null;
        return false;
    }
}

// Asinchroninė SCORM inicializacija su retry logika
function initializeSCORMWithRetry() {
    let attempts = 0;
    const maxAttempts = 20; // 20 bandymų = 10 sekundžių
    const retryInterval = 500; // 500ms tarp bandymų
    
    function tryInitialize() {
        attempts++;
        console.log(`SCORM inicializacijos bandymas ${attempts}/${maxAttempts}`);
        
        if (initializeSCORM()) {
            console.log('✅ SCORM sėkmingai inicializuotas');
            return true;
        }
        
        if (attempts < maxAttempts) {
            console.log(`⏳ Laukiama ${retryInterval}ms ir bandoma vėl...`);
            setTimeout(tryInitialize, retryInterval);
        } else {
            console.warn('❌ SCORM inicializacija nepavyko po visų bandymų');
            console.log('Tęsiama be SCORM funkcionalumo');
        }
    }
    
    tryInitialize();
}


function formatSCORMTime(date) {
    // SCORM laiko formatas: PT[n]H[n]M[n]S
    const now = new Date();
    const sessionStart = window.sessionStartTime || now;
    const duration = Math.floor((now - sessionStart) / 1000); // sekundės

    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    return `PT${hours}H${minutes}M${seconds}S`;
}


function terminateSCORM() {
    if (!isScormAvailable || !scormAPI) {
        return;
    }

    try {
        if (scormVersion === 'SCORM 1.2') {
            const result = scormAPI.LMSFinish('');
            console.log('SCORM 1.2 terminated:', result);
        } else if (scormVersion === 'SCORM 2004') {
            const result = scormAPI.Terminate('');
            console.log('SCORM 2004 terminated:', result);
        }
    } catch (error) {
        console.error('SCORM termination error:', error);
    }
    
    // Reset global variables
    isScormAvailable = false;
    scormAPI = null;
    scormVersion = null;
}


function updateSCORMProgress(progressPercentage) {
    if (!isScormAvailable || !scormAPI) {
        console.log(`Progress: ${progressPercentage}% (SCORM not available)`);
        const video = document.querySelector('#tvvideo');
        const currentTime = video ? video.currentTime : 0;
        localStorage.setItem('videoProgress', JSON.stringify({
            percentage: progressPercentage,
            currentTime: currentTime,
            timestamp: new Date().toISOString()
        }));

        return;
    }

    try {
        const video = document.querySelector('#tvvideo');
        const currentTime = video ? video.currentTime : 0;

        if (scormVersion === 'SCORM 1.2') {
            if (useVideoProgressForCompletion) {
                scormAPI.LMSSetValue('cmi.completion_status',
                    progressPercentage >= 100 ? 'completed' : 'incomplete');
            }
            const suspendData = JSON.stringify({
                videoTime: currentTime,
                progress: progressPercentage,
                language: currentLanguage || 'en',
                lastUpdate: new Date().toISOString()
            });
            scormAPI.LMSSetValue('cmi.suspend_data', suspendData);
            scormAPI.LMSCommit('');
            console.log(`SCORM 1.2 progress updated: ${progressPercentage}%`);
        } else if (scormVersion === 'SCORM 2004') {
            if (useVideoProgressForCompletion) {
                scormAPI.SetValue('cmi.completion_status',
                    progressPercentage >= 100 ? 'completed' : 'incomplete');
            }
            scormAPI.SetValue('cmi.progress_measure', (progressPercentage / 100).toString());
            scormAPI.SetValue('cmi.location', currentTime.toString());
            const suspendData = JSON.stringify({
                videoTime: currentTime,
                progress: progressPercentage,
                language: currentLanguage || 'en',
                lastUpdate: new Date().toISOString()
            });
            scormAPI.SetValue('cmi.suspend_data', suspendData);
            scormAPI.Commit('');

            console.log(`SCORM 2004 progress updated: ${progressPercentage}%`);
        }
    } catch (error) {
        console.error('SCORM progress update error:', error);
        localStorage.setItem('videoProgress', progressPercentage.toString());
    }
}


function trackVideoProgress() {
    const video = document.querySelector('#tvvideo');
    if (!video || !video.duration) {
        return;
    }

    const progress = Math.round((video.currentTime / video.duration) * 100);
    const currentTime = video.currentTime;

    // Atnaujinti kas 10% progreso arba kas 30 sekundžių
    const timeBasedUpdate = Math.floor(currentTime / 30) !== Math.floor((window.lastVideoTime || 0) / 30);
    const progressBasedUpdate = progress % 10 === 0 && progress !== window.lastVideoProgress;

    if (progressBasedUpdate || timeBasedUpdate) {
        window.lastVideoProgress = progress;
        window.lastVideoTime = currentTime;
        updateSCORMProgress(progress, currentTime);
    }
}


function restoreVideoPosition() {
    const savedPosition = getSavedVideoPosition();

    if (!savedPosition || savedPosition.videoTime <= 5) {
        // Jei nėra išsaugotos pozicijos arba ji per maža (5 sek), pradedame nuo pradžių
        console.log('Pradedame video nuo pradžių');
        return false;
    }

    const video = document.querySelector('#tvvideo');
    if (!video) {
        console.error('Video elementas nerastas');
        return false;
    }

    // Patikriname ar video kalbos sutampa
    if (savedPosition.language && currentLanguage && savedPosition.language !== currentLanguage) {
        console.log(`Kalba pasikeitė nuo ${savedPosition.language} į ${currentLanguage}, pradedame nuo pradžių`);
        return false;
    }

    console.log(`Atkuriame video poziciją: ${savedPosition.videoTime}s (${savedPosition.progress}%)`);

    // Rodome vartotojui pranešimą
    showNotification(`Tęsiame nuo ${Math.floor(savedPosition.videoTime / 60)}:${Math.floor(savedPosition.videoTime % 60).toString().padStart(2, '0')}`, 4000);

    video.currentTime = savedPosition.videoTime;

    // Atnaujinamas interruptions indeksas pagal video poziciją
    if (typeof updateInterruptionIndex === 'function') {
        updateInterruptionIndex(savedPosition.videoTime);
    }

    return true;
}


function getSavedVideoPosition() {
    if (!isScormAvailable || !scormAPI) {
        console.log('SCORM nepasiekiamas, tikriname lokalų saugojimą...');

        // Bandome gauti iš localStorage
        const localData = localStorage.getItem('videoProgress');
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                console.log('Rasta lokali video pozicija:', parsed);
                return {
                    videoTime: parsed.currentTime || 0,
                    progress: parsed.percentage || 0,
                    language: parsed.language || 'en',
                    source: 'localStorage'
                };
            } catch (error) {
                console.error('Klaida skaitant lokaliuosius duomenis:', error);
            }
        }
        return null;
    }

    try {
        let videoTime = 0;
        let suspendData = null;

        if (scormVersion === 'SCORM 1.2') {
            // SCORM 1.2 - skaitome iš suspend_data
            const suspendDataRaw = scormAPI.LMSGetValue('cmi.suspend_data');
            if (suspendDataRaw && suspendDataRaw !== '' && suspendDataRaw !== 'false') {
                try {
                    suspendData = JSON.parse(suspendDataRaw);
                    videoTime = suspendData.videoTime || 0;
                } catch (error) {
                    console.warn('Neteisingas suspend_data formatas, bandome kaip skaičių:', suspendDataRaw);
                    videoTime = parseFloat(suspendDataRaw) || 0;
                }
            }
        } else if (scormVersion === 'SCORM 2004') {
            // SCORM 2004 - pirmiausia iš cmi.location
            const location = scormAPI.GetValue('cmi.location');
            if (location && location !== '' && location !== 'false') {
                videoTime = parseFloat(location) || 0;
            }

            // Papildoma informacija iš suspend_data
            const suspendDataRaw = scormAPI.GetValue('cmi.suspend_data');
            if (suspendDataRaw && suspendDataRaw !== '' && suspendDataRaw !== 'false') {
                try {
                    suspendData = JSON.parse(suspendDataRaw);
                    // Jei location tuščias, naudojame videoTime iš suspend_data
                    if (!videoTime && suspendData.videoTime) {
                        videoTime = suspendData.videoTime;
                    }
                } catch (error) {
                    console.warn('Neteisingas suspend_data formatas:', error);
                }
            }
        }

        if (videoTime > 0 || suspendData) {
            const result = {
                videoTime: videoTime,
                progress: suspendData?.progress || 0,
                language: suspendData?.language || 'en',
                lastUpdate: suspendData?.lastUpdate,
                source: scormVersion
            };
            console.log('Rasta išsaugota video pozicija iš SCORM:', result);
            return result;
        }

    } catch (error) {
        console.error('Klaida skaitant video poziciją iš SCORM:', error);
    }

    return null;
}


// Pridėti visas funkcijas į window objektą
window.getMasteryScore = getMasteryScore;
window.updateSCORMProgress = updateSCORMProgress;
window.trackVideoProgress = trackVideoProgress;
window.terminateSCORM = terminateSCORM;
window.formatSCORMTime = formatSCORMTime;

// Debug funkcijos (galima pašalinti production versijoje)
window.getSCORMStatus = function() {
    return {
        isAvailable: isScormAvailable,
        version: scormVersion,
        api: scormAPI !== null
    };
};

window.updateSCORMProgress = updateSCORMProgress;
window.getSavedVideoPosition = getSavedVideoPosition;
window.restoreVideoPosition = restoreVideoPosition;
window.initializeSCORMWithRetry = initializeSCORMWithRetry;
