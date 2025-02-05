google.charts.load('current', { packages: ['corechart'] });
google.charts.setOnLoadCallback(drawCharts);

/**
 * Função principal para desenhar os gráficos
 */
function drawCharts() {
    drawInadimplenciaChart();
    drawOcupacaoChart();
}

/**
 * Função para desenhar o gráfico de Inadimplência de Pagamentos
 */
function drawInadimplenciaChart() {
    // Dados fictícios para o gráfico
    const data = google.visualization.arrayToDataTable([
        ['Simestre', 'Atrasados', 'Pago', 'Pendente'],
        ['Janeiro', 300, 500, 200],
        ['Fevereiro', 250, 600, 150],
        ['Março', 350, 550, 250],
        ['Abril', 400, 450, 300],
        ['Maio', 390, 250, 330],
        ['Junho', 420, 350, 290],

    ]);

    // Configurações do gráfico
    const options = {
        title: 'Inadimplência de Pagamentos',
        hAxis: { title: 'Simestre' },
        vAxis: { title: 'Valores' },
        bars: 'vertical',
        colors: ['#e74c3c', '#27ae60', '#f1c40f'], // Vermelho, Verde, Amarelo
        legend: { position: 'top' },
    };

    // Renderiza o gráfico na div correspondente
    const chart = new google.visualization.ColumnChart(document.getElementById('chart-inadimplencia'));
    chart.draw(data, options);
}

/**
 * Função para desenhar o gráfico de Status de Ocupação
 */
function drawOcupacaoChart() {
    // Dados fictícios para o gráfico
    const data = google.visualization.arrayToDataTable([
        ['Simestre', 'Imóveis Alugados', 'Disponíveis', 'Indisponíveis'],
        ['Janeiro', 30, 10, 7],
        ['Fevereiro', 29, 11, 7],
        ['Março', 32, 12, 5],
        ['Abril', 31, 12, 6],
        ['Maio', 29, 13, 7],
        ['Junho', 30, 13, 8],
    ]);

    // Configurações do gráfico
    const options = {
        title: 'Status de Ocupação',
        hAxis: { title: 'Simestre' },
        vAxis: { title: 'Quantidade' },
        bars: 'vertical',
        colors: ['#3498db', '#2ecc71', '#e67e22'], // Azul, Verde, Laranja
        legend: { position: 'top' },
    };

    // Renderiza o gráfico na div correspondente
    const chart = new google.visualization.ColumnChart(document.getElementById('chart-ocupacao'));
    chart.draw(data, options);
}
