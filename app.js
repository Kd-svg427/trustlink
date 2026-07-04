// FocusLock State Management & Mock Services
let user = {
    name: "David",
    level: "Level 4 Scholar",
    xp: 750,
    coins: 150,
    streak: 5,
    productivityScore: 92,
    screenTimeToday: 35, // in minutes
    dailyGoal: 120
};

// Local storage init
if (localStorage.getItem("focuslock_user")) {
    user = JSON.parse(localStorage.getItem("focuslock_user"));
} else {
    saveUserData();
}

let forestState = {
    treesGrown: 14,
    timerRunning: false,
    timeLeft: 1500, // 25 mins in seconds
    timerInterval: null,
    selectedTree: "🌳 Oak"
};

let petState = {
    food: 80,
    happy: 90,
    accessory: ""
};

let plannerTasks = [
    { id: 1, title: "Math Revision (Algebra)", category: "Study", isCompleted: false },
    { id: 2, title: "English Essay Draft", category: "Assignment", isCompleted: true }
];



function saveUserData() {
    localStorage.setItem("focuslock_user", JSON.stringify(user));
}

// 1. Navigation handling
function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            const target = item.getAttribute("data-target");
            switchScreen(target);
        });
    });
}

function switchScreen(screenId) {
    const screens = document.querySelectorAll(".app-screen");
    screens.forEach(s => s.classList.remove("active-screen"));
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add("active-screen");
    }
}

// 2. Global stats updates
function updateHeaderStats() {
    document.getElementById("bar-coins").innerText = `${user.coins} Coins`;
    document.getElementById("bar-streak").innerText = `${user.streak} Day Streak`;
    document.getElementById("widget-name").innerText = user.name;
    document.getElementById("widget-level").innerText = `${user.level}`;
    document.getElementById("chat-head-coins").innerText = `🪙 ${user.coins}`;
    document.getElementById("header-greeting").innerText = `Good Morning ${user.name} 👋`;
    
    // Dashboard widgets
    const remaining = user.dailyGoal - user.screenTimeToday;
    document.getElementById("dash-remaining-time").innerText = `${remaining}m`;
    document.getElementById("dash-productivity-score").innerText = `${user.productivityScore}%`;

    // Circular dashboard progress ring math
    const ring = document.getElementById("dashboard-progress-ring");
    if (ring) {
        const strokeDashOffset = 377 - (377 * (remaining / user.dailyGoal));
        ring.style.strokeDashoffset = Math.max(0, Math.min(377, strokeDashOffset));
    }
    saveUserData();
}

// 3. Theme Toggle (Dark, Light, AMOLED)
function initTheme() {
    const toggleBtn = document.getElementById("theme-toggle-btn");
    const docHtml = document.documentElement;

    toggleBtn.addEventListener("click", () => {
        const currentTheme = docHtml.getAttribute("data-theme");
        if (currentTheme === "dark") {
            docHtml.setAttribute("data-theme", "amoled");
            toggleBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
        } else if (currentTheme === "amoled") {
            docHtml.setAttribute("data-theme", "light");
            toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        } else {
            docHtml.setAttribute("data-theme", "dark");
            toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
    });
}

// 4. Chart configurations
let screenTimeChartInst = null;
function initScreenTimeChart() {
    const ctx = document.getElementById('screenTimeChart');
    if (!ctx) return;

    if (screenTimeChartInst) {
        screenTimeChartInst.destroy();
    }

    screenTimeChartInst = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Focus Hours',
                data: [2.5, 3.2, 1.8, 4.0, 3.5, 5.0, 4.2],
                borderColor: '#2563EB',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'Social Media Blocked (Hours)',
                data: [1.2, 0.8, 1.5, 0.4, 0.9, 0.2, 0.1],
                borderColor: '#7C3AED',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
            },
            plugins: {
                legend: { labels: { color: '#94a3b8' } }
            }
        }
    });
}

// 5. Draggable Chat Head Bubble overlay
function initDraggableBubble() {
    const bubble = document.getElementById("draggable-chat-head");
    const popup = document.getElementById("chat-head-popup");
    let isDragging = false;
    let startX, startY, origX, origY;

    bubble.addEventListener("mousedown", dragStart);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", dragEnd);

    // Touch support for mobiles
    bubble.addEventListener("touchstart", (e) => dragStart(e.touches[0]));
    document.addEventListener("touchmove", (e) => drag(e.touches[0]));
    document.addEventListener("touchend", dragEnd);

    function dragStart(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = bubble.getBoundingClientRect();
        origX = rect.left;
        origY = rect.top;
    }

    function drag(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        // Prevent bubble from going outside screen boundaries
        let newX = origX + dx;
        let newY = origY + dy;
        newX = Math.max(0, Math.min(window.innerWidth - 64, newX));
        newY = Math.max(0, Math.min(window.innerHeight - 64, newY));

        bubble.style.left = newX + "px";
        bubble.style.top = newY + "px";
        bubble.style.right = "auto";
        bubble.style.bottom = "auto";
    }

    function dragEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        
        // If bubble hardly moved, trigger popup
        const rect = bubble.getBoundingClientRect();
        const dist = Math.hypot(rect.left - origX, rect.top - origY);
        if (dist < 5) {
            toggleChatHeadPopup();
        }
    }

    function toggleChatHeadPopup() {
        const isVisible = popup.style.display === "block";
        popup.style.display = isVisible ? "none" : "block";
        const rect = bubble.getBoundingClientRect();
        popup.style.left = Math.max(10, rect.left - 260) + "px";
        popup.style.top = Math.max(10, rect.top - 110) + "px";
    }
}

// 6. AI Coach chatbot dialogs
function initAICoach() {
    const chatInput = document.getElementById("coach-chat-input");
    const sendBtn = document.getElementById("btn-send-coach-msg");
    const container = document.getElementById("coach-chat-container");

    sendBtn.addEventListener("click", handleSendMessage);
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "ENTER" || e.keyCode === 13) handleSendMessage();
    });

    function handleSendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Append user bubble
        appendChatBubble(text, true);
        chatInput.value = "";

        // Simulated AI response
        setTimeout(() => {
            const reply = getAIResponseText(text);
            appendChatBubble(reply, false);
        }, 800);
    }

    function appendChatBubble(text, isUser) {
        const bubble = document.createElement("div");
        bubble.className = `chat-bubble ${isUser ? "user" : "coach"}`;
        bubble.innerText = text;
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
    }

    function getAIResponseText(input) {
        const msg = input.toLowerCase();
        if (msg.includes("hello") || msg.includes("hi")) {
            return `Hello ${user.name}! Your current productive streak is ${user.streak} days. I recommend locking Instagram today to reach your 120m goal.`;
        }
        if (msg.includes("plan") || msg.includes("study")) {
            return "Sure! Try a Pomodoro block: Study 25 mins, take a 5 min stretch, and earn 5 Focus Coins. Would you like to launch the Focus Forest timer now?";
        }
        if (msg.includes("streak") || msg.includes("coins")) {
            return `You currently have ${user.coins} Focus Coins. If you complete today's challenges, you will hit a 6-day streak!`;
        }
        return "Consistent pacing is the key to memory retention. Explore trusted coaches in the TrustLink reviews section to find the right mentor for you!";
    }
}

// 7. Focus Forest Timer mechanics
function initForest() {
    const slider = document.getElementById("forest-duration-slider");
    const label = document.getElementById("forest-slider-lbl");
    const startBtn = document.getElementById("btn-start-forest");
    const treeTypeSelect = document.getElementById("forest-tree-type");
    const countLbl = document.getElementById("forest-tree-counter");

    slider.addEventListener("input", () => {
        label.innerText = `DURATION: ${slider.value} MINS`;
        forestState.timeLeft = slider.value * 60;
        updateBubbleTimer();
    });

    startBtn.addEventListener("click", () => {
        if (forestState.timerRunning) {
            // Cancel session
            clearInterval(forestState.timerInterval);
            forestState.timerRunning = false;
            startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Session';
            alert("Focus session cancelled. The tree has withered! 🥀");
        } else {
            // Start session
            forestState.timerRunning = true;
            forestState.selectedTree = treeTypeSelect.value;
            startBtn.innerHTML = '<i class="fa-solid fa-stop"></i> Cancel Session';
            
            // Highlight a random forest grid slot
            const grid = document.getElementById("forest-landscape-grid");
            const emptyPlots = Array.from(grid.children).filter(child => child.innerText === "");
            let activePlot = null;
            if (emptyPlots.length > 0) {
                activePlot = emptyPlots[0];
                activePlot.innerText = "🌱";
                activePlot.classList.add("active-tree");
            }

            forestState.timerInterval = setInterval(() => {
                forestState.timeLeft--;
                updateBubbleTimer();

                if (forestState.timeLeft <= 0) {
                    clearInterval(forestState.timerInterval);
                    forestState.timerRunning = false;
                    forestState.treesGrown++;
                    user.coins += Math.floor(slider.value / 5);
                    user.xp += Math.floor(slider.value / 5) * 10;
                    
                    if (activePlot) {
                        activePlot.innerText = forestState.selectedTree.split(" ")[0];
                        activePlot.classList.remove("active-tree");
                    }
                    
                    alert(`Congratulations! You grew a tree and earned +${Math.floor(slider.value / 5)} Focus Coins! 🎉`);
                    startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Session';
                    countLbl.innerHTML = `<i class="fa-solid fa-tree"></i> ${forestState.treesGrown} Trees Grown`;
                    updateHeaderStats();
                }
            }, 1000);
        }
    });

    function updateBubbleTimer() {
        const mins = Math.floor(forestState.timeLeft / 60);
        const secs = forestState.timeLeft % 60;
        const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        document.getElementById("chat-head-timer").innerText = formatted;
    }
}

// 8. Learning center quizzes
const quizDatabase = {
    "Mathematics": [
        { q: "What is the square root of 144?", a: ["10", "12", "14", "16"], c: 1, e: "12 * 12 equals 144." }
    ],
    "Science": [
        { q: "Which planet is known as the Red Planet?", a: ["Earth", "Mars", "Jupiter", "Venus"], c: 1, e: "Mars is covered in iron oxide, giving it a red hue." }
    ],
    "Artificial Intelligence": [
        { q: "What does NLP stand for in AI?", a: ["Neural Logic Processor", "Natural Language Processing", "Node Link Protocol", "Next Level Programming"], c: 1, e: "Natural Language Processing enables computers to understand human language." }
    ],
    "Finance": [
        { q: "What is diversification in investing?", a: ["Investing all money in one stock", "Spreading risk across multiple assets", "Stashing cash at home", "Borrowing money to invest"], c: 1, e: "Diversifying protects capital by reducing concentration risk." }
    ]
};

function initLearningCenter() {
    const loadBtn = document.getElementById("btn-load-question");
    const category = document.getElementById("quiz-category-select");
    const qText = document.getElementById("quiz-question-txt");
    const optionsContainer = document.getElementById("quiz-options-list");
    const expBox = document.getElementById("quiz-explanation-box");

    loadBtn.addEventListener("click", () => {
        expBox.style.display = "none";
        const cat = category.value;
        const list = quizDatabase[cat] || quizDatabase["Mathematics"];
        const selectedQuiz = list[0]; // Fetch top quiz for prototype simulation

        qText.innerText = selectedQuiz.q;
        optionsContainer.innerHTML = "";
        
        selectedQuiz.a.forEach((opt, idx) => {
            const btn = document.createElement("div");
            btn.className = "quiz-option";
            btn.innerText = opt;
            btn.addEventListener("click", () => {
                const options = optionsContainer.children;
                for (let child of options) {
                    child.style.pointerEvents = "none";
                }
                
                if (idx === selectedQuiz.c) {
                    btn.classList.add("correct");
                    user.coins += 5;
                    updateHeaderStats();
                    expBox.innerText = `Correct! +5 Coins. ${selectedQuiz.e}`;
                } else {
                    btn.classList.add("wrong");
                    options[selectedQuiz.c].classList.add("correct");
                    expBox.innerText = `Incorrect. ${selectedQuiz.e}`;
                }
                expBox.style.display = "block";
            });
            optionsContainer.appendChild(btn);
        });
    });
}

// 9. Brain games: Memory Match
const emojiCards = ["🧠", "💡", "🎯", "⚡", "🍀", "💎", "🔥", "👑", "🧠", "💡", "🎯", "⚡", "🍀", "💎", "🔥", "👑"];
let flippedCards = [];
let matchedCount = 0;

function initBrainGames() {
    const board = document.getElementById("memory-game-board");
    const restartBtn = document.getElementById("btn-restart-game");

    restartBtn.addEventListener("click", resetMemoryGame);
    resetMemoryGame();

    function resetMemoryGame() {
        board.innerHTML = "";
        flippedCards = [];
        matchedCount = 0;
        document.getElementById("game-status-txt").innerText = "Match the emojis to warm up your prefrontal cortex! (+10 XP)";

        // Shuffle cards
        const shuffled = [...emojiCards].sort(() => Math.random() - 0.5);

        shuffled.forEach((emoji, index) => {
            const card = document.createElement("div");
            card.className = "memory-card";
            card.dataset.index = index;
            card.dataset.emoji = emoji;
            card.innerText = emoji;

            card.addEventListener("click", () => {
                if (card.classList.contains("flipped") || card.classList.contains("matched") || flippedCards.length >= 2) return;

                card.classList.add("flipped");
                flippedCards.push(card);

                if (flippedCards.length === 2) {
                    setTimeout(checkMemoryMatch, 800);
                }
            });

            board.appendChild(card);
        });
    }

    function checkMemoryMatch() {
        const [c1, c2] = flippedCards;
        if (c1.dataset.emoji === c2.dataset.emoji) {
            c1.classList.add("matched");
            c2.classList.add("matched");
            matchedCount += 2;
            
            if (matchedCount === emojiCards.length) {
                user.xp += 10;
                user.coins += 15;
                updateHeaderStats();
                document.getElementById("game-status-txt").innerText = "Success! prefrontal cortex stimulated. +15 Coins & +10 XP rewarded!";
            }
        } else {
            c1.classList.remove("flipped");
            c2.classList.remove("flipped");
        }
        flippedCards = [];
    }
}

// 10. Virtual Pet
function initVirtualPet() {
    const foodLbl = document.getElementById("pet-food-lbl");
    const happyLbl = document.getElementById("pet-happy-lbl");
    const foodBar = document.getElementById("pet-food-bar");
    const happyBar = document.getElementById("pet-happy-bar");

    updatePetBars();

    window.buyPetItem = (type, cost) => {
        if (user.coins < cost) {
            alert("Insufficient Focus Coins!");
            return;
        }

        user.coins -= cost;
        updateHeaderStats();

        if (type === 'food') {
            petState.food = Math.min(100, petState.food + 20);
            alert("Yum! Buddy fed. +20 Food level.");
        } else if (type === 'crown') {
            petState.happy = Math.min(100, petState.happy + 10);
            document.getElementById("pet-display").innerText = "👑🐱";
            alert("Buddy is wearing the Royal Crown!");
        } else if (type === 'collar') {
            petState.happy = Math.min(100, petState.happy + 10);
            document.getElementById("pet-display").innerText = "🎀🐱";
            alert("Buddy looks adorable!");
        }
        updatePetBars();
    };

    function updatePetBars() {
        foodLbl.innerText = `${petState.food}/100`;
        happyLbl.innerText = `${petState.happy}/100`;
        foodBar.style.width = `${petState.food}%`;
        happyBar.style.width = `${petState.happy}%`;
    }
}

// 11. Planner Schedule
function initPlanner() {
    const list = document.getElementById("planner-tasks-list");
    const titleIn = document.getElementById("planner-task-title");
    const catSelect = document.getElementById("planner-task-cat");
    const addBtn = document.getElementById("btn-add-task");

    addBtn.addEventListener("click", () => {
        const title = titleIn.value.trim();
        if (!title) return;
        
        const newTask = {
            id: Date.now(),
            title: title,
            category: catSelect.value,
            isCompleted: false
        };
        plannerTasks.push(newTask);
        titleIn.value = "";
        renderTasks();
    });

    window.toggleTaskComplete = (id) => {
        const task = plannerTasks.find(t => t.id === id);
        if (task) {
            task.isCompleted = !task.isCompleted;
            renderTasks();
        }
    };

    renderTasks();

    function renderTasks() {
        list.innerHTML = "";
        plannerTasks.forEach(task => {
            const item = document.createElement("div");
            item.className = "app-lock-item";
            item.style.opacity = task.isCompleted ? 0.6 : 1;
            item.innerHTML = `
                <div>
                    <span style="${task.isCompleted ? 'text-decoration: line-through;' : ''}"><strong>${task.title}</strong></span>
                    <p class="stat-desc">Category: ${task.category}</p>
                </div>
                <input type="checkbox" ${task.isCompleted ? 'checked' : ''} onclick="toggleTaskComplete(${task.id})">
            `;
            list.appendChild(item);
        });
    }
}

// 12. Focus Wallet Currency converter
function initWallet() {
    const coinsTxt = document.getElementById("wallet-balance-txt");
    const usdTxt = document.getElementById("wallet-usd-val");
    const currencySelect = document.getElementById("wallet-currency-select");
    const withdrawBtn = document.getElementById("btn-withdraw-coins");

    const conversionRates = {
        USD: 0.01,
        EUR: 0.009,
        GBP: 0.008,
        JPY: 1.4,
        INR: 0.83,
        GHS: 0.12,
        NGN: 7.8
    };

    currencySelect.addEventListener("change", updateConversion);
    updateConversion();

    withdrawBtn.addEventListener("click", () => {
        alert("Rewards withdraw request registered! Completing verification processes (anti-cheat checks) takes 24 hours.");
    });

    function updateConversion() {
        coinsTxt.innerText = `${user.coins} Coins`;
        const currency = currencySelect.value;
        const rate = conversionRates[currency] || 0.01;
        const total = (user.coins * rate).toFixed(2);
        usdTxt.innerText = `${total} ${currency}`;
    }
}

// ===================================================
// 13. TOAST NOTIFICATION SYSTEM
// ===================================================

function showToast(message, type = "success", duration = 3200) {
    const host = document.getElementById("toast-host");
    if (!host) return;

    const iconMap = {
        success: '<i class="fa-solid fa-circle-check toast-icon"></i>',
        info:    '<i class="fa-solid fa-circle-info toast-icon"></i>',
        error:   '<i class="fa-solid fa-circle-exclamation toast-icon"></i>'
    };

    const card = document.createElement("div");
    card.className = `toast-card toast-${type}`;
    card.innerHTML = `${iconMap[type] || iconMap.info}<span class="toast-msg">${message}</span>`;
    host.appendChild(card);

    const dismiss = () => {
        card.classList.add("toast-exit");
        card.addEventListener("animationend", () => card.remove(), { once: true });
    };

    const timer = setTimeout(dismiss, duration);
    card.addEventListener("click", () => { clearTimeout(timer); dismiss(); });
}

// ===================================================
// 14. STAR-BASED VENDOR RATING & REVIEW SYSTEM
// ===================================================

// ---- Seed vendor data ----
const vendorCatClass = {
    "AI Coach":     "cat-ai",
    "Study Mentor": "cat-study",
    "Mindfulness":  "cat-mindfulness",
    "Fitness":      "cat-fitness",
    "Productivity": "cat-productivity"
};

const vendorAvatarGradients = [
    "linear-gradient(135deg,#2563EB,#06B6D4)",
    "linear-gradient(135deg,#7C3AED,#a855f7)",
    "linear-gradient(135deg,#10B981,#34d399)",
    "linear-gradient(135deg,#f97316,#F59E0B)",
    "linear-gradient(135deg,#06B6D4,#2563EB)",
    "linear-gradient(135deg,#ec4899,#7C3AED)"
];

let vendorsData = [
    {
        id: 1,
        name: "Aria Wellness",
        specialty: "AI Coach",
        emoji: "🤖",
        verified: true,
        bio: "AI-powered mindset coaching that adapts to your focus patterns. Specializes in digital detox programmes and building productive morning routines.",
        responseRate: 98,
        tags: ["Motivating","Results-Driven","Knowledgeable"],
        reviews: [
            { id: 101, author: "James K.", rating: 5, title: "Life-changing AI sessions!", body: "Aria's personalized coaching schedule cut my social media time by 60% in two weeks. The habit loops she builds are fantastic.", tags: ["Motivating","Results-Driven"], date: "Jun 28, 2026", helpful: 14 },
            { id: 102, author: "Sophie T.", rating: 4, title: "Very data-driven approach", body: "Loved the weekly analytics breakdowns. Could use more flexibility for irregular schedules but overall very solid.", tags: ["Knowledgeable"], date: "Jun 20, 2026", helpful: 8 }
        ]
    },
    {
        id: 2,
        name: "Prof. Marcus Webb",
        specialty: "Study Mentor",
        emoji: "📚",
        verified: true,
        bio: "Oxford-trained learning scientist. Teaches evidence-based memory retention, spaced repetition, and active recall strategies for students and professionals.",
        responseRate: 91,
        tags: ["Knowledgeable","Patient","Strict"],
        reviews: [
            { id: 201, author: "Ama Osei", rating: 5, title: "Best exam prep I've had", body: "Prof. Webb's spaced repetition system helped me ace my finals with half the study time. His Feynman technique workshops are pure gold.", tags: ["Knowledgeable","Patient"], date: "Jul 1, 2026", helpful: 22 },
            { id: 202, author: "Lucas M.", rating: 4, title: "Thorough but demanding", body: "Sessions are intense and high-value. Not for casual learners — he expects full commitment. Worth every minute though.", tags: ["Strict","Results-Driven"], date: "Jun 15, 2026", helpful: 6 },
            { id: 203, author: "Priya S.", rating: 5, title: "Transformed my study habits", body: "I went from 4-hour cramming sessions to 90-minute focused blocks with double the retention. Incredible methodology.", tags: ["Knowledgeable"], date: "Jun 8, 2026", helpful: 17 }
        ]
    },
    {
        id: 3,
        name: "Zen by Keiko",
        specialty: "Mindfulness",
        emoji: "🧘",
        verified: true,
        bio: "Certified mindfulness instructor and MBSR practitioner. Guides users through breathing techniques, body scans, and digital wellness meditations.",
        responseRate: 96,
        tags: ["Patient","Fun Sessions","Motivating"],
        reviews: [
            { id: 301, author: "Daniel R.", rating: 5, title: "Pure calm in a chaotic world", body: "Keiko's breathing exercises have become my daily reset ritual. My screen anxiety dropped dramatically after just 3 weeks.", tags: ["Patient","Motivating"], date: "Jul 2, 2026", helpful: 19 },
            { id: 302, author: "Fatima A.", rating: 4, title: "Genuinely peaceful sessions", body: "The guided body scans are the highlight. Wish there were more session slots in the evenings but overall fantastic.", tags: ["Fun Sessions"], date: "Jun 25, 2026", helpful: 5 }
        ]
    },
    {
        id: 4,
        name: "Coach Dre Fit",
        specialty: "Fitness",
        emoji: "💪",
        verified: false,
        bio: "NASM-certified personal trainer focused on 'movement snacks' — short bursts of exercise to boost dopamine, break sedentary cycles, and fuel focus sessions.",
        responseRate: 83,
        tags: ["Motivating","Fun Sessions","Responsive"],
        reviews: [
            { id: 401, author: "Emma L.", rating: 4, title: "Makes fitness feel effortless", body: "Love the 5-minute desk workouts. I've been stacking them with my Pomodoro breaks and it's transformed my afternoon slumps.", tags: ["Motivating","Fun Sessions"], date: "Jun 30, 2026", helpful: 11 },
            { id: 402, author: "Kwame B.", rating: 3, title: "Good energy, needs more structure", body: "Sessions are fun and high-energy. I'd love a more progressive plan but for quick daily boosts it works well.", tags: ["Motivating"], date: "Jun 18, 2026", helpful: 4 }
        ]
    },
    {
        id: 5,
        name: "FlowState Pro",
        specialty: "Productivity",
        emoji: "⚡",
        verified: true,
        bio: "Deep work strategist specializing in time-blocking, single-tasking, and elimination of digital distractions. Works with students, creators, and remote teams.",
        responseRate: 94,
        tags: ["Results-Driven","Knowledgeable","Affordable"],
        reviews: [
            { id: 501, author: "Noah C.", rating: 5, title: "Doubled my output in a month", body: "FlowState's time-blocking framework was the missing piece I needed. My deep work hours went from 1.5 to 4 a day. Incredible ROI.", tags: ["Results-Driven","Knowledgeable"], date: "Jul 3, 2026", helpful: 28 },
            { id: 502, author: "Isabelle F.", rating: 5, title: "Worth every penny", body: "The most actionable productivity coaching I've tried. Everything is simple to implement and the results show within days.", tags: ["Affordable","Results-Driven"], date: "Jun 22, 2026", helpful: 16 }
        ]
    },
    {
        id: 6,
        name: "MindMentor Raj",
        specialty: "Study Mentor",
        emoji: "🎓",
        verified: false,
        bio: "IIT alumni and competitive exam coach. Specialises in STEM subject mastery, problem-solving under pressure, and building laser-sharp examination focus.",
        responseRate: 87,
        tags: ["Strict","Knowledgeable","Patient"],
        reviews: [
            { id: 601, author: "Aditya P.", rating: 4, title: "Rigorous but rewarding", body: "Raj pushed me harder than I thought I needed. His problem-solving frameworks are unique and have genuinely improved my speed.", tags: ["Strict","Knowledgeable"], date: "Jun 12, 2026", helpful: 9 }
        ]
    }
];

// Load from localStorage if user has added reviews
const savedVendors = localStorage.getItem("focuslock_vendors");
if (savedVendors) {
    try {
        const parsed = JSON.parse(savedVendors);
        // Merge user reviews into seed data while keeping seed reviews
        parsed.forEach(saved => {
            const existing = vendorsData.find(v => v.id === saved.id);
            if (existing) {
                existing.reviews = saved.reviews;
            }
        });
    } catch(e) {}
}

function saveVendors() {
    localStorage.setItem("focuslock_vendors", JSON.stringify(vendorsData));
}

// ---- Utility helpers ----
function calcAvgRating(reviews) {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

function renderStars(rating, size = "sm") {
    const full  = Math.floor(rating);
    const half  = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    let html = '<div class="star-display">';
    for (let i = 0; i < full;  i++) html += `<i class="fa-solid fa-star"></i>`;
    if (half)                        html += `<i class="fa-solid fa-star-half-stroke"></i>`;
    for (let i = 0; i < empty; i++) html += `<i class="fa-regular fa-star"></i>`;
    html += '</div>';
    return html;
}

function getCatClass(specialty) {
    return vendorCatClass[specialty] || "cat-ai";
}

function fmtDate() {
    return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ---- State ----
let reviewsState = {
    activeCategory: "all",
    activeSort: "top",
    searchQuery: ""
};

// ---- Init ----
function initReviews() {
    populateVendorDropdown();
    renderSummaryBar();
    renderVendorCards();
    initReviewModal();
    initVendorDetailPanel();
    initCategoryFilter();
    initSortSelect();
    initSearchBar();
}

// ---- Summary Stats Bar ----
function renderSummaryBar() {
    const bar = document.getElementById("reviews-summary-bar");
    if (!bar) return;

    const totalReviews = vendorsData.reduce((s, v) => s + v.reviews.length, 0);
    const allRatings   = vendorsData.flatMap(v => v.reviews.map(r => r.rating));
    const globalAvg    = allRatings.length ? (allRatings.reduce((a,b) => a+b,0) / allRatings.length).toFixed(1) : "—";
    const verifiedCount = vendorsData.filter(v => v.verified).length;
    const highRated    = vendorsData.filter(v => calcAvgRating(v.reviews) >= 4.5).length;

    bar.innerHTML = `
        <div class="summary-stat-card">
            <div class="summary-stat-icon gold"><i class="fa-solid fa-star"></i></div>
            <div>
                <div class="summary-stat-label">Global Rating</div>
                <div class="summary-stat-value">${globalAvg} / 5</div>
            </div>
        </div>
        <div class="summary-stat-card">
            <div class="summary-stat-icon blue"><i class="fa-solid fa-comment-dots"></i></div>
            <div>
                <div class="summary-stat-label">Total Reviews</div>
                <div class="summary-stat-value">${totalReviews}</div>
            </div>
        </div>
        <div class="summary-stat-card">
            <div class="summary-stat-icon green"><i class="fa-solid fa-shield-check"></i></div>
            <div>
                <div class="summary-stat-label">Verified Coaches</div>
                <div class="summary-stat-value">${verifiedCount}</div>
            </div>
        </div>
        <div class="summary-stat-card">
            <div class="summary-stat-icon purple"><i class="fa-solid fa-trophy"></i></div>
            <div>
                <div class="summary-stat-label">Top-Rated (4.5+)</div>
                <div class="summary-stat-value">${highRated}</div>
            </div>
        </div>
    `;
}

// ---- Populate Vendor Dropdown ----
function populateVendorDropdown() {
    const sel = document.getElementById("review-vendor-select");
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Choose a coach --</option>';
    vendorsData.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v.id;
        opt.textContent = `${v.emoji} ${v.name} (${v.specialty})`;
        sel.appendChild(opt);
    });
}

// ---- Render Vendor Cards ----
function renderVendorCards() {
    const container = document.getElementById("vendor-cards-container");
    const emptyEl   = document.getElementById("reviews-empty");
    if (!container) return;

    let list = [...vendorsData];

    // Category filter
    if (reviewsState.activeCategory !== "all") {
        list = list.filter(v => v.specialty === reviewsState.activeCategory);
    }

    // Search filter
    if (reviewsState.searchQuery) {
        const q = reviewsState.searchQuery.toLowerCase();
        list = list.filter(v =>
            v.name.toLowerCase().includes(q) ||
            v.specialty.toLowerCase().includes(q) ||
            v.bio.toLowerCase().includes(q)
        );
    }

    // Sort
    if (reviewsState.activeSort === "top") {
        list.sort((a,b) => calcAvgRating(b.reviews) - calcAvgRating(a.reviews));
    } else if (reviewsState.activeSort === "most-reviews") {
        list.sort((a,b) => b.reviews.length - a.reviews.length);
    } else if (reviewsState.activeSort === "newest") {
        // Use last review date order (most recently added first by reversing original index)
        list.sort((a,b) => b.id - a.id);
    }

    container.innerHTML = "";

    if (!list.length) {
        emptyEl && (emptyEl.style.display = "block");
        return;
    }
    emptyEl && (emptyEl.style.display = "none");

    list.forEach((vendor, idx) => {
        const avg      = calcAvgRating(vendor.reviews);
        const catClass = getCatClass(vendor.specialty);
        const grad     = vendorAvatarGradients[idx % vendorAvatarGradients.length];
        const topTags  = vendor.tags.slice(0, 3);

        const card = document.createElement("div");
        card.className = `vendor-card ${catClass}`;
        card.dataset.vendorId = vendor.id;

        card.innerHTML = `
            <div class="vendor-card-header">
                <div class="vendor-avatar ${vendor.verified ? 'verified' : ''}" style="background:${grad};">
                    ${vendor.emoji}
                </div>
                <div class="vendor-info">
                    <div class="vendor-name">${vendor.name}</div>
                    <span class="vendor-specialty ${catClass}">${vendor.specialty}</span>
                </div>
            </div>
            <div class="vendor-rating-row">
                ${renderStars(avg)}
                <span class="vendor-rating-score">${avg ? avg.toFixed(1) : "—"}</span>
                <span class="vendor-review-count">(${vendor.reviews.length} review${vendor.reviews.length !== 1 ? 's' : ''})</span>
            </div>
            <p class="vendor-bio">${vendor.bio}</p>
            <div class="vendor-tags-preview">
                ${topTags.map(t => `<span class="vendor-tag-pill">${t}</span>`).join('')}
            </div>
            <div class="vendor-card-footer">
                <span class="vendor-response-rate">Response rate: <span>${vendor.responseRate}%</span></span>
                <button class="btn-glass btn-primary" style="padding:7px 16px; font-size:13px;" onclick="openVendorDetail(${vendor.id})">
                    <i class="fa-solid fa-eye"></i> View Reviews
                </button>
            </div>
        `;

        // Whole card click also opens detail
        card.addEventListener("click", (e) => {
            if (e.target.closest("button")) return;
            openVendorDetail(vendor.id);
        });

        container.appendChild(card);
    });
}

// ---- Category filter chips ----
function initCategoryFilter() {
    const chips = document.querySelectorAll(".filter-chip");
    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            chips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            reviewsState.activeCategory = chip.dataset.cat;
            renderVendorCards();
        });
    });
}

// ---- Sort Select ----
function initSortSelect() {
    const sel = document.getElementById("reviews-sort-select");
    if (!sel) return;
    sel.addEventListener("change", () => {
        reviewsState.activeSort = sel.value;
        renderVendorCards();
    });
}

// ---- Search ----
function initSearchBar() {
    const input = document.getElementById("reviews-search-input");
    if (!input) return;
    let debounce;
    input.addEventListener("input", () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            reviewsState.searchQuery = input.value.trim();
            renderVendorCards();
        }, 220);
    });
}

// ---- Review Modal ----
let selectedRating    = 0;
let selectedTags      = new Set();

function initReviewModal() {
    const openBtn   = document.getElementById("btn-open-review-modal");
    const closeBtn  = document.getElementById("btn-close-review-modal");
    const cancelBtn = document.getElementById("btn-cancel-review");
    const submitBtn = document.getElementById("btn-submit-review");
    const overlay   = document.getElementById("review-modal-overlay");
    const bodyInput = document.getElementById("review-body-input");
    const charCount = document.getElementById("review-char-count");

    openBtn  && openBtn.addEventListener("click",   openReviewModal);
    closeBtn && closeBtn.addEventListener("click",  closeReviewModal);
    cancelBtn && cancelBtn.addEventListener("click", closeReviewModal);
    overlay  && overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeReviewModal();
    });

    // Char counter
    bodyInput && bodyInput.addEventListener("input", () => {
        const len = bodyInput.value.length;
        charCount.textContent = len;
        charCount.style.color = len > 450 ? "var(--warning)" : "var(--text-secondary)";
    });

    // Star interactions
    const stars = document.querySelectorAll(".star-btn");
    const label = document.getElementById("star-rating-label");
    const starLabels = ["", "Poor – room for improvement", "Fair – some value", "Good – recommended", "Great – loved it!", "Excellent – top-tier!"];

    stars.forEach(star => {
        star.addEventListener("mouseenter", () => {
            const r = parseInt(star.dataset.rating);
            highlightStars(r);
            label.textContent = starLabels[r];
        });
        star.addEventListener("mouseleave", () => {
            highlightStars(selectedRating);
            label.textContent = selectedRating ? starLabels[selectedRating] : "Tap to rate";
        });
        star.addEventListener("click", () => {
            selectedRating = parseInt(star.dataset.rating);
            highlightStars(selectedRating);
            label.textContent = starLabels[selectedRating];
            label.style.color = "var(--warning)";
        });
    });

    // Tag toggles
    const tags = document.querySelectorAll(".review-tag");
    tags.forEach(tag => {
        tag.addEventListener("click", () => {
            const t = tag.dataset.tag;
            if (selectedTags.has(t)) {
                selectedTags.delete(t);
                tag.classList.remove("selected");
            } else {
                selectedTags.add(t);
                tag.classList.add("selected");
            }
        });
    });

    // Submit
    submitBtn && submitBtn.addEventListener("click", submitReview);
}

function openReviewModal(vendorId = null) {
    resetReviewForm();
    if (vendorId) {
        const sel = document.getElementById("review-vendor-select");
        if (sel) sel.value = vendorId;
    }
    document.getElementById("review-modal-overlay").classList.add("open");
}

function closeReviewModal() {
    document.getElementById("review-modal-overlay").classList.remove("open");
    resetReviewForm();
}

function resetReviewForm() {
    selectedRating = 0;
    selectedTags   = new Set();
    highlightStars(0);
    const label = document.getElementById("star-rating-label");
    if (label) { label.textContent = "Tap to rate"; label.style.color = ""; }

    ["review-vendor-select","review-title-input","review-body-input","review-author-input"]
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });

    const charCount = document.getElementById("review-char-count");
    if (charCount) charCount.textContent = "0";

    document.querySelectorAll(".review-tag").forEach(t => t.classList.remove("selected"));
}

function highlightStars(count) {
    document.querySelectorAll(".star-btn").forEach(star => {
        const r = parseInt(star.dataset.rating);
        if (r <= count) {
            star.className = "fa-solid fa-star star-btn selected";
        } else {
            star.className = "fa-regular fa-star star-btn";
        }
    });
}

function submitReview() {
    const vendorId  = parseInt(document.getElementById("review-vendor-select").value);
    const title     = document.getElementById("review-title-input").value.trim();
    const body      = document.getElementById("review-body-input").value.trim();
    const author    = document.getElementById("review-author-input").value.trim() || "Anonymous";

    // Validation
    if (!vendorId) {
        showToast("Please select a coach to review.", "error");
        return;
    }
    if (!selectedRating) {
        showToast("Please select a star rating before submitting.", "error");
        return;
    }
    if (body.length < 20) {
        showToast("Your review must be at least 20 characters long.", "error");
        return;
    }

    const vendor = vendorsData.find(v => v.id === vendorId);
    if (!vendor) return;

    const newReview = {
        id:      Date.now(),
        author:  author,
        rating:  selectedRating,
        title:   title || "My Review",
        body:    body,
        tags:    [...selectedTags],
        date:    fmtDate(),
        helpful: 0
    };

    vendor.reviews.unshift(newReview);
    saveVendors();

    // Reward user with XP for contributing
    user.xp    += 15;
    user.coins += 5;
    updateHeaderStats();

    closeReviewModal();
    renderVendorCards();
    renderSummaryBar();

    showToast(`Review submitted! +5 Coins & +15 XP earned 🌟`, "success");
}

// ---- Vendor Detail Panel ----
function initVendorDetailPanel() {
    const overlay  = document.getElementById("vendor-detail-overlay");
    const closeBtn = document.getElementById("btn-close-detail");

    closeBtn && closeBtn.addEventListener("click", closeVendorDetail);
    overlay  && overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeVendorDetail();
    });
}

window.openVendorDetail = function(vendorId) {
    const vendor = vendorsData.find(v => v.id === vendorId);
    if (!vendor) return;

    const avg      = calcAvgRating(vendor.reviews);
    const catClass = getCatClass(vendor.specialty);
    const overlay  = document.getElementById("vendor-detail-overlay");
    const body     = document.getElementById("vendor-detail-body");
    const nameEl   = document.getElementById("detail-vendor-name");

    if (!overlay || !body || !nameEl) return;

    nameEl.innerHTML = `${vendor.emoji} ${vendor.name} ${vendor.verified ? '<i class="fa-solid fa-circle-check" style="color:var(--primary);font-size:14px;" title="Verified"></i>' : ''}`;

    // Rating distribution
    const dist = [5,4,3,2,1].map(star => ({
        star,
        count: vendor.reviews.filter(r => r.rating === star).length
    }));
    const maxCount = Math.max(...dist.map(d => d.count), 1);

    body.innerHTML = `
        <!-- Overview Row -->
        <div style="display:flex; gap:1.5rem; margin-bottom:1.75rem; flex-wrap:wrap;">
            <!-- Big Rating Badge -->
            <div style="text-align:center; background:rgba(255,255,255,0.04); border:1px solid var(--panel-border); border-radius:18px; padding:1.25rem 2rem; flex-shrink:0;">
                <div style="font-size:48px; font-weight:900; font-family:'Outfit',sans-serif; color:var(--warning); line-height:1;">${avg ? avg.toFixed(1) : "—"}</div>
                <div style="margin: 8px 0 4px;">${renderStars(avg)}</div>
                <div class="stat-desc">${vendor.reviews.length} review${vendor.reviews.length !== 1 ? 's' : ''}</div>
            </div>

            <!-- Distribution bars -->
            <div style="flex:1; min-width:200px;">
                ${dist.map(d => `
                    <div class="rating-dist-row">
                        <div class="rating-dist-label"><i class="fa-solid fa-star" style="color:var(--warning); font-size:10px;"></i> ${d.star}</div>
                        <div class="rating-dist-bar-wrap">
                            <div class="rating-dist-bar-fill" style="width:${Math.round(d.count/maxCount*100)}%;"></div>
                        </div>
                        <div class="rating-dist-count">${d.count}</div>
                    </div>
                `).join('')}
            </div>

            <!-- Bio & Tags -->
            <div style="flex:1; min-width:220px;">
                <span class="vendor-specialty ${catClass}" style="margin-bottom:8px; display:inline-block;">${vendor.specialty}</span>
                <p style="font-size:13px; color:var(--text-secondary); line-height:1.6; margin-bottom:10px;">${vendor.bio}</p>
                <div style="font-size:12px; color:var(--text-secondary);">Response rate: <strong style="color:var(--success);">${vendor.responseRate}%</strong></div>
                <div style="margin-top:10px; display:flex; gap:6px; flex-wrap:wrap;">
                    ${vendor.tags.map(t => `<span class="vendor-tag-pill">${t}</span>`).join('')}
                </div>
            </div>
        </div>

        <!-- Write review CTA -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h4 style="font-size:15px; font-weight:700;">${vendor.reviews.length} Review${vendor.reviews.length!==1?'s':''}</h4>
            <button class="btn-glass btn-primary" style="font-size:13px; padding:8px 16px;" onclick="closeVendorDetail(); openReviewModal(${vendor.id});">
                <i class="fa-solid fa-pen-to-square"></i> Write a Review
            </button>
        </div>

        <!-- Review Items -->
        <div id="detail-reviews-list">
            ${vendor.reviews.length ? vendor.reviews.map(r => renderReviewItem(r)).join('') : `
                <div style="text-align:center; padding:2rem; color:var(--text-secondary);">
                    <i class="fa-regular fa-comment-dots" style="font-size:32px; display:block; margin-bottom:8px; opacity:0.4;"></i>
                    No reviews yet. Be the first to share your experience!
                </div>
            `}
        </div>
    `;

    overlay.classList.add("open");
};

function renderReviewItem(review) {
    const initials = review.author.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
    return `
        <div class="review-item" id="review-item-${review.id}">
            <div class="review-item-header">
                <div class="review-author-avatar">${initials}</div>
                <div>
                    <div class="review-author-name">${escapeHtml(review.author)}</div>
                    <div>${renderStars(review.rating)}</div>
                </div>
                <span class="review-date">${review.date}</span>
            </div>
            ${review.title ? `<div class="review-item-title">${escapeHtml(review.title)}</div>` : ''}
            <div class="review-item-body">${escapeHtml(review.body)}</div>
            ${review.tags && review.tags.length ? `
                <div class="review-item-tags">
                    ${review.tags.map(t => `<span class="review-item-tag">${escapeHtml(t)}</span>`).join('')}
                </div>
            ` : ''}
            <div class="review-helpful-row">
                <span style="font-size:12px; color:var(--text-secondary);">Helpful?</span>
                <button class="btn-helpful" onclick="markHelpful(${review.id}, this)">
                    <i class="fa-regular fa-thumbs-up"></i> <span class="helpful-count">${review.helpful || 0}</span>
                </button>
            </div>
        </div>
    `;
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

window.markHelpful = function(reviewId, btn) {
    if (btn.classList.contains("active")) {
        showToast("You've already marked this as helpful.", "info");
        return;
    }
    // Find and update
    for (const vendor of vendorsData) {
        const r = vendor.reviews.find(r => r.id === reviewId);
        if (r) {
            r.helpful = (r.helpful || 0) + 1;
            const countEl = btn.querySelector(".helpful-count");
            if (countEl) countEl.textContent = r.helpful;
            btn.classList.add("active");
            btn.innerHTML = `<i class="fa-solid fa-thumbs-up"></i> <span class="helpful-count">${r.helpful}</span>`;
            saveVendors();
            showToast("Marked as helpful! 👍", "success");
            break;
        }
    }
};

function closeVendorDetail() {
    document.getElementById("vendor-detail-overlay").classList.remove("open");
}

// Expose openReviewModal globally for the HTML button in vendor detail
window.openReviewModal = openReviewModal;
window.closeVendorDetail = closeVendorDetail;

// ---- Hook into DOMContentLoaded ----
document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initTheme();
    updateHeaderStats();
    initScreenTimeChart();
    initDraggableBubble();
    initAICoach();
    initForest();
    initLearningCenter();
    initBrainGames();
    initVirtualPet();
    initPlanner();
    initWallet();
    initReviews();
});

