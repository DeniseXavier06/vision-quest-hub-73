import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Target, UserRound, ListChecks } from 'lucide-react';

type Bloco = { titulo: string; dimensao: string; indicadores: string[] };

type Persona = {
  id: string;
  nome: string;
  modalidade: 'Presencial' | 'EAD';
  objetivo: string;
  perfil: string;
  participacao: { ano: string; valor: number | null }[];
  blocos: Bloco[];
};

const percent = (value: number) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

const personas: Persona[] = [
  {
    id: 'discente-presencial',
    nome: 'Discente Presencial',
    modalidade: 'Presencial',
    objetivo:
      'Captar a percepção do estudante presencial sobre instituição, curso, professor, infraestrutura e o próprio envolvimento acadêmico.',
    perfil:
      'Aluno matriculado em cursos presenciais, que vivencia diariamente salas de aula, laboratórios, biblioteca, atendimento dos setores e o ambiente virtual MAR.',
    participacao: [
      { ano: '2024', valor: 72.97 },
      { ano: '2025', valor: 77.64 },
      { ano: '2026', valor: 79.66 },
    ],
    blocos: [
      {
        titulo: 'Avaliando a Instituição — Imagem',
        dimensao: 'Dimensões 1 e 3 — Missão e Responsabilidade Social',
        indicadores: [
          'Qualidade dos cursos disponibilizados',
          'Competência dos professores',
          'Preparo dos egressos para o mercado de trabalho',
          'Recomendação dos cursos a outras pessoas',
          'Credibilidade da instituição',
          'Extensão curricular e interação com a sociedade',
        ],
      },
      {
        titulo: 'Avaliando a Instituição — Atendimento ao aluno',
        dimensao: 'Dimensão 4 — Comunicação com a Sociedade',
        indicadores: [
          'Atendimento telefônico e aplicativo',
          'Tempo de resposta dos e-mails e resolução de problemas',
          'Secretaria, Central de Atendimento e Protocolo',
          'Departamento Financeiro',
          'Reitoria',
          'CDAP — Desenvolvimento Acadêmico e Profissional',
        ],
      },
      {
        titulo: 'Avaliando a Infraestrutura',
        dimensao: 'Dimensão 7 — Infraestrutura',
        indicadores: [
          'Salas de aula: capacidade, acústica, iluminação, mobiliário e recursos audiovisuais',
          'Laboratórios: quantidade, manutenção, atualização, recursos tecnológicos e suporte técnico',
          'Biblioteca: acervo básico e complementar, recursos digitais, empréstimos, horário, espaço físico e apoio dos bibliotecários',
          'MAR / recursos de informação e comunicação: navegação, organização das disciplinas, atividades, avaliações, feedbacks, gravações e aulas no Meet',
        ],
      },
      {
        titulo: 'Avaliando o Curso',
        dimensao: 'Dimensão 2 — Ensino, Pesquisa e Extensão',
        indicadores: [
          'Imagem do curso: preparo profissional, senso crítico, recomendação e crescimento profissional',
          'Organização didático-pedagógica: plano de ensino, cumprimento de conteúdos, recursos didáticos e uso do tempo',
          'Avaliação da aprendizagem: critérios, compatibilidade das atividades, reflexão, retorno e prazos',
          'Atendimento do coordenador: solução de problemas, agilidade, disponibilidade e mediação de conflitos',
          'Curricularização da extensão',
        ],
      },
      {
        titulo: 'Avaliando o Professor',
        dimensao: 'Dimensão 2 — Ensino',
        indicadores: [
          'Clareza na exposição do plano de ensino',
          'Comunicação sobre aulas, materiais, atividades e avaliações',
          'Dinamismo, clareza e exemplos atualizados',
          'Aplicabilidade dos conteúdos e debates em sala',
          'Esclarecimento de dúvidas e aprofundamento do conteúdo',
          'Retorno das aprendizagens e domínio da plataforma',
          'Incentivo a leituras, pesquisa e extensão',
        ],
      },
      {
        titulo: 'Autoavaliação do aluno',
        dimensao: 'Dimensão 2 — Ensino, Pesquisa e Extensão',
        indicadores: [
          'Atenção às explicações e participação nas atividades',
          'Envolvimento em debates e discussões',
          'Busca por referências além das indicadas',
          'Participação em pesquisa e extensão',
          'Autoaprendizagem',
        ],
      },
    ],
  },
  {
    id: 'discente-ead',
    nome: 'Discente EAD',
    modalidade: 'EAD',
    objetivo:
      'Medir a experiência do estudante a distância quanto ao AVA (MAR), tutoria, polo, videoaulas e atendimento institucional.',
    perfil:
      'Aluno de cursos a distância, vinculado a um polo, que estuda pelos tópicos de aprendizagem, videoaulas, fóruns e encontros síncronos com apoio de tutores.',
    participacao: [
      { ano: '2024', valor: 33.88 },
      { ano: '2025', valor: 25.04 },
      { ano: '2026', valor: 18.45 },
    ],
    blocos: [
      {
        titulo: 'Avaliando a Instituição — Imagem',
        dimensao: 'Dimensões 1 e 3 — Missão e Responsabilidade Social',
        indicadores: [
          'Qualidade dos cursos',
          'Competência dos professores EAD e dos professores auxiliares (tutores)',
          'Preparo para o mercado de trabalho',
          'Recomendação e credibilidade da instituição',
        ],
      },
      {
        titulo: 'Avaliando a Instituição — Atendimento ao aluno',
        dimensao: 'Dimensão 4 — Comunicação com a Sociedade',
        indicadores: [
          'Atendimento institucional pelo WhatsApp',
          'Atendimento dos tutores por WhatsApp e pelo MAR',
          'Secretaria e Central de Atendimento',
          'Canal com a coordenação do curso',
          'Financeiro e Protocolo',
          'CDAP — estágio e apoio psicopedagógico',
        ],
      },
      {
        titulo: 'Avaliando a Infraestrutura',
        dimensao: 'Dimensão 7 — Infraestrutura',
        indicadores: [
          'Polo: estrutura, acústica, mobiliário, iluminação e recursos tecnológicos para avaliações',
          'Laboratórios físicos e virtuais: atualização, funcionamento, preparação das práticas e acesso a informática e internet',
          'Biblioteca virtual: acervo atualizado, bibliografia básica, horário, atendimento, treinamentos e acesso pelo AVA',
          'MAR: acesso às disciplinas, organização visual, disponibilidade de atividades, avaliações, notas e feedbacks, recursos de comunicação, videoaulas, usabilidade do AVA e qualidade dos tópicos de aprendizagem',
        ],
      },
      {
        titulo: 'Avaliando o Curso',
        dimensao: 'Dimensão 2 — Ensino, Pesquisa e Extensão',
        indicadores: [
          'Imagem do curso: preparo profissional, senso crítico, adequação ao mercado e extensão curricular',
          'Organização didático-pedagógica: plano de ensino no MAR, cumprimento dos conteúdos por videoaulas e trilhas, orientação dos tutores e produtividade das videoaulas',
          'Avaliação da aprendizagem: critérios, compatibilidade, reflexão, atuação dos tutores em fórum e chat e prazos de resultados',
          'Atendimento da coordenação: interesse, canal de diálogo e disponibilidade',
        ],
      },
      {
        titulo: 'Avaliando o Professor e o Tutor',
        dimensao: 'Dimensão 2 — Ensino',
        indicadores: [
          'Clareza do plano de ensino e comunicação dos encontros',
          'Videoaulas: dinamismo, clareza, exemplos atualizados e aplicabilidade',
          'Tutor: esclarecimento de dúvidas em chat e fórum, aprofundamento e retorno das aprendizagens',
          'Domínio da plataforma pelo tutor',
          'Incentivo a leituras, pesquisa e extensão',
        ],
      },
      {
        titulo: 'Autoavaliação do aluno',
        dimensao: 'Dimensão 2 — Ensino, Pesquisa e Extensão',
        indicadores: [
          'Acesso regular e realização das atividades no MAR',
          'Participação nos fóruns e nos encontros síncronos',
          'Leituras dos tópicos de aprendizagem e referências adicionais',
          'Participação em práticas, pesquisa e extensão',
          'Trilha de Projeto de Vida e Carreira',
        ],
      },
    ],
  },
  {
    id: 'docente-presencial',
    nome: 'Docente Presencial',
    modalidade: 'Presencial',
    objetivo:
      'Avaliar as condições de trabalho, a gestão institucional, a infraestrutura de ensino, a turma, o coordenador e a própria prática pedagógica.',
    perfil:
      'Professor de cursos presenciais, responsável por planos de ensino, aulas, avaliações e atividades de extensão curricular.',
    participacao: [
      { ano: '2024', valor: 67.92 },
      { ano: '2025', valor: 85.94 },
      { ano: '2026', valor: 88.19 },
    ],
    blocos: [
      {
        titulo: 'Avaliando a Instituição',
        dimensao: 'Dimensões 1, 4, 5 e 6 — Missão, Comunicação, Políticas de Pessoal e Gestão',
        indicadores: [
          'Imagem: qualidade dos cursos, competência docente, preparo dos egressos, recomendação e credibilidade',
          'Atendimento ao professor: telefone, aplicativo, e-mails, Suporte Educacional Remoto, Gerência de Tecnologia, Gerência de Gente e Carreira, Secretaria Acadêmica e Docente, Reitoria, Vice-Reitoria e Pró-Reitoria de Ensino',
          'Gestão: plano de carreira e avaliação de desempenho, condições de trabalho, incentivos à capacitação, apoio à pesquisa e extensão, ações inovadoras, participação na avaliação institucional, monitoramento por indicadores, metas anuais e planejamento da infraestrutura',
        ],
      },
      {
        titulo: 'Avaliando a Infraestrutura',
        dimensao: 'Dimensão 7 — Infraestrutura',
        indicadores: [
          'Salas de aula: capacidade, recursos audiovisuais, acústica, mobiliário e iluminação',
          'Laboratórios: quantidade, manutenção, atualização, recursos tecnológicos e suporte técnico',
          'Biblioteca: acervo, serviços, recursos digitais, horário, espaço físico e apoio dos bibliotecários',
          'MAR: navegação, organização das disciplinas, atividades, avaliações, feedbacks, gravações e aulas no Meet',
        ],
      },
      {
        titulo: 'Avaliando o Curso',
        dimensao: 'Dimensão 2 — Ensino, Pesquisa e Extensão',
        indicadores: [
          'Imagem do curso: preparo profissional, senso crítico, recomendação e crescimento profissional',
          'Organização didático-pedagógica: apresentação do plano de ensino, cumprimento de conteúdos, recursos didáticos e uso do tempo',
          'Ajuste das atividades de extensão às disciplinas',
        ],
      },
      {
        titulo: 'Avaliando a Turma',
        dimensao: 'Dimensão 2 — Ensino, Pesquisa e Extensão',
        indicadores: [
          'Conhecimento dos critérios de avaliação pelos alunos',
          'Compatibilidade das atividades avaliativas',
          'Envolvimento: atenção, participação, debates, busca de referências',
          'Participação dos alunos em pesquisa e extensão',
        ],
      },
      {
        titulo: 'Autoavaliação do professor',
        dimensao: 'Dimensão 2 — Ensino',
        indicadores: [
          'Apresentação do plano de ensino e comunicação da disciplina',
          'Dinamismo, clareza e exemplos atualizados',
          'Aplicabilidade dos conteúdos e promoção de debates',
          'Esclarecimento de dúvidas e retorno das aprendizagens',
          'Incentivo a leituras, pesquisa e extensão',
          'Qualificação para atividades de extensão curricular',
        ],
      },
      {
        titulo: 'Avaliando o Coordenador',
        dimensao: 'Dimensões 2 e 6 — Ensino e Gestão',
        indicadores: [
          'Ações inovadoras para a aprendizagem',
          'Promoção da interação entre professores',
          'Atualização do Projeto Pedagógico',
          'Contribuição ao processo de ensino-aprendizagem',
          'Incentivo ao ensino e à extensão',
          'Feedback individual sobre a prática pedagógica',
          'Atuação administrativa: infraestrutura e disponibilidade de atendimento',
        ],
      },
    ],
  },
  {
    id: 'docente-ead',
    nome: 'Docente EAD',
    modalidade: 'EAD',
    objetivo:
      'Avaliar a produção e mediação do ensino a distância, a articulação com os tutores, o AVA, o polo e a gestão institucional.',
    perfil:
      'Professor titular de cursos EAD, responsável por videoaulas, tópicos de aprendizagem e articulação com professores auxiliares (tutores).',
    participacao: [
      { ano: '2024', valor: 100 },
      { ano: '2025', valor: 93.23 },
      { ano: '2026', valor: 85.37 },
    ],
    blocos: [
      {
        titulo: 'Avaliando a Instituição',
        dimensao: 'Dimensões 1, 4, 5 e 6 — Missão, Comunicação, Políticas de Pessoal e Gestão',
        indicadores: [
          'Imagem: qualidade dos cursos, competência dos professores e dos auxiliares, preparo dos egressos, recomendação e credibilidade',
          'Atendimento ao professor: WhatsApp institucional, tutores por WhatsApp e MAR, Secretaria, canal com a coordenação, Central de Atendimento, Financeiro, Protocolo, CDAP e Reitoria/Vice-Reitoria/Pró-Reitoria de Ensino',
          'Gestão: plano de carreira, condições de trabalho, incentivos à capacitação, apoio à pesquisa e extensão, ações inovadoras, participação na avaliação institucional, indicadores, metas e infraestrutura',
        ],
      },
      {
        titulo: 'Avaliando a Infraestrutura',
        dimensao: 'Dimensão 7 — Infraestrutura',
        indicadores: [
          'Polo: estrutura, acústica, mobiliário, iluminação e recursos tecnológicos para avaliações',
          'Laboratórios físicos e virtuais: atualização, funcionamento e preparação das práticas',
          'Biblioteca virtual: acervo, bibliografia básica, atendimento e acesso pelo AVA',
          'MAR: acesso e organização das disciplinas, disponibilidade de atividades, avaliações e notas, recursos de comunicação, videoaulas, usabilidade e qualidade dos tópicos de aprendizagem',
        ],
      },
      {
        titulo: 'Avaliando o Curso',
        dimensao: 'Dimensão 2 — Ensino, Pesquisa e Extensão',
        indicadores: [
          'Imagem do curso: preparo profissional, senso crítico, adequação ao mercado e condições para extensão e práticas',
          'Organização didático-pedagógica: apresentação do plano de ensino, cumprimento de conteúdos, recursos didáticos, sugestões de prática',
          'Interação dos professores auxiliares com os estudantes',
          'Articulação entre professores EAD e auxiliares',
        ],
      },
      {
        titulo: 'Avaliando a Turma',
        dimensao: 'Dimensão 2 — Ensino, Pesquisa e Extensão',
        indicadores: [
          'Conhecimento dos critérios de avaliação',
          'Envolvimento dos alunos nos debates e atividades',
          'Busca por referências adicionais',
          'Participação em pesquisa e extensão e autoaprendizagem',
        ],
      },
      {
        titulo: 'Autoavaliação do professor',
        dimensao: 'Dimensão 2 — Ensino',
        indicadores: [
          'Plano de ensino e comunicação da disciplina',
          'Dinamismo, clareza e exemplos atualizados nas videoaulas',
          'Aplicabilidade dos conteúdos e debates',
          'Esclarecimento de dúvidas',
          'Incentivo a leituras, pesquisa e extensão',
        ],
      },
      {
        titulo: 'Avaliando o Coordenador',
        dimensao: 'Dimensões 2 e 6 — Ensino e Gestão',
        indicadores: [
          'Ações inovadoras para a aprendizagem',
          'Interação entre titulares e auxiliares',
          'Atualização do Projeto Pedagógico',
          'Feedback pedagógico aos professores',
          'Empenho pela infraestrutura do curso',
          'Disponibilidade de atendimento aos professores',
        ],
      },
    ],
  },
  {
    id: 'coordenador-presencial',
    nome: 'Coordenador Presencial',
    modalidade: 'Presencial',
    objetivo:
      'Avaliar a gestão institucional, a infraestrutura, a organização do curso e a própria atuação pedagógica e administrativa.',
    perfil:
      'Gestor acadêmico de curso presencial, responsável pelo Projeto Pedagógico, pelo corpo docente e pelo atendimento a alunos e professores.',
    participacao: [
      { ano: '2024', valor: 100 },
      { ano: '2025', valor: 81.82 },
      { ano: '2026', valor: 90 },
    ],
    blocos: [
      {
        titulo: 'Avaliando a Instituição',
        dimensao: 'Dimensões 1, 4, 5 e 6 — Missão, Comunicação, Políticas de Pessoal e Gestão',
        indicadores: [
          'Imagem: qualidade dos cursos, competência docente, preparo dos egressos, recomendação e credibilidade',
          'Atendimento ao coordenador: telefone, aplicativo, e-mails, Secretaria Acadêmica e Docente, Central de Atendimento, Financeiro, Comunicação, Reitoria, Vice-Reitoria e Pró-Reitoria de Ensino',
          'Gestão: plano de carreira, condições de trabalho, incentivos à capacitação, apoio à pesquisa e extensão, ações inovadoras, participação na avaliação institucional, monitoramento por indicadores, metas anuais e planejamento da infraestrutura',
        ],
      },
      {
        titulo: 'Avaliando a Infraestrutura',
        dimensao: 'Dimensão 7 — Infraestrutura',
        indicadores: [
          'Salas de aula: capacidade, recursos audiovisuais, acústica, mobiliário e iluminação',
          'Laboratórios: quantidade, manutenção, atualização, recursos tecnológicos e suporte técnico',
          'Biblioteca: acervo, serviços, recursos digitais, empréstimos, horário, espaço físico e apoio dos bibliotecários',
          'MAR: navegação, organização das disciplinas, atividades, avaliações, feedbacks, gravações e aulas no Meet',
        ],
      },
      {
        titulo: 'Avaliando o Curso',
        dimensao: 'Dimensão 2 — Ensino, Pesquisa e Extensão',
        indicadores: [
          'Imagem do curso: preparo profissional, senso crítico, recomendação e crescimento profissional',
          'Organização didático-pedagógica: plano de ensino, cumprimento de conteúdos, recursos didáticos e uso do tempo pelos professores',
          'Ajuste da extensão curricular às disciplinas',
        ],
      },
      {
        titulo: 'Autoavaliação do coordenador',
        dimensao: 'Dimensões 2 e 6 — Ensino e Gestão',
        indicadores: [
          'Ações inovadoras para a aprendizagem',
          'Promoção da interação entre professores',
          'Atualizações do Projeto Pedagógico',
          'Contribuição ao ensino-aprendizagem',
          'Incentivo ao ensino e à extensão',
          'Feedback individual aos professores',
          'Atuação administrativa: infraestrutura e disponibilidade de atendimento',
        ],
      },
    ],
  },
  {
    id: 'coordenador-ead',
    nome: 'Coordenador EAD',
    modalidade: 'EAD',
    objetivo:
      'Avaliar a gestão do curso a distância, os polos, o AVA, a atuação dos professores titulares e tutores e a própria gestão acadêmica.',
    perfil:
      'Gestor de curso EAD, articulado com CEAD, coordenação de polo, professores titulares e tutores, e responsável pelos indicadores do curso.',
    participacao: [
      { ano: '2024', valor: 100 },
      { ano: '2025', valor: 100 },
      { ano: '2026', valor: 100 },
    ],
    blocos: [
      {
        titulo: 'Avaliando a Instituição',
        dimensao: 'Dimensões 1, 4, 5 e 6 — Missão, Comunicação, Políticas de Pessoal e Gestão',
        indicadores: [
          'Imagem: qualidade dos cursos, competência docente, preparo dos egressos, recomendação e credibilidade',
          'Atendimento ao coordenador: atendimento digital, aplicativo, e-mails, Suporte Educacional Remoto, Gerência de Tecnologia, Gerência de Gente e Carreira, Secretaria Acadêmica, CEAD, Coordenação de Polo, Financeiro, Comunicação e Reitoria/Vice-Reitoria/Pró-Reitoria',
          'Gestão: estrutura administrativa, missão e objetivos, plano de carreira, condições de trabalho, incentivos, apoio à pesquisa e extensão, ações inovadoras, incentivo à avaliação institucional, monitoramento por indicadores, acesso a relatórios de gestão, metas e infraestrutura',
        ],
      },
      {
        titulo: 'Avaliando a Infraestrutura',
        dimensao: 'Dimensão 7 — Infraestrutura',
        indicadores: [
          'Polo: estrutura, acústica, mobiliário, iluminação e recursos tecnológicos para avaliações',
          'Biblioteca virtual: acervo, bibliografia básica, horário, atendimento, treinamentos e acesso pelo AVA',
          'Laboratórios físicos e virtuais: atualização, funcionamento, preparação das práticas e acesso a informática e internet',
          'MAR: acesso e organização das disciplinas, disponibilidade de atividades, avaliações, notas e feedbacks, recursos de comunicação, videoaulas, usabilidade do AVA e qualidade dos tópicos de aprendizagem',
        ],
      },
      {
        titulo: 'Avaliando o Curso',
        dimensao: 'Dimensão 2 — Ensino, Pesquisa e Extensão',
        indicadores: [
          'Imagem do curso: preparo profissional, senso crítico, adequação ao mercado, extensão curricular e condições para práticas',
          'Organização didático-pedagógica: plano de ensino e cumprimento de conteúdos pelos professores EAD, orientação dos tutores, recursos didáticos, sugestões de prática, interação dos auxiliares e articulação entre titulares e auxiliares',
        ],
      },
      {
        titulo: 'Autoavaliação do coordenador',
        dimensao: 'Dimensões 2 e 6 — Ensino e Gestão',
        indicadores: [
          'Ações inovadoras para a aprendizagem',
          'Interação entre professores titulares e auxiliares',
          'Atualizações do Projeto Pedagógico',
          'Contribuição ao ensino-aprendizagem e incentivo à extensão',
          'Feedback individual aos professores',
          'Monitoramento dos indicadores de gestão do curso',
          'Atuação administrativa: infraestrutura e atendimento a professores e alunos',
        ],
      },
    ],
  },
  {
    id: 'colaborador',
    nome: 'Colaborador',
    modalidade: 'Presencial',
    objetivo:
      'Avaliar condições de trabalho, gestão, comunicação interna, serviços dos setores, valorização profissional e desempenho individual.',
    perfil:
      'Colaborador técnico-administrativo dos setores e gerências da instituição, usuário do Portal do Colaborador e do Intrasete.',
    participacao: [
      { ano: '2024', valor: 72.48 },
      { ano: '2025', valor: 91.45 },
      { ano: '2026', valor: 91.16 },
    ],
    blocos: [
      {
        titulo: 'Imagem da Instituição',
        dimensao: 'Dimensões 1 e 3 — Missão e Responsabilidade Social',
        indicadores: [
          'Qualidade dos cursos',
          'Competência dos professores',
          'Preparo dos egressos para o mercado',
          'Recomendação dos cursos e credibilidade institucional',
        ],
      },
      {
        titulo: 'Condições de trabalho',
        dimensao: 'Dimensões 5 e 7 — Políticas de Pessoal e Infraestrutura',
        indicadores: [
          'Recursos e infraestrutura para o trabalho',
          'Manutenção dos espaços físicos',
          'Adequação do espaço às atividades',
          'Abertura para propor melhorias no setor',
        ],
      },
      {
        titulo: 'Gestão da Instituição',
        dimensao: 'Dimensão 6 — Organização e Gestão',
        indicadores: [
          'Comunicação aberta com os colaboradores',
          'Esclarecimento das normas administrativas',
          'Monitoramento de desempenho por indicadores',
          'Condições para alcançar as metas anuais',
          'Planejamento de manutenção e expansão da infraestrutura',
        ],
      },
      {
        titulo: 'Recursos de comunicação e informação',
        dimensao: 'Dimensão 4 — Comunicação',
        indicadores: [
          'Navegação do Portal do Colaborador e do Intrasete',
          'Conteúdo disponível no Intrasete',
          'Efetividade dos canais internos (comunicados, e-mails)',
          'Divulgação das normas institucionais',
          'Relevância das informações dos setores',
          'Eficiência da comunicação entre setores',
        ],
      },
      {
        titulo: 'Avaliação dos serviços',
        dimensao: 'Dimensões 6 e 7 — Gestão e Infraestrutura',
        indicadores: [
          'CDAP — Desenvolvimento Acadêmico e Profissional',
          'Gerência de Marketing (GMKT)',
          'Gerência de Gente e Carreira (GGC)',
          'Gerência Administrativo Financeira (GAF)',
          'Gerências de PROAD e PROEN',
          'Gerência de Tecnologia (GTEC), Intrasete e Portal do Colaborador',
          'Segurança, manutenção, copa, limpeza e conservação (GSAC)',
        ],
      },
      {
        titulo: 'Valorização profissional e autoavaliação',
        dimensao: 'Dimensão 5 — Políticas de Pessoal',
        indicadores: [
          'Aproveitamento do potencial profissional',
          'Política de promoção funcional e treinamentos',
          'Participação nas reuniões de planejamento do setor',
          'Agilidade e qualidade na solução de problemas',
          'Pontualidade e trabalho em equipe',
          'Grau de comprometimento com a instituição',
        ],
      },
    ],
  },
];

const StorytellingPersonasSection = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="secondary" className="w-fit gap-2">
          <UserRound className="h-3.5 w-3.5" />
          Storytelling por persona
        </Badge>
        <h2 className="text-2xl font-semibold leading-tight text-foreground lg:text-3xl">
          Quem avalia, com que objetivo e quais indicadores respondem — triênio 2024–2026
        </h2>
        <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
          Cada persona da comunidade acadêmica responde a um instrumento próprio. Abaixo estão o objetivo da avaliação, o perfil do respondente e os indicadores avaliados por bloco, conforme os instrumentos presenciais e EAD vigentes no triênio.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {personas.map((persona) => (
          <Card key={persona.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base">{persona.nome}</CardTitle>
                <Badge variant="outline">{persona.modalidade}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  Objetivo
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">{persona.objetivo}</p>
              </div>
              <div className="space-y-1">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <UserRound className="h-3.5 w-3.5 text-primary" />
                  Perfil
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">{persona.perfil}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Participação no triênio</h3>
                {persona.participacao.map((item) => (
                  <div key={item.ano} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.ano}</span>
                      <span className="font-medium text-foreground">{item.valor === null ? '—' : percent(item.valor)}</span>
                    </div>
                    <Progress value={item.valor ?? 0} className="h-1.5" />
                  </div>
                ))}
              </div>
              <Accordion type="single" collapsible className="w-full">
                {persona.blocos.map((bloco) => (
                  <AccordionItem key={bloco.titulo} value={bloco.titulo}>
                    <AccordionTrigger className="text-left text-sm">
                      <span className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4 shrink-0 text-primary" />
                        {bloco.titulo}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2 text-xs font-medium text-primary">{bloco.dimensao}</p>
                      <ul className="grid gap-2 text-sm text-muted-foreground">
                        {bloco.indicadores.map((indicador) => (
                          <li key={indicador} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            {indicador}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StorytellingPersonasSection;
