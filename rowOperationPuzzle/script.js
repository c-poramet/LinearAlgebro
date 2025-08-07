class RowOperationPuzzle {
    constructor() {
        this.matrix = [];
        this.rows = 3;
        this.cols = 3;
        this.seed = Date.now(); // Use current timestamp for randomness
        this.currentOperation = null;
        this.selectedRows = [];
        this.targetRow = null;
        this.addOperationType = 'add'; // 'add' or 'subtract'
        this.multiplyOperationType = 'multiply'; // 'multiply' or 'divide'
        this.gameStarted = false;
        this.startTime = null;
        this.operationsCount = 0;
        this.gameStats = [];
        this.timerInterval = null;
        
        // VIM mode properties
        this.vimMode = false;
        this.highlightedRow = 0;
        this.vimOperation = null;
        this.vimPromptOperationType = null;
        
        this.init();
    }
    
    init() {
        this.loadStats();
        this.setupEventListeners();
        this.generateMatrix();
        this.renderMatrix();
    }
    
    setupEventListeners() {
        // Operation buttons
        document.getElementById('add-btn').addEventListener('click', () => this.selectOperation('add'));
        document.getElementById('swap-btn').addEventListener('click', () => this.selectOperation('swap'));
        document.getElementById('multiply-btn').addEventListener('click', () => this.selectOperation('multiply'));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Allow F and Enter keys to work even when input is focused
            const allowedKeysInInput = ['f', 'enter'];
            if (e.target.tagName === 'INPUT' && !allowedKeysInInput.includes(e.key.toLowerCase())) return;
            
            if (this.vimMode) {
                this.handleVimKeydown(e);
            } else {
                switch(e.key.toLowerCase()) {
                    case 'a': this.startVimOperation('add'); break;
                    case 's': this.startVimOperation('swap'); break;
                    case 'd': this.startVimOperation('multiply'); break;
                    default:
                        // Number keys for row selection (fallback)
                        const num = parseInt(e.key);
                        if (num >= 1 && num <= this.rows) {
                            this.selectRow(num - 1);
                        }
                        break;
                }
            }
        });
        
        // Multiply modal
        document.getElementById('increase-btn').addEventListener('click', () => {
            const input = document.getElementById('multiply-input');
            input.value = (parseFloat(input.value) + 0.5).toFixed(1);
        });
        
        document.getElementById('decrease-btn').addEventListener('click', () => {
            const input = document.getElementById('multiply-input');
            const newValue = parseFloat(input.value) - 0.5;
            if (newValue !== 0) {
                input.value = newValue.toFixed(1);
            }
        });
        
        document.getElementById('apply-multiply-btn').addEventListener('click', () => {
            this.applyMultiply();
        });
        
        document.getElementById('cancel-multiply-btn').addEventListener('click', () => {
            this.hideMultiplyModal();
        });

        // Add operation modal
        document.getElementById('subtract-operation-btn').addEventListener('click', () => {
            this.addOperationType = 'subtract';
            this.hideAddModal();
        });

        // Multiply/Divide operation modal
        document.getElementById('divide-operation-btn').addEventListener('click', () => {
            this.multiplyOperationType = 'divide';
            this.applyMultiplyDivide();
        });

        // Multiply/Divide modal input controls
        document.getElementById('multiply-increase-btn').addEventListener('click', () => {
            const input = document.getElementById('multiply-divide-input');
            input.value = (parseFloat(input.value) + 0.5).toFixed(1);
        });
        
        document.getElementById('multiply-decrease-btn').addEventListener('click', () => {
            const input = document.getElementById('multiply-divide-input');
            const newValue = parseFloat(input.value) - 0.5;
            if (newValue !== 0) {
                input.value = newValue.toFixed(1);
            }
        });

        document.getElementById('apply-multiply-divide-btn').addEventListener('click', () => {
            this.applyMultiplyDivide();
        });

        document.getElementById('cancel-multiply-divide-btn').addEventListener('click', () => {
            this.hideMultiplyDivideModal();
        });

        // VIM prompt modal
        document.getElementById('vim-increase-btn').addEventListener('click', () => {
            const input = document.getElementById('vim-prompt-input');
            input.value = (parseFloat(input.value) + 0.5).toFixed(1);
        });
        
        document.getElementById('vim-decrease-btn').addEventListener('click', () => {
            const input = document.getElementById('vim-prompt-input');
            const newValue = parseFloat(input.value) - 0.5;
            if (newValue !== 0) {
                input.value = newValue.toFixed(1);
            }
        });

        document.getElementById('vim-prompt-confirm').addEventListener('click', () => {
            this.confirmVimPrompt();
        });

        document.getElementById('vim-prompt-cancel').addEventListener('click', () => {
            this.cancelVimPrompt();
        });
        
        // Options
        document.getElementById('options-btn').addEventListener('click', () => {
            this.toggleOptionsPanel();
        });
        
        document.getElementById('close-options-btn').addEventListener('click', () => {
            this.hideOptionsPanel();
        });
        
        // New Matrix button
        document.getElementById('new-matrix-btn').addEventListener('click', () => {
            this.generateNewMatrix();
        });
        
        // Number input buttons for options
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleNumberButton(e);
            });
        });
        
        // Auto-update on input change
        ['matrix-rows', 'matrix-cols', 'matrix-seed'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.autoUpdateMatrix();
            });
        });
        
        document.getElementById('generate-matrix-btn').addEventListener('click', () => {
            this.updateMatrixSettings();
            this.generateMatrix();
            this.renderMatrix();
            this.resetGame();
            this.hideOptionsPanel();
        });
        
        document.getElementById('export-stats-btn').addEventListener('click', () => {
            this.exportStats();
        });
        
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.newGame();
        });
        
        // Click outside to close options
        document.addEventListener('click', (e) => {
            const optionsPanel = document.getElementById('options-panel');
            const optionsBtn = document.getElementById('options-btn');
            if (!optionsPanel.contains(e.target) && !optionsBtn.contains(e.target)) {
                this.hideOptionsPanel();
            }
        });
    }
    
    // Matrix generation with seeded random
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    
    generateMatrix() {
        this.matrix = [];
        let currentSeed = this.seed;
        
        // Generate a random matrix that's not already triangular
        do {
            this.matrix = [];
            for (let i = 0; i < this.rows; i++) {
                const row = [];
                for (let j = 0; j < this.cols; j++) {
                    currentSeed++;
                    const random = this.seededRandom(currentSeed);
                    row.push(Math.floor(random * 19) - 9); // Random integers from -9 to 9
                }
                this.matrix.push(row);
            }
        } while (this.isUpperTriangular() || this.hasZeroRow());
        
        this.resetGame();
    }
    
    hasZeroRow() {
        return this.matrix.some(row => row.every(val => val === 0));
    }
    
    isUpperTriangular() {
        for (let i = 1; i < this.rows; i++) {
            for (let j = 0; j < Math.min(i, this.cols); j++) {
                if (Math.abs(this.matrix[i][j]) > 0.001) {
                    return false;
                }
            }
        }
        return true;
    }
    
    renderMatrix() {
        const matrixElement = document.getElementById('matrix');
        matrixElement.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
        
        matrixElement.innerHTML = '';
        
        for (let i = 0; i < this.rows; i++) {
            const rowElement = document.createElement('div');
            rowElement.className = 'matrix-row';
            rowElement.dataset.rowIndex = i;
            
            // Row number
            const rowNumber = document.createElement('div');
            rowNumber.className = 'row-number';
            rowNumber.textContent = i + 1;
            rowElement.appendChild(rowNumber);
            
            // Matrix elements
            for (let j = 0; j < this.cols; j++) {
                const element = document.createElement('div');
                element.className = 'matrix-element';
                element.textContent = this.formatNumber(this.matrix[i][j]);
                rowElement.appendChild(element);
            }
            
            rowElement.addEventListener('click', () => this.selectRow(i));
            matrixElement.appendChild(rowElement);
        }
    }
    
    formatNumber(num) {
        if (Number.isInteger(num)) {
            return num.toString();
        }
        return parseFloat(num.toFixed(2)).toString();
    }
    
    selectOperation(operation) {
        // If in VIM mode, cancel current VIM operation and switch modes
        if (this.vimMode) {
            this.cancelVimOperation();
        }
        
        // Clear previous selections
        this.clearSelections();
        this.currentOperation = operation;
        this.selectedRows = [];
        this.targetRow = null;
        
        // Update UI
        document.querySelectorAll('.operation-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${operation}-btn`).classList.add('active');
        
        // Update instructions
        this.updateInstructions();
    }
    
    selectRow(rowIndex) {
        // In VIM mode, clicking should not interfere
        if (this.vimMode) {
            return;
        }
        
        if (!this.currentOperation) {
            this.updateInstructions('Please select an operation first');
            return;
        }
        
        if (!this.gameStarted) {
            this.startGame();
        }
        
        switch (this.currentOperation) {
            case 'add':
                this.handleAddRowSelection(rowIndex);
                break;
            case 'swap':
                this.handleSwapRowSelection(rowIndex);
                break;
            case 'multiply':
                this.handleMultiplyRowSelection(rowIndex);
                break;
        }
        
        this.updateInstructions();
        this.updateSelectionDisplay();
    }
    
    handleAddRowSelection(rowIndex) {
        if (this.selectedRows.length < 2) {
            if (!this.selectedRows.includes(rowIndex)) {
                this.selectedRows.push(rowIndex);
                if (this.selectedRows.length === 2) {
                    this.showAddModal();
                }
            }
        } else if (this.targetRow === null) {
            this.targetRow = rowIndex;
            this.performAddOperation();
        }
    }
    
    handleSwapRowSelection(rowIndex) {
        if (this.selectedRows.length < 2) {
            if (!this.selectedRows.includes(rowIndex)) {
                this.selectedRows.push(rowIndex);
                if (this.selectedRows.length === 2) {
                    this.performSwapOperation();
                }
            }
        }
    }
    
    handleMultiplyRowSelection(rowIndex) {
        this.selectedRows = [rowIndex];
        this.showMultiplyDivideModal();
    }
    
    performAddOperation() {
        const [row1, row2] = this.selectedRows;
        const target = this.targetRow;
        
        // Replace target row with the operation result
        // R[target] = R[row1] + R[row2] (for addition) or R[target] = R[row1] - R[row2] (for subtraction)
        for (let j = 0; j < this.cols; j++) {
            if (this.addOperationType === 'add') {
                this.matrix[target][j] = this.matrix[row1][j] + this.matrix[row2][j];
            } else {
                this.matrix[target][j] = this.matrix[row1][j] - this.matrix[row2][j];
            }
        }
        
        this.operationsCount++;
        this.updateOperationsDisplay();
        this.renderMatrix();
        this.clearSelections();
        this.checkWinCondition();
    }
    
    performSwapOperation() {
        const [row1, row2] = this.selectedRows;
        
        // Swap rows
        [this.matrix[row1], this.matrix[row2]] = [this.matrix[row2], this.matrix[row1]];
        
        this.operationsCount++;
        this.updateOperationsDisplay();
        this.renderMatrix();
        this.clearSelections();
        this.checkWinCondition();
    }
    
    showMultiplyModal() {
        document.getElementById('multiply-modal').classList.remove('hidden');
        const input = document.getElementById('multiply-input');
        input.focus();
        input.select();
    }
    
    hideMultiplyModal() {
        document.getElementById('multiply-modal').classList.add('hidden');
        this.clearSelections();
    }

    showAddModal() {
        const [row1, row2] = this.selectedRows;
        document.getElementById('add-row1').textContent = row1 + 1;
        document.getElementById('add-row2').textContent = row2 + 1;
        document.getElementById('add-modal').classList.remove('hidden');
    }

    hideAddModal() {
        document.getElementById('add-modal').classList.add('hidden');
        // Don't clear selections here - we still need them for the operation
    }

    showMultiplyDivideModal() {
        const rowIndex = this.selectedRows[0];
        document.getElementById('multiply-row').textContent = rowIndex + 1;
        document.getElementById('multiply-divide-modal').classList.remove('hidden');
        const input = document.getElementById('multiply-divide-input');
        input.focus();
        input.select();
    }

    hideMultiplyDivideModal() {
        document.getElementById('multiply-divide-modal').classList.add('hidden');
        // Don't clear selections here - we still need them for the operation
    }
    
    applyMultiply() {
        const multiplier = parseFloat(document.getElementById('multiply-input').value);
        if (multiplier === 0 || isNaN(multiplier)) {
            alert('Value cannot be zero or invalid');
            return;
        }
        
        const rowIndex = this.selectedRows[0];
        
        // Apply multiplication or division
        for (let j = 0; j < this.cols; j++) {
            if (this.multiplyOperationType === 'multiply') {
                this.matrix[rowIndex][j] *= multiplier;
            } else {
                this.matrix[rowIndex][j] /= multiplier;
            }
        }
        
        this.operationsCount++;
        this.updateOperationsDisplay();
        this.renderMatrix();
        this.hideMultiplyModal();
        this.clearSelections();
        this.checkWinCondition();
    }

    applyMultiplyDivide() {
        const value = parseFloat(document.getElementById('multiply-divide-input').value);
        if (value === 0 || isNaN(value)) {
            alert('Value cannot be zero or invalid');
            return;
        }
        
        const rowIndex = this.selectedRows[0];
        
        // Apply multiplication or division based on the operation type
        for (let j = 0; j < this.cols; j++) {
            if (this.multiplyOperationType === 'divide') {
                this.matrix[rowIndex][j] /= value;
            } else {
                this.matrix[rowIndex][j] *= value;
            }
        }
        
        this.operationsCount++;
        this.updateOperationsDisplay();
        this.renderMatrix();
        this.hideMultiplyDivideModal();
        this.clearSelections();
        this.checkWinCondition();
    }
    
    clearSelections() {
        if (!this.vimMode) {
            this.selectedRows = [];
            this.targetRow = null;
            this.currentOperation = null;
            this.addOperationType = 'add'; // Reset to default
            this.multiplyOperationType = 'multiply'; // Reset to default
            this.hideAddModal(); // Hide the add modal if it's open
            this.hideMultiplyDivideModal(); // Hide the multiply-divide modal if it's open
            
            document.querySelectorAll('.operation-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.matrix-row').forEach(row => {
                row.classList.remove('selected', 'target');
            });
        } else {
            // In VIM mode, only clear visual selections but keep VIM state
            document.querySelectorAll('.matrix-row').forEach(row => {
                row.classList.remove('selected', 'target');
            });
        }
    }
    
    updateSelectionDisplay() {
        document.querySelectorAll('.matrix-row').forEach(row => {
            row.classList.remove('selected', 'target', 'highlighted');
            row.removeAttribute('data-selection-order');
        });
        
        // Show VIM highlight
        if (this.vimMode) {
            const highlightedRow = document.querySelector(`[data-row-index="${this.highlightedRow}"]`);
            if (highlightedRow) {
                highlightedRow.classList.add('highlighted');
            }
        }
        
        // Show selected rows with order indicators
        this.selectedRows.forEach((index, order) => {
            const row = document.querySelector(`[data-row-index="${index}"]`);
            if (row) {
                row.classList.add('selected');
                row.setAttribute('data-selection-order', order + 1);
            }
        });
        
        // Show target row
        if (this.targetRow !== null) {
            const targetRow = document.querySelector(`[data-row-index="${this.targetRow}"]`);
            if (targetRow) {
                targetRow.classList.add('target');
            }
        }
    }
    
    updateInstructions(message = null) {
        const instructionText = document.getElementById('instruction-text');
        const selectionStatus = document.getElementById('selection-status');
        
        if (message) {
            instructionText.textContent = message;
            selectionStatus.textContent = '';
            return;
        }

        if (this.vimMode) {
            this.updateVimInstructions();
            return;
        }
        
        if (!this.currentOperation) {
            instructionText.textContent = 'Select an operation to begin';
            selectionStatus.textContent = '';
            return;
        }
        
        switch (this.currentOperation) {
            case 'add':
                if (this.selectedRows.length === 0) {
                    instructionText.textContent = 'Select first row to add';
                } else if (this.selectedRows.length === 1) {
                    instructionText.textContent = 'Select second row to add';
                } else if (this.targetRow === null) {
                    instructionText.textContent = 'Select target row to apply the sum';
                }
                selectionStatus.textContent = this.getAddSelectionStatus();
                break;
                
            case 'swap':
                if (this.selectedRows.length === 0) {
                    instructionText.textContent = 'Select first row to swap';
                } else if (this.selectedRows.length === 1) {
                    instructionText.textContent = 'Select second row to swap';
                }
                selectionStatus.textContent = this.getSwapSelectionStatus();
                break;
                
            case 'multiply':
                instructionText.textContent = 'Select row to multiply by a constant';
                selectionStatus.textContent = '';
                break;
        }
    }

    updateVimInstructions() {
        const instructionText = document.getElementById('instruction-text');
        const selectionStatus = document.getElementById('selection-status');

        if (this.isAwaitingAddOperationType()) {
            instructionText.textContent = 'Press A (or Enter) for addition, F for subtraction';
            selectionStatus.textContent = '';
            return;
        }

        if (this.isAwaitingMultiplyOperationType()) {
            instructionText.textContent = 'Press D (or Enter) for multiply, F for divide';
            selectionStatus.textContent = '';
            return;
        }

        switch (this.vimOperation) {
            case 'add':
                if (this.selectedRows.length === 0) {
                    instructionText.textContent = 'VIM Mode: Q/E to navigate, SPACE to select first row';
                } else if (this.selectedRows.length === 1) {
                    instructionText.textContent = 'VIM Mode: Q/E to navigate, SPACE to select second row';
                }
                break;
                
            case 'swap':
                if (this.selectedRows.length === 0) {
                    instructionText.textContent = 'VIM Mode: Q/E to navigate, SPACE to select first row';
                } else if (this.selectedRows.length === 1) {
                    instructionText.textContent = 'VIM Mode: Q/E to navigate, SPACE to select second row';
                }
                break;
                
            case 'multiply':
                instructionText.textContent = 'VIM Mode: Q/E to navigate, SPACE to select row';
                break;
        }
        
        selectionStatus.textContent = `Row ${this.highlightedRow + 1} highlighted | ESC to exit VIM mode`;
    }
    
    getAddSelectionStatus() {
        let status = '';
        if (this.selectedRows.length >= 1) {
            status += `Row ${this.selectedRows[0] + 1}`;
        }
        if (this.selectedRows.length >= 2) {
            status += ` + Row ${this.selectedRows[1] + 1}`;
        }
        if (this.targetRow !== null) {
            status += ` → Row ${this.targetRow + 1}`;
        }
        return status;
    }
    
    getSwapSelectionStatus() {
        if (this.selectedRows.length >= 1) {
            let status = `Row ${this.selectedRows[0] + 1}`;
            if (this.selectedRows.length >= 2) {
                status += ` ↔ Row ${this.selectedRows[1] + 1}`;
            }
            return status;
        }
        return '';
    }
    
    startGame() {
        this.gameStarted = true;
        this.startTime = Date.now();
        this.operationsCount = 0;
        this.updateOperationsDisplay();
        this.startTimer();
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            document.getElementById('timer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    updateOperationsDisplay() {
        document.getElementById('operations-count').textContent = this.operationsCount;
    }
    
    checkWinCondition() {
        if (this.isUpperTriangular()) {
            this.endGame();
        }
    }
    
    endGame() {
        clearInterval(this.timerInterval);
        const endTime = Date.now();
        const totalTime = endTime - this.startTime;
        
        // Save stats
        const stats = {
            date: new Date().toISOString(),
            timeUsed: totalTime,
            operationsUsed: this.operationsCount,
            matrixSize: `${this.rows}x${this.cols}`,
            seed: this.seed
        };
        
        this.gameStats.push(stats);
        this.saveStats();
        
        // Show success message
        this.showSuccessMessage(totalTime);
    }
    
    showSuccessMessage(totalTime) {
        // Make all matrix cells glow neon green
        document.querySelectorAll('.matrix-cell').forEach(cell => {
            cell.style.backgroundColor = 'var(--accent-success)';
            cell.style.color = 'black';
            cell.style.boxShadow = '0 0 20px rgba(0, 255, 65, 0.8)';
            cell.style.border = '1px solid var(--accent-success)';
        });
        
        document.getElementById('success-message').classList.remove('hidden');
    }
    
    newGame() {
        document.getElementById('success-message').classList.add('hidden');
        
        // Reset matrix cell styles
        document.querySelectorAll('.matrix-cell').forEach(cell => {
            cell.style.backgroundColor = '';
            cell.style.color = '';
            cell.style.boxShadow = '';
            cell.style.border = '';
        });
        
        this.generateMatrix();
        this.renderMatrix();
        this.resetGame();
    }
    
    resetGame() {
        this.gameStarted = false;
        this.startTime = null;
        this.operationsCount = 0;
        clearInterval(this.timerInterval);
        
        document.getElementById('timer').textContent = '00:00';
        this.updateOperationsDisplay();
        this.clearSelections();
        this.updateInstructions();
    }
    
    updateMatrixSettings() {
        this.rows = parseInt(document.getElementById('matrix-rows').value);
        this.cols = parseInt(document.getElementById('matrix-cols').value);
        this.seed = parseInt(document.getElementById('matrix-seed').value);
    }
    
    toggleOptionsPanel() {
        const panel = document.getElementById('options-panel');
        panel.classList.toggle('hidden');
        
        // Update current settings
        document.getElementById('matrix-rows').value = this.rows;
        document.getElementById('matrix-cols').value = this.cols;
        document.getElementById('matrix-seed').value = this.seed;
    }
    
    hideOptionsPanel() {
        document.getElementById('options-panel').classList.add('hidden');
    }
    
    generateNewMatrix() {
        // Use current timestamp for new random seed
        this.seed = Date.now();
        this.generateMatrix();
        this.renderMatrix();
        this.resetGame();
    }
    
    handleNumberButton(e) {
        const button = e.target;
        const targetId = button.dataset.target;
        const input = document.getElementById(targetId);
        const isIncrease = button.classList.contains('increase');
        const isDecrease = button.classList.contains('decrease');
        
        let currentValue = parseInt(input.value);
        const min = parseInt(input.min) || 1;
        const max = parseInt(input.max) || 999999;
        
        if (isIncrease && currentValue < max) {
            if (targetId === 'matrix-seed') {
                currentValue += 1000; // Larger increment for seed
            } else {
                currentValue += 1;
            }
        } else if (isDecrease && currentValue > min) {
            if (targetId === 'matrix-seed') {
                currentValue -= 1000; // Larger decrement for seed
            } else {
                currentValue -= 1;
            }
        }
        
        input.value = currentValue;
        this.autoUpdateMatrix();
    }
    
    autoUpdateMatrix() {
        // Add a small delay to prevent rapid updates
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        this.updateTimeout = setTimeout(() => {
            this.updateMatrixSettings();
            this.generateMatrix();
            this.renderMatrix();
            this.resetGame();
        }, 300);
    }
    
    saveStats() {
        localStorage.setItem('rowOperationPuzzleStats', JSON.stringify(this.gameStats));
    }
    
    loadStats() {
        const savedStats = localStorage.getItem('rowOperationPuzzleStats');
        if (savedStats) {
            this.gameStats = JSON.parse(savedStats);
        }
    }
    
    exportStats() {
        if (this.gameStats.length === 0) {
            alert('No stats to export yet. Play some games first!');
            return;
        }
        
        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `row_operation_puzzle_stats_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // VIM Mode Methods
    startVimOperation(operation) {
        this.vimMode = true;
        this.vimOperation = operation;
        this.highlightedRow = 0;
        this.selectedRows = [];
        this.currentOperation = operation;
        
        // Highlight first row
        this.updateVimHighlight();
        this.updateInstructions();
        
        // Update button states
        document.querySelectorAll('.operation-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-operation="${operation}"]`).classList.add('active');
    }

    handleVimKeydown(e) {
        switch(e.key.toLowerCase()) {
            case 'q': // Move up
                this.moveVimHighlight(-1);
                break;
            case 'e': // Move down
                this.moveVimHighlight(1);
                break;
            case ' ': // Select row
                e.preventDefault();
                this.selectVimRow();
                break;
            case 'escape': // Exit VIM mode or close prompt
                if (!document.getElementById('vim-prompt-modal').classList.contains('hidden')) {
                    this.cancelVimPrompt();
                } else {
                    this.exitVimMode();
                }
                break;
            case 'a': // Handle operation-specific keys
                if (this.isAwaitingAddOperationType()) {
                    this.addOperationType = 'add';
                    this.executeAddOperation();
                }
                break;
            case 'd':
                if (this.isAwaitingMultiplyOperationType()) {
                    this.promptVimMultiplyValue('multiply');
                }
                break;
            case 'f': // Confirm/Apply in modals or special mode switch
                if (!document.getElementById('vim-prompt-modal').classList.contains('hidden')) {
                    this.confirmVimPrompt();
                } else if (!document.getElementById('multiply-modal').classList.contains('hidden')) {
                    document.getElementById('apply-multiply-btn').click();
                } else if (!document.getElementById('multiply-divide-modal').classList.contains('hidden')) {
                    document.getElementById('apply-multiply-divide-btn').click();
                } else if (this.isAwaitingAddOperationType()) {
                    this.addOperationType = 'subtract';
                    this.executeAddOperation();
                } else if (this.isAwaitingMultiplyOperationType()) {
                    this.promptVimMultiplyValue('divide');
                }
                break;
            case 'enter':
                if (!document.getElementById('vim-prompt-modal').classList.contains('hidden')) {
                    this.confirmVimPrompt();
                } else if (!document.getElementById('multiply-modal').classList.contains('hidden')) {
                    document.getElementById('apply-multiply-btn').click();
                } else if (!document.getElementById('multiply-divide-modal').classList.contains('hidden')) {
                    document.getElementById('apply-multiply-divide-btn').click();
                } else if (this.isAwaitingAddOperationType()) {
                    this.addOperationType = 'add';
                    this.executeAddOperation();
                } else if (this.isAwaitingMultiplyOperationType()) {
                    this.promptVimMultiplyValue('multiply');
                }
                break;
        }
    }

    moveVimHighlight(direction) {
        this.highlightedRow = Math.max(0, Math.min(this.rows - 1, this.highlightedRow + direction));
        this.updateSelectionDisplay();
        this.updateInstructions();
    }

    updateVimHighlight() {
        this.updateSelectionDisplay();
    }

    selectVimRow() {
        if (!this.gameStarted) {
            this.startGame();
        }
        
        if (this.vimOperation === 'add' || this.vimOperation === 'swap') {
            if (this.selectedRows.length < 2) {
                this.selectedRows.push(this.highlightedRow);
                this.updateSelectionDisplay(); // Update visual selection
                
                if (this.selectedRows.length === 2) {
                    if (this.vimOperation === 'add') {
                        this.showVimAddPrompt();
                    } else {
                        this.executeSwapOperation();
                    }
                } else {
                    this.updateInstructions();
                }
            }
        } else if (this.vimOperation === 'multiply') {
            this.selectedRows = [this.highlightedRow];
            this.updateSelectionDisplay();
            this.showVimMultiplyPrompt();
        }
    }

    showVimAddPrompt() {
        // Update instruction to show VIM controls
        document.getElementById('instruction-text').textContent = 
            `Press A (or Enter) for addition, F for subtraction`;
    }

    showVimMultiplyPrompt() {
        // Update instruction to show VIM controls
        document.getElementById('instruction-text').textContent = 
            `Press D (or Enter) for multiply, F for divide`;
    }

    promptVimMultiplyValue(operationType) {
        this.vimPromptOperationType = operationType;
        
        // Update modal content
        const title = document.getElementById('vim-prompt-title');
        const message = document.getElementById('vim-prompt-message');
        
        if (operationType === 'multiply') {
            title.textContent = 'Multiply Row';
            message.textContent = `Enter value to multiply row ${this.selectedRows[0] + 1} by:`;
        } else {
            title.textContent = 'Divide Row';
            message.textContent = `Enter value to divide row ${this.selectedRows[0] + 1} by:`;
        }
        
        // Reset and show modal
        document.getElementById('vim-prompt-input').value = '2';
        document.getElementById('vim-prompt-modal').classList.remove('hidden');
        document.getElementById('vim-prompt-input').focus();
        document.getElementById('vim-prompt-input').select();
    }

    confirmVimPrompt() {
        const value = parseFloat(document.getElementById('vim-prompt-input').value);
        
        if (isNaN(value) || value === 0) {
            alert('Invalid value. Please enter a non-zero number.');
            return;
        }
        
        this.hideVimPromptModal();
        this.multiplyOperationType = this.vimPromptOperationType;
        this.executeMultiplyOperation(value);
    }

    cancelVimPrompt() {
        this.hideVimPromptModal();
        this.updateInstructions('Operation cancelled. Press D (or Enter) for multiply, F for divide');
    }

    hideVimPromptModal() {
        document.getElementById('vim-prompt-modal').classList.add('hidden');
    }

    isAwaitingAddOperationType() {
        return this.vimMode && this.vimOperation === 'add' && this.selectedRows.length === 2;
    }

    isAwaitingMultiplyOperationType() {
        return this.vimMode && this.vimOperation === 'multiply' && this.selectedRows.length === 1;
    }

    executeAddOperation() {
        const [row1, row2] = this.selectedRows;
        
        for (let j = 0; j < this.cols; j++) {
            if (this.addOperationType === 'add') {
                this.matrix[row1][j] += this.matrix[row2][j];
            } else {
                this.matrix[row1][j] -= this.matrix[row2][j];
            }
        }
        
        this.operationsCount++;
        this.updateOperationsDisplay();
        this.renderMatrix();
        this.exitVimMode();
        this.checkWinCondition();
    }

    executeSwapOperation() {
        const [row1, row2] = this.selectedRows;
        
        for (let j = 0; j < this.cols; j++) {
            const temp = this.matrix[row1][j];
            this.matrix[row1][j] = this.matrix[row2][j];
            this.matrix[row2][j] = temp;
        }
        
        this.operationsCount++;
        this.updateOperationsDisplay();
        this.renderMatrix();
        this.exitVimMode();
        this.checkWinCondition();
    }

    executeMultiplyOperation(value = 2) {
        const rowIndex = this.selectedRows[0];
        
        for (let j = 0; j < this.cols; j++) {
            if (this.multiplyOperationType === 'multiply') {
                this.matrix[rowIndex][j] *= value;
            } else {
                this.matrix[rowIndex][j] /= value;
            }
        }
        
        this.operationsCount++;
        this.updateOperationsDisplay();
        this.renderMatrix();
        this.exitVimMode();
        this.checkWinCondition();
    }

    exitVimMode() {
        this.vimMode = false;
        this.vimOperation = null;
        this.highlightedRow = 0;
        this.vimPromptOperationType = null;
        this.addOperationType = 'add'; // Reset to default
        this.multiplyOperationType = 'multiply'; // Reset to default
        
        // Close VIM prompt modal if open
        this.hideVimPromptModal();
        
        // Clear highlights and selections
        document.querySelectorAll('.matrix-row').forEach(row => {
            row.classList.remove('highlighted');
        });
        
        this.clearSelections();
    }

    cancelVimOperation() {
        // Cancel current VIM operation but stay in VIM mode
        this.vimOperation = null;
        this.vimPromptOperationType = null;
        this.addOperationType = 'add'; // Reset to default
        this.multiplyOperationType = 'multiply'; // Reset to default
        
        // Close any open modals
        this.hideVimPromptModal();
        this.hideModal('add-modal');
        this.hideModal('multiply-divide-modal');
        
        // Clear selections but keep VIM mode active
        this.clearSelections();
        this.selectedRows = [];
        this.targetRow = null;
        
        // Keep VIM mode active and maintain highlight
        this.updateSelectionDisplay();
        this.updateInstructions();
    }

    generateCSV() {
        const headers = ['Date', 'Time (ms)', 'Operations', 'Matrix Size', 'Seed'];
        const rows = this.gameStats.map(stat => [
            new Date(stat.date).toLocaleString(),
            stat.timeUsed,
            stat.operationsUsed,
            stat.matrixSize,
            stat.seed
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RowOperationPuzzle();
});
