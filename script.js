class AuthentaGame {
    constructor() {
        this.images = [];
        this.currentImageIndex = 0;
        this.score = 0;
        this.gameStarted = false;
        this.isAnimating = false;

        this.initializeElements();
        this.setupEventListeners();
        this.loadImagesFromJSON();
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
    }

    
    async loadImagesFromJSON() {
        try { 
            const [fakeRes, realRes] = await Promise.all([
                fetch('fake.json'),
                fetch('real.json')
            ]);

            if (!fakeRes.ok || !realRes.ok) throw new Error('Failed to load image JSON files');

            // Parse JSON
            const [fakeData, realData] = await Promise.all([
                fakeRes.json(),
                realRes.json()
            ]);

            this.fakeImages = fakeData;
            this.realImages = realData;

            console.log("✅ Images loaded successfully");
            this.prepareImages();
        } catch (err) {
            console.error("❌ Error loading images:", err);
        }
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.playAgainBtn.addEventListener('click', () => this.resetGame());
        this.homeBtn.addEventListener('click', () => this.goToHome());
        this.realBtn.addEventListener('click', () => this.classifyImage('real'));
        this.aiBtn.addEventListener('click', () => this.classifyImage('ai'));
    }

    prepareImages() {
        // Shuffle fake and real images independently
        const shuffledFake = this.shuffleArray(this.fakeImages);
        const shuffledReal = this.shuffleArray(this.realImages);

        const allImages = [
            ...shuffledFake.map(path => ({ path, type: 'ai' })),
            ...shuffledReal.map(path => ({ path, type: 'real' }))
        ];

        // Shuffle the combined list and take the first 10
        this.images = this.shuffleArray(allImages).slice(0, 10);
        this.totalImagesEl.textContent = this.images.length;

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
            img.src = imageData.path;
        });
    }

    startGame() {
        this.gameStarted = true;
        this.currentImageIndex = 0;
        this.score = 0;

        this.startScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.endScreen.classList.add('hidden');
        this.mainNav.classList.add('hidden');

        this.displayCurrentImage();
    }

    displayCurrentImage() {
        if (this.currentImageIndex >= this.images.length) {
            this.endGame();
            return;
        }

        const currentImage = this.images[this.currentImageIndex];


        const progress = ((this.currentImageIndex + 1) / this.images.length) * 100;
        this.progressBar.style.width = `${progress}%`;
        this.currentImageEl.textContent = this.currentImageIndex + 1;


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
        img.onerror = () => {
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100%25" height="100%25" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
        };

        card.appendChild(img);
        return card;
    }

    classifyImage(classification) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const currentImage = this.images[this.currentImageIndex];
        const isCorrect = currentImage.type === classification;

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
        this.gameScreen.classList.add('hidden');
        this.endScreen.classList.remove('hidden');
        this.mainNav.classList.remove('hidden');

        const totalImages = this.images.length;
        const percentage = Math.round((this.score / totalImages) * 100);

        this.finalScore.textContent = `${this.score}/${totalImages}`;
        this.scorePercentage.textContent = `${percentage}%`;
    }

    resetGame() {
        this.prepareImages();
        this.startGame();
    }

    goToHome() {
        this.endScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        this.mainNav.classList.remove('hidden');
    }
}


let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new AuthentaGame();
});