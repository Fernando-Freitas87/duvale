// dashboard.js

import { carregarUsuario, configurarLogout } from "./auth.js";
import { carregarAvisos } from "./mensalidades.js"; // se avisos ficar em mensalidades, por exemplo
import { carregarImoveis } from "./imoveis.js";
import { carregarClientes, carregarContratos } from "./clientesContratos.js";
import { carregarResumo, carregarEmAtraso, carregarAVencer } from "./mensalidades.js"; 

// Adicione carregarEmAtraso e carregarAVencer se estiverem no mesmo módulo que carregarResumo.

document.addEventListener("DOMContentLoaded", async () => {
  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "Index.html";
    return;
  }

  // Chama funções de autenticação
  await carregarUsuario();
  configurarLogout();

  // Agora carregamos as principais partes do painel:
  await Promise.all([
    carregarResumo(),           // Resumo dos cards
    carregarAvisos(1, 5, true), // Avisos gerenciais com paginação (page 1, limit 5)
    carregarImoveis(),          // Lista de imóveis
    carregarClientes(),         // Lista de clientes
    carregarContratos(),        // Lista de contratos
  ]);

    // Adicione as chamadas para carregar as tabelas já paginadas
    await carregarEmAtraso(1, 10); // Página 1, limite de 10 itens
    await carregarAVencer(1, 10); // Página 1, limite de 10 itens
  

  // Vincula clique nos cards
  document.getElementById("card-total-em-atraso")?.addEventListener("click", () => exibirSecao("em-atraso-section"));
  document.getElementById("card-a-vencer")?.addEventListener("click", () => exibirSecao("a-vencer-section"));
  document.getElementById("card-imoveis-cadastrados")?.addEventListener("click", () => exibirSecao("gerenciar-imoveis-section"));
  document.getElementById("card-contratos-ativos")?.addEventListener("click", () => exibirSecao("gerenciar-contratos-section", "gerenciar-clientes-section"));
});

/**
 * Exibe as seções passadas no array de argumentos
 * e oculta as demais seções.
 * Destaca o card ativo.
 */
export function exibirSecao(...secoes) {
  const todasSecoes = [
    "em-atraso-section",
    "a-vencer-section",
    "gerenciar-imoveis-section",
    "gerenciar-contratos-section",
    "gerenciar-clientes-section"
  ];
  
  // 1) Oculta todas as seções
  todasSecoes.forEach(secao => {
    const elemento = document.getElementById(secao);
    if (elemento) elemento.style.display = "none";
  });

  // 2) Exibe as seções passadas
  secoes.forEach(secao => {
    const elemento = document.getElementById(secao);
    if (elemento) elemento.style.display = "block";
  });

  // 3) Remove destaque de todos os cards
  const todosOsCards = [
    document.getElementById("card-total-em-atraso"),
    document.getElementById("card-a-vencer"),
    document.getElementById("card-imoveis-cadastrados"),
    document.getElementById("card-contratos-ativos")
  ];
  todosOsCards.forEach(card => {
    if (card) card.classList.remove("card-ativo");
  });



  // 4) Destaca o card certo
  if (secoes.includes("em-atraso-section")) {
    document.getElementById("card-total-em-atraso")?.classList.add("card-ativo");
  }
  if (secoes.includes("a-vencer-section")) {
    document.getElementById("card-a-vencer")?.classList.add("card-ativo");
  }
  if (secoes.includes("gerenciar-imoveis-section")) {
    document.getElementById("card-imoveis-cadastrados")?.classList.add("card-ativo");
  }
  if (secoes.includes("gerenciar-contratos-section")) {
    document.getElementById("card-contratos-ativos")?.classList.add("card-ativo");
  }
}
