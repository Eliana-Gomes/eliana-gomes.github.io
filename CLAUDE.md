# Tutora de Voz — Luz em Movimento

App de conversação para praticar idiomas (espanhol, inglês, francês, italiano) por voz, com correção de erros. Publicado no GitHub Pages: https://eliana-gomes.github.io/eliana-voz.html

## Arquivos
- `eliana-voz.html` — o app inteiro (HTML, CSS e JavaScript num só arquivo).
- `tutora-manifest.json`, `tutora-icon-192.png`, `tutora-icon-512.png` — instalação como app no telemóvel (PWA).
- O resto do repositório é o site pessoal da Eliana: não mexer sem pedido.

## Como funciona
- IA: API da Anthropic chamada direto do navegador, modelo `claude-haiku-5-5`, `thinking: { type: 'disabled' }`, `max_tokens: 1024`.
- A chave API e o perfil (nome, cidade, nível por idioma, variante do português) ficam no `localStorage` de cada telemóvel.
- Voz: reconhecimento do Chrome (Web Speech API, modo contínuo, envio só ao tocar ⏹, botão "Cancelar esta frase") e leitura pela síntese de voz do aparelho (prefere vozes "Natural"/"Google").
- Avatar SVG animado, fixo no topo: pisca, mexe a boca ao falar, brilha em verde ao ouvir.

## Regras da tutora (não quebrar)
- Corrige só erros reais. Não corrige frases certas, alternativas de estilo, hesitações ("eh", "pues") nem palavras mal transcritas pelo microfone (essas viram linha 🗣️ de pronúncia).
- Formato da resposta: linhas `📝 errado → certo · explicação curta em português` e `✅ frase corrigida`.
- Quando há erro: a tutora fala "Mejor di: … Y no: …", mostra a caixa de correção ANTES do texto, e pede para repetir só o trecho corrigido ("Repite conmigo 🔁: «…»"). Não continua o tema antes disso.
- Modo repetição: avalia só o trecho, tolera erros do microfone, máximo 2 tentativas, depois "¡Correcto!" e segue a conversa. Marcador interno `🎯 OK` / `🎯 DE NOVO` nunca aparece na tela.
- Explicações sempre em português (do Brasil ou de Portugal, conforme o perfil).

## Fluxo de trabalho
- Depois de cada mudança: testar a sintaxe do JavaScript, fazer commit com mensagem clara em português e push para `main`.
- O GitHub Pages leva alguns minutos para publicar; para testar no telemóvel usar `?v=N` no fim do endereço.

## Futuro (ainda não fazer)
Versão produto para clientes: servidor próprio com a chave da API, login, assinatura, limite de uso por pessoa e política de privacidade (RGPD).
