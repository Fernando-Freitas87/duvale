USE topogeo;

-- Inserir usuários iniciais
INSERT INTO usuarios (name, email, pin)
VALUES
('Fernando Freitas', 'fernando@email.com', '123456'),
('Paloma Silva', 'paloma@email.com', '654321');

-- Inserir serviços de exemplo
INSERT INTO services (name, client_link)
VALUES
('Topografia de Terreno ABC', UUID()),
('Medição de Área XYZ', UUID());

-- Inserir etapas fixas para o serviço 1
INSERT INTO service_steps (service_id, step_name, description, status)
VALUES
(1, 'Agendado', 'Seu serviço está programado para ser realizado conforme a data e hora acordadas.', 'Pending'),
(1, 'Medido', 'Nossos profissionais estão no local realizando as medições necessárias para o seu projeto.', 'Pending'),
(1, 'Processado', 'Os dados coletados estão sendo processados e organizados para a próxima fase.', 'Pending'),
(1, 'Confecção', 'Estamos trabalhando na criação dos documentos e materiais necessários com base nas medições realizadas.', 'Pending'),
(1, 'Impresso', 'Os documentos e relatórios foram impressos e estão prontos para a próxima etapa.', 'Pending'),
(1, 'Concluído', 'O seu serviço de topografia foi concluído com sucesso.', 'Pending'),
(1, 'Em rota de entrega', 'Seu pedido está a caminho do local de entrega ou retirada.', 'Pending'),
(1, 'Em local de retirada', 'Se preferir, seu pedido está disponível para retirada no local indicado.', 'Pending'),
(1, 'Entrega finalizada', 'Seu serviço foi entregue com sucesso, concluindo o processo.', 'Pending');

-- Inserir etapas fixas para o serviço 2
INSERT INTO service_steps (service_id, step_name, description, status)
VALUES
(2, 'Agendado', 'Seu serviço está programado para ser realizado conforme a data e hora acordadas.', 'Pending'),
(2, 'Medido', 'Nossos profissionais estão no local realizando as medições necessárias para o seu projeto.', 'Pending'),
(2, 'Processado', 'Os dados coletados estão sendo processados e organizados para a próxima fase.', 'Pending'),
(2, 'Confecção', 'Estamos trabalhando na criação dos documentos e materiais necessários com base nas medições realizadas.', 'Pending'),
(2, 'Impresso', 'Os documentos e relatórios foram impressos e estão prontos para a próxima etapa.', 'Pending'),
(2, 'Concluído', 'O seu serviço de topografia foi concluído com sucesso.', 'Pending'),
(2, 'Em rota de entrega', 'Seu pedido está a caminho do local de entrega ou retirada.', 'Pending'),
(2, 'Em local de retirada', 'Se preferir, seu pedido está disponível para retirada no local indicado.', 'Pending'),
(2, 'Entrega finalizada', 'Seu serviço foi entregue com sucesso, concluindo o processo.', 'Pending');
