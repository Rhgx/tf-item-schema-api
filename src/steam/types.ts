export interface SteamPlayerSummary {
  steamid: string;
  personaname: string | null;
  profileurl: string | null;
  avatar: string | null;
  avatarmedium: string | null;
  avatarfull: string | null;
  communityvisibilitystate: number | null;
  profilestate: number | null;
  realname: string | null;
  loccountrycode: string | null;
  timecreated: number | null;
}

export interface SteamSchemaItemsPage {
  status: number;
  items: Record<string, unknown>[];
  next: number | null;
}
