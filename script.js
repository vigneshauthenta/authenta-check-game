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

            console.log("✅ Image sets loaded successfully");
            console.log(`� localStorage value: ${savedSetIndex}`);
            console.log(`📍 Using Set ${this.currentSetIndex + 1} (Index: ${this.currentSetIndex})`);
            console.log(`📦 Total sets available: ${this.imageSets.length}`);
            
            this.prepareImages();
        } catch (err) {
            console.error("❌ Error loading image sets:", err);
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
        if (!this.imageSets || this.imageSets.length === 0) {
            console.error("No image sets available");
            return;
        }

        // Get the current set (cycles through 1-10)
        const currentSet = this.imageSets[this.currentSetIndex];
        
        if (!currentSet) {
            console.error(`Set at index ${this.currentSetIndex} not found`);
            return;
        }
        
        // Shuffle the images randomly each time this set is played
        // This ensures same set has different order on each playthrough
        this.images = this.shuffleArray([...currentSet.images]);
        
        console.log(`🎮 Playing Set ${currentSet.id} (Index: ${this.currentSetIndex})`);
        console.log(`🔀 ${this.images.length} images shuffled in random order`);
        console.log(`📋 Set contains:`, this.images.map(img => img.path.split('/').pop()).join(', '));
        
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
            img.src = imageData.path;
        });
    }

    startGame() {
        // Ensure images are loaded before starting
        if (!this.images || this.images.length === 0) {
            console.warn("Images not ready yet, waiting...");
            setTimeout(() => this.startGame(), 100);
            return;
        }

        // Ensure DOM elements are ready
        if (!this.startScreen || !this.gameScreen || !this.endScreen) {
            console.warn("DOM elements not ready yet, waiting...");
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
            console.error(`No image data at index ${this.currentImageIndex}`);
            return;
        }

        console.log(`Displaying image ${this.currentImageIndex + 1}/${this.images.length}: ${currentImage.path}`);

        // Ensure imageContainer exists
        if (!this.imageContainer) {
            console.error('Image container not found!');
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
            console.log(`✅ Image loaded: ${imagePath}`);
            img.style.opacity = '1';
        };
        
        img.onerror = (error) => {
            console.error(`❌ Failed to load image: ${imagePath}`, error);
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
        console.log('🏁 Game ending...');
        
        if (this.gameScreen) this.gameScreen.classList.add('hidden');
        if (this.endScreen) this.endScreen.classList.remove('hidden');
        if (this.mainNav) this.mainNav.classList.remove('hidden');

        const totalImages = this.images.length;
        const percentage = Math.round((this.score / totalImages) * 100);

        if (this.finalScore) this.finalScore.textContent = `${this.score}/${totalImages}`;
        if (this.scorePercentage) this.scorePercentage.textContent = `${percentage}%`;

        console.log(`📊 Final Score: ${this.score}/${totalImages} (${percentage}%)`);
        
        // Move to next set for next game
        this.moveToNextSet();
    }

    moveToNextSet() {
        // Increment set index and loop back to 0 after set 10
        const previousSet = this.currentSetIndex + 1;
        this.currentSetIndex = (this.currentSetIndex + 1) % 10;
        
        // Save to localStorage
        localStorage.setItem('currentSetIndex', this.currentSetIndex.toString());
        
        console.log(`✅ Set Changed: Set ${previousSet} → Set ${this.currentSetIndex + 1}`);
        console.log(`💾 Saved to localStorage: ${this.currentSetIndex}`);
        console.log(`📌 Next game will use Set ${this.currentSetIndex + 1}`);
        
        // Verify it was saved
        const verified = localStorage.getItem('currentSetIndex');
        console.log(`✔️ Verification - localStorage now contains: ${verified}`);
    }

    resetGame() {
        console.log(`🔄 Resetting game with Set ${this.currentSetIndex + 1}`);
        
        // Prepare the new set (currentSetIndex was already incremented in endGame)
        this.prepareImages();
        
        // Hide end screen and start new game
        this.endScreen.classList.add('hidden');
        this.startGame();
    }

    goToHome() {
        console.log(`🏠 Going home - Set ${this.currentSetIndex + 1} ready for next game`);
        
        // Prepare images for next game (uses current set index)
        this.prepareImages();
        
        this.endScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        if (this.mainNav) this.mainNav.classList.remove('hidden');
    }

    async loadShowcaseImages() {
        try {
            const response = await fetch('showcase-images.json');
            if (!response.ok) throw new Error('Failed to load showcase images');
            
            const showcaseImages = await response.json();
            
            // Use all available images for a fuller showcase
            const shuffled = this.shuffleArray(showcaseImages);
            const selectedImages = shuffled;
            
            const showcaseGrid = document.getElementById('showcaseGrid');
            if (!showcaseGrid) return;
            
            showcaseGrid.innerHTML = '';
            
            // Size classes for random sizing
            const sizeClasses = ['size-small', 'size-medium', 'size-large', 'size-xlarge'];
            
            selectedImages.forEach(imagePath => {
                const img = document.createElement('img');
                img.src = imagePath;
                img.alt = 'Sample image';
                
                // Randomly assign a size class
                const randomSize = sizeClasses[Math.floor(Math.random() * sizeClasses.length)];
                img.className = `showcase-image ${randomSize}`;
                img.loading = 'lazy';
                
                // Add click event for extra wiggle on click
                img.addEventListener('click', function() {
                    this.style.animation = 'none';
                    setTimeout(() => {
                        this.style.animation = 'wiggle-hover 0.5s ease-in-out 3';
                        setTimeout(() => {
                            this.style.animation = 'wiggle-idle 3s ease-in-out infinite';
                        }, 1500);
                    }, 10);
                });
                
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