import { EncounterLabel } from './encounter-label';

export enum EncounterType {
  NORMAL = 'NORMAL'
}

export interface Encounter {
  encounterLabel: EncounterLabel;
  storyId: string;
  storyPrompt: string;
  encounterType: EncounterType;
  visited: boolean;
}

