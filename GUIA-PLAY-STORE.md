# Guia da Parlia na Google Play (teste fechado)

Um passo por linha.
Faça uma parte de cada vez.
Os nomes dos botões estão como aparecem na Play Console em português.

O arquivo do app fica em:
C:\Users\HP 840 G1\parlia-android\app-release-bundle.aab

---

## Parte A — Conta de desenvolvedor

1. Abra https://play.google.com/console
2. Entre com a conta Google que vai ser a dona do app.
3. Se ainda não tiver conta de desenvolvedor, crie uma (taxa única de 25 dólares).
4. Escolha conta "Pessoal" (ou "Organização", se a Luz em Movimento for uma empresa registada).
5. Confirme a identidade quando a Google pedir (documento e telefone).
6. Atenção: contas pessoais novas precisam de um teste fechado com pelo menos 12 testadores durante 14 dias seguidos antes de poderem publicar para todos.

---

## Parte B — Criar o app

1. Na Play Console, toque em "Criar app".
2. Nome do app: Parlia
3. Idioma padrão: Português (Brasil) – pt-BR
4. App ou jogo: App
5. Gratuito ou pago: Gratuito
6. Marque as declarações (políticas do programa e leis de exportação).
7. Toque em "Criar app".

---

## Parte C — Assinatura de apps pela Google (obrigatória)

1. No menu da esquerda: "Testar e lançar" → "Configuração" → "Integridade do app" (ou "Assinatura de apps").
2. Aceite que a Google guarde a chave de assinatura do app ("Assinatura de apps do Google Play").
3. A nossa chave (parlia-upload.keystore) passa a ser a "chave de upload". Guarde-a sempre (veja o fim deste guia).

---

## Parte D — Subir o .aab no teste fechado

1. Menu: "Testar e lançar" → "Testes" → "Teste fechado".
2. Toque em "Criar faixa" (ou use a faixa "Alfa" que já existe).
3. Toque em "Criar versão".
4. Em "App bundles", toque em "Enviar" e escolha o arquivo app-release-bundle.aab.
5. Nome da versão: 1.0.0 (1)
6. Notas da versão (pt-BR): Primeira versão de teste da Parlia.
7. Toque em "Próxima" e depois em "Salvar".
8. Ainda não envie para revisão: faça antes as partes E a H.

---

## Parte E — MUITO IMPORTANTE: impressão digital da Google no assetlinks

Sem isto, o app abre com a barra de endereço do navegador por cima.

1. Depois de subir o .aab, vá a "Testar e lançar" → "Configuração" → "Integridade do app" → "Assinatura de apps".
2. Procure "Certificado da chave de assinatura do app".
3. Copie o valor "Impressão digital do certificado SHA-256" (começa por letras e números separados por dois-pontos).
4. Cole esse valor aqui no chat. Ele é público (não é segredo).
5. O Claude acrescenta-o ao arquivo assetlinks.json e publica.
6. Só depois disso o app abre em tela cheia, sem barra do navegador.

---

## Parte F — Conteúdo do app (menu "Política" → "Conteúdo do app")

### Política de privacidade
1. Endereço: https://eliana-gomes.github.io/privacidade.html

### Acesso ao app
1. Escolha: "Todas as funcionalidades estão disponíveis sem acesso especial".
2. (O app não tem login.)

### Anúncios
1. Escolha: "Não, o app não contém anúncios".

### Classificação de conteúdo
1. Toque em "Iniciar questionário".
2. E-mail de contacto: parlia.app@gmail.com
3. Categoria: "Referência, notícias ou educação".
4. Violência, sexo, linguagem imprópria, drogas, jogos de azar: responda "Não" a tudo.
5. "Os usuários podem interagir ou trocar conteúdo?": responda "Não" (a conversa é só com a Lia, a IA; não há contacto entre pessoas).
6. Pergunta sobre conteúdo gerado por IA: responda "Sim" e diga que é uma tutora de idiomas com IA.
7. Salve e envie o questionário.

### Público-alvo e conteúdo
1. Faixa etária: marque só "18 anos ou mais".
2. "O app pode atrair crianças?": Não.

### App de notícias
1. Não.

### Apps governamentais / financeiros / de saúde
1. Não, a tudo.

### Segurança dos dados (coerente com a nossa política de privacidade)
1. "O app coleta ou compartilha algum dos tipos de dados obrigatórios?": Sim.
2. "Todos os dados coletados são criptografados em trânsito?": Sim (HTTPS).
3. "Os usuários podem pedir a exclusão dos dados?": Sim (Perfil → Apagar este perfil; e o e-mail parlia.app@gmail.com).
4. Tipos de dados a declarar:
5. — "Mensagens" → "Outras mensagens no app": Coletados. Uso: "Funcionalidade do app". Processados de forma temporária (o texto da conversa vai à Anthropic para gerar a resposta; o nosso servidor não o guarda).
6. — "Informações pessoais" → "Nome": Coletado (vai nas instruções da Lia). Uso: "Funcionalidade do app". Processado de forma temporária.
7. — "Informações pessoais" → "Outras informações" (cidade, interesses, nível): Coletadas. Uso: "Funcionalidade do app" e "Personalização". Processadas de forma temporária.
8. — "Atividade no app" → "Outras ações": não declarar (contamos só números por aparelho, sem identificar a pessoa).
9. — "Identificadores do dispositivo ou outros IDs": Coletado (número aleatório do aparelho e resumo do IP, para limitar abusos). Uso: "Segurança, conformidade e prevenção de fraudes". Apagados no dia seguinte.
10. — Áudio: NÃO declarar como coletado (o app não grava nem envia áudio; o reconhecimento de voz é do sistema/Chrome).
11. — Fotos: NÃO declarar (a foto do perfil nunca sai do aparelho).
12. Compartilhamento com terceiros: marque que o texto da conversa é "compartilhado" com um prestador de serviços (Anthropic) para a funcionalidade do app. Se a Play Console aceitar, use a opção de "prestador de serviços", que não conta como compartilhamento.
13. Salve.

---

## Parte G — Página da loja (menu "Crescer" → "Presença na loja" → "Página principal da loja")

1. Nome do app: Parlia
2. Descrição curta (até 80 caracteres): Converse por voz com a Lia e pratique idiomas com correção gentil.
3. Descrição completa: escreva com as suas palavras (o Claude pode ajudar).
4. Ícone do app (512 x 512): C:\Users\HP 840 G1\parlia-android\store_icon.png
5. Gráfico de destaque (1024 x 500): peça ao Claude para criar a partir do logotipo.
6. Capturas de tela do celular: pelo menos 2 (tire no celular com o app aberto).
7. Categoria: Educação.
8. E-mail de contacto: parlia.app@gmail.com
9. Site: https://eliana-gomes.github.io/eliana-voz.html
10. Salve.

---

## Parte H — Convidar testadores

1. Menu: "Testar e lançar" → "Testes" → "Teste fechado" → a sua faixa → aba "Testadores".
2. Toque em "Criar lista de e-mails".
3. Nome da lista: Testadores Parlia
4. Escreva os e-mails (contas Google) dos testadores, separados por vírgula.
5. Salve.
6. Em "Comentários", ponha o e-mail parlia.app@gmail.com.
7. Copie o "Link de participação" e mande para os testadores.
8. Cada testador abre o link no celular, toca em "Participar do teste" e depois instala pela Play Store.

---

## Parte I — Enviar para revisão

1. Volte à versão do teste fechado.
2. Toque em "Revisar versão".
3. Corrija os avisos que aparecerem (a Play Console diz o que falta).
4. Toque em "Iniciar lançamento para o teste fechado".
5. A primeira revisão da Google pode levar alguns dias.

---

## Teste do microfone e da voz no app instalado

1. Instale pela Play Store (link de participação).
2. Abra a Parlia: deve abrir em tela cheia, sem barra de endereço (só depois da Parte E).
3. Vá a Conversar e toque no microfone.
4. O Chrome pergunta se a Parlia pode usar o microfone: toque em "Permitir".
5. Fale uma frase: ela deve aparecer escrita.
6. A Lia deve responder em voz alta.
7. Se o microfone não funcionar: Configurações do Android → Apps → Chrome → Permissões → Microfone → Permitir. Depois, dentro da Parlia: menu ⋮ (ou "Configurações do site") → Microfone → Permitir.

---

## Cópia de segurança da chave (fazer hoje)

Se perder a chave de upload, a Google pode trocá-la, mas demora e exige pedido ao suporte. Guarde duas cópias.

1. Abra a pasta C:\Users\HP 840 G1\parlia-chaves
2. Copie o arquivo parlia-upload.keystore para um pen drive.
3. Guarde o pen drive num lugar seguro, longe do computador.
4. Faça também uma cópia na nuvem: ponha o arquivo numa pasta privada do Google Drive (ou outro serviço com verificação em duas etapas).
5. Não copie para a nuvem o arquivo COFRE-PARLIA.txt: a senha fica só no gerenciador de senhas e no cofre deste computador.
6. Guarde a senha da keystore no gerenciador de senhas (já está no COFRE-PARLIA.txt).
7. Teste uma vez por ano: confirme que o arquivo do pen drive ainda abre (o tamanho deve ser 2648 bytes).

---

## Versões novas do app

1. Só é preciso um .aab novo quando mudar o ícone, o nome, as cores ou o endereço.
2. Mudanças no site (eliana-voz.html) aparecem sozinhas no app, sem nova versão na loja.
3. Para um .aab novo, peça ao Claude: ele aumenta o número da versão e assina com a mesma chave.
