// ----------------------------------------------------------------------
// Script para Gerenciamento do Caixa com Modal para Transações
// ----------------------------------------------------------------------
const apiBaseUrl = "https://duvale-production.up.railway.app";
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Recupera o token de autenticação do localStorage
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      alert("Sessão expirada. Faça login novamente.");
      window.location.href = "index.html";
      return;
    }

    // Inicializar o modal e eventos relacionados
    configurarModalTransacao();

    // Carregar saldo e histórico de transações
    await carregarCaixa();
  } catch (error) {
    console.error("Erro ao inicializar o script:", error.message);
  }
});

/**
 * Configura os eventos e controle do modal para registrar transações.
 */
function configurarModalTransacao() {
  const modal = document.getElementById("modalTransacao");
  const closeModal = document.getElementById("closeModal");
  const formTransacao = document.getElementById("formTransacao");

  // Abrir o modal para registrar entrada
  document.getElementById("entrada-caixa").addEventListener("click", () => {
    document.getElementById("modalTitulo").textContent = "Registrar Entrada";
    document.getElementById("tipoTransacao").value = "entrada";
    modal.style.display = "flex";
  });

  // Abrir o modal para registrar saída
  document.getElementById("saida-caixa").addEventListener("click", () => {
    document.getElementById("modalTitulo").textContent = "Registrar Saída";
    document.getElementById("tipoTransacao").value = "saida";
    modal.style.display = "flex";
  });

  // Fechar o modal ao clicar no botão de fechar
  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Fechar o modal ao clicar fora do conteúdo
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Registrar a transação ao enviar o formulário
  formTransacao.addEventListener("submit", async (event) => {
    event.preventDefault();

    const tipo = document.getElementById("tipoTransacao").value;
    const valor = parseFloat(document.getElementById("valorTransacao").value);
    const descricao = document.getElementById("descricaoTransacao").value.trim();
    const usuario = localStorage.getItem("userName");
    const botaoRegistrar = document.querySelector(".btn-submit");

    // Validações básicas
    if (!tipo) {
      alert("Selecione o tipo de transação!");
      return;
    }
    if (!valor || valor <= 0 || isNaN(valor)) {
      alert("Insira um valor válido!");
      return;
    }
    if (!descricao) {
      alert("A descrição não pode estar vazia!");
      return;
    }
    if (!usuario) {
      alert("Usuário não autenticado! Faça login novamente.");
      window.location.href = "index.html";
      return;
    }

    // Desabilita o botão para evitar múltiplos cliques
    botaoRegistrar.disabled = true;
    botaoRegistrar.textContent = "Registrando...";

    try {
      const response = await fetch(`${apiBaseUrl}/api/caixa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, valor, descricao, usuario }),
      });

      if (!response.ok) {
        throw new Error("Erro ao registrar transação.");
      }

      alert("Transação registrada com sucesso!");

      // Fechar modal corretamente
      modal.style.display = "none";

      // Atualiza o saldo e histórico do caixa
      await carregarCaixa();
    } catch (error) {
      console.error("Erro ao registrar transação:", error.message);
      alert("Não foi possível registrar a transação.");
    } finally {
      // Reativa o botão após a requisição
      botaoRegistrar.disabled = false;
      botaoRegistrar.textContent = "Registrar";
    }
  });
}

/**
 * Carrega o saldo atual e as transações do caixa.
 */
async function carregarCaixa() {
  try {
    const response = await fetch(`${apiBaseUrl}/api/caixa`);
    if (!response.ok) throw new Error("Erro ao carregar caixa.");

    const { saldo, transacoes } = await response.json();

    // Atualiza o saldo exibido
    document.getElementById("saldo-atual").textContent = `R$ ${parseFloat(
      saldo
    ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

    // Atualiza a tabela de transações
    const tbody = document.getElementById("transacoes-corpo");
    tbody.innerHTML = "";

    // Verifica se há transações
    if (transacoes.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;">Nenhuma transação encontrada.</td></tr>';
      return;
    }

    // Preenche as transações na tabela
    transacoes.forEach((transacao) => {
      const tr = document.createElement("tr");
      tr.classList.add(
        transacao.tipo === "entrada" ? "linha-entrada" : "linha-saida"
      );
      tr.innerHTML = `
        <td>${new Date(transacao.data).toLocaleDateString("pt-BR")}</td>
        <td>${transacao.tipo}</td>
        <td>R$ ${parseFloat(transacao.valor).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}</td>
        <td>${transacao.descricao}</td>
        <td>${transacao.usuario || "Desconhecido"}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar caixa:", error.message);
  }
}