import type { IngestStudyData } from '../entities/StudyContent'

export interface IContentRepository {
  upsertStudy(data: IngestStudyData): Promise<{ id: string; name: string }>
}
