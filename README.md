**Welcome to your Base44 project** 

**About**

View and Edit  your app on [Base44.com](http://Base44.com)

This project contains everything you need to run your app locally.

TapCup uses a URL-driven chip identity flow in production: the chip stores a unique ID, and the app resolves that ID into a consumer profile via `/consumer?personal_id=...`. Browser NFC scanning is treated as optional, not required.

App URL: https://tap-cup.base44.app/

### Simulator

Run the browser simulator with:

```bash
npm run sim:test
```

Each simulator run prints a concise pass/fail summary after the Playwright output.

Run a narrower scenario set:

```bash
npm run sim:nfc
npm run sim:consumer
npm run sim:shop
```

Simulator artifacts are written to `simulator-artifacts/` and include JSON step logs, plain-text logs, screenshots, and Playwright traces on failure.

To simulate a consumer chip scan from the simulator, pass a chip ID flag:

```bash
npm run sim:nfc -- --chip-id SIM-111111
npm run sim:test -- --consumer-chip-id SIM-111111
```

`sim:nfc -- --chip-id ...` runs only the NFC redirect test, preloads the simulator NFC panel with the consumer chip ID, and routes the scan into `/consumer?personal_id=...`.

To inspect the detailed artifact report after a run, use:

```bash
npm run sim:report
```

**Edit the code in your local development environment**

Any change pushed to the repo will also be reflected in the Base44 Builder.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create an `.env.local` file and set the right environment variables

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url

e.g.
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-to-do-list-81bfaad7.base44.app
```

Run the app: `npm run dev`

**Publish your changes**

Open [Base44.com](http://Base44.com) and click on Publish.

**Docs & Support**

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Support: [https://app.base44.com/support](https://app.base44.com/support)
