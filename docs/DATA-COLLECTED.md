# What the Human Advantage Assessment records

Every field the assessment stores, where it comes from, and why it is kept.
This doubles as the source for the privacy notice: if something is not on this
list, it is not collected.

## Given by the respondent

Asked for directly at the gate, and shown to them as they type it.

| Field | Notes |
|---|---|
| First and last name | Used on the report and in the email |
| Email | The key a returning respondent is matched on |
| Mobile phone | Optional |
| How they heard about it | A fixed list, plus a free text option |
| Marketing consent | A ticked box, stored as given or not |
| Answers | Every scored item, plus the two baseline questions |
| Persona and usage level | Chosen at setup, decides which items apply |

## Produced by the assessment

Not asked for and not observed. Written by the app onto the record it belongs to.

| Field | Notes |
|---|---|
| Report token | The long random token in the report's own web address. Whoever holds the link can read the report, so it is treated as a secret: it is stripped from the admin screens, never exported, never written to an event or a log line, and replaced whenever the respondent asks for a new link |
| Token issued at | When the current link was minted, so a reissue is visible |

## Taken from the request

Headers every website receives. None of it can be changed by editing the page,
which is why it is trusted over anything the browser reports about itself.

| Field | Notes |
|---|---|
| IP address | Stored in full. Needed for the rest of this block, and for erasure requests |
| Country, region, city, postal area | Resolved from the address, city level at best |
| Coordinates | The city's, not the person's. Useful only for a map |
| Inside the EU | Decides whether GDPR applies to that record |
| Internet provider, organisation, ASN, network domain | A university or a company name here is a lead in itself |
| Datacentre or VPN | Inferred from the provider name. A quality signal, not an accusation |
| Address timezone | Compared against the browser's, which reveals travel or a VPN |
| Browser and version | From the user agent |
| Operating system and version | From the user agent |
| Device class and make | Phone, tablet, desktop or bot; Apple, Samsung and so on |
| Automated client | Crawlers and link preview fetchers are flagged, not counted as people |
| Accepted languages | In preference order |

## Reported by the browser

Standard APIs a page may read without a permission prompt. Nothing probes the
device, draws to a canvas, or builds a covert identifier.

| Field | Notes |
|---|---|
| Screen and window size, pixel ratio, colour depth | What the results page had to fit into |
| Orientation | Portrait or landscape |
| Platform and brand hints | The modern replacement for the user agent string |
| Cores, memory, touch points | Device capability, useful when reading slow completions |
| Connection type, downlink, round trip | Whether a long completion was a slow line |
| Language and language list | Often truer to who a person is than their address |
| Timezone and offset | |
| Dark mode, reduced motion | Whether the design was ever seen as drawn |
| Cookies enabled, do not track | Stated preferences, recorded as stated |

## The sitting itself

How the assessment was taken, which is how honestly to read the answers.

| Field | Notes |
|---|---|
| Time taken | Start of the questions to submission |
| Time away and how often | Tab in the background, so a long sitting can be told from a distracted one |
| Answers, median, fastest, slowest pace | |
| Answers under 1.2 seconds | Faster than a question can be read |
| Changed answers | Reconsidering is a good sign, not a bad one |
| Resumed a draft | Finished across more than one sitting |
| Local hour and weekday | For timing reminders |

## Where they came from

| Field | Notes |
|---|---|
| Referring host and path | Blank for direct visits and for some privacy settings |
| Landing page | |
| utm_source, medium, campaign, term, content | All five, where present |
| Ad click identifier | Which platform: gclid, fbclid, msclkid, ttclid, li_fat_id, twclid |

## Kept in the respondent's browser

| What | Where | Leaves the device |
|---|---|---|
| Progress through the questions | session storage, `haa.progress` | No. Cleared when the tab closes |
| A random identifier for the sitting | local storage, `haa.session` | Yes, as `sessionId` on every event and submission |
| How they arrived: referring site and campaign tags | local storage, `haa.attribution` | Yes, inside `meta` on the submission |

The last two persist until the browser's site data is cleared. Neither carries a
name. The privacy notice says all three plainly; an earlier version said only
the first existed and that nothing left the device, which was wrong twice.

## Age

Not asked, and not verified. The Student edition names high school among its
audiences, so some respondents are minors, and they are asked for exactly what
everybody else is asked for. The privacy notice and the terms both say this
plainly and give a parent, a guardian or a school a route to have a record
deleted.

This is a stated position rather than a control. If the product is ever sold
into schools as a programme rather than shared as a link, an age band at setup
with a parental consent path is the next thing to build.

## Deliberately not collected

- No canvas, font or audio fingerprinting, and no cross-site identifier.
- No precise geolocation. The browser's location API is never called, so there
  is no permission prompt and no street level position.
- No keystroke or mouse movement recording, and no session replay.
- No reading of anything outside this assessment: no browsing history, no other
  tabs, no contacts, no files.
- No third party trackers. Nothing is sent to an advertising network.

## Obligations that come with this

1. **Say so before storing it.** The gate discloses the address, device,
   location and timing collection in plain words. That disclosure is what makes
   the collection lawful rather than covert, so it must not be quietly removed.
2. **Erasure has to work.** Deleting a record in the admin removes it from the
   records and from every statistic. Under both the Philippines Data Privacy Act
   and GDPR a request has to be honoured, and an IP address is personal data in
   both.
3. **Decide a retention period.** The notice states twenty four months from the
   last completed assessment, and the report link is already enforced against
   it: an expired link stops opening. The records themselves are still deleted
   by hand. The scheduled job that deletes them is the remaining piece, and
   until it exists the stated period is a promise the product keeps only on the
   link and not yet on the data.
4. **The EU share is worth watching.** It is on the Reach tab. While it is near
   zero the exposure is small; if it grows, a full privacy notice page and a
   named contact for requests become worth having.
5. **Access is a control.** Everything here is behind the admin login, and the
   CSV export carries all of it. Treat an exported file as the same sensitive
   material as the database.

## Where it shows up

- **Reach and devices** tab: countries, cities, devices, browsers, systems,
  screen sizes, languages, timezones, networks, shared addresses, and pace.
- **Context** pane on every record: everything above for one person.
- **CSV export**: forty extra columns, one row per submission. The report token
  is deliberately not among them: the export enumerates its columns by hand, and
  adding the token to it would put a live link into a spreadsheet.
- **Funnel events**: device and country on every step, so drop off can be read
  by segment rather than only in total.
