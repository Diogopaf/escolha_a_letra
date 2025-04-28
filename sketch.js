
// Define o alfabeto maiúsculo
const uppercaseAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
let remainingLetters = []; // Letras que ainda não foram mostradas
let currentMode = 'UPPERCASE_TARGET'; // Modo inicial: mostra maiúscula, opções minúsculas
let alternatingMode = false; // Indica se está no modo de alternância (e timer ativo)
let targetLetter = ''; // A letra grande a ser exibida
let options = []; // As 5 opções de letras
let correctAnswer = ''; // A resposta correta entre as opções
let optionBoxes = []; // Armazena as posições e tamanhos das caixas de opção para cliques
let disabledOptionsIndices = []; // Armazena os índices das opções erradas clicadas nesta rodada

const NUM_OPTIONS = 5; // Número de opções a serem exibidas
const STARTING_LIVES = 5; // Número inicial de vidas
const ROUND_TIME = 5; // Tempo em segundos para cada rodada (quando ativo)

// Variáveis de estado do jogo
let score = 0;
let lives = STARTING_LIVES;
let timerValue = ROUND_TIME;
let timerStartTime = 0;
let gameOver = false;

// --- Variáveis de Feedback Visual (Flash) ---
let flashEndTime = 0; // Timestamp de quando o flash deve terminar
const originalBg = 240; // Cor de fundo original
let flashBg; // Cor do flash (será definida dinamicamente)
let flashDuration = 150; // Duração padrão do flash em ms

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('monospace'); // Define uma fonte monoespaçada para melhor alinhamento
  resetGame(); // Prepara o primeiro turno do jogo
  flashBg = color(originalBg); // Inicializa flashBg com a cor original
}

// A função draw principal, agora com a lógica de flash integrada
function draw() {
  let currentBg = color(originalBg); // Começa com a cor de fundo padrão

  // --- Lógica do Flash ---
  if (millis() < flashEndTime) {
    let flashProgress = (flashEndTime - millis()) / flashDuration;
    currentBg = lerpColor(color(originalBg), flashBg, flashProgress);
  }
  // --- Fim da Lógica do Flash ---

  background(currentBg); // Define o fundo (original ou com flash)

  // --- Conteúdo Original do Draw ---
  drawHUD();

  if (gameOver) {
    // --- Tela de Game Over ---
    drawGameOverScreen();
    return; // Não desenha mais nada se o jogo acabou
  }

  // --- Lógica do Timer (Apenas se alternatingMode for true) ---
  updateTimer();

  // --- Desenha Elementos do Jogo Ativo ---
  drawGameElements();
  // --- Fim do Conteúdo Original do Draw ---
}

// Desenha a tela de Game Over
function drawGameOverScreen() {
    fill(200, 0, 0); // Vermelho escuro
    textSize(80);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width / 2, height / 3);

    fill(0);
    textSize(40);
    text(`Pontuação Final: ${score}`, width / 2, height / 2);

    textSize(25);
    text("Clique para reiniciar", width / 2, height * 2 / 3);
}

// Desenha os elementos do jogo quando ativo
function drawGameElements() {
    // Desenha a letra alvo grande no centro superior
    fill(0);
    textSize(150);
    textAlign(CENTER, CENTER);
    text(targetLetter, width / 2, height / 3);

    // Desenha as opções abaixo da letra alvo
    textSize(60);
    textAlign(CENTER, CENTER);
    let optionWidth = width / (NUM_OPTIONS + 1); // Calcula o espaçamento horizontal

    for (let i = 0; i < options.length; i++) {
        let x = optionWidth * (i + 1);
        let y = height * 2 / 3;

        // Define a cor da opção: cinza se desabilitada, normal caso contrário
        if (disabledOptionsIndices.includes(i)) {
            fill(180); // Cinza para desabilitada
        } else {
            fill(50); // Cor normal
        }
        text(options[i], x, y);
    }
}


// Função para ativar o flash de fundo
function flashBackground(r, g, b, durationMs = 150) {
  flashBg = color(r, g, b); // Define a cor do flash
  flashDuration = durationMs; // Define a duração
  flashEndTime = millis() + flashDuration; // Calcula quando o flash deve terminar
}


// Desenha as informações de Score, Vidas e Timer (se ativo)
function drawHUD() {
  push(); // Isola as configurações de estilo do HUD
  fill(0);
  textSize(24);
  textAlign(LEFT, TOP);
  text(`Pontuação: ${score}`, 20, 20);
  textAlign(RIGHT, TOP);
  text(`Vidas: ${lives}`, width - 20, 20);

  // Desenha o Timer APENAS se alternatingMode for true
  if (alternatingMode) {
    textAlign(CENTER, TOP);
    let timerColor = color(0); // Preto por padrão

    // Muda a cor do timer se estiver acabando ou se já acabou mas a rodada não avançou
    if (timerValue <= 1.5) {
         timerColor = color(255, 0, 0); // Vermelho
    }
    fill(timerColor);
    textSize(32);
    text(timerValue.toFixed(1), width / 2, 20); // Mostra o tempo com uma casa decimal
  }
  pop(); // Restaura as configurações de estilo anteriores
}

// Atualiza o valor do timer e verifica se o tempo acabou (APENAS se alternatingMode for true)
function updateTimer() {
  if (gameOver || !alternatingMode) return;

  let elapsed = (millis() - timerStartTime) / 1000;
  // Atualiza o timer apenas se for maior que 0, para não continuar contando negativo
  if (timerValue > 0) {
      timerValue = max(0, ROUND_TIME - elapsed);
  }


  // Verifica se o tempo esgotou NESTE frame
  if (timerValue <= 0 && !gameOver) {
      // Verifica se o timeout já não foi tratado (evita chamar múltiplas vezes)
      // Uma forma simples é verificar se a penalidade já foi aplicada,
      // mas uma flag seria mais robusta. Por ora, vamos chamar handleIncorrectAnswer.
      // handleIncorrectAnswer tem sua própria guarda contra gameOver.

      // Considera tempo esgotado como erro (true = timeOut)
      handleIncorrectAnswer(true);

      // SE O JOGO NÃO ACABOU APÓS A PENALIDADE DO TIMEOUT, AVANÇA A RODADA
      // Isso difere do clique errado, onde o jogador fica na mesma letra.
      // Timeout força o avanço para evitar ficar preso.
      if (!gameOver) {
          console.log("Tempo esgotado, avançando para a próxima rodada.");
          nextRound();
      }
  }
}

// Função chamada quando o mouse é pressionado
function mousePressed() {
  if (gameOver) {
    resetGame();
    return;
  }

  // Verifica cliques nas opções apenas se o jogo não acabou
  for (let i = 0; i < optionBoxes.length; i++) {
    // Ignora o clique se a opção já estiver desabilitada nesta rodada
    if (disabledOptionsIndices.includes(i)) {
      continue;
    }

    let box = optionBoxes[i];
    if (mouseX > box.x && mouseX < box.x + box.w && mouseY > box.y && mouseY < box.y + box.h) {
       if (options[i] === correctAnswer) {
         // --- Acertou! ---
         score++;
         flashBackground(0, 200, 0, 100); // Flash VERDE
         nextRound(); // Avança para a próxima rodada
       } else {
         // --- Errou! ---
         // Marca a opção como desabilitada para esta rodada
         disabledOptionsIndices.push(i);
         // Aplica a penalidade (perde vida, ponto, flash vermelho)
         handleIncorrectAnswer(false); // false = não foi timeout
         // !! NÃO CHAMA nextRound() AQUI !!
       }
       // Importante: Sair do loop após processar um clique válido (certo ou errado)
       // para não processar múltiplos cliques em opções sobrepostas acidentalmente.
       return;
    }
  }
}

// Função para lidar com resposta incorreta (clique errado ou tempo esgotado)
function handleIncorrectAnswer(timeOut = false) {
     // Guarda para não processar se já for game over ou se for timeout
     // e o timer já zerou (evitar múltiplas penalidades por timeout)
    if (gameOver) return;

    lives--;
    score = max(0, score - 1); // Perde um ponto, mas não fica negativo
    flashBackground(255, 0, 0, 150); // Flash VERMELHO

    // Mensagem de log
    if (timeOut && alternatingMode) {
        console.log(`Tempo esgotado! Vidas restantes: ${lives}`);
    } else if (!timeOut) { // Apenas loga erro de clique se não for timeout
        console.log(`Erro no clique! Opção desabilitada. Vidas restantes: ${lives}`);
    }

    // Verifica condição de Game Over APÓS aplicar a penalidade
    if (lives <= 0) {
        gameOver = true;
        console.log("Game Over!");
    }

    // !! REMOVIDO: Não chama nextRound() daqui.
    // O avanço só ocorre em caso de acerto (em mousePressed)
    // ou em caso de timeout (na função updateTimer).
}

// Função para preparar a próxima rodada do jogo
function nextRound() {
  if (gameOver) return; // Não prepara nova rodada se o jogo acabou

  // Limpa a lista de opções desabilitadas para a nova rodada
  disabledOptionsIndices = [];

  // Reinicia o timer para a nova rodada (se estiver no modo alternado)
  timerStartTime = millis();
  timerValue = ROUND_TIME; // Reseta o valor visual do timer

  // --- Lógica de Progressão de Modo e Letras ---
  if (remainingLetters.length === 0) {
    // Acabaram as letras do ciclo atual
    if (alternatingMode === false) { // Se ainda não está no modo alternado
      if (currentMode === 'UPPERCASE_TARGET') { // Terminou o ciclo de Maiúsculas
        console.log("Ciclo Maiúsculo completo. Iniciando Minúsculo.");
        currentMode = 'LOWERCASE_TARGET';
        resetRemainingLetters();
      } else { // Terminou o ciclo de Minúsculas
        console.log("Ciclo Minúsculo completo. Iniciando modo Alternado com Timer!");
        currentMode = 'UPPERCASE_TARGET'; // Começa alternando com Maiúscula
        alternatingMode = true; // ATIVA O MODO ALTERNADO (E O TIMER)
        resetRemainingLetters();
      }
    } else { // Já está no modo alternado e terminou um ciclo
      console.log("Ciclo Alternado completo. Trocando modo e recomeçando.");
      currentMode = (currentMode === 'UPPERCASE_TARGET') ? 'LOWERCASE_TARGET' : 'UPPERCASE_TARGET';
      resetRemainingLetters();
    }
  }

  // Escolhe uma letra aleatória das restantes
  let randomIndex = floor(random(remainingLetters.length));
  let chosenLetter = remainingLetters[randomIndex];

  // Remove a letra escolhida da lista de restantes
  remainingLetters.splice(randomIndex, 1);

  // Define a letra alvo e a resposta correta com base no modo
  let incorrectPool = [];
  if (currentMode === 'UPPERCASE_TARGET') {
    targetLetter = chosenLetter;
    correctAnswer = chosenLetter.toLowerCase();
    incorrectPool = uppercaseAlphabet.map(l => l.toLowerCase()).filter(l => l !== correctAnswer);
  } else { // LOWERCASE_TARGET
    targetLetter = chosenLetter.toLowerCase();
    correctAnswer = chosenLetter;
    incorrectPool = uppercaseAlphabet.filter(l => l !== correctAnswer);
  }

  // Gera as opções
  options = [];
  options.push(correctAnswer);
  shuffle(incorrectPool, true);
  for (let i = 0; i < NUM_OPTIONS - 1 && i < incorrectPool.length; i++) {
    options.push(incorrectPool[i]);
  }

  while(options.length < NUM_OPTIONS && incorrectPool.length > options.length -1) {
      let nextOptionIndex = options.length - 1;
      let nextOption = incorrectPool[nextOptionIndex];
      if(nextOption && !options.includes(nextOption)){
           options.push(nextOption);
      } else {
           break;
      }
  }
  shuffle(options, true);

  // Recalcula as caixas de clique
  calculateOptionBoxes();

  // console.log(`Nova Rodada - Modo: ${currentMode} | Timer Ativo: ${alternatingMode} | Alvo: ${targetLetter} | Opções: ${options} | Correta: ${correctAnswer}`);
}

// Função para calcular as áreas clicáveis das opções
function calculateOptionBoxes() {
  optionBoxes = [];
  textSize(60);
  textAlign(CENTER, CENTER);
  let optionWidth = width / (NUM_OPTIONS + 1);
  let y = height * 2 / 3;
  let textH = 60;

  for (let i = 0; i < options.length; i++) {
    let x = optionWidth * (i + 1);
    let textW = textWidth(options[i]);
    optionBoxes.push({
      x: x - textW / 1.5,
      y: y - textH / 1.5,
      w: textW * 1.5,
      h: textH * 1.5
    });
  }
}

// Função para reiniciar o jogo completamente
function resetGame() {
  score = 0;
  lives = STARTING_LIVES;
  gameOver = false;
  alternatingMode = false;
  currentMode = 'UPPERCASE_TARGET';
  disabledOptionsIndices = []; // Limpa opções desabilitadas
  resetRemainingLetters();
  flashEndTime = 0;
  nextRound(); // Configura a primeira rodada (que também reseta o timer)
  console.log("Jogo Reiniciado! Timer desativado inicialmente.");
}

// Função para preencher 'remainingLetters' com o alfabeto completo e embaralhar
function resetRemainingLetters() {
  remainingLetters = [...uppercaseAlphabet];
  shuffle(remainingLetters, true);
}


// Ajusta o canvas se a janela for redimensionada
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (!gameOver) {
    calculateOptionBoxes(); // Recalcula as posições das opções
  }
}

// Helper function para embaralhar array (Fisher-Yates shuffle)
function shuffle(array, modifyInPlace = false) {
  let R = modifyInPlace ? array : array.slice();
  for (let i = R.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [R[i], R[j]] = [R[j], R[i]];
  }
  return R;
}
