import uuid  # Importação para gerar UUID
from flask import Flask, request, jsonify, send_file, make_response
from flask_cors import CORS
import requests
import qrcode
from datetime import datetime
import io
import os
import mysql.connector.pooling  # Adicionada a importação para conexão otimizada
from dotenv import load_dotenv
import base64  # Adicionar essa importação


# Carregar variáveis de ambiente
load_dotenv()

app = Flask(__name__)

# ✅ CORS configurado corretamente
CORS(app)

MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN")

# ✅ Configuração do banco de dados MySQL
db_config = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME")
}

# ✅ Criando um pool de conexões para melhor performance
pool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="mypool", pool_size=10, **db_config
)


def obter_conexao():
    """ Obtém uma conexão do pool de conexões """
    try:
        return pool.get_connection()
    except mysql.connector.Error as e:
        print(f"❌ Erro ao conectar ao banco de dados: {e}")
        return None

# ------------------ ROTA PARA ENVIO DE MENSAGEM VIA WHATSAPP ------------------ #


# ------------------ ROTA PARA GERAR QR CODE PIX (MERCADO PAGO) ------------------ #

@app.route('/gerar-qrcode', methods=['OPTIONS', 'POST'])
def gerar_qrcode():
    if request.method == 'OPTIONS':
        return make_response("", 200)

    dados = request.json
    valor = dados.get("valor")
    descricao = dados.get("descricao", "Pagamento aluguel vence hoje!")

    if not valor:
        return jsonify({"erro": "Valor é obrigatório"}), 400

    url = "https://api.mercadopago.com/v1/payments"

    headers = {
        "Authorization": f"Bearer {MP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
        "X-Idempotency-Key": str(uuid.uuid4())  # Evita duplicações
    }

    payload = {
        "transaction_amount": float(valor),
        "description": descricao,
        "payment_method_id": "pix",
        "payer": {
            "email": "grupoesilveira@gmail.com",
            "identification": {
                "type": "CPF",
                "number": "01973165309"  # CPF válido sem pontos e traços
            }
        },
        "external_reference": "pedido123",
        "notification_url": "https://setta.dev.br/notificacao-pagamento"
    }

    print("📌 Enviando payload para Mercado Pago:", payload)

    try:
        response = requests.post(url, headers=headers, json=payload)
        print("📌 Resposta Mercado Pago:", response.status_code, response.text)

        response.raise_for_status()
        response_json = response.json()

        qr_data = response_json.get("point_of_interaction", {}).get(
            "transaction_data", {}).get("qr_code", "")
        payment_id = response_json.get("id")  # ID do pagamento gerado

        if not qr_data or not payment_id:
            print("❌ Erro: Falha ao obter QR Code do Mercado Pago.")
            return jsonify({"erro": "Falha ao gerar QR Code"}), 400

        return jsonify({"qr_code": qr_data, "payment_id": payment_id})

    except requests.exceptions.RequestException as e:
        print(f"❌ Erro ao gerar QR Code: {str(e)}")
        return jsonify({"erro": str(e)}), 400


# ------------------ ROTA PARA VERIFICAR QR CODE PIX FOI PAGO (MERCADO PAGO) ------------------ #

@app.route('/verificar-pagamento/<payment_id>', methods=['GET'])
def verificar_pagamento(payment_id):
    """Consulta o status do pagamento via API do Mercado Pago."""

    url = f"https://api.mercadopago.com/v1/payments/{payment_id}"
    headers = {"Authorization": f"Bearer {MP_ACCESS_TOKEN}"}

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        pagamento = response.json()

        status = pagamento.get("status", "unknown")  # Status do pagamento
        valor_pago = pagamento.get(
            "transaction_amount", 0)  # Valor da transação
        # PIX, cartão, etc.
        metodo_pagamento = pagamento.get("payment_method_id", "desconhecido")
        data_pagamento = pagamento.get(
            "date_approved", "pendente")  # Data de aprovação

        print(f"📌 Status do pagamento {payment_id}: {status}")

        return jsonify({
            "status": status,
            "valor_pago": valor_pago,
            "metodo_pagamento": metodo_pagamento,
            "data_pagamento": data_pagamento
        })

    except requests.exceptions.RequestException as e:
        return jsonify({"erro": "Erro ao consultar pagamento", "detalhe": str(e)}), 400


# ------------------ NOTIFICA O PAGAMENTO DO QRCODE  ------------------ #

@app.route('/notificacao-pagamento', methods=['POST'])
def notificacao_pagamento():
    """Recebe notificações do Mercado Pago e atualiza status do pagamento."""

    dados = request.json
    # Log completo da notificação recebida
    print("📌 Notificação recebida:", dados)

    # ✅ Valida se há um ID do pagamento na notificação
    payment_id = dados.get("data", {}).get("id")
    if not payment_id:
        print("❌ Erro: ID do pagamento não encontrado na notificação recebida.")
        return jsonify({"erro": "ID de pagamento não encontrado"}), 400

    # 🔍 Faz a consulta ao Mercado Pago para verificar o status do pagamento
    url = f"https://api.mercadopago.com/v1/payments/{payment_id}"
    headers = {"Authorization": f"Bearer {MP_ACCESS_TOKEN}"}

    try:
        response = requests.get(url, headers=headers)

        # ✅ Verifica se a resposta foi bem-sucedida antes de tentar ler os dados
        if response.status_code != 200:
            print(
                f"❌ Erro ao consultar pagamento. Código HTTP: {response.status_code}")
            return jsonify({"erro": "Falha ao consultar pagamento", "status_code": response.status_code}), 400

        pagamento = response.json()

        # ✅ Extrai os dados do pagamento
        status = pagamento.get("status", "desconhecido")
        valor_pago = pagamento.get("transaction_amount", 0)
        metodo_pagamento = pagamento.get("payment_method_id", "desconhecido")
        data_pagamento = pagamento.get("date_approved", "pendente")

        print(f"✅ Pagamento atualizado - ID: {payment_id} | Status: {status}")

        # 🔔 Envia a atualização para o frontend
        return jsonify({
            "status": status,
            "valor_pago": valor_pago,
            "metodo_pagamento": metodo_pagamento,
            "data_pagamento": data_pagamento
        })

    except requests.exceptions.ConnectionError:
        print("❌ Erro: Falha na conexão com a API do Mercado Pago.")
        return jsonify({"erro": "Falha na conexão com Mercado Pago"}), 500

    except requests.exceptions.Timeout:
        print("❌ Erro: A solicitação para Mercado Pago expirou.")
        return jsonify({"erro": "Timeout na requisição para Mercado Pago"}), 500

    except requests.exceptions.RequestException as e:
        print(f"❌ Erro inesperado ao consultar pagamento: {str(e)}")
        return jsonify({"erro": "Erro inesperado ao consultar pagamento", "detalhe": str(e)}), 500


# ------------------ APAGA O QRCODE APOS PAGAMENTO ------------------ #

@app.route('/invalidar-qrcode/<payment_id>', methods=['DELETE'])
def invalidar_qrcode(payment_id):
    """ Invalida o QR Code associado a um pagamento específico """
    # Aqui você pode adicionar lógica para remover da memória/cache se necessário
    print(f"📌 QR Code do pagamento {payment_id} invalidado.")
    return jsonify({"status": "QR Code invalidado"}), 200


# ------------------ ROTA PARA OBTER DADOS DO CLIENTE ------------------ #

@app.route('/api/cliente/dados', methods=['GET'])
def obter_dados_cliente():
    auth_token = request.headers.get("Authorization")

    if not auth_token:
        return jsonify({"erro": "Token de autenticação ausente"}), 401

    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor(dictionary=True)

        query = "SELECT id, nome, email FROM clientes WHERE token = %s"
        cursor.execute(query, (auth_token,))
        cliente = cursor.fetchone()

        cursor.close()
        conn.close()

        if not cliente:
            return jsonify({"erro": "Cliente não encontrado"}), 404

        return jsonify(cliente)

    except mysql.connector.Error as e:
        return jsonify({"erro": "Erro no banco de dados", "detalhe": str(e)}), 500
    finally:
        if conn:
            conn.close()

# ------------------ FUNÇÕES AUXILIARES ------------------ #


@app.after_request
def after_request(response):
    """ ✅ Ajusta cabeçalhos CORS corretamente, evitando duplicações """
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
    return response


# ------------------ EXECUTAR APP ------------------ #
if __name__ == '__main__':
    # Usa a porta definida pelo ambiente ou 5000 como fallback
    port = int(os.environ.get("PORT", 5000))
    # Permite conexões externas, essencial para hospedagem
    app.run(host="0.0.0.0", port=port)
