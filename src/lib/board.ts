export type BoardSide = 'queenside' | 'kingside';
export type BoardHalf = 'white' | 'black';

export type SquareFacets = {
  square: string;
  file: string; 
  rank: number; 
  side: BoardSide; 
  half: BoardHalf; 
  quadrant: string; 
};

export function describeSquare(square: string): SquareFacets {
  const file = square[0];
  const rank = Number(square[1]);
  const side: BoardSide = file <= 'd' ? 'queenside' : 'kingside';
  const half: BoardHalf = rank <= 4 ? 'white' : 'black';
  return { square, file, rank, side, half, quadrant: `${side}-${half}` };
}

export type PieceFacets = { color: 'w' | 'b'; type: string };

export function describePiece(code: string): PieceFacets {
  return { color: code[0] as 'w' | 'b', type: code[1] };
}