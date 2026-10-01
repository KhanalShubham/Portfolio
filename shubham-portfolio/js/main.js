/**
 * SHUBHAM OS - Complete Experience Layer & Window Manager
 * Vintage Windows XP Portfolio Environment
 */

// ==========================================
// 1. Audio System (Web Audio API Synthesizer)
// ==========================================
class RetroAudio {
    constructor() {
        this.ctx = null;
        this.synthOscs = [];
        this.synthGain = null;
        this.isPlayingAmbient = false;
        this.isMuted = false;
        this.volume = 0.5;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
    }

    playClick() {
        if (this.isMuted) return;
        try {
            this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.08 * this.volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.05);
        } catch (e) { }
    }

    playErrorChord() {
        if (this.isMuted) return;
        try {
            this.init();
            if (!this.ctx) return;
            const freqs = [150, 220];
            freqs.forEach(f => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(f, this.ctx.currentTime);
                gain.gain.setValueAtTime(0.12 * this.volume, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.4);
            });
        } catch (e) { }
    }

    playChime() {
        if (this.isMuted) return;
        try {
            this.init();
            if (!this.ctx) return;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);
                gain.gain.setValueAtTime(0.001, this.ctx.currentTime + idx * 0.12);
                gain.gain.linearRampToValueAtTime(0.15 * this.volume, this.ctx.currentTime + idx * 0.12 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.8);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + idx * 0.12);
                osc.stop(this.ctx.currentTime + idx * 0.12 + 0.9);
            });
        } catch (e) { }
    }

    toggleAmbient() {
        this.init();
        if (!this.ctx) return false;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        if (this.isPlayingAmbient) {
            this.stopAmbient();
            return false;
        } else {
            this.startAmbient();
            return true;
        }
    }

    startAmbient() {
        if (this.isPlayingAmbient || !this.ctx) return;
        const rootFreq = 130.81; // C3
        const freqs = [rootFreq, rootFreq * 1.5, rootFreq * 1.875, rootFreq * 2.25]; // C Maj 9th
        this.synthGain = this.ctx.createGain();
        this.synthGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        this.synthGain.gain.linearRampToValueAtTime(0.08 * this.volume, this.ctx.currentTime + 1.5);
        this.synthGain.connect(this.ctx.destination);

        this.synthOscs = freqs.map((f, i) => {
            const osc = this.ctx.createOscillator();
            osc.type = i % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(f, this.ctx.currentTime);
            osc.connect(this.synthGain);
            osc.start();
            return osc;
        });

        this.isPlayingAmbient = true;
    }

    stopAmbient() {
        if (!this.isPlayingAmbient) return;
        if (this.synthGain && this.ctx) {
            this.synthGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
            setTimeout(() => {
                this.synthOscs.forEach(o => {
                    try { o.stop(); } catch (e) { }
                });
                this.synthOscs = [];
                this.isPlayingAmbient = false;
            }, 550);
        } else {
            this.isPlayingAmbient = false;
        }
    }

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.synthGain && this.ctx) {
            this.synthGain.gain.linearRampToValueAtTime(0.08 * this.volume, this.ctx.currentTime + 0.1);
        }
    }
}

const retroAudio = new RetroAudio();

// ==========================================
// 2. Global State & Window Management
// ==========================================
let highestZ = 30;
const openWindowsMap = new Map(); // id -> { title, icon, isMinimized }
let profileBootCompleted = false;

function bringToFront(id) {
    const el = document.getElementById(id);
    if (!el) return;
    highestZ += 2;
    el.style.zIndex = highestZ;

    document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
    el.classList.add('focused');

    updateTaskbarTabs();
}

function openWindow(id, options = {}) {
    const el = document.getElementById(id);
    if (!el) return;

    retroAudio.playClick();

    el.classList.remove('hidden');
    el.classList.remove('minimized');
    bringToFront(id);

    const titleText = el.querySelector('.title-bar-text')?.textContent || el.querySelector('.window-title')?.textContent || id;
    const iconSrc = el.querySelector('.title-bar-icon')?.src || 'https://win98icons.alexmeub.com/icons/png/window-0.png';

    openWindowsMap.set(id, {
        title: titleText.trim(),
        icon: iconSrc,
        isMinimized: false
    });

    updateTaskbarTabs();
    closeStartMenu();
}

function closeWindow(id) {
    const el = document.getElementById(id);
    if (el) {
        retroAudio.playClick();
        el.classList.add('hidden');
        openWindowsMap.delete(id);
        updateTaskbarTabs();
    }
}

function minimizeWindow(id) {
    const el = document.getElementById(id);
    if (el) {
        retroAudio.playClick();
        el.classList.add('minimized');
        el.classList.remove('focused');
        const info = openWindowsMap.get(id);
        if (info) {
            info.isMinimized = true;
        }
        updateTaskbarTabs();
    }
}

function maximizeWindow(id) {
    const el = document.getElementById(id);
    if (el) {
        retroAudio.playClick();
        el.classList.toggle('maximized');
        bringToFront(id);
    }
}

function toggleWindow(id) {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.classList.contains('hidden')) {
        openWindow(id);
    } else if (el.classList.contains('minimized')) {
        el.classList.remove('minimized');
        bringToFront(id);
        const info = openWindowsMap.get(id);
        if (info) info.isMinimized = false;
        updateTaskbarTabs();
    } else if (el.classList.contains('focused')) {
        minimizeWindow(id);
    } else {
        bringToFront(id);
    }
}

// Draggable Windows Implementation (Mouse & Touch)
function setupDraggableWindows() {
    document.querySelectorAll('.window').forEach(win => {
        const titleBar = win.querySelector('.title-bar') || win.querySelector('.window-title-bar');
        if (!titleBar) return;

        win.addEventListener('mousedown', () => bringToFront(win.id));
        win.addEventListener('touchstart', () => bringToFront(win.id), { passive: true });

        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const onDragStart = (clientX, clientY) => {
            if (win.classList.contains('maximized')) return;
            isDragging = true;
            bringToFront(win.id);

            const rect = win.getBoundingClientRect();
            win.style.transform = 'none';
            win.style.left = `${rect.left}px`;
            win.style.top = `${rect.top}px`;

            startX = clientX;
            startY = clientY;
            initialLeft = rect.left;
            initialTop = rect.top;
        };

        const onDragMove = (clientX, clientY) => {
            if (!isDragging) return;
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;

            let newLeft = initialLeft + deltaX;
            let newTop = initialTop + deltaY;

            newTop = Math.max(0, Math.min(window.innerHeight - 70, newTop));
            newLeft = Math.max(-win.offsetWidth + 80, Math.min(window.innerWidth - 80, newLeft));

            win.style.left = `${newLeft}px`;
            win.style.top = `${newTop}px`;
        };

        const onDragEnd = () => {
            isDragging = false;
        };

        titleBar.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('control-btn') || e.target.classList.contains('btn-box')) return;
            onDragStart(e.clientX, e.clientY);

            const mouseMoveHandler = (moveEvent) => onDragMove(moveEvent.clientX, moveEvent.clientY);
            const mouseUpHandler = () => {
                onDragEnd();
                window.removeEventListener('mousemove', mouseMoveHandler);
                window.removeEventListener('mouseup', mouseUpHandler);
            };

            window.addEventListener('mousemove', mouseMoveHandler);
            window.addEventListener('mouseup', mouseUpHandler);
        });

        titleBar.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('control-btn')) return;
            const touch = e.touches[0];
            onDragStart(touch.clientX, touch.clientY);

            const touchMoveHandler = (moveEvent) => {
                const t = moveEvent.touches[0];
                onDragMove(t.clientX, t.clientY);
            };

            const touchEndHandler = () => {
                onDragEnd();
                window.removeEventListener('touchmove', touchMoveHandler);
                window.removeEventListener('touchend', touchEndHandler);
            };

            window.addEventListener('touchmove', touchMoveHandler);
            window.addEventListener('touchend', touchEndHandler);
        }, { passive: true });
    });
}

// ==========================================
// 3. Taskbar Active Window Tabs
// ==========================================
function updateTaskbarTabs() {
    const container = document.getElementById('taskbar-windows');
    if (!container) return;

    container.innerHTML = '';

    openWindowsMap.forEach((info, winId) => {
        const winEl = document.getElementById(winId);
        if (!winEl || winEl.classList.contains('hidden')) return;

        const isFocused = winEl.classList.contains('focused') && !winEl.classList.contains('minimized');

        const tab = document.createElement('div');
        tab.className = `taskbar-tab ${isFocused ? 'active' : ''}`;
        tab.title = info.title;

        tab.innerHTML = `
            <img src="${info.icon}" alt="icon" onerror="this.src='https://win98icons.alexmeub.com/icons/png/window-0.png'">
            <span>${info.title}</span>
        `;

        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWindow(winId);
        });

        container.appendChild(tab);
    });
}

// ==========================================
// 4. Draggable Desktop Icons & LocalStorage
// ==========================================
const ICON_STORAGE_KEY = 'shubham_os_desktop_icons_xp_v4';

function setupDraggableIcons() {
    const icons = document.querySelectorAll('.desktop-icon');
    const savedPositions = JSON.parse(localStorage.getItem(ICON_STORAGE_KEY) || '{}');

    icons.forEach((icon, index) => {
        const iconId = icon.getAttribute('data-icon-id') || `icon-${index}`;
        icon.setAttribute('data-icon-id', iconId);

        if (savedPositions[iconId]) {
            icon.style.left = `${savedPositions[iconId].left}px`;
            icon.style.top = `${savedPositions[iconId].top}px`;
        } else {
            const col = Math.floor(index / 6);
            const row = index % 6;
            icon.style.left = `${18 + col * 94}px`;
            icon.style.top = `${15 + row * 88}px`;
        }

        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
        });

        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        let hasMoved = false;

        icon.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = parseInt(icon.style.left, 10) || icon.offsetLeft;
            initialTop = parseInt(icon.style.top, 10) || icon.offsetTop;

            const onMouseMove = (moveEv) => {
                const dx = moveEv.clientX - startX;
                const dy = moveEv.clientY - startY;
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                    hasMoved = true;
                }
                const newLeft = Math.max(5, Math.min(window.innerWidth - 90, initialLeft + dx));
                const newTop = Math.max(5, Math.min(window.innerHeight - 130, initialTop + dy));
                icon.style.left = `${newLeft}px`;
                icon.style.top = `${newTop}px`;
            };

            const onMouseUp = () => {
                isDragging = false;
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);

                if (hasMoved) {
                    const curPos = JSON.parse(localStorage.getItem(ICON_STORAGE_KEY) || '{}');
                    curPos[iconId] = {
                        left: parseInt(icon.style.left, 10),
                        top: parseInt(icon.style.top, 10)
                    };
                    localStorage.setItem(ICON_STORAGE_KEY, JSON.stringify(curPos));
                }
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    });
}

function resetDesktopIconPositions() {
    localStorage.removeItem(ICON_STORAGE_KEY);
    const icons = document.querySelectorAll('.desktop-icon');
    icons.forEach((icon, index) => {
        const col = Math.floor(index / 6);
        const row = index % 6;
        icon.style.left = `${18 + col * 94}px`;
        icon.style.top = `${15 + row * 88}px`;
    });
}

// ==========================================
// 5. Desktop Selection Marquee
// ==========================================
function setupDesktopSelectionBox() {
    const desktop = document.getElementById('desktop');
    const box = document.getElementById('selection-box');
    if (!desktop || !box) return;

    let isSelecting = false;
    let startX = 0, startY = 0;

    desktop.addEventListener('mousedown', (e) => {
        if (e.target !== desktop) return;
        isSelecting = true;
        startX = e.clientX;
        startY = e.clientY;
        box.style.left = `${startX}px`;
        box.style.top = `${startY}px`;
        box.style.width = '0px';
        box.style.height = '0px';
        box.style.display = 'block';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isSelecting) return;
        const currentX = e.clientX;
        const currentY = e.clientY;

        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        box.style.left = `${left}px`;
        box.style.top = `${top}px`;
        box.style.width = `${width}px`;
        box.style.height = `${height}px`;
    });

    window.addEventListener('mouseup', () => {
        if (isSelecting) {
            isSelecting = false;
            box.style.display = 'none';
        }
    });
}

// ==========================================
// 6. Start Menu & Shut Down Dialog
// ==========================================
function toggleStartMenu() {
    const menu = document.getElementById('start-menu');
    const btn = document.querySelector('.start-btn');
    if (!menu) return;

    retroAudio.playClick();
    const isHidden = menu.style.display !== 'block';
    if (isHidden) {
        menu.style.display = 'block';
        if (btn) btn.classList.add('active');
    } else {
        closeStartMenu();
    }
}

function closeStartMenu() {
    const menu = document.getElementById('start-menu');
    const btn = document.querySelector('.start-btn');
    if (menu) menu.style.display = 'none';
    if (btn) btn.classList.remove('active');
}

function openShutDownDialog() {
    closeStartMenu();
    openWindow('dialog-shutdown');
}

function handleShutDownAction() {
    retroAudio.playClick();
    closeWindow('dialog-shutdown');
    showSystemMessage({
        title: 'Shubham OS',
        icon: 'https://win98icons.alexmeub.com/icons/png/shut_down_cool-0.png',
        message: '<strong>It\'s a portfolio.</strong><br><br>You can\'t shut me down that easily.<br>Feel free to keep exploring!',
        btnText: 'Continue Exploring'
    });
}

// ==========================================
// 7. Right-Click Context Menu & Refresh
// ==========================================
function setupDesktopContextMenu() {
    const menu = document.getElementById('desktop-context-menu');
    const desktop = document.getElementById('desktop');
    if (!menu || !desktop) return;

    window.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.window') || e.target.closest('.taskbar') || e.target.closest('#start-menu')) {
            menu.style.display = 'none';
            return;
        }

        e.preventDefault();
        retroAudio.playClick();

        const x = Math.min(window.innerWidth - 180, e.clientX);
        const y = Math.min(window.innerHeight - 180, e.clientY);

        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.style.display = 'block';
    });

    window.addEventListener('click', () => {
        menu.style.display = 'none';
    });
}

function triggerDesktopRefresh() {
    const desktop = document.getElementById('desktop');
    if (desktop) {
        desktop.classList.add('refreshing-screen');
        setTimeout(() => desktop.classList.remove('refreshing-screen'), 450);
    }
    retroAudio.playClick();

    showSystemMessage({
        title: 'Refreshing Shubham OS...',
        icon: 'https://win98icons.alexmeub.com/icons/png/hourglass-0.png',
        message: '<strong>Refreshing Shubham OS...</strong><br><br>Still here.',
        btnText: 'Great'
    });
}

// ==========================================
// 8. Recycle Bin & Hidden Files (Level 3)
// ==========================================
const recycleFiles = {
    "everything I didn't say.txt": `everything I didn't say.txt
=============================================================
Author: Shubham Khanal
Original Location: C:\\SHUBHAM\\Personal
Attributes: Hidden, Honest, Read-Only

1. Sometimes I spend 3 hours debugging an issue only to realize I was editing the wrong file or forgot a semicolon.
2. I genuinely miss software that was designed to be owned and kept on a hard drive, not rented for $29/month.
3. Every time I hit a winner down the line in soft tennis, for 2 seconds I feel like the universe makes total sense.
4. I built this entire operating system interface because I think modern software has forgotten how to be playful, tactile, and have character.
5. If you're reading this, thank you for exploring this far into my computer.

— Shubham Khanal`,

    'old_portfolio.txt': `old_portfolio.txt
=============================================================
Date Deleted: 3 days ago
Original Location: C:\\SHUBHAM\\Projects

[POST-MORTEM OF DELETED PORTFOLIO]
- Modern full-page hero gradient
- "Hi, I am a passionate full-stack developer"
- Generic spinning tech badges
- Bland SaaS card grid
- Completely devoid of personality and human warmth

Verdict:
Purged into Recycle Bin where it belongs.
Windows XP is much cooler.`,

    'unfinished_ideas.txt': `unfinished_ideas.txt
=============================================================
Date Deleted: Last week
Original Location: C:\\SHUBHAM\\Drafts

1. Real-time audio spectrogram running as a Winamp plugin in WebGL.
2. A soft tennis coaching app using mobile WebRTC cameras and court calibration.
3. A local-first markdown note editor disguised as a 1999 palm pilot.
4. Autonomous RC car pathfinding with onboard lightweight CNNs driving around Kathmandu while I sit at my desk.
5. A physical retro floppy disk that boots a live portfolio.`,

    'README_old.txt': `README_old.txt
=============================================================
README for Shubham OS v1.0
All systems nominal.

Remember:
"Stay hungry, stay foolish, and always check your git diff."

— Shubham`,

    'things_i_never_said.txt': `THINGS I NEVER SAID:

- Sometimes I spend an hour making a button feel 1% more satisfying to click.
- I secretly judge modern software that doesn't have keyboard shortcuts.
- The first time my YOLOv8 model detected a tennis ball moving at 60fps, I actually celebrated out loud in my room.
- I love vintage operating systems because they felt like personal spaces rather than corporate dashboards.
- Thank you for actually exploring this far into my computer.

— Shubham`,

    'random_thoughts.txt': `RANDOM THOUGHTS:

- If you can't explain a bug simply, you haven't stared at it long enough.
- Tennis and programming have the exact same rhythm: split step, anticipate, commit, follow through.
- Looking at the Himalayan mountains in Nepal makes every code bug feel delightfully small.
- Good design is invisible. Great design makes you smile.`,

    'late_night_ideas.txt': `LATE NIGHT IDEAS & EXPERIMENTS:

1. Real-time tennis line-call vision app so weekend players stop arguing over in/out calls.
2. Smart camera for community food fridges (ReFoodify 2.0).
3. An RC car with FPV camera driving around Kathmandu while I sit at my desk.
4. Build a portfolio that feels like an authentic personal computer. (Status: Completed!)`,

    'things_i_should_have_done.txt': `THINGS I SHOULD HAVE DONE:

- Slept earlier before that Softwarica hackathon.
- Written clean documentation before pushing to main at 3 AM.
- Stretched properly before playing 3 hours of tennis yesterday.
- But honestly... no regrets. Everything was a learning loop.`
};

function openRecycleBin() {
    retroAudio.playClick();
    openWindow('window-recycle');
}

function openRecycleFile(filename) {
    retroAudio.playClick();
    const content = recycleFiles[filename] || 'File is empty.';
    const notepad = document.getElementById('window-notepad');
    if (notepad) {
        const titleEl = notepad.querySelector('.title-bar-text');
        if (titleEl) titleEl.textContent = `${filename} - Notepad`;
        const textarea = notepad.querySelector('.notepad-textarea');
        if (textarea) textarea.value = content;
        openWindow('window-notepad');
    }
}

function openConfirmDeleteDialog() {
    retroAudio.playClick();
    openWindow('dialog-confirm-delete');
}

function executeEmptyRecycleBin() {
    retroAudio.playClick();
    closeWindow('dialog-confirm-delete');

    const tbody = document.getElementById('recycle-bin-tbody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #777; padding: 30px; font-style: italic;">The Recycle Bin is empty.</td></tr>`;
    }

    // Update desktop recycle bin icon to empty
    const desktopRecycleImg = document.getElementById('desktop-recycle-icon');
    if (desktopRecycleImg) {
        desktopRecycleImg.src = 'src/icons/xp_32.png';
    }

    // Update Recycle Bin window titlebar icon
    const recycleWin = document.getElementById('window-recycle');
    if (recycleWin) {
        const titleIcon = recycleWin.querySelector('.title-bar-icon');
        if (titleIcon) titleIcon.src = 'src/icons/xp_32.png';
        const sbPanels = recycleWin.querySelectorAll('.xp-sb-panel');
        if (sbPanels.length >= 2) {
            sbPanels[0].textContent = '0 objects';
            sbPanels[1].textContent = '0 bytes';
        }
    }

    retroAudio.playChime();
    showSystemMessage({
        title: 'Recycle Bin',
        icon: 'src/icons/xp_32.png',
        message: '<strong>Recycle Bin emptied.</strong><br><br>Don\'t worry — important memories have already been backed up to the cloud.',
        btnText: 'OK'
    });
}

function restoreRecycleBinItems() {
    retroAudio.playClick();
    const tbody = document.getElementById('recycle-bin-tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr onclick="openRecycleFile('everything I didn\\'t say.txt')">
                <td style="display: flex; align-items: center; gap: 6px;">
                    <img src="src/icons/xp_152.png" width="16" height="16" alt="">
                    <strong>everything I didn't say.txt</strong>
                </td>
                <td>C:\\SHUBHAM\\Personal</td>
                <td>Yesterday</td>
                <td>Text Document</td>
                <td>2 KB</td>
            </tr>
            <tr onclick="openRecycleFile('old_portfolio.txt')">
                <td style="display: flex; align-items: center; gap: 6px;">
                    <img src="src/icons/xp_152.png" width="16" height="16" alt="">
                    <strong>old_portfolio.txt</strong>
                </td>
                <td>C:\\SHUBHAM\\Projects</td>
                <td>3 days ago</td>
                <td>Text Document</td>
                <td>1 KB</td>
            </tr>
            <tr onclick="openRecycleFile('unfinished_ideas.txt')">
                <td style="display: flex; align-items: center; gap: 6px;">
                    <img src="src/icons/xp_152.png" width="16" height="16" alt="">
                    <strong>unfinished_ideas.txt</strong>
                </td>
                <td>C:\\SHUBHAM\\Drafts</td>
                <td>Last week</td>
                <td>Text Document</td>
                <td>4 KB</td>
            </tr>
            <tr onclick="openRecycleFile('README_old.txt')">
                <td style="display: flex; align-items: center; gap: 6px;">
                    <img src="src/icons/xp_152.png" width="16" height="16" alt="">
                    <strong>README_old.txt</strong>
                </td>
                <td>C:\\SHUBHAM</td>
                <td>Recently</td>
                <td>Text Document</td>
                <td>1 KB</td>
            </tr>
            <tr onclick="showSystemMessage({title:'Recycle Bin Item', icon:'src/icons/msg_warning.png', message:'<strong>deleted_bugs_and_syntax_errors.tmp:</strong><br><br>400+ resolved bugs, race conditions, and runtime errors happily dumped.'})">
                <td style="display: flex; align-items: center; gap: 6px;">
                    <img src="src/icons/xp_47.png" width="16" height="16" alt="">
                    <span>deleted_bugs_and_syntax_errors.tmp</span>
                </td>
                <td>C:\\Code\\Temp</td>
                <td>Earlier today</td>
                <td>TMP File</td>
                <td>42.8 MB</td>
            </tr>
        `;
    }

    const desktopRecycleImg = document.getElementById('desktop-recycle-icon');
    if (desktopRecycleImg) {
        desktopRecycleImg.src = 'src/icons/xp_33.png';
    }

    const recycleWin = document.getElementById('window-recycle');
    if (recycleWin) {
        const titleIcon = recycleWin.querySelector('.title-bar-icon');
        if (titleIcon) titleIcon.src = 'src/icons/xp_33.png';
        const sbPanels = recycleWin.querySelectorAll('.xp-sb-panel');
        if (sbPanels.length >= 2) {
            sbPanels[0].textContent = '5 objects';
            sbPanels[1].textContent = '42.8 MB';
        }
    }

    retroAudio.playChime();
}

// Easter Egg Handlers
function openEasterEggPurrr() {
    retroAudio.playClick();
    openWindow('dialog-purrr');
}

function handlePurrrChoice(choice) {
    retroAudio.playChime();
    closeWindow('dialog-purrr');
    showSystemMessage({
        title: 'Purrr',
        icon: 'src/icons/msg_info.png',
        message: '<strong>Purrr!</strong><br><br>The system detected maximum cat affinity.<br>Your clearance level has been elevated.',
        btnText: 'Meow'
    });
}

function openEasterEggEnd() {
    retroAudio.playClick();
    openWindow('dialog-end');
}

function handleGiveUpAction() {
    retroAudio.playClick();
    closeWindow('dialog-end');
    showSystemMessage({
        title: 'System Message',
        icon: 'src/icons/msg_info.png',
        message: '<strong>Never Give Up!</strong><br><br>Every closed window opens a new browser tab.<br>Keep building and exploring.',
        btnText: 'Resume'
    });
}

function openShutDownDialog() {
    retroAudio.playClick();
    openWindow('dialog-shutdown');
}

function handleShutDownAction(action = 'turnoff') {
    retroAudio.playClick();
    closeWindow('dialog-shutdown');

    if (action === 'standby') {
        const desktop = document.getElementById('desktop');
        if (desktop) {
            desktop.style.filter = 'brightness(0.2)';
            const wakeHandler = () => {
                desktop.style.filter = '';
                window.removeEventListener('click', wakeHandler);
                window.removeEventListener('keydown', wakeHandler);
            };
            setTimeout(() => {
                window.addEventListener('click', wakeHandler);
                window.addEventListener('keydown', wakeHandler);
            }, 300);
        }
    } else if (action === 'turnoff') {
        const overlay = document.createElement('div');
        overlay.id = 'turnoff-screen';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;color:#ff9900;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Tahoma,sans-serif;z-index:99999;cursor:pointer;';
        overlay.innerHTML = `
            <div style="font-size:24px;font-weight:bold;margin-bottom:12px;color:#ff8800;letter-spacing:1px;">It is now safe to turn off your computer.</div>
            <div style="font-size:12px;color:#aaa;margin-top:8px;">(Click anywhere to reboot Shubham OS)</div>
        `;
        overlay.onclick = () => {
            overlay.remove();
            retroAudio.playChime();
        };
        document.body.appendChild(overlay);
    } else if (action === 'restart') {
        window.location.reload();
    }
}

// System Message Dialog Manager
function showSystemMessage({ title, icon, message, btnText = 'OK', onConfirm = null }) {
    const dialog = document.getElementById('dialog-system-msg');
    if (!dialog) return;

    const titleEl = document.getElementById('dialog-system-title-text');
    if (titleEl) titleEl.textContent = title || 'System Message';

    const titleIcon = document.getElementById('dialog-system-icon-title');
    if (titleIcon) titleIcon.src = icon || 'src/icons/msg_info.png';

    const bodyIcon = document.getElementById('dialog-system-icon-body');
    if (bodyIcon) bodyIcon.src = icon || 'src/icons/msg_info.png';

    const msgEl = document.getElementById('dialog-system-msg-text');
    if (msgEl) msgEl.innerHTML = message || '';

    const btn = dialog.querySelector('.xp-dialog-btn-row button');
    if (btn) {
        btn.textContent = btnText;
        btn.onclick = () => {
            retroAudio.playClick();
            closeWindow('dialog-system-msg');
            if (onConfirm) onConfirm();
        };
    }

    openWindow('dialog-system-msg');
}

// ==========================================
// 9. "Who Am I" Tab Switcher
// ==========================================
function switchWhoAmITab(tabId) {
    retroAudio.playClick();
    document.querySelectorAll('.whoami-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.whoami-content-pane').forEach(p => p.classList.add('hidden'));

    const tabEl = document.getElementById(`tab-btn-${tabId}`);
    const paneEl = document.getElementById(`whoami-pane-${tabId}`);

    if (tabEl) tabEl.classList.add('active');
    if (paneEl) paneEl.classList.remove('hidden');
}

// ==========================================
// 10. Sudoku XP Engine & Games
// ==========================================
let sudokuBoard = [];
let sudokuSelectedCell = null;
let sudokuDifficulty = 'easy';
let sudokuTimer = 0;
let sudokuTimerInterval = null;
let sudokuMistakes = 0;
let sudokuIsPaused = false;
let sudokuGameOver = false;

function generateSudokuPuzzle(diff = 'easy') {
    const full = Array(9).fill(0).map(() => Array(9).fill(0));
    solveSudokuGrid(full);

    const puzzle = full.map(row => [...row]);
    let removeCount = 40;
    if (diff === 'medium') removeCount = 48;
    if (diff === 'hard') removeCount = 54;

    let removed = 0;
    while (removed < removeCount) {
        const r = Math.floor(Math.random() * 9);
        const c = Math.floor(Math.random() * 9);
        if (puzzle[r][c] !== 0) {
            puzzle[r][c] = 0;
            removed++;
        }
    }
    return { full, puzzle };
}

function isValidSudokuPlacement(grid, row, col, num) {
    for (let i = 0; i < 9; i++) {
        if (grid[row][i] === num && i !== col) return false;
        if (grid[i][col] === num && i !== row) return false;
    }
    const boxR = Math.floor(row / 3) * 3;
    const boxC = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const curR = boxR + r;
            const curC = boxC + c;
            if (grid[curR][curC] === num && (curR !== row || curC !== col)) return false;
        }
    }
    return true;
}

function solveSudokuGrid(grid) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (grid[r][c] === 0) {
                const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
                for (let num of nums) {
                    if (isValidSudokuPlacement(grid, r, c, num)) {
                        grid[r][c] = num;
                        if (solveSudokuGrid(grid)) return true;
                        grid[r][c] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function initSudoku(difficulty = sudokuDifficulty) {
    sudokuDifficulty = difficulty;
    sudokuMistakes = 0;
    sudokuTimer = 0;
    sudokuIsPaused = false;
    sudokuGameOver = false;
    sudokuSelectedCell = null;

    if (sudokuTimerInterval) clearInterval(sudokuTimerInterval);
    updateSudokuTimerDisplay();
    updateSudokuMistakesDisplay();

    document.querySelectorAll('.sudoku-difficulty-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-diff') === difficulty);
    });

    const pauseOverlay = document.getElementById('sudoku-pause-overlay');
    if (pauseOverlay) pauseOverlay.style.display = 'none';

    const pauseBtn = document.getElementById('sudoku-pause-btn');
    if (pauseBtn) pauseBtn.textContent = 'Pause';

    const { full, puzzle } = generateSudokuPuzzle(difficulty);

    const gridEl = document.getElementById('sudoku-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';
    sudokuBoard = [];

    for (let r = 0; r < 9; r++) {
        sudokuBoard[r] = [];
        for (let c = 0; c < 9; c++) {
            const isClue = puzzle[r][c] !== 0;
            const val = puzzle[r][c];

            const cellEl = document.createElement('div');
            cellEl.className = `sudoku-cell ${isClue ? 'clue' : ''}`;
            cellEl.setAttribute('data-r', r);
            cellEl.setAttribute('data-c', c);
            cellEl.textContent = val !== 0 ? val : '';

            cellEl.addEventListener('click', () => selectSudokuCell(r, c));

            gridEl.appendChild(cellEl);
            sudokuBoard[r][c] = {
                r, c,
                val,
                clue: isClue,
                solution: full[r][c],
                conflict: false,
                el: cellEl
            };
        }
    }

    selectSudokuCell(0, 0);
    startSudokuTimer();
}

function startSudokuTimer() {
    if (sudokuTimerInterval) clearInterval(sudokuTimerInterval);
    sudokuTimerInterval = setInterval(() => {
        if (!sudokuIsPaused && !sudokuGameOver) {
            sudokuTimer++;
            updateSudokuTimerDisplay();
        }
    }, 1000);
}

function updateSudokuTimerDisplay() {
    const el = document.getElementById('sudoku-timer-display');
    if (!el) return;
    const mins = Math.floor(sudokuTimer / 60).toString().padStart(2, '0');
    const secs = (sudokuTimer % 60).toString().padStart(2, '0');
    el.textContent = `${mins}:${secs}`;
}

function updateSudokuMistakesDisplay() {
    const el = document.getElementById('sudoku-mistakes-display');
    if (el) el.textContent = `Mistakes: ${sudokuMistakes}`;
}

function selectSudokuCell(r, c) {
    if (sudokuGameOver || sudokuIsPaused) return;
    sudokuSelectedCell = { r, c };

    document.querySelectorAll('.sudoku-cell').forEach(cell => {
        cell.classList.remove('selected', 'related', 'same-number');
    });

    const activeCell = sudokuBoard[r][c];
    if (!activeCell) return;
    activeCell.el.classList.add('selected');

    const activeVal = activeCell.val;
    const boxR = Math.floor(r / 3) * 3;
    const boxC = Math.floor(c / 3) * 3;

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const item = sudokuBoard[row][col];
            const isRow = row === r;
            const isCol = col === c;
            const isBox = (Math.floor(row / 3) * 3 === boxR) && (Math.floor(col / 3) * 3 === boxC);

            if ((isRow || isCol || isBox) && !(isRow && isCol)) {
                item.el.classList.add('related');
            }

            if (activeVal !== 0 && item.val === activeVal && !(isRow && isCol)) {
                item.el.classList.add('same-number');
            }
        }
    }
}

function inputSudokuNumber(num) {
    if (sudokuGameOver || sudokuIsPaused || !sudokuSelectedCell) return;
    const { r, c } = sudokuSelectedCell;
    const cell = sudokuBoard[r][c];

    if (cell.clue) return;

    if (num === 0) {
        cell.val = 0;
        cell.el.textContent = '';
        cell.el.classList.remove('conflict', 'user-filled');
        retroAudio.playClick();
        validateAllSudokuConflicts();
        selectSudokuCell(r, c);
        return;
    }

    cell.val = num;
    cell.el.textContent = num;
    cell.el.classList.add('user-filled');

    const raw = sudokuBoard.map(row => row.map(c => c.val));
    const isConflict = !isValidSudokuPlacement(raw, r, c, num);
    const isWrong = num !== cell.solution;

    if (isConflict || isWrong) {
        cell.el.classList.add('conflict');
        sudokuMistakes++;
        updateSudokuMistakesDisplay();
        retroAudio.playErrorChord();
    } else {
        cell.el.classList.remove('conflict');
        retroAudio.playClick();
    }

    validateAllSudokuConflicts();
    selectSudokuCell(r, c);
    checkSudokuWin();
}

function validateAllSudokuConflicts() {
    const raw = sudokuBoard.map(row => row.map(c => c.val));
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = sudokuBoard[r][c];
            if (cell.val !== 0 && !cell.clue) {
                const hasConflict = !isValidSudokuPlacement(raw, r, c, cell.val);
                cell.el.classList.toggle('conflict', hasConflict || cell.val !== cell.solution);
            }
        }
    }
}

function checkSudokuWin() {
    let allFilled = true;
    let allCorrect = true;

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = sudokuBoard[r][c];
            if (cell.val === 0) allFilled = false;
            if (cell.val !== cell.solution) allCorrect = false;
        }
    }

    if (allFilled && allCorrect) {
        sudokuGameOver = true;
        if (sudokuTimerInterval) clearInterval(sudokuTimerInterval);
        retroAudio.playChime();

        const mins = Math.floor(sudokuTimer / 60);
        const secs = sudokuTimer % 60;
        const timeStr = `${mins}m ${secs}s`;

        showSystemMessage({
            title: 'Sudoku.exe — Puzzle Solved!',
            icon: 'https://win98icons.alexmeub.com/icons/png/game_solitaire-1.png',
            message: `<strong>Congratulations!</strong><br><br>You completed the <strong>${sudokuDifficulty.toUpperCase()}</strong> Sudoku puzzle!<br>Time: <strong>${timeStr}</strong><br>Mistakes: <strong>${sudokuMistakes}</strong>`,
            btnText: 'Play Again',
            onConfirm: () => initSudoku(sudokuDifficulty)
        });
    }
}

function toggleSudokuPause() {
    sudokuIsPaused = !sudokuIsPaused;
    const overlay = document.getElementById('sudoku-pause-overlay');
    const pauseBtn = document.getElementById('sudoku-pause-btn');

    if (overlay) overlay.style.display = sudokuIsPaused ? 'flex' : 'none';
    if (pauseBtn) pauseBtn.textContent = sudokuIsPaused ? 'Resume' : 'Pause';
    retroAudio.playClick();
}

function resetSudokuGame() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = sudokuBoard[r][c];
            if (!cell.clue) {
                cell.val = 0;
                cell.el.textContent = '';
                cell.el.classList.remove('conflict', 'user-filled');
            }
        }
    }
    sudokuMistakes = 0;
    updateSudokuMistakesDisplay();
    selectSudokuCell(0, 0);
    retroAudio.playClick();
}

// Games Folder README
const gamesReadmeText = `Sudoku.exe

A small break from looking at portfolios.

Difficulty: You decide.
Objective: Fill the grid.
Excuse for procrastination: Approved.

Rules:
- Each row must contain digits 1 through 9.
- Each column must contain digits 1 through 9.
- Each of the nine 3x3 subgrids must contain digits 1 through 9.

Keyboard shortcuts:
- Use 1-9 on keyboard to fill numbers.
- Use Backspace or Delete to clear.
- Use Arrow keys (↑, ↓, ←, →) to move around the grid.

Enjoy!
— Shubham Khanal`;

function openGamesReadme() {
    retroAudio.playClick();
    const notepad = document.getElementById('window-notepad');
    if (notepad) {
        notepad.querySelector('.title-bar-text').textContent = 'README.txt - Notepad';
        notepad.querySelector('.notepad-textarea').value = gamesReadmeText;
        openWindow('window-notepad');
    }
}

// Ideas & Selected Technical Essays
const ideasEssayTexts = {
    'prompt_vs_context': {
        title: 'Prompt Engineering vs. Context Engineering.txt - Notepad',
        body: `PROMPT ENGINEERING VS. CONTEXT ENGINEERING
By Shubham Khanal · 2026

There is a growing realization among software engineers working with LLMs:
Prompt engineering (tweaking adjectives, begging the model, adding 'think step-by-step') has reached diminishing returns.

The real leverage is in Context Engineering:
1. Retrieval Quality: Providing precise, non-redundant semantic slices rather than dumping entire documents.
2. Structured Information Flow: Designing strict JSON schemas, deterministic validation layers, and resilient tool-call contracts.
3. State & Working Memory: Managing short-term turn buffers vs long-term distilled knowledge.
4. Evaluation-Driven Development: Benchmarking system outputs against real-world test cases instead of subjective vibing.

When building AI systems—whether for analyzing tennis stroke mechanics or processing medical assistance campaigns—reliability comes from the system around the model, not the cleverness of the prompt.`
    },
    'sports_ai': {
        title: 'Democratizing AI for Grassroots Sports.txt - Notepad',
        body: `DEMOCRATIZING AI FOR GRASSROOTS SPORTS
By Shubham Khanal · 2026

Having played competitive soft tennis across Nepal and represented our country at the Under-15 Junior World Championships in Korea, I have seen the massive gap between professional athletic training and grassroots reality.

In world-class tournaments, multi-million dollar optical tracking setups (like Hawkeye) map every millisecond of ball flight and joint velocity.
In local courts in Dang or Kathmandu, young athletes have to rely purely on instinct and subjective feedback.

My research into single-camera computer vision using YOLOv8 and pose estimation asks a simple question:
Can a regular smartphone camera placed on a tripod behind the baseline deliver actionable stroke analytics?
- Tracking ball bounce landing coordinates
- Evaluating player split-step reaction timing
- Measuring court coverage and unforced error patterns

Technology should not be a privilege of well-funded academies. Democratizing computer vision brings elite feedback to any kid with a racket and a dream.`
    },
    'products_with_soul': {
        title: 'Why Software Needs Character.txt - Notepad',
        body: `WHY SOFTWARE NEEDS CHARACTER
By Shubham Khanal · 2026

Open ten SaaS websites today.
You will see the same purple-to-indigo gradient, the same bento grid, the same geometric sans-serif font, and the same sterile tone of voice.

They are functional. But they lack soul.

When you boot an old operating system like Windows XP, there is an undeniable sense of personality.
The satisfying click of a beveled button.
The green start button that invites interaction.
The sound of an error chord that makes you smile instead of panicking.
The discovery of a hidden file in the recycle bin.

I believe software is an extension of human expression. When we build tools that feel alive, interactive, and slightly surprising, we remind the user that on the other side of the glass, there was a human being who cared about what they were making.`
    }
};

function openIdeaNote(key) {
    retroAudio.playClick();
    const data = ideasEssayTexts[key];
    if (!data) return;
    const notepad = document.getElementById('window-notepad');
    if (notepad) {
        notepad.querySelector('.title-bar-text').textContent = data.title;
        notepad.querySelector('.notepad-textarea').value = data.body;
        openWindow('window-notepad');
    }
}



// ==========================================
// 11. Tray Balloon Tip & Notifications
// ==========================================
function setupTrayBalloonTip() {
    setTimeout(() => {
        const balloon = document.getElementById('xp-balloon-tip');
        if (balloon && !document.querySelector('.window.focused')) {
            balloon.style.display = 'block';
            retroAudio.playChime();
        }
    }, 22000);
}

function closeBalloonTip() {
    const balloon = document.getElementById('xp-balloon-tip');
    if (balloon) balloon.style.display = 'none';
}

function viewBalloonIdea() {
    closeBalloonTip();
    openRecycleFile('late_night_ideas.txt');
}

// ==========================================
// 12. Windows Media Player (Visualizer & Ambient)
// ==========================================
let visualizerInterval = null;

function setupMediaPlayer() {
    const playBtn = document.getElementById('wmp-play-btn');
    const bars = document.querySelectorAll('.wmp-bar');

    if (playBtn) {
        playBtn.addEventListener('click', () => {
            const isPlaying = retroAudio.toggleAmbient();
            playBtn.textContent = isPlaying ? '⏸' : '▶';

            if (isPlaying) {
                if (visualizerInterval) clearInterval(visualizerInterval);
                visualizerInterval = setInterval(() => {
                    bars.forEach(bar => {
                        const h = Math.floor(Math.random() * 45) + 8;
                        bar.style.height = `${h}px`;
                    });
                }, 100);
            } else {
                if (visualizerInterval) clearInterval(visualizerInterval);
                bars.forEach(b => b.style.height = '10px');
            }
        });
    }

    const wmpVol = document.getElementById('wmp-volume-slider');
    if (wmpVol) {
        wmpVol.addEventListener('input', (e) => {
            retroAudio.setVolume(parseFloat(e.target.value));
        });
    }

    const traySound = document.getElementById('tray-sound');
    const trayVolPopup = document.getElementById('tray-volume-popup');
    const traySlider = document.getElementById('tray-volume-slider');

    if (traySound && trayVolPopup) {
        traySound.addEventListener('click', (e) => {
            e.stopPropagation();
            retroAudio.playClick();
            trayVolPopup.style.display = trayVolPopup.style.display === 'flex' ? 'none' : 'flex';
        });

        window.addEventListener('click', () => {
            trayVolPopup.style.display = 'none';
        });
    }

    if (traySlider) {
        traySlider.addEventListener('input', (e) => {
            retroAudio.setVolume(parseFloat(e.target.value));
            if (wmpVol) wmpVol.value = e.target.value;
        });
    }
}

function selectWmpTrack(trackName) {
    retroAudio.playClick();
    const nowPlaying = document.querySelector('.wmp-now-playing');
    if (nowPlaying) {
        nowPlaying.textContent = `Now Playing: ${trackName}`;
    }
    document.querySelectorAll('.wmp-track').forEach(t => t.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// ==========================================
// 13. Interactive Command Prompt (cmd.exe)
// ==========================================
const cmdHistory = [];
let cmdHistoryIndex = -1;

function setupCommandPrompt() {
    const input = document.getElementById('cmd-input-field');
    const output = document.getElementById('cmd-output-area');
    if (!input || !output) return;

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const rawVal = input.value.trim();
            input.value = '';
            if (!rawVal) return;

            cmdHistory.push(rawVal);
            cmdHistoryIndex = cmdHistory.length;

            executeCmdCommand(rawVal, output);
        } else if (e.key === 'ArrowUp') {
            if (cmdHistory.length > 0 && cmdHistoryIndex > 0) {
                cmdHistoryIndex--;
                input.value = cmdHistory[cmdHistoryIndex];
            }
        } else if (e.key === 'ArrowDown') {
            if (cmdHistoryIndex < cmdHistory.length - 1) {
                cmdHistoryIndex++;
                input.value = cmdHistory[cmdHistoryIndex];
            } else {
                cmdHistoryIndex = cmdHistory.length;
                input.value = '';
            }
        }
    });
}

function executeCmdCommand(cmd, outputEl) {
    const line = document.createElement('div');
    line.innerHTML = `<span style="color:#aaa;">C:\\SHUBHAM&gt;</span> ${escapeHtml(cmd)}`;
    outputEl.appendChild(line);

    const lower = cmd.toLowerCase().trim();
    let responseHtml = '';

    switch (lower) {
        case 'help':
            responseHtml = `
Available commands:
  help         - Display list of commands
  whoami       - Display user bio
  skills       - List programming languages & tools
  projects     - Summary of software projects
  achievements - List national & international sports honors
  cert         - List Dataquest Data Science certifications
  tennis       - Detailed AI Tennis Analysis specs
  hopecare     - Detailed Hope Care full-stack specs
  contact      - How to reach Shubham
  cat read_me_first.txt - Read secret desktop note
  matrix       - Toggle green matrix stream
  date/time    - Output local machine date & time
  easteregg    - Trigger a playful system surprise
  cls / clear  - Clear screen
  exit         - Close command prompt
`;
            break;

        case 'whoami':
            responseHtml = `Shubham Khanal — Full-stack developer, Teaching Assistant at Softwarica College, AI & Data Science explorer, National Soft Tennis Bronze Medalist & creator.`;
            break;

        case 'achievements':
        case 'sports':
            responseHtml = `
NATIONAL & INTERNATIONAL SPORTS HONORS:
1. 3rd Position (Bronze) — 8th National Games (Soft Tennis Doubles, 2019)
2. Under-15 Junior World Soft Tennis Championship (Suncheon, Korea, 2018)
3. 1st Position (Champion/Gold) — NSTA Junior Tournament U-15 Singles (2018)
4. National Selection — 1st Asia Cup / Korea Cup Soft Tennis (Anseong, Korea, 2017)
5. 3rd Position (Bronze) — 7th National Games (Men's Team Event, 2016)
6. Geofest International 2017 (City Montessori School, Lucknow, India)
`;
            break;

        case 'cert':
        case 'certificates':
            responseHtml = `
DATAQUEST & PROFESSIONAL CERTIFICATIONS:
1. Data Scientist in Python Path
2. Data Analysis and Visualization with Python Path
3. Gradient Descent Modeling in Python
4. Introduction to SQL and Databases
5. Querying Databases with SQL and Python
6. Telling Stories Using Data Visualization
`;
            break;

        case 'tennis':
            responseHtml = `
AI TENNIS PERFORMANCE ANALYSIS SYSTEM:
• Architecture: Single Camera -> YOLOv8 Detection -> Pose Estimation -> Kalman Trajectory -> Analytics
• Features: Player tracking, stroke mechanics, ball bounce heatmaps, rally length
• Documentation: docs/tennis_doc.pdf
`;
            break;

        case 'hopecare':
            responseHtml = `
HOPE CARE (VERIFIED MEDICAL ASSISTANCE PLATFORM):
• Stack: React, Node.js, Express, Socket.io, Khalti payment gateway, Docker, NGINX
• Features: JWT auth, verified medical campaigns, live donor notification feed, admin audit
`;
            break;

        case 'skills':
            responseHtml = `
[Full-Stack]: JavaScript, TypeScript, Node.js, Express, React, Vite, REST APIs, Socket.io
[Data & AI]: Python, YOLOv8, OpenCV, Pose Estimation, pandas, NumPy, SQL
[Systems]: Raspberry Pi 4, PWM Hardware Signals, Logitech G29, Linux, Git, Docker
[Design]: Figma, UI/UX Systems, Responsive Web Design
`;
            break;

        case 'projects':
            responseHtml = `
1. AI Tennis Vision (YOLOv8 + Pose Estimation Flagship)
2. Hope Care (Verified Medical Platform with Khalti & Socket.io)
3. Medical Exchange Nepal (Healthcare Network in React + Vite)
4. Aashirbad Care (Core of Impact Winner)
5. Remote RC Car Simulator (Raspberry Pi 4 + Logitech G29)
6. ReFoodify (Surplus Food Redistribution App Concept)
7. Khana Baanam (Recipe Teacher Android App)
8. Online Auction System 2.0 (Java Swing / NetBeans)
`;
            break;

        case 'contact':
            responseHtml = `
Email:    shubhamkhanal593@gmail.com
Phone:    +977-9848962948
LinkedIn: linkedin.com/in/shubhamkhanal
GitHub:   github.com/KhanalShubham
`;
            break;

        case 'cat read_me_first.txt':
            responseHtml = `
Hey.
You weren't supposed to find this.
But since you're here...
I'm someone who likes building things, breaking things, learning things,
and occasionally wondering why I started building them.
Welcome.
`;
            break;

        case 'date':
        case 'time':
            responseHtml = `Current system time: ${new Date().toLocaleString()}`;
            break;

        case 'matrix':
            responseHtml = `Wake up, Neo... The Matrix has you. Follow the white rabbit. 🐇`;
            triggerDesktopRefresh();
            break;

        case 'easteregg':
            showSystemMessage({
                title: 'Easter Egg Discovered',
                icon: 'https://win98icons.alexmeub.com/icons/png/game_solitaire-1.png',
                message: '<strong>Console Hacker Badge Unlocked!</strong><br><br>Command executed with style.',
                btnText: 'Sweet'
            });
            responseHtml = `Easter egg executed.`;
            break;

        case 'clear':
        case 'cls':
            outputEl.innerHTML = `
<div>Microsoft Windows XP [Version 5.1.2600]</div>
<div>(C) Copyright 1985-2001 Microsoft Corp.</div>
<br>
`;
            return;

        case 'exit':
            closeWindow('window-cmd');
            return;

        default:
            responseHtml = `'${escapeHtml(cmd)}' is not recognized as an internal or external command. Type 'help' for available commands.`;
    }

    const resDiv = document.createElement('div');
    resDiv.style.whiteSpace = 'pre-wrap';
    resDiv.style.color = '#38bdf8';
    resDiv.style.marginBottom = '8px';
    resDiv.innerHTML = responseHtml;
    outputEl.appendChild(resDiv);

    outputEl.scrollTop = outputEl.scrollHeight;
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ==========================================
// 14. Outlook Express Contact Form
// ==========================================
function setupOutlookForm() {
    const form = document.getElementById('outlook-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        retroAudio.playChime();

        const from = form.querySelector('[name="from"]')?.value || 'Friend';
        const subject = form.querySelector('[name="subject"]')?.value || 'Hello from Portfolio';
        const body = form.querySelector('[name="body"]')?.value || '';

        showSystemMessage({
            title: 'Outlook Express',
            icon: 'https://win98icons.alexmeub.com/icons/png/outlook_express-5.png',
            message: '<strong>Message queued!</strong><br><br>Outlook Express would be proud.<br>Opening your default mail client now...',
            btnText: 'Open Email',
            onConfirm: () => {
                const mailtoUrl = `mailto:shubhamkhanal593@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`From: ${from}\n\n${body}`)}`;
                window.location.href = mailtoUrl;
            }
        });
    });
}

// ==========================================
// 15. Display Properties (Themes & Wallpaper)
// ==========================================
const WALLPAPER_KEY = 'shubham_os_wallpaper';

function changeTheme(themeName) {
    retroAudio.playClick();
    document.body.className = '';
    if (themeName !== 'bliss') {
        document.body.classList.add(`theme-${themeName}`);
    }
    localStorage.setItem(WALLPAPER_KEY, themeName);
}

function loadSavedWallpaper() {
    const saved = localStorage.getItem(WALLPAPER_KEY) || 'bliss';
    if (saved !== 'bliss') {
        document.body.classList.add(`theme-${saved}`);
    }
    const radio = document.querySelector(`input[name="xp-theme"][value="${saved}"]`);
    if (radio) radio.checked = true;
}

// ==========================================
// 16. Windows Picture and Fax Viewer (shimgvw.dll)
// ==========================================
let faxViewerImages = [];
let faxViewerCurrentIndex = 0;
let faxViewerZoom = 1;
let faxViewerRotation = 0;

function openPictureViewer(source, title = 'Windows Picture and Fax Viewer') {
    retroAudio.playClick();
    if (Array.isArray(source)) {
        faxViewerImages = source;
        faxViewerCurrentIndex = 0;
    } else {
        faxViewerImages = [source];
        faxViewerCurrentIndex = 0;
    }

    const titleEl = document.getElementById('fax-viewer-title');
    if (titleEl) {
        const cleanName = title || faxViewerImages[0].split('/').pop();
        titleEl.textContent = `${cleanName} - Windows Picture and Fax Viewer`;
    }

    faxViewerZoom = 1;
    faxViewerRotation = 0;
    updateFaxViewerDisplay();
    openWindow('window-fax-viewer');
}

function updateFaxViewerDisplay() {
    const imgEl = document.getElementById('fax-viewer-image');
    const dimEl = document.getElementById('fax-viewer-sb-dim');
    const zoomEl = document.getElementById('fax-viewer-sb-zoom');

    if (!imgEl || faxViewerImages.length === 0) return;

    imgEl.src = faxViewerImages[faxViewerCurrentIndex];
    imgEl.style.transform = `scale(${faxViewerZoom}) rotate(${faxViewerRotation}deg)`;

    imgEl.onload = () => {
        if (dimEl) dimEl.textContent = `${imgEl.naturalWidth} x ${imgEl.naturalHeight} pixels · ${faxViewerCurrentIndex + 1} of ${faxViewerImages.length}`;
        if (zoomEl) zoomEl.textContent = `${Math.round(faxViewerZoom * 100)}%`;
    };
}

function faxViewerNext() {
    retroAudio.playClick();
    if (faxViewerImages.length > 1) {
        faxViewerCurrentIndex = (faxViewerCurrentIndex + 1) % faxViewerImages.length;
        faxViewerRotation = 0;
        updateFaxViewerDisplay();
    }
}

function faxViewerPrev() {
    retroAudio.playClick();
    if (faxViewerImages.length > 1) {
        faxViewerCurrentIndex = (faxViewerCurrentIndex - 1 + faxViewerImages.length) % faxViewerImages.length;
        faxViewerRotation = 0;
        updateFaxViewerDisplay();
    }
}

function faxViewerZoomIn() {
    retroAudio.playClick();
    faxViewerZoom = Math.min(3, faxViewerZoom + 0.25);
    updateFaxViewerDisplay();
}

function faxViewerZoomOut() {
    retroAudio.playClick();
    faxViewerZoom = Math.max(0.25, faxViewerZoom - 0.25);
    updateFaxViewerDisplay();
}

function faxViewerZoomActual() {
    retroAudio.playClick();
    faxViewerZoom = 1;
    updateFaxViewerDisplay();
}

function faxViewerZoomBestFit() {
    retroAudio.playClick();
    faxViewerZoom = 1;
    faxViewerRotation = 0;
    updateFaxViewerDisplay();
}

function faxViewerRotateLeft() {
    retroAudio.playClick();
    faxViewerRotation = (faxViewerRotation - 90) % 360;
    updateFaxViewerDisplay();
}

function faxViewerRotateRight() {
    retroAudio.playClick();
    faxViewerRotation = (faxViewerRotation + 90) % 360;
    updateFaxViewerDisplay();
}

function faxViewerPrint() {
    retroAudio.playClick();
    const curImg = faxViewerImages[faxViewerCurrentIndex];
    if (curImg) {
        const win = window.open(curImg, '_blank');
        if (win) win.focus();
    }
}

// Redirect generic lightbox calls to authentic Picture and Fax Viewer
function openLightbox(source, index = 0) {
    if (Array.isArray(source)) {
        openPictureViewer(source, 'Photo Gallery');
        if (index > 0 && index < source.length) {
            faxViewerCurrentIndex = index;
            updateFaxViewerDisplay();
        }
    } else {
        openPictureViewer(source);
    }
}

function closeLightbox() {
    closeWindow('window-fax-viewer');
}

function setupLightbox() {
    document.querySelectorAll('.gallery-item img').forEach(img => {
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            const parentGrid = img.closest('.gallery-grid');
            if (parentGrid) {
                const allImgs = Array.from(parentGrid.querySelectorAll('img')).map(i => i.src);
                const clickedIdx = allImgs.indexOf(img.src);
                openPictureViewer(allImgs, 'Gallery');
                if (clickedIdx >= 0) {
                    faxViewerCurrentIndex = clickedIdx;
                    updateFaxViewerDisplay();
                }
            } else {
                openPictureViewer(img.src);
            }
        });
    });
}

// ==========================================
// 16b. MS Paint Engine (mspaint.exe)
// ==========================================
let paintCurrentTool = 'pencil';
let paintFgColor = '#000000';
let paintBgColor = '#ffffff';
let paintIsDrawing = false;
let paintLastX = 0;
let paintLastY = 0;
let paintUndoHistory = [];

const XP_PALETTE_COLORS = [
    '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#8000ff', '#804000',
    '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040'
];

function setupPaint() {
    const canvas = document.getElementById('paint-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Fill initial canvas with white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    savePaintState();

    // Populate 28 colors
    const swatchContainer = document.getElementById('paint-swatches-grid');
    if (swatchContainer) {
        swatchContainer.innerHTML = '';
        XP_PALETTE_COLORS.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'paint-swatch';
            swatch.style.background = color;
            swatch.title = color;

            swatch.addEventListener('click', (e) => {
                e.preventDefault();
                paintFgColor = color;
                const fgEl = document.getElementById('paint-active-fg');
                if (fgEl) fgEl.style.background = color;
            });

            swatch.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                paintBgColor = color;
                const bgEl = document.getElementById('paint-active-bg');
                if (bgEl) bgEl.style.background = color;
            });

            swatchContainer.appendChild(swatch);
        });
    }

    // Toolbox events
    document.querySelectorAll('.paint-tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.paint-tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            paintCurrentTool = btn.getAttribute('data-tool');
            const toolSb = document.getElementById('paint-status-tool');
            if (toolSb) toolSb.textContent = `Tool: ${paintCurrentTool.charAt(0).toUpperCase() + paintCurrentTool.slice(1)}`;
        });
    });

    // Canvas drawing events
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 2 && paintCurrentTool === 'fill') {
            e.preventDefault();
            fillCanvasColor(paintBgColor);
            return;
        }
        paintIsDrawing = true;
        const rect = canvas.getBoundingClientRect();
        paintLastX = e.clientX - rect.left;
        paintLastY = e.clientY - rect.top;

        if (paintCurrentTool === 'fill') {
            fillCanvasColor(paintFgColor);
            paintIsDrawing = false;
        } else if (paintCurrentTool === 'picker') {
            const pixel = ctx.getImageData(paintLastX, paintLastY, 1, 1).data;
            const hex = "#" + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1);
            paintFgColor = hex;
            const fgEl = document.getElementById('paint-active-fg');
            if (fgEl) fgEl.style.background = hex;
            paintIsDrawing = false;
        } else if (paintCurrentTool === 'pencil' || paintCurrentTool === 'brush' || paintCurrentTool === 'eraser') {
            drawPaintStroke(paintLastX, paintLastY, paintLastX, paintLastY);
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const curX = Math.round(e.clientX - rect.left);
        const curY = Math.round(e.clientY - rect.top);

        const coordsEl = document.getElementById('paint-status-coords');
        if (coordsEl) coordsEl.textContent = `${curX}, ${curY}px`;

        if (!paintIsDrawing) return;

        if (paintCurrentTool === 'pencil' || paintCurrentTool === 'brush' || paintCurrentTool === 'eraser' || paintCurrentTool === 'airbrush') {
            drawPaintStroke(paintLastX, paintLastY, curX, curY);
            paintLastX = curX;
            paintLastY = curY;
        }
    });

    const endDrawing = () => {
        if (paintIsDrawing) {
            paintIsDrawing = false;
            savePaintState();
        }
    };

    canvas.addEventListener('mouseup', endDrawing);
    canvas.addEventListener('mouseleave', endDrawing);
}

function savePaintState() {
    const canvas = document.getElementById('paint-canvas');
    if (!canvas) return;
    if (paintUndoHistory.length > 10) paintUndoHistory.shift();
    paintUndoHistory.push(canvas.toDataURL());
}

function undoPaint() {
    if (paintUndoHistory.length > 1) {
        paintUndoHistory.pop(); // current
        const prevState = paintUndoHistory[paintUndoHistory.length - 1];
        const canvas = document.getElementById('paint-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = prevState;
    }
}

function drawPaintStroke(fromX, fromY, toX, toY) {
    const canvas = document.getElementById('paint-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);

    if (paintCurrentTool === 'pencil') {
        ctx.strokeStyle = paintFgColor;
        ctx.lineWidth = 1;
        ctx.lineCap = 'square';
    } else if (paintCurrentTool === 'brush') {
        ctx.strokeStyle = paintFgColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
    } else if (paintCurrentTool === 'eraser') {
        ctx.strokeStyle = paintBgColor;
        ctx.lineWidth = 12;
        ctx.lineCap = 'square';
    } else if (paintCurrentTool === 'airbrush') {
        ctx.fillStyle = paintFgColor;
        for (let i = 0; i < 15; i++) {
            const rad = Math.random() * 8;
            const angle = Math.random() * Math.PI * 2;
            ctx.fillRect(toX + rad * Math.cos(angle), toY + rad * Math.sin(angle), 1, 1);
        }
        return;
    }

    ctx.stroke();
}

function fillCanvasColor(color) {
    const canvas = document.getElementById('paint-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    savePaintState();
}

function clearPaintCanvas() {
    retroAudio.playClick();
    fillCanvasColor('#ffffff');
}

function downloadPaintDrawing() {
    retroAudio.playChime();
    const canvas = document.getElementById('paint-canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = 'shubham_drawing.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
}

function invertPaintColors() {
    retroAudio.playClick();
    const canvas = document.getElementById('paint-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
        d[i] = 255 - d[i];
        d[i + 1] = 255 - d[i + 1];
        d[i + 2] = 255 - d[i + 2];
    }
    ctx.putImageData(imgData, 0, 0);
    savePaintState();
}

// ==========================================
// 16c. Project Explorer Selection & Details
// ==========================================
let currentSelectedProjectKey = 'tennis';

const projectData = {
    'tennis': {
        title: 'AI Tennis Vision',
        subtitle: 'Flagship Sports Analytics System',
        icon: 'src/icons/camera_vid.png',
        tech: 'Python, Ultralytics YOLOv8, OpenCV, NumPy',
        desc: 'End-to-end grassroots sports analytics system. Tracks player movement, pose estimation, racket positioning, ball trajectory, shot placement, and rally analytics using low-cost single camera setups.',
        status: 'Research & Live Demo Ready',
        gallery: ['src/Tennis_analysis/423432432423.png', 'src/Tennis_analysis/45674389240324.png'],
        report: 'docs/tennis_doc.pdf'
    },
    'hopecare': {
        title: 'Hope Care',
        subtitle: 'Full-Stack Medical & Emergency Funding System',
        icon: 'src/icons/xp_4.png',
        tech: 'React, Node.js, Express, Socket.io, Khalti Wallet, Docker, NGINX',
        desc: 'Verified healthcare emergency funding and medical assistance platform. Features JWT authentication, Socket.io live donor notification feeds, Khalti payments, admin verification dashboards, and Dockerized production deployment.',
        status: 'Production Architecture',
        arch: 'Full-Stack REST + Socket.io'
    },
    'medexchange': {
        title: 'Medical Exchange Nepal',
        subtitle: 'Clinical Elective & Healthcare Network',
        icon: 'src/icons/ie.png',
        tech: 'React, TypeScript, Vite, TailwindCSS, Framer Motion',
        desc: 'Healthcare network connecting international medical students with hospitals for clinical electives, hospital matching, medical tourism, and wellness journeys across Nepal.',
        status: 'Web Platform'
    },
    'rccar': {
        title: 'RC Car Simulator',
        subtitle: 'Autonomous Driving Hardware Simulator',
        icon: 'src/icons/joystick.png',
        tech: 'Raspberry Pi 4, Logitech G29 Wheel & Pedals, PWM, Python',
        desc: 'Realistic remote driving simulator controlled with Logitech G29 steering wheel and pedals with PWM hardware signal translation. Showcased at SOFTWARICA TECH X ELEVATE.',
        status: 'Hardware System',
        gallery: ['src/RC_car/a.png', 'src/RC_car/f.png', 'src/RC_car/k.png', 'src/RC_car/s.png', 'src/RC_car/11212121.png'],
        report: 'docs/rc_car_doc.pdf'
    },
    'aashirbad': {
        title: 'Aashirbad Care',
        subtitle: 'Code for Impact Winner Platform',
        icon: 'src/icons/xp_4.png',
        tech: 'Community Healthcare, Patient Management',
        desc: 'Recognized as Core of Impact Winner in the Code for Impact program. Focused on compassionate elder healthcare access and patient appointment orchestration.',
        status: 'Award Winner'
    },
    'refoodify': {
        title: 'ReFoodify',
        subtitle: 'Food Redistribution Platform Architecture',
        icon: 'src/icons/paint.png',
        tech: 'Figma UI/UX, Mobile Architecture, Design System',
        desc: 'Concept platform to eliminate food waste by linking restaurants and donors with surplus food to NGOs and local communities across Nepal.',
        status: 'Design Spec Ready',
        gallery: 'src/ReFoodify/refoodify.png',
        report: 'docs/refoodify_doc.pdf'
    },
    'khanabaanam': {
        title: 'Khana Baanam',
        subtitle: 'Native Android Recipe App',
        icon: 'src/icons/xp_4.png',
        tech: 'Kotlin, SQLite, Android Studio',
        desc: 'Interactive recipe discovery app with step-by-step cooking timers, ingredient proportion calculators, and an admin upload console.',
        status: 'Mobile Application'
    },
    'auction': {
        title: 'Auction System 2.0',
        subtitle: 'Multi-User Bidding Software',
        icon: 'src/icons/xp_4.png',
        tech: 'Java Swing, Multithreading, Socket Sync',
        desc: 'Multi-user bidding platform featuring live bidding countdowns, automatic winner assignment, client financial ledger, and analytics.',
        status: 'Desktop Application'
    },
    'doc_tennis': {
        title: 'tennis_doc.pdf',
        subtitle: 'Technical Research Paper',
        icon: 'src/icons/xp_152.png',
        tech: 'YOLOv8 & Computer Vision in Soft Tennis',
        desc: '2,450 KB technical report documenting camera calibration, player pose estimation, and ball bounce detection algorithms.',
        status: 'Verified PDF Document',
        report: 'docs/tennis_doc.pdf'
    },
    'doc_rccar': {
        title: 'rc_car_doc.pdf',
        subtitle: 'Hardware Schematics & Wiring',
        icon: 'src/icons/xp_152.png',
        tech: 'Raspberry Pi 4 & Logitech G29 Integration',
        desc: '457 KB engineering documentation covering circuit schematics, motor controller drivers, and low-latency serial signals.',
        status: 'Verified PDF Document',
        report: 'docs/rc_car_doc.pdf'
    },
    'doc_refoodify': {
        title: 'refoodify_doc.pdf',
        subtitle: 'UX Design System Spec',
        icon: 'src/icons/xp_152.png',
        tech: 'Information Architecture & NGO Logistics',
        desc: '2,140 KB specification analyzing surplus food logistics, donor verification protocols, and delivery routing.',
        status: 'Verified PDF Document',
        report: 'docs/refoodify_doc.pdf'
    }
};

function selectProject(key) {
    retroAudio.playClick();
    currentSelectedProjectKey = key;

    // Highlight clicked tile
    document.querySelectorAll('#window-projects .xp-list-item').forEach(item => {
        item.classList.remove('selected');
    });
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('selected');
    }

    const data = projectData[key];
    const detailsPane = document.getElementById('project-details-pane');
    if (detailsPane && data) {
        detailsPane.innerHTML = `
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
                <img src="${data.icon}" width="32" height="32" alt="">
                <div>
                    <strong style="font-size: 11.5px; color: #0c327d; display: block;">${data.title}</strong>
                    <span style="font-size: 10px; color: #555;">${data.subtitle}</span>
                </div>
            </div>
            <div style="font-size: 10.5px; line-height: 1.4; color: #222; margin-bottom: 8px;">
                ${data.desc}
            </div>
            <div style="font-size: 10px; color: #444; border-top: 1px solid #c0d4f6; padding-top: 6px;">
                <strong>Stack:</strong> ${data.tech}<br>
                <strong>Status:</strong> ${data.status}
            </div>
        `;
    }
}

function openSelectedProjectAction(action) {
    retroAudio.playClick();
    const data = projectData[currentSelectedProjectKey] || projectData['tennis'];

    if (action === 'gallery') {
        if (data.gallery) {
            openPictureViewer(data.gallery, `${data.title} Gallery`);
        } else {
            showSystemMessage({
                title: data.title,
                icon: data.icon,
                message: `<strong>${data.title}</strong><br><br>${data.desc}`
            });
        }
    } else if (action === 'report') {
        if (data.report) {
            openPdf(data.report);
        } else {
            showSystemMessage({
                title: data.title,
                icon: data.icon,
                message: `<strong>${data.title} Documentation:</strong><br><br>${data.desc}<br><br>Stack: ${data.tech}`
            });
        }
    } else if (action === 'arch') {
        showSystemMessage({
            title: `${data.title} — Architecture`,
            icon: data.icon,
            message: `<strong>${data.title} Technical Architecture:</strong><br><br>${data.desc}<br><br><strong>Technologies:</strong> ${data.tech}<br><strong>Deployment:</strong> ${data.status}`
        });
    } else if (action === 'demo') {
        if (data.report) {
            openPdf(data.report);
        } else {
            showSystemMessage({
                title: `${data.title} Demo`,
                icon: data.icon,
                message: `<strong>${data.title}:</strong><br><br>${data.desc}<br><br>Contact Shubham for live demo session access.`
            });
        }
    }
}

function openPdf(path) {
    retroAudio.playClick();
    window.open(path, '_blank');
}

function showPersonalSection(secId) {
    retroAudio.playClick();
    document.querySelectorAll('.personal-section').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(secId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.folder-tree-item').forEach(el => el.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// ==========================================
// 17. Keyboard Shortcuts & Konami Code
// ==========================================
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;

function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // Sudoku Keyboard Interaction
        const sudokuWin = document.getElementById('window-sudoku');
        const isSudokuFocused = sudokuWin && sudokuWin.classList.contains('focused') && !sudokuWin.classList.contains('minimized');

        if (isSudokuFocused && sudokuSelectedCell) {
            const { r, c } = sudokuSelectedCell;
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectSudokuCell(Math.max(0, r - 1), c);
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectSudokuCell(Math.min(8, r + 1), c);
                return;
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                selectSudokuCell(r, Math.max(0, c - 1));
                return;
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                selectSudokuCell(r, Math.min(8, c + 1));
                return;
            }
            if (e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                inputSudokuNumber(parseInt(e.key, 10));
                return;
            }
            if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
                e.preventDefault();
                inputSudokuNumber(0);
                return;
            }
        }

        if (e.key === 'Escape') {
            const lightbox = document.getElementById('lightbox');
            if (lightbox && !lightbox.classList.contains('hidden')) {
                closeLightbox();
                return;
            }
            const focused = document.querySelector('.window.focused');
            if (focused) {
                closeWindow(focused.id);
            }
            return;
        }

        if (e.key.toLowerCase() === konamiCode[konamiIndex].toLowerCase()) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                konamiIndex = 0;
                retroAudio.playChime();
                showSystemMessage({
                    title: 'Developer Mode Activated',
                    icon: 'https://win98icons.alexmeub.com/icons/png/game_solitaire-1.png',
                    message: '<strong>You found the secret!</strong><br><br>🏆 Achievement unlocked:<br><em>"Actually explored the website"</em>',
                    btnText: 'Claim Glory'
                });
            }
        } else {
            konamiIndex = 0;
        }

        const k = e.key.toUpperCase();
        if (k === 'P') openWindow('window-profile');
        if (k === 'R' || k === 'J') openWindow('window-projects');
        if (k === 'C') openWindow('window-contact');
        if (k === 'M') openWindow('window-media');
        if (k === 'S') openWindow('window-sudoku');
        if (k === 'H' || k === 'D') {
            document.querySelectorAll('.window').forEach(w => minimizeWindow(w.id));
        }
    });
}

// ==========================================
// 18. Tooltip System (Playful XP Yellow Speech)
// ==========================================
function setupTooltips() {
    let tooltipEl = document.getElementById('xp-tooltip');
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'xp-tooltip';
        tooltipEl.className = 'xp-tooltip';
        document.body.appendChild(tooltipEl);
    }

    document.querySelectorAll('[data-tooltip]').forEach(el => {
        el.addEventListener('mouseenter', () => {
            const text = el.getAttribute('data-tooltip');
            if (!text) return;
            tooltipEl.textContent = text;
            tooltipEl.style.display = 'block';

            const rect = el.getBoundingClientRect();
            tooltipEl.style.left = `${rect.left + rect.width / 2}px`;
            tooltipEl.style.top = `${rect.top - 24}px`;
        });

        el.addEventListener('mouseleave', () => {
            tooltipEl.style.display = 'none';
        });
    });
}

// ==========================================
// 19. Boot & DOM Initialization
// ==========================================
function dismissBootScreen() {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
            retroAudio.playChime();
        }, 350);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Clock Update
    function updateClock() {
        const now = new Date();
        let hh = now.getHours();
        const mm = now.getMinutes().toString().padStart(2, '0');
        const ampm = hh >= 12 ? 'PM' : 'AM';
        hh = hh % 12;
        hh = hh ? hh : 12;

        const timeStr = `${hh}:${mm} ${ampm}`;
        const clockEl = document.getElementById('clock');
        const taskbarClock = document.getElementById('taskbar-clock');
        if (clockEl) clockEl.textContent = timeStr;
        if (taskbarClock) taskbarClock.textContent = timeStr;
    }
    updateClock();
    setInterval(updateClock, 15000);

    // 2. Initialize subsystems
    setupDraggableWindows();
    setupDraggableIcons();
    setupDesktopSelectionBox();
    setupDesktopContextMenu();
    setupMediaPlayer();
    setupCommandPrompt();
    setupOutlookForm();
    setupLightbox();
    setupKeyboardShortcuts();
    setupTooltips();
    setupTrayBalloonTip();
    loadSavedWallpaper();
    initSudoku('easy');
    setupPaint();
    selectProject('tennis');

    // 3. Register default open window in taskbar
    if (document.getElementById('window-profile')) {
        openWindowsMap.set('window-profile', {
            title: 'About Shubham Khanal',
            icon: 'src/icons/user_computer.png',
            isMinimized: false
        });
        updateTaskbarTabs();
    }

    // 4. URL Hash Navigation
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        if (hash === 'projects') openWindow('window-projects');
        else if (hash === 'personal') openWindow('window-personal');
        else if (hash === 'contact') openWindow('window-contact');
        else if (hash === 'media') openWindow('window-media');
        else if (hash === 'cmd') openWindow('window-cmd');
        else if (hash === 'sudoku') openWindow('window-sudoku');
        else if (hash === 'achievements') openWindow('window-achievements');
        else if (hash === 'certificates') openWindow('window-certificates');
        else if (hash === 'ideas') openWindow('window-ideas');
        else if (hash === 'journey') { openWindow('window-profile'); switchWhoAmITab('journey'); }
        else if (hash === 'career') { openWindow('window-profile'); switchWhoAmITab('career'); }
    }
});
