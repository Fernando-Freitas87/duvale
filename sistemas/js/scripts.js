// Função global para formatação de campos
function aplicarMascara(valor, mascara) {
    let i = 0;
    return mascara.replace(/#/g, () => valor[i++] || "");
}

// Adicionar máscara a CPF
document.querySelectorAll(".cpf").forEach((campo) => {
    campo.addEventListener("input", (e) => {
        e.target.value = aplicarMascara(e.target.value.replace(/\D/g, ""), "###.###.###-##");
    });
});

 //Adicionar máscara ao CPF na tela de login
document.getElementById("cpf").addEventListener("input", (e) => {
    e.target.value = aplicarMascara(e.target.value.replace(/\D/g, ""), "###.###.###-##");
});

// Adicionar máscara a telefone
document.querySelectorAll(".telefone").forEach((campo) => {
    campo.addEventListener("input", (e) => {
        e.target.value = aplicarMascara(e.target.value.replace(/\D/g, ""), "(##) #####-####");
    });
});

// Função para processar o login
document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const cpf = document.getElementById("cpf").value.replace(/\D/g, ""); // Remove caracteres não numéricos
    const senha = document.getElementById("password").value;
  
    try {
        const response = await fetch("http://localhost:3000/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ cpf, senha }),
          });
  
      const data = await response.json();
  
      if (response.ok) {
        localStorage.setItem("authToken", data.token); // Armazena o token no localStorage
        window.location.href = "gerenciar-clientes.html"; // Redireciona ao gerenciador de clientes
      } else {
        document.getElementById("error-message").textContent = data.error; // Exibe mensagem de erro
      }
    } catch (error) {
      document.getElementById("error-message").textContent = "Erro ao fazer login!";
    }
  });
