// =============================================================================
// ExamAce — Simulated Socratic Engine (Demo Implementation)
// =============================================================================

import type { Message, CognitiveMap, ConfidenceLevel } from './types'
import { SOCRATIC_RESPONSES } from './mock_data'

function getRandomResponse(category: keyof typeof SOCRATIC_RESPONSES): string {
  const responses = SOCRATIC_RESPONSES[category]
  return responses[Math.floor(Math.random() * responses.length)]
}

function detectHedgeWords(text: string): string[] {
  const hedgePatterns = [
    'i think', 'maybe', 'perhaps', 'probably', 'might be', 'could be',
    'i guess', 'sort of', 'kind of', "i'm not sure", 'i believe',
    'possibly', 'i suppose', 'abi', 'or how', 'something like',
    'i think say', 'e suppose be', 'maybe na', 'i no too sure'
  ]

  const lowerText = text.toLowerCase()
  return hedgePatterns.filter(pattern => lowerText.includes(pattern))
}

function determineConfidenceLevel(text: string, hedgeWords: string[]): ConfidenceLevel {
  if (text.length < 20) return 'guessing'
  if (hedgeWords.length >= 3) return 'low'
  if (hedgeWords.length >= 1) return 'medium'
  return 'high'
}

export function generateSocraticResponse(
  userMessage: string,
  messageHistory: Message[],
  cognitiveMap: CognitiveMap,
  currentTopic?: string
): { content: string; responseType: string } {
  void cognitiveMap
  void currentTopic

  const hedgeWords = detectHedgeWords(userMessage)
  const confidence = determineConfidenceLevel(userMessage, hedgeWords)

  if (messageHistory.length === 0) {
    return {
      content: getRandomResponse('initial'),
      responseType: 'initial_probe'
    }
  }

  if (confidence === 'low' || confidence === 'guessing') {
    return {
      content: getRandomResponse('hedge_response'),
      responseType: 'confidence_building'
    }
  }

  if (confidence === 'high' && messageHistory.length > 2) {
    if (Math.random() > 0.6) {
      return {
        content: getRandomResponse('transfer_question'),
        responseType: 'transfer'
      }
    }
    return {
      content: getRandomResponse('confidence_challenge'),
      responseType: 'challenge'
    }
  }

  if (/\d+|formula|equation|calculate/i.test(userMessage)) {
    return {
      content: getRandomResponse('procedural_probe'),
      responseType: 'procedural'
    }
  }

  if (/option [a-d]|choice [a-d]|answer [a-d]/i.test(userMessage)) {
    return {
      content: getRandomResponse('distractor_analysis'),
      responseType: 'distractor'
    }
  }

  return {
    content: getRandomResponse('conceptual_probe'),
    responseType: 'conceptual'
  }
}

export function analyzeUserResponse(message: string) {
  const hedgeWords = detectHedgeWords(message)
  const confidence = determineConfidenceLevel(message, hedgeWords)

  return {
    hedgeWords,
    confidenceLevel: confidence
  }
}
