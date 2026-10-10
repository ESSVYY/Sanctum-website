import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { Markdown } from "../../components/blog/markdown";
import { articleSchema } from "../../lib/blog/schema";
import { seedArticles } from "../../lib/blog/seed";
test("Markdown escapes raw HTML and rejects executable and protocol-relative links", () => {
  const html = renderToStaticMarkup(
    createElement(Markdown, {
      content:
        "<script>alert(1)</script>\n\n[x](javascript:alert) [x](//evil.test) [safe](https://example.com)\n\n**bold**",
    }),
  );
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(!html.includes('href="//'));
  assert.ok(html.includes('href="https://example.com"'));
  assert.ok(html.includes("<strong>bold</strong>"));
});
test("editorial seeds validate and unsafe cover references fail", () => {
  for (const article of seedArticles)
    assert.equal(articleSchema.safeParse(article).success, true);
  for (const cover_image of [
    "javascript:alert(1)",
    "//evil.test/image",
    "data:image/svg+xml,test",
  ])
    assert.equal(
      articleSchema.safeParse({ ...seedArticles[0], cover_image }).success,
      false,
    );
});
