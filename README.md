# Ruby Smart Notes — mobile

The React Native app for [Ruby Smart Notes](https://github.com/Twilight-Techy/ruby-smart-notes):
capture study notes, get them summarised, pull out the key concepts, and quiz yourself — on a
phone, offline.

Expo, SQLite, and Gemini.

---

## Local-first, not a thin client

The web app keeps everything in Neon Postgres. This one doesn't talk to it at all — notes,
courses, chats and quizzes live in **on-device SQLite** through `expo-sqlite` and Drizzle.

That's deliberate. Studying happens on trains, in libraries with bad wifi, and between lectures.
A note you can't open without a connection is a note you can't study from. The only thing that
needs the network is generating new AI output; everything already generated stays readable.

## Two models, on purpose

```ts
export const proModel   = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
export const flashModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
```

Summarisation and concept extraction run once per note, are slow-tolerant, and benefit from the
stronger model. Chat is interactive, runs many times per note, and needs to feel immediate. So
Pro handles analysis and Flash handles conversation, rather than paying Pro prices for every
chat turn.

## Organised by course

```
courses ─── notes ─┬─ chats
                   └─ quizzes ── questions
```

Notes group under **courses** (name, code like `CS101`, colour, icon) — the axis students
actually think along. Deleting a course uses `onDelete: 'set null'` so its notes survive
un-filed rather than vanishing; deleting a note cascades to its chats and quizzes, which have no
meaning without it.

Notes carry a `contentType` (`text` / `pdf` / `image` / `document`) and an optional `fileUri`
pointing at the local attachment, so the original stays reachable alongside the extracted text.

## Stack

| | |
|---|---|
| Runtime | Expo 54, React Native 0.81, React 19 |
| Routing | Expo Router |
| Database | expo-sqlite + Drizzle ORM |
| AI | Gemini 1.5 Pro and 1.5 Flash |
| Styling | NativeWind (Tailwind) |
| Motion | Reanimated 4, expo-haptics |

---

## Running it

```bash
bun install          # or npm install
```

Create `.env`:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your-google-ai-studio-key
```

Then:

```bash
bunx expo start
```

Press `i` for the iOS simulator, `a` for Android, or scan the QR code with Expo Go.

## Known limitation: the API key ships in the bundle

Anything prefixed `EXPO_PUBLIC_` is inlined into the JavaScript bundle at build time. It is not
a secret — anyone who downloads the app can extract it.

That is acceptable for local development and a personal build with a rate-limited key. It is not
acceptable for a public release. The fix is to move the Gemini calls behind a backend the app
authenticates against, so the key never leaves the server — which is what the web version
already does. Until that exists, treat any key used here as disposable and keep a quota cap on
it.

## Layout

```
app/
  (tabs)/          notes, quizzes, settings
  note/[id]        note detail and AI panel
  chat/[id]        chat over a note
  quiz/[id]        quiz run
  courses/         course list
db/
  schema.ts        courses, notes, chats, quizzes, questions
  client.ts        SQLite connection
  seed.ts          sample data
lib/gemini.ts      model setup
```
