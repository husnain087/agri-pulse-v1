import { describe, expect, it } from "vitest";
import { getRouter } from "@/router";
import { sitemapStaticPaths, sitemapXML } from "@/lib/sitemap";

describe("Public sitemap", () => {
  it("includes public pages and excludes accounts and private dashboards", () => {
    expect(sitemapStaticPaths(getRouter())).toEqual(["/", "/plant-growth-risk"]);
  });

  it("uses the published origin without fabricated modification dates", () => {
    const xml = sitemapXML("https://soil-soother-suite.lovable.app", [{ path: "/" }, { path: "/plant-growth-risk" }]);
    expect(xml).toContain("<loc>https://soil-soother-suite.lovable.app/plant-growth-risk</loc>");
    expect(xml).not.toContain("<lastmod>");
    expect(xml).not.toContain("id-preview");
  });
});