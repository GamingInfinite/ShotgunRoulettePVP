import type Player from "./Player";

export class GameState {
  turn: boolean;
  racked: (0 | 1)[];
  localPlayer: Player;
  enemyPlayer: Player;
  sawed: boolean;
  cuffed: boolean;
  next: number
}
