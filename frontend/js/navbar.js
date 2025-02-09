document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const menu = document.getElementById('menu');
    const menuText = document.querySelectorAll('.menuText');

    // Verifica se os elementos existem antes de continuar
    if (!menuBtn || !menu) {
        console.error('Menu ou botão de menu não encontrado!');
        return;
    }

    // Alterna a exibição do menu ao clicar no botão
    menuBtn.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('open');

        // Adiciona ou remove a classe "open2" com atraso animado
        if (isOpen) {
            menuText.forEach((text, index) => {
                setTimeout(() => text.classList.add('open2'), index * 50);
            });
        } else {
            menuText.forEach((text, index) => {
                setTimeout(() => text.classList.remove('open2'), index * 50);
            });
        }
    });

    // Fecha o menu ao clicar fora dele
    document.addEventListener('click', (event) => {
        if (!menu.contains(event.target) && !menuBtn.contains(event.target)) {
            // Fecha o menu somente se ele estiver aberto
            if (menu.classList.contains('open')) {
                menu.classList.remove('open');

                // Remove a classe "open2" de todos os textos
                menuText.forEach((text) => text.classList.remove('open2'));
            }
        }
    });
});