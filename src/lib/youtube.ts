export interface YouTubeCreator {
  channel_id: string;
  channel_name: string;
  handle: string;
  avatar: string;
  thumbnail_url: string;
  niche: string;
  subscribers: number;
  average_views: number;
  growth_score: number;
  opportunity_score: number;
  email: string;
  velocity: string;
  edit_style: string;
  video_count: number;
  suggested_pitch: string;
  editing_pain_points: string[];
  latest_videos: {
    id: string;
    title: string;
    views: string;
    duration: string;
    published: string;
    url: string;
  }[];
  description: string;
  primary_niche: string;
  niche_confidence: number;
  content_type: string;
  region_score: number;
  fit_score: number;
  last_upload_days: number;
  uploads_last_30_days: number;
}

const REGION_CODES: Record<string, string> = {
  "United States": "US",
  "United Kingdom": "GB",
  "Canada": "CA",
  "Australia": "AU",
  "Germany": "DE",
  "France": "FR",
  "Poland": "PL",
  "India": "IN"
};

const NICHE_SEARCH_TERMS: Record<string, string[]> = {
  Tech: ["tech reviews", "gadgets", "productivity setup", "software reviews", "AI tools"],
  Gaming: ["gaming", "gameplay", "gaming commentary", "gaming highlights", "esports"],
  Finance: ["personal finance", "investing", "stock market", "financial advice", "wealth building"],
  Essay: ["video essay", "historical documentary", "video essays", "deep dive analysis"],
  Lifestyle: ["lifestyle vlog", "travel vlog", "slow living", "daily routine", "aesthetic vlog"],
  "Travel & Tourism": ["travel vlog", "solo travel", "luxury travel", "backpacking", "travel documentary", "digital nomad", "van life", "travel guide"],
  Fitness: ["fitness", "workout", "bodybuilding", "fat loss", "gym transformation", "strength training"],
  All: ["video essay", "review channel", "vlog", "tech reviews", "gaming gameplay"]
};

function parseDuration(durationStr: string): string {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = durationStr.match(regex);
  if (!matches) return "0:00";
  const hours = parseInt(matches[1] || "0");
  const minutes = parseInt(matches[2] || "0");
  const seconds = parseInt(matches[3] || "0");
  
  const totalMinutes = hours * 60 + minutes;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
  return `${totalMinutes}:${formattedSeconds}`;
}

function formatViews(viewsCount: number): string {
  if (viewsCount >= 1000000) {
    return `${(viewsCount / 1000000).toFixed(1)}M`;
  }
  if (viewsCount >= 1000) {
    return `${(viewsCount / 1000).toFixed(0)}K`;
  }
  return viewsCount.toString();
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 4) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}

function generatePainPoints(niche: string, ratio: number, editStyle: string): string[] {
  const points = [];
  if (ratio < 0.1) {
    points.push("High intro drop-off rate (estimated average 40% retention after 10s)");
  }
  if (editStyle === "Fast-cut") {
    points.push("Repetitive TikTok-style whip pan cuts without structural pacing changes");
    points.push("Underutilized kinetic text animation in quiet monologue segments");
  } else if (editStyle === "Cinematic") {
    points.push("Extended narrative silences in scene transitions slowing down watch time");
    points.push("Lack of custom sound effects/foley during narrative spec reveals");
  } else if (editStyle === "Text-heavy") {
    points.push("Monotonous stock footage sequences overlaying detailed voiceovers");
    points.push("Lack of sound design/foley for on-screen text graphics");
  } else {
    points.push("Flat color grading mismatch between indoor and outdoor footage");
    points.push("Slow, repetitive travel montages causing pacing drag");
  }
  
  if (points.length < 3) {
    points.push("Substandard caption/subtitle typography for key hooks");
  }
  return points.slice(0, 3);
}

export function durationToSeconds(durationStr: string): number {
  const parts = durationStr.split(":").map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}

export function isWithinLast30Days(published: string, publishedAt?: string): boolean {
  if (publishedAt) {
    const date = new Date(publishedAt);
    if (!isNaN(date.getTime())) {
      return Date.now() - date.getTime() <= 30 * 24 * 60 * 60 * 1000;
    }
  }
  // Fallback to text matching
  const lower = published.toLowerCase();
  if (lower.includes("month") || lower.includes("year")) return false;
  if (lower.includes("day") || lower.includes("week") || lower.includes("hour") || lower.includes("minute") || lower.includes("yesterday") || lower.includes("today")) {
    if (lower.includes("week")) {
      const match = lower.match(/(\d+)\s+week/);
      if (match) {
        const weeks = parseInt(match[1]);
        return weeks <= 4;
      }
    }
    return true;
  }
  return false;
}

export function parseRelativeTimeToDays(publishedStr: string): number {
  const lower = publishedStr.toLowerCase();
  if (lower.includes("yesterday")) return 1;
  if (lower.includes("today") || lower.includes("hour") || lower.includes("minute")) return 0;
  
  const numMatch = lower.match(/(\d+)/);
  if (!numMatch) return 30; // Default fallback
  const num = parseInt(numMatch[1]);
  
  if (lower.includes("day")) return num;
  if (lower.includes("week")) return num * 7;
  if (lower.includes("month")) return num * 30;
  if (lower.includes("year")) return num * 365;
  
  return 30;
}

export function getKeywordScore(text: string, keywords: string[]): number {
  let count = 0;
  for (const keyword of keywords) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    count += (text.match(regex) || []).length;
  }
  return count;
}

export function getRegionAwareSearchQueries(niche: string, region: string): string[] {
  let selectedNicheName = niche;
  if (niche === "Travel") selectedNicheName = "Travel & Tourism";
  const baseTerms = NICHE_SEARCH_TERMS[selectedNicheName] || [selectedNicheName];
  
  if (!region || region === "Global") return baseTerms;
  
  if (region === "Poland") {
    if (selectedNicheName === "Tech") return ["polski tech", "recenzja telefonu", "technologia polska", "biurko setup"];
    if (selectedNicheName === "Gaming") return ["gry pl", "gameplay pl", "polski gaming", "zagrajmy w"];
    if (selectedNicheName === "Finance") return ["finanse osobiste", "inwestowanie giełda", "oszczędzanie pieniędzy", "kryptowaluty pl"];
    if (selectedNicheName === "Essay") return ["wideo esej", "dokument pl", "analiza filmu", "historia pl"];
    if (selectedNicheName === "Lifestyle") return ["vlog pl", "codzienna rutyna", "lifestyle vlog pl", "slow living polska"];
    if (selectedNicheName === "Travel & Tourism") return ["podróże", "vlog z podróży", "tanie podróżowanie", "przewodnik turystyczny"];
    if (selectedNicheName === "Fitness") return ["trening w domu", "kulturystyka pl", "dieta odchudzanie", "siłownia pl"];
    return baseTerms.map(t => `${t} polska`);
  }
  if (region === "Germany") {
    if (selectedNicheName === "Tech") return ["tech review deutsch", "gadgets deutsch", "setup deutsch", "software deutsch"];
    if (selectedNicheName === "Gaming") return ["lets play deutsch", "gaming deutsch", "gameplay deutsch", "zocken"];
    if (selectedNicheName === "Finance") return ["finanzen", "aktien depot", "investieren lernen", "finanztipps"];
    if (selectedNicheName === "Essay") return ["video essay deutsch", "dokumentation deutsch", "analyse", "geschichte"];
    if (selectedNicheName === "Lifestyle") return ["vlog deutsch", "tagesablauf vlog", "lifestyle vlog deutsch", "minimalismus deutsch"];
    if (selectedNicheName === "Travel & Tourism") return ["reisevlog deutsch", "urlaub blog", "backpacking deutschland", "weltreise"];
    if (selectedNicheName === "Fitness") return ["muskelaufbau training", "abnehmen diät", "fitness deutsch", "gym training"];
    return baseTerms.map(t => `${t} deutschland`);
  }
  if (region === "France") {
    if (selectedNicheName === "Tech") return ["high tech avis", "test smartphone francais", "setup tech", "logiciels"];
    if (selectedNicheName === "Gaming") return ["gaming fr", "gameplay fr", "let's play fr", "jeux video"];
    if (selectedNicheName === "Finance") return ["finances personnelles", "investir en bourse", "argent passif", "budgeting fr"];
    if (selectedNicheName === "Essay") return ["video essai fr", "documentaire francais", "analyse film", "histoire"];
    if (selectedNicheName === "Lifestyle") return ["vlog francais", "routine matinale", "lifestyle fr", "slow living fr"];
    if (selectedNicheName === "Travel & Tourism") return ["vlog voyage", "tourisme fr", "voyage solo", "guide voyage"];
    if (selectedNicheName === "Fitness") return ["musculation fr", "perte de poids", "entrainement fitness", "seance gym"];
    return baseTerms.map(t => `${t} france`);
  }
  if (region === "India") {
    if (selectedNicheName === "Tech") return ["tech reviews india", "hindi tech", "budget phone review", "setup tour india"];
    if (selectedNicheName === "Gaming") return ["gaming india", "pubg mobile gameplay", "free fire live", "hindi gaming"];
    if (selectedNicheName === "Finance") return ["finance india", "share market hindi", "mutual funds investment", "money saving tips"];
    if (selectedNicheName === "Essay") return ["video essay india", "indian history documentary", "case study hindi", "deep dive"];
    if (selectedNicheName === "Lifestyle") return ["daily vlog india", "lifestyle vlog hindi", "morning routine india", "aesthetic vlog india"];
    if (selectedNicheName === "Travel & Tourism") return ["travel vlog india", "solo travel india", "indian travel vlogger", "backpacking india"];
    if (selectedNicheName === "Fitness") return ["fitness hindi", "workout plan india", "gym transformation hindi", "diet chart"];
    return baseTerms.map(t => `${t} india`);
  }
  
  return baseTerms.map(t => `${t} ${region.toLowerCase()}`);
}

const NICHE_SIGNALS: Record<string, string[]> = {
  "Travel & Tourism": ["travel", "trip", "tour", "destination", "backpacking", "vacation", "tourism", "explore", "hotel", "flight", "country", "itinerary", "digital nomad", "wanderlust", "vlog", "travel guide"],
  Gaming: ["gaming", "minecraft", "valorant", "fortnite", "call of duty", "stream", "playthrough", "walkthrough", "gameplay", "esports", "bossfight", "speedrun", "gamer"],
  Tech: ["tech", "review", "smartphone", "iphone", "android", "laptop", "software", "gadget", "unboxing", "setup", "hardware"],
  Finance: ["money", "finance", "stocks", "investing", "startup", "wealth", "business", "crypto", "dividend", "passive income", "portfolio"],
  Fitness: ["fitness", "gym", "workout", "training", "weight loss", "muscle", "bodybuilding", "exercise", "strength", "diet", "nutrition"],
  Essay: ["video essay", "documentary", "deep dive", "analysis", "history", "mystery", "critique", "retrospective", "lore", "biography"],
  Lifestyle: ["vlog", "daily routine", "slow living", "aesthetic", "morning routine", "spend the day", "lifestyle", "apartment tour", "minimalist"]
};

export function classifyCreator(
  channelName: string,
  channelDesc: string,
  videos: { title: string; description: string; tags?: string[]; categoryId?: string; published?: string; publishedAt?: string }[]
): { primary_niche: string; niche_confidence: number } {
  const nameText = channelName.toLowerCase();
  const descText = channelDesc.toLowerCase();

  // Filter recent videos in the last 30 days
  const recentVideos = videos.filter(v => isWithinLast30Days(v.published || "", v.publishedAt));
  const targetVideos = recentVideos.length > 0 ? recentVideos : videos;
  const videoText = targetVideos.map(v => v.title + " " + v.description + " " + (v.tags || []).join(" ")).join(" ").toLowerCase();

  const niches = Object.keys(NICHE_SIGNALS);
  
  const nameScores: Record<string, number> = {};
  const descScores: Record<string, number> = {};
  const videoScores: Record<string, number> = {};

  let nameSum = 0;
  let descSum = 0;
  let videoSum = 0;

  for (const niche of niches) {
    const keywords = NICHE_SIGNALS[niche] || [];
    
    const nameCount = getKeywordScore(nameText, keywords);
    nameScores[niche] = nameCount;
    nameSum += nameCount;

    const descCount = getKeywordScore(descText, keywords);
    descScores[niche] = descCount;
    descSum += descCount;

    let videoCount = getKeywordScore(videoText, keywords);
    // Add category bonus
    for (const v of targetVideos) {
      if (!v.categoryId) continue;
      if (niche === "Travel & Tourism" && v.categoryId === "19") videoCount += 15;
      if (niche === "Gaming" && v.categoryId === "20") videoCount += 15;
      if (niche === "Tech" && v.categoryId === "28") videoCount += 15;
      if (niche === "Fitness" && v.categoryId === "17") videoCount += 15;
      if (niche === "Essay" && v.categoryId === "27") videoCount += 15;
      if (niche === "Lifestyle" && (v.categoryId === "22" || v.categoryId === "26")) videoCount += 15;
    }
    videoScores[niche] = videoCount;
    videoSum += videoCount;
  }

  let bestNiche = "Lifestyle";
  let bestConfidence = 0;

  // Calculate weighted normalized scores
  for (const niche of niches) {
    const nameNorm = nameSum > 0 ? (nameScores[niche] / nameSum) * 100 : 0;
    const descNorm = descSum > 0 ? (descScores[niche] / descSum) * 100 : 0;
    const videoNorm = videoSum > 0 ? (videoScores[niche] / videoSum) * 100 : 0;

    const weighted = (0.05 * nameNorm) + (0.25 * descNorm) + (0.70 * videoNorm);
    if (weighted > bestConfidence) {
      bestConfidence = weighted;
      bestNiche = niche;
    }
  }

  // Fallback if no signals found
  if (bestConfidence === 0) {
    bestNiche = "Lifestyle";
    bestConfidence = 10;
  }

  return {
    primary_niche: bestNiche,
    niche_confidence: Math.round(bestConfidence)
  };
}

export function detectContentType(
  videos: { duration: string; publishedAt?: string }[]
): string {
  if (videos.length === 0) return "mixed";

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentVideos = videos.filter(v => v.publishedAt ? new Date(v.publishedAt).getTime() >= thirtyDaysAgo : true);
  const targetVideos = recentVideos.length > 0 ? recentVideos : videos;

  let shortsCount = 0;
  let longCount = 0;
  let totalDurationSeconds = 0;

  for (const v of targetVideos) {
    const sec = durationToSeconds(v.duration);
    totalDurationSeconds += sec;
    if (sec < 90) {
      shortsCount++;
    } else if (sec >= 300) {
      longCount++;
    }
  }

  if (shortsCount > 0 && longCount > 0) {
    return "mixed";
  }
  if (shortsCount > 0) {
    return "short-form";
  }
  if (longCount > 0) {
    return "long-form";
  }

  const avgDuration = totalDurationSeconds / targetVideos.length;
  if (avgDuration < 90) {
    return "short-form";
  }
  if (avgDuration >= 300) {
    return "long-form";
  }
  return "mixed";
}

export function calculateRegionScore(
  creator: { channel_name: string; description: string; country?: string; latest_videos: { title: string; description?: string }[] },
  region: string
): number {
  if (!region || region === "Global") return 100;

  const textToAnalyze = [
    creator.channel_name,
    creator.description,
    ...(creator.latest_videos || []).map(v => v.title + " " + (v.description || ""))
  ].join(" ").toLowerCase();

  const hasPolishCharacters = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(textToAnalyze);
  const polishStopwords = /\b(jest|się|dla|oraz|jako|dlaczego|jak|będzie|pod|tym|tego|wszystko|tutaj)\b/;
  const hasPolishWords = polishStopwords.test(textToAnalyze);
  const isPolish = hasPolishCharacters || hasPolishWords;

  const hasGermanCharacters = /[äöüßÄÖÜ]/.test(textToAnalyze);
  const germanStopwords = /\b(und|der|die|das|ist|nicht|mit|sich|oder|aber|ein|eine|wir|ihr|sie|zu|dem|den|des|im)\b/;
  const hasGermanWords = germanStopwords.test(textToAnalyze);
  const isGerman = hasGermanCharacters || hasGermanWords;

  const frenchStopwords = /\b(le|la|les|et|est|un|une|des|qui|que|dans|sur|pour|avec|nous|vous|ils|elles)\b/;
  const isFrench = frenchStopwords.test(textToAnalyze);

  const spanishStopwords = /\b(el|la|los|las|y|es|un|una|para|con|por|que|en|del|al|como|mas)\b/;
  const isSpanish = spanishStopwords.test(textToAnalyze);

  const hasCyrillic = /[\u0400-\u04FF]/.test(textToAnalyze);
  const hasHindi = /[\u0900-\u097F]/.test(textToAnalyze);
  const hasEastAsian = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/.test(textToAnalyze);

  const englishStopwords = /\b(the|and|of|to|in|is|that|for|on|with|this|it|you|we|our|my)\b/;
  const hasEnglishWords = englishStopwords.test(textToAnalyze);

  let score = 0;

  const cc = (creator.country || "").toUpperCase();
  const targetCC = REGION_CODES[region];

  if (targetCC && cc === targetCC) {
    score += 40;
  } else if (region === "United States" || region === "United Kingdom" || region === "Canada" || region === "Australia") {
    if (["US", "GB", "CA", "AU"].includes(cc)) {
      score += 30;
    }
  }

  let langPoints = 0;
  if (region === "Poland") {
    if (isPolish) langPoints = 60;
    else if (hasEnglishWords) langPoints = 45;
    else if (isGerman || isFrench || isSpanish || hasCyrillic || hasEastAsian || hasHindi) langPoints = 10;
    else langPoints = 25;
  } else if (region === "Germany") {
    if (isGerman) langPoints = 60;
    else if (hasEnglishWords) langPoints = 45;
    else if (isPolish || isFrench || isSpanish || hasCyrillic || hasEastAsian || hasHindi) langPoints = 10;
    else langPoints = 25;
  } else if (region === "France") {
    if (isFrench) langPoints = 60;
    else if (hasEnglishWords) langPoints = 45;
    else if (isPolish || isGerman || isSpanish || hasCyrillic || hasEastAsian || hasHindi) langPoints = 10;
    else langPoints = 25;
  } else if (region === "United States" || region === "United Kingdom" || region === "Canada" || region === "Australia") {
    if (hasEnglishWords) langPoints = 60;
    else if (isPolish || isGerman || isFrench || isSpanish || hasCyrillic || hasEastAsian || hasHindi) langPoints = 10;
    else langPoints = 30;
  } else if (region === "India") {
    if (hasHindi || hasEnglishWords) langPoints = 60;
    else if (hasCyrillic || hasEastAsian || isPolish || isGerman || isFrench) langPoints = 10;
    else langPoints = 35;
  } else {
    langPoints = 60;
  }

  score += langPoints;
  return Math.min(100, Math.max(0, score));
}

export function calculateOpportunityScore(creator: {
  last_upload_days: number;
  uploads_last_30_days: number;
  growth_score: number;
  content_type: string;
  subscribers: number;
  primary_niche: string;
}): number {
  // 1. Recent Activity (25%)
  let activityScore = 0;
  const days = creator.last_upload_days;
  if (days <= 7) activityScore = 100;
  else if (days <= 14) activityScore = 85;
  else if (days <= 30) activityScore = 70;
  else if (days <= 60) activityScore = 40;
  else if (days <= 90) activityScore = 20;
  
  // 2. Upload Frequency (20%)
  let freqScore = 0;
  const uploads = creator.uploads_last_30_days;
  if (uploads >= 5) freqScore = 100;
  else if (uploads >= 3) freqScore = 80;
  else if (uploads >= 2) freqScore = 50;
  else if (uploads >= 1) freqScore = 30;
  
  // 3. Growth Velocity (20%)
  const growthScore = Math.min(100, creator.growth_score * 2);
  
  // 4. Long-form Content (15%)
  let contentScore = 0;
  if (creator.content_type === "long-form") contentScore = 100;
  else if (creator.content_type === "mixed") contentScore = 60;
  else if (creator.content_type === "short-form") contentScore = 10;
  else contentScore = 50;
  
  // 5. Subscriber Sweet Spot (10k-100k) (10%)
  let subScore = 0;
  const subs = creator.subscribers;
  if (subs >= 10000 && subs <= 100000) subScore = 100;
  else if ((subs >= 5000 && subs < 10000) || (subs > 100000 && subs <= 250000)) subScore = 70;
  else subScore = 30;
  
  // 6. Editing Niche Complexity (10%)
  let nicheScore = 50;
  const niche = creator.primary_niche;
  if (["Tech", "Gaming", "Essay", "Travel & Tourism"].includes(niche)) nicheScore = 100;
  else if (niche === "Finance") nicheScore = 80;
  else if (["Fitness", "Lifestyle"].includes(niche)) nicheScore = 60;
  
  const oppScore = 
    (0.25 * activityScore) + 
    (0.20 * freqScore) + 
    (0.20 * growthScore) + 
    (0.15 * contentScore) + 
    (0.10 * subScore) + 
    (0.10 * nicheScore);
    
  return Math.round(oppScore);
}

export function calculateFitScore(
  creator: {
    subscribers: number;
    video_count: number;
    growth_score: number;
    opportunity_score: number;
    niche_confidence: number;
    region_score: number;
    uploads_last_30_days: number;
  },
  subscribersFilter: string
): number {
  const nicheWeight = 0.40 * creator.niche_confidence;

  const growthScale = Math.min(100, creator.growth_score * 2);
  const growthWeight = 0.25 * growthScale;

  const uploads30 = creator.uploads_last_30_days || 0;
  let freqScale = 0;
  if (uploads30 >= 9) freqScale = 100;
  else if (uploads30 >= 5) freqScale = 90;
  else if (uploads30 >= 3) freqScale = 75;
  else if (uploads30 >= 1) freqScale = 40;
  const freqWeight = 0.15 * freqScale;

  const subs = creator.subscribers;
  let subsMatchScore = 100;
  if (subscribersFilter !== "All") {
    let targetMin = 10000;
    let targetMax = 1000000;
    if (subscribersFilter === "10k-50k") { targetMin = 10000; targetMax = 50000; }
    else if (subscribersFilter === "50k-250k") { targetMin = 50000; targetMax = 250000; }
    else if (subscribersFilter === "250k-1M") { targetMin = 250000; targetMax = 1000000; }

    const inRange = subs >= targetMin && subs <= targetMax;
    if (!inRange) {
      const distance = subs < targetMin ? (targetMin - subs) : (subs - targetMax);
      const penalty = Math.min(90, (distance / targetMin) * 10);
      subsMatchScore = 100 - penalty;
    }
  }
  const subsWeight = 0.10 * subsMatchScore;

  const regionWeight = 0.10 * creator.region_score;

  return Math.round(nicheWeight + growthWeight + freqWeight + subsWeight + regionWeight);
}

export function calculateRankScore(
  creator: YouTubeCreator,
  subscribersFilter: string,
  regionFilter: string
): number {
  return creator.fit_score;
}

export function generateMockCreatorsForSprint(
  niche: string,
  subscribers: string,
  velocity: string,
  editStyle: string,
  region: string = "Global",
  excludeChannelIds: string[] = [],
  contentType: string = "Any"
): YouTubeCreator[] {
  const mockNames: Record<string, string[]> = {
    Tech: ["MKBHD Setup Clones", "TechLab Devon", "HardwareHaven", "GadgetGrid", "FutureSpec"],
    Gaming: ["PixelQuest essays", "BossFight Lore", "Speedrun Chronicles", "RetroResurrect", "GameDesignTheory"],
    Finance: ["Capital Compounders", "IndexFund Investor", "CryptoCaleb", "ValueVanguard", "MarketMetrics"],
    Essay: ["CineAnalysis", "HistoryUncovered", "MythosExplored", "DesignDeconstructed", "CuriousCase"],
    Lifestyle: ["KyotoSlowLife", "NomadNate vlogs", "Emma's Notebook", "VlogVibe", "RusticLiving"],
    All: ["CreatorLabs", "VlogVentures", "IdeaInMotion", "ChannelX", "TrendTrove"]
  };

  if (niche === "Travel & Tourism" || niche === "Travel") {
    mockNames[niche] = ["Vagabond Vlogs", "Wanderlust Diary", "Nomadic Nicole", "PackAndGo", "TrailBlazers"];
  } else if (niche === "Fitness") {
    mockNames[niche] = ["Iron Physique", "Athena Workouts", "GymGainz Lab", "LeanShred Academy", "PowerLifter Hub"];
  }

  let selectedNames = mockNames[niche] || mockNames["All"];
  if (region === "Poland") {
    selectedNames = ["Polski Gadżet", "Kamera PL", "Gry i Opowieści", "Kino Analiza", "Życie w Warszawie"];
  } else if (region === "Germany") {
    selectedNames = ["TechWelt DE", "Spiele Essay", "FinanzAkademie", "Kino Analysieren", "Vlog aus Berlin"];
  } else if (region === "France") {
    selectedNames = ["L'Atelier Tech", "Jeux Histoires", "Finance Directe", "CineDecrypte", "Vlog de Paris"];
  }

  const creators: YouTubeCreator[] = [];
  
  for (let i = 0; i < 15; i++) {
    const rawName = selectedNames[i % selectedNames.length] + ` ${Math.floor(Math.random() * 90) + 10}`;
    const handle = `@${rawName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    
    let subs = 45000;
    if (subscribers === "10k-50k") subs = Math.floor(Math.random() * 40000) + 10000;
    else if (subscribers === "50k-250k") subs = Math.floor(Math.random() * 200000) + 50000;
    else if (subscribers === "250k-1M") subs = Math.floor(Math.random() * 750000) + 250000;
    else subs = Math.floor(Math.random() * 900000) + 10000;

    let computedVelocity = velocity === "All" ? ["Explosive", "Rapid", "Steady"][Math.floor(Math.random() * 3)] : velocity;
    let growthScore = 15;
    if (computedVelocity === "Explosive") growthScore = Math.floor(Math.random() * 30) + 31;
    else if (computedVelocity === "Rapid") growthScore = Math.floor(Math.random() * 15) + 16;
    else growthScore = Math.floor(Math.random() * 10) + 5;

    const avgViews = Math.round(subs * (computedVelocity === "Explosive" ? 0.6 : computedVelocity === "Rapid" ? 0.25 : 0.08));
    const opportunityScore = Math.min(Math.max(Math.round(subs * 0.03 + avgViews * 0.01), 500), 4000);
    const style = editStyle === "All" ? ["Fast-cut", "Cinematic", "Text-heavy", "Minimalist"][Math.floor(Math.random() * 4)] : editStyle;

    let videoTitle1 = `How to master ${niche} content`;
    let videoTitle2 = `My secrets revealed (${niche} guide)`;
    if (region === "Poland") {
      videoTitle1 = `Jak opanować tworzenie w niszy ${niche}`;
      videoTitle2 = `Moje sekrety ujawnione (poradnik ${niche})`;
    } else if (region === "Germany") {
      videoTitle1 = `Wie man ${niche} Inhalte meistert`;
      videoTitle2 = `Meine Geheimnisse gelüftet (${niche} Anleitung)`;
    } else if (region === "France") {
      videoTitle1 = `Comment maitriser le contenu ${niche}`;
      videoTitle2 = `Mes secrets reveles (guide ${niche})`;
    }

    const channelId = `UCmock-${region.toLowerCase().replace(/[^a-z]/g, "")}-${niche.toLowerCase().replace(/[^a-z]/g, "")}-${i}`;

    let computedNiche = niche;
    if (niche === "All") {
      computedNiche = ["Tech", "Gaming", "Finance", "Essay", "Lifestyle", "Travel & Tourism", "Fitness"][Math.floor(Math.random() * 7)];
    } else if (niche === "Travel") {
      computedNiche = "Travel & Tourism";
    }

    const confidence = Math.floor(Math.random() * 25) + 75; // 75 to 99
    
    // Assign mock content type
    let mockContentType = "long-form";
    if (contentType === "Any") {
      mockContentType = ["long-form", "short-form", "mixed"][Math.floor(Math.random() * 3)];
    } else {
      mockContentType = contentType;
    }

    const regScore = region === "Global" ? 100 : Math.floor(Math.random() * 30) + 70; // 70 to 100

    const lastUpload = Math.floor(Math.random() * 25) + 1; // 1 to 25 days ago
    const uploads30 = Math.floor(Math.random() * 8) + 1;   // 1 to 8 uploads in last 30 days

    const fitSc = calculateFitScore({
      subscribers: subs,
      video_count: Math.floor(Math.random() * 150) + 20,
      growth_score: growthScore,
      opportunity_score: 0,
      niche_confidence: confidence,
      region_score: regScore,
      uploads_last_30_days: uploads30
    }, subscribers);

    const oppSc = calculateOpportunityScore({
      last_upload_days: lastUpload,
      uploads_last_30_days: uploads30,
      growth_score: growthScore,
      content_type: mockContentType,
      subscribers: subs,
      primary_niche: computedNiche
    });

    const mockVideos = [
      { id: `mock-v1-${i}`, title: videoTitle1, views: formatViews(avgViews * 1.2), duration: mockContentType === "short-form" ? "0:45" : "10:15", published: lastUpload === 1 ? "Yesterday" : `${lastUpload} days ago`, url: `https://www.youtube.com/watch?v=mock-v1-${i}` },
      { id: `mock-v2-${i}`, title: videoTitle2, views: formatViews(avgViews * 0.9), duration: mockContentType === "short-form" ? "0:30" : "14:40", published: `${lastUpload + 7} days ago`, url: `https://www.youtube.com/watch?v=mock-v2-${i}` }
    ];

    creators.push({
      channel_id: channelId,
      channel_name: rawName,
      handle: handle,
      avatar: rawName.substring(0, 2).toUpperCase(),
      thumbnail_url: "",
      niche: computedNiche,
      subscribers: subs,
      average_views: avgViews,
      growth_score: growthScore,
      opportunity_score: oppSc,
      email: `contact@${handle.replace("@", "")}.com`,
      velocity: computedVelocity,
      edit_style: style,
      video_count: Math.floor(Math.random() * 150) + 20,
      suggested_pitch: `Hey ${rawName}!\n\nI really enjoyed your recent video. Love your content!\n\nBest,\n{MyName}`,
      editing_pain_points: generatePainPoints(computedNiche, avgViews / subs, style),
      latest_videos: mockVideos,
      description: `Mock channel focused on ${computedNiche} and similar creative topics.`,
      primary_niche: computedNiche,
      niche_confidence: confidence,
      content_type: mockContentType,
      region_score: regScore,
      fit_score: fitSc,
      last_upload_days: lastUpload,
      uploads_last_30_days: uploads30
    });
  }

  // Deduplicate creators by channel_id only
  const deduplicated = Array.from(
    new Map(creators.map(c => [c.channel_id, c])).values()
  );

  // Divide into new creators (not previously discovered) and seen creators (discovered)
  const excludeSet = new Set(excludeChannelIds);
  const newCreators = deduplicated.filter(c => !excludeSet.has(c.channel_id));
  const seenCreators = deduplicated.filter(c => excludeSet.has(c.channel_id));

  // Prioritize new creators, fall back to seen creators if we have fewer than 4 new creators
  let finalCreators = [...newCreators];
  if (finalCreators.length < 4) {
    const remaining = 4 - finalCreators.length;
    finalCreators = [...finalCreators, ...seenCreators.slice(0, remaining)];
  }

  // Rank / sort final creators descending by fit_score descending
  finalCreators.sort((a, b) => b.fit_score - a.fit_score);

  return finalCreators;
}

export async function searchYouTubeCreators(
  apiKey: string,
  niche: string,
  subscribers: string,
  velocity: string,
  editStyle: string,
  region: string = "Global",
  excludeChannelIds: string[] = [],
  contentType: string = "Any"
): Promise<YouTubeCreator[]> {
  const regionCode = REGION_CODES[region];
  
  const terms = getRegionAwareSearchQueries(niche, region);
  const allChannelIds = new Set<string>();

  for (const term of terms) {
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=10&q=${encodeURIComponent(term)}&key=${apiKey}${regionCode ? `&regionCode=${regionCode}` : ""}`;
      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        for (const item of searchData.items || []) {
          if (item.snippet?.channelId) {
            allChannelIds.add(item.snippet.channelId);
          }
        }
      }
    } catch (e) {
      console.error(`Error searching term ${term}:`, e);
    }
  }

  const channelIds = Array.from(allChannelIds);
  if (channelIds.length === 0) {
    return [];
  }

  const batchChannelIds = channelIds.slice(0, 50);
  const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${batchChannelIds.join(",")}&key=${apiKey}`;
  const channelsRes = await fetch(channelsUrl);
  if (!channelsRes.ok) {
    throw new Error(`YouTube API Channels info failed: ${channelsRes.statusText}`);
  }
  const channelsData = await channelsRes.json();
  
  // Filter channels based on subscriber count
  const matchedChannels = (channelsData.items || []).filter((ch: any) => {
    const subs = parseInt(ch.statistics?.subscriberCount || "0");
    if (subscribers === "10k-50k") return subs >= 10000 && subs <= 50000;
    if (subscribers === "50k-250k") return subs >= 50000 && subs <= 250000;
    if (subscribers === "250k-1M") return subs >= 250000 && subs <= 1000000;
    return true; // All sizes
  });

  const rawCreatorsList: YouTubeCreator[] = [];

  for (const ch of matchedChannels) {
    try {
      const channelId = ch.id;
      const title = ch.snippet.title;
      const description = ch.snippet.description || "";
      const handle = ch.snippet.customUrl || `@${title.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      const avatarUrl = ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.default?.url || "";
      const subsCount = parseInt(ch.statistics?.subscriberCount || "0");
      const videoCount = parseInt(ch.statistics?.videoCount || "0");
      const channelCountry = ch.snippet.country || "";
      
      const uploadsPlaylistId = channelId.startsWith("UC") 
        ? "UU" + channelId.substring(2)
        : channelId;

      let latestVideos: any[] = [];
      let avgViews = 0;
      let videoDetailsForClassification: any[] = [];

      // Fetch latest 10 playlist items from uploads
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${apiKey}`;
      const playlistRes = await fetch(playlistUrl);
      
      if (playlistRes.ok) {
        const playlistData = await playlistRes.json();
        const videoItems = playlistData.items || [];
        const videoIds = videoItems.map((item: any) => item.snippet?.resourceId?.videoId).filter(Boolean);

        if (videoIds.length > 0) {
          const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(",")}&key=${apiKey}`;
          const videosRes = await fetch(videosUrl);
          if (videosRes.ok) {
            const videosData = await videosRes.json();
            let totalViews = 0;
            
            videoDetailsForClassification = (videosData.items || []).map((v: any) => {
              const viewsVal = parseInt(v.statistics?.viewCount || "0");
              totalViews += viewsVal;
              
              return {
                id: v.id,
                title: v.snippet?.title || "Recent Video",
                description: v.snippet?.description || "",
                tags: v.snippet?.tags || [],
                categoryId: v.snippet?.categoryId || "",
                views: formatViews(viewsVal),
                duration: parseDuration(v.contentDetails?.duration || "PT0S"),
                rawDuration: v.contentDetails?.duration || "PT0S",
                published: formatRelativeTime(v.snippet?.publishedAt || new Date().toISOString()),
                publishedAt: v.snippet?.publishedAt || new Date().toISOString(),
                url: `https://www.youtube.com/watch?v=${v.id}`
              };
            });
            
            latestVideos = videoDetailsForClassification.map(v => ({
              id: v.id,
              title: v.title,
              views: v.views,
              duration: v.duration,
              published: v.published,
              url: v.url
            }));

            avgViews = latestVideos.length > 0 ? Math.round(totalViews / latestVideos.length) : 0;
          }
        }
      }

      let last_upload_days = 999;
      if (videoDetailsForClassification.length > 0) {
        const latest = videoDetailsForClassification[0];
        const pubDate = latest.publishedAt ? new Date(latest.publishedAt) : null;
        if (pubDate && !isNaN(pubDate.getTime())) {
          last_upload_days = Math.max(0, Math.floor((Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24)));
        } else {
          last_upload_days = parseRelativeTimeToDays(latest.published || "");
        }
      }

      const uploads_last_30_days = videoDetailsForClassification.filter(v => isWithinLast30Days(v.published || "", v.publishedAt)).length;

      // Active Filter: Automatically reject creators with last_upload_days > 90
      if (last_upload_days > 90) {
        console.log(`[Fit Engine Active Reject] Excluding '${title}' (${handle}). Inactive channel. Last upload: ${last_upload_days} days ago.`);
        continue;
      }

      // Fit Engine Signal 1: Niche Classification
      const classification = classifyCreator(title, description, videoDetailsForClassification);
      const primary_niche = classification.primary_niche;
      const niche_confidence = classification.niche_confidence;

      // HARD REJECT if: selected niche is NOT the primary niche
      if (niche !== "All") {
        let normalizedSelected = niche;
        if (normalizedSelected === "Travel") normalizedSelected = "Travel & Tourism";
        
        let normalizedPrimary = primary_niche;
        if (normalizedPrimary === "Travel") normalizedPrimary = "Travel & Tourism";

        if (normalizedPrimary.toLowerCase() !== normalizedSelected.toLowerCase()) {
          console.log(`[Fit Engine Niche Reject] Excluding '${title}' (${handle}). Mismatched primary niche. Expected: '${normalizedSelected}', Classified: '${normalizedPrimary}'`);
          continue;
        }
      }

      // Fit Engine Signal 2: Content Type Detection
      const content_type = detectContentType(videoDetailsForClassification.map(v => ({
        duration: v.duration,
        publishedAt: v.publishedAt
      })));

      // Content Type Filter
      if (contentType !== "Any") {
        if (content_type !== contentType) {
          console.log(`[Fit Engine Content Type Reject] Excluding '${title}' (${handle}). Mismatched content type. Expected: '${contentType}', Detected: '${content_type}'`);
          continue;
        }
      }

      // Fit Engine Signal 3: Region Scoring
      const region_score = calculateRegionScore({
        channel_name: title,
        description,
        country: channelCountry,
        latest_videos: videoDetailsForClassification
      }, region);

      // Region score rejection threshold: 50 (except Global)
      if (region !== "Global" && region_score < 50) {
        console.log(`[Fit Engine Region Reject] Excluding '${title}' (${handle}). Region score too low: ${region_score}/100 for region: '${region}'`);
        continue;
      }

      const viewsToSubsRatio = subsCount > 0 ? avgViews / subsCount : 0;
      let computedVelocity = "Steady";
      let growthScore = 12;

      if (viewsToSubsRatio > 0.4) {
        computedVelocity = "Explosive";
        growthScore = Math.floor(Math.random() * 30) + 31;
      } else if (viewsToSubsRatio > 0.15) {
        computedVelocity = "Rapid";
        growthScore = Math.floor(Math.random() * 15) + 16;
      } else {
        computedVelocity = "Steady";
        growthScore = Math.floor(Math.random() * 10) + 5;
      }

      if (velocity !== "All" && computedVelocity !== velocity) {
        computedVelocity = velocity;
        if (velocity === "Explosive") growthScore = Math.floor(Math.random() * 30) + 31;
        else if (velocity === "Rapid") growthScore = Math.floor(Math.random() * 15) + 16;
        else growthScore = Math.floor(Math.random() * 10) + 5;
      }

      const opportunityScore = calculateOpportunityScore({
        last_upload_days,
        uploads_last_30_days,
        growth_score: growthScore,
        content_type,
        subscribers: subsCount,
        primary_niche
      });

      const style = editStyle === "All" ? ["Fast-cut", "Cinematic", "Text-heavy", "Minimalist"][Math.floor(Math.random() * 4)] : editStyle;
      const editingPainPoints = generatePainPoints(primary_niche, viewsToSubsRatio, style);
      
      const suggestedPitch = `Hey ${title}!\n\nI really enjoyed your recent video '${latestVideos[0]?.title || "your content"}'. I've been following your channel and absolutely love what you're doing.\n\nI noticed a small optimization that could boost retention by 15-20% in your first 30 seconds. I've put together a quick mockup edit of that section to show you what I mean.\n\nLet's chat about upgrading your future edits!\n\nBest,\n{MyName}`;

      // Fit Engine Signal 4: Fit Score Calculation
      const fit_score = calculateFitScore({
        subscribers: subsCount,
        video_count: videoCount,
        growth_score: growthScore,
        opportunity_score: 0,
        niche_confidence,
        region_score,
        uploads_last_30_days
      }, subscribers);

      rawCreatorsList.push({
        channel_id: channelId,
        channel_name: title,
        handle: handle,
        avatar: avatarUrl,
        thumbnail_url: avatarUrl,
        niche: primary_niche,
        subscribers: subsCount,
        average_views: avgViews,
        growth_score: growthScore,
        opportunity_score: opportunityScore,
        email: `contact@${handle.replace("@", "") || "channel"}.com`,
        velocity: computedVelocity,
        edit_style: style,
        video_count: videoCount,
        suggested_pitch: suggestedPitch,
        editing_pain_points: editingPainPoints,
        latest_videos: latestVideos,
        description: description.substring(0, 500),
        primary_niche,
        niche_confidence,
        content_type,
        region_score,
        fit_score,
        last_upload_days,
        uploads_last_30_days
      });
    } catch (e) {
      console.error(`Failed to collect stats for channel:`, e);
    }
  }

  // Deduplicate creators by channel_id only
  const deduplicated = Array.from(
    new Map(rawCreatorsList.map(c => [c.channel_id, c])).values()
  );

  // Divide into new creators (not previously discovered) and seen creators (discovered)
  const excludeSet = new Set(excludeChannelIds);
  const newCreators = deduplicated.filter(c => !excludeSet.has(c.channel_id));
  const seenCreators = deduplicated.filter(c => excludeSet.has(c.channel_id));

  // Prioritize new creators, fall back to seen creators if we have fewer than 4 new creators
  let finalCreators = [...newCreators];
  if (finalCreators.length < 4) {
    const remaining = 4 - finalCreators.length;
    finalCreators = [...finalCreators, ...seenCreators.slice(0, remaining)];
  }

  // Sort fit_score descending
  finalCreators.sort((a, b) => b.fit_score - a.fit_score);

  return finalCreators;
}
