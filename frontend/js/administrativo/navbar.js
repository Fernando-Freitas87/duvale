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
        console.error("Menu ou botão de menu não encontrado!");
        return;
    }

    // Alterna a exibição do menu ao clicar no botão
    menuBtn.addEventListener("click", () => {
        const isOpen = menu.classList.toggle("open"); // Alterna a classe "open" no menu

        // Adiciona ou remove a classe "open2" nos textos do menu com atraso animado
        menuText.forEach((text, index) => {
            setTimeout(() => {
                text.classList.toggle("open2", isOpen);
            }, index * 50);
        });
    });

    // Fecha o menu ao clicar fora dele
    document.addEventListener("click", (event) => {
        // Verifica se o clique não foi no menu ou no botão do menu
        if (!menu.contains(event.target) && !menuBtn.contains(event.target)) {
            // Fecha o menu somente se estiver aberto
            if (menu.classList.contains("open")) {
                menu.classList.remove("open");

                // Remove a classe "open2" dos textos do menu
                menuText.forEach((text) => text.classList.remove("open2"));
            }
        }
    });

    // ================================
    // Configuração do Modal de Avisos
    // ================================

    // Seleciona os elementos do modal de aviso
    const btnAviso = document.getElementById("btnAviso"); // Botão que abre o modal de avisos
    const modalAviso = document.getElementById("modalAviso"); // Modal que contém os avisos
    const closeModalAviso = document.getElementById("closeModalAviso"); // Botão para fechar o modal
    const iconAviso = document.getElementById("iconAviso"); // Ícone de aviso no botão
    const indicatorAviso = document.getElementById("indicatorAviso"); // Indicador visual de aviso
    const modalBodyAviso = document.getElementById("modalBodyAviso"); // Corpo do modal onde os avisos serão exibidos

    // Verifica se todos os elementos necessários existem
    if (!btnAviso || !modalAviso || !closeModalAviso || !iconAviso || !indicatorAviso || !modalBodyAviso) {
        console.error("Elementos do aviso não encontrados!"); // Log de erro para elementos ausentes
        return; // Interrompe a execução se os elementos não forem encontrados
    }

    // Evento: Exibe o modal de aviso ao clicar no botão de aviso
    btnAviso.addEventListener("click", async () => {
        modalAviso.style.display = "flex"; // Exibe o modal
        indicatorAviso.classList.remove("show"); // Remove o indicador de aviso visual
        iconAviso.classList.remove("icon-shake"); // Remove a animação do ícone

        try {
            // 🚀 Faz a chamada à API para carregar os avisos
            const avisos = await carregarAvisos();

            // 🔄 Limpa o conteúdo anterior do modal
            modalBodyAviso.innerHTML = "";

            // Valida se os avisos são um array e contém elementos
            if (!Array.isArray(avisos) || avisos.length === 0) {
                modalBodyAviso.innerHTML = "<p>Nada novo por aqui, qualquer coisa te aviso! </p>"; // Exibe mensagem padrão
                return; // Encerra se não houver avisos
            }

            // Itera pelos avisos e os adiciona ao corpo do modal
            avisos.forEach((aviso) => {
                const avisoElement = document.createElement("p"); // Cria um elemento <p> para cada aviso
                avisoElement.innerHTML = `
                    <strong>${aviso.imovel_descricao || "Imóvel não identificado"}:</strong> 
                    ${aviso.aviso || "Sem detalhes disponíveis"}
                `;
                modalBodyAviso.appendChild(avisoElement); // Adiciona o elemento ao modal
            });
        } catch (error) {
            console.error("Erro ao carregar avisos:", error); // Loga o erro no console
            modalBodyAviso.innerHTML = "<p>Erro ao carregar avisos. Tente novamente.</p>"; // Exibe mensagem de erro ao usuário
        }
    });

    // Evento: Fecha o modal ao clicar no botão de fechamento
    closeModalAviso.addEventListener("click", () => {
        modalAviso.style.display = "none"; // Oculta o modal
    });

    // Evento: Fecha o modal ao clicar fora dele
    window.addEventListener("click", (event) => {
        if (event.target === modalAviso) { // Verifica se o clique foi fora do modal
            modalAviso.style.display = "none"; // Oculta o modal
        }
    });
});