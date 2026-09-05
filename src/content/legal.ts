/**
 * The privacy notice and the terms, as content rather than markup.
 *
 * Written against docs/DATA-COLLECTED.md, which is the inventory of every field
 * the assessment stores. If something is collected and is not named here, one
 * of the two documents is wrong, and a test compares them.
 *
 * Both the Philippines Data Privacy Act of 2012 and the GDPR ask for the same
 * things: a named controller, a lawful basis, what is held and why, how long,
 * who else sees it, and how a person exercises their rights. A sentence in a
 * form is not any of that, which is why these pages exist.
 */

export interface LegalDoc {
  title: string;
  summary: string;
  effective: string;
  reviewed: string;
  sections: Array<{
    heading: string;
    body: string[];
    rows?: { head: string[]; body: string[][] };
    list?: string[];
  }>;
}

const CONTROLLER = 'International Center for Applied Neogogy (ICAN), ican.ph';
const CONTACT = 'privacy@ican.ph';
const DATE = '5 September 2026';

export const PRIVACY: LegalDoc = {
  title: 'Privacy notice',
  summary:
    'What the Neogogy Human Advantage Assessment collects, why it is collected, how long it is kept, and how to see it, correct it or have it deleted.',
  effective: DATE,
  reviewed: DATE,
  sections: [
    {
      heading: 'Who is responsible',
      body: [
        `The controller of the personal data described here is the ${CONTROLLER}. Questions, requests and complaints go to ${CONTACT}.`,
        'The assessment is served from assessment.neogogy.ai. This notice covers that site and the reports it produces. It does not cover the other sites linked from it, which publish their own notices.',
      ],
    },
    {
      heading: 'What is collected, and why',
      body: [
        'Three kinds of information. What you type, what your browser sends to any website, and how the sitting went. Nothing here probes your device, draws to a canvas, or builds a covert identifier.',
      ],
      rows: {
        head: ['What', 'Why it is held'],
        body: [
          ['First and last name', 'To address the report and the email that carries it'],
          ['Email address', 'To send the report, and to recognise you if you take it again so movement can be shown'],
          ['Mobile number, optional', 'Only if you give it, and only so we can reach you about what you asked for'],
          ['How you heard about it, optional', 'To understand which routes bring people here'],
          ['Marketing consent, a ticked box', 'Recorded as given or not given. It is not required to receive your report'],
          ['Your answers, and the two unscored calibration questions', 'They are the assessment. Without them there is no result'],
          ['Which assessment you took, and your reported use level', 'They decide which questions apply and how the result is read'],
          ['IP address, and the country, region and city it resolves to', 'Coarse location for research and for finding your record if you ask us to delete it. City level at best, never a street or a person'],
          ['Internet provider and network organisation', 'To tell an institution from a home connection when reading aggregate patterns'],
          ['Browser, operating system, device class, screen size, language', 'To know what the report had to fit into, and to exclude automated visitors from the statistics'],
          ['How long the sitting took, and how it was paced', 'To read a result honestly. A three-minute completion is not the same evidence as a fifteen-minute one'],
        ],
      },
    },
    {
      heading: 'The lawful basis',
      body: [
        'Producing and sending your report runs on the contract between us: you asked for the assessment, and this is what delivers it. Under the Data Privacy Act the equivalent basis is the fulfilment of a request you made.',
        'Improving the instrument and reporting aggregate patterns runs on legitimate interest, and only ever on aggregates in which no individual can be identified.',
        'Marketing email runs on consent alone. The box is not pre-ticked, your report arrives whether or not you tick it, and every message carries an unsubscribe link that works.',
      ],
    },
    {
      heading: 'How long it is kept',
      body: [
        'Your result and the answers behind it are kept for as long as the movement it enables is useful to you, and reviewed every twenty four months. If you have not returned in that period we delete the record.',
        'Marketing consent and the contact details attached to it are kept until you withdraw it, and the withdrawal itself is kept as proof that you asked.',
        'Aggregate statistics, which contain no personal data, are kept indefinitely.',
      ],
    },
    {
      heading: 'Who else sees it',
      body: [
        'Nobody buys it, and nobody is sold it. Three kinds of processor touch it, each under contract and each only to do the thing named:',
      ],
      list: [
        'The hosting provider that runs the site and its database.',
        'The email provider that delivers your report and any message you consented to.',
        'A location lookup that turns an IP address into a country and a city.',
      ],
    },
    {
      heading: 'Your rights',
      body: [
        `You can ask for a copy of everything held about you, ask for a correction, ask for deletion, withdraw consent, object to the processing, or ask for your data in a portable file. Write to ${CONTACT} from the address you used, and we will answer within thirty days.`,
        'If you are in the Philippines and are not satisfied with the answer, you may complain to the National Privacy Commission. If you are in the European Economic Area or the United Kingdom, you may complain to your national supervisory authority.',
        'Deleting your record removes the result too. We cannot show you movement over time from data we no longer hold, and we will say so before acting rather than after.',
      ],
    },
    {
      heading: 'Cookies and tracking',
      body: [
        'The assessment does not set advertising cookies and does not carry third party trackers. Your progress through the questions is held in your own browser, in session storage, so that a refresh does not cost you your answers. It never leaves your device and it clears when you finish or close the tab.',
        'If that changes, this notice changes first, and a consent banner appears before anything non-essential is set.',
      ],
    },
    {
      heading: 'What this is not',
      body: [
        'The assessment is a reflective instrument, not a clinical or psychological test, and the result is not a diagnosis. It is not used to make an automated decision that has a legal or similarly significant effect on anybody.',
        'If your organisation asked you to take it, your individual result is still yours. Organisations receive aggregate readings only, and never below the group sizes that would let an individual be identified.',
      ],
    },
  ],
};

export const TERMS: LegalDoc = {
  title: 'Terms of use',
  summary:
    'What the Neogogy Human Advantage Assessment is, what it is not, and the terms on which it is offered.',
  effective: DATE,
  reviewed: DATE,
  sections: [
    {
      heading: 'What this is',
      body: [
        `The Neogogy Human Advantage Assessment is published by the ${CONTROLLER}. It is offered free of charge to individuals.`,
        'It reads self-reported answers and returns a developmental reading: where your current practices place you, what appears to be holding you there, and what to do next.',
      ],
    },
    {
      heading: 'What it is not',
      body: [
        'It is not a psychometric test, a clinical assessment, or a diagnosis. It has not been independently validated. It cannot see your work, it does not know your field, and it will not tell you whether you are good at your job.',
        'It must not be used to rank, appraise, select, hire, promote or dismiss anybody. Group readings carry the same restriction in writing, on the report itself.',
        'It is only as accurate as the answers given to it. Answered carelessly or flatteringly, it will return a result to match, and it says so in the report.',
      ],
    },
    {
      heading: 'Your report',
      body: [
        'Your result is yours. You may keep it, print it, and share it with anyone you choose.',
        'The instrument, its questions, its scoring and the design of the report remain the property of ICAN. You may quote from your own report with attribution. You may not reproduce the question set, or build a derivative instrument from it, without written permission.',
      ],
    },
    {
      heading: 'Availability',
      body: [
        'The assessment is offered as it is, without a guarantee of uninterrupted availability. We may change the questions, the scoring or the report, and where a change would alter how an earlier result should be read, the report says which version produced it.',
      ],
    },
    {
      heading: 'Contact',
      body: [`Questions about these terms, and requests for permission, go to ${CONTACT}.`],
    },
  ],
};
