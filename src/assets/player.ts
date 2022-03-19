export class Player {
  id: number;
  name: string;
  strength: number;
  intellect: number;
  charisma: number;
  dexterity: number;
  wealth: number;
  playerNamed: boolean;

  constructor(name: string){
    this.name = name;
    this.strength = 0;
    this.intellect = 0;
    this.charisma = 0;
    this.dexterity = 0;
    this.wealth = 0;
  };
}
