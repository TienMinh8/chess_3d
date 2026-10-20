// Pure Chess Engine with legal move validation and Minimax AI

export const PIECE_VALUES = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000
};

// Positional bonuses
const PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

export function createInitialBoard() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const backRow = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: backRow[c], color: 'b', hasMoved: false };
    board[1][c] = { type: 'pawn', color: 'b', hasMoved: false };
    board[6][c] = { type: 'pawn', color: 'w', hasMoved: false };
    board[7][c] = { type: backRow[c], color: 'w', hasMoved: false };
  }

  return board;
}

export function cloneBoard(board) {
  return board.map(row =>
    row.map(cell => (cell ? { ...cell } : null))
  );
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

export function getPseudoLegalMoves(r, c, board) {
  const piece = board[r][c];
  if (!piece) return [];
  const moves = [];
  const { type, color } = piece;
  const dir = color === 'w' ? -1 : 1;

  if (type === 'pawn') {
    // 1 step forward
    if (inBounds(r + dir, c) && !board[r + dir][c]) {
      moves.push({ r: r + dir, c, capture: false });
      // 2 steps forward from starting rank
      const startRank = color === 'w' ? 6 : 1;
      if (r === startRank && inBounds(r + dir * 2, c) && !board[r + dir * 2][c]) {
        moves.push({ r: r + dir * 2, c, capture: false });
      }
    }
    // Diagonal captures
    for (const dc of [-1, 1]) {
      const nr = r + dir;
      const nc = c + dc;
      if (inBounds(nr, nc) && board[nr][nc] && board[nr][nc].color !== color) {
        moves.push({ r: nr, c: nc, capture: true });
      }
    }
  } else if (type === 'knight') {
    const jumps = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of jumps) {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc)) {
        const dest = board[nr][nc];
        if (!dest) {
          moves.push({ r: nr, c: nc, capture: false });
        } else if (dest.color !== color) {
          moves.push({ r: nr, c: nc, capture: true });
        }
      }
    }
  } else if (type === 'king') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (inBounds(nr, nc)) {
          const dest = board[nr][nc];
          if (!dest) {
            moves.push({ r: nr, c: nc, capture: false });
          } else if (dest.color !== color) {
            moves.push({ r: nr, c: nc, capture: true });
          }
        }
      }
    }
  } else {
    // Ray pieces: rook, bishop, queen
    const rayDirs = [];
    if (type === 'rook' || type === 'queen') {
      rayDirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
    }
    if (type === 'bishop' || type === 'queen') {
      rayDirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    }

    for (const [dr, dc] of rayDirs) {
      let step = 1;
      while (true) {
        const nr = r + dr * step;
        const nc = c + dc * step;
        if (!inBounds(nr, nc)) break;
        const dest = board[nr][nc];
        if (!dest) {
          moves.push({ r: nr, c: nc, capture: false });
        } else {
          if (dest.color !== color) {
            moves.push({ r: nr, c: nc, capture: true });
          }
          break;
        }
        step++;
      }
    }
  }

  return moves;
}

export function isKingInCheck(color, board) {
  // Find king position
  let kr = -1, kc = -1;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'king' && p.color === color) {
        kr = r;
        kc = c;
        break;
      }
    }
    if (kr !== -1) break;
  }
  if (kr === -1) return true; // king captured

  // Check if any opponent piece can attack king square
  const oppColor = color === 'w' ? 'b' : 'w';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === oppColor) {
        const moves = getPseudoLegalMoves(r, c, board);
        if (moves.some(m => m.r === kr && m.c === kc)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function getLegalMoves(r, c, board) {
  const piece = board[r][c];
  if (!piece) return [];
  const pseudoMoves = getPseudoLegalMoves(r, c, board);
  const legalMoves = [];

  for (const m of pseudoMoves) {
    const prevDest = board[m.r][m.c];
    board[m.r][m.c] = piece;
    board[r][c] = null;

    const inCheck = isKingInCheck(piece.color, board);

    // restore
    board[r][c] = piece;
    board[m.r][m.c] = prevDest;

    if (!inCheck) {
      legalMoves.push(m);
    }
  }

  // Castling
  const homeRank = piece.color === 'w' ? 7 : 0;
  if (piece.type === 'king' && !piece.hasMoved && r === homeRank && c === 4 && !isKingInCheck(piece.color, board)) {
    // Kingside
    const rookK = board[homeRank][7];
    if (rookK && rookK.type === 'rook' && rookK.color === piece.color && !rookK.hasMoved && !board[homeRank][5] && !board[homeRank][6]) {
      // squares 5 and 6 must not be under attack
      board[homeRank][5] = piece;
      board[homeRank][4] = null;
      const c5 = isKingInCheck(piece.color, board);

      board[homeRank][6] = piece;
      board[homeRank][5] = null;
      const c6 = isKingInCheck(piece.color, board);

      board[homeRank][4] = piece;
      board[homeRank][6] = null;

      if (!c5 && !c6) {
        legalMoves.push({ r: homeRank, c: 6, capture: false, castle: 'k', rookFromC: 7, rookToC: 5 });
      }
    }

    // Queenside
    const rookQ = board[homeRank][0];
    if (rookQ && rookQ.type === 'rook' && rookQ.color === piece.color && !rookQ.hasMoved && !board[homeRank][1] && !board[homeRank][2] && !board[homeRank][3]) {
      board[homeRank][3] = piece;
      board[homeRank][4] = null;
      const c3 = isKingInCheck(piece.color, board);

      board[homeRank][2] = piece;
      board[homeRank][3] = null;
      const c2 = isKingInCheck(piece.color, board);

      board[homeRank][4] = piece;
      board[homeRank][2] = null;

      if (!c3 && !c2) {
        legalMoves.push({ r: homeRank, c: 2, capture: false, castle: 'q', rookFromC: 0, rookToC: 3 });
      }
    }
  }

  return legalMoves;
}

export function getAllLegalMoves(color, board) {
  const allMoves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === color) {
        const moves = getLegalMoves(r, c, board);
        for (const m of moves) {
          allMoves.push({
            fromR: r,
            fromC: c,
            toR: m.r,
            toC: m.c,
            capture: m.capture,
            castle: m.castle,
            rookFromC: m.rookFromC,
            rookToC: m.rookToC
          });
        }
      }
    }
  }
  return allMoves;
}

export function isCheckmate(color, board) {
  return isKingInCheck(color, board) && getAllLegalMoves(color, board).length === 0;
}

export function isStalemate(color, board) {
  return !isKingInCheck(color, board) && getAllLegalMoves(color, board).length === 0;
}

// AI Evaluation
function evaluateBoard(board) {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      let val = PIECE_VALUES[p.type] || 0;

      // Positional table
      if (p.type === 'pawn') {
        const tableR = p.color === 'w' ? r : 7 - r;
        val += PAWN_TABLE[tableR][c];
      } else if (p.type === 'knight') {
        const tableR = p.color === 'w' ? r : 7 - r;
        val += KNIGHT_TABLE[tableR][c];
      }

      if (p.color === 'w') {
        score += val;
      } else {
        score -= val;
      }
    }
  }
  return score;
}

export function getBestMoveAI(board, color, depth = 2) {
  const isMaximizing = color === 'w';
  const allMoves = getAllLegalMoves(color, board);
  if (allMoves.length === 0) return null;

  // Shuffle slightly so games are not deterministic
  allMoves.sort(() => Math.random() - 0.5);

  let bestMove = allMoves[0];
  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (const move of allMoves) {
    const piece = board[move.fromR][move.fromC];
    const target = board[move.toR][move.toC];

    board[move.toR][move.toC] = { ...piece, hasMoved: true };
    board[move.fromR][move.fromC] = null;

    const score = minimax(board, depth - 1, -100000, 100000, !isMaximizing);

    board[move.fromR][move.fromC] = piece;
    board[move.toR][move.toC] = target;

    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  return bestMove;
}

function minimax(board, depth, alpha, beta, isMaximizing) {
  if (depth === 0) {
    return evaluateBoard(board);
  }

  const currentColor = isMaximizing ? 'w' : 'b';
  const moves = getAllLegalMoves(currentColor, board);

  if (moves.length === 0) {
    if (isKingInCheck(currentColor, board)) {
      return isMaximizing ? -90000 : 90000;
    }
    return 0; // Stalemate
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const m of moves) {
      const piece = board[m.fromR][m.fromC];
      const target = board[m.toR][m.toC];

      board[m.toR][m.toC] = { ...piece, hasMoved: true };
      board[m.fromR][m.fromC] = null;

      const evalScore = minimax(board, depth - 1, alpha, beta, false);

      board[m.fromR][m.fromC] = piece;
      board[m.toR][m.toC] = target;

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const m of moves) {
      const piece = board[m.fromR][m.fromC];
      const target = board[m.toR][m.toC];

      board[m.toR][m.toC] = { ...piece, hasMoved: true };
      board[m.fromR][m.fromC] = null;

      const evalScore = minimax(board, depth - 1, alpha, beta, true);

      board[m.fromR][m.fromC] = piece;
      board[m.toR][m.toC] = target;

      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}
