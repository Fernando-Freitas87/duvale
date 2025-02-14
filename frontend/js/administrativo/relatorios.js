document.addEventListener("DOMContentLoaded", function () {
    const botoesRelatorio = document.querySelectorAll(".btn-primary");

    botoesRelatorio.forEach(botao => {
        botao.addEventListener("click", function (event) {
            event.preventDefault();
            alert("Em breve, esta funcionalidade estará disponível.");
        });
    });
});