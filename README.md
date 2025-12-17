### Blackjack
## Caratteristiche
# Meccaniche di Gioco Complete
Regole classiche del Blackjack con dealer che pesca fino a 17

Blackjack (21 con 2 carte): payout 3:2

5-Card Charlie: vittoria automatica con 5 carte sotto 21

Stand automatico a 21 con qualsiasi numero di carte

Double Down disponibile solo sul primo turno

Sistema di scommesse con chip preimpostati

# Interfaccia Elegante
Tavolo verde da casinò con design realistico

Carte animate con distribuzione fluida

Chip colorate per scommesse rapide

Bottoni con feedback tattile e gradienti eleganti

Statistiche in tempo reale (partite giocate, win rate, ecc.)

Design completamente responsive per tutti i dispositivi

# Funzionalità Tecniche
Salvataggio locale del saldo e statistiche (localStorage)

Supporto per PocketBase (opzionale per il salvataggio cloud)

Tasti rapidi da tastiera (H=Hit, S=Stand, D=Double)

Animazioni CSS3 fluide per le carte

Validazione in tempo reale delle scommesse

Reset del saldo con doppio click

# Installazione
Metodo 1: Apertura Diretta (più semplice)
Scarica o clona il repository

Apri il file index.html nel tuo browser preferito

Metodo 2: Server Locale (consigliato)
bash
# Con Python
python -m http.server 8000
# Poi apri http://localhost:8000

# Con Node.js
npx serve .
# O
npx http-server
Metodo 3: Con PocketBase (opzionale)
Installa PocketBase

Avvia PocketBase:

bash
./pocketbase serve
Modifica l'URL in main.js se necessario

# Come Giocare
Imposta la puntata usando l'input o i chip rapidi

Clicca "Start Round" per iniziare la partita

Scegli la tua mossa:

Hit (H): Pesca una carta

Stand (S): Mantieni la mano corrente

Double Down (D): Raddoppia la puntata e pesca una carta

Vinci se:

Fai Blackjack (21 con 2 carte)

Il tuo punteggio è maggiore di quello del dealer

Il dealer sballa (>21)

Fai 5-Card Charlie (5 carte sotto 21)

# Statistiche
Il gioco traccia:

✅ Partite giocate

✅ Percentuale di vittorie

✅ Vincita più alta

✅ Blackjack totali

✅ Saldo attuale

# Tasti Rapidi
Tasto	Azione
H	Hit (Pesca carta)
S	Stand (Stai)
D	Double Down (Raddoppia)
Spazio	Hit (alternativa)
Doppio click sul saldo	Reset a $1000
# Struttura del Progetto
text
blackjack-pro/
├── index.html          # Struttura principale
├── style.css           # Stili CSS completi
├── main.js             # Logica di gioco JavaScript
├── README.md           # Questo file
└── (opzionale)
    ├── pocketbase/     # Database PocketBase
    └── assets/         # Immagini e risorse
# Personalizzazione
Modificare i Colori
I colori sono definiti in CSS tramite variabili:

css
:root {
    --table-green: #0a472a;
    --accent-gold: #b08d57;
    --accent-green: #2e8b57;
    --accent-red: #c53030;
    /* ... */
}
Aggiungere Chip Personalizzati
Modifica la sezione quick-bet-container in main.js:

javascript
<button class="quick-bet" data-amount="1000">$1000</button>
Disabilitare PocketBase
Commenta le righe relative a PocketBase in main.js:

javascript
// const POCKETBASE_URL = "http://127.0.0.1:8090";
// const COLLECTION = "blackjack_stats";

# Compatibilità
✅ Chrome 60+

✅ Firefox 55+

✅ Safari 12+

✅ Edge 79+

✅ Mobile Chrome/Safari

# Risoluzione Problemi
Le carte non si vedono
Assicurati che il file style.css sia nella stessa cartella di index.html

Bottoni non funzionanti
Controlla la console del browser (F12) per errori JavaScript

PocketBase non raggiungibile
Verifica che PocketBase sia in esecuzione all'indirizzo http://127.0.0.1:8090

# Tecnologie Utilizzate
HTML5 - Struttura della pagina

CSS3 - Stili e animazioni

JavaScript ES6+ - Logica di gioco

Font Awesome - Icone

Google Fonts - Tipografia

LocalStorage - Salvataggio dati

PocketBase - Database backend (opzionale)
