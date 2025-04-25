
// Define o alfabeto maiúsculo
const uppercaseAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
let remainingLetters = []; // Letras que ainda não foram mostradas
let currentMode = 'UPPERCASE_TARGET'; // Modo inicial: mostra maiúscula, opções minúsculas
let alternatingMode = false; // Indica se está no modo de alternância (e timer ativo)
let targetLetter = ''; // A letra grande a ser exibida
let options = []; // As 5 opções de letras
let correctAnswer = ''; // A resposta correta entre as opções
let optionBoxes = []; // Armazena as posições e tamanhos das caixas de opção para cliques

const NUM_OPTIONS = 5; // Número de opções a serem exibidas
const STARTING_LIVES = 5; // Número inicial de vidas
const ROUND_TIME = 5; // Tempo em segundos para cada rodada (quando ativo)

// Variáveis de estado do jogo
let score = 0;
let lives = STARTING_LIVES;
let timerValue = ROUND_TIME;
let timerStartTime = 0;
let gameOver = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('monospace'); // Define uma fonte monoespaçada para melhor alinhamento
  resetGame(); // Prepara o primeiro turno do jogo
}

function draw() {
  background(240); // Fundo claro

  // --- Desenha HUD (Score, Vidas, Timer *condicional*) ---
  drawHUD();

  if (gameOver) {
    // --- Tela de Game Over ---
    fill(200, 0, 0); // Vermelho escuro
    textSize(80);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width / 2, height / 3);

    fill(0);
    textSize(40);
    text(`Pontuação Final: ${score}`, width / 2, height / 2);

    textSize(25);
    text("Clique para reiniciar", width / 2, height * 2 / 3);
    return; // Não desenha mais nada se o jogo acabou
  }

  // --- Lógica do Timer (Apenas se alternatingMode for true) ---
  updateTimer();

  // --- Desenha Elementos do Jogo Ativo ---

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
    // Desenha a letra da opção
    fill(50);
    text(options[i], x, y);
  }
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
     if (timerValue <= 1.5) {
        timerColor = color(255, 0, 0); // Vermelho quando o tempo está acabando
     }
    fill(timerColor);
    textSize(32);
    text(timerValue.toFixed(1), width / 2, 20); // Mostra o tempo com uma casa decimal
  }
  pop(); // Restaura as configurações de estilo anteriores
}

// Atualiza o valor do timer e verifica se o tempo acabou (APENAS se alternatingMode for true)
function updateTimer() {
   if (gameOver || !alternatingMode) return; // Não atualiza o timer se o jogo acabou OU se não está no modo alternado

   let elapsed = (millis() - timerStartTime) / 1000; // Tempo passado em segundos
   timerValue = max(0, ROUND_TIME - elapsed); // Garante que o timer não fique negativo

   if (timerValue <= 0) {
      // Tempo esgotado!
      handleIncorrectAnswer(true); // Considera tempo esgotado como erro (true = timeOut)
   }
}


// Função chamada quando o mouse é pressionado
function mousePressed() {
  if (gameOver) {
    // Se o jogo acabou, o clique reinicia
    resetGame();
    return;
  }

  // Verifica cliques nas opções apenas se o jogo não acabou
  for (let i = 0; i < optionBoxes.length; i++) {
    let box = optionBoxes[i];
    if (mouseX > box.x && mouseX < box.x + box.w && mouseY > box.y && mouseY < box.y + box.h) {
      if (options[i] === correctAnswer) {
        // --- Acertou! ---
        score++; // Ganha um ponto
        flashBackground(0, 200, 0, 100); // Flash verde rápido
        nextRound();
      } else {
        // --- Errou! ---
        handleIncorrectAnswer(false); // Erro por clique (false = not timeOut)
      }
      break; // Impede que verifique outras opções
    }
  }
}

// Função para lidar com resposta incorreta (clique errado ou tempo esgotado)
function handleIncorrectAnswer(timeOut = false) {
    if (gameOver) return; // Não faz nada se já deu game over

    lives--;
    score = max(0, score - 1); // Perde um ponto, mas não fica negativo
    flashBackground(255, 0, 0, 150); // Flash vermelho

    // Mensagem de erro específica para timeout (se o timer estiver ativo)
    if (timeOut && alternatingMode) {
        console.log(`Tempo esgotado! Vidas restantes: ${lives}`);
    } else {
        console.log(`Erro! Vidas restantes: ${lives}`);
    }


    if (lives <= 0) {
        gameOver = true;
        console.log("Game Over!");
        // Não chama nextRound() se o jogo acabou
    } else {
         // Se não for game over, prepara a próxima rodada (mesmo se errou ou tempo esgotou)
         nextRound();
    }
}


// Função para preparar a próxima rodada do jogo
function nextRound() {
   if (gameOver) return; // Não prepara nova rodada se o jogo acabou

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
       // Simplesmente alterna o modo para o próximo ciclo alternado
       currentMode = (currentMode === 'UPPERCASE_TARGET') ? 'LOWERCASE_TARGET' : 'UPPERCASE_TARGET';
       resetRemainingLetters(); // Recarrega o alfabeto para o novo ciclo alternado
    }
  }
  // Não precisa de lógica `else if (alternatingMode)` aqui, pois a alternância principal acontece quando acaba o alfabeto.

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
   // Garante NUM_OPTIONS se possível
   while(options.length < NUM_OPTIONS && incorrectPool.length > options.length -1) {
        let nextOption = incorrectPool[options.length -1];
        if(nextOption && !options.includes(nextOption)){
             options.push(nextOption);
        } else {
            break;
        }
   }
  shuffle(options, true);

  // Recalcula as caixas de clique e reinicia o timer (o timer só será efetivamente usado se alternatingMode for true)
  calculateOptionBoxes();
  timerStartTime = millis(); // Reinicia a contagem para a nova rodada
  timerValue = ROUND_TIME; // Reseta visualmente o timer (mesmo que não seja exibido ainda)

  console.log(`Modo: ${currentMode} | Timer Ativo: ${alternatingMode} | Alvo: ${targetLetter} | Opções: ${options} | Correta: ${correctAnswer} | Restantes: ${remainingLetters.length}`);
}

// Função para calcular as áreas clicáveis das opções
function calculateOptionBoxes() {
  optionBoxes = [];
  textSize(60);
  textAlign(CENTER, CENTER);
  let optionWidth = width / (NUM_OPTIONS + 1);
  let y = height * 2 / 3;
  let textH = 60; // Altura aproximada

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
  alternatingMode = false; // **IMPORTANTE: Reseta para false, timer começa desativado**
  currentMode = 'UPPERCASE_TARGET';
  resetRemainingLetters();
  nextRound(); // Configura a primeira rodada
  console.log("Jogo Reiniciado! Timer desativado inicialmente.");
}

// Função para preencher 'remainingLetters' com o alfabeto completo e embaralhar
function resetRemainingLetters() {
  remainingLetters = [...uppercaseAlphabet];
  shuffle(remainingLetters, true);
}

// --- Feedback Visual ---
let flashEndTime = 0;
let originalBg = 240;
let flashBg;
let flashDuration = 150;

function flashBackground(r, g, b, duration = 150) {
    flashBg = color(r,g,b);
    flashDuration = duration;
    flashEndTime = millis() + flashDuration;
}

// Sobrescreve o background no draw se estivermos no período de flash
const originalDraw = draw;
draw = function() {
    let currentBg = color(originalBg);
    if (millis() < flashEndTime) {
        let flashProgress = (flashEndTime - millis()) / flashDuration;
        currentBg = lerpColor(color(originalBg), flashBg, flashProgress);
    }
    background(currentBg);

    // Chama a lógica de desenho original
    originalDraw();
}

// Ajusta o canvas se a janela for redimensionada
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (!gameOver) {
      calculateOptionBoxes();
  }
}
