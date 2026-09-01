import type { Article } from "@/lib/types";
import { cn } from "@/lib/utils";

const ARTICLE_CLASSES: Record<Article, string> = {
  der: "text-article-der",
  die: "text-article-die",
  das: "text-article-das",
};

export function ArticleBadge({ article, className }: { article: Article | null; className?: string }) {
  if (!article) return null;
  return (
    <span className={cn("font-medium", ARTICLE_CLASSES[article], className)}>{article}</span>
  );
}
