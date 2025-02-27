const CONTRACT_ADDRESS = "0x980645b86A6F890Da67E404B99008B2DF869Be47"; // Update after deploy
const ABI = [
    "function startGame() external",
    "function recordMatch() external",
    "function finishGame() external",
    "function reset() external",
    "event MatchFound(address indexed player, uint256 matchCount)",
    "event GameCompleted(address indexed player)"
];

// Images inspired by Monad Media Kit (placeholders—replace with real URLs or local assets)
const SYMBOLS = [
    { symbol: '⭐', img: '../images/tile1.png' },
    { symbol: '🚀', img: '../images/tile2.png' },
    { symbol: '🪐', img: '../images/tile3.png' },
    { symbol: '🌙', img: '../images/tile4.png' },
    { symbol: '🌠', img: '../images/tile5.png' },
    { symbol: '🌀', img: '../images/tile6.png' },
    { symbol: '💫', img: '../images/tile7.png' },
    { symbol: '🌌', img: '../images/tile8.png' }
];

let account = null;
let contract = null;    
let cards = [];
let flippedCards = [];
let matchedCards = [];
let score = 0;
let time = 0;
let lastFlipTime = 0;
let timerInterval;
let leaderboard = [];

const status = document.getElementById("status");
const timer = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const cardsContainer = document.getElementById("cards");
const connectWalletBtn = document.getElementById("connectWallet");
const startGameBtn = document.getElementById("startGame");
const resetGameBtn = document.getElementById("resetGame");
const toggleMusicBtn = document.getElementById("toggleMusic");
const bgMusic = document.getElementById("bgMusic");
const nftEffect = document.getElementById("nftEffect");
const leaderboardList = document.getElementById("leaderboardList");

connectWalletBtn.addEventListener("click", async () => {
    if (!window.ethereum) {
        status.textContent = "Please install MetaMask!";
        return;
    }
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        account = accounts[0];
        const signer = await provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        status.textContent = "Wallet connected!";
        connectWalletBtn.style.display = "none";
        startGameBtn.style.display = "inline";
    } catch (error) {
        status.textContent = error.code === 4001 ? "Connection rejected!" : `Error: ${error.message}`;
    }
});

startGameBtn.addEventListener("click", async () => {
    try {
        const tx = await contract.startGame();
        await tx.wait();
        initializeGame();
        status.textContent = "Match the cosmic symbols!";
        startGameBtn.style.display = "none";
        resetGameBtn.style.display = "inline";
        startTimer();
        bgMusic.play();
    } catch (error) {
        status.textContent = `Error: ${error.message}`;
    }
});

resetGameBtn.addEventListener("click", async () => {
    try {
        const tx = await contract.reset();
        await tx.wait();
        resetGame();
        status.textContent = "Reset—start a new game!";
        startGameBtn.style.display = "inline";
        resetGameBtn.style.display = "none";
    } catch (error) {
        status.textContent = `Error: ${error.message}`;
    }
});

toggleMusicBtn.addEventListener("click", () => {
    if (bgMusic.paused) {
        bgMusic.play();
        toggleMusicBtn.textContent = "Mute Music";
    } else {
        bgMusic.pause();
        toggleMusicBtn.textContent = "Play Music";
    }
});

function initializeGame() {
    cards = [];
    flippedCards = [];
    matchedCards = [];
    score = 0;
    time = 0;
    lastFlipTime = 0;
    scoreEl.textContent = score;
    timer.textContent = time;

    const shuffledSymbols = [...SYMBOLS, ...SYMBOLS].sort(() => Math.random() - 0.5);
    shuffledSymbols.forEach((item, index) => {
        cards.push({ id: index, symbol: item.symbol, img: item.img, visible: false });
    });

    renderCards();
    updateLeaderboard();
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        time++;
        timer.textContent = time;
    }, 1000);
}

function renderCards() {
    cardsContainer.innerHTML = "";
    cards.forEach(card => {
        const cardEl = document.createElement("div");
        cardEl.className = `card ${card.visible || matchedCards.includes(card.id) ? "visible" : ""}`;
        if (card.visible || matchedCards.includes(card.id)) {
            const img = document.createElement("img");
            img.src = card.img;
            cardEl.appendChild(img);
        } else {
            cardEl.textContent = "❓";
        }
        cardEl.addEventListener("click", () => flipCard(card.id));
        cardsContainer.appendChild(cardEl);
    });
}

async function flipCard(id) {
    if (flippedCards.length === 2 || matchedCards.includes(id) || cards[id].visible) return;

    cards[id].visible = true;
    flippedCards.push(id);
    renderCards();

    if (flippedCards.length === 2) {
        const [first, second] = flippedCards;
        if (cards[first].symbol === cards[second].symbol) {
            matchedCards.push(first, second);
            const timeSinceLastFlip = time - (lastFlipTime || 0);
            const timeBonus = Math.max(5 - Math.floor(timeSinceLastFlip), 0);
            score += 10 + timeBonus;
            scoreEl.textContent = score;
            status.textContent = `Match found! +${10 + timeBonus} points (${matchedCards.length / 2}/8 pairs).`;

            // NFT mint animation
            const tile = cardsContainer.children[first];
            nftEffect.style.left = `${tile.offsetLeft + tile.offsetWidth / 2}px`;
            nftEffect.style.top = `${tile.offsetTop + tile.offsetHeight / 2}px`;
            nftEffect.style.opacity = "1";
            setTimeout(() => nftEffect.style.opacity = "0", 1000);

            await recordMatch();
            if (matchedCards.length === 16) await finishGame();
        } else {
            score -= 2;
            scoreEl.textContent = score;
            status.textContent = "Mismatch! -2 points.";
        }
        lastFlipTime = time;
        setTimeout(() => {
            cards[first].visible = matchedCards.includes(first);
            cards[second].visible = matchedCards.includes(second);
            flippedCards = [];
            renderCards();
        }, 1000);
    }
}

async function recordMatch() {
    try {
        const tx = await contract.recordMatch();
        await tx.wait();
    } catch (error) {
        status.textContent = `Error: ${error.message}`;
    }
}

async function finishGame() {
    try {
        const tx = await contract.finishGame();
        await tx.wait();
        status.textContent = "All pairs matched—cosmic victory!";
        clearInterval(timerInterval);
        updateLeaderboard();
    } catch (error) {
        status.textContent = `Error: ${error.message}`;
    }
}

function resetGame() {
    clearInterval(timerInterval);
    cards = [];
    flippedCards = [];
    matchedCards = [];
    score = 0;
    time = 0;
    lastFlipTime = 0;
    scoreEl.textContent = score;
    timer.textContent = time;
    renderCards();
}

function updateLeaderboard() {
    if (!account || matchedCards.length < 16) return;
    const entry = { address: account.slice(0, 6) + "...", score, time };
    leaderboard = [...leaderboard, entry].sort((a, b) => b.score - a.score || a.time - b.time).slice(0, 5);
    leaderboardList.innerHTML = leaderboard.map(e => `<li>${e.address}: ${e.score} (Time: ${e.time}s)</li>`).join("");
}