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
        this.realIndicator = document.getElementById('realIndicator');
        this.aiIndicator = document.getElementById('aiIndicator');
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

        this.realIndicator.addEventListener('click', () => {
            if (!this.isAnimating) this.handleButtonClick('real');
        });
        this.aiIndicator.addEventListener('click', () => {
            if(!this.isAnimating) this.handleButtonClick('ai');
        });
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


        this.addSwipeListeners(imageCard);
    }

    createImageCard(imagePath) {
        const card = document.createElement('div');
        card.className = 'swipe-card bg-white rounded-lg  p-4 max-w-sm mx-auto cursor-grab active:cursor-grabbing';

        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = 'Image to classify';
        img.className = 'w-full h-80 object-cover rounded-lg';
        img.onerror = () => {
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100%25" height="100%25" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
        };

        card.appendChild(img);
        return card;
    }

    addSwipeListeners(card) {
        if (this.isAnimating) return;

        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let isDragging = false;
        let startTime = 0;


        const getEventPos = (e) => {
            return {
                x: e.touches ? e.touches[0].clientX : e.clientX,
                y: e.touches ? e.touches[0].clientY : e.clientY
            };
        };


        const handleStart = (e) => {
            if (this.isAnimating) return;
            const pos = getEventPos(e);
            startX = pos.x;
            startY = pos.y;
            startTime = Date.now();
            isDragging = true;
            card.style.cursor = 'grabbing';
            card.style.transition = 'none';
            e.preventDefault();
        };


        const handleMove = (e) => {
            if (!isDragging || this.isAnimating) return;
            e.preventDefault();

            const pos = getEventPos(e);
            let rawCurrentX = pos.x - startX;
            const currentY = pos.y - startY;


            if (Math.abs(rawCurrentX) < Math.abs(currentY)) return;


            const maxMovement = 120;
            currentX = Math.max(-maxMovement, Math.min(maxMovement, rawCurrentX));


            const impactThreshold = 40;

            const rotation = currentX * 0.06;
            const opacity = Math.max(0.7, 1 - Math.abs(currentX) / 200);
            const scale = Math.max(0.98, 1 - Math.abs(currentX) / 800);

            card.style.transform = `translateX(${currentX}px) rotate(${rotation}deg) scale(${scale})`;
            card.style.opacity = opacity;


            this.realIndicator.classList.remove('glow-real');
            this.aiIndicator.classList.remove('glow-ai');


            if (Math.abs(currentX) > impactThreshold) {
                if (currentX > 0) {
                    this.aiIndicator.classList.add('glow-ai');
                } else {
                    this.realIndicator.classList.add('glow-real');
                }
            }
        };


        const handleEnd = (e) => {
            if (!isDragging || this.isAnimating) return;
            isDragging = false;
            card.style.cursor = 'grab';
            card.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out, box-shadow 0.4s ease-out';


            this.realIndicator.classList.remove('glow-real');
            this.aiIndicator.classList.remove('glow-ai');

            const endTime = Date.now();
            const timeDiff = endTime - startTime;
            const velocity = Math.abs(currentX) / timeDiff;


            const distanceThreshold = 60;
            const velocityThreshold = 0.25;

            const isSwipe = Math.abs(currentX) > distanceThreshold || velocity > velocityThreshold;

            if (isSwipe && Math.abs(currentX) > 30) {
                const classification = currentX > 0 ? 'ai' : 'real';
                this.swipeComplete(card, classification);
            } else {
                // Snap back with smooth animation - no shadow changes
                card.style.transform = 'translateX(0px) rotate(0deg) scale(1)';
                card.style.opacity = '1';
            }
        };


        card.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);


        card.addEventListener('touchstart', handleStart, { passive: false });
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);


        card.addEventListener('keydown', (e) => {
            if (this.isAnimating) return;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.swipeComplete(card, 'real');
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.swipeComplete(card, 'ai');
            }
        });


        card.setAttribute('tabindex', '0');


        card.addEventListener('contextmenu', (e) => e.preventDefault());
        card.addEventListener('selectstart', (e) => e.preventDefault());


        card._cleanup = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
        };
    }

    swipeComplete(card, classification) {
        if (this.isAnimating) return;
        this.isAnimating = true;


        if (card._cleanup) {
            card._cleanup();
        }


        const direction = classification === 'ai' ? 'right' : 'left';
        card.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease-out';

        if (direction === 'right') {
            card.style.transform = 'translateX(120vw) rotate(25deg) scale(0.8)';
        } else {
            card.style.transform = 'translateX(-120vw) rotate(-25deg) scale(0.8)';
        }
        card.style.opacity = '0';


        setTimeout(() => {
            this.classifyImage(classification);
        }, 600);
    }

    handleButtonClick(classification) {
        if (this.isAnimating) return;

        const currentCard = document.querySelector('.swipe-card');
        if (currentCard) {
            this.isAnimating = true;

            // Add glow effect to indicator
            if (classification === 'ai') {
                this.aiIndicator.classList.add('glow-ai');
            } else {
                this.realIndicator.classList.add('glow-real');
            }

            // Animate card completely off screen
            currentCard.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease-out';
            
            if (classification === 'ai') {
                currentCard.style.transform = 'translateX(120vw) rotate(25deg) scale(0.8)';
            } else {
                currentCard.style.transform = 'translateX(-120vw) rotate(-25deg) scale(0.8)';
            }
            currentCard.style.opacity = '0';

            // Wait for animation to complete, then proceed to next image
            setTimeout(() => {
                // Clean up glow effects
                this.realIndicator.classList.remove('glow-real');
                this.aiIndicator.classList.remove('glow-ai');
                
                // Process the classification and move to next image
                this.classifyImage(classification);
            }, 600);
        }
    }

    classifyImage(classification) {
        const currentImage = this.images[this.currentImageIndex];
        const isCorrect = currentImage.type === classification;

        if (isCorrect) {
            this.score++;
        }

        this.currentImageIndex++;
        this.isAnimating = false;


        setTimeout(() => {
            this.displayCurrentImage();
        }, 100);
    }

    endGame() {
        this.gameScreen.classList.add('hidden');
        this.endScreen.classList.remove('hidden');
        this.mainNav.classList.remove('hidden');

        const totalImages = this.images.length;
        const percentage = Math.round((this.score / totalImages) * 100);

        this.finalScore.textContent = `${this.score}/${totalImages}`;
        this.scorePercentage.textContent = `${percentage}%`;


        let message = '';
        if (percentage >= 90) {
            message = 'Outstanding! You\'re an AI detection expert! 🏆';
        } else if (percentage >= 75) {
            message = 'Excellent work! You have a great eye! 👏';
        } else if (percentage >= 60) {
            message = 'Good job! You\'re getting better at this! 👍';
        } else if (percentage >= 40) {
            message = 'Not bad! Keep practicing! 💪';
        } else {
            message = 'Room for improvement! Try again! 🎯';
        }

        this.scoreMessage.textContent = message;
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