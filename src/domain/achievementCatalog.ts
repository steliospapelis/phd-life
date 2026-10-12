import type { AchievementRuleType } from "@/src/types/models";

export type AchievementDefinition = {
  slug: string;
  name: string;
  description: string;
  iconKey: string;
  badgeKey: string;
  category: string;
  ruleType: AchievementRuleType;
  ruleConfig: Record<string, unknown>;
  rarity: string;
  xpReward: number;
  sortOrder: number;
};

export const achievementCatalog: AchievementDefinition[] = [
  // Existing achievements
  ["it-begins", "It Begins", "Complete your first valid task.", "🌱", "Meta", "total_tasks", { type: "total_tasks", count: 1 }, "common", 20, 1],
  ["paper-trail", "Paper Trail", "Read 10 papers or book chapters.", "📚", "Research", "task_set_count", { type: "task_set_count", taskSlugs: ["read-paper", "read-book-chapter"], count: 10 }, "common", 30, 2],
  ["pdf-collector", "Professional PDF Collector", "Read 20 papers or book chapters.", "📖", "Research", "task_set_count", { type: "task_set_count", taskSlugs: ["read-paper", "read-book-chapter"], count: 20 }, "rare", 50, 3],
  ["citation-machine", "Citation Machine", "Extract 25 useful citations.", "🔖", "Research", "task_count", { type: "task_count", taskSlug: "extract-citations", count: 25 }, "rare", 50, 4],
  ["literature-cartographer", "Literature Cartographer", "Plan 10 literature searches.", "🗺️", "Research", "task_count", { type: "task_count", taskSlug: "search-strategy", count: 10 }, "rare", 40, 5],
  ["works-on-my-machine", "Works On My Machine", "Complete 10 coding activities.", "💻", "Coding", "tag_count", { type: "tag_count", tag: "coding", count: 10 }, "rare", 40, 10],
  ["debugging-diplomat", "Debugging Diplomat", "Complete 10 coding activities.", "🐞", "Coding", "tag_count", { type: "tag_count", tag: "coding", count: 10 }, "rare", 60, 11],
  ["data-cleaner", "Data Cleaner", "Clean 10 datasets.", "🧹", "Experiment/Data", "task_count", { type: "task_count", taskSlug: "clean-dataset", count: 10 }, "rare", 40, 20],
  ["science-technically-occurred", "Science Technically Occurred", "Perform 10 experiments.", "🧪", "Experiment/Data", "task_count", { type: "task_count", taskSlug: "perform-experiment", count: 10 }, "common", 50, 21],
  ["results-have-entered-the-chat", "Results Have Entered the Chat", "Analyze 10 datasets or experimental outputs.", "📊", "Experiment/Data", "tag_count", { type: "tag_count", tag: "data_analysis", count: 10 }, "rare", 50, 22],
  ["inbox-warrior", "Inbox Warrior", "Write 10 academic emails.", "📨", "Email/Admin", "task_count", { type: "task_count", taskSlug: "write-email", count: 10 }, "common", 30, 30],
  ["calendar-tetris", "Calendar Tetris", "Complete 10 meeting-related tasks.", "🗓️", "Email/Admin", "task_set_count", { type: "task_set_count", taskSlugs: ["schedule-meeting", "survive-supervisor-meeting"], count: 10 }, "rare", 40, 31],
  ["admin-adjacent", "Admin Adjacent", "Complete 25 administrative tasks.", "🗂️", "Email/Admin", "tag_count", { type: "tag_count", tag: "admin", count: 25 }, "rare", 60, 32],
  ["helpful-by-accident", "Helpful By Accident", "Help 10 labmates.", "🤝", "Teaching", "task_count", { type: "task_count", taskSlug: "help-labmate", count: 10 }, "rare", 40, 40],
  ["teaching-assistant-energy", "Teaching Assistant Energy", "Complete 20 teaching activities.", "🎓", "Teaching", "tag_count", { type: "tag_count", tag: "teaching", count: 20 }, "rare", 60, 41],
  ["conference-creature", "Conference Creature", "Attend or present at 5 conferences.", "🎤", "Conferences", "task_set_count", { type: "task_set_count", taskSlugs: ["attend-conference", "present-in-conference"], count: 5 }, "rare", 50, 50],
  ["posterity", "Posterity", "Present at 5 conferences.", "🖼️", "Conferences", "task_count", { type: "task_count", taskSlug: "present-in-conference", count: 5 }, "rare", 50, 51],
  ["submission-season", "Submission Season", "Submit 3 papers or proposals.", "📤", "Publication", "tag_count", { type: "tag_count", tag: "paper_submission", count: 3 }, "rare", 80, 60],
  ["publication-adjacent", "Publication Adjacent", "Submit 5 journal papers.", "🏅", "Publication", "task_count", { type: "task_count", taskSlug: "submit-journal-paper", count: 5 }, "epic", 100, 61],
  ["all-the-tabs", "All the Tabs", "Work across 5 task categories.", "🗃️", "Meta", "distinct_categories", { type: "distinct_categories", count: 5 }, "rare", 60, 70],
  ["active-researcher", "Active Researcher", "Log valid activities on 10 distinct calendar days.", "🔬", "Meta", "active_days", { type: "active_days", count: 10 }, "rare", 40, 71],
  ["research-has-become-a-lifestyle", "Research Has Become a Lifestyle", "Complete 20 writing activities and 20 teaching activities.", "🌙", "Meta", "all", { type: "all", rules: [{ type: "tag_count", tag: "writing", count: 20 }, { type: "tag_count", tag: "teaching", count: 20 }] }, "epic", 120, 72],
  ["still-here", "Still Here", "Reach level 5.", "🫡", "Meta", "level", { type: "level", level: 5 }, "epic", 50, 73],

  // General progress
  ["one-hundred-tiny-wins", "One Hundred Tiny Wins", "Complete 100 tasks.", "💯", "Meta", "total_tasks", { type: "total_tasks", count: 100 }, "epic", 80, 80],
  ["two-hundred-plot-twists", "Two Hundred Plot Twists", "Complete 200 tasks.", "🎢", "Meta", "total_tasks", { type: "total_tasks", count: 200 }, "epic", 120, 81],
  ["xp-gremlin", "XP Gremlin", "Earn 1,000 XP.", "🪙", "Meta", "total_xp", { type: "total_xp", count: 1000 }, "rare", 60, 82],
  ["xp-hoarder", "XP Hoarder", "Earn 5,000 XP.", "💰", "Meta", "total_xp", { type: "total_xp", count: 5000 }, "epic", 150, 83],
  ["no-zero-days", "No Zero Days", "Log activity on 7 consecutive days.", "🔥", "Meta", "streak_days", { type: "streak_days", count: 7 }, "epic", 100, 84],
  ["consistently-questionable", "Consistently Questionable", "Log activities on 30 distinct calendar days.", "📅", "Meta", "active_days", { type: "active_days", count: 30 }, "epic", 120, 85],
  ["weekly-regular", "The Weekly Regular", "Log activities on 7 distinct calendar days.", "🗓️", "Meta", "active_days", { type: "active_days", count: 7 }, "rare", 40, 86],
  ["category-collector", "Category Collector", "Complete at least one task in all 8 task categories.", "🧩", "Meta", "distinct_categories", { type: "distinct_categories", count: 8 }, "epic", 80, 87],

  // Reading
  ["abstract-survivor", "Abstract Survivor", "Skim 25 abstracts.", "👀", "Reading", "task_count", { type: "task_count", taskSlug: "skim-abstract", count: 25 }, "common", 30, 100],
  ["notes-were-actually-taken", "Notes Were Actually Taken", "Take notes on 10 papers.", "🗒️", "Reading", "task_count", { type: "task_count", taskSlug: "paper-notes", count: 10 }, "rare", 40, 101],
  ["chapter-and-verse", "Chapter and Verse", "Read 5 book chapters.", "📘", "Reading", "task_count", { type: "task_count", taskSlug: "read-book-chapter", count: 5 }, "rare", 40, 102],
  ["gap-spotter", "Gap Spotter", "Identify 5 research gaps.", "💡", "Reading", "task_count", { type: "task_count", taskSlug: "identify-research-gap", count: 5 }, "rare", 50, 103],
  ["citation-archaeologist", "Citation Archaeologist", "Extract 50 useful citations.", "🏺", "Reading", "task_count", { type: "task_count", taskSlug: "extract-citations", count: 50 }, "epic", 80, 104],
  ["literature-loop", "Literature Loop", "Read 50 papers or book chapters.", "🔁", "Reading", "task_set_count", { type: "task_set_count", taskSlugs: ["read-paper", "read-book-chapter"], count: 50 }, "epic", 120, 105],

  // Writing
  ["paragraph-polisher", "Paragraph Polisher", "Revise 25 paragraphs.", "🔧", "Writing", "task_count", { type: "task_count", taskSlug: "revise-paragraph", count: 25 }, "rare", 50, 120],
  ["section-by-section", "Section by Section", "Write 10 sections.", "✍️", "Writing", "task_count", { type: "task_count", taskSlug: "write-section", count: 10 }, "rare", 60, 121],
  ["outline-first-panic-later", "Outline First, Panic Later", "Prepare 10 outlines.", "🗂️", "Writing", "task_count", { type: "task_count", taskSlug: "prepare-outline", count: 10 }, "rare", 40, 122],
  ["figure-it-out", "Figure It Out", "Create 10 figures or tables.", "📈", "Writing", "task_count", { type: "task_count", taskSlug: "craft-figure-table", count: 10 }, "rare", 50, 123],
  ["revision-season", "Revision Season", "Revise 50 paragraphs.", "♻️", "Writing", "task_count", { type: "task_count", taskSlug: "revise-paragraph", count: 50 }, "epic", 100, 124],
  ["the-abstract-is-abstracting", "The Abstract Is Abstracting", "Write 10 abstracts.", "🧾", "Writing", "task_count", { type: "task_count", taskSlug: "prepare-abstract", count: 10 }, "rare", 60, 125],
  ["journal-portal-regular", "Journal Portal Regular", "Submit 3 journal papers.", "🚀", "Writing", "task_count", { type: "task_count", taskSlug: "submit-journal-paper", count: 3 }, "epic", 120, 126],

  // Research
  ["questionable-questions", "Questionable Questions", "Define 10 research questions.", "❓", "Research", "task_count", { type: "task_count", taskSlug: "research-question", count: 10 }, "rare", 50, 140],
  ["protocol-protocol", "Protocol Protocol", "Design 5 study protocols.", "📑", "Research", "task_count", { type: "task_count", taskSlug: "design-protocol", count: 5 }, "rare", 60, 141],
  ["dataset-janitor", "Dataset Janitor", "Clean 25 datasets.", "🧹", "Research", "task_count", { type: "task_count", taskSlug: "clean-dataset", count: 25 }, "epic", 100, 142],
  ["statistically-speaking", "Statistically Speaking", "Perform 10 statistical analyses.", "📊", "Research", "task_count", { type: "task_count", taskSlug: "statistical-analysis", count: 10 }, "epic", 80, 143],
  ["questionnaire-era", "Questionnaire Era", "Create 5 questionnaires.", "📝", "Research", "task_count", { type: "task_count", taskSlug: "create-questionnaire", count: 5 }, "rare", 50, 144],
  ["hypothesis-whisperer", "Hypothesis Whisperer", "Confirm 5 hypotheses.", "✅", "Research", "task_count", { type: "task_count", taskSlug: "confirm-hypothesis", count: 5 }, "epic", 100, 145],
  ["interpretation-station", "Interpretation Station", "Interpret 15 sets of results.", "💡", "Research", "task_count", { type: "task_count", taskSlug: "interpret-results", count: 15 }, "epic", 80, 146],

  // Coding
  ["script-kiddie-academically", "Script Kiddie, Academically", "Finish 10 scripts.", "📜", "Coding", "task_count", { type: "task_count", taskSlug: "finish-script", count: 10 }, "rare", 50, 160],
  ["pipeline-dreams", "Pipeline Dreams", "Create 5 pipelines.", "🔌", "Coding", "task_count", { type: "task_count", taskSlug: "create-pipeline", count: 5 }, "rare", 80, 161],
  ["feature-creep-but-productive", "Feature Creep, But Productive", "Add 10 features.", "✨", "Coding", "task_count", { type: "task_count", taskSlug: "add-feature", count: 10 }, "rare", 50, 162],
  ["interface-enjoyer", "Interface Enjoyer", "Create 5 interfaces.", "🖥️", "Coding", "task_count", { type: "task_count", taskSlug: "create-interface", count: 5 }, "rare", 60, 163],
  ["works-on-most-machines", "Works On Most Machines", "Run 25 models.", "🤖", "Coding", "task_count", { type: "task_count", taskSlug: "run-model", count: 25 }, "epic", 80, 164],
  ["full-stack-researcher", "Full Stack Researcher", "Develop 3 apps.", "📱", "Coding", "task_count", { type: "task_count", taskSlug: "develop-app", count: 3 }, "epic", 150, 165],

  // Experiments
  ["calibrated-and-concerned", "Calibrated and Concerned", "Calibrate equipment 10 times.", "🎛️", "Experiments", "task_count", { type: "task_count", taskSlug: "calibrate-equipment", count: 10 }, "rare", 50, 180],
  ["sample-size-matters", "Sample Size Matters", "Prepare 25 samples.", "🧫", "Experiments", "task_count", { type: "task_count", taskSlug: "prepare-samples", count: 25 }, "epic", 80, 181],
  ["observation-nation", "Observation Nation", "Record 50 observations.", "🔎", "Experiments", "task_count", { type: "task_count", taskSlug: "record-observations", count: 50 }, "epic", 80, 182],
  ["lab-coat-energy", "Lab Coat Energy", "Perform 25 experiments.", "🥼", "Experiments", "task_count", { type: "task_count", taskSlug: "perform-experiment", count: 25 }, "epic", 120, 183],
  ["the-data-is-in", "The Data Is In", "Analyze 25 experimental datasets.", "🧪", "Experiments", "task_count", { type: "task_count", taskSlug: "analyze-experimental-data", count: 25 }, "epic", 100, 184],

  // Academic life
  ["seminar-regular", "Seminar Regular", "Attend 10 seminars.", "🎤", "Academic", "task_count", { type: "task_count", taskSlug: "seminar", count: 10 }, "rare", 40, 200],
  ["conference-circuit", "Conference Circuit", "Attend 10 conferences.", "🎟️", "Academic", "task_count", { type: "task_count", taskSlug: "attend-conference", count: 10 }, "epic", 100, 201],
  ["reviewer-two", "Reviewer Two", "Review 10 papers.", "🧐", "Academic", "task_count", { type: "task_count", taskSlug: "review-paper", count: 10 }, "epic", 80, 202],
  ["professional-small-talk", "Professional Small Talk", "Network with 20 researchers.", "🤝", "Academic", "task_count", { type: "task_count", taskSlug: "network-researcher", count: 20 }, "rare", 60, 203],
  ["proposal-machine", "Proposal Machine", "Submit 5 proposals.", "📨", "Academic", "task_count", { type: "task_count", taskSlug: "submit-proposal", count: 5 }, "epic", 100, 204],
  ["exam-season-survivor", "Exam Season Survivor", "Pass 3 exams.", "📝", "Academic", "task_count", { type: "task_count", taskSlug: "pass-exam", count: 3 }, "epic", 100, 205],
  ["classically-academic", "Classically Academic", "Attend 20 classes.", "📚", "Academic", "task_count", { type: "task_count", taskSlug: "attend-class", count: 20 }, "rare", 80, 206],

  // Teaching
  ["feedback-loop", "Feedback Loop", "Give feedback to 25 students.", "💬", "Teaching", "task_count", { type: "task_count", taskSlug: "give-student-feedback", count: 25 }, "epic", 80, 220],
  ["gradebook-goblin", "Gradebook Goblin", "Grade 50 papers.", "📝", "Teaching", "task_count", { type: "task_count", taskSlug: "grade-paper", count: 50 }, "epic", 100, 221],
  ["lecture-circuit", "Lecture Circuit", "Prepare 10 lectures.", "📚", "Teaching", "task_count", { type: "task_count", taskSlug: "prepare-lecture", count: 10 }, "rare", 60, 222],
  ["workshop-wizard", "Workshop Wizard", "Help with 10 workshops.", "🧑‍🏫", "Teaching", "task_count", { type: "task_count", taskSlug: "help-workshop", count: 10 }, "rare", 60, 223],
  ["teaching-in-public", "Teaching in Public", "Teach 10 classes or workshops.", "🏫", "Teaching", "task_count", { type: "task_count", taskSlug: "teach-class-workshop", count: 10 }, "epic", 100, 224],
  ["exam-room-veteran", "Exam Room Veteran", "Supervise 10 exams.", "🧾", "Teaching", "task_count", { type: "task_count", taskSlug: "supervise-exam", count: 10 }, "epic", 80, 225],
  ["labmate-lifeline", "Labmate Lifeline", "Help 25 labmates.", "🫶", "Teaching", "task_count", { type: "task_count", taskSlug: "help-labmate", count: 25 }, "epic", 100, 226],

  // Admin
  ["call-me-maybe", "Call Me Maybe", "Make 20 calls.", "📞", "Admin", "task_count", { type: "task_count", taskSlug: "make-call", count: 20 }, "rare", 40, 240],
  ["formidable", "Formidable", "Fill in 15 forms.", "📋", "Admin", "task_count", { type: "task_count", taskSlug: "fill-form", count: 15 }, "rare", 60, 241],
  ["filing-cabinet-energy", "Filing Cabinet Energy", "Organise files 25 times.", "🗃️", "Admin", "task_count", { type: "task_count", taskSlug: "organise-files", count: 25 }, "rare", 50, 242],
  ["desk-reset", "Desk Reset", "Clean your desk 20 times.", "🧽", "Admin", "task_count", { type: "task_count", taskSlug: "clean-desk", count: 20 }, "rare", 40, 243],
  ["week-planner", "Week Planner", "Plan 20 weeks.", "🗺️", "Admin", "task_count", { type: "task_count", taskSlug: "plan-week", count: 20 }, "rare", 40, 244],
  ["supervisor-survivor", "Supervisor Survivor", "Survive 10 supervisor meetings.", "🫡", "Admin", "task_count", { type: "task_count", taskSlug: "survive-supervisor-meeting", count: 10 }, "epic", 80, 245],
  ["email-final-boss", "Email Final Boss", "Write 100 academic emails.", "📧", "Admin", "task_count", { type: "task_count", taskSlug: "write-email", count: 100 }, "epic", 100, 246],

  // Social
  ["citation-economy", "Citation Economy", "Cite 10 labmate activity posts.", "🪙", "Social", "citation_given", { type: "citation_given", count: 10 }, "rare", 50, 260],
  ["community-scholar", "Community Scholar", "Cite 50 labmate activity posts.", "🌐", "Social", "citation_given", { type: "citation_given", count: 50 }, "epic", 120, 261],
  ["research-is-better-together", "Research Is Better Together", "Have 3 active labmates.", "🧑‍🔬", "Social", "friend_count", { type: "friend_count", count: 3 }, "rare", 60, 262],
  ["small-wins-network", "Small Wins Network", "Receive citations from 3 different labmates.", "🌟", "Social", "citation_received", { type: "citation_received", count: 3 }, "epic", 100, 263],
].map(([slug, name, description, iconKey, category, ruleType, ruleConfig, rarity, xpReward, sortOrder]) => ({ slug, name, description, iconKey, badgeKey: slug, category, ruleType, ruleConfig, rarity, xpReward, sortOrder })) as AchievementDefinition[];
