export const PetEventType = {
  MEDICAL: "MEDICAL",
  VACCINATION: "VACCINATION",
  WEIGHT: "WEIGHT",
  APPOINTMENT: "APPOINTMENT",
  SOCIAL_POST: "SOCIAL_POST",
  SHOP_ORDER: "SHOP_ORDER",
  BIRTHDAY: "BIRTHDAY",
  ADOPTION: "ADOPTION",
  OWNERSHIP_TRANSFER: "OWNERSHIP_TRANSFER",
  AI_ALERT: "AI_ALERT",
  REMINDER: "REMINDER",
} as const;
export type PetEventType = (typeof PetEventType)[keyof typeof PetEventType];

export interface PetEventDto {
  id: string;
  petId: string;
  eventType: PetEventType;
  eventDate: string;
  referenceType: string | null;
  referenceId: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
}
