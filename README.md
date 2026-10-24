# gulaqvtwo

A production-ready **native React Native** base setup. It ships with a working app skeleton that has navigation, global state, data fetching, secure storage, and biometrics already wired together — so you can start building features instead of scaffolding.

> This file is **self-contained**. All setup, configuration, and architecture documentation lives here. There is no separate `/docs` folder and no external links you need to follow to get started.

---

## Tech Stack

| Concern          | Library / Tool                                              | Version |
| ---------------- | ----------------------------------------------------------- | ------- |
| Framework        | React Native (native, **not** Expo)                          | 0.84.1  |
| Language         | React / TypeScript                                           | 19.2.3 / 5.8 |
| Navigation       | `@react-navigation/native` + `native-stack`                  | 7.x     |
| Global state     | Redux Toolkit + `react-redux`                                | 2.x / 9.x |
| Data fetching    | `swr` (custom fetcher, token refresh, retry)                 | 2.x     |
| Local storage    | `@react-native-async-storage/async-storage`                  | 1.24    |
| Secure storage   | `react-native-keychain`                                      | 10.x    |
| Biometrics       | `react-native-biometrics`                                    | 3.x     |
| Gestures / layout| `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-screens` | latest |
| Testing / Lint   | Jest, ESLint, Prettier                                       | —       |

---

## Project Structure

```
.
├── App.tsx                     # Root component: providers + navigation stack
├── index.js                    # Native entry point (AppRegistry)
├── app.json                    # App name / display name
├── babel.config.js             # Babel preset
├── metro.config.js             # Metro bundler config
├── jest.config.js              # Jest config (RN preset + transformIgnorePatterns)
├── jest.setup.js               # Jest setup (gesture-handler)
├── tsconfig.json               # TypeScript config
├── Gemfile / Gemfile.lock      # iOS CocoaPods (Ruby)
├── package.json                # Scripts + dependencies
├── android/                    # Native Android project (Gradle)
├── ios/                        # Native iOS project (Xcode + CocoaPods)
├── __tests__/
│   └── App.test.tsx            # App render smoke test
└── src/
    ├── api/
    │   └── sample.ts           # Example SWR hook (jsonplaceholder)
    ├── config/
    │   └── environment.ts      # ⚙️  App configuration (BASE_URL, etc.)
    ├── page/
    │   ├── home.tsx            # HomeScreen (nav, sample API, biometrics)
    │   └── details.tsx         # DetailsScreen
    ├── redux/
    │   ├── store.ts            # Redux store + typed hooks
    │   └── features/
    │       └── auth.slice.ts   # Auth slice (user, token)
    └── utility/
        ├── apiCaller.ts        # Fetch wrapper + token refresh + SWR fetcher
        ├── localDataStorage.ts # AsyncStorage wrapper
        ├── secureStorage.ts    # Keychain wrapper
        └── types.ts            # API / fetch types
```

---

## Prerequisites (OS-aware)

Before you start, make sure you have the tools for your target platform.

### Common to all platforms
- **Node.js `>= 22.11.0`** — verify with `node -v` (a Node version manager like [nvm](https://github.com/nvm-sh/nvm) is recommended).
- **Git**.

### Android (Windows / macOS / Linux)
- **Android Studio** with the **Android SDK** installed.
- **JDK 17** (required by React Native 0.84's Android toolchain).
- An **emulator** (Android Studio → Device Manager) or a physical device with USB debugging enabled.

### iOS (macOS only)
- **macOS** with the latest **Xcode** (from the Mac App Store).
- **CocoaPods** — `sudo gem install cocoapods` (or `brew install cocoapods`).
- A connected **iPhone simulator** or a physical device with a signing team.

> iOS builds are **not possible on Windows/Linux** — use Android there.

---

## Getting Started (detailed setup)

Follow these steps in order. All commands assume you are in the project root.

### 1. Install dependencies

The repository commits an **npm** lockfile (`package-lock.json`), so use npm:

```bash
npm install
```

> If your team standardizes on Yarn instead, run `yarn install` — but prefer the lockfile that is actually committed to avoid dependency drift.

### 2. Configure the environment

All app-level configuration lives in **`src/config/environment.ts`**. Point `BASE_URL` at your real API:

```ts
// src/config/environment.ts
const CONSTANTS = {
  BASE_URL: "https://jsonplaceholder.typicode.com", // ← change to your backend
}
export default CONSTANTS;
```

`BASE_URL` is used as the default origin for relative API calls in `src/utility/apiCaller.ts`. See [Configuration reference](#configuration-reference-in-depth) for the full list of settings.

### 3. Run on Android

```bash
# Terminal 1 – start the Metro bundler (if `npm run android` does not auto-start it)
npm start

# Terminal 2 – build and launch on a connected device / emulator
npm run android
```

First launch is slower (Gradle + dependencies). Use `npm start -- --reset-cache` if the bundler behaves oddly.

### 4. Run on iOS (macOS only)

```bash
# One-time: install iOS native dependencies
cd ios && pod install && cd ..

# Then run
npm run ios
```

If you see native module errors after adding/changing dependencies, re-run `cd ios && pod install`.

### 5. Reload / debug (Metro)

With the app running, press **`r`** (reload), **`d`** (dev menu), or **`j`** (toggle JavaScript debugger) in the Metro terminal.

---

## Architecture

### Providers & navigation (`App.tsx`)

The root component composes everything in this order:

```
ReduxProvider
  └─ SafeAreaProvider
       └─ NavigationContainer
            └─ Stack.Navigator
                 ├─ Home      → src/page/home.tsx
                 └─ Details   → src/page/details.tsx   (params: { id, title, body? })
```

### Data flow (API → state → UI)

```
 SWR hook (src/api/sample.ts)
   │  useSWR(['posts', 1], (key) => apiCaller(...), { errorRetryCount: 2 })
   ▼
 apiCaller (src/utility/apiCaller.ts)
   │  1. Builds URL (BASE_URL + path), method, JSON body, timeout
   │  2. Attaches stored auth token (header `Authorization`)
   │  3. If response is 401 → auto-logout + re-login + retry (once)
   ▼
 Redux store (src/redux/store.ts)
   │  auth slice: { user, token }  ←→  used by apiCaller & secure/local storage
   ▼
 UI (src/page/home.tsx, src/page/details.tsx)
```

Key behaviours implemented in `src/utility/apiCaller.ts`:
- **Request timeout** (aborts slow requests).
- **Token refresh / retry**: on `401`, logs out, re-authenticates, and retries the original request.
- **SWR fetcher**: a shared fetch function so any `useSWR` key uses the same pipeline.

### Storage layers

| Layer | Module | Use for |
| ----- | ------ | ------- |
| **Secure** | `src/utility/secureStorage.ts` (Keychain/Keystore) | Tokens, passwords — never in plain AsyncStorage |
| **Local** | `src/utility/localDataStorage.ts` (AsyncStorage) | Non-sensitive data (cache, preferences) |

### Global state

Redux Toolkit is used for shared UI/domain state (currently the `auth` slice with `user` and `token`). Typed accessors `useAppDispatch` / `useAppSelector` are exported from `src/redux/store.ts`.

---

## npm scripts

| Script                | What it does                                        |
| --------------------- | --------------------------------------------------- |
| `npm start`           | Start the Metro bundler                             |
| `npm run android`     | Build & run the app on Android                      |
| `npm run ios`         | Build & run the app on iOS (macOS)                  |
| `npm test`            | Run Jest tests                                      |
| `npm run lint`        | ESLint + Prettier check                             |

---

## Configuration reference (in depth)

### `src/config/environment.ts`

The single source of truth for app-wide constants. Currently it exports `BASE_URL` (the API origin used by `apiCaller`). Add any new environment constant here (feature flags, third-party keys that are **not** secret, timeouts, etc.) — keep secrets out of the JS bundle and in native secure storage instead.

### Networking (`src/utility/apiCaller.ts`)

- Relative paths are resolved against `BASE_URL`.
- Auth: token is read from storage and sent in the `Authorization` header.
- `401` handling: automatic logout → re-login → one retry of the original request.
- A request timeout aborts slow calls.

### Storage keys

- Secure values (tokens/passwords) go through `secureStorage.ts`.
- Non-sensitive values go through `localDataStorage.ts`.

### Native modules

These packages require a native rebuild after install (they ship Android/iOS code):

`@react-native-async-storage/async-storage`, `react-native-keychain`, `react-native-biometrics`, `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-screens`.

After adding/removing any of them:

- **Android:** `npm run android` (rebuilds automatically).
- **iOS:** `cd ios && pod install`, then `npm run ios`.

---

## Extending the app

### Add a new screen

1. Create `src/page/myScreen.tsx` exporting a default component.
2. Register it in `App.tsx`:

```tsx
<Stack.Screen name="MyScreen" component={MyScreen} />
```

3. Navigate to it with `navigation.navigate("MyScreen", { ...params })`.

### Add a new API endpoint (SWR)

```ts
// src/api/example.ts
import { useSWR } from "swr";
import { apiCaller } from "../utility/apiCaller";

export const useExample = (id: number) =>
  useSWR(["example", id], (key) => apiCaller(`/example/${id}`, "GET"), {
    errorRetryCount: 2,
  });
```

```tsx
const { data, error, isLoading } = useExample(1);
```

### Add a new Redux slice

1. Create `src/redux/features/<name>.slice.ts` (Redux Toolkit `createSlice`).
2. Add the reducer in `src/redux/store.ts` under `reducers`.
3. Use `useAppSelector` / `useAppDispatch` from `src/redux/store.ts`.

---

## Testing & code quality

- **Jest** (`jest.config.js`, `jest.setup.js`) uses the React Native preset with `transformIgnorePatterns` so native packages are transpiled. `__tests__/App.test.tsx` renders the app as a smoke test. Run with `npm test`.
- **ESLint + Prettier** are configured; run `npm run lint`.

---

## Common issues (by OS)

| Symptom | Likely cause / fix |
| ------- | ------------------ |
| `JDK 17 not found` (Android) | Install JDK 17 and set `JAVA_HOME`; re-sync Android Studio. |
| Metro not connecting | Check the device/emulator and your machine share a network; try `npm start -- --reset-cache`. |
| `pod install` fails (iOS) | Update Xcode & CocoaPods; `cd ios && pod deintegrate && pod install`. |
| Native module missing after adding a package | Rebuild: Android — `npm run android`; iOS — `pod install` then `npm run ios`. |
| Biometrics prompt not shown | Device/emulator needs a configured biometric (fingerprint/face); check `react-native-biometrics` supported-state in code. |
| Keychain errors (iOS) | Ensure a signing team is selected in Xcode and the app is on a trusted device. |
| Stale bundle on device | Press `r` in the Metro terminal, or do a clean install of the app. |
| Node version errors | Use Node `>= 22.11.0` (see `package.json` engines); verify with `node -v`. |

---

## Notes

- This is a **native** React Native app (not Expo) — native toolchains are required.
- `app.json` defines the app name used by the native projects; after changing it, rebuild native code.
- The sample data source is [jsonplaceholder.typicode.com](https://jsonplaceholder.typicode.com) used by `src/api/sample.ts` and `HomeScreen` — replace it with your own API when integrating.
