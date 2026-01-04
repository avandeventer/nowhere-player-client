export interface OutcomeType {
  id: string;
  label: string;
  clarifier?: string;
  subTypes?: OutcomeType[];
}

