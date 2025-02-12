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
// 🛠️ Configuração do Modal de Avisos
// ================================

// 🎯 Seleciona os elementos do modal de aviso no DOM
const btnAviso = document.getElementById("btnAviso"); // Botão que abre o modal
const modalAviso = document.getElementById("modalAviso"); // O próprio modal
const closeModalAviso = document.getElementById("closeModalAviso"); // Botão de fechar modal
const iconAviso = document.getElementById("iconAviso"); // Ícone de sino no menu
const indicatorAviso = document.getElementById("indicatorAviso"); // Indicador de novos avisos (bolinha vermelha)
const modalBodyAviso = document.getElementById("modalBodyAviso"); // Área onde os avisos serão inseridos dinamicamente

// 🔍 Verifica se todos os elementos necessários foram encontrados no DOM
if (!btnAviso || !modalAviso || !closeModalAviso || !iconAviso || !indicatorAviso || !modalBodyAviso) {
    console.error("⚠️ Elementos do aviso não encontrados!");
    return; // Interrompe a execução caso algum elemento esteja ausente
}

// 📢 Evento para abrir o modal quando o botão for clicado
btnAviso.addEventListener("click", async () => {
    modalAviso.style.display = "flex"; // Torna o modal visível
    indicatorAviso.classList.remove("show"); // Remove o indicador de novos avisos
    iconAviso.classList.remove("icon-shake"); // Remove a animação de notificação do ícone de sino

    try {
        // 🔄 Chama a função para carregar os avisos da API ou banco de dados
        const avisos = await carregarAvisos();

        // 🧹 Limpa a área do modal antes de adicionar os novos avisos
        modalBodyAviso.innerHTML = "";

        // 📌 Verifica se existem avisos retornados
        if (!avisos || avisos.length === 0) {
            // Se não houver avisos, exibe uma mensagem padrão
            modalBodyAviso.innerHTML = "<p>Nenhum aviso disponível.</p>";
        } else {
            // 📝 Itera sobre os avisos e os adiciona ao modal
            avisos.forEach((aviso) => {
                // 📦 Cria um novo elemento de aviso
                const avisoElement = document.createElement("div");
                avisoElement.classList.add("aviso-item"); // Aplica a classe de estilização

                // 🔹 Define o conteúdo do aviso
                avisoElement.innerHTML = `
                    <p>
                        <strong style="color: red; text-transform: uppercase;">
                            ${aviso.aviso || "Sem detalhes disponíveis."} <!-- Título do aviso -->
                        </strong> 
                        ${aviso.imovel_descricao || "Imóvel não identificado"}, <!-- Descrição do imóvel -->
                        ${aviso.imovel_endereco || "Endereço não informado"} <!-- Endereço do imóvel -->
                    </p>
                `;

                // 📌 Adiciona o aviso ao corpo do modal
                modalBodyAviso.appendChild(avisoElement);
            });
        }
    } catch (error) {
        // ❌ Caso ocorra um erro ao carregar os avisos, exibe uma mensagem de erro
        console.error("🚨 Erro ao carregar avisos:", error);
        modalBodyAviso.innerHTML = `
            <p style="color: red;">Erro ao carregar avisos. Tente novamente mais tarde.</p>
        `;
    }
});

// ❌ Evento para fechar o modal ao clicar no botão "X"
closeModalAviso.addEventListener("click", () => {
    modalAviso.style.display = "none"; // Esconde o modal
});

// 🖱️ Evento para fechar o modal ao clicar fora dele
window.addEventListener("click", (event) => {
    if (event.target === modalAviso) { // Verifica se o clique foi fora da área do modal
        modalAviso.style.display = "none"; // Fecha o modal
    }
});

// 🔔 Simulação de chegada de novos avisos (após 2 segundos)
setTimeout(() => {
    indicatorAviso.classList.add("show"); // Exibe o indicador de novos avisos
    iconAviso.classList.add("icon-shake"); // Adiciona animação ao ícone de sino
}, 2000);
});