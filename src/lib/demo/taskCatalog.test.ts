import { describe, expect, it } from "vitest";
import { demoTasks } from "@/src/lib/demo/taskCatalog";

describe("task catalog", () => {
  it("has the agreed research tasks in ascending XP order", () => {
    const research = demoTasks.filter((task) => task.categoryId === "research");
    expect(research.map((task) => [task.name, task.xpReward])).toEqual([
      ["Define a research question", 10],
      ["Plan a literature search", 10],
      ["Clean a dataset", 20],
      ["Create a questionnaire", 20],
      ["Interpret results", 20],
      ["Design a study protocol", 25],
      ["Complete data collection", 30],
      ["Perform a statistical analysis", 30],
      ["Confirm a hypothesis", 50],
    ]);
    expect(research).toHaveLength(9);
  });

  it("has the six agreed reading tasks in ascending XP order", () => {
    const reading = demoTasks.filter((task) => task.categoryId === "reading");
    expect(reading.map((task) => [task.name, task.xpReward])).toEqual([
      ["Skim an abstract", 2],
      ["Extract useful citations", 3],
      ["Read a paper", 10],
      ["Take paper notes", 10],
      ["Read a book chapter", 20],
      ["Identify a research gap", 30],
    ]);
  });

  it("has the agreed writing rewards in ascending XP order", () => {
    const writing = demoTasks.filter((task) => task.categoryId === "writing");
    expect(writing.map((task) => [task.name, task.xpReward])).toEqual([
      ["Revise a paragraph", 5],
      ["Craft a figure or table", 10],
      ["Write the abstract", 10],
      ["Prepare an outline", 10],
      ["Write a section", 20],
      ["Finish a thesis section", 100],
      ["Submit a conference paper", 300],
      ["Submit a journal paper", 500],
    ]);
    expect(writing).toHaveLength(8);
  });

  it("has the agreed coding tasks in ascending XP order", () => {
    const coding = demoTasks.filter((task) => task.categoryId === "coding");
    expect(coding.map((task) => [task.name, task.xpReward])).toEqual([
      ["Add a feature", 5],
      ["Create a pipeline", 10],
      ["Finish a script", 10],
      ["Run a model", 10],
      ["Set up the environment", 10],
      ["Create an interface", 20],
      ["Develop an app", 50],
    ]);
    expect(coding).toHaveLength(7);
  });

  it("has the agreed experiment tasks in ascending XP order", () => {
    const experiments = demoTasks.filter((task) => task.categoryId === "experiments");
    expect(experiments.map((task) => [task.name, task.xpReward])).toEqual([
      ["Clean the lab", 5],
      ["Prepare samples", 5],
      ["Calibrate equipment", 10],
      ["Prepare an experiment protocol", 10],
      ["Record observations", 10],
      ["Analyze experimental data", 20],
      ["Perform an experiment", 20],
    ]);
    expect(experiments).toHaveLength(7);
  });

  it("has the agreed academic tasks in ascending XP order", () => {
    const academic = demoTasks.filter((task) => task.categoryId === "academic");
    expect(academic.map((task) => [task.name, task.xpReward])).toEqual([
      ["Attend a class", 5],
      ["Attend a seminar", 10],
      ["Network with another researcher", 10],
      ["Attend a conference", 20],
      ["Review a paper", 20],
      ["Pass an exam", 50],
      ["Submit a proposal", 50],
      ["Present in a conference", 100],
    ]);
    expect(academic).toHaveLength(8);
  });

  it("has the agreed teaching tasks in ascending XP order", () => {
    const teaching = demoTasks.filter((task) => task.categoryId === "teaching");
    expect(teaching.map((task) => [task.name, task.xpReward])).toEqual([
      ["Grade a paper", 5],
      ["Give a student feedback", 10],
      ["Help a labmate", 10],
      ["Help in a workshop", 10],
      ["Prepare a lecture", 10],
      ["Supervise exam", 10],
      ["Teach a class / workshop", 20],
    ]);
    expect(teaching).toHaveLength(7);
  });

  it("has the agreed admin tasks in ascending XP order", () => {
    const admin = demoTasks.filter((task) => task.categoryId === "admin");
    expect(admin.map((task) => [task.name, task.xpReward])).toEqual([
      ["Clean your desk", 2],
      ["Make a call", 2],
      ["Organise files", 2],
      ["Plan the week", 2],
      ["Schedule a meeting", 2],
      ["Write an email", 2],
      ["Fill a form", 3],
      ["Survive a meeting with the supervisor", 5],
    ]);
    expect(admin).toHaveLength(8);
  });

  it("keeps rewards in the intentional progression bands", () => {
    expect(Math.min(...demoTasks.map((task) => task.xpReward))).toBe(2);
    expect(Math.max(...demoTasks.map((task) => task.xpReward))).toBe(500);
    expect(demoTasks.every((task) => task.sanityDelta === 0)).toBe(true);
  });
});
