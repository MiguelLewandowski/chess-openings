# Fora de rota (escopo do TCC1)

O prefixo `_` faz do diretório uma **pasta privada** do App Router: o código continua no
repositório e continua sendo compilado e type-checked, mas o Next **não cria a rota**, então
`/blunder` responde 404.

Dois motivos: o Modo Punição está fora do escopo do TCC1 e a tabela `Puzzle` está vazia
desde que o script `import-puzzles` foi removido — um testador cairia num treinador em
branco.

**Para reativar:** popule a tabela `Puzzle` e renomeie a pasta para `blunder`.
