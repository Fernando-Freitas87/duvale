document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const menu = document.getElementById('menu');
    const menuText = document.querySelectorAll('.menuText');

    // Alterna a exibição do menu ao clicar no botão
    menuBtn.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('open');

        menuText.forEach((text, index) => {
            setTimeout(() => {
                text.classList.toggle('open2', isOpen);
            }, index * 50);
        });
    });

    // Fecha o menu ao clicar fora dele
    document.addEventListener('click', (event) => {
        if (!menu.contains(event.target) && !menuBtn.contains(event.target)) {
            menu.classList.remove('open');
            menuText.forEach((text) => text.classList.remove('open2'));
        }
    });
});