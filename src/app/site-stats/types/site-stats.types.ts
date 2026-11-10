/** `GET /stats/visits`. "Today" is the Manila calendar day. */
export interface VisitSummary {
  totalPageviews: number
  todayPageviews: number
  todayVisitors: number
  /** The first Manila day with a counted hit (`YYYY-MM-DD`), or `null` before the first one. */
  since: string | null
}
