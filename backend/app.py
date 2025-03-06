from flask import Flask, request, jsonify
import requests
from datetime import datetime, timedelta
import uuid
from config import Config

app = Flask(__name__)

# Simulação de um banco de dados em memória
pagamentos = {}

# ✅ Rota para gerar QR Code PIX


@app.route("/api/gerar-pix", methods=["POST"])
def gerar_qrcode():
    dados = request.json
    valor = dados.get("valor", "0.00")
    descricao = dados.get("descricao", "Pagamento")

    # Criar um ID único para o pagamento
    payment_id = str(uuid.uuid4())

    # Configurar os dados para a API externa (ex: Mercado Pago)
    payload = {
        "transaction_amount": float(valor),
        "description": descricao,
        "payment_method_id": "pix"
    }

    headers = {
        "Authorization": f"Bearer {Config.API_MERCADO_PAGO}",
        "Content-Type": "application/json"
    }

    try:
        # 🔥 Faz a requisição para gerar o QR Code no Mercado Pago
        response = requests.post(
            f"{Config.BASE_URL}/payments", json=payload, headers=headers)
        response_data = response.json()

        if response.status_code != 201:
            return jsonify({"erro": "Erro ao gerar QR Code"}), 400

        # Pegamos os dados importantes da resposta
        qr_code = response_data["point_of_interaction"]["transaction_data"]["qr_code_base64"]
        qr_data = response_data["point_of_interaction"]["transaction_data"]["qr_code"]
        expiracao = datetime.now() + timedelta(minutes=3)

        # Salvar no "banco de dados"
        pagamentos[payment_id] = {
            "qr_code": qr_code,
            "qr_data": qr_data,
            "expiracao": expiracao,
            "status": "pendente"
        }

        return jsonify({"qr_code": qr_code, "qr_data": qr_data, "payment_id": payment_id})

    except Exception as e:
        return jsonify({"erro": f"Erro interno: {str(e)}"}), 500

# ✅ Rota para verificar o status do pagamento


@app.route("/api/status-pagamento/<payment_id>", methods=["GET"])
def verificar_pagamento(payment_id):
    if payment_id not in pagamentos:
        return jsonify({"status": "expirado", "mensagem": "QR Code inválido ou expirado."}), 400

    info = pagamentos[payment_id]

    # Verifica se já expirou
    if datetime.now() > info["expiracao"]:
        pagamentos[payment_id]["status"] = "expirado"
        return jsonify({"status": "expirado", "mensagem": "QR Code expirado."}), 400

    return jsonify({"status": info["status"]})


# ✅ Iniciar o servidor Flask
if __name__ == "__main__":
    app.run(debug=True)
