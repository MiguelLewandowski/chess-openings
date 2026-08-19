# Fora de rota (escopo do TCC1)

O prefixo `_` faz do diretório uma **pasta privada** do App Router: o código continua no
repositório e continua sendo compilado e type-checked, mas o Next **não cria a rota**, então
`/style-quiz` responde 404.

O teste de estilo está fora do escopo do TCC1 e não entra na rodada de testes com usuários.

**Para reativar:** renomeie a pasta para `style-quiz` e restaure os links removidos em
`app/page.tsx` e `app/openings/UserProfile.tsx`.
