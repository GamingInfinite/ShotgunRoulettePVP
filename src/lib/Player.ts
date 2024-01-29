import type { Item } from "./Items";

class Player {
    hp: number;
    items: number[] = [];

    constructor(hp: number) {
        this.hp = hp;
    }

    public addItem(item: number) {
        //get item object then push id;
        this.items.push(item)
    }
}

export default Player