import type { Task } from "@/src/types/models";

type TaskSeed = [id: string, categoryId: string, categoryName: string, name: string, xpReward: number, iconKey: string, isMajor?: boolean];

const taskSeeds: TaskSeed[] = [
  ["research-question", "research", "Research", "Define a research question", 10, "🔎"],
  ["search-strategy", "research", "Research", "Plan a literature search", 10, "🧭"],
  ["clean-dataset", "research", "Research", "Clean a dataset", 20, "🧹"],
  ["create-questionnaire", "research", "Research", "Create a questionnaire", 20, "📝"],
  ["interpret-results", "research", "Research", "Interpret results", 20, "💡"],
  ["design-protocol", "research", "Research", "Design a study protocol", 25, "🧠"],
  ["complete-data-collection", "research", "Research", "Complete data collection", 30, "🗃️"],
  ["statistical-analysis", "research", "Research", "Perform a statistical analysis", 30, "📊"],
  ["confirm-hypothesis", "research", "Research", "Confirm a hypothesis", 50, "✅", true],

  ["skim-abstract", "reading", "Reading", "Skim an abstract", 2, "👀"],
  ["extract-citations", "reading", "Reading", "Extract useful citations", 3, "🔖"],
  ["read-paper", "reading", "Reading", "Read a paper", 10, "📚"],
  ["paper-notes", "reading", "Reading", "Take paper notes", 10, "🗒️"],
  ["read-book-chapter", "reading", "Reading", "Read a book chapter", 20, "📘"],
  ["identify-research-gap", "reading", "Reading", "Identify a research gap", 30, "💡"],

  ["revise-paragraph", "writing", "Writing", "Revise a paragraph", 5, "🔧"],
  ["craft-figure-table", "writing", "Writing", "Craft a figure or table", 10, "📊"],
  ["prepare-abstract", "writing", "Writing", "Write the abstract", 10, "🧾"],
  ["prepare-outline", "writing", "Writing", "Prepare an outline", 10, "🗂️"],
  ["write-section", "writing", "Writing", "Write a section", 20, "✍️"],
  ["finish-section", "writing", "Writing", "Finish a thesis section", 100, "🏁", true],
  ["submit-conference-paper", "writing", "Writing", "Submit a conference paper", 300, "🎤", true],
  ["submit-journal-paper", "writing", "Writing", "Submit a journal paper", 500, "🚀", true],

  ["add-feature", "coding", "Coding", "Add a feature", 5, "✨"],
  ["create-pipeline", "coding", "Coding", "Create a pipeline", 10, "🔌"],
  ["finish-script", "coding", "Coding", "Finish a script", 10, "📜"],
  ["run-model", "coding", "Coding", "Run a model", 10, "🤖"],
  ["setup-environment", "coding", "Coding", "Set up the environment", 10, "🧰"],
  ["create-interface", "coding", "Coding", "Create an interface", 20, "🖥️"],
  ["develop-app", "coding", "Coding", "Develop an app", 50, "📱", true],

  ["clean-lab", "experiments", "Experiments", "Clean the lab", 5, "🧽"],
  ["prepare-samples", "experiments", "Experiments", "Prepare samples", 5, "🧫"],
  ["calibrate-equipment", "experiments", "Experiments", "Calibrate equipment", 10, "🎛️"],
  ["prepare-protocol", "experiments", "Experiments", "Prepare an experiment protocol", 10, "📑"],
  ["record-observations", "experiments", "Experiments", "Record observations", 10, "📝"],
  ["analyze-experimental-data", "experiments", "Experiments", "Analyze experimental data", 20, "📊"],
  ["perform-experiment", "experiments", "Experiments", "Perform an experiment", 20, "🧪"],

  ["attend-class", "academic", "Academic", "Attend a class", 5, "📚"],
  ["seminar", "academic", "Academic", "Attend a seminar", 10, "🎤"],
  ["network-researcher", "academic", "Academic", "Network with another researcher", 10, "🤝"],
  ["attend-conference", "academic", "Academic", "Attend a conference", 20, "🎟️"],
  ["review-paper", "academic", "Academic", "Review a paper", 20, "🧐"],
  ["pass-exam", "academic", "Academic", "Pass an exam", 50, "📝", true],
  ["submit-proposal", "academic", "Academic", "Submit a proposal", 50, "📨", true],
  ["present-in-conference", "academic", "Academic", "Present in a conference", 100, "🌟", true],

  ["grade-paper", "teaching", "Teaching", "Grade a paper", 5, "📝"],
  ["give-student-feedback", "teaching", "Teaching", "Give a student feedback", 10, "💬"],
  ["help-labmate", "teaching", "Teaching", "Help a labmate", 10, "🤝"],
  ["help-workshop", "teaching", "Teaching", "Help in a workshop", 10, "🧑‍🏫"],
  ["prepare-lecture", "teaching", "Teaching", "Prepare a lecture", 10, "📚"],
  ["supervise-exam", "teaching", "Teaching", "Supervise exam", 10, "📝"],
  ["teach-class-workshop", "teaching", "Teaching", "Teach a class / workshop", 20, "🏫"],

  ["clean-desk", "admin", "Admin", "Clean your desk", 2, "🧽"],
  ["make-call", "admin", "Admin", "Make a call", 2, "📞"],
  ["organise-files", "admin", "Admin", "Organise files", 2, "🗃️"],
  ["plan-week", "admin", "Admin", "Plan the week", 2, "🗺️"],
  ["schedule-meeting", "admin", "Admin", "Schedule a meeting", 2, "🗓️"],
  ["write-email", "admin", "Admin", "Write an email", 2, "📧"],
  ["fill-form", "admin", "Admin", "Fill a form", 3, "📝"],
  ["survive-supervisor-meeting", "admin", "Admin", "Survive a meeting with the supervisor", 5, "🫡"],
];

export const demoTasks: Task[] = taskSeeds.map(([id, categoryId, categoryName, name, xpReward, iconKey, isMajor = false]) => ({
  id, categoryId, categoryName, name, xpReward, sanityDelta: 0, iconKey, isMajor, tags: [categoryId, ...(categoryId === "reading" ? ["paper_reading"] : []), ...(categoryId === "writing" ? ["writing"] : []), ...(categoryId === "coding" ? ["coding"] : []), ...(categoryId === "experiments" ? ["experiment"] : []), ...(categoryId === "teaching" ? ["teaching"] : []), ...(categoryId === "admin" ? ["admin"] : []), ...(id === "write-email" ? ["email"] : []), ...(id.includes("meeting") ? ["meeting"] : []), ...(id === "run-model" ? ["ml_training"] : []), ...(id.includes("data") || id === "statistical-analysis" || id === "interpret-results" ? ["data_analysis"] : []), ...(id === "clean-dataset" ? ["data_cleaning"] : []), ...(id.includes("conference") || id === "seminar" ? ["conference"] : []), ...(id.includes("presentation") ? ["presentation"] : []), ...(id.includes("submit-") || id === "submit-proposal" ? ["paper_submission"] : []), ...(id === "extract-citations" ? ["reference_management"] : []), ...(id === "search-strategy" || id === "research-question" ? ["literature_search"] : []), ...(id === "help-labmate" ? ["mentoring"] : [])],
}));
