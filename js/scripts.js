const typingText = document.querySelector(".typing-text p");
const inpField = document.querySelector(".wrapper .input-field");
const mistakeTag = document.querySelector(".mistake span");
const timeTag = document.querySelector(".time span b");
const wpmTag = document.querySelector(".wpm span");
const cpmTag = document.querySelector(".cpm span");
const accuracyTag = document.querySelector(".accuracy span");
const statusTag = document.querySelector("#statusText");
const resetButton = document.querySelector("#resetBtn");
const newParagraphButton = document.querySelector("#newParagraphBtn");
const bestScoreTag = document.querySelector("#bestScore");

const maxTime = 60;
const difficultyModes = ["casual", "standard", "pro", "elite"];

const state = {
    difficulty: "standard",
    timeLeft: maxTime,
    currentText: "",
    timer: null,
    isTyping: false,
    finished: false,
    mistakes: 0,
    correctChars: 0,
    bestScore: 0
};

function getRandomParagraph() {
    const levelPool = paragraphs[state.difficulty] || paragraphs.standard;
    const randomIndex = Math.floor(Math.random() * levelPool.length);
    return levelPool[randomIndex];
}

function loadBestScore() {
    try {
        state.bestScore = Number(localStorage.getItem("typing-game-best-score") || 0);
    } catch (error) {
        console.warn("Unable to load best score.", error);
    }
}

function saveBestScore() {
    try {
        localStorage.setItem("typing-game-best-score", String(state.bestScore));
    } catch (error) {
        console.warn("Unable to save best score.", error);
    }
}

function setStatus(message, tone = "neutral") {
    statusTag.textContent = message;
    statusTag.dataset.tone = tone;
}

function renderParagraph() {
    typingText.innerHTML = "";
    state.currentText.split("").forEach((char) => {
        const span = document.createElement("span");
        span.textContent = char === " " ? "\u00A0" : char;
        typingText.appendChild(span);
    });

    const firstChar = typingText.querySelectorAll("span")[0];
    if (firstChar) {
        firstChar.classList.add("active");
    }
}

function updateBestScoreDisplay() {
    bestScoreTag.textContent = state.bestScore;
}

function updateStats() {
    const elapsedSeconds = Math.max(1, maxTime - state.timeLeft);
    const wpm = state.isTyping
        ? Math.round((state.correctChars / 5) / (elapsedSeconds / 60)) || 0
        : 0;
    const totalTyped = state.correctChars + state.mistakes;
    const accuracy = totalTyped > 0 ? Math.round((state.correctChars / totalTyped) * 100) : 100;

    timeTag.textContent = state.timeLeft;
    mistakeTag.textContent = state.mistakes;
    wpmTag.textContent = wpm;
    cpmTag.textContent = state.correctChars;
    accuracyTag.textContent = `${accuracy}%`;
    updateBestScoreDisplay();
}

function startTimer() {
    if (state.timer) {
        clearInterval(state.timer);
    }

    state.timer = setInterval(() => {
        if (state.timeLeft > 0) {
            state.timeLeft -= 1;
            updateStats();
            return;
        }

        clearInterval(state.timer);
        state.timer = null;
        finishGame(false, "Time is up! Try another round.");
    }, 1000);
}

function finishGame(isComplete, message) {
    if (state.finished) {
        return;
    }

    state.finished = true;
    state.isTyping = false;
    clearInterval(state.timer);
    state.timer = null;
    inpField.blur();

    const score = Number(wpmTag.textContent) || 0;

    if (isComplete && score > state.bestScore) {
        state.bestScore = score;
        saveBestScore();
        updateBestScoreDisplay();
    }

    setStatus(message, isComplete ? "success" : "warning");
    inpField.disabled = true;
    updateStats();
}

function syncTypingUI() {
    const typedValue = inpField.value;
    const characters = Array.from(typingText.querySelectorAll("span"));
    let correctChars = 0;
    let mistakes = 0;

    characters.forEach((charElement, index) => {
        const expectedChar = state.currentText[index];
        const typedChar = typedValue[index];

        charElement.classList.remove("correct", "incorrect", "active");

        if (typedChar == null) {
            if (index === typedValue.length) {
                charElement.classList.add("active");
            }
            return;
        }

        if (typedChar === expectedChar) {
            charElement.classList.add("correct");
            correctChars += 1;
        } else {
            charElement.classList.add("incorrect");
            mistakes += 1;
        }
    });

    if (typedValue.length < characters.length) {
        characters[typedValue.length]?.classList.add("active");
    }

    state.correctChars = correctChars;
    state.mistakes = mistakes;

    if (typedValue === state.currentText) {
        finishGame(true, "Nice work! Paragraph complete!");
        return;
    }

    updateStats();
}

function initTyping() {
    if (state.finished) {
        return;
    }

    if (!state.isTyping && inpField.value.length > 0) {
        state.isTyping = true;
        startTimer();
        setStatus("Typing...", "active");
    }

    if (inpField.value.length > state.currentText.length) {
        inpField.value = inpField.value.slice(0, state.currentText.length);
    }

    syncTypingUI();
}

function resetGame() {
    state.currentText = getRandomParagraph();
    state.timeLeft = maxTime;
    state.isTyping = false;
    state.finished = false;
    state.mistakes = 0;
    state.correctChars = 0;
    inpField.disabled = false;
    inpField.value = "";
    clearInterval(state.timer);
    state.timer = null;
    renderParagraph();
    updateStats();
    setStatus("Ready to type", "neutral");
    inpField.focus();
}

function cycleDifficulty() {
    const currentIndex = difficultyModes.indexOf(state.difficulty);
    state.difficulty = difficultyModes[(currentIndex + 1) % difficultyModes.length];
    resetGame();
}

loadBestScore();
updateBestScoreDisplay();
resetGame();

inpField.addEventListener("input", initTyping);
resetButton.addEventListener("click", resetGame);
newParagraphButton.addEventListener("click", cycleDifficulty);
typingText.addEventListener("click", () => inpField.focus());
window.addEventListener("keydown", () => inpField.focus());