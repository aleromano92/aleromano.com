export { getDatabase, closeDatabase } from './connection';
export { type CacheManager, cacheManager, type CacheDTO } from './cache';
export { 
  analyticsManager, 
  generateVisitorHash,
  type VisitRecord,
  type EventRecord,
  type DailyStats,
  type TopPage,
  type TopReferer,
  type CountryStats,
  type EventTypeBreakdown
} from './analytics';
