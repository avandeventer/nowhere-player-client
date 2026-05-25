export interface OutcomeType {
  id: string;
  label: string;
  headers?: string[];
  clarifier?: string;
  subTypes?: OutcomeType[];
}

