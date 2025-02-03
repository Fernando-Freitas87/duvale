// imoveis.js
const apiBaseUrl = "https://duvale-production.up.railway.app";

export async function carregarImoveis() {
  try {
    const response = await fetch(`${apiBaseUrl}/api/imoveis`);
    if (!response.ok) {
      throw new Error(`Erro ao buscar imóveis. Status: ${response.status}`);
    }

    const lista = await response.json();
    const tbody = document.getElementById("imoveis-corpo");
    if (!tbody) {
      console.warn('Elemento <tbody> com id="imoveis-corpo" não encontrado no DOM.');
      return;
    }

    tbody.innerHTML = "";
    lista.forEach((imovel) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${imovel.descricao || "Sem descrição"}</td>
        <td>${imovel.endereco || "Endereço não informado"}</td>
        <td>${imovel.status || "Indefinido"}</td>
        <td>${imovel.clienteEnel || "N/A"}</td> <!-- Dados de Cliente ENEL -->
        <td>${imovel.clienteCagece || "N/A"}</td> <!-- Dados de Cliente CAGECE -->
        <td class="coluna-acoes">
          <a href="#" class="btn-icone-excluir" data-id="${imovel.id}" title="Excluir Imóvel">
            <i class="fas fa-trash-alt"></i>
          </a>
          <a href="#" class="btn-icone-editar" data-id="${imovel.id}" title="Editar Imóvel">
            <i class="fas fa-edit"></i>
          </a>
        </td>
      `;

      // Evento para ícone de "Excluir"
      tr.querySelector(".btn-icone-excluir").addEventListener("click", (event) => {
        event.preventDefault();
        const imovelId = event.currentTarget.getAttribute("data-id");
        if (!confirm(`Deseja realmente excluir o imóvel ID ${imovelId}?`)) return;
        excluirImovel(imovelId);
      });

      // Evento para ícone de "Editar"
      tr.querySelector(".btn-icone-editar").addEventListener("click", () => {
        editarImovelModal(imovel);
      });

      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar imóveis:", error);
    alert("Não foi possível carregar a lista de imóveis. Verifique o console.");
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

  // Preencher os novos campos Cliente ENEL e Cliente CAGECE
  if (document.getElementById("edit-imovel-enel")) {
    document.getElementById("edit-imovel-enel").value = imovel.clienteEnel || "";
  }
  if (document.getElementById("edit-imovel-cagece")) {
    document.getElementById("edit-imovel-cagece").value = imovel.clienteCagece || "";
  }

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
    const clienteEnel = document.getElementById("edit-imovel-enel").value; // Novo campo
    const clienteCagece = document.getElementById("edit-imovel-cagece").value; // Novo campo

    const response = await fetch(`${apiBaseUrl}/api/imoveis/${imovelId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao, endereco, status, clienteEnel, clienteCagece })
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
