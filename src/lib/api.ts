import { site, type PortfolioItem, type Service, type SiteContent } from "@/content/site";
import { supabase } from "@/lib/supabase";

export type SiteSettingsRow = {
  id: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_description: string | null;
  hero_image: string | null;
};

export type PortfolioRow = {
  id: string;
  title: string;
  category: string;
  image_url: string;
  is_published: boolean;
};

export type ServiceRow = {
  id: string;
  title: string;
  description: string;
};

export type AboutRow = {
  id: string;
  content: string | null;
  image_url: string | null;
};

export type PortfolioInsert = Omit<PortfolioRow, "id">;
export type PortfolioUpdate = Partial<PortfolioInsert>;
export type ServiceInsert = Omit<ServiceRow, "id">;
export type ServiceUpdate = Partial<ServiceInsert>;

const DEFAULT_STORAGE_BUCKET = "site-assets";

const splitAboutParagraphs = (content: string | null | undefined) =>
  (content ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const resolveStorageUrl = (value: string | null | undefined, fallback: string) => {
  if (!value) {
    return fallback;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (!supabase) {
    return fallback;
  }

  let bucket = DEFAULT_STORAGE_BUCKET;
  let path = value;

  if (value.startsWith("storage:")) {
    const storagePath = value.slice("storage:".length);
    const firstSlash = storagePath.indexOf("/");

    if (firstSlash > 0) {
      bucket = storagePath.slice(0, firstSlash);
      path = storagePath.slice(firstSlash + 1);
    } else {
      path = storagePath;
    }
  } else {
    const firstSlash = value.indexOf("/");

    if (firstSlash > 0) {
      bucket = value.slice(0, firstSlash);
      path = value.slice(firstSlash + 1);
    }
  }

  if (!path) {
    return fallback;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl || fallback;
};

const mapPortfolioItem = (row: PortfolioRow, index: number): PortfolioItem => ({
  id: row.id,
  title: row.title,
  category: row.category,
  src: resolveStorageUrl(row.image_url, site.portfolio.items[index]?.src ?? site.hero.image),
  aspect: index % 3 === 2 ? "landscape" : "portrait",
});

const mergeSiteContent = (
  siteSettings: SiteSettingsRow | null,
  portfolio: PortfolioRow[],
  services: ServiceRow[],
  about: AboutRow | null,
): SiteContent => {
  const aboutParagraphs = splitAboutParagraphs(about?.content);

  return {
    ...site,
    hero: {
      ...site.hero,
      title: siteSettings?.hero_title || site.hero.title,
      subtitle: siteSettings?.hero_subtitle || site.hero.subtitle,
      description: siteSettings?.hero_description || site.hero.description,
      image: resolveStorageUrl(siteSettings?.hero_image, site.hero.image),
    },
    portfolio: {
      ...site.portfolio,
      items: portfolio.length > 0 ? portfolio.map(mapPortfolioItem) : site.portfolio.items,
    },
    services: {
      ...site.services,
      items:
        services.length > 0
          ? services.map((service) => ({
              id: service.id,
              title: service.title,
              description: service.description,
            }))
          : site.services.items,
    },
    about: {
      ...site.about,
      paragraphs: aboutParagraphs.length > 0 ? aboutParagraphs : site.about.paragraphs,
      image: resolveStorageUrl(about?.image_url, site.about.image),
    },
  };
};

export async function getSiteSettings() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("id, hero_title, hero_subtitle, hero_description, hero_image")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch site settings", error);
    return null;
  }

  return data satisfies SiteSettingsRow | null;
}

export async function getPortfolio() {
  if (!supabase) {
    return [] as PortfolioRow[];
  }

  const { data, error } = await supabase
    .from("portfolio")
    .select("id, title, category, image_url, is_published")
    .eq("is_published", true)
    .order("title", { ascending: true });

  if (error) {
    console.error("Failed to fetch portfolio", error);
    return [];
  }

  return (data ?? []) satisfies PortfolioRow[];
}

export async function getServices() {
  if (!supabase) {
    return [] as ServiceRow[];
  }

  const { data, error } = await supabase
    .from("services")
    .select("id, title, description")
    .order("title", { ascending: true });

  if (error) {
    console.error("Failed to fetch services", error);
    return [];
  }

  return (data ?? []) satisfies ServiceRow[];
}

export async function getAbout() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("about")
    .select("id, content, image_url")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch about content", error);
    return null;
  }

  return data satisfies AboutRow | null;
}

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const [siteSettings, portfolio, services, about] = await Promise.all([
      getSiteSettings(),
      getPortfolio(),
      getServices(),
      getAbout(),
    ]);

    return mergeSiteContent(siteSettings, portfolio, services, about);
  } catch (error) {
    console.error("Failed to build site content", error);
    return site;
  }
}

export async function createPortfolio(input: PortfolioInsert) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("portfolio")
    .insert(input)
    .select("id, title, category, image_url, is_published")
    .single();

  if (error) {
    throw error;
  }

  return data satisfies PortfolioRow;
}

export async function updatePortfolio(id: string, input: PortfolioUpdate) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("portfolio")
    .update(input)
    .eq("id", id)
    .select("id, title, category, image_url, is_published")
    .single();

  if (error) {
    throw error;
  }

  return data satisfies PortfolioRow;
}

export async function deletePortfolio(id: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.from("portfolio").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

export async function createService(input: ServiceInsert) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("services")
    .insert(input)
    .select("id, title, description")
    .single();

  if (error) {
    throw error;
  }

  return data satisfies ServiceRow;
}

export async function updateService(id: string, input: ServiceUpdate) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("services")
    .update(input)
    .eq("id", id)
    .select("id, title, description")
    .single();

  if (error) {
    throw error;
  }

  return data satisfies ServiceRow;
}

export async function deleteService(id: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.from("services").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
