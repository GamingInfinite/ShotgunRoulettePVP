<script lang="ts">
  import { Peer } from "peerjs";
  import type { DataConnection } from "peerjs";
  import Items, { Item } from "../lib/Items";
  import Player from "../lib/Player";
  import { GameState } from "../lib/Types";

  type liveBlank = 0 | 1;

  $: live = getLive(gameState.racked);

  let messages: string[] = [];

  let gameState: GameState = {
    turn: true,
    racked: [],
    localPlayer: new Player(4),
    enemyPlayer: new Player(4),
    sawed: false,
    cuffed: false,
    next: null,
  };

  let friendID: string;

  let myID: string = "";

  let peer = new Peer();
  let connection: DataConnection;

  peer.on(`open`, (id) => {
    console.log("My peer id", id);
    myID = id;
  });

  peer.on(`connection`, (conn) => {
    connection = conn;
    connection.on(`data`, handleMessage);
    connection.on(`open`, () => {
      sendMessage("Connected!", true);
    });
  });

  peer.on(`disconnected`, () => {
    console.log("You died");
  });

  function getLive(array: liveBlank[]) {
    let cnt = 0;
    for (let bullet of array) {
      if (bullet == 1) {
        cnt++;
      }
    }
    return cnt;
  }

  function startRound() {
    let bulletSet: liveBlank[] = [0, 0, 0, 0, 1, 1, 1, 1];
    while (bulletSet.length != 0) {
      gameState.racked.push(
        bulletSet.splice(Math.floor(Math.random() * bulletSet.length), 1)[0]
      );
    }

    if (!(gameState.localPlayer.constructor === Player)) {
      let fakePlayer = gameState.localPlayer;
      gameState.localPlayer = new Player(fakePlayer.hp);
      for (let item of fakePlayer.items) {
        gameState.localPlayer.addItem(item);
      }
    }

    for (let i = 0; i < 4; i++) {
      gameState.localPlayer.addItem(Math.floor(Math.random() * Items.length));
    }
  }

  function shoot(self: boolean) {
    let damage: number = gameState.racked.splice(0, 1)[0];
    if (gameState.sawed) {
      damage *= 2;
    }
    gameState.racked = gameState.racked;
    if (self) {
      gameState.localPlayer.hp -= damage;
      if (damage == 1) {
        advanceTurn();
      }
      sendMessage(`Enemy shot themselves for ${damage} damage.`);
      messages.push(`You shot yourself for ${damage} damage.`);
    } else {
      gameState.enemyPlayer.hp -= damage;
      advanceTurn();
      sendMessage(`Enemy shot you for ${damage} damage.`);
      messages.push(`You shot at Enemy for ${damage} damage.`);
    }
    gameState.sawed = false;
    gameState.next = null;
    sendMessage({ type: "Shot", data: gameState });
    if (gameState.racked.length == 0) {
      startRound();
      sendMessage({ type: "Rerack", data: gameState });
    }
  }

  function advanceTurn() {
    if (!gameState.cuffed) {
      gameState.turn = !gameState.turn;
    } else {
      gameState.cuffed = false;
    }
  }

  function connect() {
    connection = peer.connect(friendID);
    connection.on(`open`, () => {
      sendMessage({ type: "State", data: gameState });
    });
    connection.on(`data`, handleMessage);
  }

  function handleMessage(data: string | { type: string; data: any }) {
    if (typeof data === "string") {
      messages.push(data);
      messages = messages;
    }
    if (typeof data === "object") {
      if (data.type == "State") {
        gameState.racked = data.data.racked;
        gameState.enemyPlayer = data.data.localPlayer;
        advanceTurn();
        sendMessage({ type: "Player", data: gameState.localPlayer });
      }
      if (data.type == "Player") {
        gameState.enemyPlayer = data.data;
      }
      if (data.type == "Item") {
        gameState.sawed = data.data.sawed;
        gameState.racked = data.data.racked;
        gameState.cuffed = data.data.cuffed;
        gameState.enemyPlayer = data.data.localPlayer;
      }
      if (data.type == "Shot") {
        gameState.enemyPlayer = data.data.localPlayer;
        gameState.localPlayer = data.data.enemyPlayer;
        gameState.sawed = data.data.sawed;
        gameState.cuffed = data.data.cuffed;
        gameState.racked = data.data.racked;
        gameState.turn = !data.data.turn;
        if (gameState.localPlayer.hp <= 0) {
          peer.disconnect();
        }
      }
      if (data.type == "Rerack") {
        startRound();
        gameState.racked = data.data.racked;
        gameState.enemyPlayer = data.data.localPlayer;
        sendMessage({ type: "Player", data: gameState.localPlayer });
      }
    }
  }

  function sendMessage(data: string | Object, echo = false) {
    if (typeof data === "string") {
      if (echo) {
        messages.push(data);
      }
      messages = messages;
    }
    connection.send(data);
  }

  startRound();
</script>

<svelte:head>
  <title>Shotgun Roulette</title>
</svelte:head>

<div class="flex flex-row justify-center gap-4">
  <div class="flex flex-col gap-2">
    <div class="flex flex-row justify-center gap-2">
      <div class="flex flex-col justify-center">
        <div class="flex flex-row justify-center">
          Their HP: {gameState.enemyPlayer.hp}
        </div>
      </div>
      <div class="flex flex-col">
        <div class="grid grid-cols-4 gap-2">
          {#each gameState.enemyPlayer.items as item}
            <button class="btn btn-ghost">{Items[item].name}</button>
          {/each}
        </div>
      </div>
    </div>
    <div class="flex flex-row gap-2 justify-center">
      {#if !gameState.turn}
        Awaiting their choice...
      {:else}
        <button
          class="btn btn-ghost"
          on:click={() => {
            shoot(false);
          }}>Shoot Them</button
        >
        <button
          class="btn btn-ghost"
          on:click={() => {
            shoot(true);
          }}>Shoot Yourself</button
        >
      {/if}
    </div>
    <div class="flex flex-row justify-center">
      {#if gameState.turn}
        Your
      {:else}
        Their
      {/if}Turn
    </div>
    <div class="flex flex-row justify-center gap-2">
      <div class="flex flex-col justify-center">
        <div class="flex flex-row justify-center">
          HP: {gameState.localPlayer.hp}
        </div>
      </div>
      <div class="flex flex-col">
        <div class="grid grid-cols-4 gap-2">
          {#each gameState.localPlayer.items as item, i}
            <button
              class="btn btn-ghost"
              disabled={!gameState.turn}
              on:click={() => {
                let itemObject = Items[item];
                gameState = itemObject.effect(gameState);
                gameState.localPlayer.items.splice(i, 1);
                sendMessage(`Enemy used ${itemObject.name}.`);
                messages.push(`You used ${itemObject.name}.`);
                messages = messages;
                sendMessage({ type: "Item", data: gameState });
              }}>{Items[item].name}</button
            >
          {/each}
        </div>
      </div>
    </div>
    <div class="flex flex-row justify-center gap-2">
      <input
        type="text"
        class="input input-bordered"
        placeholder="Friends ID"
        bind:value={friendID}
      />
      <button class="btn btn-success" on:click={connect}> Connect </button>
    </div>
  </div>
  <div class="flex flex-col justify-center">
    <div class="flex flex-row gap-2">
      <p>{live} - {gameState.racked.length - live}</p>
      <p>
        Next: {#if gameState.next == 0}
          Blank
        {:else if gameState.next == 1}
          Live
        {:else}
          ?
        {/if}
      </p>
      <div class="flex flex-col">
        {myID}
      </div>
    </div>
  </div>
  <div class="flex flex-col">
    {#each messages as message}
      <div class="flex flex-row max-w-48">
        {message}
      </div>
    {/each}
  </div>
</div>
