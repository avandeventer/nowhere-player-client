export interface TraitType {
  name: string;
  color: string;
}

export class Trait {
  traitId: string = '';
  traitLabel: string = '';
  traitType: TraitType = { name: 'Trait', color: '#0288d1' };
}