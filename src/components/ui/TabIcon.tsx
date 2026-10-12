import Svg, { Circle, Path, Polyline } from "react-native-svg";
import { colors } from "@/src/config/theme";

type IconName = "home" | "tasks" | "phd" | "social" | "profile";

export function TabIcon({ name, active }: { name: IconName; active: boolean }) {
  const color = active ? colors.secondary : colors.textSecondary;
  const common = { stroke: color, strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return <Svg width={22} height={22} viewBox="0 0 24 24" accessibilityLabel={`${name} icon`}>
    {name === "home" ? <><Path {...common} d="M3 10.5 12 3l9 7.5" /><Path {...common} d="M5.5 9.5V21h13V9.5M9.5 21v-6h5v6" /></> : null}
    {name === "tasks" ? <><Circle {...common} cx="12" cy="12" r="8.5" /><Polyline {...common} points="8.5,12.2 11,14.7 16,9.5" /></> : null}
    {name === "phd" ? <><Path {...common} d="m3 8 9-4 9 4-9 4-9-4Z" /><Path {...common} d="M7 10v5.5c2.8 2.1 7.2 2.1 10 0V10M21 8v6" /><Circle cx="21" cy="15.7" r="1" fill={color} /></> : null}
    {name === "social" ? <><Circle {...common} cx="9" cy="9" r="3" /><Circle {...common} cx="17" cy="10" r="2.4" /><Path {...common} d="M3.5 20c.5-3 2.4-4.5 5.5-4.5S14 17 14.5 20M14.5 15.8c2.8-.5 5.2 1 6 3.8" /></> : null}
    {name === "profile" ? <><Circle {...common} cx="12" cy="8" r="3.5" /><Path {...common} d="M4.5 21c.7-4 3.1-6 7.5-6s6.8 2 7.5 6" /></> : null}
  </Svg>;
}
