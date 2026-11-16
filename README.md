# Journalista · Football Trivia

Football trivia for people who know the game like a journalist. Every prompt has dozens of right
answers. The obvious ones score little, and the names only a real reporter remembers make the
front page. Play the daily seven alone, practise by section, race a random opponent in a quick
match, or take on friends with a room code in two game types: **Newsroom race** (everyone answers at once) or **Hot seat** (take turns, and
whoever runs out of time loses the round). Every player is a little pixel-art reporter.

The site is plain HTML, CSS and JavaScript, with no build step and no dependencies to install.

## Running it

Open `index.html` in a browser. That's it.

For multiplayer across devices, add your Supabase project URL and anon key to
[`js/config.js`](js/config.js). Without them, rooms still work between tabs of the same browser
(local test mode).

## Project structure

```
Journalista/
├── index.html                     Page markup: one <main> view per screen
├── README.md
│
├── css/                           Loaded in this order (later files override earlier ones)
│   ├── theme.css                  Design tokens for the modern and archive newspaper eras
│   ├── base.css                   Reset, typography, utility classes
│   ├── components.css             Masthead, buttons, inputs, cards
│   ├── screens.css                Layout for each view: home, room, match, results
│   ├── newspaper.css              Broadsheet overrides shared by both eras
│   ├── effects.css                Pixel avatars, animations, Hot seat view, overlays
│   ├── quickmatch.css             Matchmaking screen, "typing…" label, opponent chat
│   └── responsive.css             Small screens and reduced motion
│
└── js/                            Classic scripts sharing one global scope, loaded in this order
    ├── config.js                  Supabase credentials for online play
    ├── data/
    │   ├── clubs.js               Club nicknames and alternative spellings
    │   ├── questions-core.js      Prompt helpers and the eight original sections
    │   ├── questions-expanded.js  Extra prompts for the original sections
    │   ├── questions-new-sections.js  Four newer sections
    │   ├── players.js             About 1,850 national-team players: country, position, era, fame
    │   ├── questions-players.js   Prompts generated from players.js: nations, regions, positions, letters
    │   ├── questions-culture.js   Competitions, football culture and extra prompts
    │   └── eras.js                Tags untagged prompts as modern or archive
    ├── core/
    │   ├── rules.js               Scoring tiers, clock and match length
    │   ├── matching.js            Forgiving answer matching (accents, aliases, typos)
    │   ├── storage.js             Saved name, streak, best score, practice history
    │   └── utils.js               Dates, seeded random, shuffling, number formatting
    ├── ui/
    │   ├── dom.js                 DOM helpers, view switching, era styling
    │   ├── pixels.js              Pixel-art reporter generator (sprites as editable text grids)
    │   ├── effects.js             Confetti, score pop-ups, stamps, flashes, screen shake
    │   └── home.js                Front-page ticker, editor mascot, "New look" button
    ├── modes/
    │   ├── solo.js                Daily seven and practice rounds
    │   ├── multiplayer.js         Rooms, Newsroom race rounds, scoreboard
    │   ├── turns.js               Hot seat: turn-based rounds, lose on timeout
    │   ├── bot.js                 Simulated opponent that plays like a person
    │   ├── quickmatch.js          Quick match: matchmaking, ready, rematch, walkover
    │   └── chat.js                Room chat in the lobby and on the scoreboard
    └── main.js                    Entry point: draws the front page
```

Every file starts with a comment that explains what it contains.

## How it works

- **Eras.** Each prompt is either _modern_ (football since 2010) or _archive_. Setting
  `data-era` on `<html>` switches every colour and font through the custom properties in
  `css/theme.css`.
- **Scoring.** Each answer has a tier from 1 (Wire copy, 100 pts) to 4 (Front page, 500 pts),
  defined in `js/core/rules.js`. Solo play adds a speed bonus. Multiplayer adds 50 for a
  _scoop_, an answer nobody else in the room found.
- **Multiplayer.** The room creator is the host. The host picks prompts, runs the clock and
  totals scores. Everyone else just sends answers. Messages are documented at the top of
  `js/modes/multiplayer.js` and `js/modes/turns.js`.
- **Game types.** In a _Newsroom race_ everyone answers the same prompt at once. In the _Hot
  seat_ players take turns filing one answer each (5–15 seconds a turn). Each answer can be filed
  once. Whoever runs out of time is _spiked_ (0 points for the round) and everyone else gets +100
  for surviving.
- **Quick match.** _Find an opponent_ shows a matchmaking screen, pairs you with a reporter
  and plays three rounds of Newsroom race, with Ready between rounds and a rematch at the end.
  For now the opponent is simulated (`js/modes/bot.js`): a name, a town and a look, a skill
  level that follows your quick-match record, patchy knowledge (common answers often, rare ones
  seldom, better in their favourite section and era), and human timing: reading, thinking,
  typing letter by letter, wrong guesses, blank moments and network delay. After the match they
  may chat, ask for a rematch, turn yours down or leave, and very rarely they quit mid-match.
  Set `LABEL_BOTS` in `js/config.js` to show "(bot)" after their name. To pair real players
  later, replace `quickConnect()` in `js/modes/quickmatch.js`; see the comment at its top.
- **Chat.** Everyone in a room can chat in the lobby and on the scoreboard; during a round the
  latest message shows under the live bars. In a quick match the opponent reads the chat and
  sometimes answers (a greeting, "gg", where they are from, a rematch), after a pause and a
  "typing…", and sometimes ignores it, especially mid-round.
- **Matching.** Typos, accents and nicknames are forgiven, and a surname alone counts. When
  two answers share a surname (Kasper and Peter Schmeichel), the surname alone asks the player
  to type the full name instead of guessing. Particles count too: "van Persie" and "Persie" both
  work.
- **Pixel reporters.** Each player's look is one number that seeds hair, skin, kit and
  accessories, so it draws the same on every device. Sprites are text grids in
  `js/ui/pixels.js`, easy to edit by hand. Moods (idle, happy, sad, shock) react to the game.
- **Effects.** All motion respects the system's reduced-motion setting.

## Adding questions

Add prompts with `ADD("section-id", P(text, sub, kind, answers, era))`, or add a whole section
with `ADDC({...})`. Put them at the **end** of the newest question file.

Most player prompts come from `js/data/players.js`. Adding a line there
(`fame era position Name|aliases`, explained at the top of the file) adds that player to every
matching prompt: their country, their position, their region and their surname letter. To add a
new generated prompt, append it to the end of the matching list in `js/data/questions-players.js`.

> Prompts are identified by their position (section index, prompt index) in saved practice
> history, the daily seven and multiplayer messages. Only ever append. Never reorder or delete
> existing prompts.

## Code style

Formatting is handled by [Prettier](https://prettier.io) using `.prettierrc.json`:

```sh
npx prettier --write .
```
