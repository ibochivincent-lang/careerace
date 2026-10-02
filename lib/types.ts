// =============================================================================
// Career Ace — Core Type Definitions
// =============================================================================

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'guessing'

export type ErrorType =
  | 'conceptual_misconception'
  | 'procedural_error'
  | 'unit_confusion'
  | 'sign_error'
  | 'formula_misapplication'
  | 'distractor_susceptibility'
  | 'language_barrier'
  | 'recall_gap'

export type InputModality = 'text' | 'voice' | 'voice_with_camera'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  confidenceLevel?: ConfidenceLevel
  hedgeWords?: string[]
}

export interface Session {
  id: string
  subject?: string
  startTime: string
  endTime?: string
  messages: Message[]
  currentQuestion?: string
  questionsAttempted: number
}
