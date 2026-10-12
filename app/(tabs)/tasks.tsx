import { Screen } from "@/src/components/ui/Screen";
import { TaskBrowser } from "@/src/components/tasks/TaskBrowser";
import { useLocalSearchParams } from "expo-router";

export default function Tasks() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  const taskKey = typeof category === "string" ? category : "all";
  return <Screen scroll={false}><TaskBrowser key={taskKey} /></Screen>;
}
