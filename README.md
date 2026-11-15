# Project E.D.E.N. — Team Dyeus

**NASA Space Apps Challenge 2026 · Astronaut health monitoring**

In deep space, a message to Earth can take up to ~22 minutes each way, so astronauts cannot wait for a doctor on the ground. Project E.D.E.N. is an autonomous dashboard that connects two systems NASA already has but that do not talk to each other: **crew health monitoring** and **space agriculture**.

When the astronaut's health log shows a problem, E.D.E.N. prescribes a plant to grow on board, audits the seed vault so it only uses seeds whose DNA was not damaged by radiation, and tells the crew which **Seed Pod** to plug into NASA's Veggie greenhouse. We don't synthesize pills; we automate targeted agriculture.

**Live demo:** https://nasa-space-challenge-team-dyeus.vercel.app

## How it works

1. **Health alert.** The latest record in `astronaut_log` (stress, inflammation, cognitive, cardiovascular and nutrition levels, heart rate, sleep, symptoms) is read every 15 seconds. Any level above `LOW` becomes an alert.
2. **Botanical prescription.** Each alert is matched with a plant in the `plants` table. Plants NASA has already grown in space (Veggie / Advanced Plant Habitat) are preferred; Earth-only candidates are labeled **NOT FLIGHT-VALIDATED**.
3. **Seed vault audit.** The cumulative radiation dose of each seed cartridge is computed from the cruise dose rate measured by MSL/RAD (1.84 mSv/day). Damaged cartridges are rejected; DNA-verified ones are authorized.
4. **Dispense.** The crew dispenses the authorized Seed Pod; the action is written to `dispense_log` and the pod appears in the Plant Status view.
5. **Consumption.** No chemical processing: crops are eaten fresh or as a hot-water infusion, using hardware already on the ISS.

## Screens

| View | What it shows |
| --- | --- |
| Astronaut Data | Profile, vital signs, cumulative radiation vs. the 600 mSv career limit |
| Medical Consultation | Active clinical alerts and the automatic botanical prescription |
| Dispenser | The authorized Seed Pod and the dispense action |
| Capsule Inventory | Seed vault genetic audit (approved / rejected cartridges) |
| Plant Status | Pods in cultivation and the botanical registry |

## Tech stack

- **Frontend:** React 19, Vite 6, Tailwind CSS 4, lucide-react
- **Backend:** Supabase (PostgreSQL + REST API), accessed with plain `fetch` (no SDK)
- **Security:** Row Level Security on every table; role-based access (`admin`, `programador`, `doctor`, `paciente`) through `user_profiles`
- **Hosting:** Vercel (deploys automatically from `main`)
- **Hardware (optional):** Arduino sketch that simulates a wearable biosensor and feeds `astronaut_log` — see [`hardware/`](hardware/)

## Data model (Supabase)

| Table | Purpose |
| --- | --- |
| `astronaut_log` | Astronaut health records (levels, vitals, symptoms, days in space) |
| `plants` | Botanical catalog: condition, plant, active compound, dose, grow time, NASA-grown flag, evidence |
| `seed_cartridges` | Seed Pod inventory (`pod_id`, slot, status, prescribed patient) |
| `dispense_log` | Every dispensed pod: plant, dose, notes, linked health record |
| `user_profiles`, `access_requests`, `profile_views` | Roles and access control |

The data layer lives in [`src/data/api.js`](src/data/api.js). If Supabase is unreachable, the app falls back to demo data so it never breaks.

## Run locally

```bash
npm install
cp .env.example .env    # fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Build for production with `npm run build`.

## Space agency data and references

- NASA Human Research Program — Risks of Human Spaceflight: https://www.nasa.gov/hrp/risks/
- NASA — Risk of Inadequate Food and Nutrition: https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/
- NASA Veggie (Vegetable Production System): https://www.nasa.gov/missions/station/so-you-want-to-be-a-space-farmer/
- NASA Advanced Plant Habitat (Plant Habitat-04, chile peppers, 2021): https://science.nasa.gov/mission/advanced-plant-habitat/
- NASA Open Science Data Repository (OSDR) & GeneLab: https://science.nasa.gov/biological-physical/data/osdr/
- Cruise radiation dose rate (~1.84 mSv/day): Zeitlin et al., *Science* 340 (2013), MSL/RAD measurements during the Earth–Mars cruise.

## Use of AI

AI tools were used as thought partners and coding assistants during the 48-hour hackathon; the team made the final decisions.

- **Gemini (Google):** brainstorming the Living Pharmacy concept, structuring documents, refining the pitch, and building the multi-window interface (via an AI coding agent).
- **Claude / Claude Code (Anthropic):** the Supabase data layer (`src/data/api.js`), database security policies, integration testing and code review.

## Team

Team Dyeus — NASA Space Apps Challenge 2026.

## License

[MIT](LICENSE)
