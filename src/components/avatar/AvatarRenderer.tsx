import { Image, StyleSheet, View, type ImageStyle, type StyleProp } from "react-native";
import { avatarAssetUsesFullCanvas, defaultAvatarAssetIds, getAvatarAsset } from "@/src/config/avatarAssets";
import { colors } from "@/src/config/theme";
import type { AvatarConfig } from "@/src/types/models";

export function AvatarRenderer({ config, sanity = 70, size = 210 }: { config: AvatarConfig; sanity?: number; size?: number }) {
  const headId = config.headId ?? defaultAvatarAssetIds.headId;
  const hairId = config.hairId ?? defaultAvatarAssetIds.hairId;
  const eyesId = config.eyesId ?? defaultAvatarAssetIds.eyesId;
  const mouthId = config.mouthId ?? defaultAvatarAssetIds.mouthId;
  const eyesStyle = getEyesLayerStyle(eyesId);
  const hairStyle = getHairLayerStyle(hairId);
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: config.backgroundColor ?? colors.mint }]} accessible accessibilityLabel="Your PhD Life avatar">
      <Image source={getAvatarAsset("heads", headId).source} resizeMode="contain" style={styles.baseLayer} />
      <Image source={getAvatarAsset("eyes", eyesId).source} resizeMode="contain" style={eyesStyle} />
      <Image source={getAvatarAsset("mouths", mouthId).source} resizeMode="contain" style={styles.mouthLayer} />
      <Image source={getAvatarAsset("hair", hairId).source} resizeMode="contain" style={hairStyle} />
    </View>
  );
}

const enlargedHair = new Set(["hair-22", "hair-24", "hair-26", "hair-29", "hair-38", "hair-39", "hair-40", "hair-48"]);
const slightlyEnlargedHair = new Set(["hair-32", "hair-36", "hair-47", "hair-49", "hair-50", "hair-51", "hair-57", "hair-60", "hair-63"]);
const loweredHair = new Set(["hair-22", "hair-26", "hair-32", "hair-38", "hair-39", "hair-47", "hair-48", "hair-50", "hair-51", "hair-53", "hair-60", "hair-63"]);
const extraLoweredHair = new Set(["hair-26", "hair-47", "hair-48", "hair-51", "hair-60", "hair-63"]);
const raisedHair = new Set(["hair-40", "hair-49"]);

function getHairLayerStyle(id: string): StyleProp<ImageStyle> {
  const scale = enlargedHair.has(id) ? 1.12 : slightlyEnlargedHair.has(id) ? 1.08 : 1;
  const verticalOffset = extraLoweredHair.has(id) ? 8 : loweredHair.has(id) ? 4 : raisedHair.has(id) ? -3 : 0;
  const dimension = `${scale * 100}%` as `${number}%`;
  const inset = `${(100 - scale * 100) / 2}%` as `${number}%`;
  return [styles.hairLayer, { top: `${-18 + verticalOffset}%`, left: inset, width: dimension, height: dimension } as ImageStyle];
}

function getEyesLayerStyle(id: string): StyleProp<ImageStyle> {
  if (avatarAssetUsesFullCanvas("eyes", id)) return getFullCanvasEyesStyle(id);
  const scale = id === "eyes-15" ? 1.1 : id === "eyes-6" || id === "eyes-8" ? 1.08 : 1;
  const centeredOffset = (38 - 38 * scale) / 2;
  const downOffset = id === "eyes-8" ? 3 : 0;
  return [styles.eyesLayer, { top: `${22 + centeredOffset + downOffset}%`, left: `${31 + centeredOffset}%`, width: `${38 * scale}%`, height: `${38 * scale}%` } as ImageStyle];
}

const smallerRaisedEyes = new Set(["eyes-16", "eyes-17", "eyes-18", "eyes-19", "eyes-26", "eyes-27", "eyes-28", "eyes-29", "eyes-30", "eyes-31", "eyes-32", "eyes-33", "eyes-34", "eyes-35", "eyes-36", "eyes-37", "eyes-38"]);
const largerRaisedEyes = new Set(["eyes-20", "eyes-21", "eyes-22"]);
const raisedEyes = new Set(["eyes-23", "eyes-24", "eyes-25"]);

function getFullCanvasEyesStyle(id: string): StyleProp<ImageStyle> {
  const size = smallerRaisedEyes.has(id) ? 52 : largerRaisedEyes.has(id) ? 62 : 58;
  const top = smallerRaisedEyes.has(id) ? 18 : largerRaisedEyes.has(id) ? 17 : raisedEyes.has(id) ? 18 : 21;
  const inset = (100 - size) / 2;
  return [styles.fullCanvasLayer, { top: `${top}%`, left: `${inset}%`, width: `${size}%`, height: `${size}%` } as ImageStyle];
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", position: "relative" },
  baseLayer: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
  hairLayer: { position: "absolute", top: "-18%", left: 0, width: "100%", height: "100%" },
  eyesLayer: { position: "absolute", top: "22%", left: "31%", width: "38%", height: "38%" },
  fullCanvasLayer: { position: "absolute", top: "21%", left: "21%", width: "58%", height: "58%" },
  mouthLayer: { position: "absolute", top: "50%", left: "34%", width: "32%", height: "32%" },
});
