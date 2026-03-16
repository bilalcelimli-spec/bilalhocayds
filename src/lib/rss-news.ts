type RssSource = {
  name: string;
  url: string;
  defaultCategory: string;
};

type RssNewsItem = {
  source: string;
  category: string;
  title: string;
  url: string;
  summary: string;
  publishedAt?: string;
};

const rssSources: RssSource[] = [
  {
    name: "BBC News",
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    defaultCategory: "general",
  },
  {
    name: "Reuters World",
    url: "https://www.reuters.com/world/rss",
    defaultCategory: "world",
  },
  {
    name: "The Guardian World",
    url: "https://www.theguardian.com/world/rss",
    defaultCategory: "world",
  },
];

function decodeXmlEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function stripHtml(text: string) {
  return decodeXmlEntities(text.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function getTag(block: string, tagName: string) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = block.match(regex);
  return match?.[1]?.trim() ?? "";
}

function getAtomLink(block: string) {
  const linkMatch = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
  return linkMatch?.[1] ?? "";
}

function parseRssItems(xml: string, source: RssSource) {
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  const entryBlocks = xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  const blocks = itemBlocks.length > 0 ? itemBlocks : entryBlocks;

  return blocks
    .map((block) => {
      const title = stripHtml(getTag(block, "title"));
      const rawLink = stripHtml(getTag(block, "link")) || getAtomLink(block);
      const description =
        getTag(block, "description") || getTag(block, "content:encoded") || getTag(block, "summary");
      const category = stripHtml(getTag(block, "category")) || source.defaultCategory;
      const pubDate = getTag(block, "pubDate") || getTag(block, "updated") || getTag(block, "published");

      return {
        source: source.name,
        category,
        title,
        url: rawLink,
        summary: stripHtml(description),
        publishedAt: pubDate || undefined,
      } satisfies RssNewsItem;
    })
    .filter((item) => item.title.length > 12 && item.url.startsWith("http"));
}

function hashWithSeed(value: string, seed: number) {
  let hash = seed || 1;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function scoreItemByInterests(item: RssNewsItem, interestTags: string[]) {
  if (interestTags.length === 0) {
    return 1;
  }

  const haystack = `${item.title} ${item.summary} ${item.category}`.toLowerCase();
  return interestTags.reduce((score, tag, index) => {
    const weight = index === 0 ? 8 : index === 1 ? 6 : 3;
    return haystack.includes(tag.toLowerCase()) ? score + weight : score;
  }, 1);
}

function uniqueByTitle(items: RssNewsItem[]) {
  const map = new Map<string, RssNewsItem>();
  for (const item of items) {
    const key = item.title.toLowerCase();
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  return [...map.values()];
}

export async function getDailyRssNews(options: {
  interestTags?: string[];
  seed: number;
  limit?: number;
}) {
  const { interestTags = [], seed, limit = 3 } = options;

  const feeds = await Promise.all(
    rssSources.map(async (source) => {
      try {
        const response = await fetch(source.url, { cache: "no-store" });
        if (!response.ok) {
          return [] as RssNewsItem[];
        }

        const xml = await response.text();
        return parseRssItems(xml, source);
      } catch {
        return [] as RssNewsItem[];
      }
    })
  );

  const allItems = uniqueByTitle(feeds.flat());

  const ranked = allItems
    .map((item) => ({
      item,
      score: scoreItemByInterests(item, interestTags),
      tie: hashWithSeed(item.title, seed),
    }))
    .sort((a, b) => b.score - a.score || a.tie - b.tie)
    .slice(0, Math.max(limit * 3, 12))
    .sort((a, b) => a.tie - b.tie)
    .slice(0, limit)
    .map((entry) => entry.item);

  return ranked;
}

export type { RssNewsItem };
