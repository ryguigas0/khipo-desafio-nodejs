import { Tag } from "@prisma/client";

export interface TagOut {
  id: number;
  title: string;
}

export function tagView(tag: Tag): TagOut {
  return {
    id: tag.id,
    title: tag.title
  };
}
