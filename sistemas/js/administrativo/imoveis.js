// imoveis.js
const apiBaseUrl = "https://duvale-production.up.railway.app";
let paginaAtual = 1; // Página inicial
const limitePorPagina = 10; // Quantidade de registros por página

  export async function carregarImoveis(page = 1) {
    try {
        const response = await fetch(`${apiBaseUrl}/api/imoveis?page=${page}&limit=${limitePorPagina}`);
        if (!response.ok) {
            throw new Error(`Erro ao buscar imóveis. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Dados recebidos:", data);

        const { imoveis, total, totalPages } = data;

        if (!Array.isArray(imoveis)) {
            throw new Error("Estrutura inesperada: 'imoveis' não é uma lista.");
        }

        // Atualize a tabela e a paginação
        atualizarTabelaImoveis(imoveis);
        atualizarPaginacao(totalPages);
    } catch (error) {
        console.error("Erro ao carregar imóveis:", error.message || error);
        alert("Erro ao carregar a lista de imóveis. Verifique sua conexão ou tente novamente.");
    }
}

function atualizarTabelaImoveis(imoveis) {
    const tbody = document.getElementById("imoveis-corpo");
    if (!tbody) {
        console.warn("Elemento <tbody> com id='imoveis-corpo' não encontrado.");
        return;
    }

    tbody.innerHTML = ""; // Limpa a tabela antes de atualizar

    imoveis.forEach(imovel => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${imovel.descricao || "Sem descrição"}</td>
            <td>${imovel.endereco || "Endereço não informado"}</td>
            <td>${imovel.enel || "N/A"}</td>
            <td>${imovel.cagece || "N/A"}</td>
            <td>${imovel.tipo || "residencial"}</td>
            <td>${imovel.status || "Indefinido"}</td>
            <td class="coluna-acoes">
                <a href="#" class="btn-icone-excluir" data-id="${imovel.id}" title="Excluir Imóvel">
                    <i class="fas fa-trash-alt"></i>
                </a>
                <a href="#" class="btn-icone-editar" data-id="${imovel.id}" title="Editar Imóvel">
                    <i class="fas fa-edit"></i>
                </a>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Atualiza os botões de paginação
 */
function atualizarPaginacao(totalPages) {
  const paginacaoDiv = document.getElementById("paginacao-imoveis");
  paginacaoDiv.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;
    btn.classList.add("btn-paginacao");
    if (i === paginaAtual) {
      btn.classList.add("active");
    }
    btn.addEventListener("click", () => {
      paginaAtual = i;
      carregarImoveis(paginaAtual);
    });
    paginacaoDiv.appendChild(btn);
  }
}

function editarImovelModal(imovel) {
  const modal = document.getElementById("modal-editar-imovel");
  if (!modal) return;
  modal.style.display = "block";

  // Preencher os campos existentes
  document.getElementById("edit-imovel-descricao").value = imovel.descricao || "";
  document.getElementById("edit-imovel-endereco").value = imovel.endereco || "";
  document.getElementById("edit-imovel-status").value = imovel.status || "";
  document.getElementById("edit-imovel-enel").value = imovel.enel || "";
  document.getElementById("edit-imovel-cagece").value = imovel.cagece || "";
  document.getElementById("edit-imovel-tipo").value = imovel.tipo || "residencial";  

  // Configurar botões de ação
  document.getElementById("btn-salvar-imovel").onclick = () => {
    salvarEdicaoImovel(imovel.id);
  };
  document.getElementById("btn-cancelar-edicao-imovel").onclick = () => {
    modal.style.display = "none";
  };
}

async function salvarEdicaoImovel(imovelId) {
  try {
    const descricao = document.getElementById("edit-imovel-descricao").value;
    const endereco  = document.getElementById("edit-imovel-endereco").value;
    const status    = document.getElementById("edit-imovel-status").value;
    const enel = document.getElementById("edit-imovel-enel").value;
    const cagece = document.getElementById("edit-imovel-cagece").value;
    const tipo = document.getElementById("edit-imovel-tipo").value; // Adicionando o campo tipo

    const response = await fetch(`${apiBaseUrl}/api/imoveis/${imovelId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao, endereco, status, enel, cagece, tipo }) // Incluindo o tipo
    });

    if (!response.ok) {
      throw new Error(`Erro ao editar imóvel. Status: ${response.status}`);
    }

    alert("Imóvel atualizado com sucesso!");
    document.getElementById("modal-editar-imovel").style.display = "none";
    carregarImoveis();

  } catch (error) {
    console.error("Erro ao editar imóvel:", error);
    alert("Não foi possível editar o imóvel. Verifique o console.");
  }
}

async function excluirImovel(imovelId) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/imoveis/${imovelId}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      throw new Error(`Erro ao excluir imóvel. Status: ${response.status}`);
    }

    alert("Imóvel excluído com sucesso!");
    document.getElementById("modal-editar-imovel").style.display = "none";
    carregarImoveis();

  } catch (error) {
    console.error("Erro ao excluir imóvel:", error);
    alert("Não foi possível excluir o imóvel. Verifique o console.");
  }
}
