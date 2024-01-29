import type { GameState } from "./Types";

export class Item {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  public effect(gameState: GameState): GameState {
    console.log(gameState);
    return gameState;
  }
}

class Cigarette extends Item {
  constructor() {
    super("🚬");
  }

  public effect(gameState: GameState): GameState {
    gameState.localPlayer.hp++;
    return gameState;
  }
}

class Saw extends Item {
  constructor() {
    super("🪚");
  }

  public effect(gameState: GameState): GameState {
    gameState.sawed = true;
    return gameState;
  }
}

class MagnifyingGlass extends Item {
  constructor() {
    super("🔍");
  }

  public effect(gameState: GameState): GameState {
    gameState.next = gameState.racked[0];
    return gameState;
  }
}

class Handcuffs extends Item {
  constructor() {
    super("🔗");
  }

  public effect(gameState: GameState): GameState {
    gameState.cuffed = true;
    return gameState;
  }
}

class Beer extends Item {
  constructor() {
    super("🍺");
  }

  public effect(gameState: GameState): GameState {
    gameState.racked.splice(0, 1);
    return gameState;
  }
}

const Items = [
  new Cigarette(),
  new Saw(),
  new MagnifyingGlass(),
  new Handcuffs(),
  new Beer(),
];

export default Items;
