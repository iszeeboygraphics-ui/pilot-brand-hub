import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://pilot-brand-hub.lovable.app";
const SITE_NAME = "Pilot Brand Hub";
const TWITTER_HANDLE = "@ogunsola_israel";

interface PageSeoProps {
  title: string;
  description: string;
  /** Path to OG image relative to /public, e.g. "/og/og-home.jpg" */
  image: string;
  /** Optional override of canonical path. Defaults to current pathname. */
  pathname?: string;
  type?: "website" | "article";
}

function upsertMeta(
  attr: "name" | "property",
  key: string,
  content: string,
) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function PageSeo({
  title,
  description,
  image,
  pathname,
  type = "website",
}: PageSeoProps) {
  const location = useLocation();

  useEffect(() => {
    const path = pathname ?? location.pathname;
    const url = `${SITE_URL}${path}`;
    const absImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;

    document.title = title;

    upsertMeta("name", "description", description);
    upsertCanonical(url);

    // Open Graph
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:image", absImage);
    upsertMeta("property", "og:image:width", "1200");
    upsertMeta("property", "og:image:height", "630");
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:locale", "en_US");

    // Twitter
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:site", TWITTER_HANDLE);
    upsertMeta("name", "twitter:creator", TWITTER_HANDLE);
    upsertMeta("name", "twitter:url", url);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", absImage);
  }, [title, description, image, pathname, type, location.pathname]);

  return null;
}

export default PageSeo;
