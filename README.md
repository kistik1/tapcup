**Welcome to your Base44 project** 

**About**

View and Edit  your app on [Base44.com](http://Base44.com)

This project contains everything you need to run your app locally.

TapCup uses a URL-driven chip identity flow in production: the chip stores a canonical TapCup URL such as `https://tap-cup.base44.app/consumer?personal_id=...`, and the app resolves that URL into a consumer profile. Browser NFC scanning is treated as optional, not required.

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

To simulate a chip scan from the simulator, pass a canonical chip URL and choose the side:

```bash
npm run sim:nfc -- --chip-url "https://tap-cup.base44.app/consumer?personal_id=NFC-AJV32A" --side consumer
npm run sim:nfc -- --chip-url "https://tap-cup.base44.app/consumer?personal_id=NFC-AJV32A" --side shop
npm run sim:test -- --chip-url "https://tap-cup.base44.app/consumer?personal_id=NFC-AJV32A"
```

`sim:nfc -- --chip-url ...` runs only the NFC redirect test. The simulator parses `personal_id` from the canonical chip URL, clears cached scan state before the run, and then executes the consumer or shop side you selected with `--side`.

`--chip-id` and `--consumer-chip-id` are still accepted as legacy aliases, but the preferred input is now the full canonical chip URL saved on the NFC chip.

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
