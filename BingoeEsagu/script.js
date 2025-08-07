document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const elements = {
        playerCountInput: document.getElementById('player-count'),
        winConditionSelect: document.getElementById('win-condition'),
        startGameBtn: document.getElementById('start-game'),
        callNumberBtn: document.getElementById('call-number'),
        resetGameBtn: document.getElementById('reset-game'),
        currentNumberDisplay: document.getElementById('current-number'),
        currentNumberContainer: document.getElementById('current-number-container'),
        playersCountDisplay: document.getElementById('players-count'),
        calledCountDisplay: document.getElementById('called-count'),
        winnersCountDisplay: document.getElementById('winners-count'),
        winnerModal: document.getElementById('winner-modal'),
        winnerMessage: document.getElementById('winner-message'),
        closeModalBtn: document.getElementById('close-modal'),
        letterGrid: document.getElementById('letter-grid'),
        historyList: document.getElementById('history-list'),
        letterPatternDisplay: document.getElementById('letter-pattern-display')
    };

    // Variables del juego
    const gameState = {
        players: [],
        calledNumbers: [],
        availableNumbers: [],
        gameActive: false,
        winners: [],
        currentLetterPattern: null,
        currentColumnMode: null
    };

    // Rangos de números para cada columna
    const columnRanges = {
        'B': [1, 15],
        'I': [16, 30],
        'N': [31, 45],
        'G': [46, 60],
        'O': [61, 75]
    };
    
    // Patrones de letras (fila, columna)
    const letterPatterns = {
        'B': {
            name: "Letra B",
            cells: [
                [0,0], [0,1], [0,2], [0,3], [0,4],
                [1,0],        [1,2],        [1,4],
                [2,0],        [2,2],        [2,4],
                [3,0],        [3,2],        [3,4],
                [4,0], [4,1], [4,2], [4,3], [4,4]
            ]
        },
        'I': {
            name: "Letra I",
            cells: [
                        [0,2],
                        [1,2],
                        [2,2],
                        [3,2],
                        [4,2]
            ]
        },
        'N': {
            name: "Letra N",
            cells: [
                [0,0],                   [0,4],
                [1,0], [1,1],            [1,4],
                [2,0],        [2,2],     [2,4],
                [3,0],             [3,3],[3,4],
                [4,0],                   [4,4]
            ]
        },
        'G': {
            name: "Letra G",
            cells: [
                [0,0], [0,1], [0,2], [0,3],
                [1,0],
                [2,0],        [2,2], [2,3],
                [3,0],             [3,3],
                [4,0], [4,1], [4,2], [4,3]
            ]
        },
        'O': {
            name: "Letra O",
            cells: [
                [0,0], [0,1], [0,2], [0,3], [0,4],
                [1,0],                   [1,4],
                [2,0],                   [2,4],
                [3,0],                   [3,4],
                [4,0], [4,1], [4,2], [4,3], [4,4]
            ]
        }
    };

    // Inicializar el juego
    function initGame() {
        const playerCount = parseInt(elements.playerCountInput.value);
        
        // Validar número de jugadores
        if (playerCount < 10 || playerCount > 10000) {
            alert('El número de jugadores debe estar entre 10 y 10,000');
            return;
        }
        
        const winCondition = elements.winConditionSelect.value;
        
        // Resetear variables
        gameState.players = [];
        gameState.calledNumbers = [];
        gameState.winners = [];
        gameState.currentLetterPattern = null;
        gameState.currentColumnMode = null;
        
        // Configurar números disponibles según modo de juego
        if (['B', 'I', 'N', 'G', 'O'].includes(winCondition)) {
            gameState.currentColumnMode = winCondition;
            const [min, max] = columnRanges[winCondition];
            gameState.availableNumbers = Array.from({length: max - min + 1}, (_, i) => min + i);
        } else {
            gameState.availableNumbers = Array.from({length: 75}, (_, i) => i + 1);
        }
        
        shuffleArray(gameState.availableNumbers);
        
        // Crear jugadores
        for (let i = 0; i < playerCount; i++) {
            gameState.players.push({
                id: i + 1,
                card: createBingoCard(winCondition)
            });
        }
        
        // Configurar interfaz
        clearNumberDisplay();
        elements.currentNumberDisplay.textContent = '-';
        updateStats();
        
        // Configurar vista según modo de juego
        if (winCondition.startsWith('letter-')) {
            const letter = winCondition.split('-')[1];
            gameState.currentLetterPattern = letterPatterns[letter];
            setupLetterPatternView(letter);
            elements.letterPatternDisplay.style.display = 'block';
            elements.currentNumberContainer.style.display = 'none';
        } else {
            elements.letterPatternDisplay.style.display = 'none';
            elements.currentNumberContainer.style.display = 'flex';
        }
        
        // Habilitar/deshabilitar controles
        gameState.gameActive = true;
        elements.startGameBtn.disabled = true;
        elements.callNumberBtn.disabled = false;
        elements.resetGameBtn.disabled = false;
        elements.playerCountInput.disabled = true;
        elements.winConditionSelect.disabled = true;
    }

    // Resto del código permanece igual...
    // Crear cartón de bingo
    function createBingoCard(winCondition) {
        const card = {
            B: generateColumnNumbers(1, 15),
            I: generateColumnNumbers(16, 30),
            N: generateColumnNumbers(31, 45),
            G: generateColumnNumbers(46, 60),
            O: generateColumnNumbers(61, 75),
            isWinner: false
        };

        if (winCondition.startsWith('letter-')) {
            const letter = winCondition.split('-')[1];
            const pattern = letterPatterns[letter].cells;
            
            pattern.forEach(([row, col]) => {
                const colLetter = ['B', 'I', 'N', 'G', 'O'][col];
                card[colLetter][row].inPattern = true;
            });
        }
        
        return card;
    }

    // Configurar vista del patrón de letra (VERSIÓN CORREGIDA)
    function setupLetterPatternView(letter) {
        elements.letterGrid.innerHTML = '';
        
        // 1. Crear silueta de fondo
        const silhouette = document.createElement('div');
        silhouette.className = 'letter-silhouette';
        silhouette.textContent = letter;
        elements.letterGrid.appendChild(silhouette);
        
        // 2. Crear contenedor de celdas
        const cellsContainer = document.createElement('div');
        cellsContainer.className = 'letter-cells-container';
        
        // 3. Generar celdas del patrón
        const pattern = letterPatterns[letter].cells;
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                const cell = document.createElement('div');
                cell.className = 'letter-cell';
                
                if (pattern.some(pos => pos[0] === row && pos[1] === col)) {
                    cell.classList.add('pattern-cell');
                }
                
                cellsContainer.appendChild(cell);
            }
        }
        
        elements.letterGrid.appendChild(cellsContainer);
        document.getElementById('current-letter-name').textContent = letterPatterns[letter].name;
    }

    // Generar números para una columna
    function generateColumnNumbers(min, max) {
        const numbers = [];
        const available = Array.from({length: max - min + 1}, (_, i) => min + i);
        
        for (let i = 0; i < 5; i++) {
            const randomIndex = Math.floor(Math.random() * available.length);
            numbers.push({
                number: available[randomIndex],
                isCalled: false,
                inPattern: false
            });
            available.splice(randomIndex, 1);
        }
        
        return numbers;
    }

    // Llamar número
    function callNumber() {
        if (!gameState.gameActive || gameState.availableNumbers.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * gameState.availableNumbers.length);
        const number = gameState.availableNumbers[randomIndex];
        const letter = getLetterForNumber(number);
        
        gameState.availableNumbers.splice(randomIndex, 1);
        gameState.calledNumbers.push(number);
        
        const winCondition = elements.winConditionSelect.value;
        
        if (winCondition.startsWith('letter-')) {
            elements.currentNumberContainer.style.display = 'none';
        } else {
            elements.currentNumberDisplay.textContent = number;
            elements.currentNumberContainer.style.display = 'flex';
        }
        
        updateStats();
        updateHistoryList(number, letter);
        updateCardsWithNumber(number);
        checkWinners();
        
        if (gameState.availableNumbers.length === 0) {
            endGame();
        }
    }

    // Obtener letra correspondiente a un número
    function getLetterForNumber(number) {
        if (number <= 15) return 'B';
        if (number <= 30) return 'I';
        if (number <= 45) return 'N';
        if (number <= 60) return 'G';
        return 'O';
    }

    // Actualizar lista de historial
    function updateHistoryList(number, letter) {
        const winCondition = elements.winConditionSelect.value;
        
        if (gameState.calledNumbers.length === 0 || 
            (gameState.currentColumnMode && !elements.historyList.querySelector('.history-column'))) {
            elements.historyList.innerHTML = '';
        }

        if (!elements.historyList.querySelector('.history-column') && !gameState.currentColumnMode) {
            ['B', 'I', 'N', 'G', 'O'].forEach(l => {
                const columnDiv = document.createElement('div');
                columnDiv.className = 'history-column';
                columnDiv.id = `history-${l}`;
                
                const title = document.createElement('div');
                title.className = 'history-column-title';
                title.textContent = `${l} (${columnRanges[l][0]}-${columnRanges[l][1]})`;
                
                const numbersGroup = document.createElement('div');
                numbersGroup.className = 'history-numbers-group';
                
                columnDiv.appendChild(title);
                columnDiv.appendChild(numbersGroup);
                elements.historyList.appendChild(columnDiv);
            });
        }

        if (gameState.currentColumnMode) {
            if (letter !== gameState.currentColumnMode) return;
            
            if (!elements.historyList.querySelector('.history-column')) {
                const columnDiv = document.createElement('div');
                columnDiv.className = 'history-column';
                
                const title = document.createElement('div');
                title.className = 'history-column-title';
                title.textContent = `${letter} (${columnRanges[letter][0]}-${columnRanges[letter][1]})`;
                
                const numbersGroup = document.createElement('div');
                numbersGroup.className = 'history-numbers-group';
                
                columnDiv.appendChild(title);
                columnDiv.appendChild(numbersGroup);
                elements.historyList.appendChild(columnDiv);
            }
        }

        const numberElement = document.createElement('div');
        numberElement.className = 'history-number called';
        numberElement.textContent = number;

        if (gameState.currentColumnMode) {
            elements.historyList.querySelector('.history-numbers-group').prepend(numberElement);
        } else {
            document.querySelector(`#history-${letter} .history-numbers-group`).prepend(numberElement);
        }

        const maxNumbers = gameState.currentColumnMode ? 30 : 15;
        const numbersContainers = elements.historyList.querySelectorAll('.history-numbers-group');
        
        numbersContainers.forEach(container => {
            while (container.children.length > maxNumbers) {
                container.removeChild(container.lastChild);
            }
        });
    }

    // Actualizar cartones con el número llamado
    function updateCardsWithNumber(number) {
        gameState.players.forEach(player => {
            if (player.card.isWinner) return;
            
            ['B', 'I', 'N', 'G', 'O'].forEach(letter => {
                player.card[letter].forEach(cell => {
                    if (cell.number === number) {
                        cell.isCalled = true;
                    }
                });
            });
        });
    }

    // Verificar ganadores
    function checkWinners() {
        const winCondition = elements.winConditionSelect.value;
        let hasAnyWinner = false;
        
        gameState.players.forEach(player => {
            if (player.card.isWinner) return;
            
            let hasWon = false;
            
            if (winCondition.startsWith('letter-')) {
                const letter = winCondition.split('-')[1];
                hasWon = checkLetterPattern(player.card, letter);
            } else {
                switch (winCondition) {
                    case 'B': case 'I': case 'N': case 'G': case 'O':
                        hasWon = checkColumn(player.card, winCondition);
                        break;
                    case 'corners':
                        hasWon = checkCorners(player.card);
                        break;
                    case 'full':
                        hasWon = checkFullCard(player.card);
                        break;
                }
            }
            
            if (hasWon) {
                player.card.isWinner = true;
                gameState.winners.push(player);
                hasAnyWinner = true;
            }
        });
        
        if (hasAnyWinner) {
            showWinner();
        }
    }

    // Verificar patrón de letra
    function checkLetterPattern(card, letter) {
        const pattern = letterPatterns[letter].cells;
        
        return pattern.every(([row, col]) => {
            const colLetter = ['B', 'I', 'N', 'G', 'O'][col];
            const cell = card[colLetter][row];
            return cell.isCalled;
        });
    }

    // Verificar columna completa
    function checkColumn(card, column) {
        return card[column].every(cell => cell.isCalled);
    }

    // Verificar 4 esquinas
    function checkCorners(card) {
        const corners = [
            card.B[0], card.B[4], 
            card.O[0], card.O[4]
        ];
        return corners.every(cell => cell.isCalled);
    }

    // Verificar cartón lleno
    function checkFullCard(card) {
        return ['B', 'I', 'N', 'G', 'O'].every(letter => 
            card[letter].every(cell => cell.isCalled)
        );
    }

    // Mostrar ganador
    function showWinner() {
        const winCondition = elements.winConditionSelect.value;
        let conditionText = '';
        
        if (winCondition.startsWith('letter-')) {
            const letter = winCondition.split('-')[1];
            conditionText = letterPatterns[letter].name;
        } else {
            switch (winCondition) {
                case 'B': case 'I': case 'N': case 'G': case 'O':
                    conditionText = `Columna ${winCondition}`;
                    break;
                case 'corners':
                    conditionText = '4 esquinas';
                    break;
                case 'full':
                    conditionText = 'Cartón lleno';
                    break;
            }
        }
        
        elements.winnerMessage.textContent = `Se completó el patrón: ${conditionText}`;
        elements.winnerModal.style.display = 'flex';
        updateStats();
    }

    // Finalizar juego
    function endGame() {
        gameState.gameActive = false;
        elements.callNumberBtn.disabled = true;
        
        if (gameState.winners.length === 0) {
            elements.winnerMessage.textContent = '¡Juego terminado! No se completaron patrones.';
            elements.winnerModal.style.display = 'flex';
        }
    }

    // Reiniciar juego
    function resetGame() {
        gameState.gameActive = false;
        gameState.players = [];
        gameState.calledNumbers = [];
        gameState.availableNumbers = [];
        gameState.winners = [];
        gameState.currentLetterPattern = null;
        gameState.currentColumnMode = null;
        
        clearNumberDisplay();
        elements.currentNumberDisplay.textContent = '-';
        elements.currentNumberContainer.style.display = 'none';
        updateStats();
        
        elements.letterPatternDisplay.style.display = 'none';
        elements.startGameBtn.disabled = false;
        elements.callNumberBtn.disabled = true;
        elements.resetGameBtn.disabled = true;
        elements.playerCountInput.disabled = false;
        elements.winConditionSelect.disabled = false;
        
        elements.winnerModal.style.display = 'none';
    }

    // Limpiar display de números
    function clearNumberDisplay() {
        elements.historyList.innerHTML = '';
        if (elements.letterGrid) elements.letterGrid.innerHTML = '';
    }

    // Actualizar estadísticas
    function updateStats() {
        elements.playersCountDisplay.textContent = gameState.players.length;
        elements.calledCountDisplay.textContent = gameState.calledNumbers.length;
        elements.winnersCountDisplay.textContent = gameState.winners.length;
    }

    // Función para mezclar array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Event listeners
    elements.startGameBtn.addEventListener('click', initGame);
    elements.callNumberBtn.addEventListener('click', callNumber);
    elements.resetGameBtn.addEventListener('click', resetGame);
    elements.closeModalBtn.addEventListener('click', () => {
        elements.winnerModal.style.display = 'none';
    });
});