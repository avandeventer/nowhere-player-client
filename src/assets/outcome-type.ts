export interface Header {
  label: string;
  color: string;
}

export interface OutcomeType {
  id: string;
  label: string;
  headers?: Header[];
  clarifier?: string;
  subTypes?: OutcomeType[];
}
