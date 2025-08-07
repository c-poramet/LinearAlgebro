class RowOperationPuzzle {
    constructor() {
        this.matrix = [];
        this.rows = 3;
        this.cols = 3;
        this.seed = Date.now(); // Use current timestamp for randomness
        this.currentOperation = null;
        this.selectedRows = [];
        this.targetRow = null;
        this.gameStarted = false;
        this.startTime = null;
        this.operationsCount = 0;
        this.gameStats = [];
        this.timerInterval = null;
        
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
            if (e.target.tagName === 'INPUT') return;
            
            switch(e.key.toLowerCase()) {
                case 'a': this.selectOperation('add'); break;
                case 's': this.selectOperation('swap'); break;
                case 'd': this.selectOperation('multiply'); break;
                default:
                    // Number keys for row selection
                    const num = parseInt(e.key);
                    if (num >= 1 && num <= this.rows) {
                        this.selectRow(num - 1);
                    }
                    break;
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
        this.showMultiplyModal();
    }
    
    performAddOperation() {
        const [row1, row2] = this.selectedRows;
        const target = this.targetRow;
        
        // Replace target row with the sum of row1 and row2
        // R[target] = R[row1] + R[row2]
        for (let j = 0; j < this.cols; j++) {
            this.matrix[target][j] = this.matrix[row1][j] + this.matrix[row2][j];
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
        document.getElementById('multiply-input').focus();
    }
    
    hideMultiplyModal() {
        document.getElementById('multiply-modal').classList.add('hidden');
        this.clearSelections();
    }
    
    applyMultiply() {
        const multiplier = parseFloat(document.getElementById('multiply-input').value);
        if (multiplier === 0 || isNaN(multiplier)) {
            alert('Multiplier cannot be zero or invalid');
            return;
        }
        
        const rowIndex = this.selectedRows[0];
        
        // Multiply row by constant
        for (let j = 0; j < this.cols; j++) {
            this.matrix[rowIndex][j] *= multiplier;
        }
        
        this.operationsCount++;
        this.updateOperationsDisplay();
        this.renderMatrix();
        this.hideMultiplyModal();
        this.clearSelections();
        this.checkWinCondition();
    }
    
    clearSelections() {
        this.selectedRows = [];
        this.targetRow = null;
        this.currentOperation = null;
        
        document.querySelectorAll('.operation-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.matrix-row').forEach(row => {
            row.classList.remove('selected', 'target');
        });
    }
    
    updateSelectionDisplay() {
        document.querySelectorAll('.matrix-row').forEach(row => {
            row.classList.remove('selected', 'target');
        });
        
        this.selectedRows.forEach(index => {
            document.querySelector(`[data-row-index="${index}"]`).classList.add('selected');
        });
        
        if (this.targetRow !== null) {
            document.querySelector(`[data-row-index="${this.targetRow}"]`).classList.add('target');
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
        const minutes = Math.floor(totalTime / 60000);
        const seconds = Math.floor((totalTime % 60000) / 1000);
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('final-time').textContent = timeStr;
        document.getElementById('final-operations').textContent = this.operationsCount;
        document.getElementById('success-message').classList.remove('hidden');
    }
    
    newGame() {
        document.getElementById('success-message').classList.add('hidden');
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
