window.onload = () => {
    // Quitar la pausa inicial de las flores
    document.body.classList.remove("container");
    // Iniciar el efecto de luciérnagas
    createFireflies();
};

function createFireflies() {
    const container = document.getElementById('fireflies-container');
    if (!container) return;

    const numFireflies = 35;
    for (let i = 0; i < numFireflies; i++) {
        const firefly = document.createElement('div');
        firefly.classList.add('firefly');
        firefly.style.left = `${Math.random() * 100}vw`;
        firefly.style.top = `${Math.random() * 100}vh`;
        const animationDuration = Math.random() * 6 + 4;
        const animationDelay = Math.random() * 5; 
        firefly.style.animationDuration = `${animationDuration}s`;
        firefly.style.animationDelay = `${animationDelay}s`;
        container.appendChild(firefly);
    }
}

// Lógica de la Tarjeta
const btnAbreme = document.getElementById('btnAbreme');
const modalOverlay = document.getElementById('modalCard');
const closeBtn = document.getElementById('closeBtn');
const cardTextElement = document.querySelector('.card-text');
const closingMessage = document.getElementById('closingMessage');

// Texto original fijo para evitar que se duplique al abrir y cerrar
const originalMessage = "Las flores reales son hermosas, pero se marchitan. Por eso quise darte estas flores digitales, porque al igual que lo que siento por ti, están hechas para durar toda la vida.";

if (btnAbreme && modalOverlay && closeBtn) {
    
    // Abrir tarjeta: Animación palabra por palabra usando el texto base
    btnAbreme.addEventListener('click', () => {
        modalOverlay.classList.add('show');
        cardTextElement.innerHTML = '';
        const words = originalMessage.split(' ');
        
        words.forEach((word, index) => {
            const span = document.createElement('span');
            span.innerHTML = word + '&nbsp;';
            span.style.animation = `fadeInWord 0.4s ease forwards ${index * 0.1}s`;
            cardTextElement.appendChild(span);
        });
    });

    // Cerrar tarjeta: Ocultar y mostrar mensaje final
    function cerrarTarjeta() {
        modalOverlay.classList.remove('show');
        closingMessage.classList.add('show-message');
        
        setTimeout(() => {
            closingMessage.classList.remove('show-message');
        }, 3000);
    }

    closeBtn.addEventListener('click', cerrarTarjeta);
    window.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            cerrarTarjeta();
        }
    });
}