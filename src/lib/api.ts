import { site, type PortfolioItem, type Service, type SiteContent } from "@/content/site";
import { supabase } from "@/lib/supabase";

export type SiteSettingsRow = {
  id: string;
  user_id: string;
  site_name: string | null;
  site_tagline: string | null;
  general_info: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_description: string | null;
  hero_image: string | null;
};

export type PortfolioRow = {
  id: string;
  user_id: string;
  position: number;
  title: string;
  category: string;
  detailed_description: string | null;
  gallery: string[];
  image_url: string;
  is_published: boolean;
};

export type ServiceRow = {
  id: string;
  user_id: string;
  position: number;
  title: string;
  description: string;
};

export type AboutRow = {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
};

export type PortfolioInsert = Omit<PortfolioRow, "id" | "user_id">;
export type PortfolioUpdate = Partial<PortfolioInsert>;
export type ServiceInsert = Omit<ServiceRow, "id" | "user_id">;
export type ServiceUpdate = Partial<ServiceInsert>;
export type SiteSettingsUpdate = Omit<SiteSettingsRow, "id" | "user_id">;
export type AboutUpdate = Omit<AboutRow, "id" | "user_id">;

export type PortfolioProject = {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  imageSrc: string;
  isPublished: boolean;
  description: string;
  gallery: string[];
};

export type MediaAsset = {
  name: string;
  path: string;
  publicUrl: string;
  createdAt: string | null;
};

const DEFAULT_STORAGE_BUCKET = "site-assets";
const DEFAULT_IMAGE_FALLBACK = "/placeholder.jpg";

function isMissingColumnError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; message?: string; details?: string; hint?: string };
  const text = `${candidate.message ?? ""} ${candidate.details ?? ""} ${candidate.hint ?? ""}`.toLowerCase();
  return candidate.code === "42703" || text.includes("column") || text.includes("position") || text.includes("site_name") || text.includes("site_tagline") || text.includes("general_info") || text.includes("detailed_description") || text.includes("gallery");
}

function normalizeSiteSettingsRow(
  row:
    | {
        id: string;
        user_id: string;
        site_name?: string | null;
        site_tagline?: string | null;
        general_info?: string | null;
        hero_title?: string | null;
        hero_subtitle?: string | null;
        hero_description?: string | null;
        hero_image?: string | null;
      }
    | null,
) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    site_name: row.site_name ?? null,
    site_tagline: row.site_tagline ?? null,
    general_info: row.general_info ?? null,
    hero_title: row.hero_title ?? null,
    hero_subtitle: row.hero_subtitle ?? null,
    hero_description: row.hero_description ?? null,
    hero_image: row.hero_image ?? null,
  } satisfies SiteSettingsRow;
}

function normalizePortfolioRows(
  rows: Array<
    {
      id: string;
      user_id: string;
      position?: number | null;
      title: string;
      category: string;
      detailed_description?: string | null;
      gallery?: unknown;
      image_url: string;
      is_published: boolean;
    }
  >,
) {
  return rows.map((item, index) => ({
    id: item.id,
    user_id: item.user_id,
    position: typeof item.position === "number" ? item.position : index,
    title: item.title,
    category: item.category,
    detailed_description: item.detailed_description ?? null,
    gallery: Array.isArray(item.gallery) ? item.gallery.filter((value): value is string => typeof value === "string") : [],
    image_url: item.image_url,
    is_published: item.is_published,
  })) satisfies PortfolioRow[];
}

function normalizeServiceRows(
  rows: Array<
    {
      id: string;
      user_id: string;
      position?: number | null;
      title: string;
      description: string;
    }
  >,
) {
  return rows.map((item, index) => ({
    id: item.id,
    user_id: item.user_id,
    position: typeof item.position === "number" ? item.position : index,
    title: item.title,
    description: item.description,
  })) satisfies ServiceRow[];
}

async function getNextPosition(table: "portfolio" | "services") {
  if (!supabase) {
    return 0;
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return 0;
  }

  const { data, error } = await supabase
    .from(table)
    .select("position")
    .eq("user_id", userId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingColumnError(error)) {
      return 0;
    }

    console.error(`Failed to resolve next position for ${table}`, error);
    return 0;
  }

  return (data?.position ?? -1) + 1;
}

const splitAboutParagraphs = (content: string | null | undefined) =>
  (content ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

async function getAuthenticatedUser() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Failed to resolve authenticated user", error);
    return null;
  }

  return data.user ?? null;
}

async function getAuthenticatedUserId() {
  const user = await getAuthenticatedUser();
  return user?.id ?? null;
}

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

export function getAssetPreviewUrl(value: string | null | undefined, fallback = DEFAULT_IMAGE_FALLBACK) {
  return resolveStorageUrl(value, fallback);
}

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
    brand: {
      ...site.brand,
      name: siteSettings?.site_name || site.brand.name,
      tagline: siteSettings?.site_tagline || site.brand.tagline,
    },
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
    contact: {
      ...site.contact,
      description: siteSettings?.general_info || site.contact.description,
    },
  };
};

export async function uploadUserAsset(file: File) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("You must be logged in to upload files.");
  }

  const safeFileName = file.name.replace(/\s+/g, "-");
  const filePath = `${user.id}/${Date.now()}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(DEFAULT_STORAGE_BUCKET)
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(DEFAULT_STORAGE_BUCKET).getPublicUrl(filePath);
  const publicUrl = data.publicUrl;
  const previewUrl = `${publicUrl}?t=${Date.now()}`;

  return {
    filePath,
    publicUrl,
    previewUrl,
  };
}

export async function listUserAssets() {
  if (!supabase) {
    return [] as MediaAsset[];
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return [] as MediaAsset[];
  }

  const { data, error } = await supabase.storage.from(DEFAULT_STORAGE_BUCKET).list(userId, {
    limit: 100,
    offset: 0,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    console.error("Failed to list media assets", error);
    return [];
  }

  return (data ?? [])
    .filter((item) => item.name)
    .map((item) => {
      const path = `${userId}/${item.name}`;
      const { data: publicData } = supabase.storage.from(DEFAULT_STORAGE_BUCKET).getPublicUrl(path);

      return {
        name: item.name,
        path,
        publicUrl: publicData.publicUrl,
        createdAt: item.created_at ?? null,
      } satisfies MediaAsset;
    });
}

export async function getSiteSettings() {
  if (!supabase) {
    return null;
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("id, user_id, site_name, site_tagline, general_info, hero_title, hero_subtitle, hero_description, hero_image")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (!isMissingColumnError(error)) {
      console.error("Failed to fetch site settings", error);
      return null;
    }

    const fallback = await supabase
      .from("site_settings")
      .select("id, user_id, hero_title, hero_subtitle, hero_description, hero_image")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (fallback.error) {
      console.error("Failed to fetch site settings", fallback.error);
      return null;
    }

    return normalizeSiteSettingsRow(fallback.data);
  }

  return normalizeSiteSettingsRow(data);
}

export async function getPortfolio() {
  if (!supabase) {
    return [] as PortfolioRow[];
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return [] as PortfolioRow[];
  }

  const { data, error } = await supabase
    .from("portfolio")
    .select("id, user_id, position, title, category, detailed_description, gallery, image_url, is_published")
    .eq("user_id", userId)
    .eq("is_published", true)
    .order("position", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    if (!isMissingColumnError(error)) {
      console.error("Failed to fetch portfolio", error);
      return [];
    }

    const fallback = await supabase
      .from("portfolio")
      .select("id, user_id, title, category, image_url, is_published")
      .eq("user_id", userId)
      .eq("is_published", true)
      .order("title", { ascending: true });

    if (fallback.error) {
      console.error("Failed to fetch portfolio", fallback.error);
      return [];
    }

    return normalizePortfolioRows(fallback.data ?? []);
  }

  return normalizePortfolioRows(data ?? []);
}

export async function getPortfolioProjectById(id: string) {
  if (!supabase) {
    return null;
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("portfolio")
    .select("id, user_id, position, title, category, detailed_description, gallery, image_url, is_published")
    .eq("id", id)
    .eq("user_id", userId)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    if (!isMissingColumnError(error)) {
      console.error("Failed to fetch project details", error);
      return null;
    }

    const fallback = await supabase
      .from("portfolio")
      .select("id, user_id, title, category, image_url, is_published")
      .eq("id", id)
      .eq("user_id", userId)
      .eq("is_published", true)
      .maybeSingle();

    if (fallback.error) {
      console.error("Failed to fetch project details", fallback.error);
      return null;
    }

    if (!fallback.data) {
      return null;
    }

    const normalized = normalizePortfolioRows([fallback.data])[0];
    const fallbackImage = site.portfolio.items.find((item) => item.id === id)?.src ?? site.hero.image;
    const imageSrc = resolveStorageUrl(normalized.image_url, fallbackImage);

    return {
      id: normalized.id,
      title: normalized.title,
      category: normalized.category,
      imageUrl: normalized.image_url,
      imageSrc,
      isPublished: normalized.is_published,
      description: `Projeto ${normalized.title} na categoria ${normalized.category}. Esta pagina reune a direcao visual, a imagem principal e referencias do trabalho para quem deseja um resultado com a mesma linguagem.`,
      gallery: normalized.image_url ? [imageSrc] : [],
    } satisfies PortfolioProject;
  }

  if (!data) {
    return null;
  }

  const fallbackImage = site.portfolio.items.find((item) => item.id === id)?.src ?? site.hero.image;
  const imageSrc = resolveStorageUrl(data.image_url, fallbackImage);
  const gallery = Array.isArray(data.gallery) ? data.gallery.map((image) => resolveStorageUrl(image, imageSrc)) : [];

  return {
    id: data.id,
    title: data.title,
    category: data.category,
    imageUrl: data.image_url,
    imageSrc,
    isPublished: data.is_published,
    description:
      data.detailed_description?.trim() ||
      `Projeto ${data.title} na categoria ${data.category}. Esta pagina reune a direcao visual, a imagem principal e referencias do trabalho para quem deseja um resultado com a mesma linguagem.`,
    gallery: gallery.length > 0 ? gallery : data.image_url ? [imageSrc] : [],
  } satisfies PortfolioProject;
}

export async function getAdminPortfolio() {
  if (!supabase) {
    return [] as PortfolioRow[];
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return [] as PortfolioRow[];
  }

  const { data, error } = await supabase
    .from("portfolio")
    .select("id, user_id, position, title, category, detailed_description, gallery, image_url, is_published")
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    if (!isMissingColumnError(error)) {
      console.error("Failed to fetch admin portfolio", error);
      return [];
    }

    const fallback = await supabase
      .from("portfolio")
      .select("id, user_id, title, category, image_url, is_published")
      .eq("user_id", userId)
      .order("title", { ascending: true });

    if (fallback.error) {
      console.error("Failed to fetch admin portfolio", fallback.error);
      return [];
    }

    return normalizePortfolioRows(fallback.data ?? []);
  }

  return normalizePortfolioRows(data ?? []);
}

export async function getServices() {
  if (!supabase) {
    return [] as ServiceRow[];
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return [] as ServiceRow[];
  }

  const { data, error } = await supabase
    .from("services")
    .select("id, user_id, position, title, description")
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    if (!isMissingColumnError(error)) {
      console.error("Failed to fetch services", error);
      return [];
    }

    const fallback = await supabase
      .from("services")
      .select("id, user_id, title, description")
      .eq("user_id", userId)
      .order("title", { ascending: true });

    if (fallback.error) {
      console.error("Failed to fetch services", fallback.error);
      return [];
    }

    return normalizeServiceRows(fallback.data ?? []);
  }

  return normalizeServiceRows(data ?? []);
}

export async function getAdminServices() {
  return getServices();
}

export async function getAbout() {
  if (!supabase) {
    return null;
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("about")
    .select("id, user_id, content, image_url")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch about content", error);
    return null;
  }

  return data satisfies AboutRow | null;
}

export async function upsertSiteSettings(input: SiteSettingsUpdate, id?: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    throw new Error("You must be logged in to save site settings.");
  }

  const payload = id ? { id, user_id: userId, ...input } : { user_id: userId, ...input };

  const { data, error } = await supabase
    .from("site_settings")
    .upsert(payload, { onConflict: "user_id" })
    .select("id, user_id, site_name, site_tagline, general_info, hero_title, hero_subtitle, hero_description, hero_image")
    .single();

  if (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    const legacyPayload = {
      id,
      user_id: userId,
      hero_title: input.hero_title,
      hero_subtitle: input.hero_subtitle,
      hero_description: input.hero_description,
      hero_image: input.hero_image,
    };

    const fallback = await supabase
      .from("site_settings")
      .upsert(legacyPayload, { onConflict: "user_id" })
      .select("id, user_id, hero_title, hero_subtitle, hero_description, hero_image")
      .single();

    if (fallback.error) {
      throw fallback.error;
    }

    return normalizeSiteSettingsRow(fallback.data) as SiteSettingsRow;
  }

  return normalizeSiteSettingsRow(data) as SiteSettingsRow;
}

export async function upsertAbout(input: AboutUpdate, id?: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    throw new Error("You must be logged in to save about content.");
  }

  const payload = id ? { id, user_id: userId, ...input } : { user_id: userId, ...input };

  const { data, error } = await supabase
    .from("about")
    .upsert(payload, { onConflict: "user_id" })
    .select("id, user_id, content, image_url")
    .single();

  if (error) {
    throw error;
  }

  return data satisfies AboutRow;
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

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    throw new Error("You must be logged in to create portfolio items.");
  }

  const payload = {
    ...input,
    user_id: userId,
    position: input.position ?? (await getNextPosition("portfolio")),
    gallery: input.gallery ?? [],
  };

  const { data, error } = await supabase
    .from("portfolio")
    .insert(payload)
    .select("id, user_id, position, title, category, detailed_description, gallery, image_url, is_published")
    .single();

  if (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    const fallback = await supabase
      .from("portfolio")
      .insert({
        title: input.title,
        category: input.category,
        image_url: input.image_url,
        is_published: input.is_published,
        user_id: userId,
      })
      .select("id, user_id, title, category, image_url, is_published")
      .single();

    if (fallback.error) {
      throw fallback.error;
    }

    return normalizePortfolioRows([fallback.data])[0];
  }

  return normalizePortfolioRows([data])[0];
}

export async function updatePortfolio(id: string, input: PortfolioUpdate) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    throw new Error("You must be logged in to update portfolio items.");
  }

  const payload = {
    ...input,
    user_id: userId,
  };

  const { data, error } = await supabase
    .from("portfolio")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, user_id, position, title, category, detailed_description, gallery, image_url, is_published")
    .single();

  if (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    const fallback = await supabase
      .from("portfolio")
      .update({
        title: input.title,
        category: input.category,
        image_url: input.image_url,
        is_published: input.is_published,
        user_id: userId,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select("id, user_id, title, category, image_url, is_published")
      .single();

    if (fallback.error) {
      throw fallback.error;
    }

    return normalizePortfolioRows([fallback.data])[0];
  }

  return normalizePortfolioRows([data])[0];
}

export async function deletePortfolio(id: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    throw new Error("You must be logged in to delete portfolio items.");
  }

  const { error } = await supabase.from("portfolio").delete().eq("id", id).eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function createService(input: ServiceInsert) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    throw new Error("You must be logged in to create services.");
  }

  const position = input.position ?? (await getNextPosition("services"));

  const { data, error } = await supabase
    .from("services")
    .insert({
      ...input,
      position,
      user_id: userId,
    })
    .select("id, user_id, position, title, description")
    .single();

  if (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    const fallback = await supabase
      .from("services")
      .insert({
        title: input.title,
        description: input.description,
        user_id: userId,
      })
      .select("id, user_id, title, description")
      .single();

    if (fallback.error) {
      throw fallback.error;
    }

    return normalizeServiceRows([fallback.data])[0];
  }

  return normalizeServiceRows([data])[0];
}

export async function updateService(id: string, input: ServiceUpdate) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    throw new Error("You must be logged in to update services.");
  }

  const { data, error } = await supabase
    .from("services")
    .update({
      ...input,
      user_id: userId,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, user_id, position, title, description")
    .single();

  if (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    const fallback = await supabase
      .from("services")
      .update({
        title: input.title,
        description: input.description,
        user_id: userId,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select("id, user_id, title, description")
      .single();

    if (fallback.error) {
      throw fallback.error;
    }

    return normalizeServiceRows([fallback.data])[0];
  }

  return normalizeServiceRows([data])[0];
}

export async function deleteService(id: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    throw new Error("You must be logged in to delete services.");
  }

  const { error } = await supabase.from("services").delete().eq("id", id).eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function reorderServices(items: Array<Pick<ServiceRow, "id" | "position">>) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    throw new Error("You must be logged in to reorder services.");
  }

  const updates = items.map((item) =>
    supabase.from("services").update({ position: item.position }).eq("id", item.id).eq("user_id", userId),
  );

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);

  if (failed?.error) {
    if (isMissingColumnError(failed.error)) {
      return;
    }

    throw failed.error;
  }
}

export async function reorderPortfolio(items: Array<Pick<PortfolioRow, "id" | "position">>) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    throw new Error("You must be logged in to reorder projects.");
  }

  const updates = items.map((item) =>
    supabase.from("portfolio").update({ position: item.position }).eq("id", item.id).eq("user_id", userId),
  );

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);

  if (failed?.error) {
    if (isMissingColumnError(failed.error)) {
      return;
    }

    throw failed.error;
  }
}
