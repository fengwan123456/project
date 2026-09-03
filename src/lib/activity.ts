import type { Activity } from "@/types";

/** 把 Prisma 的 Activity 行（tags 为逗号分隔字符串）映射为算法层 Activity 结构 */
export function rowToActivity(row: {
  id: string;
  name: string;
  category: string;
  tags: string;
  lat: number;
  lng: number;
  address: string;
  costMin: number;
  costMax: number;
  durationMin: number;
  openTime: string;
  closeTime: string;
  rating: number;
  indoor: boolean;
  alcoholFree: boolean;
  socialScore: number;
  description: string | null;
  imageUrl: string | null;
}): Activity {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
    lat: row.lat,
    lng: row.lng,
    address: row.address,
    costMin: row.costMin,
    costMax: row.costMax,
    durationMin: row.durationMin,
    openTime: row.openTime,
    closeTime: row.closeTime,
    rating: row.rating,
    indoor: row.indoor,
    alcoholFree: row.alcoholFree,
    socialScore: row.socialScore,
    description: row.description,
    imageUrl: row.imageUrl,
  };
}
