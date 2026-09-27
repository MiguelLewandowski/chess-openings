import type { Tutorial } from './pgn'

// "How the pieces move": one lesson per piece plus the special moves. Each lesson shows the
// piece (demonstration) and then gives tasks where any correct move counts. Black only has
// its king (and a pawn or two) and moves in between, because chess alternates turns and
// every position needs both kings.
export const PRIMEIROS_PASSOS: Tutorial = {
  studyName: 'Primeiros passos: como as peças se movem',
  lessons: [
    {
      title: 'O peão',
      demo: {
        fen: '7k/8/3p4/8/8/8/4P3/4K3 w - - 0 1',
        moves: [
          { san: 'e4', comment: 'No primeiro lance, o peão pode avançar uma ou duas casas. Aqui ele avançou duas.', arrows: ['Ge2e4'] },
          { san: 'Kg7', comment: 'No xadrez cada lado joga uma vez: agora o rei preto se mexe.' },
          { san: 'e5', comment: 'Depois do primeiro lance, o peão anda só uma casa por vez, sempre para a frente. Ele nunca volta.', arrows: ['Ge4e5'] },
          { san: 'Kf7', comment: 'O rei preto anda de novo.' },
          { san: 'exd6', comment: 'O peão anda reto, mas captura na diagonal: uma casa à frente, para o lado.', arrows: ['Ge5d6'] },
        ],
      },
      practice: {
        title: 'avance e capture',
        fen: '7k/8/4p3/8/8/8/3P4/4K3 w - - 0 1',
        intro: 'Seu peão ainda não saiu do lugar. Avance-o duas casas de uma vez.',
        steps: [
          {
            accept: ['d4'],
            comment: 'Isso! No primeiro lance o peão pode andar duas casas.',
            reply: { san: 'Kg8', comment: 'O rei preto andou. Agora avance o peão só uma casa.' },
          },
          {
            accept: ['d5'],
            comment: 'Muito bem: uma casa de cada vez.',
            reply: { san: 'Kh8', comment: 'O peão preto de e6 está na diagonal do seu peão. Capture-o!' },
          },
          { accept: ['dxe6'], comment: 'Perfeito: o peão anda para a frente, mas captura na diagonal.' },
        ],
      },
    },
    {
      title: 'A torre',
      demo: {
        fen: '7k/8/8/8/8/8/8/R3K3 w - - 0 1',
        moves: [
          { san: 'Ra5', comment: 'A torre anda em linha reta, para cima e para baixo, quantas casas quiser.', arrows: ['Ga1a5'] },
          { san: 'Kg7', comment: 'O rei preto se mexe.' },
          { san: 'Rf5', comment: 'Ela também anda para os lados, desde que o caminho esteja livre.', arrows: ['Ga5f5'] },
          { san: 'Kg6', comment: 'O rei preto chega perto da torre para tentar capturá-la.' },
          { san: 'Rf1', comment: 'Como anda longe, a torre escapa numa jogada só, para o outro lado do tabuleiro.', arrows: ['Gf5f1'] },
        ],
      },
      practice: {
        title: 'capture e mova',
        fen: '6k1/p7/8/8/8/8/8/R3K3 w - - 0 1',
        intro: 'Capture o peão de a7 com a sua torre.',
        steps: [
          {
            accept: ['Rxa7'],
            comment: 'Isso! A torre subiu a coluna inteira de uma vez.',
            reply: { san: 'Kf8', comment: 'Agora mova a torre para o lado: qualquer casa da mesma fileira, à direita dela.' },
          },
          {
            accept: ['Rb7', 'Rc7', 'Rd7', 'Re7', 'Rf7', 'Rg7', 'Rh7'],
            comment: 'Isso! A torre anda em linha reta quantas casas quiser.',
          },
        ],
      },
    },
    {
      title: 'O bispo',
      demo: {
        fen: '7k/8/8/8/8/8/8/2B1K3 w - - 0 1',
        moves: [
          { san: 'Bf4', comment: 'O bispo anda na diagonal, quantas casas quiser.', arrows: ['Gc1f4'] },
          { san: 'Kg7', comment: 'O rei preto se mexe.' },
          { san: 'Bb8', comment: 'A cada jogada ele pode trocar de diagonal.', arrows: ['Gf4b8'] },
          { san: 'Kf6', comment: 'O rei preto anda de novo.' },
          { san: 'Bh2', comment: 'Repare: este bispo começou numa casa escura e só pisa em casas escuras. Cada bispo fica a partida inteira na mesma cor.', arrows: ['Gb8h2'] },
        ],
      },
      practice: {
        title: 'capture e mova',
        fen: '7k/8/8/6p1/8/8/8/2B1K3 w - - 0 1',
        intro: 'Capture o peão de g5 com o bispo.',
        steps: [
          {
            accept: ['Bxg5'],
            comment: 'Isso! Pela diagonal.',
            reply: { san: 'Kg7', comment: 'Agora mova o bispo para qualquer casa aonde ele consiga ir.' },
          },
          {
            accept: ['Bf4', 'Be3', 'Bd2', 'Bc1', 'Bh4', 'Bh6', 'Bf6', 'Be7', 'Bd8'],
            comment: 'Isso! O bispo sempre anda na diagonal.',
          },
        ],
      },
    },
    {
      title: 'A dama',
      demo: {
        fen: '7k/8/8/8/8/8/8/3QK3 w - - 0 1',
        moves: [
          { san: 'Qd5', comment: 'A dama junta a torre e o bispo: anda em linha reta...', arrows: ['Gd1d5'] },
          { san: 'Kg7', comment: 'O rei preto se mexe.' },
          { san: 'Qa8', comment: '...e também na diagonal, quantas casas quiser.', arrows: ['Gd5a8'] },
          { san: 'Kf6', comment: 'O rei preto anda de novo.' },
          { san: 'Qh1', comment: 'Por andar em todas as direções, a dama é a peça mais forte do tabuleiro.', arrows: ['Ga8h1'] },
        ],
      },
      practice: {
        title: 'capture os peões',
        fen: '7k/8/8/8/1p4p1/8/8/3QK3 w - - 0 1',
        intro: 'Capture o peão de g4 com a dama, pela diagonal.',
        steps: [
          {
            accept: ['Qxg4'],
            comment: 'Isso! Na diagonal, como um bispo.',
            reply: { san: 'Kh7', comment: 'Agora capture o peão de b4, em linha reta.' },
          },
          { accept: ['Qxb4'], comment: 'Perfeito: a dama anda em linha reta e na diagonal.' },
        ],
      },
    },
    {
      title: 'O cavalo',
      demo: {
        fen: '7k/8/8/8/8/8/5PPP/4K1N1 w - - 0 1',
        moves: [
          { san: 'Nf3', comment: 'O cavalo anda em "L": duas casas numa direção e uma para o lado. Ele é a única peça que pula por cima das outras.', arrows: ['Gg1f3'] },
          { san: 'Kg7', comment: 'O rei preto se mexe.' },
          { san: 'Nd4', comment: 'De novo em "L": duas casas para o lado e uma para cima.', arrows: ['Gf3d4'] },
          { san: 'Kf6', comment: 'O rei preto anda de novo.' },
          { san: 'Nb5', comment: 'O cavalo sempre troca a cor da casa: de uma casa escura vai para uma clara, e vice-versa.', arrows: ['Gd4b5'] },
        ],
      },
      practice: {
        title: 'capture e salte',
        fen: '7k/8/2p5/8/3N4/8/8/4K3 w - - 0 1',
        intro: 'Capture o peão de c6 com o cavalo.',
        steps: [
          {
            accept: ['Nxc6'],
            comment: 'Isso! Duas casas para cima e uma para o lado.',
            reply: { san: 'Kg7', comment: 'Agora salte com o cavalo para qualquer casa possível.' },
          },
          {
            accept: ['Nd4', 'Nb4', 'Na5', 'Na7', 'Nb8', 'Nd8', 'Ne7', 'Ne5'],
            comment: 'Isso! O cavalo sempre anda em "L".',
          },
        ],
      },
    },
    {
      title: 'O rei',
      demo: {
        fen: '7k/8/8/8/8/8/8/4K3 w - - 0 1',
        moves: [
          { san: 'Ke2', comment: 'O rei anda uma casa em qualquer direção.', arrows: ['Ge1e2'] },
          { san: 'Kg7', comment: 'O rei preto também anda uma casa.' },
          { san: 'Kf3', comment: 'Na diagonal também vale.', arrows: ['Ge2f3'] },
          { san: 'Kf6', comment: 'O rei preto se aproxima.' },
          { san: 'Kf4', comment: 'Os reis nunca ficam lado a lado: o rei não pode ir para uma casa atacada pelo adversário.', arrows: ['Gf3f4'] },
        ],
      },
      practice: {
        title: 'capture e fuja',
        fen: '8/8/4k3/8/3pK3/8/8/8 w - - 0 1',
        intro: 'O rei também captura. Tome o peão que está ao lado dele.',
        steps: [
          {
            accept: ['Kxd4'],
            comment: 'Isso! O rei captura do jeito que anda: uma casa.',
            reply: { san: 'Kd6', comment: 'Agora mova o rei para uma casa segura. Ele não pode ficar ao lado do rei preto.' },
          },
          { accept: ['Ke4', 'Kc4', 'Kc3', 'Kd3', 'Ke3'], comment: 'Isso! O rei nunca pode ir para uma casa atacada.' },
        ],
      },
    },
    {
      title: 'O roque',
      demo: {
        fen: '4k3/8/8/8/8/8/5PPP/4K2R w K - 0 1',
        moves: [
          {
            san: 'O-O',
            comment:
              'O roque é um lance do rei e da torre ao mesmo tempo: o rei anda duas casas em direção à torre, e a torre pula para o outro lado dele. Assim o rei fica protegido no canto.',
            arrows: ['Ge1g1', 'Gh1f1'],
          },
          {
            san: 'Kd7',
            comment:
              'Para rocar, o rei e a torre não podem ter se movido antes, não pode haver peças entre eles, e o rei não pode estar em xeque nem passar por uma casa atacada.',
          },
        ],
      },
      practice: {
        title: 'faça o roque',
        fen: '4k3/8/8/8/8/8/PPP2PPP/R3K2R w KQ - 0 1',
        intro: 'Faça o roque para qualquer um dos lados: arraste o rei duas casas em direção a uma das torres.',
        steps: [
          {
            accept: ['O-O', 'O-O-O'],
            comment: 'Isso! Com o roque o rei fica seguro e a torre entra no jogo.',
          },
        ],
      },
    },
    {
      title: 'En passant',
      demo: {
        fen: '4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1',
        moves: [
          { san: 'd5', comment: 'O peão preto avançou duas casas e parou ao lado do seu peão.', arrows: ['Gd7d5'] },
          {
            san: 'exd6',
            comment:
              'En passant ("de passagem"): seu peão captura como se o preto tivesse andado só uma casa. Só vale no lance logo em seguida.',
            arrows: ['Ge5d6'],
          },
        ],
      },
      practice: {
        title: 'capture de passagem',
        fen: '4k3/5p2/8/4P3/8/8/8/4K3 b - - 0 1',
        intro: 'Fique de olho no lance do adversário.',
        opening: { san: 'f5', comment: 'O peão preto avançou duas casas ao lado do seu. Capture-o en passant!' },
        steps: [{ accept: ['exf6'], comment: 'En passant! Só dava para capturar agora: no lance seguinte esse direito acaba.' }],
      },
    },
    {
      title: 'Promoção',
      demo: {
        fen: '8/4P1k1/8/8/8/8/8/4K3 w - - 0 1',
        moves: [
          { san: 'e8=Q', comment: 'Quando o peão chega à última fileira, ele vira outra peça. Quase sempre escolhemos a dama.', arrows: ['Ge7e8'] },
          { san: 'Kf6', comment: 'Agora você tem uma dama nova no tabuleiro.' },
        ],
      },
      practice: {
        title: 'promova o peão',
        fen: '8/1P5k/8/8/8/8/8/4K3 w - - 0 1',
        intro: 'Leve o peão até a última fileira para promovê-lo.',
        steps: [{ accept: ['b8=Q'], comment: 'Isso! O peão virou dama.' }],
      },
    },
    {
      title: 'Xeque e xeque-mate',
      demo: {
        fen: '6k1/6pp/8/8/8/8/8/R5K1 w - - 0 1',
        moves: [
          { san: 'Ra8+', comment: 'Xeque: a torre ataca o rei preto. Quem está em xeque é obrigado a se defender no lance seguinte.', arrows: ['Ga1a8'] },
          {
            san: 'Kf7',
            comment:
              'O rei preto fugiu para f7. Se ele não tivesse nenhuma saída, seria xeque-mate: o rei atacado e sem defesa. O xeque-mate termina a partida.',
          },
        ],
      },
      practice: {
        title: 'dê xeque-mate',
        fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
        intro: 'Dê xeque-mate em um lance: ataque o rei de um jeito que ele não tenha para onde fugir.',
        steps: [
          {
            accept: ['Ra8#'],
            comment: 'Xeque-mate! Os próprios peões pretos prendem o rei, e a torre o ataca pela última fileira.',
          },
        ],
      },
    },
  ],
}
