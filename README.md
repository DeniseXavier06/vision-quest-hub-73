# CPA Pulse

Perfeito, Denise! Entendi bem o escopo. Vou estruturar um portal robusto com banco de dados onde:

Cada coordenador/gestor vê e gerencia apenas suas ações

Resultados são visíveis para todos (transparência institucional)

Visualização combina calendário, dashboard com progresso e tabelas detalhadas

Vou criar a estrutura do banco de dados e depois os componentes do portal. Deixe-me desenhar isso:

Tabelas principais que você precisará:

ações_cpa — armazena todas as ações (eixo, meta, descrição, responsável, prazo, status)

cronograma_avaliacoes — datas das avaliações (perfil acadêmico, quantitativa, qualitativa, comunidade externa)

reunioes — agendas com coordenadores e gestores

resultados_avaliacoes — dados das pesquisas e focus groups

usuarios_cpa — coordenadores e gestores com permissões

acompanhamento_ações — histórico de progresso e atualizações

Funcionalidades principais:

Dashboard com barras de progresso por eixo e dimensão

Calendário interativo mostrando prazos e datas de avaliações

Tabela de ações filtrada por responsável (cada um vê suas ações)

Seção de resultados pública (todos veem)

Agenda de reuniões

Sistema de notificações para prazos próximos



Perfeito! Vou criar o protótipo visual e o script SQL para o portal da CPA.

Protótipo Visual (Wireframe)

Script SQL Completo

-- ============================================ -- 1. TABELA DE USUÁRIOS DA CPA -- ============================================ CREATE TABLE IF NOT EXISTS usuarios_cpa ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email VARCHAR(255) UNIQUE NOT NULL, nome VARCHAR(255) NOT NULL, cargo VARCHAR(100), departamento VARCHAR(100), tipo_usuario VARCHAR(50) NOT NULL, -- 'coordenador', 'gestor', 'admin_cpa' ativo BOOLEAN DEFAULT TRUE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() ); -- ============================================ -- 2. TABELA DE EIXOS -- ============================================ CREATE TABLE IF NOT EXISTS eixos_cpa ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome VARCHAR(255) NOT NULL UNIQUE, descricao TEXT, ordem INT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() ); -- ============================================ -- 3. TABELA DE METAS -- ============================================ CREATE TABLE IF NOT EXISTS metas_cpa ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), eixo_id UUID NOT NULL REFERENCES eixos_cpa(id) ON DELETE CASCADE, nome VARCHAR(255) NOT NULL, descricao TEXT, ordem INT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() ); -- ============================================ -- 4. TABELA DE AÇÕES -- ============================================ CREATE TABLE IF NOT EXISTS acoes_cpa ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), eixo_id UUID NOT NULL REFERENCES eixos_cpa(id) ON DELETE CASCADE, meta_id UUID NOT NULL REFERENCES metas_cpa(id) ON DELETE CASCADE, nome VARCHAR(255) NOT NULL, descricao TEXT, responsavel_id UUID NOT NULL REFERENCES usuarios_cpa(id), status VARCHAR(50) DEFAULT 'nao_iniciada', -- 'nao_iniciada', 'em_andamento', 'concluida' percentual_progresso INT DEFAULT 0, prazo DATE NOT NULL, data_conclusao DATE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() ); -- ============================================ -- 5. TABELA DE ACOMPANHAMENTO DE AÇÕES -- ============================================ CREATE TABLE IF NOT EXISTS acompanhamento_acoes ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), acao_id UUID NOT NULL REFERENCES acoes_cpa(id) ON DELETE CASCADE, usuario_id UUID NOT NULL REFERENCES usuarios_cpa(id), status_anterior VARCHAR(50), status_novo VARCHAR(50), percentual_anterior INT, percentual_novo INT, comentario TEXT, arquivo_evidencia VARCHAR(500), data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW() ); -- ============================================ -- 6. TABELA DE CRONOGRAMA DE AVALIAÇÕES -- ============================================ CREATE TABLE IF NOT EXISTS cronograma_avaliacoes ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tipo_avaliacao VARCHAR(100) NOT NULL, -- 'perfil_academico', 'quantitativa', 'qualitativa', 'comunidade_externa' descricao TEXT, data_inicio DATE NOT NULL, data_fim DATE NOT NULL, responsavel_id UUID REFERENCES usuarios_cpa(id), status VARCHAR(50) DEFAULT 'planejado', -- 'planejado', 'em_execucao', 'concluido' created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() ); -- ============================================ -- 7. TABELA DE RESULTADOS DE AVALIAÇÕES -- ============================================ CREATE TABLE IF NOT EXISTS resultados_avaliacoes ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), cronograma_id UUID NOT NULL REFERENCES cronograma_avaliacoes(id) ON DELETE CASCADE, tipo_resultado VARCHAR(100), -- 'quantitativo', 'qualitativo', 'descritivo' titulo VARCHAR(255) NOT NULL, descricao TEXT, dados_resultado JSONB, -- Armazena dados em JSON para flexibilidade arquivo_relatorio VARCHAR(500), data_publicacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(), visivel_para_todos BOOLEAN DEFAULT TRUE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() ); -- ============================================ -- 8. TABELA DE REUNIÕES -- ============================================ CREATE TABLE IF NOT EXISTS reunioes_cpa ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), titulo VARCHAR(255) NOT NULL, descricao TEXT, data_hora TIMESTAMP WITH TIME ZONE NOT NULL, local_ou_link VARCHAR(500), tipo_reuniao VARCHAR(100), -- 'coordenadores', 'gestores', 'plenaria', 'outra' criador_id UUID NOT NULL REFERENCES usuarios_cpa(id), status VARCHAR(50) DEFAULT 'agendada', -- 'agendada', 'realizada', 'cancelada' created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() ); -- ============================================ -- 9. TABELA DE PARTICIPANTES DE REUNIÕES -- ============================================ CREATE TABLE IF NOT EXISTS participantes_reuniao ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), reuniao_id UUID NOT NULL REFERENCES reunioes_cpa(id) ON DELETE CASCADE, usuario_id UUID NOT NULL REFERENCES usuarios_cpa(id), confirmado BOOLEAN DEFAULT FALSE, data_confirmacao TIMESTAMP WITH TIME ZONE, UNIQUE(reuniao_id, usuario_id) ); -- ============================================ -- 10. TABELA DE DIMENSÕES (para organizar ações) -- ============================================ CREATE TABLE IF NOT EXISTS dimensoes_cpa ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome VARCHAR(255) NOT NULL UNIQUE, descricao TEXT, eixo_id UUID REFERENCES eixos_cpa(id), created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() ); -- ============================================ -- 11. TABELA DE ASSOCIAÇÃO AÇÃO-DIMENSÃO -- ============================================ CREATE TABLE IF NOT EXISTS acoes_dimensoes ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), acao_id UUID NOT NULL REFERENCES acoes_cpa(id) ON DELETE CASCADE, dimensao_id UUID NOT NULL REFERENCES dimensoes_cpa(id) ON DELETE CASCADE, UNIQUE(acao_id, dimensao_id) ); -- ============================================ -- ÍNDICES PARA PERFORMANCE -- ============================================ CREATE INDEX idx_acoes_responsavel ON acoes_cpa(responsavel_id); CREATE INDEX idx_acoes_eixo ON acoes_cpa(eixo_id); CREATE INDEX idx_acoes_meta ON acoes_cpa(meta_id); CREATE INDEX idx_acoes_status ON acoes_cpa(status); CREATE INDEX idx_acompanhamento_acao ON acompanhamento_acoes(acao_id); CREATE INDEX idx_cronograma_tipo ON cronograma_avaliacoes(tipo_avaliacao); CREATE INDEX idx_resultados_cronograma ON resultados_avaliacoes(cronograma_id); CREATE INDEX idx_reunioes_data ON reunioes_cpa(data_hora); CREATE INDEX idx_participantes_reuniao ON participantes_reuniao(reuniao_id); -- ============================================ -- DADOS INICIAIS - EIXOS (conforme documento) -- ============================================ INSERT INTO eixos_cpa (nome, descricao, ordem) VALUES ('Planejamento e Avaliação Institucional', 'Eixo focado em divulgação de resultados e levantamento do perfil acadêmico', 1), ('Políticas Acadêmicas', 'Eixo de atendimento aos alunos e gestão acadêmica', 2), ('Políticas de Gestão', 'Eixo de avaliação da aprendizagem e ambiente virtual', 3), ('Infraestrutura', 'Eixo de laboratórios e modernização da infraestrutura', 4), ('Valorização Profissional', 'Eixo de desenvolvimento e reconhecimento de mérito', 5), ('Imagem Institucional', 'Eixo de reforço da imagem e engajamento acadêmico', 6) ON CONFLICT (nome) DO NOTHING; -- ============================================ -- DADOS INICIAIS - METAS (conforme documento) -- ============================================ INSERT INTO metas_cpa (eixo_id, nome, descricao, ordem) SELECT id, 'Divulgar os resultados da CPA', 'Divulgar resultados do Perfil Acadêmico e avaliação quantitativa', 1 FROM eixos_cpa WHERE nome = 'Planejamento e Avaliação Institucional' ON CONFLICT DO NOTHING; INSERT INTO metas_cpa (eixo_id, nome, descricao, ordem) SELECT id, 'Levantar o perfil sócioeconômico e cultural da comunidade acadêmica', 'Pesquisa com alunos, egressos, docentes e funcionários', 2 FROM eixos_cpa WHERE nome = 'Planejamento e Avaliação Institucional' ON CONFLICT DO NOTHING; -- ============================================ -- DIMENSÕES (exemplo) -- ============================================ INSERT INTO dimensoes_cpa (nome, descricao, eixo_id) SELECT 'Avaliação de Resultados', 'Dimensão focada em resultados e métricas', id FROM eixos_cpa WHERE nome = 'Planejamento e Avaliação Institucional' ON CONFLICT (nome) DO NOTHING; INSERT INTO dimensoes_cpa (nome, descricao, eixo_id) SELECT 'Atendimento Institucional', 'Dimensão focada em qualidade do atendimento', id FROM eixos_cpa WHERE nome = 'Políticas Acadêmicas' ON CONFLICT (nome) DO NOTHING; -- ============================================ -- VIEWS ÚTEIS PARA O PORTAL -- ============================================ -- View: Progresso por Eixo CREATE OR REPLACE VIEW vw_progresso_por_eixo AS SELECT e.id, e.nome as eixo, COUNT(a.id) as total_acoes, COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as acoes_concluidas, COUNT(CASE WHEN a.status = 'em_andamento' THEN 1 END) as acoes_em_andamento, COUNT(CASE WHEN a.status = 'nao_iniciada' THEN 1 END) as acoes_nao_iniciadas, ROUND(AVG(a.percentual_progresso)::numeric, 2) as percentual_medio, ROUND((COUNT(CASE WHEN a.status = 'concluida' THEN 1 END)::numeric / COUNT(a.id) * 100), 2) as percentual_conclusao FROM eixos_cpa e LEFT JOIN metas_cpa m ON e.id = m.eixo_id LEFT JOIN acoes_cpa a ON m.id = a.meta_id GROUP BY e.id, e.nome ORDER BY e.ordem; -- View: Ações por Responsável CREATE OR REPLACE VIEW vw_acoes_por_responsavel AS SELECT u.id, u.nome as responsavel, u.cargo, e.nome as eixo, COUNT(a.id) as total_acoes, COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as acoes_concluidas, COUNT(CASE WHEN a.status = 'em_andamento' THEN 1 END) as acoes_em_andamento, COUNT(CASE WHEN a.status = 'nao_iniciada' THEN 1 END) as acoes_nao_iniciadas, ROUND(AVG(a.percentual_progresso)::numeric, 2) as percentual_medio FROM usuarios_cpa u LEFT JOIN acoes_cpa a ON u.id = a.responsavel_id LEFT JOIN eixos_cpa e ON a.eixo_id = e.id WHERE u.ativo = TRUE GROUP BY u.id, u.nome, u.cargo, e.nome ORDER BY u.nome; -- View: Prazos Próximos (próximos 30 dias) CREATE OR REPLACE VIEW vw_prazos_proximos AS SELECT a.id, a.nome as acao, e.nome as eixo, u.nome as responsavel, a.prazo, a.status, a.percentual_progresso, (a.prazo - CURRENT_DATE) as dias_restantes FROM acoes_cpa a JOIN eixos_cpa e ON a.eixo_id = e.id JOIN usuarios_cpa u ON a.responsavel_id = u.id WHERE a.prazo BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' AND a.status != 'concluida' ORDER BY a.prazo ASC; -- View: Cronograma Consolidado CREATE OR REPLACE VIEW vw_cronograma_consolidado AS SELECT id, tipo_avaliacao, descricao, data_inicio, data_fim, status, responsavel_id, (SELECT nome FROM usuarios_cpa WHERE id = cronograma_avaliacoes.responsavel_id) as responsavel FROM cronograma_avaliacoes ORDER BY data_inicio ASC;

Resumo da Estrutura

Tabelas principais:

usuarios_cpa — Coordenadores, gestores e admin da CPA

eixos_cpa — Os 6 eixos do documento

metas_cpa — Metas dentro de cada eixo

acoes_cpa — Ações com responsável, prazo e status

acompanhamento_acoes — Histórico de atualizações

cronograma_avaliacoes — Datas das 4 avaliações

resultados_avaliacoes — Dados e relatórios (visíveis para todos)

reunioes_cpa — Agenda de reuniões

dimensoes_cpa — Dimensões para organizar ações

acoes_dimensoes — Associação entre ações e dimensões

Views para o dashboard:

Progresso por eixo

Ações por responsável

Prazos próximos

Cronograma consolidado -- ============================================

-- 1. TABELA DE USUÁRIOS DA CPA

-- ============================================

CREATE TABLE IF NOT EXISTS usuarios_cpa (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) UNIQUE NOT NULL,

    nome VARCHAR(255) NOT NULL,

    cargo VARCHAR(100),

    departamento VARCHAR(100),

    tipo_usuario VARCHAR(50) NOT NULL, -- 'coordenador', 'gestor', 'admin_cpa'

    ativo BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);

-- ============================================

-- 2. TABELA DE EIXOS

-- ============================================

CREATE TABLE IF NOT EXISTS eixos_cpa (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nome VARCHAR(255) NOT NULL UNIQUE,

    descricao TEXT,

    ordem INT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);

-- ============================================

-- 3. TABELA DE METAS

-- ============================================

CREATE TABLE IF NOT EXISTS metas_cpa (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    eixo_id UUID NOT NULL REFERENCES eixos_cpa(id) ON DELETE CASCADE,

    nome VARCHAR(255) NOT NULL,

    descricao TEXT,

    ordem INT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);

-- ============================================

-- 4. TABELA DE AÇÕES

-- ============================================

CREATE TABLE IF NOT EXISTS acoes_cpa (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    eixo_id UUID NOT NULL REFERENCES eixos_cpa(id) ON DELETE CASCADE,

    meta_id UUID NOT NULL REFERENCES metas_cpa(id) ON DELETE CASCADE,

    nome VARCHAR(255) NOT NULL,

    descricao TEXT,

    responsavel_id UUID NOT NULL REFERENCES usuarios_cpa(id),

    status VARCHAR(50) DEFAULT 'nao_iniciada', -- 'nao_iniciada', 'em_andamento', 'concluida'

    percentual_progresso INT DEFAULT 0,

    prazo DATE NOT NULL,

    data_conclusao DATE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);

-- ============================================

-- 5. TABELA DE ACOMPANHAMENTO DE AÇÕES

-- ============================================

CREATE TABLE IF NOT EXISTS acompanhamento_acoes (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    acao_id UUID NOT NULL REFERENCES acoes_cpa(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL REFERENCES usuarios_cpa(id),

    status_anterior VARCHAR(50),

    status_novo VARCHAR(50),

    percentual_anterior INT,

    percentual_novo INT,

    comentario TEXT,

    arquivo_evidencia VARCHAR(500),

    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);

-- ============================================

-- 6. TABELA DE CRONOGRAMA DE AVALIAÇÕES

-- ============================================

CREATE TABLE IF NOT EXISTS cronograma_avaliacoes (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tipo_avaliacao VARCHAR(100) NOT NULL, -- 'perfil_academico', 'quantitativa', 'qualitativa', 'comunidade_externa'

    descricao TEXT,

    data_inicio DATE NOT NULL,

    data_fim DATE NOT NULL,

    responsavel_id UUID REFERENCES usuarios_cpa(id),

    status VARCHAR(50) DEFAULT 'planejado', -- 'planejado', 'em_execucao', 'concluido'

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);

-- ============================================

-- 7. TABELA DE RESULTADOS DE AVALIAÇÕES

-- ============================================

CREATE TABLE IF NOT EXISTS resultados_avaliacoes (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cronograma_id UUID NOT NULL REFERENCES cronograma_avaliacoes(id) ON DELETE CASCADE,

    tipo_resultado VARCHAR(100), -- 'quantitativo', 'qualitativo', 'descritivo'

    titulo VARCHAR(255) NOT NULL,

    descricao TEXT,

    dados_resultado JSONB, -- Armazena dados em JSON para flexibilidade

    arquivo_relatorio VARCHAR(500),

    data_publicacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    visivel_para_todos BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);

-- ============================================

-- 8. TABELA DE REUNIÕES

-- ============================================

CREATE TABLE IF NOT EXISTS reunioes_cpa (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    titulo VARCHAR(255) NOT NULL,

    descricao TEXT,

    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,

    local_ou_link VARCHAR(500),

    tipo_reuniao VARCHAR(100), -- 'coordenadores', 'gestores', 'plenaria', 'outra'

    criador_id UUID NOT NULL REFERENCES usuarios_cpa(id),

    status VARCHAR(50) DEFAULT 'agendada', -- 'agendada', 'realizada', 'cancelada'

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);

-- ============================================

-- 9. TABELA DE PARTICIPANTES DE REUNIÕES

-- ============================================

CREATE TABLE IF NOT EXISTS participantes_reuniao (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reuniao_id UUID NOT NULL REFERENCES reunioes_cpa(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL REFERENCES usuarios_cpa(id),

    confirmado BOOLEAN DEFAULT FALSE,

    data_confirmacao TIMESTAMP WITH TIME ZONE,

    UNIQUE(reuniao_id, usuario_id)

);

-- ============================================

-- 10. TABELA DE DIMENSÕES (para organizar ações)

-- ============================================

CREATE TABLE IF NOT EXISTS dimensoes_cpa (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nome VARCHAR(255) NOT NULL UNIQUE,

    descricao TEXT,

    eixo_id UUID REFERENCES eixos_cpa(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);

-- ============================================

-- 11. TABELA DE ASSOCIAÇÃO AÇÃO-DIMENSÃO

-- ============================================

CREATE TABLE IF NOT EXISTS acoes_dimensoes (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    acao_id UUID NOT NULL REFERENCES acoes_cpa(id) ON DELETE CASCADE,

    dimensao_id UUID NOT NULL REFERENCES dimensoes_cpa(id) ON DELETE CASCADE,

    UNIQUE(acao_id, dimensao_id)

);

-- ============================================

-- ÍNDICES PARA PERFORMANCE

-- ============================================

CREATE INDEX idx_acoes_responsavel ON acoes_cpa(responsavel_id);

CREATE INDEX idx_acoes_eixo ON acoes_cpa(eixo_id);

CREATE INDEX idx_acoes_meta ON acoes_cpa(meta_id);

CREATE INDEX idx_acoes_status ON acoes_cpa(status);

CREATE INDEX idx_acompanhamento_acao ON acompanhamento_acoes(acao_id);

CREATE INDEX idx_cronograma_tipo ON cronograma_avaliacoes(tipo_avaliacao);

CREATE INDEX idx_resultados_cronograma ON resultados_avaliacoes(cronograma_id);

CREATE INDEX idx_reunioes_data ON reunioes_cpa(data_hora);

CREATE INDEX idx_participantes_reuniao ON participantes_reuniao(reuniao_id);

-- ============================================

-- DADOS INICIAIS - EIXOS (conforme documento)

-- ============================================

INSERT INTO eixos_cpa (nome, descricao, ordem) VALUES

('Planejamento e Avaliação Institucional', 'Eixo focado em divulgação de resultados e levantamento do perfil acadêmico', 1),

('Políticas Acadêmicas', 'Eixo de atendimento aos alunos e gestão acadêmica', 2),

('Políticas de Gestão', 'Eixo de avaliação da aprendizagem e ambiente virtual', 3),

('Infraestrutura', 'Eixo de laboratórios e modernização da infraestrutura', 4),

('Valorização Profissional', 'Eixo de desenvolvimento e reconhecimento de mérito', 5),

('Imagem Institucional', 'Eixo de reforço da imagem e engajamento acadêmico', 6)

ON CONFLICT (nome) DO NOTHING;

-- ============================================

-- DADOS INICIAIS - METAS (conforme documento)

-- ============================================

INSERT INTO metas_cpa (eixo_id, nome, descricao, ordem) 

SELECT id, 'Divulgar os resultados da CPA', 'Divulgar resultados do Perfil Acadêmico e avaliação quantitativa', 1

FROM eixos_cpa WHERE nome = 'Planejamento e Avaliação Institucional'

ON CONFLICT DO NOTHING;

INSERT INTO metas_cpa (eixo_id, nome, descricao, ordem) 

SELECT id, 'Levantar o perfil sócioeconômico e cultural da comunidade acadêmica', 'Pesquisa com alunos, egressos, docentes e funcionários', 2

FROM eixos_cpa WHERE nome = 'Planejamento e Avaliação Institucional'

ON CONFLICT DO NOTHING;

-- ============================================

-- DIMENSÕES (exemplo)

-- ============================================

INSERT INTO dimensoes_cpa (nome, descricao, eixo_id) 

SELECT 'Avaliação de Resultados', 'Dimensão focada em resultados e métricas', id

FROM eixos_cpa WHERE nome = 'Planejamento e Avaliação Institucional'

ON CONFLICT (nome) DO NOTHING;

INSERT INTO dimensoes_cpa (nome, descricao, eixo_id) 

SELECT 'Atendimento Institucional', 'Dimensão focada em qualidade do atendimento', id

FROM eixos_cpa WHERE nome = 'Políticas Acadêmicas'

ON CONFLICT (nome) DO NOTHING;

-- ============================================

-- VIEWS ÚTEIS PARA O PORTAL

-- ============================================

-- View: Progresso por Eixo

CREATE OR REPLACE VIEW vw_progresso_por_eixo AS

SELECT 

    e.id,

    e.nome as eixo,

    COUNT(a.id) as total_acoes,

    COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as acoes_concluidas,

    COUNT(CASE WHEN a.status = 'em_andamento' THEN 1 END) as acoes_em_andamento,

    COUNT(CASE WHEN a.status = 'nao_iniciada' THEN 1 END) as acoes_nao_iniciadas,

    ROUND(AVG(a.percentual_progresso)::numeric, 2) as percentual_medio,

    ROUND((COUNT(CASE WHEN a.status = 'concluida' THEN 1 END)::numeric / COUNT(a.id) * 100), 2) as percentual_conclusao

FROM eixos_cpa e

LEFT JOIN metas_cpa m ON e.id = m.eixo_id

LEFT JOIN acoes_cpa a ON m.id = a.meta_id

GROUP BY e.id, e.nome

ORDER BY e.ordem;

-- View: Ações por Responsável

CREATE OR REPLACE VIEW vw_acoes_por_responsavel AS

SELECT 

    u.id,

    u.nome as responsavel,

    u.cargo,

    e.nome as eixo,

    COUNT(a.id) as total_acoes,

    COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as acoes_concluidas,

    COUNT(CASE WHEN a.status = 'em_andamento' THEN 1 END) as acoes_em_andamento,

    COUNT(CASE WHEN a.status = 'nao_iniciada' THEN 1 END) as acoes_nao_iniciadas,

    ROUND(AVG(a.percentual_progresso)::numeric, 2) as percentual_medio

FROM usuarios_cpa u

LEFT JOIN acoes_cpa a ON u.id = a.responsavel_id

LEFT JOIN eixos_cpa e ON a.eixo_id = e.id

WHERE u.ativo = TRUE

GROUP BY u.id, u.nome, u.cargo, e.nome

ORDER BY u.nome;

-- View: Prazos Próximos (próximos 30 dias)

CREATE OR REPLACE VIEW vw_prazos_proximos AS

SELECT 

    a.id,

    a.nome as acao,

    e.nome as eixo,

    u.nome as responsavel,

    a.prazo,

    a.status,

    a.percentual_progresso,

    (a.prazo - CURRENT_DATE) as dias_restantes

FROM acoes_cpa a

JOIN eixos_cpa e ON a.eixo_id = e.id

JOIN usuarios_cpa u ON a.responsavel_id = u.id

WHERE a.prazo BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'

    AND a.status != 'concluida'

ORDER BY a.prazo ASC;

-- View: Cronograma Consolidado

CREATE OR REPLACE VIEW vw_cronograma_consolidado AS

SELECT 

    id,

    tipo_avaliacao,

    descricao,

    data_inicio,

    data_fim,

    status,

    responsavel_id,

    (SELECT nome FROM usuarios_cpa WHERE id = cronograma_avaliacoes.responsavel_id) as responsavel

FROM cronograma_avaliacoes

ORDER BY data_inicio ASC;

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vision-quest-hub-73.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d2d493e3-f477-435b-8503-3d0321061d24).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
