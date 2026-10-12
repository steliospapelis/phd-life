import type { AvatarConfig } from "@/src/types/models";

/** The avatar used for new users and whenever an older profile has no saved avatar yet. */
export const defaultAvatar: AvatarConfig = {
  presentation: "neutral",
  skinTone: "#C98D6B",
  hairStyle: "short",
  hairColor: "#2D2630",
  outfit: "hoodie",
  accessory: "glasses",
  headId: "head-1",
  hairId: "hair-1",
  eyesId: "eyes-1",
  mouthId: "mouth-1",
  backgroundColor: "#E3EFE5",
};
