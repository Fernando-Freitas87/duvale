// Importa a função carregarAvisos do mensalidades.js
import { carregarAvisos } from "./mensalidades.js"; // Ajuste o caminho conforme necessário

// Aguarda o carregamento completo do DOM
document.addEventListener("DOMContentLoaded", () => {
    // ================================
    // Configuração do Menu Lateral
    // ================================

    // Seleciona os elementos do menu
    const menuBtn = document.getElementById("menuBtn");
    const menu = document.getElementById("menu");
    const menuText = document.querySelectorAll(".menuText");

    // Verifica se os elementos essenciais existem
    if (!menuBtn || !menu) {
        console.warn("Menu ou botão de menu não encontrado!");
    } else {
        // Alterna a exibição do menu ao clicar no botão
        menuBtn.addEventListener("click", () => {
            const isOpen = menu.classList.toggle("open");
            menuText.forEach((text, index) => {
                setTimeout(() => {
                    text.classList.toggle("open2", isOpen);
                }, index * 50);
            });
        });

        document.addEventListener("click", (event) => {
            if (!menu.contains(event.target) && !menuBtn.contains(event.target)) {
                if (menu.classList.contains("open")) {
                    menu.classList.remove("open");
                    menuText.forEach((text) => text.classList.remove("open2"));
                }
            }
        });
    }

    // ================================
    // Configuração do Modal de Avisos
    // ================================

    // Seleciona apenas os elementos necessários do modal de aviso
    const modalBodyAviso = document.getElementById("modalBodyAviso");
    const modalAviso = document.getElementById("modal-avisos");

    if (!modalAviso || !modalBodyAviso) {
        console.warn("Aviso: Modal de aviso não disponível nesta página.");
    } else {
        // Reutiliza o botão de notificação existente, se presente
        const btnAviso = document.getElementById("notifications-btn") || null;

        if (btnAviso) {
            btnAviso.addEventListener("click", async () => {
                modalAviso.style.display = "flex";

                try {
                    const avisos = await carregarAvisos();
                    modalBodyAviso.innerHTML = avisos.length
                        ? avisos.map(aviso => `
                            <div class="aviso-item p-2 border border-gray-200 dark:border-gray-700 rounded mb-2">
                                <p class="text-sm text-gray-800 dark:text-white">
                                    <strong class="text-red-600 uppercase">${aviso.aviso || "Sem detalhes disponíveis."}</strong><br>
                                    ${aviso.imovel_descricao || "Imóvel não identificado"}, 
                                    ${aviso.imovel_endereco || "Não informado"}
                                </p>
                            </div>`).join("")
                        : "<p>Nenhum aviso disponível.</p>";
                } catch (error) {
                    console.error("Erro ao carregar avisos:", error);
                    modalBodyAviso.innerHTML = `<p style="color: red;">Erro ao carregar avisos. Tente novamente mais tarde.</p>`;
                }
            });
        }

        const closeBtns = modalAviso.querySelectorAll("[onclick*='closeModal']");
        closeBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                modalAviso.style.display = "none";
            });
        });

        window.addEventListener("click", (event) => {
            if (event.target === modalAviso) {
                modalAviso.style.display = "none";
            }
        });
    }
});

