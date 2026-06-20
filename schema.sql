-- 1. Create Profiles Table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar text,
  portfolio text,
  hourly_rate integer default 65,
  retainer_rate integer default 2500,
  pitch_template text default 'Hey {CreatorName}!

I really enjoyed your recent video ''{VideoTitle}''. I''ve been following {ChannelHandle} and absolutely love your content.

I noticed a small optimization that could boost retention by 15-20% in your first 30 seconds. I''ve put together a quick mockup edit of that section to show you what I mean.

Let''s chat about upgrading your future edits!

Best,
Alex',
  created_at timestamptz default now()
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Allow users to read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Allow users to update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Allow users to insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);


-- 2. Create Sprints Table
create table public.sprints (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  niche text not null,
  subscribers text,
  velocity text,
  edit_style text,
  region text default 'Global',
  content_type text default 'Any',
  created_at timestamptz default now()
);

-- Enable RLS on Sprints
alter table public.sprints enable row level security;

-- Sprints Policies
create policy "Allow users to read their own sprints"
  on public.sprints for select
  using (auth.uid() = user_id);

create policy "Allow users to insert their own sprints"
  on public.sprints for insert
  with check (auth.uid() = user_id);

create policy "Allow users to update their own sprints"
  on public.sprints for update
  using (auth.uid() = user_id);

create policy "Allow users to delete their own sprints"
  on public.sprints for delete
  using (auth.uid() = user_id);


-- 3. Create Creators Table
create table public.creators (
  id uuid default gen_random_uuid() primary key,
  channel_id text,
  channel_name text not null,
  handle text not null,
  avatar text,
  thumbnail_url text,
  niche text not null,
  subscribers integer not null,
  average_views integer not null,
  growth_score integer not null, -- maps to subGrowth velocity percentage
  opportunity_score integer not null, -- maps to target monthly crmValue retainer
  email text not null,
  velocity text,
  edit_style text,
  video_count integer,
  suggested_pitch text,
  editing_pain_points text[],
  latest_videos jsonb,
  primary_niche text,
  niche_confidence integer,
  content_type text,
  region_score integer,
  fit_score integer,
  last_upload_days integer,
  uploads_last_30_days integer,
  created_at timestamptz default now()
);

-- Enable RLS on Creators (shared public/authenticated directory)
alter table public.creators enable row level security;

-- Creators Policies
create policy "Allow authenticated users to read creators"
  on public.creators for select
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert creators"
  on public.creators for insert
  with check (auth.role() = 'authenticated');


-- 4. Create Leads Table
create table public.leads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  creator_id uuid references public.creators(id) on delete cascade not null,
  status text not null check (status in ('lead', 'pitched', 'negotiating', 'signed', 'none')),
  created_at timestamptz default now(),
  unique(user_id, creator_id)
);

-- Enable RLS on Leads
alter table public.leads enable row level security;

-- Leads Policies
create policy "Allow users to read their own leads"
  on public.leads for select
  using (auth.uid() = user_id);

create policy "Allow users to insert their own leads"
  on public.leads for insert
  with check (auth.uid() = user_id);

create policy "Allow users to update their own leads"
  on public.leads for update
  using (auth.uid() = user_id);

create policy "Allow users to delete their own leads"
  on public.leads for delete
  using (auth.uid() = user_id);


-- 5. Trigger on Auth.Users to Auto-Create Profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    upper(substring(coalesce(new.raw_user_meta_data->>'full_name', new.email) from 1 for 2))
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 6. Seed Initial Demo Creators Data
insert into public.creators (
  id, channel_name, handle, avatar, niche, subscribers, average_views, growth_score, opportunity_score, email, velocity, edit_style, video_count, suggested_pitch, editing_pain_points, latest_videos
) values
(
  'a8e52db0-8800-47e2-8957-c81b22e11111',
  'DevonTech',
  '@devontech',
  'DT',
  'Tech',
  45200,
  68000,
  38,
  1800,
  'devon@devontech.media',
  'Explosive',
  'Fast-cut',
  112,
  'Hey Devon! Love the recent comparison video on the M4 Mac Mini. I noticed the retention in your intro could be boosted by 15-20% by cutting the 15-second static channel intro and diving straight into the spec comparison. I''ve mocked up a custom 30-second hook for your next video — check it out here...',
  array[
    'High intro drop-off rate (average 42% retention after 10s)',
    'Flat B-roll overlays during key hardware specs explanations',
    'Inconsistent audio compression in quiet testing rooms'
  ],
  '[
    {"id": "v1", "title": "M4 Mac Mini: 6 Months Later (Still Worth It?)", "views": "82K", "duration": "12:14", "published": "3 days ago", "retentionRisk": "High hook drop-off"},
    {"id": "v2", "title": "Why I''m Throwing Away My Mechanical Keyboard", "views": "61K", "duration": "10:05", "published": "10 days ago"},
    {"id": "v3", "title": "The Ultimate Desktour Setup (2026 Edition)", "views": "94K", "duration": "15:40", "published": "3 weeks ago", "retentionRisk": "Slow mid-video pacing"}
  ]'::jsonb
),
(
  'a8e52db0-8800-47e2-8957-c81b22e22222',
  'MoneyWise Academy',
  '@moneywise',
  'MW',
  'Finance',
  124000,
  85000,
  18,
  2500,
  'collabs@moneywise.academy',
  'Rapid',
  'Text-heavy',
  245,
  'Hi MoneyWise Team! Your latest breakdown on compound interest was spot on. I noticed the section explaining dividend yields could really benefit from kinetic text animations rather than raw charts. I edited a 45-second segment of that video showing how we can make your tutorials feel like high-production Netflix explainers...',
  array[
    'Lack of dynamic visual cues during complex stock market analyses',
    'Monotonous backing track leveling makes narration feel sleepy',
    'Overly generic stock footage loops instead of bespoke animations'
  ],
  '[
    {"id": "mw1", "title": "How to Build a $1,000/Month Dividend Portfolio", "views": "104K", "duration": "18:22", "published": "5 days ago"},
    {"id": "mw2", "title": "The Impending Housing Market Correction?", "views": "89K", "duration": "14:10", "published": "12 days ago"},
    {"id": "mw3", "title": "Why Index Funds Are Slowly Ruining Your Returns", "views": "62K", "duration": "21:05", "published": "2 weeks ago"}
  ]'::jsonb
),
(
  'a8e52db0-8800-47e2-8957-c81b22e33333',
  'PixelBound Stories',
  '@pixelbound',
  'PB',
  'Gaming',
  28000,
  120000,
  62,
  3200,
  'pixelboundgaming@gmail.com',
  'Explosive',
  'Cinematic',
  48,
  'Hey PixelBound! Your game essay on ''Outer Wilds'' was a narrative masterpiece. To make the story flow even more cohesively, I''d love to assist with the cinematic transitions and rich foley sound design. I created a custom sound design draft for your latest intro — let me know if this is the level of polish you want for your next project!',
  array[
    'Extended narrative silences in script transitions',
    'Lack of sound design / foley during lore reveals',
    'Underutilization of custom zoom pans on epic visual landscape captures'
  ],
  '[
    {"id": "pb1", "title": "The Gaming Masterpiece Nobody Finished", "views": "145K", "duration": "24:18", "published": "1 week ago", "retentionRisk": "Dead space in audio"},
    {"id": "pb2", "title": "Why Open Worlds Feel So Empty Now", "views": "112K", "duration": "19:50", "published": "3 weeks ago"},
    {"id": "pb3", "title": "The Tragically Forgotten Sequel of 2018", "views": "103K", "duration": "32:10", "published": "1 month ago"}
  ]'::jsonb
),
(
  'a8e52db0-8800-47e2-8957-c81b22e44444',
  'Clara''s Horizon',
  '@clarashorizon',
  'CH',
  'Lifestyle',
  88000,
  45000,
  15,
  2000,
  'contact@clarashorizon.com',
  'Steady',
  'Minimalist',
  160,
  'Hi Clara! I love your calming editing style, but noticed the color transition when you moved outdoors in your Iceland vlog was a bit jarring. I''m a professional editor specializing in warm, organic grading and seamless vlog flow. I''d love to edit one of your upcoming vlogs for free to see if we''re a good fit...',
  array[
    'Color grading mismatch between warm indoor vlogs and cool outdoor scenery',
    'Slow, repetitive pacing in travel montages',
    'Substandard typography for subtitles and section headings'
  ],
  '[
    {"id": "ch1", "title": "My 5 AM Slow Living Routine in Kyoto, Japan", "views": "55K", "duration": "14:30", "published": "4 days ago"},
    {"id": "ch2", "title": "The Truth About Leaving My Job to Travel Full-Time", "views": "38K", "duration": "18:12", "published": "2 weeks ago"}
  ]'::jsonb
),
(
  'a8e52db0-8800-47e2-8957-c81b22e55555',
  'The Curious Mind',
  '@curiousmind',
  'CM',
  'Essay',
  210000,
  180000,
  8,
  3000,
  'curiousmind@curiousmedia.co',
  'Steady',
  'Cinematic',
  92,
  'Hey Curious Mind! Your video on the history of typography was incredible. However, the 8-minute chapter on Gutenberg felt a bit slow due to the constant static imagery. I''d love to help craft custom animated map timelines and detailed sound sweeps to keep viewers highly engaged throughout your long-form pieces...',
  array[
    'Chapters drag on too long without a visual pattern shift',
    'Repetitive usage of public domain orchestral music tracks',
    'Lack of sound effects for on-screen diagram elements'
  ],
  '[
    {"id": "cm1", "title": "The Architecture of the Perfect Lie", "views": "195K", "duration": "28:15", "published": "6 days ago"},
    {"id": "cm2", "title": "How Maps Can Control an Empire", "views": "172K", "duration": "25:40", "published": "3 weeks ago"}
  ]'::jsonb
),
(
  'a8e52db0-8800-47e2-8957-c81b22e66666',
  'CodeCraft',
  '@codecraft',
  'CC',
  'Tech',
  15000,
  42000,
  75,
  1500,
  'hello@codecraft.dev',
  'Explosive',
  'Fast-cut',
  22,
  'Hey CodeCraft! I love your devlogs, but viewers might lose track during full-screen code typing segments. I specialize in software tutorial editing, including zoom-ins, syntax highlights, and smooth code-to-demo transitions. Here''s a 30-second sample of how I cleaned up your last Tailwind demo...',
  array[
    'Long coding blocks without zooming into specific lines of code',
    'Monotonous keyboard click sounds dominate the audio track',
    'Poor graphic transitions between slides and editor'
  ],
  '[
    {"id": "cc1", "title": "I Built a Fullstack SaaS in 24 Hours (No Sleep)", "views": "48K", "duration": "11:05", "published": "Yesterday", "retentionRisk": "Long static code blocks"},
    {"id": "cc2", "title": "Why Junior Devs Are Struggling in 2026", "views": "36K", "duration": "8:50", "published": "1 week ago"}
  ]'::jsonb
);
