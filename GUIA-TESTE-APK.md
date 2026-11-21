# Instalar a Parlia no seu celular (APK de teste)

Um passo por linha.
Este APK é só para o seu teste. Para os testadores, use a Play Store (GUIA-PLAY-STORE.md).

---

## Parte A — Antes de instalar (uma vez só, no painel da Cloudflare)

Dentro do app, a Parlia corre no endereço "localhost". O anti-robô (Turnstile) precisa de o conhecer.

1. Abra https://dash.cloudflare.com
2. No menu da esquerda, abra "Turnstile".
3. Toque no widget "Parlia".
4. Em "Hostname Management" (ou "Domínios"), toque em "Add hostname".
5. Escreva: localhost
6. Salve.
7. Sem este passo, o app mostra "A Lia não está disponível agora".

---

## Parte B — Levar o APK para o celular

O arquivo fica no computador em:
C:\Users\HP 840 G1\parlia-app\saida\Parlia-1.0.3-codigo4-site-v92-teste.apk

1. Abra o Google Drive no computador (drive.google.com).
2. Arraste o arquivo .apk para uma pasta sua do Drive.
3. No celular, abra o app Google Drive.
4. Toque no arquivo Parlia-…-teste.apk.
5. Toque em "Instalar" (ou "Abrir").

(Também pode ligar o celular ao computador com cabo USB e copiar o arquivo para a pasta "Download".)

---

## Parte C — Permitir a instalação

O Android pergunta se pode instalar apps desta origem.

1. Toque em "Configurações" na mensagem.
2. Ative "Permitir desta fonte".
3. Volte e toque em "Instalar".
4. Se aparecer um aviso do Play Protect, toque em "Mais detalhes" e depois em "Instalar mesmo assim".
5. Toque em "Abrir".

---

## Parte D — Teste rápido

1. A Parlia abre com a tela petróleo e o logotipo.
2. Vá ao Perfil e role até ao fim.
3. Deve aparecer: "Parlia v92 · …" e, por baixo, "App 1.0.3 (código 4) · feito do site v92".
4. Vá a Conversar.
5. A Lia fala (voz do celular).
6. Toque no microfone.
7. Aparece a nossa mensagem "A Lia precisa do microfone" → toque em "Continuar".
8. O Android pergunta se a Parlia pode gravar áudio → toque em "Durante o uso do app".
9. Fale uma frase. Ela aparece escrita enquanto fala.
10. Faça uma pausa de 2 ou 3 segundos e continue a falar: o microfone continua a ouvir, sem bip.
11. Toque em ⏹: a frase inteira vai para a Lia.
12. A Lia responde em voz alta.

---

## Parte F — Testes da versão 1.0.3 (fala)

1. Frase longa: na Conversa livre, toque no microfone e fale uns 10 segundos, com 2 pausas no meio (ex.: «Je fais du sport… le matin… avant le travail»).
2. Durante as pausas não deve tocar nenhum bip, e o texto ao vivo deve ir crescendo, sem perder o começo.
3. Toque em ⏹: a frase INTEIRA vai para a Lia e o app fica na conversa (não volta ao Início).
4. Repita na Conversa guiada.
5. Sem falar: toque no microfone, espere 5 segundos em silêncio e toque em ⏹: aparece «Não ouvi nada. Toque e fale de novo.» e fica na conversa.
6. Cancelar: durante a escuta, o link «✕ Cancelar esta frase» fica em cima, à esquerda, longe do ⏹. Toque nele: nada é enviado.
7. Som: depois de terminar, a voz da Lia e o som de marimba voltam normais; o volume do telemóvel (música, notificações) fica como estava.
8. Nível: com o francês em A1, abra a Conversa livre: a Lia deve abrir com uma saudação curta e UMA pergunta simples, e responder sempre com frases curtas.
9. Se algo correr mal: Perfil → 5 toques em «Parlia v92» → código → «Copiar registro» → mande-me o texto. A secção «FALA» mostra o que aconteceu (início, pedaços, reinícios, fim e para onde foi o texto).
10. Se o app fechar a meio de uma frase, ao reabrir e entrar em Conversar a frase aparece na caixa de texto, com o aviso «A sua última frase foi recuperada».

---

## Parte E — Teste da denúncia (⚑)

1. Em Conversar, espere uma resposta da Lia.
2. Por baixo da resposta, à direita, toque no ⚑ (pequeno, ao lado de 🔊 🌐 ⭐).
3. Abre "Denunciar esta resposta".
4. Toque em "Enviar" sem escolher nada: aparece "Escolha um motivo.".
5. Escolha "Outro motivo" e escreva no comentário: TESTE.
6. Toque em "Enviar".
7. Aparece "Obrigada. Vamos analisar." e o ⚑ dessa mensagem fica vermelho (já não abre de novo).
8. Para testar sem internet: ponha o celular em modo avião, denuncie outra resposta e toque em "Enviar": aparece "Não foi possível enviar agora. Tente de novo mais tarde.".
9. No computador, abra o link das denúncias (no COFRE-PARLIA.txt) e confirme que a denúncia "TESTE" aparece no topo.

---

## Se algo não funcionar

1. A Lia não fala: Configurações do Android → Sistema → Idiomas → "Saída de texto para fala" → confirme o "Mecanismo do Google" e instale a voz do idioma.
2. O microfone não ouve: Configurações → Apps → Parlia → Permissões → Microfone → "Permitir durante o uso".
3. Reconhecimento de voz em falta: instale (ou atualize) o app "Google" na Play Store.
4. "A Lia não está disponível agora": confirme a Parte A (localhost no Turnstile).
5. Diagnóstico: Perfil → 5 toques em "Parlia v92" → código → "Copiar registro" e mande-me o texto.

---

## Atualizar o app de teste

1. Peça ao Claude um APK novo.
2. Instale por cima do anterior (os dados ficam).
3. O app de teste e o da Play Store usam a mesma chave: pode passar de um para o outro sem perder dados.
