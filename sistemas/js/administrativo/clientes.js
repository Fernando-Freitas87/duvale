const apiBaseUrl = "https://duvale-production.up.railway.app";

async function obterClienteId(token) {
    try {
        const respostaUsuario = await fetch(`${apiBaseUrl}/api/usuario`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!respostaUsuario.ok) throw new Error('Erro ao buscar ID do cliente.');

        const dadosUsuario = await respostaUsuario.json();
        return { id: dadosUsuario.id || null, nome: dadosUsuario.nome || "Usuário" };  // Retorna ID e nome do cliente

    } catch (erro) {
        console.error("Erro ao obter ID do cliente:", erro);
        return { id: null, nome: "Usuário" };
    }
}

async function carregarUsuario() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = 'sistemas/Index.html';
            return;
        }

        const { id: clienteId, nome } = await obterClienteId(token);
        if (!clienteId) {
            console.error("ID do cliente não encontrado.");
            return;
        }

        document.getElementById('user-name').textContent = nome.split(' ').slice(0, 2).join(' ');
        exibirSaudacao(nome);

        const respostaMensalidades = await fetch(`${apiBaseUrl}/api/mensalidades/cliente/${clienteId}/atrasadas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!respostaMensalidades.ok) throw new Error('Falha ao carregar mensalidades atrasadas.');

        const respostaJson = await respostaMensalidades.json();
        const lista = Array.isArray(respostaJson.mensalidades) ? respostaJson.mensalidades.filter(m => m.dias_atraso > 0) : [];

        if (!lista.length) {
            console.warn("⚠️ Nenhuma mensalidade atrasada encontrada.");
        }

        let subtotal = 0;
        let totalCorrigido = 0;
        const datas = [];

        lista.forEach(mensalidade => {
            const valor = parseFloat(mensalidade.valor) || 0;
            const dataVenc = new Date(mensalidade.data_vencimento);
            datas.push(dataVenc);

            subtotal += valor;

            const hoje = new Date();
            const diasAtraso = Math.max(Math.ceil((hoje - dataVenc) / (1000 * 60 * 60 * 24)), 0);

            const { valorTotal } = calcularJurosEMulta(valor, diasAtraso);
            totalCorrigido += valorTotal;
        });

        let referencia = "Nenhuma mensalidade em atraso";
        if (datas.length > 0) {
            datas.sort((a, b) => a - b);
            const inicio = datas[0].toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
            const fim = datas[datas.length - 1].toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
            referencia = inicio === fim ? inicio : `${inicio} até ${fim}`;
        }

        document.getElementById('mes-referencia').textContent = referencia;
        document.getElementById('subtotal').textContent = Math.round(subtotal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        document.getElementById('juros').textContent = Math.round(totalCorrigido - subtotal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        document.getElementById('valor').textContent = Math.round(totalCorrigido).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
        mostrarToast("❌ Não foi possível carregar todos os dados necessários.");
    }
}