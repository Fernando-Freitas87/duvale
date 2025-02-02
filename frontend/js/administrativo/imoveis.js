// imoveis.js

export async function carregarImoveis() {
  try {
    const response = await fetch("http://localhost:3000/api/imoveis");
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

  document.getElementById("edit-imovel-descricao").value = imovel.descricao || "";
  document.getElementById("edit-imovel-endereco").value = imovel.endereco || "";
  document.getElementById("edit-imovel-status").value = imovel.status || "";

  document.getElementById("btn-salvar-imovel").onclick = () => {
    salvarEdicaoImovel(imovel.id);
  };
  document.getElementById("btn-excluir-imovel").onclick = () => {
    if (!confirm(`Deseja realmente excluir o imóvel ID ${imovel.id}?`)) return;
    excluirImovel(imovel.id);
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

    const response = await fetch(`http://localhost:3000/api/imoveis/${imovelId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao, endereco, status })
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
    const response = await fetch(`http://localhost:3000/api/imoveis/${imovelId}`, {
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
