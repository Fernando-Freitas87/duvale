import uuid  # Importação para gerar UUID
from flask import Flask, request, jsonify, send_file, make_response
from flask_cors import CORS
import jwt  # Importação para decodificar JWT
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
    """
    ✅ Rota para gerar um QR Code PIX via Mercado Pago.

    - Método OPTIONS: responde a requisições prévias do CORS.
    - Método POST: processa o pagamento e retorna um QR Code.
    """

    # ✅ Responde a requisições OPTIONS (CORS)
    if request.method == 'OPTIONS':
        return make_response("", 200)

    # 🔍 Obtém os dados enviados pelo frontend
    dados = request.json
    valor = dados.get("valor")  # Valor do pagamento
    descricao = dados.get(
        "descricao", "Pagamento mensalidade")  # Descrição padrão

    # 🚨 Verifica se o valor foi fornecido
    if not valor:
        return jsonify({"erro": "Valor é obrigatório"}), 400

    # 🔑 Obtém o token de autenticação do cliente para validar a identidade
    auth_token = request.headers.get("Authorization")
    if not auth_token:
        return jsonify({"erro": "Token de autenticação ausente"}), 401

    # ✅ Remove o prefixo "Bearer " do token
    token_sem_prefixo = auth_token.replace("Bearer ", "")

    try:
        # 🔍 Decodifica o token JWT para extrair o ID do cliente
        payload = jwt.decode(token_sem_prefixo, os.getenv(
            "JWT_SECRET"), algorithms=["HS256"])
        cliente_id = payload.get("id")

        # 🚨 Verifica se o token é válido
        if not cliente_id:
            return jsonify({"erro": "Token inválido ou expirado"}), 401

        # ✅ Obtém uma conexão com o banco de dados
        conn = obter_conexao()
        if conn is None:
            return jsonify({"erro": "Erro ao conectar ao banco de dados"}), 500

        cursor = conn.cursor(dictionary=True)

        # 🔍 Busca nome e CPF do cliente no banco de dados
        query = "SELECT nome, cpf FROM clientes WHERE id = %s"
        cursor.execute(query, (cliente_id,))
        cliente = cursor.fetchone()

        # 🔒 Fecha o cursor e a conexão com o banco
        cursor.close()
        conn.close()

        # 🚨 Verifica se o cliente foi encontrado
        if not cliente:
            return jsonify({"erro": "Cliente não encontrado"}), 404

        # ✅ Obtém os dados do cliente
        nome_cliente = cliente["nome"]
        cpf_cliente = cliente["cpf"]

        # 🔗 URL da API do Mercado Pago para criar um pagamento PIX
        url = "https://api.mercadopago.com/v1/payments"

        # ✅ Configuração dos headers da requisição
        headers = {
            # Token de autenticação do Mercado Pago
            "Authorization": f"Bearer {MP_ACCESS_TOKEN}",
            "Content-Type": "application/json",
            # Garante que a transação não será duplicada
            "X-Idempotency-Key": str(uuid.uuid4())
        }

        # ✅ Payload com os dados do pagamento a serem enviados para o Mercado Pago
        payload = {
            "transaction_amount": float(valor),  # 💰 Valor do pagamento
            "description": descricao,  # 📄 Descrição da transação
            "payment_method_id": "pix",  # 📌 Método de pagamento (PIX)
            "payer": {
                "first_name": nome_cliente,  # 🏷️ Nome do pagador
                "identification": {
                    "type": "CPF",
                    "number": cpf_cliente  # 📌 CPF do pagador autenticado
                }
            },
            "external_reference": "pedido123",  # 🔗 Referência externa do pagamento
            # 🔔 URL para notificações de pagamento
            "notification_url": "https://setta.dev.br/notificacao-pagamento"
        }

        print("📌 Enviando payload para Mercado Pago:", payload)

        try:
            # 📡 Enviando requisição para o Mercado Pago
            response = requests.post(url, headers=headers, json=payload)

            # 📌 Log da resposta da API do Mercado Pago
            print("📌 Resposta Mercado Pago:",
                  response.status_code, response.text)

            # 🚨 Lança erro caso a resposta não seja bem-sucedida
            response.raise_for_status()
            response_json = response.json()

            # 🔍 Obtém os dados do QR Code e ID do pagamento
            qr_data = response_json.get("point_of_interaction", {}).get(
                "transaction_data", {}).get("qr_code", "")
            payment_id = response_json.get("id")  # ID do pagamento gerado

            # 🚨 Verifica se os dados necessários foram recebidos
            if not qr_data or not payment_id:
                print("❌ Erro: Falha ao obter QR Code do Mercado Pago.")
                return jsonify({"erro": "Falha ao gerar QR Code"}), 400

            # Gerar QR Code e converter para base64
            qr = qrcode.make(qr_data)
            buffer = io.BytesIO()
            qr.save(buffer, format="PNG")
            buffer.seek(0)
            qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

            return jsonify({"qr_code": qr_base64, "payment_id": payment_id, "qr_data": qr_data})

        except requests.exceptions.RequestException as e:
            print(f"❌ Erro ao gerar QR Code: {str(e)}")
            return jsonify({"erro": str(e)}), 400

    except jwt.ExpiredSignatureError:
        return jsonify({"erro": "Token expirado"}), 401

    except jwt.InvalidTokenError:
        return jsonify({"erro": "Token inválido"}), 401

    except mysql.connector.Error as e:
        return jsonify({"erro": "Erro no banco de dados", "detalhe": str(e)}), 500


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

    # ✅ Remove prefixo "Bearer " do token, se presente
    token_sem_prefixo = auth_token.replace("Bearer ", "")

    try:
        # ✅ Decodifica o token JWT para obter o ID do cliente
        payload = jwt.decode(token_sem_prefixo, os.getenv(
            "JWT_SECRET"), algorithms=["HS256"])
        cliente_id = payload.get("id")

        if not cliente_id:
            return jsonify({"erro": "Token inválido ou expirado"}), 401

        conn = obter_conexao()
        if conn is None:
            return jsonify({"erro": "Erro ao conectar ao banco de dados"}), 500

        cursor = conn.cursor(dictionary=True)

        # ✅ Busca nome e CPF do cliente no banco de dados
        query = "SELECT nome, cpf FROM clientes WHERE id = %s"
        cursor.execute(query, (cliente_id,))
        cliente = cursor.fetchone()

        cursor.close()
        conn.close()

        if not cliente:
            return jsonify({"erro": "Cliente não encontrado"}), 404

        nome_cliente = cliente["nome"]
        cpf_cliente = cliente["cpf"]

    except jwt.ExpiredSignatureError:
        return jsonify({"erro": "Token expirado"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"erro": "Token inválido"}), 401
    except mysql.connector.Error as e:
        return jsonify({"erro": "Erro no banco de dados", "detalhe": str(e)}), 500
    finally:
        if conn:
            conn.close()

# ------------------ ROTA PARA OBTER O VALOR DA MENSALIDADE ------------------ #


@app.route('/api/mensalidade', methods=['GET'])
def obter_mensalidade():
    """ Retorna o valor atual da mensalidade """
    try:
        conn = obter_conexao()
        if conn is None:
            return jsonify({"erro": "Erro ao conectar ao banco de dados"}), 500

        cursor = conn.cursor(dictionary=True)

        # 🔍 Busca o valor da mensalidade na tabela de configurações ou define um padrão
        query = "SELECT valor FROM configuracoes WHERE chave = 'mensalidade'"
        cursor.execute(query)
        resultado = cursor.fetchone()

        cursor.close()
        conn.close()

        # Se não houver configuração definida, usa um valor padrão
        valor_mensalidade = resultado["valor"] if resultado else 450.00

        return jsonify({"valor": valor_mensalidade})

    except mysql.connector.Error as e:
        return jsonify({"erro": "Erro no banco de dados", "detalhe": str(e)}), 500


@app.route('/api/cliente/mensalidade', methods=['GET'])
def obter_dados_cliente_e_mensalidade():
    """ Retorna os dados do cliente e o valor da mensalidade """
    auth_token = request.headers.get("Authorization")
    if not auth_token:
        return jsonify({"erro": "Token de autenticação ausente"}), 401

    token_sem_prefixo = auth_token.replace("Bearer ", "")

    try:
        payload = jwt.decode(token_sem_prefixo, os.getenv(
            "JWT_SECRET"), algorithms=["HS256"])
        cliente_id = payload.get("id")
        if not cliente_id:
            return jsonify({"erro": "Token inválido ou expirado"}), 401

        conn = obter_conexao()
        if conn is None:
            return jsonify({"erro": "Erro ao conectar ao banco de dados"}), 500

        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT c.nome, c.cpf, cfg.valor as mensalidade
            FROM clientes c
            LEFT JOIN configuracoes cfg ON cfg.chave = 'mensalidade'
            WHERE c.id = %s
        """
        cursor.execute(query, (cliente_id,))
        cliente = cursor.fetchone()

        cursor.close()
        conn.close()

        if not cliente:
            return jsonify({"erro": "Cliente não encontrado"}), 404

        return jsonify(cliente)

    except jwt.ExpiredSignatureError:
        return jsonify({"erro": "Token expirado"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"erro": "Token inválido"}), 401
    except mysql.connector.Error as e:
        return jsonify({"erro": "Erro no banco de dados", "detalhe": str(e)}), 500

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
