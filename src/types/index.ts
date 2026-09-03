// 全项目共享类型。算法层是纯函数，不依赖 Prisma，只依赖这里的纯数据结构。

export type SocialMode = "solo" | "buddy";

export type Category =
  | "一人食"
  | "脱口秀"
  | "书店"
  | "桌游"
  | "羽毛球"
  | "徒步"
  | "探店"
  | "看展";

/** 一个候选活动（算法层的输入/输出统一用这个结构，与 Prisma Activity 解耦） */
export interface Activity {
  id: string;
  name: string;
  category: string;
  tags: string[];
  lat: number;
  lng: number;
  address: string;
  costMin: number; // 元
  costMax: number;
  durationMin: number; // 分钟
  openTime: string; // "18:00"
  closeTime: string; // "23:00"
  rating: number; // 0-5
  indoor: boolean;
  alcoholFree: boolean;
  socialScore: number; // 0-100，越高越适合找搭子
  description?: string | null;
  imageUrl?: string | null;
}

export interface LatLng {
  lat: number;
  lng: number;
}

/** 用户输入快照（规划请求） */
export interface PlanQuery {
  location: LatLng | { address: string };
  timeWindow: { start: string; end: string }; // "18:00" / "22:30"
  budget: number; // 元
  indoor: boolean | null; // null = 无所谓
  noAlcohol: boolean; // 不喝酒
  social: SocialMode;
  interests: string[]; // 兴趣标签
}

/** 行程中的一项 */
export interface ItineraryItem {
  activity: Activity;
  order: number;
  startTime: string; // "18:30"
  endTime: string; // "20:00"
  travelMinutes: number; // 从上一个点到达这里的移动耗时（首个为 0）
  cost: number; // 预估花费（取区间中值）
}

/** 最终行程 */
export interface Itinerary {
  mode: SocialMode;
  items: ItineraryItem[];
  totalCost: number;
  totalDurationMin: number; // 含移动
  origin: LatLng;
  mapPoints: { name: string; lat: number; lng: number; order: number }[];
}

/** 对外暴露的用户（不含密码哈希等敏感字段） */
export interface PublicUser {
  id: string;
  phone: string;
  nickname: string | null;
}

/** 「我的收藏」列表项：活动 + 打卡次数 + 上次打卡时间 */
export interface FavoriteEntry {
  activity: Activity;
  checkInCount: number;
  lastCheckInAt: string | null;
}

/** 「我的历史行程」中一项 */
export interface HistoryPlanItem {
  activity: Activity;
  order: number;
  startTime: string;
  endTime: string;
  travelMinutes: number;
}

/** 「我的历史行程」列表项：一次已保存的规划 */
export interface HistoryEntry {
  id: string;
  createdAt: string;
  mode: SocialMode;
  startTime: string;
  endTime: string;
  budget: number;
  locationLabel: string;
  items: HistoryPlanItem[];
  totalCost: number;
}
