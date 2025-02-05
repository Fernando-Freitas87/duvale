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
        ['Trimestre', 'Atrasados', 'Pago', 'Pendente'],
        ['Q1', 300, 500, 200],
        ['Q2', 250, 600, 150],
        ['Q3', 350, 550, 250],
        ['Q4', 400, 450, 300],
    ]);

    // Configurações do gráfico
    const options = {
        title: 'Inadimplência de Pagamentos',
        hAxis: { title: 'Trimestre' },
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
        ['Trimestre', 'Imóveis Alugados', 'Disponíveis', 'Indisponíveis'],
        ['Q1', 120, 80, 50],
        ['Q2', 150, 70, 40],
        ['Q3', 130, 90, 30],
        ['Q4', 140, 60, 70],
    ]);

    // Configurações do gráfico
    const options = {
        title: 'Status de Ocupação',
        hAxis: { title: 'Trimestre' },
        vAxis: { title: 'Quantidade' },
        bars: 'vertical',
        colors: ['#3498db', '#2ecc71', '#e67e22'], // Azul, Verde, Laranja
        legend: { position: 'top' },
    };

    // Renderiza o gráfico na div correspondente
    const chart = new google.visualization.ColumnChart(document.getElementById('chart-ocupacao'));
    chart.draw(data, options);
}
