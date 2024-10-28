export class Player {
  name: string;
  strength: number;
  intellect: number;
  charisma: number;
  dexterity: number;
  wealth: number;
  magic: number;
  authorId: string;

  constructor() {
    this.name = '';
    this.strength = 0;
    this.intellect = 0;
    this.charisma = 0;
    this.dexterity = 0;
    this.wealth = 0;
    this.magic = 0;
    this.authorId = "";
  }
}