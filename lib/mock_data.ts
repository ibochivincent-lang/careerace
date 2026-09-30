// =============================================================================
// ExamAce — Mock Data for Demo
// =============================================================================

import type { CognitiveMap, Subject } from './types'

export const INITIAL_COGNITIVE_MAP: CognitiveMap = {
  studentId: 'demo-student-001',
  updatedAt: new Date().toISOString(),
  priorityTopics: [
    'Photosynthesis',
    'Electrochemistry',
    'Quadratic Equations',
    'Organic Chemistry',
    "Newton's Laws"
  ],
  topicRecords: {
    'Photosynthesis': {
      topic: 'Photosynthesis',
      subject: 'biology',
      errorTypes: ['conceptual_misconception'],
      confidenceScore: 0.45,
      lastSeenAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      nextReviewAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      attemptCount: 5,
      correctCount: 2,
      hedgeWordRate: 0.6
    },
    'Electrochemistry': {
      topic: 'Electrochemistry',
      subject: 'chemistry',
      errorTypes: ['unit_confusion', 'procedural_error'],
      confidenceScore: 0.55,
      lastSeenAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      nextReviewAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      attemptCount: 8,
      correctCount: 5,
      hedgeWordRate: 0.45
    },
    'Quadratic Equations': {
      topic: 'Quadratic Equations',
      subject: 'mathematics',
      errorTypes: ['procedural_error', 'sign_error'],
      confidenceScore: 0.72,
      lastSeenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      nextReviewAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      attemptCount: 12,
      correctCount: 9,
      hedgeWordRate: 0.25
    },
    'Organic Chemistry': {
      topic: 'Organic Chemistry',
      subject: 'chemistry',
      errorTypes: ['recall_gap', 'formula_misapplication'],
      confidenceScore: 0.38,
      lastSeenAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      nextReviewAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      attemptCount: 4,
      correctCount: 1,
      hedgeWordRate: 0.75
    },
    "Newton's Laws": {
      topic: "Newton's Laws",
      subject: 'physics',
      errorTypes: ['conceptual_misconception'],
      confidenceScore: 0.65,
      lastSeenAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      nextReviewAt: new Date().toISOString(),
      attemptCount: 10,
      correctCount: 7,
      hedgeWordRate: 0.35
    }
  },
  overallConfidenceCalibration: 0.68,
  dominantErrorType: 'conceptual_misconception',
  sessionCount: 15,
  lastExamTarget: 'JAMB'
}

export interface PracticeQuestion {
  topic: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export const SAMPLE_QUESTIONS: Record<Subject, { topic: string; question: string; options: string[] }[]> = {
  biology: [
    {
      topic: 'Photosynthesis',
      question: 'During the light-dependent stage of photosynthesis, which of the following occurs in the thylakoid membrane?',
      options: [
        'A. Production of glucose',
        'B. Splitting of water molecules',
        'C. Formation of pyruvate',
        'D. Release of carbon dioxide'
      ]
    },
    {
      topic: 'Cell Division',
      question: 'If a cell needs to repair damaged skin tissue, which cellular process would be most appropriate?',
      options: [
        'A. Meiosis',
        'B. Mitosis',
        'C. Fertilization',
        'D. Binary fission'
      ]
    },
    {
      topic: 'Osmosis',
      question: 'A red blood cell is placed in a hypotonic solution. What will happen to the cell?',
      options: [
        'A. It will shrink (crenation)',
        'B. It will remain unchanged',
        'C. It will swell and may burst (lysis)',
        'D. It will divide by mitosis'
      ]
    },
    {
      topic: 'Genetics',
      question: 'In a monohybrid cross between two heterozygous tall plants (Tt × Tt), what is the expected phenotypic ratio?',
      options: [
        'A. 1 tall : 1 short',
        'B. 3 tall : 1 short',
        'C. 1 tall : 2 medium : 1 short',
        'D. All tall'
      ]
    },
    {
      topic: 'Respiration',
      question: 'Which of the following is the net gain of ATP molecules during glycolysis?',
      options: [
        'A. 36 ATP',
        'B. 4 ATP',
        'C. 2 ATP',
        'D. 38 ATP'
      ]
    },
    {
      topic: 'Enzymes',
      question: 'An enzyme is said to be denatured when it loses its activity at high temperatures. Which structural feature is most affected?',
      options: [
        'A. Primary structure',
        'B. Active site shape',
        'C. Substrate concentration',
        'D. pH of the solution'
      ]
    }
  ],
  chemistry: [
    {
      topic: 'Concentration',
      question: 'Calculate the concentration of a solution if 0.5 moles of NaCl is dissolved in 250cm³ of water.',
      options: [
        'A. 0.5 mol/dm³',
        'B. 2.0 mol/dm³',
        'C. 0.002 mol/dm³',
        'D. 125 mol/dm³'
      ]
    },
    {
      topic: 'Organic Chemistry',
      question: 'Which functional group is present in ethanoic acid?',
      options: [
        'A. Hydroxyl',
        'B. Carboxyl',
        'C. Amino',
        'D. Carbonyl'
      ]
    },
    {
      topic: 'Periodic Table',
      question: 'An element has atomic number 17. Which group of the periodic table does it belong to?',
      options: [
        'A. Group I',
        'B. Group VI',
        'C. Group VII',
        'D. Group VIII'
      ]
    },
    {
      topic: 'Acid-Base',
      question: 'Which of the following salts will produce an alkaline solution when dissolved in water?',
      options: [
        'A. Ammonium chloride (NH₄Cl)',
        'B. Sodium chloride (NaCl)',
        'C. Sodium carbonate (Na₂CO₃)',
        'D. Copper(II) sulphate (CuSO₄)'
      ]
    },
    {
      topic: 'Redox Reactions',
      question: 'In the reaction: 2Mg + O₂ → 2MgO, what happens to magnesium?',
      options: [
        'A. It is reduced',
        'B. It is oxidised',
        'C. It acts as an oxidising agent',
        'D. It remains unchanged'
      ]
    },
    {
      topic: 'Gas Laws',
      question: 'A gas occupies 4 dm³ at 300K and 1 atm. What volume will it occupy at 600K and 1 atm?',
      options: [
        'A. 2 dm³',
        'B. 4 dm³',
        'C. 8 dm³',
        'D. 16 dm³'
      ]
    }
  ],
  physics: [
    {
      topic: "Newton's Laws",
      question: 'A car of mass 1000kg accelerates from rest to 20m/s in 10 seconds. What is the net force acting on the car?',
      options: [
        'A. 20,000 N',
        'B. 2,000 N',
        'C. 200 N',
        'D. 100 N'
      ]
    },
    {
      topic: 'Electricity',
      question: 'In which direction do electrons flow in an electric circuit?',
      options: [
        'A. From positive to negative terminal',
        'B. From negative to positive terminal',
        'C. In both directions simultaneously',
        'D. They do not flow'
      ]
    },
    {
      topic: 'Waves',
      question: 'A wave has a frequency of 50 Hz and a wavelength of 2 m. What is its speed?',
      options: [
        'A. 25 m/s',
        'B. 52 m/s',
        'C. 100 m/s',
        'D. 0.04 m/s'
      ]
    },
    {
      topic: 'Pressure',
      question: 'A force of 200 N acts on an area of 0.5 m². What is the pressure exerted?',
      options: [
        'A. 100 Pa',
        'B. 200 Pa',
        'C. 400 Pa',
        'D. 0.25 Pa'
      ]
    },
    {
      topic: 'Optics',
      question: 'Which type of mirror is used in car rear-view mirrors, and why?',
      options: [
        'A. Concave — it magnifies objects',
        'B. Concave — it gives a wider field of view',
        'C. Convex — it gives a wider field of view',
        'D. Plane — it gives a true image'
      ]
    },
    {
      topic: 'Energy',
      question: 'A ball of mass 2 kg is dropped from a height of 10 m. What is its kinetic energy just before it hits the ground? (g = 10 m/s²)',
      options: [
        'A. 20 J',
        'B. 100 J',
        'C. 200 J',
        'D. 400 J'
      ]
    }
  ],
  mathematics: [
    {
      topic: 'Quadratic Equations',
      question: 'Solve the equation: x² - 5x + 6 = 0',
      options: [
        'A. x = 2 or x = 3',
        'B. x = -2 or x = -3',
        'C. x = 1 or x = 6',
        'D. x = -1 or x = -6'
      ]
    },
    {
      topic: 'Logarithms',
      question: 'If log₁₀(x) = 2, what is the value of x?',
      options: [
        'A. 10',
        'B. 20',
        'C. 100',
        'D. 1000'
      ]
    },
    {
      topic: 'Indices',
      question: 'Simplify: (2³ × 2⁴) ÷ 2⁵',
      options: [
        'A. 2',
        'B. 4',
        'C. 8',
        'D. 16'
      ]
    },
    {
      topic: 'Geometry',
      question: 'The angles of a triangle are in the ratio 2:3:5. What is the largest angle?',
      options: [
        'A. 36°',
        'B. 54°',
        'C. 90°',
        'D. 108°'
      ]
    },
    {
      topic: 'Sequences',
      question: 'Find the 10th term of the arithmetic sequence: 3, 7, 11, 15, ...',
      options: [
        'A. 39',
        'B. 40',
        'C. 43',
        'D. 47'
      ]
    },
    {
      topic: 'Fractions',
      question: 'Simplify: (3/4) ÷ (9/16)',
      options: [
        'A. 27/64',
        'B. 4/3',
        'C. 3/4',
        'D. 48/36'
      ]
    }
  ],
  english: [
    {
      topic: 'Comprehension',
      question: "In the passage, the author's tone can best be described as:",
      options: [
        'A. Optimistic',
        'B. Critical',
        'C. Neutral',
        'D. Humorous'
      ]
    },
    {
      topic: 'Grammar',
      question: 'Choose the grammatically correct sentence:',
      options: [
        'A. Neither the students nor the teacher were present.',
        'B. Neither the students nor the teacher was present.',
        'C. Neither the students nor the teacher are present.',
        'D. Neither the students nor the teacher have been present.'
      ]
    },
    {
      topic: 'Vocabulary',
      question: 'The word "ephemeral" most nearly means:',
      options: [
        'A. Long-lasting',
        'B. Short-lived',
        'C. Extremely important',
        'D. Deeply emotional'
      ]
    },
    {
      topic: 'Figures of Speech',
      question: 'Identify the figure of speech in: "The wind howled through the night."',
      options: [
        'A. Simile',
        'B. Metaphor',
        'C. Personification',
        'D. Hyperbole'
      ]
    }
  ],
  economics: [
    {
      topic: 'Price Elasticity',
      question: 'If the price of garri increases from ₦200 to ₦300 per measure, and the quantity demanded falls from 100 to 80 measures, what is the price elasticity of demand?',
      options: [
        'A. -0.4',
        'B. -0.5',
        'C. -2.0',
        'D. -2.5'
      ]
    },
    {
      topic: 'Opportunity Cost',
      question: 'Amaka decides to attend university instead of taking a job paying ₦500,000 per year. The opportunity cost of her decision is:',
      options: [
        'A. The cost of tuition fees only',
        'B. The value of the forgone salary (₦500,000/year)',
        'C. Zero, because education has no cost',
        'D. The total cost of tuition plus living expenses'
      ]
    },
    {
      topic: 'Supply and Demand',
      question: 'Which of the following will cause a rightward shift in the supply curve of smartphones?',
      options: [
        'A. An increase in consumer income',
        'B. A rise in the cost of production components',
        'C. An improvement in smartphone manufacturing technology',
        'D. An increase in the price of smartphones'
      ]
    },
    {
      topic: 'National Income',
      question: 'Which of the following is NOT included in the calculation of Gross Domestic Product (GDP)?',
      options: [
        'A. Government expenditure on hospitals',
        'B. Value of cars produced and sold domestically',
        'C. Subsistence farming produce consumed by farmers',
        'D. Exports of crude oil'
      ]
    }
  ]
}

export const PRACTICE_QUESTIONS: Record<Subject, PracticeQuestion[]> = {
  biology: [
    {
      topic: 'Photosynthesis',
      question: 'During the light-dependent stage of photosynthesis, which of the following occurs in the thylakoid membrane?',
      options: ['Production of glucose', 'Splitting of water molecules (photolysis)', 'Formation of pyruvate', 'Release of carbon dioxide'],
      correctIndex: 1,
      explanation: 'In the light-dependent reactions, water is split (photolysis) in the thylakoid membrane to release electrons, protons, and oxygen. Glucose is produced in the light-independent stage (Calvin cycle) in the stroma.'
    },
    {
      topic: 'Cell Division',
      question: 'If a cell needs to repair damaged skin tissue, which cellular process would be most appropriate?',
      options: ['Meiosis', 'Mitosis', 'Fertilization', 'Binary fission'],
      correctIndex: 1,
      explanation: 'Mitosis produces genetically identical daughter cells and is used for growth, repair, and asexual reproduction in body (somatic) cells. Meiosis produces gametes and only occurs in reproductive organs.'
    },
    {
      topic: 'Osmosis',
      question: 'A red blood cell is placed in a hypotonic solution. What will happen to the cell?',
      options: ['It will shrink (crenation)', 'It will remain unchanged', 'It will swell and may burst (lysis)', 'It will divide by mitosis'],
      correctIndex: 2,
      explanation: 'In a hypotonic solution (lower solute concentration than the cell), water moves into the cell by osmosis. This causes the cell to swell and potentially burst — called haemolysis in red blood cells.'
    },
    {
      topic: 'Genetics',
      question: 'In a monohybrid cross between two heterozygous tall plants (Tt × Tt), what is the expected phenotypic ratio?',
      options: ['1 tall : 1 short', '3 tall : 1 short', '1 tall : 2 medium : 1 short', 'All tall'],
      correctIndex: 1,
      explanation: 'The cross Tt × Tt gives genotypes TT, Tt, Tt, tt in ratio 1:2:1. Since T (tall) is dominant, TT and Tt plants are both tall. So the phenotypic ratio is 3 tall : 1 short.'
    },
    {
      topic: 'Respiration',
      question: 'Which of the following is the net gain of ATP molecules during glycolysis?',
      options: ['36 ATP', '4 ATP', '2 ATP', '38 ATP'],
      correctIndex: 2,
      explanation: 'Glycolysis uses 2 ATP and produces 4 ATP, giving a NET gain of 2 ATP. The 36-38 ATP total comes from the entire aerobic respiration pathway including the Krebs cycle and oxidative phosphorylation.'
    },
    {
      topic: 'Enzymes',
      question: 'An enzyme is said to be denatured when it loses its activity at high temperatures. Which structural feature is most affected?',
      options: ['Primary structure', 'Active site shape', 'Substrate concentration', 'pH of the solution'],
      correctIndex: 1,
      explanation: 'Denaturation alters the tertiary structure of the enzyme, which changes the shape of the active site. The enzyme can no longer bind to its substrate. The primary structure (amino acid sequence) remains intact.'
    },
  ],
  chemistry: [
    {
      topic: 'Concentration',
      question: 'Calculate the concentration of a solution if 0.5 moles of NaCl is dissolved in 250 cm³ of water.',
      options: ['0.5 mol/dm³', '2.0 mol/dm³', '0.002 mol/dm³', '125 mol/dm³'],
      correctIndex: 1,
      explanation: 'Concentration = moles ÷ volume (in dm³). 250 cm³ = 0.25 dm³. Therefore: 0.5 ÷ 0.25 = 2.0 mol/dm³. A common trap is forgetting to convert cm³ to dm³ (divide by 1000).'
    },
    {
      topic: 'Organic Chemistry',
      question: 'Which functional group is present in ethanoic acid?',
      options: ['Hydroxyl (-OH)', 'Carboxyl (-COOH)', 'Amino (-NH₂)', 'Carbonyl (C=O)'],
      correctIndex: 1,
      explanation: 'Ethanoic acid (CH₃COOH) is a carboxylic acid. The carboxyl group (-COOH) defines this class of compounds. While carboxyl does contain both C=O and O-H, the functional group as a whole is called carboxyl.'
    },
    {
      topic: 'Periodic Table',
      question: 'An element has atomic number 17. Which group of the periodic table does it belong to?',
      options: ['Group I', 'Group VI', 'Group VII', 'Group VIII'],
      correctIndex: 2,
      explanation: 'Atomic number 17 is chlorine (Cl). Its electron configuration is 2, 8, 7 — it has 7 electrons in its outer shell. Elements with 7 outer electrons belong to Group VII (halogens).'
    },
    {
      topic: 'Acid-Base',
      question: 'Which of the following salts will produce an alkaline solution when dissolved in water?',
      options: ['Ammonium chloride (NH₄Cl)', 'Sodium chloride (NaCl)', 'Sodium carbonate (Na₂CO₃)', 'Copper(II) sulphate (CuSO₄)'],
      correctIndex: 2,
      explanation: 'Sodium carbonate is formed from a strong base (NaOH) and a weak acid (H₂CO₃). Salts of strong base + weak acid undergo hydrolysis to give alkaline solutions. NH₄Cl gives acidic, NaCl gives neutral, CuSO₄ gives acidic.'
    },
    {
      topic: 'Redox Reactions',
      question: 'In the reaction: 2Mg + O₂ → 2MgO, what happens to magnesium?',
      options: ['It is reduced', 'It is oxidised', 'It acts as an oxidising agent', 'It remains unchanged'],
      correctIndex: 1,
      explanation: 'Magnesium loses electrons (2 electrons per atom) to form Mg²⁺. Loss of electrons = oxidation. Magnesium goes from oxidation state 0 to +2, so it is oxidised. Oxygen gains electrons, so it is the oxidising agent.'
    },
    {
      topic: 'Gas Laws',
      question: 'A gas occupies 4 dm³ at 300K and 1 atm. What volume will it occupy at 600K and 1 atm?',
      options: ['2 dm³', '4 dm³', '8 dm³', '16 dm³'],
      correctIndex: 2,
      explanation: 'At constant pressure, Charles\'s Law applies: V₁/T₁ = V₂/T₂. So V₂ = V₁ × T₂/T₁ = 4 × 600/300 = 8 dm³. Doubling the temperature (in Kelvin) doubles the volume at constant pressure.'
    },
  ],
  physics: [
    {
      topic: "Newton's Laws",
      question: 'A car of mass 1000 kg accelerates from rest to 20 m/s in 10 seconds. What is the net force acting on the car?',
      options: ['20,000 N', '2,000 N', '200 N', '100 N'],
      correctIndex: 1,
      explanation: 'First find acceleration: a = (v - u)/t = (20 - 0)/10 = 2 m/s². Then use F = ma: F = 1000 × 2 = 2000 N. A common error is using v directly instead of calculating acceleration first.'
    },
    {
      topic: 'Electricity',
      question: 'In which direction do electrons flow in an electric circuit?',
      options: ['From positive to negative terminal', 'From negative to positive terminal', 'In both directions simultaneously', 'They do not flow'],
      correctIndex: 1,
      explanation: 'Electrons are negatively charged and are attracted to the positive terminal. They flow from the negative terminal (anode), through the external circuit, to the positive terminal (cathode). Conventional current flows in the opposite direction.'
    },
    {
      topic: 'Waves',
      question: 'A wave has a frequency of 50 Hz and a wavelength of 2 m. What is its speed?',
      options: ['25 m/s', '52 m/s', '100 m/s', '0.04 m/s'],
      correctIndex: 2,
      explanation: 'Wave speed = frequency × wavelength: v = f × λ = 50 × 2 = 100 m/s. This is the wave equation. Never add frequency and wavelength — always multiply them for speed.'
    },
    {
      topic: 'Pressure',
      question: 'A force of 200 N acts on an area of 0.5 m². What is the pressure exerted?',
      options: ['100 Pa', '200 Pa', '400 Pa', '0.25 Pa'],
      correctIndex: 2,
      explanation: 'Pressure = Force ÷ Area: P = 200 ÷ 0.5 = 400 Pa. A smaller area means higher pressure for the same force — this is why a needle pierces easily while a flat hand does not.'
    },
    {
      topic: 'Optics',
      question: 'Which type of mirror is used in car rear-view mirrors, and why?',
      options: ['Concave — it magnifies objects', 'Concave — it gives a wider field of view', 'Convex — it gives a wider field of view', 'Plane — it gives a true image'],
      correctIndex: 2,
      explanation: 'Convex mirrors always produce virtual, erect, and diminished images. This makes objects appear farther away but gives a much wider field of view — essential for seeing vehicles approaching from the side.'
    },
    {
      topic: 'Energy',
      question: 'A ball of mass 2 kg is dropped from a height of 10 m. What is its kinetic energy just before it hits the ground? (g = 10 m/s²)',
      options: ['20 J', '100 J', '200 J', '400 J'],
      correctIndex: 2,
      explanation: 'At ground level, all potential energy converts to kinetic energy. PE = mgh = 2 × 10 × 10 = 200 J. Therefore KE = 200 J. You don\'t need to find velocity first — conservation of energy gives you the answer directly.'
    },
  ],
  mathematics: [
    {
      topic: 'Quadratic Equations',
      question: 'Solve the equation: x² - 5x + 6 = 0',
      options: ['x = 2 or x = 3', 'x = -2 or x = -3', 'x = 1 or x = 6', 'x = -1 or x = -6'],
      correctIndex: 0,
      explanation: 'Factorise: find two numbers that multiply to +6 and add to -5. Those are -2 and -3. So (x - 2)(x - 3) = 0, giving x = 2 or x = 3. Verify: 2² - 5(2) + 6 = 4 - 10 + 6 = 0 ✓'
    },
    {
      topic: 'Logarithms',
      question: 'If log₁₀(x) = 2, what is the value of x?',
      options: ['10', '20', '100', '1000'],
      correctIndex: 2,
      explanation: 'log₁₀(x) = 2 means 10² = x. Therefore x = 100. The logarithm is the power to which the base must be raised to give the number. log₁₀(100) = 2 because 10² = 100.'
    },
    {
      topic: 'Indices',
      question: 'Simplify: (2³ × 2⁴) ÷ 2⁵',
      options: ['2', '4', '8', '16'],
      correctIndex: 1,
      explanation: 'When multiplying same bases, add powers: 2³ × 2⁴ = 2⁷. When dividing, subtract powers: 2⁷ ÷ 2⁵ = 2². Therefore 2² = 4. Many students multiply 3 × 4 = 12 instead of adding — always ADD indices when multiplying.'
    },
    {
      topic: 'Geometry',
      question: 'The angles of a triangle are in the ratio 2:3:5. What is the largest angle?',
      options: ['36°', '54°', '90°', '108°'],
      correctIndex: 2,
      explanation: 'The angles sum to 180°. Total ratio parts = 2+3+5 = 10. Each part = 180°/10 = 18°. Largest angle = 5 × 18° = 90°. This is a right-angled triangle — ratio 2:3:5 always gives a right angle.'
    },
    {
      topic: 'Sequences',
      question: 'Find the 10th term of the arithmetic sequence: 3, 7, 11, 15, ...',
      options: ['39', '40', '43', '47'],
      correctIndex: 0,
      explanation: 'First term (a) = 3, common difference (d) = 4. nth term = a + (n-1)d. 10th term = 3 + (10-1)×4 = 3 + 36 = 39. A common error is using n instead of (n-1), which gives 43.'
    },
    {
      topic: 'Fractions',
      question: 'Simplify: (3/4) ÷ (9/16)',
      options: ['27/64', '4/3', '3/4', '48/36'],
      correctIndex: 1,
      explanation: 'Dividing by a fraction = multiplying by its reciprocal. (3/4) ÷ (9/16) = (3/4) × (16/9) = 48/36 = 4/3. Cancel before multiplying: (3×16)/(4×9) = (3×4)/(1×9) = 12/9 = 4/3.'
    },
  ],
  english: [
    {
      topic: 'Grammar',
      question: 'Choose the grammatically correct sentence:',
      options: [
        'Neither the students nor the teacher were present.',
        'Neither the students nor the teacher was present.',
        'Neither the students nor the teacher are present.',
        'Neither the students nor the teacher have been present.'
      ],
      correctIndex: 1,
      explanation: 'With "neither...nor", the verb agrees with the subject closest to it. Here "the teacher" (singular) is closest to the verb, so use "was" (singular). This rule is called proximity agreement.'
    },
    {
      topic: 'Vocabulary',
      question: 'The word "ephemeral" most nearly means:',
      options: ['Long-lasting', 'Short-lived', 'Extremely important', 'Deeply emotional'],
      correctIndex: 1,
      explanation: '"Ephemeral" comes from the Greek "ephemeros" meaning "lasting only a day." It describes something that lasts for a very short time. Example: "The beauty of the morning dew is ephemeral."'
    },
    {
      topic: 'Figures of Speech',
      question: 'Identify the figure of speech in: "The wind howled through the night."',
      options: ['Simile', 'Metaphor', 'Personification', 'Hyperbole'],
      correctIndex: 2,
      explanation: 'Personification attributes human qualities (howling) to a non-human entity (wind). A simile uses "like" or "as." A metaphor directly equates two things. Personification just attributes human action to something that cannot do it.'
    },
    {
      topic: 'Comprehension',
      question: "In the passage, the author's tone can best be described as:",
      options: ['Optimistic', 'Critical', 'Neutral', 'Humorous'],
      correctIndex: 1,
      explanation: 'Tone is determined by the author\'s word choices and attitude. Look for evaluative language, positive or negative connotations, and emotional signals in the text to determine whether the tone is optimistic, critical, neutral, or humorous.'
    },
  ],
  economics: [
    {
      topic: 'Price Elasticity',
      question: 'If the price of garri increases from ₦200 to ₦300 per measure, and the quantity demanded falls from 100 to 80 measures, what is the price elasticity of demand?',
      options: ['-0.4', '-0.5', '-2.0', '-2.5'],
      correctIndex: 0,
      explanation: 'PED = (% change in quantity demanded) ÷ (% change in price). % ΔQ = (80-100)/100 × 100 = -20%. % ΔP = (300-200)/200 × 100 = +50%. PED = -20% ÷ 50% = -0.4. Since |PED| < 1, demand is inelastic.'
    },
    {
      topic: 'Opportunity Cost',
      question: 'Amaka decides to attend university instead of taking a job paying ₦500,000 per year. The opportunity cost of her decision is:',
      options: ['The cost of tuition fees only', 'The value of the forgone salary (₦500,000/year)', 'Zero, because education has no cost', 'The total cost of tuition plus living expenses'],
      correctIndex: 1,
      explanation: 'Opportunity cost is the value of the next best alternative forgone. By choosing university, Amaka gives up the ₦500,000 salary. Tuition fees are an explicit cost, not the opportunity cost. The opportunity cost is specifically the FORGONE benefit.'
    },
    {
      topic: 'Supply and Demand',
      question: 'Which of the following will cause a rightward shift in the supply curve of smartphones?',
      options: [
        'An increase in consumer income',
        'A rise in the cost of production components',
        'An improvement in smartphone manufacturing technology',
        'An increase in the price of smartphones'
      ],
      correctIndex: 2,
      explanation: 'A rightward shift in supply means MORE is supplied at every price. Better technology reduces production costs, so firms can supply more. An increase in price causes movement ALONG the supply curve (not a shift). Rising costs shift supply LEFT.'
    },
    {
      topic: 'National Income',
      question: 'Which of the following is NOT included in the calculation of Gross Domestic Product (GDP)?',
      options: [
        'Government expenditure on hospitals',
        'Value of cars produced and sold domestically',
        'Subsistence farming produce consumed by farmers',
        'Exports of crude oil'
      ],
      correctIndex: 2,
      explanation: 'GDP measures market transactions — goods and services that are bought and sold. Subsistence farming (crops consumed by the farmer themselves) is not sold in the market and therefore NOT counted in GDP. This is a major limitation of GDP as a measure of welfare.'
    },
  ],
}

export const SOCRATIC_RESPONSES: Record<string, string[]> = {
  initial: [
    "Before we dive into the options, walk me through what you understand about this process. What's happening at the cellular level?",
    "What does your current reasoning tell you about this? Explain the logic behind your thinking.",
    "Let's start with the concept itself. What do you already know about this topic?",
    "Before choosing an option, help me understand your mental model. How do you see this working?"
  ],
  conceptual_probe: [
    "You mentioned that process — but what is the actual purpose of it in this context?",
    "That's an interesting direction. What would happen if that were true?",
    "I notice you're focusing on that aspect. Why does that matter for this specific question?",
    "You're getting closer. Push that thought further — what's the underlying principle?"
  ],
  procedural_probe: [
    "In that step you just mentioned, what unit does the formula expect?",
    "Look at the calculation you're doing. What happens when you convert those units?",
    "You've identified the right formula. Now, what does each variable represent in this context?",
    "That step makes sense, but check the value you're using. Where did that number come from?"
  ],
  distractor_analysis: [
    "You chose that option. Before we move on, build the case for it. Why exactly does it feel correct?",
    "Explain to me the reasoning that led you to that choice. What was the deciding factor?",
    "That's a common choice. Walk me through the logic — what makes that option seem right?",
    "Interesting selection. What specific part of the question made you lean toward that option?"
  ],
  confidence_challenge: [
    "You sound confident, but let's test that. What happens when we consider the opposite?",
    "I hear certainty in your answer. What evidence supports that conclusion?",
    "You stated that firmly. How would you defend that position if challenged?",
    "That's decisive. Now, what could potentially contradict that reasoning?"
  ],
  hedge_response: [
    "I notice you're uncertain. What specific part is making you hesitate?",
    "You said 'maybe' — what would make you more certain about this?",
    "That hedging tells me something. What's the gap in your understanding right now?",
    "You're guessing. Let's narrow it down — what do you actually know for sure about this?"
  ],
  transfer_question: [
    "You worked that out. Now — same concept, different context: What if we changed the conditions?",
    "Good. Now apply that same principle to a real-world Nigerian scenario.",
    "You've got the pattern. How would this work if we scaled it up?",
    "That's the concept. Now, where else would you see this same principle at work?"
  ]
}

export const SUBJECTS_INFO: Record<Subject, { name: string; color: string; icon: string }> = {
  biology:     { name: 'Biology',     color: 'bg-green-500',  icon: '🧬' },
  chemistry:   { name: 'Chemistry',   color: 'bg-blue-500',   icon: '⚗️' },
  physics:     { name: 'Physics',     color: 'bg-purple-500', icon: '⚡' },
  mathematics: { name: 'Mathematics', color: 'bg-orange-500', icon: '📐' },
  english:     { name: 'English',     color: 'bg-pink-500',   icon: '📚' },
  economics:   { name: 'Economics',   color: 'bg-yellow-500', icon: '💰' },
}

export const ERROR_TYPE_INFO: Record<string, { label: string; description: string; tip: string; icon: string }> = {
  conceptual_misconception: {
    label: 'Conceptual Misconception',
    description: 'You understand the procedure but have a wrong mental model of the underlying concept.',
    tip: 'Explain the concept in your own words without looking at notes. If you struggle, the concept is not clear.',
    icon: '🧠',
  },
  procedural_error: {
    label: 'Procedural Error',
    description: 'You know the concept but make mistakes in the steps of solving the problem.',
    tip: 'Practice each step slowly and check units at every stage. Write out every intermediate step.',
    icon: '📋',
  },
  unit_confusion: {
    label: 'Unit Confusion',
    description: 'You mix up units or forget to convert between them (e.g., cm³ to dm³).',
    tip: 'Always write units next to every number in your working. Treat unit conversion as a separate step.',
    icon: '📏',
  },
  sign_error: {
    label: 'Sign Error',
    description: 'You make mistakes with positive/negative signs in calculations or equations.',
    tip: 'Slow down at every addition and subtraction. Circle all negative signs before starting a calculation.',
    icon: '±',
  },
  formula_misapplication: {
    label: 'Formula Misapplication',
    description: 'You apply a formula to a situation it doesn\'t apply to, or use the wrong version.',
    tip: 'For every formula, memorise the conditions under which it applies, not just the formula itself.',
    icon: '📐',
  },
  distractor_susceptibility: {
    label: 'Distractor Susceptibility',
    description: 'You are easily misled by wrong answers designed to look correct (JAMB traps).',
    tip: 'Read every option carefully. When in doubt, eliminate clearly wrong answers and reason about the remaining ones.',
    icon: '🎯',
  },
  language_barrier: {
    label: 'Language Barrier',
    description: 'Difficult English in questions or options confuses your reasoning.',
    tip: 'Build academic vocabulary. When a question confuses you, break each sentence into smaller parts.',
    icon: '🗣️',
  },
  recall_gap: {
    label: 'Recall Gap',
    description: 'You forget key facts, definitions, or formulas at the moment of answering.',
    tip: 'Use active recall: close your book and try to write down everything you know. Spaced repetition beats re-reading.',
    icon: '💭',
  },
}
