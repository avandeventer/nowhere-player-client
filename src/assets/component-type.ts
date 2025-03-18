import { GameState } from "./game-state";

export enum ComponentType {
    WRITE_PROMPTS = "WRITE_PROMPTS",
    LOCATION_SELECT = "LOCATION_SELECT",
    WRITE_OUTCOMES = "WRITE_OUTCOMES",
    ADVENTURE = "ADVENTURE",
    RITUAL = "RITUAL",
    WRITE_ENDINGS = "WRITE_ENDINGS",
    ENDING = "ENDING"
}  

export const ComponentTypeGameStateMap: Record<ComponentType, GameState[]> = {
    [ComponentType.WRITE_PROMPTS]: [GameState.WRITE_PROMPTS, GameState.WRITE_PROMPTS_AGAIN],
    [ComponentType.LOCATION_SELECT]: [GameState.LOCATION_SELECT, GameState.LOCATION_SELECT_AGAIN],
    [ComponentType.WRITE_OUTCOMES]: [GameState.WRITE_OPTIONS, GameState.WRITE_OPTIONS_AGAIN],
    [ComponentType.ADVENTURE]: [GameState.ROUND1, GameState.ROUND2],
    [ComponentType.RITUAL]: [GameState.RITUAL],
    [ComponentType.WRITE_ENDINGS]: [GameState.WRITE_ENDINGS],
    [ComponentType.ENDING]: [GameState.ENDING]
};