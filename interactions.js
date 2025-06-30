let woman_lt = null;
let woman_en = null;
let man_lt = null;
let man_en = null;
let speechData = null;
let configData = null;
let quizData = null;
let lastSpokenTomas = null;
let lastSpokenLina = null;
let syncInterval = null;
let scheduledEvents = [];
let currentQuestionIndex = 0;
let quizScore = 0;
let finalQuizQuestions = [];
let videoInterruptionData = null;
let currentInterruptionIndex = 0;
let isVideoInterruptionActive = false;
let lastInterruptionCheck = -1;


function initializeVideoInterruptions() {
    if (!configData || !configData.video_interruptions) {
        console.log('Video interruptions data not found');
        return;
    }

    videoInterruptionData = configData.video_interruptions[currentLanguage];
    currentInterruptionIndex = 0;
    isVideoInterruptionActive = true;
    lastInterruptionCheck = -1;
}


function setLanguage(lang) {
    currentLanguage = lang;
    console.log('Kalba pakeista į:', lang);
    isLanguageSelected = true;
    console.log('Kalba pasirinkta:', isLanguageSelected);
}


function updateVideoSource() {
    if (!configData || !configData.video_files) {
        return;
    }

    const videoFile = configData.video_files[currentLanguage] || configData.video_files.en || 'video.mp4';
    const video = document.querySelector('#tvvideo');

    if (video && video.src !== videoFile) {
        console.log(`Pakeičiamas video failas į: ${videoFile}`);
        video.src = videoFile;
        video.load();
    }
}


function interruptShow() {
    const video = document.querySelector('#tvvideo');

    if (video) {
        video.pause();
    }

    if (typeof stopSpeechSync === 'function') {
        stopSpeechSync();
    }
    if (typeof stopTalking === 'function') {
        stopTalking('Tomas');
        stopTalking('Lina');
    }
}


function startShow() {
    const video = document.querySelector('#tvvideo');
    const plane = document.querySelector('#tvScreen');

    if (video && plane) {
        plane.setAttribute('material', 'opacity', 1);
        video.currentTime = 0;
        video.play();
        startSpeechSync();
    }
}

function continueShow() {
    const video = document.querySelector('#tvvideo');
    const plane = document.querySelector('#tvScreen');

    if (video) {
        if (video.paused) {
            video.play();
            startSpeechSync();
            plane.setAttribute('material', 'opacity', 1);
        } else {
            // if show is already being played
        }
    }
}

function showTopicMenu() {
    showVRMenu('topic_menu');
}

function showTopic(topicId) {
    console.log('Pasirinkta tema:', topicId);

    if (!configData || !configData.topics) {
        console.error('Config data arba topics duomenys nėra užkrauti');
        showNotification('Konfigūracijos duomenys nėra užkrauti');
        return;
    }

    const topic = configData.topics.find(t => t.id === topicId);
    if (!topic) {
        console.error('Tema nerasta config.json:', topicId);
        showNotification(`Tema nerasta: ${topicId}`);
        return;
    }

    const topicDisplayName = topic.name[currentLanguage] || topic.name.en || topic.id;
    const topicPosition = topic.position[currentLanguage] || topic.position.en || 0;

    const video = document.querySelector('#tvvideo');
    const plane = document.querySelector('#tvScreen');

    if (video && plane) {
        video.currentTime = topicPosition;
        plane.setAttribute('material', 'opacity', 1);

        video.play().then(() => {
            if (typeof startSpeechSync === 'function') {
                startSpeechSync();
            }
        }).catch(error => {
            console.error('Klaida paleidžiant video:', error);
            showNotification('Klaida paleidžiant video');
        });
    } else {
        console.error('Video arba ekrano elementas nerastas');
        showNotification('Video elementas nerastas');
    }
}

function showNextTopic() {
    console.log('Rodoma kita tema');

    if (!configData || !configData.topics) {
        console.error('Config data or topics not loaded');
        return;
    }

    const topics = configData.topics;
    const video = document.querySelector('#tvvideo');
    const currentTime = video.currentTime;

    let currentTopicIndex = -1;
    for (let i = 0; i < topics.length; i++) {
        const topicPosition = topics[i].position[currentLanguage];
        if (currentTime >= topicPosition) {
            currentTopicIndex = i;
        } else {
            break;
        }
    }

    let nextTopicIndex = currentTopicIndex + 1;
    if (nextTopicIndex >= topics.length) {
        nextTopicIndex = 0;
    }

    const nextTopic = topics[nextTopicIndex];
    const nextPosition = nextTopic.position[currentLanguage];
    const topicName = nextTopic.name[currentLanguage];

    console.log(`📺 Pereinama prie temos: ${topicName} (${nextPosition}s)`);

    video.currentTime = nextPosition;

    if (video.paused) {
        video.play();
        startSpeechSync();
    }

    if (typeof currentTopicIndex !== 'undefined') {
        window.currentTopicIndex = nextTopicIndex;
    }
}


function explainControls() {
    playControlsSpeech(() => {
        showVRMenu('main_menu');
    });
}

function showNotification(message, duration = 3000) {
    const scene = document.querySelector('a-scene');
    const notification = document.createElement('a-entity');
    notification.setAttribute('id', 'vrNotification');

    const notificationPos = calculateMenuPosition();
    notificationPos.y += 0.5;
    notificationPos.z += 3;

    notification.setAttribute('position', `${notificationPos.x} ${notificationPos.y} ${notificationPos.z}`);

    const background = document.createElement('a-plane');
    background.setAttribute('width', '4');
    background.setAttribute('height', '1');
    background.setAttribute('color', '#333333');
    background.setAttribute('opacity', '0.9');
    background.setAttribute('material', 'transparent: true');
    notification.appendChild(background);

    const text = document.createElement('a-troika-text');
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


function getCurrentVideoTime() {
    const video = document.querySelector('#tvvideo');
    return video ? video.currentTime : 0;
}

function needsStop(lastSpoken, newStartTime) {
    return lastSpoken === null || (newStartTime - lastSpoken.end > 0.5);
}

function getCurrentSpeechData() {
    if (currentLanguage === 'lt') {
        return { man: man_lt, woman: woman_lt };
    } else {
        return { man: man_en, woman: woman_en };
    }
}


function checkForVideoInterruption(currentTime) {
    if (!isVideoInterruptionActive || !videoInterruptionData) {
        return;
    }

    if (currentInterruptionIndex < videoInterruptionData.length) {
        const nextInterruptionTime = videoInterruptionData[currentInterruptionIndex];
        if (currentTime >= nextInterruptionTime && lastInterruptionCheck < nextInterruptionTime) {
            console.log(`Video interruption triggered at ${currentTime}s (target: ${nextInterruptionTime}s)`);
            triggerVideoInterruption();
            lastInterruptionCheck = nextInterruptionTime;
        }
    }
}

function triggerVideoInterruption() {
    const video = document.querySelector('#tvvideo');
    if (video) {
        video.pause();
    }

    if (typeof stopTalking === 'function') {
        stopTalking('Tomas');
        stopTalking('Lina');
    }

    const audioFile = speechData["video_interruption_speech"][`speech_${currentLanguage}`];
    const interruptSpeech = speechData["video_interruption_speech"][currentLanguage];
    const audioElement = audioFile ? document.createElement('audio') : null;
    if (audioElement) {
        audioElement.src = audioFile
    }

    playbackSpeech('showman', interruptSpeech, audioElement, () => {
        setTimeout(() => {
            if (typeof showVRMenu === 'function') {
                askInterruptionQuestion(currentInterruptionIndex);
                currentInterruptionIndex++;
            }
        }, 200);
    });
}


function askInterruptionQuestion(questionIndex) {
    if (!quizData || !quizData.inter_quiz || !quizData.inter_quiz[currentLanguage]) {
        console.error('Quiz data not available for interruption question');
        return;
    }

    const questionKeys = Object.keys(quizData.inter_quiz[currentLanguage]);

    if (questionIndex >= questionKeys.length) {
        console.warn('No more questions available for interruption');
        return;
    }

    const questionKey = questionKeys[questionIndex];
    let questionData = quizData.inter_quiz[currentLanguage][questionKey];

    if (!questionData) {
        console.error('Question data not found:', questionKey);
        return;
    }

    const processedQuestionData = shuffleAnswers(questionData);

    if (typeof sayText === 'function') {
        sayText('Rimas', processedQuestionData.question);
    }

    if (typeof playQuestionSpeech === 'function') {
        playQuestionSpeech(processedQuestionData, () => {
            if (typeof stopTalking === 'function') {
                stopTalking('Rimas');
            }
            showQuestionHud(processedQuestionData, 'interruption');
        });
    } else {
        setTimeout(() => {
            if (typeof stopTalking === 'function') {
                stopTalking('Rimas');
            }
            showQuestionHud(processedQuestionData, 'interruption');
        }, 3000);
    }

}


function handleInterruptionAnswer(answerNumber, isCorrect) {
    console.log(`Interruption answer: ${answerNumber}, Correct: ${isCorrect}`);

    const clickedButton = document.querySelector(`#quizBtn_${answerNumber}`);
    if (clickedButton) {
        const color = isCorrect ? '#4CAF50' : '#F44336';
        clickedButton.setAttribute('material', 'color', color);

        if (!isCorrect) {
            const allButtons = document.querySelectorAll('[quiz-button]');
            allButtons.forEach(button => {
                const buttonComponent = button.components['quiz-button'];
                if (buttonComponent && buttonComponent.data.isCorrect) {
                    setTimeout(() => {
                        button.setAttribute('material', 'color', '#4CAF50');
                    }, 500);
                }
            });
        }

        setTimeout(() => {
            const quizMenu = document.getElementById('quizMenu');
            if (quizMenu) {
                quizMenu.remove();
            }
            if (isCorrect) {
                const audioFile = speechData["yes_speech"][`speech_${currentLanguage}`];
                const yesSpeech = speechData["yes_speech"][currentLanguage];
                const audioElement = audioFile ? document.createElement('audio') : null;
                if (audioElement) {
                    audioElement.src = audioFile
                }
                playbackSpeech('showman', yesSpeech, audioElement, () => {
                    setTimeout(() => {
                        continueShow();
                    }, 200);
                });
            } else {
                const audioFile = speechData["no_speech"][`speech_${currentLanguage}`];
                const noSpeech = speechData["no_speech"][currentLanguage];
                const audioElement = audioFile ? document.createElement('audio') : null;
                if (audioElement) {
                    audioElement.src = audioFile
                }
                playbackSpeech('showman', noSpeech, audioElement, () => {
                    setTimeout(() => {
                        continueShow();
                    }, 200);
                });
            }
        }, 1500);
    }
}


function syncSpeech() {
    const speechData = getCurrentSpeechData();

    if (!speechData.man || !speechData.woman) {
        console.log('Dialogue data not loaded yet');
        return;
    }

    const currentTime = getCurrentVideoTime();


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
    checkForVideoInterruption(currentTime);
}

function startSpeechSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
    }
    syncInterval = setInterval(syncSpeech, 100);
}

function stopSpeechSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
}

function getCharacterElementIds(character) {
    const normalizedCharacter = character.toLowerCase();

    switch(normalizedCharacter) {
        case 'tomas':
        case 'man':
            return {
                textElementId: '#manText',
                bubbleId: '#manBubble'
            };
        case 'rimas':
        case 'showman':
            return {
                textElementId: '#showmanText',
                bubbleId: '#showmanBubble'
            };
        case 'lina':
        case 'woman':
            return {
                textElementId: '#womanText',
                bubbleId: '#womanBubble'
            };
        default:
            return null;
    }
}


function sayText(character, text) {
    const elementIds = getCharacterElementIds(character);
    const { textElementId, bubbleId } = elementIds;

    const textElement = document.querySelector(textElementId);
    if (textElement) {
        textElement.setAttribute('troika-text', 'value', text);
        textElement.setAttribute('visible', true);

        const bubbleElement = document.querySelector(bubbleId);
        if (bubbleElement) {
            bubbleElement.setAttribute('visible', true);
        }
    }

    startCharacterTalking(character);
}

function stopTalking(character) {
    const elementIds = getCharacterElementIds(character);
    const { textElementId, bubbleId } = elementIds;

    const textElement = document.querySelector(textElementId);
    if (textElement) {
        textElement.setAttribute('visible', false);
        textElement.setAttribute('troika-text', {
            value: ""
        });

        const bubbleElement = document.querySelector(bubbleId);
        if (bubbleElement) {
            bubbleElement.setAttribute('visible', false);
        }
    }

    stopCharacterTalking(character);
}

function cancelScheduledEvents() {
    scheduledEvents.forEach(eventId => {
        clearTimeout(eventId);
    });
    scheduledEvents = [];
    stopSpeechSync();
}

function playbackSpeech(characterName, speechTextData, audioElement, callback) {
    console.log(`Starting playback speech for ${characterName}`);
    
    cancelScheduledEvents();
    
    let delay = 0;
    
    if (typeof animationManager !== 'undefined' && animationManager.startTalking) {
        animationManager.startTalking(characterName);
    }
    
    if (audioElement) {
        const allAudios = document.querySelectorAll('audio, video');
        allAudios.forEach(audio => {
            if (audio !== audioElement) {
                audio.pause();
            }
        });
        
        audioElement.currentTime = 0;
        audioElement.play().catch(error => {
            console.error('Audio playback failed:', error);
        });
    }
    
    speechTextData.forEach(line => {
        const sayEvent = setTimeout(() => {
            sayText(characterName, line.text);
        }, delay * 1000);
        scheduledEvents.push(sayEvent);
        
        const stopEvent = setTimeout(() => {
            stopTalking(characterName);
        }, (delay + line.duration) * 1000);
        scheduledEvents.push(stopEvent);
        
        delay += line.duration;
    });

    const thinkEvent = setTimeout(() => {
        console.log(`${characterName} starts thinking`);
        if (typeof animationManager !== 'undefined' && animationManager.setThinking) {
            animationManager.setThinking(characterName);
        }
    }, (delay + 0.1) * 1000);
    scheduledEvents.push(thinkEvent);
    
    if (callback && typeof callback === 'function') {
        const callbackEvent = setTimeout(() => {
            console.log(`${characterName} speech completed`);
            callback();
        }, (delay + 0.2) * 1000);
        scheduledEvents.push(callbackEvent);
    }
}

function playSpeechFromData(speechKey, characterName = 'showman', callback, scoreValue = null) {
    if (!speechData || !speechData[speechKey]) {
        console.error(`Speech data not found for key: ${speechKey}`);
        if (callback) callback();
        return;
    }
    
    const speech = speechData[speechKey];
    const language = currentLanguage || 'en';
    
    let textData = speech[language];
    if (!textData) {
        console.error(`No text data found for language: ${language}`);
        if (callback) callback();
        return;
    }
    
    if (speechKey.includes('review_') && scoreValue !== null) {
        textData = textData.map(line => ({
            ...line,
            text: line.text.replace('{score}', scoreValue.toString())
        }));
    }
    
    const audioPath = speech[`speech_${language}`];
    let audioElement = null;
    if (audioPath) {
        audioElement = document.getElementById(`speech_audio_${speechKey}_${language}`);
        if (!audioElement) {
            audioElement = document.createElement('audio');
            audioElement.id = `speech_audio_${speechKey}_${language}`;
            audioElement.src = audioPath;
            audioElement.preload = 'auto';
            document.body.appendChild(audioElement);
        }
    }
    
    console.log(`Playing speech: ${speechKey} in ${language} for ${characterName}`);
    playbackSpeech(characterName, textData, audioElement, callback);
}

function playInitialSpeech(callback) {
    playSpeechFromData('initial_speech', 'showman', () => {
        if (typeof showVRMenu === 'function') {
            showVRMenu('main_menu');
        }
        if (callback && typeof callback === 'function') {
            callback();
        }
    });
}

function playControlsSpeech(callback) {
    playSpeechFromData('controls_speech', 'showman', callback);
}

function playInterruptionSpeech(callback) {
    playSpeechFromData('interruption_speech', 'showman', callback);
}

function playVideoInterruptionSpeech(callback) {
    playSpeechFromData('video_interruption_speech', 'showman', callback);
}

function playYesSpeech(callback) {
    playSpeechFromData('yes_speech', 'showman', callback);
}

function playNoSpeech(callback) {
    playSpeechFromData('no_speech', 'showman', callback);
}

function playFinalSpeech(callback) {
    playSpeechFromData('final_speech', 'showman', callback);
}

function playFinalQuizSpeech(callback) {
    playSpeechFromData('final_quiz_speech', 'showman', callback);
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

    if (video) {
        video.pause();
        stopSpeechSync();
        stopTalking('Tomas');
        stopTalking('Lina');
    }

    console.log('Video sustabdytas');
}


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

    if (isMenuVisible && e.code.startsWith('Digit')) {
        const number = parseInt(e.code.replace('Digit', ''));
        if (number >= 1 && number <= 6) {
            selectAnswer(number);
        }
    }
});


function showFinalQuiz() {
    console.log('Pradedamas galutinis kvizas');
    
    if (typeof playFinalQuizSpeech === 'function') {
        playFinalQuizSpeech(() => {
            startFinalQuiz();
        });
    } else {
        startFinalQuiz();
    }
}

function startFinalQuiz() {
    console.log('Pradedamas galutinis kvizas');
    currentQuestionIndex = 0;
    quizScore = 0;
    prepareFinalQuizQuestions();
    askNextQuestion();
}

function prepareFinalQuizQuestions() {
    if (!quizData || !quizData.final_quiz || !quizData.final_quiz[currentLanguage]) {
        console.error('Quiz data nėra užkrautas arba nerastas galutinis kvizas');
        return;
    }
    
    const quizLangData = quizData.final_quiz[currentLanguage];
    finalQuizQuestions = Object.keys(quizLangData).sort();
    
    console.log('Paruošti klausimai:', finalQuizQuestions);
}

function askNextQuestion() {
    if (currentQuestionIndex >= finalQuizQuestions.length) {
        showQuizResults();
        return;
    }

    const questionKey = finalQuizQuestions[currentQuestionIndex];
    let questionData = quizData.final_quiz[currentLanguage][questionKey];

    if (!questionData) {
        console.error('Klausimo duomenys nerasti:', questionKey);
        return;
    }

    const processedQuestionData = shuffleAnswers(questionData);
    
    console.log(`Klausimas ${currentQuestionIndex + 1}:`, processedQuestionData.question);

    if (typeof sayText === 'function') {
        sayText('Rimas', processedQuestionData.question);
    }

    if (typeof playQuestionSpeech === 'function') {
        playQuestionSpeech(processedQuestionData, () => {
            if (typeof stopTalking === 'function') {
                stopTalking('Rimas');
            }
            showQuestionHud(processedQuestionData, 'final');
        });
    } else {
        setTimeout(() => {
            if (typeof stopTalking === 'function') {
                stopTalking('Rimas');
            }
            showQuestionHud(processedQuestionData, 'final');
        }, 3000);
    }
}


function showQuestionHud(questionData, quizType = 'final') {
    if (typeof stopTalking === 'function') {
        stopTalking('showman');
    }

    const quizMenu = createQuizMenu(questionData, quizType);

    if (quizMenu) {
        const scene = document.querySelector('a-scene');
        const existingQuiz = document.getElementById('quizMenu');
        if (existingQuiz) {
            existingQuiz.remove();
        }
        scene.appendChild(quizMenu);
        const video = document.querySelector('#tvvideo');
        if (video && !video.paused) {
            video.pause();
        }
    }
}

function handleQuizAnswer(answerNumber, isCorrect) {
    console.log(`Pasirinktas atsakymas: ${answerNumber}`);
    console.log(`Teisingai: ${isCorrect}`);
    
    if (isCorrect) {
        quizScore++;
    }

    const clickedButton = document.querySelector(`#quizBtn_${answerNumber}`);
    if (clickedButton) {
        const color = isCorrect ? '#4CAF50' : '#F44336'; // Žalias/Raudonas
        clickedButton.setAttribute('material', 'color', color);
        
        if (!isCorrect) {
            // Rasti teisingą mygtuką ir paryškinti jį
            const allButtons = document.querySelectorAll('[quiz-button]');
            allButtons.forEach(button => {
                const buttonComponent = button.components['quiz-button'];
                if (buttonComponent && buttonComponent.data.isCorrect) {
                    setTimeout(() => {
                        button.setAttribute('material', 'color', '#4CAF50');
                    }, 500);
                }
            });
        }
        
        setTimeout(() => {
            const quizMenu = document.getElementById('quizMenu');
            if (quizMenu) {
                quizMenu.remove();
            }

            currentQuestionIndex++;

            setTimeout(() => {
                askNextQuestion();
            }, 1000);
            
        }, 1500);
    }
}

// Funkcija atsakymų maišymui (jei reikės ateityje)
function shuffleAnswers(questionData) {
    if (!questionData.shuffle) {
        return questionData;
    }
    
    const answers = [];
    let answerNum = 1;

    while (questionData[`answer${answerNum}`]) {
        answers.push({
            originalKey: `answer${answerNum}`,
            text: questionData[`answer${answerNum}`],
            isCorrect: questionData.correct_answer === `answer${answerNum}`
        });
        answerNum++;
    }

    for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
    }

    const shuffledQuestion = { ...questionData };
    
    let clearNum = 1;
    while (shuffledQuestion[`answer${clearNum}`]) {
        delete shuffledQuestion[`answer${clearNum}`];
        clearNum++;
    }
    
    answers.forEach((answer, index) => {
        const newKey = `answer${index + 1}`;
        shuffledQuestion[newKey] = answer.text;
        if (answer.isCorrect) {
            shuffledQuestion.correct_answer = newKey;
        }
    });
    
    return shuffledQuestion;
}


function playQuestionSpeech(questionData, callback) {
    if (!questionData.audio) {
        console.warn('Klausimo audio failas nerastas');
        if (callback) callback();
        return;
    }
    
    const audio = new Audio(questionData.audio);
    
    audio.addEventListener('ended', () => {
        console.log('Klausimo audio baigtas');
        if (callback) callback();
    });
    
    audio.addEventListener('error', (e) => {
        console.error('Audio klaida:', e);
        if (callback) callback();
    });
    
    audio.play().catch(error => {
        console.error('Nepavyko paleisti audio:', error);
        if (callback) callback();
    });
}

function showQuizResults() {
    console.log(`Kvizas baigtas! Rezultatas: ${quizScore}/${finalQuizQuestions.length}`);

    const percentage = Math.round((quizScore / finalQuizQuestions.length) * 100);
    let resultKey = 'review_score_0'; // Default

    if (percentage === 100) {
        resultKey = 'review_score_5';
    } else if (percentage >= 80) {
        resultKey = 'review_score_4';
    } else if (percentage >= 60) {
        resultKey = 'review_score_3';
    } else if (percentage >= 40) {
        resultKey = 'review_score_2';
    } else if (percentage >= 20) {
        resultKey = 'review_score_1';
    }

    if (speechData && speechData[resultKey] && speechData[resultKey][currentLanguage]) {
        const resultSpeech = speechData[resultKey][currentLanguage];
        const audioFile = speechData[resultKey][`speech_${currentLanguage}`];

        const processedSpeech = resultSpeech.map(item => ({
            ...item,
            text: item.text.replace('{score}', `${quizScore}/${finalQuizQuestions.length}`)
        }));

        if (typeof playbackSpeech === 'function') {
            const audioElement = audioFile ? document.createElement('audio') : null;
            if (audioElement) {
                audioElement.src = audioFile;
            }

            playbackSpeech('showman', processedSpeech, audioElement, () => {
                setTimeout(() => {
                    if (typeof showVRMenu === 'function') {
                        showVRMenu('main_menu');
                    }
                }, 2000);
            });
        } else {
            showNotification(`Jūsų rezultatas: ${quizScore}/${finalQuizQuestions.length}`, 5000);
            setTimeout(() => {
                if (typeof showVRMenu === 'function') {
                    showVRMenu('main_menu');
                }
            }, 3000);
        }
    } else {
        console.warn('Quiz results speech not found');
        showNotification(`Jūsų rezultatas: ${quizScore}/${finalQuizQuestions.length}`, 5000);
        setTimeout(() => {
            if (typeof showVRMenu === 'function') {
                showVRMenu('main_menu');
            }
        }, 3000);
    }
}


window.playbackSpeech = playbackSpeech;
window.playSpeechFromData = playSpeechFromData;
window.playInitialSpeech = playInitialSpeech;
window.playControlsSpeech = playControlsSpeech;
window.playInterruptionSpeech = playInterruptionSpeech;
window.playVideoInterruptionSpeech = playVideoInterruptionSpeech;
window.playYesSpeech = playYesSpeech;
window.playNoSpeech = playNoSpeech;
window.playFinalSpeech = playFinalSpeech;
window.playFinalQuizSpeech = playFinalQuizSpeech;
window.cancelScheduledEvents = cancelScheduledEvents;
window.startSpeechSync = startSpeechSync;
window.stopSpeechSync = stopSpeechSync;
window.toggleVideoPlayback = toggleVideoPlayback;
window.stopVideo = stopVideo;
window.interruptShow = interruptShow;