// =============================================================================
// ExamAce — Type Definitions
// =============================================================================

export type Subject = 'biology' | 'chemistry' | 'physics' | 'mathematics' | 'english' | 'economics'

export type ErrorType =
  | 'conceptual_misconception'
  | 'procedural_error'
  | 'unit_confusion'
  | 'sign_error'
  | 'formula_misapplication'
  | 'distractor_susceptibility'
  | 'language_barrier'
  | 'recall_gap'

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'guessing'

export type ExamTarget = 'JAMB' | 'WAEC' | 'NECO' | 'POST_UTME'

export type InputModality = 'text' | 'voice' | 'voice_with_camera'

export interface TopicRecord {
  topic: string
  subject: Subject
  errorTypes: ErrorType[]
  confidenceScore: number
  lastSeenAt: string
  nextReviewAt: string
  attemptCount: number
  correctCount: number
  hedgeWordRate: number
}

export interface CognitiveMap {
  studentId: string
  updatedAt: string
  priorityTopics: string[]
  topicRecords: Record<string, TopicRecord>
  overallConfidenceCalibration: number
  dominantErrorType: ErrorType | null
  sessionCount: number
  lastExamTarget: ExamTarget
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  confidenceLevel?: ConfidenceLevel
  hedgeWords?: string[]
}

export interface Session {
  id: string
  subject: Subject
  startTime: string
  endTime?: string
  messages: Message[]
  currentQuestion?: string
  questionsAttempted: number
}

export interface TaxonomyEntry {
  questionId: string
  subject: Subject
  topic: string
  trapOption: string
  targetedMisconception: string
  yearFrequency: number
  distractorLogic: string
}
