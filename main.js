import './style.css';
// ----------------------
// PocketBase API
// ----------------------
const POCKETBASE_URL = "http://127.0.0.1:8090";
const COLLECTION = "blackjack_stats";

async function pbSend(record) {
    try {
        await fetch(`${POCKETBASE_URL}/api/collections/${COLLECTION}/records`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(record)
        });
    } catch (e) {
        console.warn("PocketBase offline, dati non inviati");
    }
}

// ----------------------
// Costanti carte
// ----------------------
const suits = ['♥', '♦', '♣', '♠'];
const ranks = ['Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Jack','Queen','King','Ace'];
const values = {
    Two:2, Three:3, Four:4, Five:5, Six:6, Seven:7,
    Eight:8, Nine:9, Ten:10, Jack:10, Queen:10, King:10, Ace:11
};

// ----------------------
// Modelli logici
// ----------------------
class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
        this.value = values[rank];
    }
}

class Deck {
    constructor() {
        this.deck = [];
        suits.forEach(suit => {
            ranks.forEach(rank => {
                this.deck.push(new Card(suit, rank));
            });
        });
        this.shuffle();
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    deal() {
        return this.deck.pop();
    }
}

class Hand {
    constructor() {
        this.cards = [];
        this.value = 0;
        this.aces = 0;
    }

    add(card) {
        this.cards.push(card);
        this.value += card.value;
        if (card.rank === "Ace") this.aces++;
        this.adjust();
    }

    adjust() {
        while (this.value > 21 && this.aces > 0) {
            this.value -= 10;
            this.aces--;
        }
    }
}

// ----------------------
// Gestione saldo
// ----------------------
function loadBalance() {
    return Number(localStorage.getItem("blackjack_balance")) || 1000;
}

function saveBalance(amount) {
    localStorage.setItem("blackjack_balance", amount);
}

// ----------------------
// Statistiche
// ----------------------
function loadStats() {
    const stats = localStorage.getItem("blackjack_stats");
    return stats ? JSON.parse(stats) : {
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        totalWinnings: 0,
        biggestWin: 0,
        blackjacks: 0
    };
}

function saveStats(stats) {
    localStorage.setItem("blackjack_stats", JSON.stringify(stats));
}

// ----------------------
// UI
// ----------------------
const app = document.querySelector("#app");

app.innerHTML = `
    <h1><i class="fas fa-club"></i> Blackjack Pro <i class="fas fa-spade"></i></h1>
    
    <div id="balance">
        <i class="fas fa-coins"></i>
        <span id="balance-value">Loading...</span>
    </div>

    <div class="betting-section">
        <div class="bet-controls">
            <input id="bet-input" type="number" placeholder="Enter bet" min="1" />
            <button id="bet-btn" class="btn-green">
                <i class="fas fa-play"></i> Start Round
            </button>
            <button id="rebet-btn" class="btn-gold" style="display:none;">
                <i class="fas fa-redo"></i> Bet Same
            </button>
        </div>
        
        <div class="quick-bet-container">
            <small>Quick bets:</small>
            <button class="quick-bet" data-amount="10">$10</button>
            <button class="quick-bet" data-amount="25">$25</button>
            <button class="quick-bet" data-amount="50">$50</button>
            <button class="quick-bet" data-amount="100">$100</button>
            <button class="quick-bet" data-amount="250">$250</button>
            <button class="quick-bet" data-amount="500">$500</button>
        </div>
    </div>

    <div class="stats">
        <div class="stat-item">
            <div class="stat-label">Games Played</div>
            <div class="stat-value" id="games-played">0</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Win Rate</div>
            <div class="stat-value" id="win-rate">0%</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Biggest Win</div>
            <div class="stat-value" id="biggest-win">$0</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Blackjacks</div>
            <div class="stat-value" id="blackjack-count">0</div>
        </div>
    </div>

    <h2><i class="fas fa-robot"></i> Dealer</h2>
    <div id="dealer-cards" class="card-row"></div>
    <div id="dealer-value" class="hand-value"></div>

    <h2><i class="fas fa-user"></i> Player</h2>
    <div id="player-cards" class="card-row"></div>
    <div id="player-value" class="hand-value"></div>

    <div class="game-controls">
        <button id="hit-btn" class="btn">
            <i class="fas fa-plus-circle"></i> Hit
        </button>
        <button id="stand-btn" class="btn-red">
            <i class="fas fa-hand-paper"></i> Stand
        </button>
        <button id="double-btn" class="btn-gold" style="display:none;">
            <i class="fas fa-angle-double-right"></i> Double Down
        </button>
    </div>

    <div id="message" class="message-neutral"></div>
`;

// Elementi DOM
const balanceElm = document.getElementById("balance-value");
const messageElm = document.getElementById("message");
const dealerElm = document.getElementById("dealer-cards");
const playerElm = document.getElementById("player-cards");
const dealerValueElm = document.getElementById("dealer-value");
const playerValueElm = document.getElementById("player-value");
const betInput = document.getElementById("bet-input");
const betBtn = document.getElementById("bet-btn");
const hitBtn = document.getElementById("hit-btn");
const standBtn = document.getElementById("stand-btn");
const doubleBtn = document.getElementById("double-btn");
const rebetBtn = document.getElementById("rebet-btn");

// Elementi statistiche
const gamesPlayedElm = document.getElementById("games-played");
const winRateElm = document.getElementById("win-rate");
const biggestWinElm = document.getElementById("biggest-win");
const blackjackCountElm = document.getElementById("blackjack-count");

// ----------------------
// Stato di gioco
// ----------------------
let balance = loadBalance();
let stats = loadStats();
let deck, player, dealer, bet;
let roundActive = false;
let lastBet = 0;
let canDouble = false;

updateUI();
disableActions(true);

// ----------------------
function updateUI() {
    balanceElm.textContent = `$${balance.toLocaleString()}`;
    gamesPlayedElm.textContent = stats.gamesPlayed;
    winRateElm.textContent = stats.gamesPlayed > 0 
        ? `${Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%` 
        : "0%";
    biggestWinElm.textContent = `$${stats.biggestWin.toLocaleString()}`;
    blackjackCountElm.textContent = stats.blackjacks;
    
    // Aggiorna colore del balance
    const balanceElement = document.querySelector('#balance');
    if (balance >= 1000) {
        balanceElement.style.borderColor = 'var(--accent-gold)';
    } else if (balance >= 100) {
        balanceElement.style.borderColor = 'var(--accent-green)';
    } else {
        balanceElement.style.borderColor = 'var(--accent-red)';
    }
}

// ----------------------
function getCardSymbol(rank) {
    const symbols = {
        'Two': '2', 'Three': '3', 'Four': '4', 'Five': '5', 
        'Six': '6', 'Seven': '7', 'Eight': '8', 'Nine': '9',
        'Ten': '10', 'Jack': 'J', 'Queen': 'Q', 'King': 'K', 'Ace': 'A'
    };
    return symbols[rank] || rank[0];
}

// ----------------------
// FUNZIONE RENDER CARDS CORRETTA
// ----------------------
function renderCards(container, hand, hideFirstCard = false) {
    container.innerHTML = "";
    
    hand.cards.forEach((card, index) => {
        const cardElement = document.createElement("div");
        
        if (hideFirstCard && index === 0) {
            // Carta coperta
            cardElement.className = "card card-back";
            cardElement.innerHTML = `
                <div class="card-inner">
                    <div class="card-center">?</div>
                </div>
            `;
        } else {
            // Carta scoperta - determina il colore in base al seme
            const isRed = card.suit === "♥" || card.suit === "♦";
            const colorClass = isRed ? "card-red" : "card-black";
            const rankSymbol = getCardSymbol(card.rank);
            
            // Colore del testo
            const textColor = isRed ? "#e53935" : "#263238";
            
            cardElement.className = `card ${colorClass}`;
            cardElement.style.cssText = `
                background: white;
                border: 2px solid ${textColor};
                border-radius: 8px;
                color: ${textColor};
                position: relative;
            `;
            
            cardElement.innerHTML = `
                <div class="card-inner">
                    <div class="card-corner top-left">
                        <div class="card-rank">${rankSymbol}</div>
                        <div class="card-suit">${card.suit}</div>
                    </div>
                    
                    <div class="card-center-large">
                        ${card.suit}
                    </div>
                    
                    <div class="card-corner bottom-right">
                        <div class="card-rank">${rankSymbol}</div>
                        <div class="card-suit">${card.suit}</div>
                    </div>
                </div>
            `;
            
            // Aggiungi animazione
            cardElement.classList.add("new-card");
            cardElement.style.animationDelay = `${index * 0.1}s`;
        }
        
        // Dimensioni della carta
        cardElement.style.width = "100px";
        cardElement.style.height = "140px";
        cardElement.style.display = "inline-flex";
        cardElement.style.margin = "0 5px";
        cardElement.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
        
        container.appendChild(cardElement);
    });
}

// ----------------------
function disableActions(disabled) {
    // Se il giocatore ha 21, disabilita Hit e Double
    if (player && player.value === 21 && roundActive) {
        hitBtn.disabled = true;
        doubleBtn.disabled = true;
        
        hitBtn.style.opacity = "0.6";
        doubleBtn.style.opacity = "0.6";
        
        // Ma lascia Stand abilitato (anche se verrà chiamato automaticamente)
        standBtn.disabled = false;
        standBtn.style.opacity = "1";
    } else {
        // Comportamento normale
        hitBtn.disabled = disabled;
        standBtn.disabled = disabled;
        doubleBtn.disabled = disabled;
        
        if (disabled) {
            hitBtn.style.opacity = "0.5";
            standBtn.style.opacity = "0.5";
            doubleBtn.style.opacity = "0.5";
        } else {
            hitBtn.style.opacity = "1";
            standBtn.style.opacity = "1";
            doubleBtn.style.opacity = "1";
        }
    }
}

// ----------------------
function updateBetInputState() {
    const currentBet = Number(betInput.value);
    if (currentBet > balance) {
        betInput.style.border = "2px solid var(--accent-red)";
        betBtn.disabled = true;
    } else if (currentBet <= 0) {
        betInput.style.border = "2px solid var(--accent-red)";
        betBtn.disabled = true;
    } else {
        betInput.style.border = "2px solid var(--accent-green)";
        betBtn.disabled = false;
    }
}

// ----------------------
function startRound() {
    bet = Number(betInput.value);
    lastBet = bet;

    if (!bet || bet <= 0 || bet > balance) {
        showMessage("Invalid bet amount!", "error");
        return;
    }

    deck = new Deck();
    player = new Hand();
    dealer = new Hand();
    
    messageElm.className = "message-neutral";
    messageElm.textContent = "Game started! Good luck!";

    // Distribuisci carte
    player.add(deck.deal());
    dealer.add(deck.deal());
    player.add(deck.deal());
    dealer.add(deck.deal());

    roundActive = true;
    canDouble = (balance >= bet * 2) && player.cards.length === 2;
    
    disableActions(false);
    doubleBtn.style.display = canDouble ? "inline-flex" : "none";
    rebetBtn.style.display = "none";
    renderEverything();

    // Controlla blackjack immediato
    if (player.value === 21) {
        showMessage("Blackjack! Automatic stand", "win");
        setTimeout(() => {
            playerStand();
        }, 1500);
    }
}

// ----------------------
function renderEverything() {
    renderCards(dealerElm, dealer, roundActive);
    renderCards(playerElm, player);
    
    dealerValueElm.textContent = roundActive 
        ? `Value: ${dealer.cards[0].value} + ?` 
        : `Value: ${dealer.value}`;
    
    playerValueElm.textContent = `Value: ${player.value}`;
    
    // Evidenza speciale per 21
    if (player.value === 21 && roundActive) {
        playerValueElm.style.color = "#2e8b57";
        playerValueElm.style.fontWeight = "bold";
        playerValueElm.style.textShadow = "0 0 10px rgba(46, 139, 87, 0.3)";
    } else {
        playerValueElm.style.color = "";
        playerValueElm.style.fontWeight = "";
        playerValueElm.style.textShadow = "";
    }
    
    // Aggiorna il messaggio
    if (roundActive) {
        if (player.value === 21) {
            messageElm.textContent = `Perfect 21! Automatic stand...`;
            messageElm.style.color = "#2e8b57";
        } else if (player.value > 21) {
            messageElm.textContent = `Bust! ${player.value} points`;
        } else {
            messageElm.textContent = `Your turn: ${player.value} points`;
            messageElm.style.color = "";
        }
    }
}

// ----------------------
function playerHit() {
    if (!roundActive || player.value === 21) return;
    
    player.add(deck.deal());
    canDouble = false;
    doubleBtn.style.display = "none";
    renderEverything();

    // Se il giocatore arriva a 21, fai stand automatico
    if (player.value === 21) {
        showMessage("21! Automatic stand", "neutral");
        setTimeout(() => playerStand(), 1000);
        return;
    }

    if (player.value > 21) {
        setTimeout(() => endRound("bust"), 500);
    } else if (player.cards.length === 5 && player.value <= 21) {
        setTimeout(() => endRound("charlie"), 500);
    }
}

// ----------------------
function playerStand() {
    if (!roundActive) return;
    roundActive = false;
    
    // Rivela tutte le carte del dealer
    renderCards(dealerElm, dealer);
    
    // Logica del dealer
    let dealerAction = "";
    while (dealer.value < 17) {
        dealer.add(deck.deal());
        dealerAction += `Dealer hits... ${dealer.value}<br>`;
    }
    
    if (dealerAction) {
        showMessage(dealerAction, "neutral");
    }
    
    setTimeout(() => {
        let result = "";
        if (dealer.value > 21) result = "dealer_bust";
        else if (dealer.value > player.value) result = "dealer_win";
        else if (dealer.value < player.value) result = "player_win";
        else result = "tie";

        endRound(result);
    }, 1000);
}

// ----------------------
function playerDouble() {
    if (!roundActive || !canDouble || balance < bet * 2 || player.value === 21) return;
    
    bet *= 2;
    playerHit(); // Prendi una carta e poi fai stand automaticamente
    if (player.value <= 21) {
        setTimeout(() => playerStand(), 500);
    }
}

// ----------------------
function showMessage(text, type = "neutral") {
    messageElm.innerHTML = text;
    messageElm.className = "";
    
    switch(type) {
        case "win":
            messageElm.classList.add("message-win");
            break;
        case "lose":
            messageElm.classList.add("message-lose");
            break;
        case "error":
            messageElm.classList.add("message-lose");
            break;
        default:
            messageElm.classList.add("message-neutral");
            if (text.includes("21") || text.includes("Blackjack")) {
                messageElm.style.color = "#2e8b57";
                messageElm.style.fontWeight = "bold";
            }
    }
}

// ----------------------
async function endRound(result) {
    roundActive = false;
    disableActions(true);
    
    // Aggiorna statistiche
    stats.gamesPlayed++;
    
    let resultText = "";
    let delta = 0;
    let messageType = "neutral";

    switch (result) {
        case "blackjack":
            delta = Math.floor(bet * 1.5); // 3:2 payout
            resultText = `BLACKJACK! You win $${delta}`;
            messageType = "win";
            stats.gamesWon++;
            stats.blackjacks++;
            break;
        case "charlie":
            delta = bet;
            resultText = `5-Card Charlie! You win $${delta}`;
            messageType = "win";
            stats.gamesWon++;
            break;
        case "bust":
            delta = -bet;
            resultText = `Bust! You lose $${bet}`;
            messageType = "lose";
            stats.gamesLost++;
            break;
        case "dealer_bust":
            delta = bet;
            resultText = `Dealer busts! You win $${delta}`;
            messageType = "win";
            stats.gamesWon++;
            break;
        case "player_win":
            delta = bet;
            resultText = `You win! +$${delta}`;
            messageType = "win";
            stats.gamesWon++;
            break;
        case "dealer_win":
            delta = -bet;
            resultText = `Dealer wins. You lose $${bet}`;
            messageType = "lose";
            stats.gamesLost++;
            break;
        case "tie":
            delta = 0;
            resultText = `Push! Bet returned.`;
            messageType = "neutral";
            break;
    }

    // Aggiorna balance
    balance += delta;
    stats.totalWinnings += delta;
    
    if (delta > stats.biggestWin) {
        stats.biggestWin = delta;
    }
    
    saveBalance(balance);
    saveStats(stats);
    
    // Mostra risultato
    renderCards(dealerElm, dealer);
    dealerValueElm.textContent = `Value: ${dealer.value}`;
    playerValueElm.textContent = `Value: ${player.value}`;
    
    showMessage(resultText, messageType);
    updateUI();
    
    // Prepara per il prossimo round
    setTimeout(() => {
        if (balance <= 0) {
            showMessage("Game Over! You're out of money. Refresh to reset.", "error");
        } else {
            rebetBtn.style.display = "inline-flex";
            betInput.value = "";
            updateBetInputState();
            
            if (lastBet <= balance) {
                showMessage(`Round over. Balance: $${balance}. Enter a new bet or click "Bet Same"`, "neutral");
            } else {
                showMessage(`Round over. Balance: $${balance}. Enter a smaller bet`, "neutral");
            }
        }
    }, 2000);

    // Invia a PocketBase
    await pbSend({
        player_balance: balance,
        bet_amount: bet,
        result,
        player_score: player.value,
        dealer_score: dealer.value,
        player_cards: player.cards.map(c => `${c.rank} of ${c.suit}`).join(", "),
        dealer_cards: dealer.cards.map(c => `${c.rank} of ${c.suit}`).join(", "),
        timestamp: new Date().toISOString()
    });
}

// ----------------------
function rebet() {
    if (lastBet > 0 && lastBet <= balance) {
        betInput.value = lastBet;
        updateBetInputState();
        startRound();
    } else if (lastBet > balance) {
        showMessage(`Cannot bet $${lastBet}. You only have $${balance}`, "error");
    }
}

// ----------------------
// Event Listeners
// ----------------------
betBtn.onclick = startRound;
hitBtn.onclick = playerHit;
standBtn.onclick = playerStand;
doubleBtn.onclick = playerDouble;
rebetBtn.onclick = rebet;

// Validazione input in tempo reale
betInput.addEventListener("input", updateBetInputState);

// Puntate rapide
document.addEventListener("click", function(e) {
    if (e.target.classList.contains("quick-bet")) {
        const amount = parseInt(e.target.dataset.amount);
        if (amount <= balance) {
            betInput.value = amount;
            updateBetInputState();
            betInput.focus();
        } else {
            showMessage(`Insufficient funds for $${amount} bet`, "error");
        }
    }
});

// Reset con doppio click sul balance
let balanceClickCount = 0;
document.getElementById("balance").addEventListener("dblclick", function() {
    if (confirm("Reset balance to $1000? This will clear all stats.")) {
        balance = 1000;
        stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            totalWinnings: 0,
            biggestWin: 0,
            blackjacks: 0
        };
        saveBalance(balance);
        saveStats(stats);
        updateUI();
        showMessage("Balance reset to $1000", "neutral");
    }
});

// Tasti rapidi da tastiera
document.addEventListener("keydown", function(e) {
    if (!roundActive) return;
    
    // Se il giocatore ha 21, blocca tutte le azioni tranne Stand
    if (player.value === 21) {
        if (e.key.toLowerCase() === 's') {
            playerStand();
        }
        return;
    }
    
    switch(e.key.toLowerCase()) {
        case 'h':
            playerHit();
            break;
        case 's':
            playerStand();
            break;
        case 'd':
            if (doubleBtn.style.display !== "none" && player.value !== 21) playerDouble();
            break;
        case ' ':
            e.preventDefault();
            if (roundActive && player.value !== 21) playerHit();
            break;
    }
});

// Mostra aiuto per i tasti
setTimeout(() => {
    showMessage("Tip: Use H (Hit), S (Stand), D (Double) during game", "neutral");
}, 3000);

// Aggiungi stili CSS per le carte
const cardStyles = document.createElement('style');
cardStyles.textContent = `
    .card {
        width: 100px;
        height: 140px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        position: relative;
        display: inline-flex;
        margin: 0 5px;
        overflow: hidden;
    }
    
    .card-red .card-inner {
        color: #e53935 !important;
    }
    
    .card-black .card-inner {
        color: #263238 !important;
    }
    
    .card-inner {
        position: relative;
        width: 100%;
        height: 100%;
        padding: 10px;
    }
    
    .card-corner {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        font-size: 12px;
        line-height: 1;
    }
    
    .top-left {
        top: 8px;
        left: 8px;
        text-align: center;
    }
    
    .bottom-right {
        bottom: 8px;
        right: 8px;
        transform: rotate(180deg);
        text-align: center;
    }
    
    .card-rank {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 2px;
    }
    
    .card-suit {
        font-size: 14px;
    }
    
    .card-center-large {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 48px;
    }
    
    .card-back {
        background: linear-gradient(45deg, #1a237e 25%, #283593 25%, #283593 50%, 
                          #1a237e 50%, #1a237e 75%, #283593 75%);
        background-size: 20px 20px;
        border: 3px solid #1a237e;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .new-card {
        animation: dealCard 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        transform-origin: center;
    }
    
    @keyframes dealCard {
        0% {
            transform: translateY(-100px) rotateY(-90deg) rotateZ(-10deg);
            opacity: 0;
        }
        50% {
            opacity: 0.8;
        }
        100% {
            transform: translateY(0) rotateY(0) rotateZ(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(cardStyles);