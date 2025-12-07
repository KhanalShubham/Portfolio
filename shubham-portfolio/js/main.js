// JS for Vintage XP Portfolio

document.addEventListener("DOMContentLoaded", () => {

    // Splash Screen Logic
    const splash = document.getElementById("splash-screen");
    if (splash) {
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
            }, 500); // fade out duration
        }, 3200); // 3s animation + buffer
    }

    // Clock Logic
    function updateClock() {
        const clockEl = document.getElementById("clock");
        const taskbarClock = document.getElementById("taskbar-clock");
        const now = new Date();
        let hh = now.getHours();
        const mm = now.getMinutes().toString().padStart(2, "0");
        const ampm = hh >= 12 ? 'PM' : 'AM';
        hh = hh % 12;
        hh = hh ? hh : 12; // the hour '0' should be '12'

        const timeStr = `${hh}:${mm} ${ampm}`;

        if (clockEl) clockEl.textContent = timeStr;
        if (taskbarClock) taskbarClock.textContent = timeStr;
    }

    updateClock();
    setInterval(updateClock, 15000);

    // Initialize Lightbox
    setupLightbox();
});

// Window Controls
function openWindow(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove('hidden');
        el.classList.remove('minimized');
        // Bring to front
        document.querySelectorAll('.window').forEach(w => w.style.zIndex = 10);
        el.style.zIndex = 20;
    }
}

function closeWindow(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

function minimizeWindow(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.add('minimized');
    }
}

function maximizeWindow(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.toggle('maximized');
    }
}

// Lightbox Logic
let currentGallery = [];
let currentIndex = 0;

function updateLightboxImage() {
    const lightboxImg = document.getElementById('lightbox-img');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');

    if (lightboxImg && currentGallery.length > 0) {
        lightboxImg.src = currentGallery[currentIndex];
    }

    // Update buttons
    if (prevBtn) prevBtn.style.display = currentGallery.length > 1 ? 'block' : 'none';
    if (nextBtn) nextBtn.style.display = currentGallery.length > 1 ? 'block' : 'none';
}

function openLightbox(source, index = 0) {
    const lightbox = document.getElementById('lightbox');

    if (Array.isArray(source)) {
        currentGallery = source;
        currentIndex = index;
    } else {
        currentGallery = [source];
        currentIndex = 0;
    }

    updateLightboxImage();

    if (lightbox) {
        lightbox.classList.remove('hidden');
    }
}

function nextImage(e) {
    if (e) e.stopPropagation();
    currentIndex = (currentIndex + 1) % currentGallery.length;
    updateLightboxImage();
}

function prevImage(e) {
    if (e) e.stopPropagation();
    currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
    updateLightboxImage();
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) lightbox.classList.add('hidden');
}

function setupLightbox() {
    const images = document.querySelectorAll('.gallery-item img');

    // Bind click to all standard gallery images (for personal.html)
    images.forEach(img => {
        img.addEventListener('click', (e) => {
            openLightbox(e.target.src);
        });
    });

    const lightboxImg = document.getElementById('lightbox-img');
    if (lightboxImg) {
        lightboxImg.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');

    if (prevBtn) prevBtn.addEventListener('click', prevImage);
    if (nextBtn) nextBtn.addEventListener('click', nextImage);
}

// PDF Logic
function openPdf(path) {
    window.open(path, '_blank');
}
