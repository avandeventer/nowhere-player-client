export interface DefiningTrait {
  traitName: string;
  category: string;  // "TRAIT" | "ENCOUNTER"
  type: string;      // "DEFINING" | "PRICE"
  sourceStoryId: string | null;
}
