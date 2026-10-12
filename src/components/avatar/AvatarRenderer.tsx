import { Image, StyleSheet, View } from "react-native";
import { defaultAvatarAssetIds, getAvatarAsset } from "@/src/config/avatarAssets";
import { colors } from "@/src/config/theme";
import type { AvatarConfig } from "@/src/types/models";

export function AvatarRenderer({ config, sanity = 70, size = 210 }: { config: AvatarConfig; sanity?: number; size?: number }) {
  const headId = config.headId ?? defaultAvatarAssetIds.headId;
  const hairId = config.hairId ?? defaultAvatarAssetIds.hairId;
  const eyesId = config.eyesId ?? defaultAvatarAssetIds.eyesId;
  const mouthId = config.mouthId ?? defaultAvatarAssetIds.mouthId;
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: config.backgroundColor ?? colors.mint }]} accessible accessibilityLabel="Your PhD Life avatar">
      <Image source={getAvatarAsset("heads", headId).source} resizeMode="contain" style={styles.baseLayer} />
      <Image source={getAvatarAsset("hair", hairId).source} resizeMode="contain" style={styles.hairLayer} />
      <Image source={getAvatarAsset("eyes", eyesId).source} resizeMode="contain" style={styles.eyesLayer} />
      <Image source={getAvatarAsset("mouths", mouthId).source} resizeMode="contain" style={styles.mouthLayer} />
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", position: "relative" },
  baseLayer: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
  hairLayer: { position: "absolute", top: "-18%", left: 0, width: "100%", height: "100%" },
  eyesLayer: { position: "absolute", top: "22%", left: "31%", width: "38%", height: "38%" },
  mouthLayer: { position: "absolute", top: "50%", left: "34%", width: "32%", height: "32%" },
});
