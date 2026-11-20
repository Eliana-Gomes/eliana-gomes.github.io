# Guia do servidor da Parlia

O app vai falar com um servidor nosso, na Cloudflare.
O servidor guarda a chave da Anthropic.
As alunas não precisam mais colar chave nenhuma.

Regra de ouro: as chaves e os segredos NUNCA vão para o chat, para o terminal ou para arquivos.
Eles entram só no painel da Cloudflare.
A única exceção é a Site Key do Turnstile: ela é pública, pode colar no chat.

Faça um passo de cada vez.
No fim de cada parte, escreva "feito" no chat.

---

## Parte A — Conta na Cloudflare

1. Abra https://dash.cloudflare.com/sign-up
2. Crie a conta com o seu e-mail e uma senha.
3. Abra o e-mail da Cloudflare e confirme a conta.
4. Não precisa de cartão de crédito.
5. Não precisa de domínio próprio.
6. Escreva "feito" no chat.

### Depois da parte A (eu faço)

1. Eu rodo o comando de login da Cloudflare.
2. O navegador vai abrir sozinho numa página da Cloudflare.
3. Você clica em "Allow" (Permitir).
4. Eu publico o servidor, ainda sem as chaves.
5. Eu digo o endereço dele (termina em .workers.dev).
6. Feito em 19/11/2026. O endereço é: https://parlia-servidor.parlia-servidor.workers.dev

---

## Parte B — Turnstile (o anti-robô)

1. No painel da Cloudflare, procure "Turnstile" no menu da esquerda.
2. Se não achar, use a busca no alto do painel e digite "Turnstile".
3. Clique em "Add widget".
4. Em "Widget name", escreva: Parlia
5. Em "Hostname", escreva: eliana-gomes.github.io
6. Clique em "Add" ao lado do hostname.
7. Em "Widget Mode", escolha: Invisible
8. Em "Pre-clearance", deixe: No
9. Clique em "Create".
10. Aparecem duas chaves: "Site Key" e "Secret Key".
11. Copie a Site Key e cole aqui no chat. (Ela é pública.)
12. NÃO cole a Secret Key no chat.
13. Copie a Secret Key.
14. No menu da esquerda, abra "Workers & Pages".
15. Clique em "parlia-servidor".
16. Abra a aba "Settings".
17. Procure "Variables and Secrets" e clique em "Add".
18. Em "Type", escolha: Secret
19. Em "Variable name", escreva: TURNSTILE_SECRET
20. Em "Value", cole a Secret Key.
21. Clique em "Deploy" (ou "Save").
22. Escreva "feito" no chat.

---

## Parte C — Chave nova da Anthropic

1. Abra https://console.anthropic.com e entre na sua conta.
2. Abra "API Keys".
3. Clique em "Create Key".
4. Em "Name", escreva: parlia-servidor
5. Crie uma chave NOVA. Não use a chave que você já tem.
6. Copie a chave. Ela só aparece uma vez.
7. NÃO cole a chave no chat nem em nenhum arquivo.
8. Volte ao painel da Cloudflare.
9. Abra "Workers & Pages" → "parlia-servidor" → "Settings".
10. Em "Variables and Secrets", clique em "Add".
11. Em "Type", escolha: Secret
12. Em "Variable name", escreva: ANTHROPIC_API_KEY
13. Em "Value", cole a chave.
14. Clique em "Deploy" (ou "Save").
15. Recomendado: no Console da Anthropic, abra "Limits".
16. Ponha um limite de gasto mensal (por exemplo, US$ 10).
17. Assim, mesmo com algum problema, a conta nunca passa desse valor.
18. Escreva "feito" no chat.

---

## Parte D — Segredo de assinatura (SESSION_SECRET)

1. Eu gero um valor aleatório no seu computador.
2. O valor vai direto para a área de transferência (o "copiar").
3. Ele não aparece no chat, no terminal nem em arquivo.
4. Eu aviso quando estiver pronto.
5. No painel da Cloudflare, abra "Workers & Pages" → "parlia-servidor" → "Settings".
6. Em "Variables and Secrets", clique em "Add".
7. Em "Type", escolha: Secret
8. Em "Variable name", escreva: SESSION_SECRET
9. Clique em "Value" e aperte Ctrl+V.
10. Clique em "Deploy" (ou "Save").
11. Depois, copie qualquer outra palavra (para tirar o segredo da área de transferência).
12. Escreva "feito" no chat.

---

## Parte D2 — Chave de leitura do uso (STATS_KEY)

Esta chave abre a página do uso do dia (chamadas e custo).
Sem ela, a página responde "Not found", como se não existisse.

1. Eu gero outro valor aleatório e ponho na área de transferência.
2. Eu aviso quando estiver pronto.
3. No painel da Cloudflare: "Workers & Pages" → "parlia-servidor" → "Settings".
4. Em "Variables and Secrets", clique em "Add".
5. Em "Type", escolha: Secret
6. Em "Variable name", escreva: STATS_KEY
7. Clique em "Value" e aperte Ctrl+V.
8. Clique em "Deploy" (ou "Save").
9. Agora guarde a mesma chave para você: abra o gerenciador de senhas (ou um bloco de notas privado) e aperte Ctrl+V.
10. Não cole essa chave no chat.
11. Depois, copie qualquer outra palavra (para tirar a chave da área de transferência).
12. Escreva "feito" no chat.

### Como abrir o uso do dia

1. Pegue o endereço do servidor que eu te passei (termina em .workers.dev).
2. Acrescente no fim: /api/stats?key=
3. Logo depois do "=", cole a sua chave de leitura.
4. Fica assim: https://parlia-servidor.parlia-servidor.workers.dev/api/stats?key=SUA-CHAVE
5. Abra esse endereço no navegador.
6. Aparecem os últimos dias: "calls" (chamadas), "costUsd" (custo em dólares) e "refused" (recusas por limite).
7. Dica: salve esse endereço completo como favorito, só no seu navegador.
8. Não mande esse endereço para ninguém (ele contém a chave).

---

## Parte E — Ligar o app ao servidor (eu faço)

1. Eu ponho no app o endereço do servidor e a Site Key.
2. Eu testo o servidor.
3. Eu publico a versão nova.
4. Você abre o app no celular com ?v=N no fim do endereço.
5. O app não pede mais chave.

---

## Para você, no dia a dia

- Uso do dia (número de chamadas e custo, sem conversas): veja "Como abrir o uso do dia", na Parte D2.
- Para testar com a sua própria chave: Perfil → Avançado → "Usar minha própria chave da API".
- O diagnóstico (5 toques na versão, no fim do Perfil) mostra se o app usa o servidor ou a chave própria.
- Se quiser trocar a chave da Anthropic: crie uma nova no Console, troque o ANTHROPIC_API_KEY na Cloudflare e apague a antiga no Console.

## Limites do servidor

- Cada aparelho: até 300 chamadas por dia.
- Cada endereço de internet (IP): até 600 chamadas por dia.
- Gasto total: até US$ 1,00 por dia. Depois disso, o servidor para até o dia seguinte.
- Quando para, a Lia diz: "A Lia precisa descansar um pouco. Volte amanhã 🙂".
- Os dias contam pelo horário UTC (21h em Brasília, meia-noite em Lisboa no inverno).

## Quanto custa

- Cloudflare: zero. Workers, Durable Objects e Turnstile estão no plano gratuito.
- O plano gratuito aguenta 100 mil pedidos por dia. O teto de US$ 1 chega muito antes disso.
- Anthropic: no máximo US$ 1 por dia, ou cerca de US$ 30 por mês, mesmo com muito uso.
