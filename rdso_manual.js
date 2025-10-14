// =============== ARCHITECTURE & CONFIGURATION ===============
// FINAL, OPTIMIZED MODEL
// This file uses a simulated subcollection model combined with a separate
// status summary object (`testStatuses`) for highly efficient list page loading.
// All data operations maintain consistency between the detailed data and the summary data.

const ENABLE_LOCAL_STORAGE = false;
const ENABLE_FIREBASE = true; 
const firebaseConfig = {
    apiKey: "AIzaSyAzW5b9Yeg6SdGfjfSptH0c6WTkGUPqmR4",
    authDomain: "test-data-hub-d7a34.firebaseapp.com",
    projectId: "test-data-hub-d7a34",
    storageBucket: "test-data-hub-d7a34.firebasestorage.app",
    messagingSenderId: "648910880799",
    appId: "1:648910880799:web:926b3622dfdb7b7660552a",
    measurementId: "G-HSHC6DT0QZ"
  };
// The following variables are now placeholders. They will be set dynamically
// by the page that loads this script (e.g., from a <script> tag in a Blogger post).
let uniqueTestId = 'RDSO_ALP_Test_01';
let currentCategory = 'rdso'; // Category can be used for analytics or display logic.
const SECTIONAL_TEST_INDEX = -1; // 0 = पहला टेस्ट, 1 = दूसरा टेस्ट, etc. Full test ke liye -1 karein.
const RESULT_RETENTION_DAYS = 30;
const MAX_HISTORY_ENTRIES = 5;

// =============== SIMULATED T-SCORE PARAMETERS (NOW A FALLBACK) ===============
// This object is now used only as a fallback if there is not enough 
// real user data in Firebase to generate a live T-Score.
const T_SCORE_PARAMS = {
    // NOTE: This key 'Memory Test' matches the groupName for combined T-Score calculation
    "Memory Test": {
        mu: 3.2,
        sigma: 1.6
    },
    "Following Directions": {
        mu: 1.5,
        sigma: 1.0
    },
    "Depth Perception": {
        mu: 1.1,
        sigma: 0.8
    },
    "Concentration Test": {
        mu: 1.8,
        sigma: 0.9
    },
    "Perceptual Speed": {
        mu: 1.9,
        sigma: 0.8
    }
};


// =============== DATA (Manual Questions) - MODIFIED ===============
let batteries = [{
    name: {
        hi: "स्मृति परीक्षण भाग १",
        en: "Memory Test Part 1"
    },
    groupName: "Memory Test", // Key for combining results
    instructionTime: 120,
    studyTime: 180,
    testTime: 180,
    breakTime: 60, // Break will occur after this battery part
    instructions: {
        hi: "भाग १: इस बैटरी में, आपको एक नक्शा दिखाया जाएगा जिसे 3 मिनट तक याद करना है। इसके बाद, उस नक्शे से संबंधित प्रश्न पूछे जाएंगे।",
        en: "Part 1: In this battery, you will be shown a map to memorize for 3 minutes. After that, you will be asked questions related to that map."
    },
    studyContent: (lang) => `<h3>${lang === 'hi' ? 'भाग १: याद करने वाला नक्शा' : 'Part 1: Map to Memorize'}</h3><div style="font-size: 1.2em; text-align: center; padding: 20px;"><p>School = <strong>23</strong></p><p>Hospital = <strong>78</strong></p><p>Park = <strong>45</strong></p></div>`,
    questions: [{
        text: {
            hi: '"स्कूल" के लिए क्या नंबर था?',
            en: 'What was the number for "School"?'
        },
        options: [23, 19, 45, 78],
        correct: 'a',
        explanation: {
            en: "The map clearly showed that the number associated with the School was 23.",
            hi: "नक्शे में स्पष्ट रूप से दिखाया गया था कि स्कूल से जुड़ा नंबर 23 था।"
        }
    }, {
        text: {
            hi: '"अस्पताल" के लिए क्या नंबर था?',
            en: 'What was the number for "Hospital"?'
        },
        options: [51, 78, 88, 19],
        correct: 'b'
    }, {
        text: {
            hi: '"पार्क" के लिए क्या नंबर था?',
            en: 'What was the number for "Park"?'
        },
        options: [23, 45, 19, 51],
        correct: 'b'
    }, ],
    questionsPerPage: 10 // Set high to ensure only one page
}, {
    name: {
        hi: "स्मृति परीक्षण भाग २",
        en: "Memory Test Part 2"
    },
    groupName: "Memory Test", // Key for combining results
    instructionTime: 120,
    studyTime: 180,
    testTime: 180,
    breakTime: 60, // Break after this part as well
    instructions: {
        hi: "भाग २: अब आपको एक और नक्शा याद करना है और उसके आधार पर प्रश्नों का उत्तर देना है।",
        en: "Part 2: Now you will have to memorize another map and answer questions based on it."
    },
    studyContent: (lang) => `<h3>${lang === 'hi' ? 'भाग २: याद करने वाला नक्शा' : 'Part 2: Map to Memorize'}</h3><div style="font-size: 1.2em; text-align: center; padding: 20px;"><p>Station = <strong>19</strong></p><p>Temple = <strong>51</strong></p><p>Market = <strong>88</strong></p></div>`,
    questions: [{
        text: {
            hi: '"स्टेशन" के लिए क्या नंबर था?',
            en: 'What was the number for "Station"?'
        },
        options: [19, 88, 45, 23],
        correct: 'a'
    }, {
        text: {
            hi: '"मंदिर" के लिए क्या नंबर था?',
            en: 'What was the number for "Temple"?'
        },
        options: [78, 19, 51, 45],
        correct: 'c'
    }, {
        text: {
            hi: '"बाजार" के लिए क्या नंबर था?',
            en: 'What was the number for "Market"?'
        },
        options: [45, 23, 78, 88],
        correct: 'd'
    }, ],
    questionsPerPage: 10 // Set high to ensure only one page
}, {
    name: {
        hi: "निर्देश पालन",
        en: "Following Directions"
    },
    instructionTime: 120,
    studyTime: 0,
    testTime: 300,
    breakTime: 60,
    layout: 'split-view', // NEW: Special layout flag
    image: 'https://i.imgur.com/8a3nL1G.png', // NEW: Image for the layout
    instructions: {
        hi: "दिए गए निर्देशों का पालन करें और बताएं कि आप ग्रिड के किस अक्षर पर पहुंचेंगे। आपके पास 5 मिनट हैं।",
        en: "Follow the given instructions and determine which letter of the grid you will land on. You have 5 minutes."
    },
    questions: [{
        text: {
            hi: "पंक्ति 1, कॉलम 1 से शुरू करें। 2 कदम दाएं जाएं। 1 कदम नीचे जाएं।",
            en: "Start at Row 1, Column 1. Move 2 steps Right. Move 1 step Down."
        },
        options: ['H', 'G', 'C', 'I'],
        correct: 'a',
        explanation: {
            en: "Starting at A (R1, C1), moving 2 steps right lands on C. Moving 1 step down from C lands on H.",
            hi: "A (R1, C1) से शुरू करके, 2 कदम दाईं ओर जाने पर C पर पहुँचते हैं। C से 1 कदम नीचे जाने पर H पर पहुँचते हैं।"
        }
    }, {
        text: {
            hi: "पंक्ति 5, कॉलम 5 से शुरू करें। 3 कदम ऊपर जाएं। 2 कदम बाएं जाएं।",
            en: "Start at Row 5, Column 5. Move 3 steps Up. Move 2 steps Left."
        },
        options: ['M', 'H', 'I', 'N'],
        correct: 'c'
    }, {
        text: {
            hi: "पंक्ति 3, कॉलम 3 से शुरू करें। 1 कदम बाएं जाएं। 2 कदम नीचे जाएं।",
            en: "Start at Row 3, Column 3. Move 1 step Left. Move 2 steps Down."
        },
        options: ['W', 'L', 'V', 'Q'],
        correct: 'c'
    }, {
        text: {
            hi: "पंक्ति 2, कॉलम 4 से शुरू करें। 2 कदम नीचे जाएं। 3 कदम बाएं जाएं।",
            en: "Start at Row 2, Column 4. Move 2 steps Down. Move 3 steps Left."
        },
        options: ['P', 'Q', 'U', 'K'],
        correct: 'a'
    }],
    questionsPerPage: 2 // Multiple pages
}, {
    name: {
        hi: "दूरी प्रत्यक्षीकरण",
        en: "Depth Perception"
    },
    instructionTime: 120,
    studyTime: 0,
    testTime: 300,
    breakTime: 60,
    instructions: {
        hi: "कल्पना करें कि प्रश्न के साथ एक ईंटों का ढेर दिखाया गया है। बताएं कि चिह्नित ईंट को कितनी अन्य ईंटें छू रही हैं।",
        en: "Imagine a stack of bricks is shown with the question. Count how many other bricks are touching the marked brick."
    },
    questions: [{
        text: {
            en: "<img src='https://i.imgur.com/Aic8G6c.png' alt='Bricks 1'><br/>In the figure, how many bricks are touching brick 'X'?",
            hi: "<img src='https://i.imgur.com/Aic8G6c.png' alt='Bricks 1'><br/>चित्र में, कितनी ईंटें 'X' ईंट को छू रही हैं?"
        },
        options: [2, 3, 4, 5],
        correct: 'c'
    }, {
        text: {
            en: "<img src='https://i.imgur.com/L7sFzNf.png' alt='Bricks 2'><br/>In the figure, how many bricks are touching the red brick?",
            hi: "<img src='https://i.imgur.com/L7sFzNf.png' alt='Bricks 2'><br/>चित्र में, लाल रंग की ईंट को कितनी ईंटें छू रही हैं?"
        },
        options: [3, 4, 5, 6],
        correct: 'b'
    }, ],
    questionsPerPage: 10
}, {
    name: {
        hi: "एकाग्रता परीक्षण",
        en: "Concentration Test"
    },
    instructionTime: 120,
    studyTime: 0,
    testTime: 240,
    breakTime: 60,
    instructions: {
        hi: "इस बैटरी में, आपको एक अंक और एक संख्या समूह दिया जाएगा। आपको तेजी से बताना है कि वह अंक समूह में है या नहीं। आपके पास 4 मिनट हैं।",
        en: "In this battery, you will be given a digit and a group of numbers. You have to quickly tell if the digit is present in the group. You have 4 minutes."
    },
    questions: [{
        text: {
            en: `Is the digit <strong>6</strong> present in <strong>46913</strong>?`,
            hi: `क्या अंक <strong>6</strong> समूह <strong>46913</strong> में मौजूद है?`
        },
        options: ["Yes", "No"],
        options_hi: ["हाँ", "नहीं"],
        correct: 'a'
    }, {
        text: {
            en: `Is the digit <strong>8</strong> present in <strong>79135</strong>?`,
            hi: `क्या अंक <strong>8</strong> समूह <strong>79135</strong> में मौजूद है?`
        },
        options: ["Yes", "No"],
        options_hi: ["हाँ", "नहीं"],
        correct: 'b'
    }, {
        text: {
            en: `Is the digit <strong>2</strong> present in <strong>20871</strong>?`,
            hi: `क्या अंक <strong>2</strong> समूह <strong>20871</strong> में मौजूद है?`
        },
        options: ["Yes", "No"],
        options_hi: ["हाँ", "नहीं"],
        correct: 'a'
    }, ],
    questionsPerPage: 36
}, {
    name: {
        hi: "प्रत्यक्षीकरण गति",
        en: "Perceptual Speed"
    },
    instructionTime: 120,
    studyTime: 0,
    testTime: 360,
    breakTime: 0, // No break after the last battery, but we will show a final screen
    instructions: {
        hi: "बाईं ओर दी गई आकृति से हूबहू मेल खाने वाली आकृति को दाईं ओर के विकल्पों में से चुनें। आपके पास 6 मिनट हैं।",
        en: "Find the figure on the right that exactly matches the figure on the left. You have 6 minutes."
    },
    questions: [{
        text: {
            en: `Target: <strong>aB(dE)f</strong>`,
            hi: `लक्ष्य: <strong>aB(dE)f</strong>`
        },
        options: ["aB(dE)f", "gH{iJ}k", "aB(dE)g", "Lm-N-Op", "aB(de)f"],
        correct: 'a'
    }, {
        text: {
            en: `Target: <strong>qR/sT\\u</strong>`,
            hi: `लक्ष्य: <strong>qR/sT\\u</strong>`
        },
        options: ["gH{iJ}k", "Vw[Xy]Z", "qR/sT\\u", "qR/sT/u", "Lm-N-Op"],
        correct: 'c'
    }, {
        text: {
            en: `Target: <strong>Vw[Xy]Z</strong>`,
            hi: `लक्ष्य: <strong>Vw[Xy]Z</strong>`
        },
        options: ["gH{iJ}k", "Vw[Xy]Z", "Lm-N-Op", "Vw[Xy]z", "Vw(Xy)Z"],
        correct: 'b'
    }, ],
    questionsPerPage: 36
}];

// =============== STATE & DOM REFERENCES ===============
let currentLanguage = 'hi';
let firebaseUser = null; // Firebase user को स्टोर करने के लिए नया वेरिएबल
let db = null;           // Firestore इंस्टेंस के लिए नया वेरिएबल
let currentBatteryIndex = 0;
let currentPhase = '';
let currentPage = 0;
let timer;
let wasTimerPausedByModal = false;
let timeLeft = 0;
let onTimerComplete;
let toastTimer;
let saveInterval = null;
let userAnswers = [];
let allBatteryResults = [];
let allUserAnswers = [];
let userId = null;
let currentSolutionBatteryIndex = 0;
let solutionViewMode = 'all'; // 'all' or 'single'
let currentSolutionQuestionIndex = 0;
let isReattemptMode = false;
let flatNavigationSteps = [];
let currentStepIndex = 0;
let analysisPendingForBreak = false;
// NEW state variables for mobile
let isMobileView = window.innerWidth <= 768;
let isOneByOneMode = true;
let currentMobileQIndex = 0;


const DOM = {
    body: document.body,
    examHeader: document.querySelector('.exam-header'),
    mainInstructionScreen: document.getElementById('main-instruction-screen'),
    examProperScreen: document.getElementById('exam-proper'),
    welcomeScreen: document.getElementById('welcome-screen'),
    phaseScreen: document.getElementById('phase-screen'),
    testScreen: document.getElementById('test-screen'),
    finalResultScreen: document.getElementById('final-result-screen'),
    solutionScreen: document.getElementById('solution-screen'),
    toastNotification: document.getElementById('toast-notification'),
    skipFooter: document.getElementById('skip-footer'),
    batteryTabsContainer: document.getElementById('battery-tabs-container'),
    timerDisplay: document.getElementById('timer-display'),
    progressBar: document.getElementById('progress-bar'),
    fullscreenBtn: document.getElementById('fullscreen-btn'),
    viewSolutionBtn: document.getElementById('view-solution-btn'),
    viewInstructionBtn: document.getElementById('view-instruction-btn'),
    returnToResultsBtn: document.getElementById('return-to-results-btn'),
    tabTooltip: document.getElementById('tab-tooltip'),
    stickyContainer: document.getElementById('sticky-container'),
    headerLangSwitcher: document.getElementById('header-lang-switcher'),
    examTitle: document.getElementById('exam-title'),
    solutionSidebar: document.getElementById('solution-sidebar'),
    solutionMainContent: document.getElementById('solution-main-content'),
    solutionNavHeaderWrapper: document.getElementById('solution-nav-header-wrapper'),
    solutionNavStickyContainer: document.getElementById('solution-nav-sticky-container'),
    fsOpenIcon: document.getElementById('fullscreen-open-icon'),
    fsCloseIcon: document.getElementById('fullscreen-close-icon'),
    pauseBtn: document.getElementById('pause-btn'),
    pauseOverlay: document.getElementById('pause-overlay'),
    resumeBtn: document.getElementById('resume-btn'),
    mainProceedBtn: document.getElementById('main-proceed-btn'),
    startExamBtn: document.getElementById('start-exam-btn'),
    viewResultFinalBtn: document.getElementById('view-result-final-btn'),
    clearResponseBtn: document.getElementById('clear-response-btn'),
    prevPageBtn: document.getElementById('prev-page-btn'),
    nextPageBtn: document.getElementById('next-page-btn'),
    skipBtn: document.getElementById('skip-btn'),
    submitBatteryBtn: document.getElementById('submit-battery-btn'),
    finalResultTitle: document.getElementById('final-result-title'),
    consentCheckbox: document.getElementById('consent-checkbox'),
    lightboxOverlay: document.getElementById('lightbox-overlay'),
    lightboxImg: document.getElementById('lightbox-img'),
    lightboxClose: document.getElementById('lightbox-close'),
    solutionFooter: document.getElementById('solution-footer'),
    solutionPrevBtn: document.getElementById('solution-prev-btn'),
    solutionNextBtn: document.getElementById('solution-next-btn'),
    solutionPageIndicator: document.getElementById('solution-page-indicator'),
    darkModeCheckbox: document.getElementById('dark-mode-checkbox'),
    mobileDarkModeCheckbox: document.getElementById('mobile-dark-mode-checkbox'),
    mobileMenuIcon: document.getElementById('mobile-menu-icon'),
    mobileMenuDropdown: document.getElementById('mobile-menu-dropdown'),
    mobilePauseBtn: document.getElementById('mobile-pause-btn'),
    mobileFullscreenBtn: document.getElementById('mobile-fullscreen-btn'),
    mobileLangSwitcher: document.getElementById('mobile-lang-switcher'),
    scrollTabsLeft: document.getElementById('scroll-tabs-left'),
    scrollTabsRight: document.getElementById('scroll-tabs-right'),
    mobileSidebarToggle: document.getElementById('mobile-sidebar-toggle'),
    solutionOverlay: document.getElementById('solution-overlay'),
    resumePromptOverlay: document.getElementById('resume-prompt-overlay'),
    resumeTestBtn: document.getElementById('resume-test-btn'),
    startNewTestBtn: document.getElementById('start-new-test-btn'),
    viewResultPromptOverlay: document.getElementById('view-result-prompt-overlay'),
    viewPreviousResultBtn: document.getElementById('view-previous-result-btn'),
    startNewOverwriteBtn: document.getElementById('start-new-overwrite-btn'),
    statsModalOverlay: document.getElementById('battery-stats-modal-overlay'),
    statsModalTitle: document.getElementById('stats-modal-title'),
    statsModalBody: document.getElementById('stats-modal-body'),
    statsModalCloseBtn: document.getElementById('stats-modal-close-btn'),
    instructionModalOverlay: document.getElementById('instruction-modal-overlay'),
    instructionModalBody: document.getElementById('instruction-modal-body'),
    instructionModalCloseBtn: document.getElementById('instruction-modal-close-btn'),
    mobileTestSidebar: document.getElementById('mobile-test-sidebar'),
    mobileTestSidebarToggle: document.getElementById('mobile-test-sidebar-toggle'),
    mobileTestSidebarOverlay: document.getElementById('mobile-test-sidebar-overlay'),
    confirmModalOverlay: document.getElementById('confirm-modal-overlay'),
    confirmModalTitle: document.getElementById('confirm-modal-title'),
    confirmModalBody: document.getElementById('confirm-modal-body'),
    confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
    confirmOkBtn: document.getElementById('confirm-ok-btn'),
    userProfileBtn: document.getElementById('user-profile-btn'),
    userDropdownMenu: document.getElementById('user-dropdown-menu'),
     changePasswordBtn: document.getElementById('change-password-btn'),
    changePasswordModalOverlay: document.getElementById('change-password-modal-overlay'),
    changePasswordModalCloseBtn: document.getElementById('change-password-modal-close-btn'),
    changePasswordCancelBtn: document.getElementById('change-password-cancel-btn'),
    confirmChangePasswordBtn: document.getElementById('confirm-change-password-btn'),
    currentPasswordInput: document.getElementById('current-password'),
    newPasswordInput: document.getElementById('new-password'),
    confirmNewPasswordInput: document.getElementById('confirm-new-password'),
    changePasswordError: document.getElementById('change-password-error'),
    linkAccountBtn: document.getElementById('link-account-btn'),
    linkAccountModalOverlay: document.getElementById('link-account-modal-overlay'),
    linkAccountModalCloseBtn: document.getElementById('link-account-modal-close-btn'),
    linkAccountCancelBtn: document.getElementById('link-account-cancel-btn'),
    confirmLinkAccountBtn: document.getElementById('confirm-link-account-btn'),
    linkEmailInput: document.getElementById('link-email'),
    linkPasswordInput: document.getElementById('link-password'),
    linkAccountError: document.getElementById('link-account-error')
};


// =============== LOCAL STORAGE & STATE MANAGEMENT ===============
// =============== LOCAL STORAGE & STATE MANAGEMENT (MODIFIED FOR HYBRID SYSTEM) ===============

// getUserId() को हटा दिया गया है। userId अब Firebase से सेट होगा।

async function getUserData() {
    const defaultData = {
        profile: { theme: 'light', language: 'hi' },
        inProgressTests: {},
        completedTests: {},
        testStatuses: {},
    };

    // 1. Firebase से लोड करने का प्रयास करें
    if (ENABLE_FIREBASE && firebaseUser && db) {
        try {
            const userDocRef = db.collection('users').doc(firebaseUser.uid);
            const doc = await userDocRef.get();
            if (doc.exists) {
                console.log("Data loaded from Firebase.");
                // सुनिश्चित करें कि डेटा में सभी आवश्यक कुंजियाँ हैं
                const firebaseData = doc.data();
                if (!firebaseData.inProgressTests) firebaseData.inProgressTests = {};
                if (!firebaseData.completedTests) firebaseData.completedTests = {};
                if (!firebaseData.testStatuses) firebaseData.testStatuses = {};
                return firebaseData;
                
            }
        } catch (error) {
            console.error("Firebase load failed, falling back to LocalStorage:", error);
        }
    }

    // 2. यदि Firebase विफल रहता है या अक्षम है, तो LocalStorage पर वापस जाएं
    if (ENABLE_LOCAL_STORAGE) {
        try {
            const userDataJSON = localStorage.getItem(`rdso_user_data_${firebaseUser.uid}`);
            if(userDataJSON) {
                console.log("Data loaded from LocalStorage.");
                 const parsed = JSON.parse(userDataJSON);
                 // सुनिश्चित करें कि डेटा में सभी आवश्यक कुंजियाँ हैं
                 if (!parsed.inProgressTests) parsed.inProgressTests = {};
                 if (!parsed.completedTests) parsed.completedTests = {};
                 if (!parsed.testStatuses) parsed.testStatuses = {};
                 return parsed;
            }
        } catch (e) {
            console.error("Error parsing user data from LocalStorage:", e);
        }
    }
    
    console.log("No saved data found, returning default data.");
    return defaultData;
}

async function saveUserData(userData) {
    // 1. Firebase में सेव करें (यदि सक्षम हो)
    if (ENABLE_FIREBASE && firebaseUser && db) {
        try {
            await db.collection('users').doc(firebaseUser.uid).set(userData);
            console.log("User data saved to Firebase.");
        } catch (e) {
            console.error("Error saving user data to Firebase:", e);
            showToast("Syncing failed. Your progress is saved locally.");
        }
    }

    // 2. LocalStorage में भी सेव करें (एक सहायक/बैकअप के रूप में)
    if (ENABLE_LOCAL_STORAGE) {
        try {
            localStorage.setItem(`rdso_user_data_${firebaseUser.uid}`, JSON.stringify(userData));
            console.log("User data saved to LocalStorage.");
        } catch (e) {
            console.error("Error saving user data to LocalStorage:", e);
        }
    }
}

async function loadState() {
    const userData = await getUserData(); // अब यह async है
    return userData.inProgressTests[uniqueTestId] || null;
}

async function clearAllDataForTest(testId) {
    const userData = await getUserData();
    if (userData.inProgressTests && userData.inProgressTests[testId]) delete userData.inProgressTests[testId];
    if (userData.completedTests && userData.completedTests[testId]) delete userData.completedTests[testId];
    if (userData.testStatuses && userData.testStatuses[testId]) delete userData.testStatuses[testId];
    await saveUserData(userData); // अपडेटेड डेटा को सेव करें
}

async function saveState() {
    if (currentPhase === 'initial' || currentPhase === 'welcome') return;
    if (DOM.testScreen.classList.contains('active')) saveCurrentAnswers();
    
    const userData = await getUserData();
    if (!userData) return;
    
    const testStatus = userData.testStatuses ? userData.testStatuses[uniqueTestId] : null;
    if (testStatus === 'completed') return;

    const state = {
        currentStepIndex, allBatteryResults, allUserAnswers, userAnswers,
        currentPhase, currentPage, currentBatteryIndex, currentLanguage,
        analysisPendingForBreak, lastSaved: Date.now(), category: currentCategory,
        timeLeft: 0, isOneByOneMode, currentMobileQIndex,
    };
    if (['test', 'instruction', 'study', 'break'].includes(currentPhase)) {
        state.timeLeft = timeLeft;
    }
    
    userData.inProgressTests[uniqueTestId] = state;
    userData.testStatuses[uniqueTestId] = 'in_progress';
    
    await saveUserData(userData);
}

// MODIFIED FUNCTION: `saveCompletedTest`
async function saveCompletedTest() {
    // Save the detailed results to the user's personal document
    const userData = await getUserData();
    if (!userData) return;
    const newEntry = {
        testId: uniqueTestId,
        completedAt: new Date().toISOString(),
        results: allBatteryResults,
        answers: allUserAnswers,
        category: currentCategory,
        testUrl: window.location.href,
    };
    userData.completedTests[uniqueTestId] = newEntry;
    if (userData.inProgressTests && userData.inProgressTests[uniqueTestId]) delete userData.inProgressTests[uniqueTestId];
    userData.testStatuses[uniqueTestId] = 'completed';
    let flatHistory = Object.entries(userData.completedTests).map(([id, data]) => ({
        id,
        ...data
    }));
    flatHistory.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    const retentionCutoff = new Date();
    retentionCutoff.setDate(retentionCutoff.getDate() - RESULT_RETENTION_DAYS);
    flatHistory = flatHistory.filter(item => new Date(item.completedAt) > retentionCutoff);
    if (flatHistory.length > MAX_HISTORY_ENTRIES) flatHistory = flatHistory.slice(0, MAX_HISTORY_ENTRIES);
    const newCompletedTests = {};
    flatHistory.forEach(item => {
        const {
            id,
            ...rest
        } = item;
        newCompletedTests[item.id] = rest;
    });
    userData.completedTests = newCompletedTests;
    await saveUserData(userData);

    // --- NEW LOGIC: Save raw scores for aggregate T-Score calculation ---
    if (ENABLE_FIREBASE && firebaseUser && db) {
        try {
            // We use the fallback params here just to get the combined structure and raw scores
            const finalResults = getCombinedResults(false, T_SCORE_PARAMS);
            const scoresToSave = {};
            finalResults.forEach(result => {
                // Creates an object like { "Memory Test": 5, "Depth Perception": 2, ... }
                scoresToSave[result.name_en] = result.correct;
            });

            const aggregateDocRef = db.collection('testAggregates').doc(uniqueTestId).collection('scores').doc(firebaseUser.uid);
            await aggregateDocRef.set({
                scores: scoresToSave,
                completedAt: new Date()
            });
            console.log("Raw scores saved for aggregate calculation.");
        } catch (error) {
            console.error("Failed to save raw scores for aggregate T-Score:", error);
        }
    }
}


// =============== EVENT LISTENERS ===============
DOM.mainProceedBtn.addEventListener('click', () => runPhase('welcome'));
DOM.startExamBtn.addEventListener('click', () => {
    startExam();
    navigateToStep(0);
});
DOM.viewResultFinalBtn.addEventListener('click', () => runPhase('final_results'));
DOM.skipBtn.addEventListener('click', () => {
    const performSkip = () => {
        if (typeof onTimerComplete === 'function') {
            clearInterval(timer);
            onTimerComplete();
        }
    };
    if (currentPhase === 'break') {
        performSkip();
    } else {
        const title = currentLanguage === 'hi' ? 'स्किप की पुष्टि करें' : 'Confirm Skip';
        const body = currentLanguage === 'hi' ? 'क्या आप वाकई इस चरण को स्किप करना चाहते हैं? आप वापस नहीं आ पाएंगे।' : 'Are you sure you want to skip this phase? You will not be able to return.';
        openConfirmModal(title, body, performSkip);
    }
});
DOM.nextPageBtn.addEventListener('click', () => {
    saveCurrentAnswers();
    if (isMobileView && isOneByOneMode) {
        const battery = batteries[currentBatteryIndex];
        if (currentMobileQIndex < battery.questions.length - 1) {
            currentMobileQIndex++;
            renderTestPage();
        }
    } else {
        currentStepIndex++;
        navigateToStep(currentStepIndex);
    }
    saveState();
});
DOM.prevPageBtn.addEventListener('click', () => {
    saveCurrentAnswers();
    if (isMobileView && isOneByOneMode) {
        if (currentMobileQIndex > 0) {
            currentMobileQIndex--;
            renderTestPage();
        }
    } else {
        currentStepIndex--;
        navigateToStep(currentStepIndex);
    }
    saveState();
});
DOM.submitBatteryBtn.addEventListener('click', userSubmitBattery);
DOM.fullscreenBtn.addEventListener('click', toggleFullScreen);
DOM.viewSolutionBtn.addEventListener('click', showSolutionView);
DOM.returnToResultsBtn.addEventListener('click', () => {
    DOM.solutionScreen.classList.remove('active');
    DOM.finalResultScreen.classList.add('active');
    DOM.stickyContainer.style.display = 'none';
    updateHeaderControls();
    DOM.solutionFooter.style.display = 'none';
});
DOM.pauseBtn.addEventListener('click', pauseTest);
DOM.resumeBtn.addEventListener('click', resumeTest);
DOM.consentCheckbox.addEventListener('change', () => {
    DOM.mainProceedBtn.disabled = !DOM.consentCheckbox.checked;
});
DOM.solutionPrevBtn.addEventListener('click', () => navigateSolutionQuestion(-1));
DOM.solutionNextBtn.addEventListener('click', () => navigateSolutionQuestion(1));
DOM.lightboxClose.addEventListener('click', closeLightbox);
DOM.lightboxOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.lightboxOverlay) closeLightbox();
});
DOM.darkModeCheckbox.addEventListener('change', (e) => toggleDarkMode(e.target.checked));
DOM.mobileDarkModeCheckbox.addEventListener('change', (e) => toggleDarkMode(e.target.checked));
DOM.mobileMenuIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    if (DOM.userDropdownMenu) DOM.userDropdownMenu.classList.remove('show');
    DOM.mobileMenuDropdown.classList.toggle('show');
});
DOM.mobilePauseBtn.addEventListener('click', pauseTest);
DOM.mobileFullscreenBtn.addEventListener('click', toggleFullScreen);
if (DOM.userProfileBtn) {
    DOM.userProfileBtn.addEventListener('click', (event) => {
        event.stopPropagation(); 
        // Close the other menu first
        if (DOM.mobileMenuDropdown) DOM.mobileMenuDropdown.classList.remove('show');
        // Now, toggle the user menu
        DOM.userDropdownMenu.classList.toggle('show');
    });
}

// This single listener now closes ANY open dropdown when clicking outside
window.addEventListener('click', (event) => {
    // Close user dropdown menu if click is outside
    if (DOM.userDropdownMenu && DOM.userDropdownMenu.classList.contains('show')) {
        if (!DOM.userProfileBtn.contains(event.target)) {
            DOM.userDropdownMenu.classList.remove('show');
        }
    }
    
    // Close mobile menu dropdown if click is outside
    if (DOM.mobileMenuDropdown && DOM.mobileMenuDropdown.classList.contains('show')) {
        if (!DOM.mobileMenuIcon.contains(event.target)) {
            DOM.mobileMenuDropdown.classList.remove('show');
        }
    }
});
DOM.scrollTabsLeft.addEventListener('click', () => {
    DOM.batteryTabsContainer.scrollBy({
        left: -200,
        behavior: 'smooth'
    });
});
DOM.scrollTabsRight.addEventListener('click', () => {
    DOM.batteryTabsContainer.scrollBy({
        left: 150,
        behavior: 'smooth'
    });
});
DOM.batteryTabsContainer.addEventListener('scroll', updateScrollArrows);
window.addEventListener('resize', () => {
    const oldIsMobileView = isMobileView;
    isMobileView = window.innerWidth <= 768;

    if (oldIsMobileView !== isMobileView) {
        if (currentPhase === 'test') {
            renderTestPage();
        }
    }
    
    updateHeaderControls();
    updateScrollArrows();
    if (DOM.solutionScreen.classList.contains('active')) {
        updateSolutionNavArrows();
        setSolutionSidebarPosition();
    }
    if (document.querySelector('.split-view-static-pane')) {
        setSplitViewPanePosition();
    }
    manageScrollListener();
    if (window.innerWidth > 768) {
        DOM.mobileMenuDropdown.classList.remove('show');
        if (document.body.classList.contains('sidebar-open')) toggleSolutionSidebar(false);
        if (document.body.classList.contains('mobile-test-sidebar-open')) toggleMobileTestSidebar(false);
    }
});
DOM.statsModalCloseBtn.addEventListener('click', () => {
    DOM.statsModalOverlay.style.display = 'none';
});
DOM.statsModalOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.statsModalOverlay) DOM.statsModalOverlay.style.display = 'none';
});
const toggleSolutionSidebar = (force) => {
    document.body.classList.toggle('sidebar-open', force);
    document.body.classList.toggle('no-scroll', force);
};
if(DOM.mobileSidebarToggle) DOM.mobileSidebarToggle.addEventListener('click', ()=>toggleSolutionSidebar());
if(DOM.solutionOverlay) DOM.solutionOverlay.addEventListener('click', ()=>toggleSolutionSidebar());
DOM.clearResponseBtn.addEventListener('click', clearCurrentResponse);
DOM.viewInstructionBtn.addEventListener('click', showInstructionModal);
DOM.instructionModalCloseBtn.addEventListener('click', closeInstructionModal);
DOM.instructionModalOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.instructionModalOverlay) closeInstructionModal();
});
const toggleMobileTestSidebar = (force) => {
    document.body.classList.toggle('mobile-test-sidebar-open', force);
    document.body.classList.toggle('no-scroll', force);
};
if (DOM.mobileTestSidebarToggle) DOM.mobileTestSidebarToggle.addEventListener('click', ()=>toggleMobileTestSidebar());
if (DOM.mobileTestSidebarOverlay) DOM.mobileTestSidebarOverlay.addEventListener('click', ()=>toggleMobileTestSidebar());
if (DOM.confirmCancelBtn) DOM.confirmCancelBtn.addEventListener('click', closeConfirmModal);
// ... बाकी के इवेंट लिसनर्स ...

// लॉगआउट बटन के लिए इवेंट लिसनर जोड़ें
const logoutBtn = document.getElementById('logout-btn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (ENABLE_FIREBASE) {
            firebase.auth().signOut().then(() => {
                console.log('User signed out.');
                // onAuthStateChanged इसे हैंडल करेगा और लॉगिन पेज पर भेज देगा।
            }).catch((error) => {
                console.error('Sign out error', error);
            });
        } else {
            // ऑफ़लाइन मोड में, बस पेज को रीलोड करें
            window.location.reload();
        }
    });
}
if (DOM.changePasswordBtn) {
    DOM.changePasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openChangePasswordModal();
    });
}
DOM.changePasswordModalCloseBtn.addEventListener('click', closeChangePasswordModal);
DOM.changePasswordCancelBtn.addEventListener('click', closeChangePasswordModal);
DOM.changePasswordModalOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.changePasswordModalOverlay) {
        closeChangePasswordModal();
    }
});
DOM.confirmChangePasswordBtn.addEventListener('click', handleChangePassword);
if (DOM.linkAccountBtn) {
    DOM.linkAccountBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openLinkAccountModal();
    });
}
DOM.linkAccountModalCloseBtn.addEventListener('click', closeLinkAccountModal);
DOM.linkAccountCancelBtn.addEventListener('click', closeLinkAccountModal);
DOM.confirmLinkAccountBtn.addEventListener('click', handleLinkAccount);

// =============== CORE LOGIC & UI FUNCTIONS ===============

// --- NEW FUNCTION: `calculateRealTScoreParams` ---
/**
 * Fetches all user scores for a given test from Firebase and calculates
 * the real mean (mu) and standard deviation (sigma) for each battery.
 * @param {string} testId The unique ID of the test.
 * @returns {Promise<object>} An object with the calculated parameters, structured like T_SCORE_PARAMS.
 */
async function calculateRealTScoreParams(testId) {
    if (!db) {
        console.warn("Firestore is not initialized. Falling back to simulated scores.");
        return T_SCORE_PARAMS;
    }

    try {
        const scoresRef = db.collection('testAggregates').doc(testId).collection('scores');
        const snapshot = await scoresRef.get();

        if (snapshot.empty) {
            console.warn("No aggregate data found for this test. Falling back to simulated scores.");
            return T_SCORE_PARAMS;
        }

        const populationScores = {}; // e.g., { "Memory Test": [5, 6, 4, 5], "Depth Perception": [2, 2, 1, 2] }
        snapshot.forEach(doc => {
            const data = doc.data().scores;
            for (const batteryName in data) {
                if (!populationScores[batteryName]) {
                    populationScores[batteryName] = [];
                }
                populationScores[batteryName].push(data[batteryName]);
            }
        });

        const realParams = {};
        for (const batteryName in populationScores) {
            const scoresArray = populationScores[batteryName];
            const n = scoresArray.length;

            if (n > 0) {
                const sum = scoresArray.reduce((a, b) => a + b, 0);
                const mean = sum / n;
                
                // Standard deviation requires at least 2 data points.
                // If only one person has taken the test, we use a default sigma of 1.
                let stdDev = 1;
                if (n > 1) {
                    // Calculate sample standard deviation (more accurate for samples of a population)
                    stdDev = Math.sqrt(scoresArray.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / (n - 1));
                }

                realParams[batteryName] = { 
                    mu: mean, 
                    // Ensure sigma is not zero to avoid division by zero errors.
                    sigma: stdDev === 0 ? 1 : stdDev 
                };
            }
        }
        console.log("Successfully calculated real T-Score parameters:", realParams);
        return realParams;

    } catch (error) {
        console.error("Error calculating real T-Score params. Falling back to simulated scores.", error);
        return T_SCORE_PARAMS;
    }
}


function buildFlatNavigation() {
    flatNavigationSteps = [];
    batteries.forEach((battery, batteryI) => {
        const isMemoryTest = battery.groupName === "Memory Test";

        flatNavigationSteps.push({
            batteryIndex: batteryI,
            phase: 'instruction',
            page: null,
            name: `${battery.name.en} (Instr)`
        });

        if (battery.studyTime > 0) {
            flatNavigationSteps.push({
                batteryIndex: batteryI,
                phase: 'study',
                page: null,
                name: `${battery.name.en} (Study)`
            });
        }

        const totalPages = isMemoryTest ? 1 : Math.ceil(battery.questions.length / battery.questionsPerPage);
        for (let pageI = 0; pageI < totalPages; pageI++) {
            flatNavigationSteps.push({
                batteryIndex: batteryI,
                phase: 'test',
                page: pageI,
                name: `${battery.name.en} (Page ${pageI + 1})`
            });
        }

        if (battery.breakTime > 0 && batteryI < batteries.length - 1) {
            flatNavigationSteps.push({
                batteryIndex: batteryI,
                phase: 'break',
                page: null,
                name: `Break`
            });
        }
    });
}


function navigateToStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= flatNavigationSteps.length) return;

    currentStepIndex = stepIndex;
    const currentStepDetails = flatNavigationSteps[currentStepIndex];

    currentBatteryIndex = currentStepDetails.batteryIndex;
    currentPage = (currentStepDetails.phase === 'test') ? currentStepDetails.page : 0;
    currentMobileQIndex = 0;

    if (!allUserAnswers[currentBatteryIndex]) {
        userAnswers = new Array(batteries[currentBatteryIndex].questions.length).fill(null);
        allUserAnswers[currentBatteryIndex] = userAnswers;
    } else {
        userAnswers = allUserAnswers[currentBatteryIndex];
    }

    document.querySelectorAll('.battery-tab').forEach((tab) => {
        const tabStepDetails = flatNavigationSteps[parseInt(tab.dataset.stepIndex, 10)];
        let isActive = false;

        if (tabStepDetails.batteryIndex === currentStepDetails.batteryIndex) {
            if (currentStepDetails.phase === 'test' && tabStepDetails.phase === 'test') {
                isActive = true;
            } else if (currentStepDetails.phase !== 'test' && tabStepDetails.phase === currentStepDetails.phase) {
                isActive = true;
            }
        }
        tab.classList.toggle('active', isActive);
    });

    const activeTab = document.querySelector('.battery-tab.active');
    if (activeTab) {
        activeTab.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }

    updateProgressBar();
    runPhase(currentStepDetails.phase);
}

function updateProgressBar() {
    const progress = flatNavigationSteps.length > 1 ? (currentStepIndex / (flatNavigationSteps.length - 1)) * 100 : 100;
    DOM.progressBar.style.width = `${progress}%`;
}


function runTimer(duration, onCompleteCallback) {
    clearInterval(timer);
    // Reset styles directly when a new timer starts
    DOM.timerDisplay.style.color = ''; // Reverts to the default stylesheet color
    DOM.timerDisplay.classList.remove('timer-blinking');

    timeLeft = duration;
    onTimerComplete = onCompleteCallback;

    const updateDisplay = () => {
        if (timeLeft < 0) return;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        DOM.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // --- UPDATED WARNING LOGIC ---
        if (timeLeft <= 10 && timeLeft >= 0 && currentPhase !== 'break') {
            DOM.timerDisplay.style.color = '#fff'; // Directly set color to red
            DOM.timerDisplay.style.backgroundColor = 'red';
            DOM.timerDisplay.classList.add('timer-blinking');
        } else {
            DOM.timerDisplay.style.color = ''; // Revert to default color
            DOM.timerDisplay.style.backgroundColor = '';
            DOM.timerDisplay.classList.remove('timer-blinking');
        }
        // --- END OF LOGIC ---
    };

    updateDisplay(); // Call once immediately to set initial state

    timer = setInterval(() => {
        timeLeft--;
        updateDisplay();
        if (timeLeft < 0) {
            clearInterval(timer);
            // Final cleanup when timer finishes
            DOM.timerDisplay.style.color = '';
            DOM.timerDisplay.classList.remove('timer-blinking');
            if (typeof onTimerComplete === 'function') onTimerComplete();
        }
    }, 1000);
}

function manageFooterButtons(visibleButtons = []) {
    DOM.skipFooter.style.display = visibleButtons.length > 0 ? 'flex' : 'none';
    const allButtons = [DOM.mainProceedBtn, DOM.startExamBtn, DOM.viewResultFinalBtn, DOM.clearResponseBtn, DOM.prevPageBtn, DOM.nextPageBtn, DOM.submitBatteryBtn, DOM.skipBtn];
    allButtons.forEach(btn => btn.style.display = 'none');
    visibleButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) btn.style.display = 'block';
    });
}

function handleKeyPress(event) {
    // Yeh function tabhi kaam karega jab test screen active ho
    if (!DOM.testScreen.classList.contains('active')) return;

    // event.key ko lowercase mein convert karein taaki 'c' aur 'C' dono kaam karein
    const key = event.key.toLowerCase();

    // Arrow Keys for Navigation aur 'c' Clear ke liye
    switch (key) {
        case 'arrowright':
            if (DOM.nextPageBtn && DOM.nextPageBtn.style.display !== 'none' && !DOM.nextPageBtn.disabled) {
                DOM.nextPageBtn.click();
            }
            break;
        case 'arrowleft':
            if (DOM.prevPageBtn && DOM.prevPageBtn.style.display !== 'none' && !DOM.prevPageBtn.disabled) {
                DOM.prevPageBtn.click();
            }
            break;
        case 'c': // Clear Response ke liye naya case
            if (DOM.clearResponseBtn && DOM.clearResponseBtn.style.display !== 'none') {
                DOM.clearResponseBtn.click();
            }
            break;
    }

    // Number Keys for Options (1, 2, 3, 4, 5...)
    const optionNumber = parseInt(event.key, 10);
    if (!isNaN(optionNumber) && optionNumber >= 1 && optionNumber <= 5) { // Maan lijiye max 5 options hain
        const optionIndex = optionNumber - 1;
        const currentQuestionBlock = document.querySelector('.question-block:not(.hidden-question)');
        
        if (currentQuestionBlock) {
            const questionIndex = currentQuestionBlock.dataset.questionIndex;
            const radioButtons = document.querySelectorAll(`input[name="q${questionIndex}"]`);
            if (radioButtons[optionIndex]) {
                radioButtons[optionIndex].checked = true;
                saveCurrentAnswers(); // Answer ko save karein
            }
        }
    }
}

function runPhase(phase, options = {}) {
    clearInterval(timer);
    clearInterval(saveInterval);
    currentPhase = phase;
    window.removeEventListener('keydown', handleKeyPress);
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    const isTestInProgress = ['instruction', 'study', 'test', 'break'].includes(phase);
    DOM.body.classList.toggle('test-in-progress', isTestInProgress);
    
    if (phase !== 'test' && DOM.mobileTestSidebarToggle) {
        DOM.mobileTestSidebarToggle.style.display = 'none';
        if (document.body.classList.contains('mobile-test-sidebar-open')) {
            toggleMobileTestSidebar(false);
        }
    }
    if (phase !== 'solution' && DOM.mobileSidebarToggle) {
        DOM.mobileSidebarToggle.style.display = 'none';
    }


    const battery = batteries[currentBatteryIndex];
    const durationFromOptions = (options.restoredTime !== undefined) ? options.restoredTime : null;

    switch (phase) {
        case 'initial':
            DOM.examProperScreen.classList.remove('active');
            DOM.mainInstructionScreen.classList.add('active');
            manageFooterButtons(['main-proceed-btn']);
            DOM.mainProceedBtn.disabled = !DOM.consentCheckbox.checked;
            break;
        case 'welcome':
            DOM.mainInstructionScreen.classList.remove('active');
            DOM.examProperScreen.classList.add('active');
            DOM.welcomeScreen.classList.add('active');
            document.querySelectorAll('#welcome-screen [data-lang]').forEach(el => {
                el.style.display = el.dataset.lang === currentLanguage ? 'block' : 'none';
            });
            manageFooterButtons(['start-exam-btn']);
            break;
        case 'instruction':
        case 'study':
            DOM.examProperScreen.classList.add('active');
            DOM.phaseScreen.classList.add('active');
            let title, content;
            if (phase === 'instruction') {
                title = currentLanguage === 'hi' ? 'निर्देश' : 'Instructions';
                content = battery.instructions[currentLanguage];
                if (battery.layout === 'split-view') {
                    content += `<br><br><img src="${battery.image}" alt="Reference Image" data-no-lightbox="true" style="max-width:300px; display:block; margin:auto;">`;
                }
                duration = durationFromOptions !== null ? durationFromOptions : battery.instructionTime;
            } else { // study
                title = currentLanguage === 'hi' ? 'अध्ययन पृष्ठ' : 'Study Page';
                content = battery.studyContent(currentLanguage);
                duration = durationFromOptions !== null ? durationFromOptions : battery.studyTime;
            }
            document.getElementById('phase-title').textContent = title;
            document.getElementById('phase-content').innerHTML = content;
            manageFooterButtons(['skip-btn']);
            runTimer(duration, () => {
                const nextStepIndex = findNextPhaseStep(currentStepIndex, ['study', 'test']);
                navigateToStep(nextStepIndex);
            });
            saveInterval = setInterval(saveState, 30000);
            break;
        case 'break':
            DOM.examProperScreen.classList.add('active');
            DOM.phaseScreen.classList.add('active');
            let breakContentHTML = '';
            if (analysisPendingForBreak) {
                breakContentHTML += generateBreakPageAnalysisHtml();
            } else {
                breakContentHTML = `<p style="text-align:center; margin-top:15px;">Your break timer is running below.</p>`;
            }
            document.getElementById('phase-title').textContent = currentLanguage === 'hi' ? 'विश्लेषण और ब्रेक' : 'Analysis & Break';
            document.getElementById('phase-content').innerHTML = breakContentHTML;
            const breakDuration = durationFromOptions !== null ? durationFromOptions : battery.breakTime;
            manageFooterButtons(['skip-btn']);
            runTimer(breakDuration, () => navigateToStep(currentStepIndex + 1));
            saveInterval = setInterval(saveState, 30000);
            break;
        case 'test':
            DOM.examProperScreen.classList.add('active');
            DOM.testScreen.classList.add('active');
             window.addEventListener('keydown', handleKeyPress);
              if (isMobileView && DOM.mobileTestSidebarToggle) {
                DOM.mobileTestSidebarToggle.style.display = 'flex';
            }
            renderTestPage();
            const testDuration = durationFromOptions !== null ? durationFromOptions : battery.testTime;
            runTimer(testDuration, performSubmit);
            saveInterval = setInterval(saveState, 30000);
            break;
        case 'final_results':
            DOM.body.classList.remove('test-in-progress');
            showFinalResults();
            break;
    }
    updateHeaderControls();
    manageScrollListener();
    if (phase !== 'initial') {
        saveState();
    }
}

function setSplitViewPanePosition() {
    const pane = document.querySelector('.split-view-static-pane');
    if (!pane) return;
    const headerHeight = DOM.examHeader.offsetHeight;
    const tabsHeight = DOM.batteryTabsContainer.offsetHeight;
    const topOffset = headerHeight + tabsHeight + 25; // 25px margin
    pane.style.top = `${topOffset}px`;
}

function renderMobileTestSidebar() {
    if (!isMobileView || !DOM.mobileTestSidebar) {
        if (DOM.mobileTestSidebar) DOM.mobileTestSidebar.innerHTML = '';
        return;
    }
    const battery = batteries[currentBatteryIndex];
    const answers = allUserAnswers[currentBatteryIndex] || [];
    const total = battery.questions.length;
    const attempted = answers.filter(a => a !== null && a !== undefined).length;
    const skipped = total - attempted;

    let sidebarHTML = `
        <div class="mobile-sidebar-section">
            <h4>Stats</h4>
            <div class="mobile-test-stats">
                <p>Total: <span class="stat-value">${total}</span></p>
                <p>Attempted: <span class="stat-value">${attempted}</span></p>
                <p>Skipped: <span class="stat-value">${skipped}</span></p>
                <p>Unseen: <span class="stat-value">${skipped}</span></p>
            </div>
        </div>
        <div class="mobile-sidebar-section">
             <div class="mobile-sidebar-toggle-control">
                <span><b>View Qns.(One/All)</b></span>
                <label class="switch">
                    <input type="checkbox" id="one-by-one-toggle" ${isOneByOneMode ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
        </div>
        <div class="mobile-sidebar-section">
            <h4>Question Map</h4>
            <div class="mobile-question-nav">
                ${battery.questions.map((q, i) => {
                    const isAttempted = answers[i] !== null && answers[i] !== undefined;
                    const isCurrent = isOneByOneMode && i === currentMobileQIndex;
                    return `<button class="mobile-jump-btn ${isAttempted ? 'attempted' : 'unseen'} ${isCurrent ? 'current' : ''}" data-q-index="${i}">${i + 1}</button>`;
                }).join('')}
            </div>
        </div>
        <div id="mobile-submit-btn-container" class="mobile-sidebar-section">
            <button id="mobile-submit-btn">Submit Battery</button>
        </div>
    `;

    DOM.mobileTestSidebar.innerHTML = sidebarHTML;

    // Add event listeners
    document.getElementById('one-by-one-toggle').addEventListener('change', (e) => {
        isOneByOneMode = e.target.checked;
        renderTestPage();
    });

    document.querySelectorAll('.mobile-jump-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentMobileQIndex = parseInt(e.target.dataset.qIndex, 10);
            if (!isOneByOneMode) {
                isOneByOneMode = true;
            }
            renderTestPage();
            toggleMobileTestSidebar(false);
        });
    });

    const mobileSubmitBtn = document.getElementById('mobile-submit-btn');
    if (mobileSubmitBtn) mobileSubmitBtn.addEventListener('click', userSubmitBattery);
}


function renderTestPage() {
    const battery = batteries[currentBatteryIndex];
    DOM.body.classList.toggle('mobile-view', isMobileView);
    DOM.body.classList.toggle('one-by-one-active', isMobileView && isOneByOneMode);


    if (isMobileView) {
        if (DOM.mobileTestSidebarToggle) DOM.mobileTestSidebarToggle.style.display = 'flex';
        renderMobileTestSidebar();
    } else {
        if (DOM.mobileTestSidebarToggle) DOM.mobileTestSidebarToggle.style.display = 'none';
    }

    let questionsHtml = '';
    let pageQuestions;
    let startIndex = 0;

    if (isMobileView) {
        pageQuestions = battery.questions;
    } else {
        const isMemoryTest = battery.groupName === "Memory Test";
        let questionsPerPage = isMemoryTest ? battery.questions.length : battery.questionsPerPage;
        startIndex = currentPage * questionsPerPage;
        pageQuestions = battery.questions.slice(startIndex, startIndex + questionsPerPage);
    }

    questionsHtml = pageQuestions.map((q, i) => {
        const questionIndexInBattery = isMobileView ? i : startIndex + i;
        const questionText = q.text[currentLanguage] || q.text['en'];
        const options = (currentLanguage === 'hi' && q.options_hi) ? q.options_hi : q.options;
        const values = q.options;
        let optionsHtml = options.map((opt, optIndex) => {
            const val = typeof values[optIndex] === 'string' ? `'${values[optIndex]}'` : values[optIndex];
            return `<label><input type="radio" name="q${questionIndexInBattery}" value=${val}> ${opt}</label>`;
        }).join('');

        const isHidden = isMobileView && isOneByOneMode && (questionIndexInBattery !== currentMobileQIndex);

        return `<div class="question-block ${isHidden ? 'hidden-question' : ''}" data-question-index="${questionIndexInBattery}">
                    <div class="question-text"><strong>Q ${questionIndexInBattery + 1}:</strong> ${questionText}</div>
                    <div class="options-group">${optionsHtml}</div>
                </div>`;
    }).join('');

    let finalHtml;
    if (isMobileView && battery.layout === 'split-view' && battery.image) {
        finalHtml = `<div id="mobile-split-view-image-container"><img src="${battery.image}" alt="Reference Image"></div>` + questionsHtml;
    } else if (!isMobileView && battery.layout === 'split-view') {
        finalHtml = `<div class="split-view-container">
            <div class="split-view-static-pane">
                <img src="${battery.image}" alt="Reference Image">
            </div>
            <div class="split-view-scroll-pane">
                ${questionsHtml}
            </div>
        </div>`;
    } else {
        finalHtml = questionsHtml;
    }

    DOM.testScreen.innerHTML = `<div id="test-question-area">${finalHtml}</div>`;

    if (!isMobileView && battery.layout === 'split-view') {
        setSplitViewPanePosition();
    }

    pageQuestions.forEach((q, i) => {
        const questionIndex = isMobileView ? i : startIndex + i;
        const answer = userAnswers[questionIndex];
        if (answer !== null && answer !== undefined) {
            const val = typeof answer === 'string' ? `'${answer}'` : answer;
            const radio = document.querySelector(`input[name="q${questionIndex}"][value=${val}]`);
            if (radio) radio.checked = true;
        }
    });

    // --- REWRITTEN FOOTER LOGIC ---
    if (isMobileView) {
        DOM.nextPageBtn.textContent = 'Next';
        DOM.prevPageBtn.textContent = 'Previous';
        const buttonsToShow = ['clear-response-btn'];
        const mobileSubmitBtn = document.getElementById('mobile-submit-btn');
        
        if (mobileSubmitBtn) mobileSubmitBtn.style.display = 'block';

        if (isOneByOneMode) {
            if (currentMobileQIndex > 0) {
                buttonsToShow.push('prev-page-btn');
            }
            if (currentMobileQIndex < battery.questions.length - 1) {
                buttonsToShow.push('next-page-btn');
            } else {
                buttonsToShow.push('submit-battery-btn');
                if (mobileSubmitBtn) mobileSubmitBtn.style.display = 'none';
            }
        } else {
            buttonsToShow.push('submit-battery-btn');
            if (mobileSubmitBtn) mobileSubmitBtn.style.display = 'none';
        }
        manageFooterButtons(buttonsToShow);
    } else {
        DOM.nextPageBtn.textContent = 'Next Page';
        const buttonsToShow = ['clear-response-btn'];
        const prevStep = flatNavigationSteps[currentStepIndex - 1];
        const nextStep = flatNavigationSteps[currentStepIndex + 1];
        if (prevStep && prevStep.phase === 'test' && prevStep.batteryIndex === currentBatteryIndex) {
            buttonsToShow.push('prev-page-btn');
        }
        if (nextStep && nextStep.phase === 'test' && nextStep.batteryIndex === currentBatteryIndex) {
            buttonsToShow.push('next-page-btn');
        }
        if (!nextStep || nextStep.batteryIndex !== currentBatteryIndex || nextStep.phase !== 'test') {
            buttonsToShow.push('submit-battery-btn');
        }
        manageFooterButtons(buttonsToShow);
    }
}

async function saveInitialTestStatus() {
    try {
        const userData = await getUserData();
        if (userData) {
            if (!userData.testStatuses) userData.testStatuses = {};
            userData.testStatuses[uniqueTestId] = 'in_progress';
            await saveUserData(userData);
            console.log("Initial test status saved in the background.");
        }
    } catch (error) {
        console.error("Background save of initial status failed:", error);
    }
}

function startExam() {
    saveInitialTestStatus();
    DOM.welcomeScreen.style.display = 'none';
    DOM.stickyContainer.style.display = 'block';
    DOM.examProperScreen.classList.add('active');
    buildFlatNavigation();
    buildTabs();
}

function saveCurrentAnswers() {
    if (currentPhase !== 'test') return;

    if (isMobileView && isOneByOneMode) {
        const questionIndex = currentMobileQIndex;
        const selected = document.querySelector(`input[name="q${questionIndex}"]:checked`);
        if (selected) {
            userAnswers[questionIndex] = parseAnswerValue(selected.value);
        }
    } else {
        const questionBlocks = DOM.testScreen.querySelectorAll('.question-block:not(.hidden-question)');
        questionBlocks.forEach(block => {
            const questionIndex = parseInt(block.dataset.questionIndex, 10);
            const selected = block.querySelector(`input[name="q${questionIndex}"]:checked`);
            if (selected) {
                userAnswers[questionIndex] = parseAnswerValue(selected.value);
            }
        });
    }
    allUserAnswers[currentBatteryIndex] = userAnswers;
    if (isMobileView) renderMobileTestSidebar();
}

function parseAnswerValue(value) {
    if (value === "Yes" || value === "No" || value.startsWith("'")) {
        return value.replace(/'/g, '');
    }
    return !isNaN(parseFloat(value)) && isFinite(value) ? parseFloat(value) : value;
}


function showPreResultScreen() {
    currentPhase = 'pre_result';
    clearInterval(timer);
    clearInterval(saveInterval);
    DOM.body.classList.add('test-in-progress');

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    DOM.examProperScreen.classList.add('active');
    DOM.phaseScreen.classList.add('active');

    const lastStepTab = document.querySelector(`.battery-tab[data-step-index="${findLastIndex(flatNavigationSteps, s => s.phase === 'test' && s.batteryIndex === currentBatteryIndex)}"]`);
    if (lastStepTab) lastStepTab.classList.add('active');


    let contentHTML = ``;
    // Pass the fallback params here, as the real calculation happens on the final results screen.
    const finalResults = getCombinedResults(false, T_SCORE_PARAMS);
    finalResults.forEach(result => {
        if (!result) return;
        const headers = ['Total', 'Attempted', 'Score', 'Incorrect', 'Skipped', 'Status'];
        contentHTML += `<div class="responsive-table-wrapper" style="margin-bottom: 25px;">
                    <h4>${result.name_en} - Analysis</h4>
                    <table class="analysis-table">
                        <thead><tr><th>${headers.join('</th><th>')}</th></tr></thead>
                        <tbody><tr>
                            <td>${result.total}</td>
                            <td>${result.attempted}</td>
                            <td>${result.correct}</td>
                            <td>${result.incorrect}</td>
                            <td>${result.skipped}</td>
                            <td><span style="color:${result.status === 'Qualified' ? 'var(--success-color)' : 'var(--danger-color)'}; font-weight: bold;">${result.status}</span></td>
                        </tr></tbody>
                    </table>
                 </div>`;
    });

    document.getElementById('phase-title').textContent = "Test Submitted";
    document.getElementById('phase-content').innerHTML = contentHTML;
    manageFooterButtons(['view-result-final-btn']);
}


async function performSubmit() {
    clearInterval(timer);
    clearInterval(saveInterval);
    saveCurrentAnswers();

    if (!allBatteryResults[currentBatteryIndex]) {
        const result = calculateResult(batteries[currentBatteryIndex], userAnswers);
        allBatteryResults[currentBatteryIndex] = result;
    }
    if (isMobileView && document.body.classList.contains('mobile-test-sidebar-open')) {
        toggleMobileTestSidebar(false);
    }

    analysisPendingForBreak = true;

    const lastTestStepForBattery = findLastIndex(flatNavigationSteps, s => s.batteryIndex === currentBatteryIndex && s.phase === 'test');
    const nextStepIndex = lastTestStepForBattery + 1;

    if (nextStepIndex >= flatNavigationSteps.length) {
        await saveCompletedTest();
        showPreResultScreen();
    } else {
        navigateToStep(nextStepIndex);
    }
}

function userSubmitBattery() {
    const title = currentLanguage === 'hi' ? 'सबमिशन की पुष्टि करें' : 'Confirm Submission';
    const body = currentLanguage === 'hi' ? 'क्या आप वाकई यह बैटरी सबमिट करना चाहते हैं? इस क्रिया को बदला नहीं जा सकता।' : 'Are you sure you want to submit this battery? This action cannot be undone.';
    
    openConfirmModal(title, body, performSubmit);
}


function calculateResult(battery, answers) {
    let correct = 0,
        attempted = 0;
    (answers || []).forEach((ans, i) => {
        if (ans !== null && ans !== undefined) {
            attempted++;
            const question = battery.questions[i];
            const correctLetter = question.correct;
            const correctIndex = correctLetter.charCodeAt(0) - 'a'.charCodeAt(0);
            if (correctIndex >= 0 && correctIndex < question.options.length) {
                const correctValue = question.options[correctIndex];
                if (ans == correctValue) {
                    correct++;
                }
            }
        }
    });
    return {
        name_en: battery.name['en'],
        name_hi: battery.name['hi'],
        groupName: battery.groupName || null,
        total: battery.questions.length,
        attempted,
        correct,
        incorrect: attempted - correct,
        skipped: battery.questions.length - attempted,
        accuracy: attempted > 0 ? ((correct / attempted) * 100).toFixed(2) : 0,
    };
}

function generateBreakPageAnalysisHtml() {
    let html = `<div class="highlight-note" style="margin-bottom: 20px;">
        <strong>${currentLanguage === 'hi' ? 'ध्यान दें' : 'Please Note'}:</strong>
        <span data-lang-exam="hi">यह स्टेटस आपके कच्चे स्कोर पर आधारित है। वास्तविक टी-स्कोर अंतिम परिणाम पृष्ठ पर उत्पन्न होगा।</span>
        <span data-lang-exam="en">This status is based on your raw score. The real T-Score will be generated on the final result page.</span>
    </div>`;

    html += ``;
    // Use fallback params for the break page analysis
    const currentResults = getCombinedResults(true, T_SCORE_PARAMS);

    currentResults.forEach(result => {
        if (!result) return;
        const headers = ['Total', 'Attempted', 'Score', 'Incorrect', 'Skipped', 'Status'];
        html += `<div class="responsive-table-wrapper" style="margin-bottom: 25px;">
                    <h4>${result.name_en} - Analysis</h4>
                    <table class="analysis-table">
                        <thead><tr><th>${headers.join('</th><th>')}</th></tr></thead>
                        <tbody><tr>
                            <td>${result.total}</td>
                            <td>${result.attempted}</td>
                            <td>${result.correct}</td>
                            <td>${result.incorrect}</td>
                            <td>${result.skipped}</td>
                            <td><span style="color:${result.status === 'Qualified' ? 'var(--success-color)' : 'var(--danger-color)'}; font-weight: bold;">${result.status}</span></td>
                        </tr></tbody>
                    </table>
                 </div>`;
    });


    html += `<p style="text-align:center; margin-top:15px;">Your break timer is running below.</p>`;

    setTimeout(() => {
        document.querySelectorAll('.highlight-note [data-lang-exam]').forEach(el => {
            el.style.display = el.dataset.langExam === currentLanguage ? 'inline' : 'none';
        });
    }, 0);
    return html;
}

// MODIFIED FUNCTION: `getCombinedResults`
// It now accepts a `tScoreParams` object. If none is provided, it uses the fallback.
function getCombinedResults(intermediate = false, tScoreParams = T_SCORE_PARAMS) {
    const combinedResults = [];
    const processedGroups = new Set();

    let batteriesToProcess = intermediate ?
        batteries.slice(0, currentBatteryIndex + 1) :
        batteries;

    if (!intermediate) batteriesToProcess = batteries;

    batteriesToProcess.forEach((battery, index) => {
        const result = allBatteryResults[index];
        if (!result) return;

        if (!battery.groupName) {
            if (!combinedResults.find(cr => cr.name_en === result.name_en)) {
                combinedResults.push(result);
            }
        } else if (!processedGroups.has(battery.groupName)) {
            const groupName = battery.groupName;
            const groupBatteriesIndices = batteries.map((b, i) => b.groupName === groupName ? i : -1).filter(i => i !== -1);
            const groupBatteriesResults = groupBatteriesIndices.map(i => allBatteryResults[i]).filter(r => r);

            if (groupBatteriesResults.length > 0) {
                const combined = groupBatteriesResults.reduce((acc, r) => {
                    acc.total += r.total;
                    acc.attempted += r.attempted;
                    acc.correct += r.correct;
                    acc.incorrect += r.incorrect;
                    acc.skipped += r.skipped;
                    return acc;
                }, {
                    name_en: groupName,
                    name_hi: batteries[groupBatteriesIndices[0]].name.hi.replace(/ भाग \d+/, "").replace(/ Part \d+/, ""),
                    groupName: groupName,
                    total: 0,
                    attempted: 0,
                    correct: 0,
                    incorrect: 0,
                    skipped: 0
                });
                combined.accuracy = combined.attempted > 0 ? ((combined.correct / combined.attempted) * 100).toFixed(2) : 0;
                combinedResults.push(combined);
                processedGroups.add(groupName);
            }
        }
    });


    return combinedResults.map(result => {
        let tScore = "N/A",
            status = "N/A";
        // This line is now dynamic. It uses the passed `tScoreParams` object.
        const params = tScoreParams[result.name_en];
        if (params && result.total > 0) {
            const rawScore = result.correct;
            const sigma = params.sigma === 0 ? 1 : params.sigma;
            const calculatedTScore = (50 + 10 * ((rawScore - params.mu) / sigma));
            tScore = isNaN(calculatedTScore) ? "N/A" : calculatedTScore.toFixed(2);
            if (tScore !== "N/A") {
                status = parseFloat(tScore) >= 42 ? 'Qualified' : 'Failed';
            }
        }
        return { ...result,
            tScore,
            status
        };
    });
}

// MODIFIED FUNCTION: `showFinalResults`
// It is now an `async` function to wait for the real T-Score calculation.
async function showFinalResults() {
    currentPhase = 'final_results';
    DOM.mainInstructionScreen.classList.remove('active');
    DOM.examProperScreen.classList.add('active');
    document.querySelectorAll('#exam-proper .screen').forEach(s => s.classList.remove('active'));
    DOM.finalResultScreen.classList.add('active');
    DOM.progressBar.style.width = '100%';
    DOM.finalResultTitle.textContent = "Exam Finished";
    manageFooterButtons([]);
    DOM.stickyContainer.style.display = 'none';
    manageScrollListener();

    // --- NEW LOGIC: Calculate real T-Score before rendering ---
    showToast("Calculating real T-Score based on peer performance...");
    // 1. Calculate the real parameters from Firebase data.
    const realTScoreParams = await calculateRealTScoreParams(uniqueTestId);
    // 2. Pass these real parameters to the results calculation function.
    const finalResults = getCombinedResults(false, realTScoreParams);
    
    // The rest of the function remains the same, but now uses the `finalResults` with real T-Scores.
    let contentHtml = generateCircularGraphsHtml(finalResults);
    contentHtml += generateFinalReportTable(finalResults);
    contentHtml += generateRawScoreGraph(finalResults);
    contentHtml += generateGraphsHtml(finalResults);
    document.getElementById('final-result-content').innerHTML = contentHtml;

    document.querySelectorAll('.analysis-table .clickable-row').forEach(row => {
        row.addEventListener('click', () => {
            const batteryName = row.dataset.batteryName;
            const resultData = finalResults.find(r => r.name_en === batteryName);
            if (resultData) {
                showBatteryStatsModal(resultData);
            }
        });
    });

    updateHeaderControls();
}

function generateFinalReportTable(results) {
    const headers = ['Battery Name', 'Raw Score', 'Correct', 'Incorrect', 'Skipped', 'Accuracy', 'T-Score', 'Status'];
    let tableHTML = `<h2>Detailed Report</h2><div class="responsive-table-wrapper"><table class="analysis-table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
    results.forEach((result, index) => {
        tableHTML += `<tr class="clickable-row" data-battery-name="${result.name_en}" title="Click to see detailed stats">
            <td class="battery-name-cell">${result.name_en}</td>
            <td>${result.correct} / ${result.total}</td>
            <td>${result.correct}</td>
            <td>${result.incorrect}</td>
            <td>${result.skipped}</td>
            <td>${result.accuracy}%</td>
            <td>${result.tScore}</td>
            <td><span style="color:${result.status === 'Qualified' ? 'var(--success-color)' : 'var(--danger-color)'}; font-weight: bold;">${result.status}</span></td>
        </tr>`;
    });
    tableHTML += `</tbody></table></div>`;
    return tableHTML;
}

function generateRawScoreGraph(results) {
    let graphHtml = `<div class="graph-container-wrapper">
        <div class="graph-container" style="width:100%">
            <h3>Raw Score (Correct Answers)</h3>
            <div class="bar-chart">`;

    results.forEach(item => {
        const percentage = item.total > 0 ? (item.correct / item.total) * 100 : 0;
        graphHtml += `
            <div class="bar-row">
                <div class="bar-label">${item.name_en.replace(' ', '<br>')}</div>
                <div class="bar-wrapper">
                    <div class="bar correct" style="width: ${percentage.toFixed(2)}%;">
                        <span>${item.correct} / ${item.total}</span>
                    </div>
                </div>
            </div>`;
    });

    graphHtml += `</div></div></div>`;
    return graphHtml;
}


function generateCircularGraphsHtml(results) {
    const validTScoreResults = results.filter(r => r.tScore !== "N/A");
    const overallAccuracy = results.length > 0 ? (results.reduce((acc, r) => acc + parseFloat(r.accuracy), 0) / results.length).toFixed(2) : 0;
    const avgTScore = validTScoreResults.length > 0 ? (validTScoreResults.reduce((acc, r) => acc + parseFloat(r.tScore), 0) / validTScoreResults.length).toFixed(2) : "--";
    return `<div class="overall-stats-container">
        <div class="stat-circle"><div class="stat-value">${avgTScore}</div><div class="stat-label">Avg. T-Score</div></div>
        <div class="stat-circle"><div class="stat-value">${overallAccuracy}%</div><div class="stat-label">Overall Accuracy</div></div>
    </div>`;
}

function generateGraphsHtml(results) {
    const tScoreData = results.map(r => ({
        label: r.name_en.replace(' ', '<br>'),
        value: parseFloat(r.tScore) || 0,
        class: (parseFloat(r.tScore) || 0) >= 42 ? 'correct' : 'incorrect'
    }));
    const maxTScore = 100;
    let tScoreHtml = tScoreData.map(item => `
        <div class="bar-row">
            <div class="bar-label">${item.label}</div>
            <div class="bar-wrapper">
                <div class="bar ${item.class}" style="width: ${((item.value / maxTScore) * 100).toFixed(2)}%;">
                    <span>${item.value.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `).join('');
    return `<div class="graph-container-wrapper">
        <div class="graph-container" style="width:100%">
            <h3>T-Score Analysis (Min. 42 to Qualify)</h3>
            <div class="bar-chart">${tScoreHtml}</div>
        </div>
    </div>`;
}


// =============== UTILITY & OTHER FUNCTIONS ===============
function changeLanguage(lang, showNotification = false) {
    currentLanguage = lang;
    document.querySelectorAll('.lang-switcher-dropdown').forEach(sel => sel.value = lang);

    const isExamPhase = ['instruction', 'study', 'test'].includes(currentPhase);

    if (isExamPhase) {
        if (currentPhase === 'test') {
            renderTestPage(); 
        } else {
            const battery = batteries[currentBatteryIndex];
            let title, content;
            if (currentPhase === 'instruction') {
                title = lang === 'hi' ? 'निर्देश' : 'Instructions';
                content = battery.instructions[lang];
                 if (battery.layout === 'split-view') {
                    content += `<br><br><img src="${battery.image}" alt="Reference Image" data-no-lightbox="true" style="max-width:300px; display:block; margin:auto;">`;
                }
            } else { // study
                title = lang === 'hi' ? 'अध्ययन पृष्ठ' : 'Study Page';
                content = battery.studyContent(lang);
            }
            document.getElementById('phase-title').textContent = title;
            document.getElementById('phase-content').innerHTML = content;
        }
    } else if (DOM.solutionScreen.classList.contains('active')) {
        buildSolutionNav();
        renderSolutionForBattery(currentSolutionBatteryIndex);
    } else if (DOM.finalResultScreen.classList.contains('active')) {
    } else {
        document.querySelectorAll('[data-lang-instruction]').forEach(el => {
            el.style.display = el.dataset.langInstruction === lang ? 'block' : 'none';
        });
        document.querySelectorAll('[data-lang-exam]').forEach(el => {
            el.style.display = el.dataset.langExam === lang ? 'block' : 'none';
        });
    }

    if (showNotification) {
        showToast(lang === 'hi' ? 'भाषा बदल दी गई है।' : 'Language has been changed.');
    }
    saveState();
}


function updateHeaderControls() {
    const isExamStarted = DOM.examProperScreen.classList.contains('active');
    const isFinalResultScreen = DOM.finalResultScreen.classList.contains('active');
    const isSolutionScreen = DOM.solutionScreen.classList.contains('active');
    const isWelcomeScreen = DOM.welcomeScreen.classList.contains('active');

    const showTimer = isExamStarted && !isFinalResultScreen && !isSolutionScreen && !isWelcomeScreen;
    DOM.timerDisplay.style.display = showTimer ? 'block' : 'none';

    const showPause = ['instruction', 'study', 'test', 'break'].includes(currentPhase);
    const showFullscreen = isExamStarted;
    const showLangSwitcher = isExamStarted && !isFinalResultScreen;

    DOM.pauseBtn.style.display = showPause ? 'block' : 'none';
    DOM.fullscreenBtn.style.display = showFullscreen ? 'block' : 'none';
    DOM.headerLangSwitcher.style.display = showLangSwitcher ? 'block' : 'none';
    DOM.viewSolutionBtn.style.display = isFinalResultScreen ? 'block' : 'none';
    DOM.returnToResultsBtn.style.display = isSolutionScreen ? 'block' : 'none';
    DOM.viewInstructionBtn.style.display = isExamStarted && !isFinalResultScreen && !isSolutionScreen;
}


function manageScrollListener() {
    const shouldDisableScroll = ['instruction', 'study', 'test'].includes(currentPhase) && window.innerWidth > 768;
    window.removeEventListener('wheel', handleScrollAttempt);
    if (shouldDisableScroll) window.addEventListener('wheel', handleScrollAttempt, {
        passive: false
    });
}

function updateScrollArrows() {
    const container = DOM.batteryTabsContainer;
    if (!container) return;
    const isScrollable = container.scrollWidth > container.clientWidth;
    DOM.scrollTabsLeft.style.display = isScrollable ? 'flex' : 'none';
    DOM.scrollTabsRight.style.display = isScrollable ? 'flex' : 'none';
    if (isScrollable) {
        DOM.scrollTabsLeft.disabled = container.scrollLeft <= 0;
        DOM.scrollTabsRight.disabled = container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;
    }
}

function pauseTest() {
    clearInterval(timer);
    DOM.pauseOverlay.style.display = 'flex';
}

function resumeTest() {
    DOM.pauseOverlay.style.display = 'none';
    runTimer(timeLeft, onTimerComplete);
}

function showToast(message) {
    clearTimeout(toastTimer);
    DOM.toastNotification.textContent = message;
    DOM.toastNotification.classList.add('show');
    toastTimer = setTimeout(() => {
        DOM.toastNotification.classList.remove('show');
    }, 3000);
}

function openConfirmModal(title, body, onConfirm) {
    DOM.confirmModalTitle.textContent = title;
    DOM.confirmModalBody.innerHTML = `<p>${body}</p>`; // Use innerHTML to allow for formatted text later
    DOM.confirmModalOverlay.style.display = 'flex';

    // We need to clone the OK button to remove any old event listeners
    const newOkBtn = DOM.confirmOkBtn.cloneNode(true);
    DOM.confirmOkBtn.parentNode.replaceChild(newOkBtn, DOM.confirmOkBtn);
    DOM.confirmOkBtn = newOkBtn; // Update the reference in our DOM object

    DOM.confirmOkBtn.addEventListener('click', () => {
        onConfirm(); // Run the function that was passed in
        closeConfirmModal();
    });
}

function closeConfirmModal() {
    DOM.confirmModalOverlay.style.display = 'none';
}
function openChangePasswordModal() {
    // Clear any previous state
    DOM.currentPasswordInput.value = '';
    DOM.newPasswordInput.value = '';
    DOM.confirmNewPasswordInput.value = '';
    DOM.changePasswordError.style.display = 'none';
    DOM.changePasswordError.textContent = '';
    DOM.userDropdownMenu.classList.remove('show'); // Close the dropdown
    
    DOM.changePasswordModalOverlay.style.display = 'flex';
}

function closeChangePasswordModal() {
    DOM.changePasswordModalOverlay.style.display = 'none';
}
function openLinkAccountModal() {
    DOM.linkEmailInput.value = '';
    DOM.linkPasswordInput.value = '';
    DOM.linkAccountError.style.display = 'none';
    DOM.userDropdownMenu.classList.remove('show');
    DOM.linkAccountModalOverlay.style.display = 'flex';
}

function closeLinkAccountModal() {
    DOM.linkAccountModalOverlay.style.display = 'none';
}
function handleLinkAccount() {
    const email = DOM.linkEmailInput.value;
    const password = DOM.linkPasswordInput.value;
    const errorP = DOM.linkAccountError;

    if (!email || !password) {
        errorP.textContent = 'Email and password are required.';
        errorP.style.display = 'block';
        return;
    }
     if (password.length < 6) {
        errorP.textContent = 'Password must be at least 6 characters long.';
        errorP.style.display = 'block';
        return;
    }

    errorP.style.display = 'none';

    // Create the new email/password credential
    const credential = firebase.auth.EmailAuthProvider.credential(email, password);

    // Link the new credential to the currently signed-in anonymous user
    firebase.auth().currentUser.linkWithCredential(credential)
        .then((usercred) => {
            const user = usercred.user;
            console.log("Anonymous account successfully upgraded. New user:", user);
            closeLinkAccountModal();
            showToast('Account created and progress saved!');
            
            // Update the UI immediately to reflect the new user state
            userEmailDisplay.textContent = user.email;
            DOM.changePasswordBtn.style.display = 'block';
            DOM.linkAccountBtn.style.display = 'none';
        })
       // rdso_manual.js में .catch ब्लॉक का संशोधन
.catch((error) => {
    // डिबगिंग के लिए सटीक कोड और संदेश कंसोल में लॉग करें
    console.error("Link account failed. Code:", error.code, "Message:", error.message); 

    const errorP = DOM.linkAccountError;
    switch (error.code) {
        case 'auth/email-already-in-use':
            errorP.textContent = 'This email address is already in use by another account.';
            break;
        case 'auth/invalid-email':
            errorP.textContent = 'The email address is not valid.';
            break;
        case 'auth/weak-password':
             errorP.textContent = 'The password is too weak.';
            break;
        default:
            // उपयोगकर्ता को सटीक कोड के साथ एक सामान्य त्रुटि दिखाएं
            errorP.textContent = `An unexpected error occurred. Please try again. (Code: ${error.code})`;
    }
    errorP.style.display = 'block';
});
}
function handleChangePassword() {
    const currentPassword = DOM.currentPasswordInput.value;
    const newPassword = DOM.newPasswordInput.value;
    const confirmNewPassword = DOM.confirmNewPasswordInput.value;
    const errorP = DOM.changePasswordError;

    // --- Basic Validation ---
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        errorP.textContent = 'All fields are required.';
        errorP.style.display = 'block';
        return;
    }
    if (newPassword.length < 6) {
        errorP.textContent = 'New password must be at least 6 characters long.';
        errorP.style.display = 'block';
        return;
    }
    if (newPassword !== confirmNewPassword) {
        errorP.textContent = 'New passwords do not match.';
        errorP.style.display = 'block';
        return;
    }

    errorP.style.display = 'none';

    const user = firebase.auth().currentUser;
    if (!user) {
        errorP.textContent = 'No user is currently logged in.';
        errorP.style.display = 'block';
        return;
    }

    const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);

    // --- नया और बेहतर लॉजिक ---

    // चरण 1: उपयोगकर्ता को पुनः प्रमाणित करने का प्रयास करें।
    user.reauthenticateWithCredential(credential)
      .then(() => {
        // यदि सफल हो, तो चरण 2: पासवर्ड अपडेट करें।
        user.updatePassword(newPassword)
          .then(() => {
            // पासवर्ड सफलतापूर्वक अपडेट हो गया।
            closeChangePasswordModal();
            showToast('Password updated successfully! ✅');
          })
          .catch((updateError) => {
            // यदि पासवर्ड अपडेट करने में कोई त्रुटि हुई (जैसे कमजोर पासवर्ड)।
            console.error("Password update failed:", updateError);
            if (updateError.code === 'auth/weak-password') {
                errorP.textContent = 'The new password is too weak.';
            } else {
                errorP.textContent = 'Could not update password. Please try again.';
            }
            errorP.style.display = 'block';
          });
      })
      .catch((reauthError) => {
        // यदि पुनः प्रमाणीकरण विफल हो जाता है, तो इसका मतलब है कि पुराना पासवर्ड गलत है।
        // --- यही वह जगह है जहाँ आपका इच्छित संदेश दिखाया जाएगा ---
        console.error("Re-authentication failed:", reauthError);
        showToast('Old password not matched. Please try again.');
        
        // इनपुट फ़ील्ड साफ़ करें
        DOM.currentPasswordInput.value = '';
        DOM.newPasswordInput.value = '';
        DOM.confirmNewPasswordInput.value = '';
        DOM.currentPasswordInput.focus(); // उपयोगकर्ता को फिर से प्रयास करने के लिए फोकस सेट करें
      });
}
function showTabTooltip(event, stepIndex) {
    const step = flatNavigationSteps[stepIndex];
    if(!step) return;
    if(step.batteryIndex > currentBatteryIndex && currentPage === 0) return;

    const battery = batteries[step.batteryIndex];
    const answers = allUserAnswers[step.batteryIndex] || [];
    const total = battery.questions.length;
    const attempted = answers.filter(a => a !== null && a !== undefined).length;
    const skipped = total - attempted;

    const tooltip = DOM.tabTooltip;
    tooltip.innerHTML = `
        <div class="tooltip-title">${battery.name[currentLanguage] || battery.name.en}</div>
        <div class="tooltip-item total">Total: <strong>${total}</strong></div>
        <div class="tooltip-item attempted">Attempted: <strong>${attempted}</strong></div>
        <div class="tooltip-item skipped">Skipped: <strong>${skipped}</strong></div>
    `;

    const tabRect = event.currentTarget.getBoundingClientRect();
    tooltip.style.display = 'block';
    tooltip.style.left = `${tabRect.left + tabRect.width / 2}px`;
    tooltip.style.top = `${tabRect.bottom + 5}px`;
    tooltip.style.transform = 'translateX(-50%)';
}

function hideTabTooltip() {
    DOM.tabTooltip.style.display = 'none';
}


function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => alert(`Error: ${err.message}`));
    } else {
        document.exitFullscreen();
    }
}
document.addEventListener('fullscreenchange', () => {
    const isFullScreen = !!document.fullscreenElement;
    DOM.fsOpenIcon.style.display = isFullScreen ? 'none' : 'block';
    DOM.fsCloseIcon.style.display = isFullScreen ? 'block' : 'none';
});

function handleScrollAttempt(event) {
    event.preventDefault();
    showToast('Scrolling is disabled. Use navigation buttons.');
}

function openLightbox(src) {
    DOM.lightboxImg.src = src;
    DOM.lightboxOverlay.style.display = 'flex';
}

function closeLightbox() {
    DOM.lightboxOverlay.style.display = 'none';
}
document.body.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG' && (e.target.closest('#phase-content') || e.target.closest('.question-block') || e.target.closest('.solution-question-block'))) {
        if (e.target.hasAttribute('data-no-lightbox')) return;
        e.preventDefault();
        openLightbox(e.target.src);
    }
});

async function toggleDarkMode(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    DOM.darkModeCheckbox.checked = isDark;
    DOM.mobileDarkModeCheckbox.checked = isDark;
    const userData = await getUserData(); // await जोड़ा गया
    if (userData && userData.profile) { // userData.profile के लिए भी जांच करें
        userData.profile.theme = isDark ? 'dark' : 'light';
        await saveUserData(userData); // await जोड़ा गया
    }
}

async function initTheme() {
    const userData = await getUserData(); // await जोड़ा गया
    if (userData && userData.profile && userData.profile.theme) { // userData.profile के लिए भी जांच करें
        toggleDarkMode(userData.profile.theme === 'dark');
    }
}

function clearCurrentResponse() {
    if (isMobileView && isOneByOneMode) {
        const qIndex = currentMobileQIndex;
        if (allUserAnswers[currentBatteryIndex] && allUserAnswers[currentBatteryIndex][qIndex] !== undefined) {
            allUserAnswers[currentBatteryIndex][qIndex] = null;
        }
        const radios = document.querySelectorAll(`input[name="q${qIndex}"]`);
        radios.forEach(radio => radio.checked = false);
    } else {
        const questionBlocks = DOM.testScreen.querySelectorAll('.question-block');
        questionBlocks.forEach(block => {
            const qIndex = parseInt(block.dataset.questionIndex, 10);
            const radios = block.querySelectorAll('input[type="radio"]');
            radios.forEach(radio => radio.checked = false);
            if (allUserAnswers[currentBatteryIndex] && allUserAnswers[currentBatteryIndex][qIndex] !== undefined) {
                allUserAnswers[currentBatteryIndex][qIndex] = null;
            }
        });
    }
    saveState();
    if (isMobileView) renderMobileTestSidebar(); 
}


function showInstructionModal() {
    const isTimedPhase = ['instruction', 'study', 'test', 'break'].includes(currentPhase);
    if(isTimedPhase && timer) {
        clearInterval(timer);
        wasTimerPausedByModal = true;
    }
    const hi_instructions = document.querySelector('[data-lang-instruction="hi"]').innerHTML;
    const en_instructions = document.querySelector('[data-lang-instruction="en"]').innerHTML;
    DOM.instructionModalBody.innerHTML = `<div data-lang="hi">${hi_instructions}</div><div data-lang="en">${en_instructions}</div>`;
    DOM.instructionModalBody.querySelectorAll('[data-lang]').forEach(el => {
        el.style.display = el.dataset.lang === currentLanguage ? 'block' : 'none';
    });
    DOM.instructionModalOverlay.style.display = 'flex';
}

function closeInstructionModal() {
     if(wasTimerPausedByModal) {
        runTimer(timeLeft, onTimerComplete);
        wasTimerPausedByModal = false;
     }
     DOM.instructionModalOverlay.style.display = 'none';
}


// =============== SOLUTION VIEW LOGIC ===============

function showSolutionView() {
    DOM.body.classList.remove('test-in-progress');
    DOM.finalResultScreen.classList.remove('active');
    DOM.solutionScreen.classList.add('active');
    DOM.stickyContainer.style.display = 'block';
    DOM.solutionNavStickyContainer.style.display = 'block';
    DOM.batteryTabsContainer.style.display = 'none';
    DOM.progressBar.parentElement.style.display = 'none';
    if(isMobileView && DOM.mobileSidebarToggle) DOM.mobileSidebarToggle.style.display = 'flex';
    updateHeaderControls();

    buildSolutionNav();
    const firstBatteryCombinedResult = getCombinedResults(false, T_SCORE_PARAMS)[0]; // Use fallback for nav
    const originalBatteryIndex = batteries.findIndex(b => b.name.en === firstBatteryCombinedResult.name_en || b.groupName === firstBatteryCombinedResult.name_en);
    renderSolutionForBattery(originalBatteryIndex);
}

function updateSolutionNavArrows() {
    const container = document.getElementById('solution-nav-header');
    if (!container) return;
    const isScrollable = container.scrollWidth > container.clientWidth;
    const leftArrow = document.getElementById('solution-scroll-left');
    const rightArrow = document.getElementById('solution-scroll-right');
    if (leftArrow) leftArrow.style.display = isScrollable ? 'flex' : 'none';
    if (rightArrow) rightArrow.style.display = isScrollable ? 'flex' : 'none';

    if (isScrollable) {
        leftArrow.disabled = container.scrollLeft <= 0;
        rightArrow.disabled = container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;
    }
}

function buildSolutionNav() {
    DOM.solutionNavHeaderWrapper.innerHTML = `
        <button id="solution-scroll-left" class="scroll-arrow">&lt;</button>
        <div id="solution-nav-header"></div>
        <button id="solution-scroll-right" class="scroll-arrow">&gt;</button>
    `;
    const solutionNavHeader = document.getElementById('solution-nav-header');

    const combinedResults = getCombinedResults(false, T_SCORE_PARAMS); // Use fallback for nav
    combinedResults.forEach((result, index) => {
        const btn = document.createElement('button');
        btn.className = 'solution-nav-btn';
        btn.textContent = result.name_en;
        const originalBatteryIndex = batteries.findIndex(b => b.name.en === result.name_en || b.groupName === result.name_en);
        btn.dataset.batteryIndex = originalBatteryIndex;
        btn.onclick = () => {
            renderSolutionForBattery(originalBatteryIndex);
        };
        solutionNavHeader.appendChild(btn);
    });

    document.getElementById('solution-scroll-left').addEventListener('click', () => {
        solutionNavHeader.scrollBy({
            left: -200,
            behavior: 'smooth'
        });
    });
    document.getElementById('solution-scroll-right').addEventListener('click', () => {
        solutionNavHeader.scrollBy({
            left: 200,
            behavior: 'smooth'
        });
    });
    solutionNavHeader.addEventListener('scroll', updateSolutionNavArrows);
    setTimeout(updateSolutionNavArrows, 100);
}

function setSolutionSidebarPosition() {
    if (!isMobileView) { // Only run this logic on desktop
        const headerHeight = DOM.examHeader.offsetHeight;
        const navHeight = DOM.solutionNavStickyContainer.offsetHeight;
        const topOffset = headerHeight + navHeight + 15; // 15px margin
        DOM.solutionSidebar.style.top = `${topOffset}px`;
        DOM.solutionSidebar.style.maxHeight = `calc(100vh - ${topOffset}px)`;
    } else {
        // On mobile, remove any inline styles to let CSS take over
        DOM.solutionSidebar.style.top = '';
        DOM.solutionSidebar.style.maxHeight = '';
    }
}

function renderSolutionForBattery(batteryIndex) {
    document.querySelectorAll('.solution-nav-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.batteryIndex, 10) === batteryIndex);
    });

    setSolutionSidebarPosition();

    currentSolutionBatteryIndex = batteryIndex;
    const battery = batteries.find((b, i) => i === batteryIndex);
    const combinedResults = getCombinedResults(false, T_SCORE_PARAMS); // Use fallback for nav
    const result = combinedResults.find(r => r.name_en === (battery.groupName || battery.name.en));

    let sidebarHtml = `
        <div class="solution-stats">
            <p><strong>Total:</strong> ${result.total}</p>
            <p><strong>Attempted:</strong> ${result.attempted}</p>
            <p><strong>Correct:</strong> ${result.correct}</p>
            <p><strong>Incorrect:</strong> ${result.incorrect}</p>
            <p><strong>Skipped:</strong> ${result.skipped}</p>
            <p><strong>Raw Score:</strong> ${result.correct} / ${result.total}</p>
            <p><strong>Accuracy:</strong> ${result.accuracy}%</p>
            <p><strong>T-Score:</strong> ${result.tScore || 'N/A'}</p>
        </div>
        <div class="solution-view-controls">
            <span>View Mode</span>
            <label class="switch">
                <input type="checkbox" id="solution-view-toggle" ${solutionViewMode === 'single' ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
         <div class="reattempt-toggle-container">
            <span>Re-attempt Mode</span>
            <label class="switch">
                <input type="checkbox" id="reattempt-toggle" ${isReattemptMode ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
        <h4>Question Map</h4>
        <div class="question-jump-nav">`;

    const batteriesInGroup = batteries.map((b, i) => ({ ...b,
        originalIndex: i
    })).filter(b => b.groupName === battery.groupName || b.name.en === battery.name.en);
    let questionCounter = 0;

    batteriesInGroup.forEach(bInGroup => {
        const answersForThisBattery = allUserAnswers[bInGroup.originalIndex] || [];
        bInGroup.questions.forEach((q, qIndex) => {
            const userAnswer = answersForThisBattery[qIndex];
            const isActive = (solutionViewMode === 'single' && questionCounter === currentSolutionQuestionIndex);
            let statusClass = 'skipped';
            if (userAnswer !== null && userAnswer !== undefined) {
                const correctLetter = q.correct;
                const correctIndex = correctLetter.charCodeAt(0) - 'a'.charCodeAt(0);
                const correctValue = q.options[correctIndex];
                statusClass = (userAnswer == correctValue) ? 'correct' : 'incorrect';
            }
            sidebarHtml += `<button class="jump-btn ${statusClass} ${isActive ? 'active-q-jump' : ''}" onclick="jumpToSolutionQuestion(${questionCounter})">${questionCounter + 1}</button>`;
            questionCounter++;
        });
    });

    sidebarHtml += `</div>`;
    DOM.solutionSidebar.innerHTML = sidebarHtml;

    document.getElementById('reattempt-toggle').addEventListener('change', (e) => {
        isReattemptMode = e.target.checked;
        renderSolutionForBattery(currentSolutionBatteryIndex);
    });
    document.getElementById('solution-view-toggle').addEventListener('change', (e) => {
        solutionViewMode = e.target.checked ? 'single' : 'all';
        currentSolutionQuestionIndex = 0;
        renderSolutionForBattery(currentSolutionBatteryIndex);
    });

    DOM.solutionMainContent.className = isReattemptMode ? 'reattempt-active' : '';
    let mainContentHtml = '';
    let globalQIndex = 0;

    batteriesInGroup.forEach(bInGroup => {
        const answersForThisBattery = allUserAnswers[bInGroup.originalIndex] || [];
        bInGroup.questions.forEach((q, qIndex) => {
            const correctLetter = q.correct;
            const correctIndex = correctLetter.charCodeAt(0) - 'a'.charCodeAt(0);
            const correctValue = q.options[correctIndex];
            const questionText = q.text[currentLanguage] || q.text['en'];
            const userAnswer = answersForThisBattery[qIndex];
            const displayStyle = (solutionViewMode === 'single' && globalQIndex !== currentSolutionQuestionIndex) ? 'display:none;' : '';

            mainContentHtml += `<div class="solution-question-block" id="solution-q-${globalQIndex}" style="${displayStyle}">
                <p><strong>Question ${globalQIndex + 1}:</strong> ${questionText}</p>
                <div class="solution-options" data-correct-answer="${correctValue}" data-question-index="${globalQIndex}">`;

            q.options.forEach((option, optIndex) => {
                let labelClass = '';
                if (!isReattemptMode) {
                    const isCorrectAnswer = (option == correctValue);
                    const isUserSelected = (option == userAnswer);
                    if (isCorrectAnswer) labelClass = 'correct-option';
                    if (isUserSelected && !isCorrectAnswer) labelClass = 'user-selected-wrong';
                    if (isUserSelected && isCorrectAnswer) labelClass = 'correct-answer';
                }
                const val = typeof option === 'string' ? `'${option}'` : option;
                mainContentHtml += `<label class="${labelClass}" data-option-value=${val}>
                    ${isReattemptMode ? `<input type="radio" name="sol-q-${globalQIndex}" value=${val}>` : ''}
                    ${option}
                </label>`;
            });

            mainContentHtml += `</div>`;
            if (q.explanation && (q.explanation[currentLanguage] || q.explanation.en)) {
                mainContentHtml += `<div class="solution-question-explanation"><strong>Explanation:</strong> ${q.explanation[currentLanguage] || q.explanation.en}</div>`;
            }
            mainContentHtml += `</div>`;
            globalQIndex++;
        });
    });

    DOM.solutionMainContent.innerHTML = mainContentHtml;

    if (isReattemptMode) {
        document.querySelectorAll('.solution-options input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const optionContainer = e.target.closest('.solution-options');
                const selectedValue = e.target.value.includes("'") ? e.target.value.replace(/'/g, "") : (isNaN(parseFloat(e.target.value)) ? e.target.value : parseFloat(e.target.value));
                const correctValue = optionContainer.dataset.correctAnswer;
                
                const labels = optionContainer.querySelectorAll('label');
                labels.forEach(l => l.classList.remove('temp-correct', 'temp-wrong'));

                const selectedLabel = e.target.parentElement;
                const correctValString = typeof correctValue === 'string' ? `'${correctValue}'` : correctValue;
                const correctLabel = optionContainer.querySelector(`label[data-option-value=${correctValString}]`);

                if (String(selectedValue) == String(correctValue)) {
                    selectedLabel.classList.add('temp-correct');
                } else {
                    selectedLabel.classList.add('temp-wrong');
                    if (correctLabel) {
                        correctLabel.classList.add('temp-correct');
                    }
                }
                
                const qIndex = optionContainer.dataset.questionIndex;
                document.querySelectorAll(`input[name="sol-q-${qIndex}"]`).forEach(input => {
                    input.disabled = true;
                });
            });
        });
    }

    DOM.solutionFooter.style.display = (solutionViewMode === 'single') ? 'flex' : 'none';
    updateSolutionNavButtons();
}

function jumpToSolutionQuestion(qIndex) {
    if (solutionViewMode === 'single') {
        currentSolutionQuestionIndex = qIndex;
        renderSolutionForBattery(currentSolutionBatteryIndex);
    } else {
        const targetElement = document.getElementById(`solution-q-${qIndex}`);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
}

function navigateSolutionQuestion(direction) {
    const combinedQuestionsCount = batteries.filter(b => b.groupName === batteries[currentSolutionBatteryIndex].groupName || b.name.en === batteries[currentSolutionBatteryIndex].name.en)
        .reduce((sum, b) => sum + b.questions.length, 0);

    const nextIndex = currentSolutionQuestionIndex + direction;

    if (nextIndex >= 0 && nextIndex < combinedQuestionsCount) {
        currentSolutionQuestionIndex = nextIndex;
        renderSolutionForBattery(currentSolutionBatteryIndex);
    }
}

function updateSolutionNavButtons() {
    if (solutionViewMode !== 'single') return;
    const combinedQuestionsCount = batteries.filter(b => b.groupName === batteries[currentSolutionBatteryIndex].groupName || b.name.en === batteries[currentSolutionBatteryIndex].name.en)
        .reduce((sum, b) => sum + b.questions.length, 0);
    DOM.solutionPrevBtn.disabled = currentSolutionQuestionIndex === 0;
    DOM.solutionNextBtn.disabled = currentSolutionQuestionIndex === combinedQuestionsCount - 1;
    DOM.solutionPageIndicator.textContent = `${currentSolutionQuestionIndex + 1} / ${combinedQuestionsCount}`;
}

function showBatteryStatsModal(resultData) {
    DOM.statsModalTitle.textContent = `${resultData.name_en} - Statistics`;
    const icon = {
        total: `<svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"></path></svg>`,
        attempted: `<svg viewBox="0 0 24 24"><path d="M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z"></path></svg>`,
        skipped: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"></path></svg>`,
        correct: `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>`,
        incorrect: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>`,
        accuracy: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-8.5l1.41 1.41L12 13.83l4.09-4.09L17.5 11.17 12 16.67 6.5 11.17z"></path></svg>`,
        tscore: `<svg viewBox="0 0 24 24"><path d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path></svg>`,
        rawscore: `<svg viewBox="0 0 24 24"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path></svg>`
    }
    DOM.statsModalBody.innerHTML = `
        <div class="stat-item total">${icon.total}<div class="label-value-group"><div class="label">Total Questions</div><div class="value">${resultData.total}</div></div></div>
        <div class="stat-item attempted">${icon.attempted}<div class="label-value-group"><div class="label">Attempted</div><div class="value">${resultData.attempted}</div></div></div>
        <div class="stat-item correct">${icon.correct}<div class="label-value-group"><div class="label">Correct</div><div class="value">${resultData.correct}</div></div></div>
        <div class="stat-item incorrect">${icon.incorrect}<div class="label-value-group"><div class="label">Incorrect</div><div class="value">${resultData.incorrect}</div></div></div>
        <div class="stat-item skipped">${icon.skipped}<div class="label-value-group"><div class="label">Skipped</div><div class="value">${resultData.skipped}</div></div></div>
        <div class="stat-item rawscore">${icon.rawscore}<div class="label-value-group"><div class="label">Raw Score</div><div class="value">${resultData.correct}/${resultData.total}</div></div></div>
        <div class="stat-item info">${icon.accuracy}<div class="label-value-group"><div class="label">Accuracy</div><div class="value">${resultData.accuracy}%</div></div></div>
        <div class="stat-item total">${icon.tscore}<div class="label-value-group"><div class="label">T-Score</div><div class="value">${resultData.tScore} (${resultData.status})</div></div></div>
    `;
    DOM.statsModalOverlay.style.display = 'flex';
}


// =============== INITIALIZATION ===============
function findNextPhaseStep(currentIndex, phases) {
    for (let i = currentIndex + 1; i < flatNavigationSteps.length; i++) {
        if (phases.includes(flatNavigationSteps[i].phase)) {
            return i;
        }
    }
    return flatNavigationSteps.length - 1; // Fallback
}

function findLastIndex(arr, callback) {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (callback(arr[i], i, arr)) {
            return i;
        }
    }
    return -1;
}

function findBatteryStartQIndex(batteryIndex) {
    let qIndex = 0;
    for (let i = 0; i < batteryIndex; i++) {
        qIndex += batteries[i].questions.length;
    }
    return qIndex;
}

function buildTabs() {
    DOM.batteryTabsContainer.innerHTML = '';
    const addedTabsForBattery = new Set();
    flatNavigationSteps.forEach((step, index) => {
        const batteryForStep = batteries[step.batteryIndex];
        const mainTestKey = `${step.batteryIndex}-test`;

        let tabKey;
        if (step.phase === 'test') {
            tabKey = mainTestKey;
        } else {
            tabKey = `${step.batteryIndex}-${step.phase}`;
        }

        if (!addedTabsForBattery.has(tabKey)) {
            const tab = document.createElement('div');
            tab.className = 'battery-tab';
            tab.dataset.stepIndex = index;
            tab.id = `tab-step-${index}`;
            let tabText = '';
            const batName = batteryForStep.name[currentLanguage] || batteryForStep.name.en;

            if (step.phase === 'instruction') tabText = `${batName} (${currentLanguage === 'hi' ? 'निर्देश' : 'Instructions'})`;
            else if (step.phase === 'study') tabText = `${batName} (${currentLanguage === 'hi' ? 'अध्ययन' : 'Study'})`;
            else if (step.phase === 'test') tabText = `${batName} (${currentLanguage === 'hi' ? 'प्रश्न' : 'Questions'})`;

            if (tabText) {
                tab.textContent = tabText;
                tab.addEventListener('mouseenter', (e) => showTabTooltip(e, index));
                tab.addEventListener('mouseleave', hideTabTooltip);
                DOM.batteryTabsContainer.appendChild(tab);
                addedTabsForBattery.add(tabKey);
            }
        }
    });
    setTimeout(updateScrollArrows, 100);
}


function initializeNewTest() {
    currentLanguage = 'hi';
    currentBatteryIndex = 0;
    currentStepIndex = 0;
    currentPhase = '';
    currentPage = 0;
    timeLeft = 0;
    onTimerComplete = null;
    userAnswers = [];
    allBatteryResults = [];
    allUserAnswers = {};
    isReattemptMode = false;
    solutionViewMode = 'all';
    analysisPendingForBreak = false;
    flatNavigationSteps = [];
    isOneByOneMode = true;
    currentMobileQIndex = 0;


    const instructionSwitcher = document.getElementById('instruction-lang-switcher');
    const examSwitcher = document.getElementById('exam-lang-switcher');
    if (instructionSwitcher && examSwitcher) {
        const setInstructionLang = (lang) => {
            document.querySelectorAll('[data-lang-instruction]').forEach(el => {
                el.style.display = el.dataset.langInstruction === lang ? 'block' : 'none';
            });
        };
        const setExamLang = (lang) => {
            currentLanguage = lang;
            DOM.headerLangSwitcher.value = lang;
            if (DOM.mobileLangSwitcher) DOM.mobileLangSwitcher.value = lang;
            document.querySelectorAll('[data-lang-exam]').forEach(el => {
                el.style.display = el.dataset.langExam === lang ? 'block' : 'none';
            });
        };
        instructionSwitcher.addEventListener('change', (e) => setInstructionLang(e.target.value));
        examSwitcher.addEventListener('change', (e) => {
            setExamLang(e.target.value);
            currentLanguage = e.target.value;
        });
        setInstructionLang(instructionSwitcher.value);
        currentLanguage = examSwitcher.value;
        DOM.headerLangSwitcher.value = currentLanguage;
        if (DOM.mobileLangSwitcher) DOM.mobileLangSwitcher.value = currentLanguage;
        setExamLang(currentLanguage);
    }
    runPhase('initial');
}

function hideLoadingSpinner() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
        // Remove from DOM after transition for better performance
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 500); // Must match CSS transition duration
    }
}

async function appStart(user) {
     const userEmailDisplay = document.getElementById('user-email-display');
     if (user.isAnonymous) {
        userEmailDisplay.textContent = 'Guest User';
        DOM.changePasswordBtn.style.display = 'none'; // Hide change password for guests
        DOM.linkAccountBtn.style.display = 'block'; // Show sign up/link for guests
    } else {
        userEmailDisplay.textContent = user.email || 'Offline User';
        DOM.changePasswordBtn.style.display = 'block'; // Show change password for real users
        DOM.linkAccountBtn.style.display = 'none';   // Hide sign up/link for real users
    }
    firebaseUser = user;
    userId = user.uid; // Global userId सेट करें
if (SECTIONAL_TEST_INDEX > -1 && SECTIONAL_TEST_INDEX < batteries.length) {
    const initialSelectedBattery = batteries[SECTIONAL_TEST_INDEX];
    
    // Check karein ki chune gaye test ka koi group hai ya nahi
    if (initialSelectedBattery.groupName) {
        // Agar group hai, to us group ke sabhi tests ko select karein
        const groupNameToSelect = initialSelectedBattery.groupName;
        const groupedBatteries = batteries.filter(battery => battery.groupName === groupNameToSelect);
        batteries = groupedBatteries; // `batteries` array ko group ke sabhi parts se replace karein
    } else {
        // Agar group nahi hai, to sirf us ek test ko select karein
        batteries = [initialSelectedBattery];
    }

    // Exam title ko group ke naam se ya section ke naam se update karein
    const examTitleElement = document.getElementById('exam-title');
    if (examTitleElement) {
        const title = initialSelectedBattery.groupName || initialSelectedBattery.name.en;
        examTitleElement.textContent = title;
       
    }
    
}
// --- End of Sectional Test Logic ---
    if (typeof currentPageTestId !== 'undefined') uniqueTestId = currentPageTestId;
    if (typeof currentPageCategory !== 'undefined') currentCategory = currentPageCategory;
    //userId = getUserId();
    await initTheme();
    isMobileView = window.innerWidth <= 768;

    const userData = await getUserData();
    const testStatus = userData.testStatuses ? userData.testStatuses[uniqueTestId] : undefined;
    const startNewAndClear = async () => {
        DOM.resumePromptOverlay.style.display = 'none';
        DOM.viewResultPromptOverlay.style.display = 'none';
        await clearAllDataForTest(uniqueTestId);
        initializeNewTest();
    };

    if (testStatus === 'in_progress') {
        DOM.resumePromptOverlay.style.display = 'flex';
        DOM.resumeTestBtn.onclick = async () => {
            const inProgressState = await loadState(); // await जोड़ें
            DOM.resumePromptOverlay.style.display = 'none';
            if (inProgressState && typeof inProgressState.currentStepIndex !== 'undefined') {
                restoreState(inProgressState);
            } else {
                await startNewAndClear();
            }
        };
        DOM.startNewTestBtn.onclick = startNewAndClear;
    } else if (testStatus === 'completed') {
        DOM.viewResultPromptOverlay.style.display = 'flex';
        DOM.viewPreviousResultBtn.onclick = async () => {
            const userData = await getUserData(); // उपयोगकर्ता डेटा पुनः प्राप्त करें
            const completedTest = userData.completedTests[uniqueTestId];
            DOM.viewResultPromptOverlay.style.display = 'none';
            if (completedTest) {
                allBatteryResults = completedTest.results;
                // --- Start of Fix ---
let answersData = completedTest.answers;
if (Array.isArray(answersData)) {
    // पुराने ऐरे फॉर्मेट को नए ऑब्जेक्ट फॉर्मेट में बदलें
    const convertedAnswers = {};
    answersData.forEach((ansArray, index) => {
        if (ansArray) { // यह सुनिश्चित करने के लिए कि खाली आइटम न आएं
            convertedAnswers[String(index)] = ansArray;
        }
    });
    allUserAnswers = convertedAnswers;
} else {
    // अगर डेटा पहले से ही ऑब्जेक्ट है या मौजूद नहीं है
    allUserAnswers = answersData || {};
}
// --- End of Fix ---
                showFinalResults();
            } else initializeNewTest();
        };
        DOM.startNewOverwriteBtn.onclick = startNewAndClear;
    } else {
        initializeNewTest();
    }
}


async function initializeApp() { // फ़ंक्शन को async बनाएं
    if (ENABLE_FIREBASE) {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        
        firebase.auth().onAuthStateChanged(async (user) => { // कॉलबैक को भी async बनाएं
            if (user) {
                console.log("User is logged in:", user.email);
                await appStart(user); // UI सेटअप का इंतजार करें
                hideLoadingSpinner(); // अब स्पिनर छिपाएं
            } else {
                console.log("No user logged in. Redirecting to login page.");
                hideLoadingSpinner(); // रीडायरेक्ट करने से पहले छिपाएं
                window.location.href = 'login.html';
            }
        });
    } else {
        console.warn("Firebase is disabled. Running in offline mode.");
        const offlineUser = { uid: 'offline-user' };
        await appStart(offlineUser); // UI सेटअप का इंतजार करें
        hideLoadingSpinner(); // अब स्पिनर छिपाएं
    }
}

function restoreState(state) {
    currentLanguage = state.currentLanguage || 'hi';
    allBatteryResults = state.allBatteryResults || [];
    allUserAnswers = state.allUserAnswers || {};
    currentStepIndex = state.currentStepIndex || 0;
    analysisPendingForBreak = state.analysisPendingForBreak || false;
    isOneByOneMode = state.isOneByOneMode !== undefined ? state.isOneByOneMode : true;
    currentMobileQIndex = state.currentMobileQIndex || 0;


    changeLanguage(currentLanguage);

    DOM.welcomeScreen.style.display = 'none';
    DOM.stickyContainer.style.display = 'block';
    DOM.examProperScreen.classList.add('active');
    DOM.mainInstructionScreen.classList.remove('active');

    buildFlatNavigation();
    buildTabs();

    const stepToRestore = flatNavigationSteps[currentStepIndex];
    if (stepToRestore) {
        currentBatteryIndex = stepToRestore.batteryIndex;
        currentPage = stepToRestore.page !== null ? stepToRestore.page : 0;
        userAnswers = allUserAnswers[currentBatteryIndex] || [];

        document.querySelectorAll('.battery-tab').forEach(tab => {
            const tabStepIndex = parseInt(tab.dataset.stepIndex, 10);
            const tabStepDetails = flatNavigationSteps[tabStepIndex];
            let isActive = false;
            if (tabStepDetails) {
                // Check for both the battery index AND the specific phase
                if (tabStepDetails.batteryIndex === currentBatteryIndex && tabStepDetails.phase === stepToRestore.phase) {
                    isActive = true;
                }
            }
            tab.classList.toggle('active', isActive);
        });

        // --- NEW CODE TO SCROLL ACTIVE TAB INTO VIEW ---
        const activeTab = document.querySelector('.battery-tab.active');
        if (activeTab) {
            activeTab.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
        // --- END OF NEW CODE ---

        runPhase(stepToRestore.phase, {
            restoredTime: state.timeLeft
        });
        updateProgressBar();
    } else {
        navigateToStep(0); // Fallback
    }
}

window.addEventListener('beforeunload', async (event) => {
    const userData = await getUserData(); 
    if (userData && userData.testStatuses && userData.testStatuses[uniqueTestId] === 'in_progress') {
        await saveState();
    }
});
initializeApp();

//guest to account not word "auth operation not allowed error show"
//forget password not work "show this account is not etc error "
//add state loading animation to improve visual performance
//instant set stats save in local to reduce use  of read and write and reduce loading time.
//create my profile , test history page and setting page
//add payment gateway to apply minimal charge to get bacup for backend server cost.
/// as it as...............