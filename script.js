class AuthentaGame {
    constructor() {
        this.images = [];
        this.currentImageIndex = 0;
        this.score = 0;
        this.gameStarted = false;
        this.isAnimating = false;
        this.currentSetIndex = 0; // Track which set we're on (0-9)
        this.imageSets = []; // Store all 10 sets

        this.initializeElements();
        if (this.startBtn) this.startBtn.disabled = true;
        this.setupEventListeners();
        this.loadImageSets();
        this.loadShowcaseImages();
    }

    initializeElements() {
        this.startScreen = document.getElementById('startScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.endScreen = document.getElementById('endScreen');
        this.startBtn = document.getElementById('startBtn');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.homeBtn = document.getElementById('homeBtn');
        this.imageContainer = document.getElementById('imageContainer');
        this.progressBar = document.getElementById('progressBar');
        this.currentImageEl = document.getElementById('currentImage');
        this.totalImagesEl = document.getElementById('totalImages');
        this.finalScore = document.getElementById('finalScore');
        this.scorePercentage = document.getElementById('scorePercentage');
        this.scoreMessage = document.getElementById('scoreMessage');
        this.mainNav = document.getElementById('mainNav');
        this.realBtn = document.getElementById('realBtn');
        this.aiBtn = document.getElementById('aiBtn');
        this.feedbackIndicator = document.getElementById('feedbackIndicator');
        this.feedbackIcon = document.getElementById('feedbackIcon');
        this.feedbackText = document.getElementById('feedbackText');
        this.homeIconBtn = document.getElementById('homeIconBtn');
    }


    async loadImageSets() {
        try {
            const response = await fetch('image-sets.json');
            if (!response.ok) throw new Error('Failed to load image sets');

            const data = await response.json();
            this.imageSets = data.sets;

            // Load current set index from localStorage or start at 0
            const savedSetIndex = localStorage.getItem('currentSetIndex');
            this.currentSetIndex = savedSetIndex ? parseInt(savedSetIndex) : 0;
            this.prepareImages();

            // Enable start button if images are loaded
            if (this.images && this.images.length > 0 && this.startBtn) {
                this.startBtn.disabled = false;
            }
        } catch (err) {

        }
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.playAgainBtn.addEventListener('click', () => this.resetGame());
        this.homeBtn.addEventListener('click', () => this.goToHome());
        if (this.homeIconBtn) {
            this.homeIconBtn.addEventListener('click', () => this.goToHomeFromGame());
        }
        this.realBtn.addEventListener('click', () => this.classifyImage('real'));
        this.aiBtn.addEventListener('click', () => this.classifyImage('ai'));
    }

    prepareImages() {
        if (!this.imageSets || this.imageSets.length === 0) {
            return;
        }

        // Get the current set (cycles through 1-10)
        const currentSet = this.imageSets[this.currentSetIndex];

        if (!currentSet) {
            return;
        }

        this.images = this.shuffleArray([...currentSet.images]);

        if (this.totalImagesEl) {
            this.totalImagesEl.textContent = this.images.length;
        }
        this.preloadImages();
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    preloadImages() {
        this.images.forEach(imageData => {
            const img = new Image();
            img.src = imageData.path; // Path now includes data/ prefix
        });
    }

    startGame() {
        // Ensure images are loaded before starting
        if (!this.images || this.images.length === 0) {
            setTimeout(() => this.startGame(), 100);
            return;
        }

        // Ensure DOM elements are ready
        if (!this.startScreen || !this.gameScreen || !this.endScreen) {
            setTimeout(() => this.startGame(), 100);
            return;
        }

        this.gameStarted = true;
        this.currentImageIndex = 0;
        this.score = 0;

        this.startScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.endScreen.classList.add('hidden');
        if (this.mainNav) this.mainNav.classList.add('hidden');

        // Small delay to ensure DOM is ready and visible
        setTimeout(() => {
            this.displayCurrentImage();
        }, 100);
    }

    displayCurrentImage() {
        if (this.currentImageIndex >= this.images.length) {
            this.endGame();
            return;
        }

        const currentImage = this.images[this.currentImageIndex];

        if (!currentImage) {
            return;
        }


        // Ensure imageContainer exists
        if (!this.imageContainer) {
            return;
        }

        const progress = ((this.currentImageIndex + 1) / this.images.length) * 100;
        if (this.progressBar) this.progressBar.style.width = `${progress}%`;
        if (this.currentImageEl) this.currentImageEl.textContent = this.currentImageIndex + 1;

        const imageCard = this.createImageCard(currentImage.path);
        this.imageContainer.innerHTML = '';
        this.imageContainer.appendChild(imageCard);
    }

    createImageCard(imagePath) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg p-4 max-w-full mx-auto';

        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = 'Image to classify';
        img.className = 'w-full h-full object-contain rounded-lg';

        // Add loading state
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease-in';

        img.onload = () => {
            img.style.opacity = '1';
        };

        img.onerror = (error) => {
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100%25" height="100%25" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
            img.style.opacity = '1';
        };

        card.appendChild(img);
        return card;
    }

    classifyImage(classification) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const currentImage = this.images[this.currentImageIndex];
        // Determine correct label based on set-1 (real) or set-2 (fake)
        let correctLabel;
        if (currentImage.path.startsWith('set-1/')) {
            correctLabel = 'real';
        } else if (currentImage.path.startsWith('set-2/')) {
            correctLabel = 'ai';
        } else {
            correctLabel = currentImage.type; // fallback
        }
        const isCorrect = correctLabel === classification;

        if (isCorrect) {
            this.score++;
            this.showFeedback(true);
        } else {
            this.showFeedback(false);
        }

        setTimeout(() => {
            this.currentImageIndex++;
            this.isAnimating = false;
            this.hideFeedback();
            this.displayCurrentImage();
        }, 1500); // Wait 1.5 seconds before showing the next image
    }

    showFeedback(isCorrect) {
        this.feedbackIndicator.classList.remove('hidden', 'feedback-correct', 'feedback-wrong');
        this.feedbackIcon.className = isCorrect ? 'fas fa-check-circle text-6xl mb-2' : 'fas fa-times-circle text-6xl mb-2';
        this.feedbackText.textContent = isCorrect ? 'Correct!' : 'Wrong!';
        this.feedbackIndicator.classList.add(isCorrect ? 'feedback-correct' : 'feedback-wrong');
        this.feedbackIndicator.style.display = 'flex';
    }

    hideFeedback() {
        this.feedbackIndicator.style.display = 'none';
    }

    endGame() {

        if (this.gameScreen) this.gameScreen.classList.add('hidden');
        if (this.endScreen) this.endScreen.classList.remove('hidden');
        if (this.mainNav) this.mainNav.classList.remove('hidden');

        const totalImages = this.images.length;
        const percentage = Math.round((this.score / totalImages) * 100);

        if (this.finalScore) this.finalScore.textContent = `${this.score}/${totalImages}`;
        if (this.scorePercentage) this.scorePercentage.textContent = `${percentage}%`;


        // Move to next set for next game
        this.moveToNextSet();
    }

    moveToNextSet() {
        const previousSet = this.currentSetIndex + 1;
        if (this.imageSets && this.imageSets.length > 0) {
            this.currentSetIndex = (this.currentSetIndex + 1) % this.imageSets.length;
        } else {
            this.currentSetIndex = 0;
        }
        // Save to localStorage
        localStorage.setItem('currentSetIndex', this.currentSetIndex.toString());
        // Verify it was saved
        const verified = localStorage.getItem('currentSetIndex');
    }
    resetGame() {
        this.prepareImages();

        // Hide end screen and start new game
        this.endScreen.classList.add('hidden');
        this.startGame();
    }

    goToHome() {

        // Prepare images for next game (uses current set index)
        this.prepareImages();

        this.endScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        if (this.mainNav) this.mainNav.classList.remove('hidden');
    }

    goToHomeFromGame() {
        this.gameStarted = false;

        // Hide game screen and show start screen
        if (this.gameScreen) this.gameScreen.classList.add('hidden');
        if (this.startScreen) this.startScreen.classList.remove('hidden');
        if (this.mainNav) this.mainNav.classList.remove('hidden');
    }

    async loadShowcaseImages() {
        try {
            const response = await fetch('showcase-images.json');
            if (!response.ok) throw new Error('Failed to load showcase images');


            const showcaseImages = await response.json();

            // Remove duplicates
            const uniqueImages = Array.from(new Set(showcaseImages));

            const width = window.innerWidth;
            let numberOfImages = 70;
            if (width < 1024) numberOfImages = 50;
            if (width < 768) numberOfImages = 30;
            const selectedImages = uniqueImages.slice(0, numberOfImages);

            const showcaseGrid = document.getElementById('showcaseGrid');
            if (!showcaseGrid) return;
            showcaseGrid.innerHTML = '';
            const sizeClasses = ['size-small', 'size-large', 'size-xlarge'];
            selectedImages.forEach(imagePath => {
                const img = document.createElement('img');
                img.src = `${imagePath}`;
                img.alt = 'Sample image';
                // Randomly assign a size class
                const randomSize = sizeClasses[Math.floor(Math.random() * sizeClasses.length)];
                img.className = `showcase-image ${randomSize}`;
                img.loading = 'lazy';
                showcaseGrid.appendChild(img);
            });

        } catch (err) {
            console.error('Error loading showcase images:', err);
        }
    }
}


let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new AuthentaGame();
});