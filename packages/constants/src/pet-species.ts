// Fixed species choices shown in the dropdown across Web/Mobile. "Khác"
// is not a real species value — selecting it reveals a free-text input,
// and that typed text becomes the actual `species` value sent to the API
// (Pet.species stays a free string server-side; see pet.validator.ts).
export const PET_SPECIES_OPTIONS = ["Chó", "Mèo", "Bò sát", "Gia súc/gia cầm"] as const;
export type PetSpeciesOption = (typeof PET_SPECIES_OPTIONS)[number];

export const PET_SPECIES_OTHER = "Khác";
