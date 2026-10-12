import type { AppData, Friend, FriendRequest, TaskLog } from "@/src/types/models";
import { demoTasks } from "@/src/lib/demo/taskCatalog";
import { achievementCatalog } from "@/src/domain/achievementCatalog";
import { getRuleProgress } from "@/src/domain/progression";
import { defaultAvatar } from "@/src/config/avatarDefaults";

export { defaultAvatar };
const categories = [
  ["research", "Research", "🔬"], ["reading", "Reading", "📖"], ["writing", "Writing", "✍️"], ["coding", "Coding", "💻"],
  ["experiments", "Experiments", "🧪"], ["academic", "Academic", "🎓"], ["teaching", "Teaching", "🧑‍🏫"], ["admin", "Admin", "📬"],
].map(([slug, name, iconKey], index) => ({ id: slug, slug, name, iconKey, sortOrder: index }));

function createDemoTaskLogs(): TaskLog[] {
  const now = new Date();
  const taskHistory: [string, number[]][] = [
    ["read-paper", [0, 0, 1, 2, 3, 4, 7, 10, 12, 15, 18, 20, 25]],
    ["write-test", [0, 1, 1, 2, 4, 8, 15, 22, 40, 90]],
    ["grade-papers", [1, 3, 6, 9, 14]],
    ["analyse-data", [2, 11, 20, 35, 65, 120]],
    ["reply-email", [0, 1, 2, 3, 4, 5, 6, 10, 18, 40, 200]],
    ["run-experiment", [3, 12, 25, 70]],
  ];
  const logs: TaskLog[] = [];
  taskHistory.forEach(([taskId, daysAgo]) => daysAgo.forEach((offset, index) => {
    const task = demoTasks.find((candidate) => candidate.id === taskId);
    if (!task) return;
    const occurredAt = new Date(now);
    occurredAt.setDate(now.getDate() - offset);
    occurredAt.setHours(12, index, 0, 0);
    logs.push({ id: `demo-log-${taskId}-${index}`, taskId: task.id, taskName: task.name, categoryId: task.categoryId, categoryName: task.categoryName, xpAwarded: task.xpReward, occurredAt: occurredAt.toISOString() });
  }));
  return logs;
}

const demoTaskLogs = createDemoTaskLogs();
const demoPlayer = { totalXp: 630, sanity: 68, level: 4 };

export const demoData: AppData = {
  profile: { id: "demo-user", username: "STELIOS", phdYear: 3, selectedTitle: "Professional PDF Collector", timezone: "Europe/Athens", onboardingComplete: true, avatar: defaultAvatar },
  player: demoPlayer, categories,
  tasks: demoTasks,
  achievements: achievementCatalog.map((definition) => {
    const progress = getRuleProgress(definition.ruleConfig, demoTaskLogs, demoTasks, demoPlayer, [], []);
    return { id: definition.slug, ...definition, progressCurrent: progress.current, progressTarget: progress.target, unlocked: progress.unlocked };
  }),
  titles: [
    { id: "novice", slug: "level-01-promising-research-organism", name: "Promising Research Organism", source: "level", unlockLevel: 1, requiredLevel: 1, unlocked: true }, { id: "pdf", slug: "level-03-professional-pdf-collector", name: "Professional PDF Collector", source: "level", unlockLevel: 3, requiredLevel: 3, unlocked: true },
    { id: "debugger", slug: "level-05-compiler-whisperer", name: "Compiler Whisperer", source: "level", unlockLevel: 5, requiredLevel: 5, unlocked: false }, { id: "survivor", slug: "level-07-department-survivor", name: "Department Survivor", source: "level", unlockLevel: 7, requiredLevel: 7, unlocked: false },
    { id: "legend", slug: "level-10-legend-of-the-lab", name: "Legend of the Lab", source: "level", unlockLevel: 10, requiredLevel: 10, unlocked: false },
  ],
  milestones: [
    { id: "phd_started_voluntarily", slug: "phd_started_voluntarily", title: "PhD Started (Voluntarily)", description: "You signed up for this. On purpose.", iconKey: "🌱", weight: 10, xpReward: 0, isAutomatic: true, completed: true },
    { id: "required_courses_completed", slug: "required_courses_completed", title: "Required Courses Completed", description: "The coursework is done. You may now return to your regularly scheduled research.", iconKey: "🎓", weight: 10, xpReward: 500, completed: false },
    { id: "conference_presentation", slug: "conference_presentation", title: "Conference Presentation", description: "You presented your research to a room full of academics and survived the questions.", iconKey: "🎤", weight: 10, xpReward: 600, completed: false },
    { id: "journal_paper_1_published", slug: "journal_paper_1_published", title: "Journal Paper #1 Published", description: "Your first thesis-related first-author journal paper made it into the literature.", iconKey: "📖", weight: 10, xpReward: 1000, completed: false },
    { id: "journal_paper_2_published", slug: "journal_paper_2_published", title: "Journal Paper #2 Published", description: "Two thesis-related first-author journal papers. Publication requirement complete.", iconKey: "📚", weight: 10, xpReward: 1250, completed: false },
    { id: "preliminary_defence", slug: "preliminary_defence", title: "Preliminary Defence", description: "You survived the rehearsal boss fight.", iconKey: "🛡️", weight: 10, xpReward: 900, completed: false },
    { id: "thesis_written", slug: "thesis_written", title: "Thesis Written", description: "The thesis exists. All of it.", iconKey: "📘", weight: 20, xpReward: 1500, completed: false },
    { id: "defence_completed", slug: "defence_completed", title: "Defence Completed", description: "Final boss defeated.", iconKey: "🏆", weight: 20, xpReward: 2000, completed: false },
  ],
  friends: [
    { id: "friend-maria", username: "maria_phd", title: "Reviewer #2 Survivor", phdYear: 4, level: 14, totalXp: 1740, sanity: 82, avatar: { ...defaultAvatar, headId: "head-2", hairId: "hair-3", eyesId: "eyes-2", mouthId: "mouth-3" }, achievementNames: ["It Begins", "Still Here"], milestoneNames: ["First conference", "Main experiment phase"], friendsSince: "March 18, 2026", acceptedAt: "2026-03-18T09:00:00.000Z" },
    { id: "friend-nikos", username: "nikos_lab", title: "Compiler Whisperer", phdYear: 2, level: 8, totalXp: 760, sanity: 38, avatar: { ...defaultAvatar, headId: "head-4", hairId: "hair-6", eyesId: "eyes-4", mouthId: "mouth-1" }, achievementNames: ["Works On My Machine"], milestoneNames: ["First presentation"], friendsSince: "April 2026", acceptedAt: "2026-04-04T09:00:00.000Z" },
    { id: "friend-elena", username: "elena_data", title: "Department Survivor", phdYear: 5, level: 21, totalXp: 4320, sanity: 67, avatar: { ...defaultAvatar, headId: "head-6", hairId: "hair-2", eyesId: "eyes-5", mouthId: "mouth-2" }, achievementNames: ["Professional PDF Collector", "Science Technically Occurred"], milestoneNames: ["First publication", "Main analysis phase"], friendsSince: "February 2026", acceptedAt: "2026-02-12T09:00:00.000Z" },
  ] as Friend[],
  friendRequests: [
    { id: "request-george", from: { id: "friend-george", username: "george_methods", title: "Methodology Goblin", phdYear: 3, avatar: { ...defaultAvatar, headId: "head-7", hairId: "hair-4", eyesId: "eyes-6", mouthId: "mouth-4" }, achievementNames: ["It Begins"], milestoneNames: ["Required courses"], friendsSince: "September 2026" }, createdAt: "2026-09-15T08:00:00.000Z" },
  ] as FriendRequest[],
  friendDirectory: [
    { id: "friend-maria", username: "maria_phd", title: "Reviewer #2 Survivor", phdYear: 4, avatar: { ...defaultAvatar, headId: "head-2", hairId: "hair-3", eyesId: "eyes-2", mouthId: "mouth-3" }, achievementNames: ["It Begins", "Still Here"], milestoneNames: ["First conference", "Main experiment phase"], friendsSince: "March 2026" },
    { id: "friend-nikos", username: "nikos_lab", title: "Compiler Whisperer", phdYear: 2, avatar: { ...defaultAvatar, headId: "head-4", hairId: "hair-6", eyesId: "eyes-4", mouthId: "mouth-1" }, achievementNames: ["Works On My Machine"], milestoneNames: ["First presentation"], friendsSince: "April 2026" },
    { id: "friend-elena", username: "elena_data", title: "Department Survivor", phdYear: 5, avatar: { ...defaultAvatar, headId: "head-6", hairId: "hair-2", eyesId: "eyes-5", mouthId: "mouth-2" }, achievementNames: ["Professional PDF Collector", "Science Technically Occurred"], milestoneNames: ["First publication", "Main analysis phase"], friendsSince: "February 2026" },
    { id: "friend-george", username: "george_methods", title: "Methodology Goblin", phdYear: 3, avatar: { ...defaultAvatar, headId: "head-7", hairId: "hair-4", eyesId: "eyes-6", mouthId: "mouth-4" }, achievementNames: ["It Begins"], milestoneNames: ["Required courses"], friendsSince: "September 2026" },
    { id: "friend-anna", username: "anna_bench", title: "Pipette Whisperer", phdYear: 1, avatar: { ...defaultAvatar, headId: "head-9", hairId: "hair-8", eyesId: "eyes-8", mouthId: "mouth-5" }, achievementNames: [], milestoneNames: [], friendsSince: "September 2026" },
  ] as Friend[],
  socialEvents: [
    { id: "s1", userId: "friend-maria", username: "maria_phd", avatar: { ...defaultAvatar, headId: "head-2", hairId: "hair-3", eyesId: "eyes-2", mouthId: "mouth-3" }, type: "milestone", sourceId: "milestone-paper", createdAt: "2026-10-06T10:00:00.000Z", sharedAt: "2026-10-06T10:00:00.000Z", metadata: { title: "First Paper Submitted", flavorText: "It belongs to the reviewers now." }, reactions: { citation: 4 }, citationCount: 4, citationUsers: [{ id: "friend-nikos", username: "nikos_lab", avatar: { ...defaultAvatar, headId: "head-4", hairId: "hair-6", eyesId: "eyes-4", mouthId: "mouth-1" } }, { id: "friend-elena", username: "elena_data", avatar: { ...defaultAvatar, headId: "head-6", hairId: "hair-2", eyesId: "eyes-5", mouthId: "mouth-2" } }, { id: "friend-george", username: "george_methods", avatar: { ...defaultAvatar, headId: "head-7", hairId: "hair-4", eyesId: "eyes-6", mouthId: "mouth-4" } }], userHasCitation: false },
    { id: "s2", userId: "friend-nikos", username: "nikos_lab", avatar: { ...defaultAvatar, headId: "head-4", hairId: "hair-6", eyesId: "eyes-4", mouthId: "mouth-1" }, type: "achievement", sourceId: "achievement-machine", createdAt: "2026-10-05T07:00:00.000Z", sharedAt: "2026-10-05T07:00:00.000Z", metadata: { title: "Works On My Machine", flavorText: "The sacred first success." }, reactions: { citation: 7 }, citationCount: 7, citationUsers: [{ id: "friend-maria", username: "maria_phd", avatar: { ...defaultAvatar, headId: "head-2", hairId: "hair-3", eyesId: "eyes-2", mouthId: "mouth-3" } }, { id: "friend-elena", username: "elena_data", avatar: { ...defaultAvatar, headId: "head-6", hairId: "hair-2", eyesId: "eyes-5", mouthId: "mouth-2" } }, { id: "friend-george", username: "george_methods", avatar: { ...defaultAvatar, headId: "head-7", hairId: "hair-4", eyesId: "eyes-6", mouthId: "mouth-4" } }, { id: "friend-anna", username: "anna_bench", avatar: { ...defaultAvatar, headId: "head-9", hairId: "hair-8", eyesId: "eyes-8", mouthId: "mouth-5" } }], userHasCitation: false },
    { id: "s3", userId: "friend-elena", username: "elena_data", avatar: { ...defaultAvatar, headId: "head-6", hairId: "hair-2", eyesId: "eyes-5", mouthId: "mouth-2" }, type: "milestone", sourceId: "milestone-conference", createdAt: "2026-10-04T09:30:00.000Z", sharedAt: "2026-10-04T09:30:00.000Z", metadata: { title: "First Conference", flavorText: "The tote bag was worth the registration fee." }, reactions: { citation: 2 }, citationCount: 2, citationUsers: [{ id: "friend-maria", username: "maria_phd", avatar: { ...defaultAvatar, headId: "head-2", hairId: "hair-3", eyesId: "eyes-2", mouthId: "mouth-3" } }, { id: "friend-nikos", username: "nikos_lab", avatar: { ...defaultAvatar, headId: "head-4", hairId: "hair-6", eyesId: "eyes-4", mouthId: "mouth-1" } }], userHasCitation: false },
  ],
  socialReactions: {},
  taskLogs: demoTaskLogs,
  monthlyStats: { month: "September 2026", tasks: 27, xp: 418, sanityChanges: 6, topCategory: "Research" },
};
