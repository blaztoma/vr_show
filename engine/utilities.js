function checkConfigData() {
    console.log('ConfigData status:', {
        configData: configData,
        topics: configData?.topics,
        topicsLength: configData?.topics?.length,
        menus: configData?.menus
    });

    if (!configData) {
        console.log('configData nėra užkrautas');
        return false;
    }

    if (!configData.topics) {
        console.log('configData.topics nėra užkrautas');
        return false;
    }

    console.log('ConfigData ir topics užkrauti teisingai');
    return true;
}


async function loadSpeeches() {
    try {
        const response = await fetch('data/speeches.json');
        speechData = await response.json();
        console.log('Pokalbių duomenys užkrauti sėkmingai!');
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

        console.log('Dialogų duomenys užkrauti sėkmingai!');
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
        console.log('Konfigūracijos duomenys užkrauti sėkmingai!');
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
        console.log('Kvizų duomenys užkrauti sėkmingai!');
        return true;
    } catch (error) {
        console.error('Klaida kraunant kvizų duomenis:', error);
        return false;
    }
}


async function loadAllData() {
    try {
        console.log('📥 Starting to load all data files...');

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

        console.log('📊 Data loading results:', {
            config: configLoaded,
            speeches: speechesLoaded,
            quizzes: quizLoaded,
            dialogues: dialoguesLoaded
        });

        const criticalDataLoaded = configLoaded && speechesLoaded;

        if (criticalDataLoaded) {
            console.log('✅ Critical data loaded successfully');
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
