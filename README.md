# Scoutly

Scoutly is an AI-powered creator discovery platform built for freelance video editors and creative agencies.

Instead of cold-emailing random creators, Scoutly helps editors discover active YouTube channels that are actively growing, identify potential editing opportunities, and organize outreach through a built-in CRM pipeline.

---

## Features

### Creator Discovery Engine

Discover YouTube creators based on:

* Niche
* Subscriber range
* Growth velocity
* Region
* Content type (Long Form, Shorts, Mixed)

Scoutly analyzes creators and surfaces the highest-fit opportunities.

<img width="1918" height="975" alt="Screenshot 2026-06-20 165104" src="https://github.com/user-attachments/assets/f582bf97-1b1b-4f1f-9020-5f2882c0568c" />

### Creator Fit Engine

Every creator is scored using multiple qualification signals:

* Niche relevance
* Upload frequency
* Recent activity
* Growth indicators
* Region match
* Subscriber fit

This helps prioritize creators most likely to benefit from professional editing services.

<img width="1918" height="977" alt="Screenshot 2026-06-20 165114" src="https://github.com/user-attachments/assets/04cbd205-9310-4ff2-9926-7ee9233708bb" />

### Opportunity Qualification

Scoutly automatically evaluates:

* Last upload activity
* Upload consistency
* Growth potential
* Editing complexity
* Audience momentum

Each creator receives an Opportunity Score and Fit Score.

<img width="1918" height="977" alt="Screenshot 2026-06-20 165126" src="https://github.com/user-attachments/assets/e663516c-b663-47b2-8c3f-da608883754b" />

### Sprint-Based Discovery

Launch discovery sprints to find creators matching your ideal client profile.

Example:

* Travel Creators
* Gaming Channels
* Finance Channels
* Fitness Creators
* Lifestyle Vloggers

### CRM Pipeline

Track creators through:

1. Lead Saved
2. Outreach Sent
3. Negotiating
4. Signed

Manage your outreach process from discovery to conversion.

<img width="1918" height="980" alt="Screenshot 2026-06-20 165204" src="https://github.com/user-attachments/assets/f87b5ef2-1c51-482a-ae89-eec0740f25c9" />

### Creator Profiles

View detailed creator insights including:

* Subscriber count
* Average views
* Recent uploads
* Content type
* Opportunity score
* Fit score
* Editing pain points

<img width="1918" height="971" alt="image" src="https://github.com/user-attachments/assets/5c6154d3-5eb4-429a-873e-7592029c5b47" />

---

## Tech Stack

### Frontend

* Next.js 16
* React
* TypeScript
* Tailwind CSS

### Backend

* Supabase
* PostgreSQL
* Row Level Security (RLS)

### APIs

* YouTube Data API v3

### Deployment

* Vercel

---

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
YOUTUBE_API_KEY=your_youtube_api_key
```

---

## Local Development

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Build production version:

```bash
npm run build
```

---

## Database Setup

Create a Supabase project and execute the schema file:

```sql
schema.sql
```

This creates:

* Profiles
* Sprints
* Creators
* Leads

with Row Level Security policies enabled.

---

## Roadmap

### Discovery Engine V2.2

* Expanded candidate sourcing
* Region-aware discovery
* Advanced ranking algorithms
* Discovery diagnostics

### Contact Discovery Engine

* Website extraction
* Email discovery
* Contact confidence scoring
* Social profile detection

### AI Outreach Assistant

* Personalized pitch generation
* Creator-specific outreach drafts
* Automated follow-up suggestions

---

## Current Status

Scoutly is currently in active development.

The platform already supports:

* Authentication
* Creator discovery
* Creator qualification
* Sprint management
* CRM tracking
* YouTube analytics integration

Additional discovery, contact intelligence, and outreach automation features are under development.

---

## License

Private project. All rights reserved.

© Scoutly
