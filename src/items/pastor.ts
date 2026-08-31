/**
 * The Pastor and Preacher bank: forty items, ten dimensions, four each.
 *
 * This persona educates as much as it assesses. Every item carries a `why`,
 * explaining in plain words what the question is listening for, and a `deeper`
 * pointer to a source or a passage. Neither ever hints at a healthy answer.
 *
 * Quotations appear only where they were supplied and can be checked. Where a
 * source is named without a quotation, that is deliberate: this report tells a
 * preacher never to preach an unverified quotation, and it holds itself to the
 * same standard. See docs/compass/sources/pastor/README.md.
 */

import type { Item, ItemOption } from "../engine/types";
import { claim, reverse, scenario } from "./shared";

const P = "pastor" as const;

/** A formation item: four anchors and an honest way out. */
function formation(
  construct: Item["construct"], prompt: string, anchors: [string, string, string, string],
  why: string, deeper: string, opts: Partial<Item> = {}
): Item {
  const options: ItemOption[] = anchors.map((label, i) => ({ value: i + 1, label }));
  options.push({ value: 0, label: "Not enough experience to say" });
  return {
    id: `${P}_${construct}_form`, persona: P, type: "outcome", construct,
    prompt, options, why, deeper, version: 2,
    context: "Compare your ministry now with before AI was part of it. If it is too early to tell, say so; that answer is not counted against you.",
    ...opts,
  };
}

export const PASTOR_ITEMS: Item[] = [
  /* --------------------------------------------- 1. Authorship Before God */
  claim(P, "agency",
    "When I stand to preach, I can explain in my own words why every major point is in the message, and how prayer and the text brought me to it.",
    "agreement", {
      why: "This is not about how much AI you used; it is about who authored the message. A preacher who can trace each point back to the text, to prayer, and to their own conviction has kept authorship, whatever tools helped along the way.",
      deeper: "James Spencer, “Theological Dispositions in a Digital World”: God as the one “to whom we must always respond”.",
      dependenceTags: { 4: ["prayer_present"], 5: ["prayer_present"] },
    }),
  reverse(P, "agency",
    "If an AI outline is theologically sound and well organized, I generally preach it. Reworking it would waste time the church needs from me elsewhere.",
    "agreement", "sermon_outsourcing", {
      why: "Efficiency is a real pressure in ministry, and this question does not pretend otherwise. It asks whether a good outline from a tool has begun to stand in for the work of receiving a word for these people.",
      deeper: "Alin Vrancila, “Created to Create”, in Faith at Work: the church “needs faithful shepherds who have listened to God and to their people”.",
      dependenceTags: { 4: ["tool_first"], 5: ["tool_first"] },
    }),
  scenario(P, "agency",
    "It is Thursday. The week has been consumed by a funeral and two crises, and you have nothing for Sunday. An AI tool produces a complete, sound, moving sermon on the passage in thirty seconds.", [
      "Preach it close to as written. Your people need a word, and this is a good one.",
      "Preach it with your own opening and a personal story added.",
      "Use its structure, but read the passage again and rewrite each point in your own words.",
      "Set it aside, pray, read the passage, and preach a shorter, simpler message that is yours, using the tool only to check your work.",
      "Do that, tell your leaders honestly what the week cost you, and let the message be shaped by the funeral and the crises, because that is where God met you this week.",
    ], "sermon_outsourcing", {
      why: "Every preacher has had this Thursday. The question is not whether you feel the pull; it is what you do with it. A shorter true word from a tired shepherd who prayed is not a failure of preparation.",
      deeper: "2 Corinthians 12:9, NLT: “My grace is all you need. My power works best in weakness.”",
      effects: { 1: { responsibleUse: -5, creativity: -6 } },
      optionSignals: { 1: ["sermon_outsourcing"] },
      dependenceTags: { 1: ["tool_first"], 4: ["prayer_present", "text_first"], 5: ["prayer_present", "text_first"] },
    }),
  formation("agency",
    "Since AI entered your ministry, your sense that the message you preach is genuinely yours, received from God and shaped by your study, has:", [
      "Weakened noticeably.",
      "Weakened somewhat.",
      "Stayed the same.",
      "Strengthened, because the tool freed you for the parts that matter.",
    ],
    "Ownership of the message is something you can feel from the inside before anyone else notices a change. This asks you to name that feeling honestly.",
    "Alin Vrancila, “Navigating the Agathokakological Age”: preaching “from a place of brokenness, repentance, and the ongoing experience of the Holy Spirit”.",
    { secondary: [{ construct: "amplification", weight: 0.4 }] }),

  /* -------------------------------------------- 2. Faithfulness to the Text */
  claim(P, "verification",
    "Any quotation, citation, word study, or historical claim an AI gives me is checked against the source or the text before I use it from the pulpit.",
    "agreement", {
      why: "AI produces confident, fluent, and sometimes invented material: quotations no author wrote, Greek meanings no lexicon supports, church history that never happened. The pulpit carries authority, and a fabricated quotation preached with conviction does damage a correction cannot fully undo.",
      deeper: "Faith at Work: AI “can invent sources, distort meaning, and repeat falsehoods”.",
    }),
  reverse(P, "verification",
    "The AI tools I use are reliable enough on Scripture and theology that checking their exegesis line by line is no longer necessary.",
    "agreement", "unverified_exegesis", {
      why: "This is asked gently, because the tools really have improved and the temptation is reasonable. The question is whether your checking has quietly stopped, since the errors that remain are the hardest to see.",
      deeper: "1 Thessalonians 5:21, NLT: “test everything that is said. Hold on to what is good.”",
    }),
  scenario(P, "verification",
    "An AI research assistant gives you a striking quotation from Augustine that fits your sermon perfectly, with a citation to the Confessions.", [
      "Use it as given. The citation looks real and it is exactly right.",
      "Use it, but attribute it loosely as something one of the church fathers said.",
      "Search for the quotation online and use it if a site or two repeats it.",
      "Find the passage in the Confessions itself, read the context, and use it only if it says what the tool claimed.",
      "Do that, and when you cannot find it, tell your people you could not verify it or drop it entirely, keeping a habit of never preaching an unverified quotation.",
    ], "fabricated_citation_risk", {
      why: "This exact situation has caught careful preachers. Verified quotations are not pedantry; they are truthfulness practiced in public.",
      deeper: "James Spencer, “The Quad”: asking what skill and what sources stand behind a claim.",
      optionSignals: { 1: ["fabricated_citation_risk", "tool_as_oracle"], 3: ["fabricated_citation_risk"] },
    }),
  formation("verification",
    "Since AI entered your ministry, how often something you preached later turned out to be inaccurate (a misattributed quote, a wrong word meaning, a historical claim that was not so) has:", [
      "Increased.",
      "Stayed about the same.",
      "Decreased somewhat.",
      "Decreased clearly, because checking is now built into your preparation.",
    ],
    "Errors that reach the pulpit are the honest measure of a verification habit. This question is asked so you can see the trend, not to keep score.",
    "Deuteronomy 19:15, NLT: facts established by two or three witnesses."),

  /* ---------------------------------------- 3. Unaided Preaching Capacity */
  claim(P, "dependencySafety",
    "If I lost access to every AI tool this week, I could still prepare and preach a faithful message from the text, with my Bible, my study, and prayer.",
    "confidence", {
      why: "This is the outage test, and it is about muscle, not morality. A preacher whose study muscles are strong can use any tool freely; a preacher whose muscles have thinned depends on the tool whether they mean to or not.",
      deeper: "Faith at Work, on cognitive debt and “the deliberate recovery of friction”.",
      dependenceTags: { 4: ["prayer_present"], 5: ["prayer_present"] },
    }),
  reverse(P, "dependencySafety",
    "Honestly, I am not sure I could produce a full sermon from scratch anymore without AI somewhere in the process.",
    "agreement", "study_atrophy", {
      why: "This is one of the hardest questions in the check, and it is asked without judgment. Naming it privately is the first step, and the practices at the end are built for exactly this.",
      deeper: "Hebrews 5:14, NLT: maturity that comes through training.",
    }),
  scenario(P, "dependencySafety",
    "A guest speaker cancels on Saturday night. You must preach a text you have not studied, and there is no internet where you are staying.", [
      "You would be lost. Your preparation lives in the tools.",
      "You would recycle an old message rather than face the new text.",
      "You would manage a thin message from memory.",
      "You would open the text, read it slowly, pray, outline it by hand, and preach it plainly, as you were trained to do.",
      "You would do that gladly, because you still prepare that way regularly on purpose, and the tools are additions to a practice that stands on its own.",
    ], "study_atrophy", {
      why: "The scenario is rare; the capacity it tests is used every week whether you notice or not. Preachers who keep a tool-free rhythm in their preparation are not being old-fashioned, they are keeping the well from drying up.",
      deeper: "Deuteronomy 8:3, NLT: living by every word that comes from the mouth of the Lord.",
      optionSignals: { 1: ["study_atrophy"] },
      dependenceTags: { 1: ["tool_first"], 4: ["prayer_present", "text_first"], 5: ["prayer_present", "text_first"] },
    }),
  formation("dependencySafety",
    "Since AI entered your ministry, the amount of preparation you still do with only the text, a few trusted books, and prayer has:", [
      "Nearly disappeared.",
      "Shrunk a lot.",
      "Shrunk somewhat.",
      "Stayed protected on purpose.",
    ],
    "What you protect reveals what you value. The question asks about a rhythm, not a rule.",
    "Alin Vrancila, “Navigating the Agathokakological Age”, on skills that come only from genuine human experience.",
    {
      secondary: [{ construct: "transfer", weight: 0.4 }],
      dependenceTags: { 1: ["prayer_absent"], 2: ["prayer_absent"], 4: ["prayer_present"] },
    }),

  /* ------------------------------------------------ 4. Ministry AI Fluency */
  claim(P, "fluency",
    "I have a clear sense of which parts of ministry I let AI touch (administration, editing, research prompts, translation) and which I keep entirely human, and I could explain the line to my elders.",
    "confidence", {
      why: "Fluency in ministry is not prompting skill; it is knowing where the tool belongs. A pastor who has drawn the line consciously can use AI heavily in one place and not at all in another without contradiction.",
      deeper: "Faith at Work: using AI carefully “for administration, scheduling, editing, and communication”.",
    }),
  reverse(P, "fluency",
    "I use AI wherever it seems to help, and I have not really thought through which ministry tasks it should stay out of.",
    "agreement", "tool_as_oracle", {
      why: "This is how most people start, and it is not a failure. It is the point at which a line has not yet been drawn, and this check is a good place to draw it.",
      deeper: "James Spencer, “Human Capacity and Technology”: technology as object, knowledge, activity, and volition.",
    }),
  scenario(P, "fluency",
    "A ministry software vendor offers an AI feature that will draft your pastoral emails, follow-up texts to visitors, and condolence notes automatically from your calendar.", [
      "Turn it all on. It will save hours a week.",
      "Turn it on for everything except condolence notes.",
      "Use it to draft visitor follow-ups that you edit before sending.",
      "Use it for scheduling and logistics only, and keep any message that touches a person's life in your own hand.",
      "Do that, and tell the team why: some inconveniences are part of the pastoral office, and a note you wrote yourself is part of caring for someone.",
    ], "pastoral_care_outsourcing", {
      why: "Spencer chose not to let AI write his emails, because he did not want to dishonor people by denying them his time and attention. That is a considered position rather than a rule for everyone; this question asks where your own line sits.",
      deeper: "James Spencer, “Introduction: Discernment in the Digital Age”, on preserving human-to-human interaction.",
      effects: { 1: { responsibleUse: -6 } },
      optionSignals: { 1: ["pastoral_care_outsourcing"] },
    }),
  formation("fluency",
    "Since AI entered your ministry, your confidence in knowing what to hand the tool and what to keep has:", [
      "Decreased.",
      "Stayed unclear.",
      "Grown somewhat.",
      "Grown clearly, with a line you can state.",
    ],
    "Confidence about the line, rather than enthusiasm for the tool, is what fluency looks like in ministry.",
    "Todd Korpi, AI Goes to Church: pastoral wisdom for congregations meeting these tools."),

  /* ------------------------------------------- 5. Formation of the Preacher */
  claim(P, "transfer",
    "What I learn while preparing a sermon stays with me. Weeks later I can still teach the passage, recall the insights, and see how it changed my own walk.",
    "agreement", {
      why: "Preparation is meant to form the preacher first. If insights arrive from a tool and leave with the closed tab, the sermon was delivered but the preacher was not fed.",
      deeper: "James Spencer, “The Quad”, on Deuteronomy 17: the king wrote out his own copy of the law.",
    }),
  reverse(P, "transfer",
    "I often could not preach last month's sermon again without looking at the file, because much of it came from the tool rather than from my own study.",
    "agreement", "formation_bypass", {
      why: "Memory is not the goal for its own sake; it is evidence that the word passed through you. This is asked because the difference is invisible on Sunday and obvious in a year.",
      deeper: "Faith at Work: “I read first, think first, write first, and then use AI for feedback or clarification.”",
    }),
  scenario(P, "transfer",
    "You are preparing a series on Romans 8, and an AI tool offers to produce all six sermons, fully exegeted and illustrated, so you can focus on people that month.", [
      "Accept. The people need you more than the desk does.",
      "Accept the outlines, and add personal touches each week.",
      "Do your own study first each week, then compare it with what the tool suggests.",
      "Do your own study first, use the tool only to test your reading against other perspectives, and keep what you learned in your own notes.",
      "Do that, and treat the month in Romans 8 as formation for yourself, expecting the text to work on you before it works through you.",
    ], "formation_bypass", {
      why: "Time given to people is good; time taken from the preacher's own formation is a cost that compounds. The scenario asks how you weigh them.",
      deeper: "Psalm 1:2, NLT: delighting in the law of the Lord and meditating on it day and night.",
      optionSignals: { 1: ["sermon_outsourcing", "formation_bypass"] },
      dependenceTags: { 1: ["tool_first"], 4: ["text_first"], 5: ["text_first"] },
    }),
  formation("transfer",
    "Since AI entered your ministry, how much of your sermon preparation shapes your own walk with God, and not only the message you deliver, has:", [
      "Shrunk a lot.",
      "Shrunk somewhat.",
      "Stayed the same.",
      "Grown, because the tool clears space for real study.",
    ],
    "Preachers are formed in the study or they are not formed there. This asks for an honest read of a private thing.",
    "James Spencer, “Theological Dispositions in a Digital World”, on habitus: patterns refined as we respond to God."),

  /* -------------------------------------------------------- 6. Deeper Study */
  claim(P, "amplification",
    "I use AI to push my study further: to argue against my reading, surface interpretations I had not considered, and find the weak point in my argument before my people do.",
    "agreement", {
      why: "This is where AI can genuinely serve a preacher. Used as a sparring partner rather than a ghostwriter, it can deepen exegesis and expose lazy moves. The question asks whether that is how you use it.",
      deeper: "James Spencer, “The Quad”, as a calm, thoughtful, theological way of testing any claim.",
    }),
  reverse(P, "amplification",
    "For me AI mainly saves time on sermon work. It has not really changed how deeply I understand the text.",
    "agreement", "shallow_use", {
      why: "Saving time is legitimate, and it is also the shallowest thing the tool can do for a preacher. This is asked without judgment, to show whether depth is on the table at all.",
      deeper: "Todd Korpi, quoted in “Navigating the Agathokakological Age”: “AI deals in knowledge, humans deal in wisdom.”",
    }),
  scenario(P, "amplification",
    "You are settled on a reading of a difficult passage, and the sermon is nearly done.", [
      "Do not consult AI. Your reading is fine and you are out of time.",
      "Ask AI to confirm your reading and polish the outline.",
      "Ask AI what other traditions say, and note the differences.",
      "Ask AI to argue as strongly as it can against your reading, then check its strongest objections against the commentaries and the text.",
      "Do that, and let a good objection change the sermon, even on Saturday night, because faithfulness to the text outranks a finished manuscript.",
    ], "shallow_use", {
      why: "The healthiest use of the tool is the one that makes you less comfortable, not more.",
      deeper: "Proverbs 18:13, NLT: “Spouting off before listening to the facts is both shameful and foolish.”",
      effects: { 2: { verification: -4 } },
    }),
  formation("amplification",
    "Since AI entered your ministry, the depth of your understanding of the passages you preach has:", [
      "Decreased. You skim more.",
      "Stayed the same.",
      "Increased somewhat.",
      "Increased clearly, and you can name how.",
    ],
    "Depth is the difference between using a tool and being used by one.",
    "Alin Vrancila, “Navigating the Agathokakological Age”, on moving from information delivery to wisdom formation."),

  /* --------------------------------------------------- 7. Craft of Preaching */
  claim(P, "skillGrowth",
    "I am a better preacher than I was a year ago in exegesis, structure, illustration, and delivery, not only a faster one.",
    "agreement", {
      why: "Craft grows through practice, feedback, and difficulty. This asks whether AI has fed your growth as a preacher or quietly replaced the practice that produces it.",
      deeper: "Aristotle, in the epigraph selection for In the Image of Code: “the virtues we get by first exercising them”.",
    }),
  reverse(P, "skillGrowth",
    "Some parts of sermon craft I used to do myself (finding illustrations, building an outline, writing transitions) I could no longer do well by hand.",
    "agreement", "craft_stagnation", {
      why: "Skills that go unused fade, and preaching skills are no exception. Naming a faded skill is how you get it back.",
      deeper: "Hebrews 5:12 to 14, NLT: returning to milk when one should be teaching others.",
    }),
  scenario(P, "skillGrowth",
    "A young preacher you mentor asks whether they still need to learn to build a sermon outline and find illustrations by hand, since AI does both well.", [
      "Tell them no. Learning to prompt well is the skill now.",
      "Tell them it is optional.",
      "Tell them yes, but leave them to work out how.",
      "Explain that they have to be able to judge what the tool produces, and work through the craft with them week by week.",
      "Build a rhythm where AI use grows as their own craft grows, with regular unaided sermons, and treat this as how the next generation of preachers is formed.",
    ], "craft_stagnation", {
      why: "How you answer this for someone else usually reveals what you believe for yourself.",
      deeper: "Luke 6:40, NLT: “the student who is fully trained will become like the teacher.”",
      optionSignals: { 1: ["craft_stagnation"] },
    }),
  formation("skillGrowth",
    "Since AI entered your ministry, your ability to catch a weak argument, a flat illustration, or a misread text in a draft (yours or the tool's) has:", [
      "Weakened.",
      "Stayed the same.",
      "Strengthened somewhat.",
      "Strengthened clearly, through deliberate practice.",
    ],
    "The eye that catches the flaw is the craft itself.",
    "James Spencer, “The Quad”, on procedural knowing: the skill behind a claim made visible.",
    { secondary: [{ construct: "verification", weight: 0.4 }] }),

  /* ------------------------------------------------- 8. Discerning Practice */
  claim(P, "adaptability",
    "I regularly review how I am using AI in ministry, adjust what is not serving me or my people, and I have someone who knows my practice and can ask me about it.",
    "agreement", {
      why: "Habits drift. A practice that is reviewed, ideally with another person in the room, can be corrected before it hardens.",
      deeper: "James Spencer, “Uncoordinated”, on discipleship as the church's coordinating work: we are not meant to discern alone.",
    }),
  reverse(P, "adaptability",
    "Once I found an AI workflow that works for sermon preparation, I have not really revisited it. It just runs.",
    "agreement", "craft_stagnation", {
      why: "A workflow that just runs is exactly the kind that shapes us without our noticing. This asks whether yours has been examined lately.",
      deeper: "James Spencer, “Theological Dispositions in a Digital World”: “how you attend to it changes what it is you find there”.",
    }),
  scenario(P, "adaptability",
    "You realize you have not prepared a message without AI in over a year.", [
      "Shrug. It works, and the sermons are better than ever.",
      "Feel uneasy, and carry on.",
      "Decide to try one tool-free sermon sometime.",
      "Set a rhythm, such as one message a month or one series a year prepared entirely without AI, and tell someone who will hold you to it.",
      "Do that, and use the tool-free messages to check honestly what has changed in your study, your prayer, and your voice, adjusting your practice from what you find.",
    ], "study_atrophy", {
      why: "This is a Sabbath principle applied to the tool: a regular rest from it that keeps it from becoming the thing you cannot do without.",
      deeper: "Faith at Work, on keeping good limits on purpose: “Limits can protect prayer.”",
      optionSignals: { 1: ["study_atrophy"] },
    }),
  formation("adaptability",
    "Since AI entered your ministry, how often do you change or retire an AI habit because you noticed what it was doing to your preparation, your prayer, or your presence:", [
      "Never.",
      "Rarely.",
      "Occasionally.",
      "Regularly, on purpose.",
    ],
    "The number itself matters less than whether it is zero.",
    "Jay Kim, Analog Christian, on cultivating wisdom in a digital age."),

  /* --------------------------------------------------- 9. Integrity and Care */
  claim(P, "responsibleUse",
    "My leaders and, where it matters, my congregation know how I use AI in ministry, and nothing I preach is presented as my own words or the Spirit's leading when it was the tool's.",
    "agreement", {
      why: "Integrity in the pulpit includes integrity about the tools behind it. This is not a demand to announce AI every Sunday; it asks whether your practice could bear the light.",
      deeper: "Faith at Work: if a church uses AI to communicate, “the church remains responsible for whether the message is faithful”.",
    }),
  reverse(P, "responsibleUse",
    "I would be uncomfortable if my elders or my congregation knew exactly how much of my preaching preparation comes from AI.",
    "agreement", "undisclosed_use", {
      why: "Discomfort is information. It is asked here privately, so that you can hear it before anyone else has to.",
      deeper: "Ephesians 4:15, NLT: speaking the truth in love.",
    }),
  scenario(P, "responsibleUse",
    "A congregant shares a painful confidence in a counseling meeting. Afterward you consider using an AI tool to help you think through how to respond, which would mean describing their situation to it.", [
      "Paste the details in. It gives good guidance and no one will know.",
      "Describe it in general terms, with the name removed.",
      "Ask the tool only general questions about that kind of situation, with no details of the person.",
      "Keep the confidence entirely out of any tool, seek counsel from a trusted elder or counselor, and pray for the person by name.",
      "Do that, and let the discomfort of sitting with a hard situation without a quick answer be part of bearing their burden with them.",
    ], "congregant_privacy_risk", {
      why: "A confidence shared with a pastor was not shared with a company's servers. Beyond privacy, the scenario asks whether the hardest part of pastoral care, sitting with what has no easy answer, is being handed to a tool.",
      deeper: "James Spencer's retelling of the Good Samaritan: being a neighbor “requires effort, contact, a closing of the distance”.",
      optionSignals: { 1: ["congregant_privacy_risk", "pastoral_care_outsourcing"], 2: ["congregant_privacy_risk"] },
    }),
  formation("responsibleUse",
    "Since AI entered your ministry, the share of pastoral care (visits, prayers, counsel, condolences, hard conversations) that happens in your own presence and in your own words has:", [
      "Shrunk a lot.",
      "Shrunk somewhat.",
      "Stayed the same.",
      "Grown, because the tool took administration off your desk.",
    ],
    "The right use of the tool gives a pastor more time with people, not less. This asks which direction yours has moved.",
    "Noreen Herzfeld, quoted in “Navigating the Agathokakological Age”, on our capacity “to love, to suffer, and to engage in genuine mutual relationship”.",
    { secondary: [{ construct: "creativity", weight: 0.3 }] }),

  /* ----------------------------------------------------- 10. Voice and Witness */
  claim(P, "creativity",
    "My sermons carry my own voice, my people's context, and my own story of brokenness and grace. They could not be preached unchanged in a church across the country.",
    "agreement", {
      why: "A sermon is not content; it is a word from a particular shepherd to particular sheep. The question asks whether the tool has been helping you sound more like yourself or less.",
      deeper: "Alin Vrancila, “Navigating the Agathokakological Age”: “Our role is not to out-compute AI, but to out-human it.”",
    }),
  reverse(P, "creativity",
    "Most of my illustrations and applications now come from AI suggestions rather than from my own life, my reading, and my people.",
    "agreement", "voice_loss", {
      why: "Illustrations from your own life and your people's lives are the part of a sermon no tool can supply. When they thin out, the sermon starts to sound like everyone's.",
      deeper: "Sean Maguire in Good Will Hunting, in the epigraph selection for In the Image of Code: “You couldn't tell me what it smells like in the Sistine Chapel.”",
    }),
  scenario(P, "creativity",
    "After a service, a longtime member says gently, “Pastor, that didn't sound like you.”", [
      "Let it go. That is one comment.",
      "Feel stung, and change nothing.",
      "Rewrite next week's message by hand.",
      "Look back over recent sermons for where your own voice and your people's lives went missing, and restore them.",
      "Do that, thank the member, and set a standard for yourself: the tool may draft, but you finish, in your voice, with your people in view.",
    ], "voice_loss", {
      why: "The people who love you will notice before you do. This asks what you do with that gift.",
      deeper: "1 Peter 5:2, NLT: “Care for the flock that God has entrusted to you.”",
      optionSignals: { 1: ["voice_loss"] },
    }),
  formation("creativity",
    "Since AI entered your ministry, your congregation's sense that they are hearing from their own pastor, with their lives and their city in view, has:", [
      "Weakened.",
      "Stayed the same.",
      "Strengthened somewhat.",
      "Strengthened clearly.",
    ],
    "Witness is local. A sermon that could be anyone's is a sermon that is no one's.",
    "Andy Crouch, The Life We're Looking For, on communities where people are known, needed, and loved in the flesh.",
    { secondary: [{ construct: "responsibleUse", weight: 0.3 }] }),
];
