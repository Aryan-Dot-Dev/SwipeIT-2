const questions = {
  "recruiter": [
    {
      "id": "Q2",
      "question": "When a risky but interesting idea is shared, the ideal person should:",
      "trait": ["Collaboration", "Adaptability", "Innovation", "Risk Tolerance", "Execution Speed"],
      "options": [
        {
          "option": "A",
          "description": "Evaluate it briefly, then decide",
          "mapping": "Balanced Thinker, Cautious Optimist",
          "scores": [3, 2, 4, 4, 3]
        },
        {
          "option": "B",
          "description": "Support it if it aligns with the outcome",
          "mapping": "Strategic Collaborator, Goal-Focused",
          "scores": [4, 3, 3, 3, 3]
        },
        {
          "option": "C",
          "description": "Prefer a safer alternative first",
          "mapping": "Risk-Averse, Safety-Conscious",
          "scores": [2, 1, 1, 1, 2]
        },
        {
          "option": "D",
          "description": "Champion it and help shape it",
          "mapping": "Risk-Taker, Creative Collaborator",
          "scores": [3, 3, 5, 5, 4]
        }
      ]
    },
    {
      "id": "Q3",
      "question": "If asked to stretch beyond their role occasionally, you’d want them to:",
      "trait": ["Collaboration", "Adaptability", "Innovation", "Risk Tolerance", "Execution Speed"],
      "options": [
        {
          "option": "A",
          "description": "Say yes when the team needs it",
          "mapping": "Team-First, Supportive",
          "scores": [5, 4, 2, 3, 3]
        },
        {
          "option": "B",
          "description": "Evaluate urgency before agreeing",
          "mapping": "Practical, Boundary-Setting",
          "scores": [3, 3, 2, 2, 3]
        },
        {
          "option": "C",
          "description": "Suggest a workaround instead",
          "mapping": "Efficient Problem Solver",
          "scores": [2, 3, 3, 3, 4]
        },
        {
          "option": "D",
          "description": "Agree, but set boundaries",
          "mapping": "Self-Aware, Quiet Leader",
          "scores": [3, 3, 2, 2, 3]
        }
      ]
    },
    {
      "id": "Q6",
      "question": "In team settings, your ideal employee should naturally become:",
      "trait": ["Collaboration", "Adaptability", "Innovation", "Risk Tolerance", "Execution Speed"],
      "options": [
        {
          "option": "A",
          "description": "The one who builds bridges",
          "mapping": "Team Builder, Connector",
          "scores": [5, 3, 3, 2, 2]
        },
        {
          "option": "B",
          "description": "Silent executor",
          "mapping": "Reliable, Self-Driven",
          "scores": [3, 2, 2, 2, 3]
        },
        {
          "option": "C",
          "description": "Keeps things on track",
          "mapping": "Organizer, Planner",
          "scores": [3, 2, 2, 2, 4]
        },
        {
          "option": "D",
          "description": "Creative spark",
          "mapping": "Idea Generator, Visionary",
          "scores": [3, 3, 5, 4, 3]
        }
      ]
    },
    {
      "id": "Q7",
      "question": "If something goes wrong in a project, you'd expect them to:",
      "trait": ["Collaboration", "Adaptability", "Innovation", "Risk Tolerance", "Execution Speed"],
      "options": [
        {
          "option": "A",
          "description": "Salvage what's left",
          "mapping": "Calm Crisis Solver",
          "scores": [3, 4, 2, 3, 3]
        },
        {
          "option": "B",
          "description": "Take ownership",
          "mapping": "Responsible, Accountable",
          "scores": [3, 3, 1, 2, 3]
        },
        {
          "option": "C",
          "description": "Get team back on track",
          "mapping": "Supportive, People-Oriented",
          "scores": [5, 4, 2, 2, 3]
        },
        {
          "option": "D",
          "description": "Review root cause",
          "mapping": "System-Oriented, Reflective",
          "scores": [2, 3, 2, 2, 2]
        }
      ]
    },
    {
      "id": "Q10",
      "question": "If placed in a team with a different working style, the right fit would:",
      "trait": ["Collaboration", "Adaptability", "Innovation", "Risk Tolerance", "Execution Speed"],
      "options": [
        {
          "option": "A",
          "description": "Adapt and go with the flow",
          "mapping": "Flexible, Easygoing",
          "scores": [4, 5, 1, 2, 2]
        },
        {
          "option": "B",
          "description": "Find common rhythm over time",
          "mapping": "Harmonizer, Culture Builder",
          "scores": [5, 5, 2, 2, 2]
        },
        {
          "option": "C",
          "description": "Maintain their own method",
          "mapping": "Independent, Firm Thinker",
          "scores": [2, 2, 2, 3, 3]
        },
        {
          "option": "D",
          "description": "Use it as a personal growth chance",
          "mapping": "Growth-Seeker, Team Integrator",
          "scores": [4, 5, 3, 3, 2]
        }
      ]
    }
  ],
  "candidate": [
    {
      "id": "Q1",
      "question": "When assigned a repetitive task, what do you do?",
      "trait": ["Collaboration", "Adaptability", "Innovation", "Risk Tolerance", "Execution Speed"],
      "options": [
        {
          "option": "A",
          "description": "Try to find new ways to optimize it",
          "mapping": "Innovator, Process Optimizer",
          "scores": [2, 3, 5, 2, 4]
        },
        {
          "option": "B",
          "description": "Execute it with perfection and consistency",
          "mapping": "Detail-Oriented, Consistent Performer",
          "scores": [2, 3, 1, 1, 3]
        },
        {
          "option": "C",
          "description": "Do it only if it adds meaningful value",
          "mapping": "Value-Driven, Purpose-Oriented",
          "scores": [3, 3, 3, 2, 2]
        },
        {
          "option": "D",
          "description": "Complete it quickly to save time",
          "mapping": "Efficient Executor, Task-Focused",
          "scores": [2, 2, 2, 2, 5]
        }
      ]
    },
    {
      "id": "Q4",
      "question": "If you receive feedback you find unfair, how do you respond?",
      "trait": ["Collaboration", "Adaptability", "Innovation", "Risk Tolerance", "Execution Speed"],
      "options": [
        {
          "option": "A",
          "description": "Rethink how they communicated",
          "mapping": "Reflective, Self-Aware",
          "scores": [2, 3, 1, 2, 2]
        },
        {
          "option": "B",
          "description": "Accept it quietly and move on",
          "mapping": "Self-Preserving, Conflict Avoider",
          "scores": [1, 2, 1, 2, 2]
        },
        {
          "option": "C",
          "description": "Clarify respectfully",
          "mapping": "Curious, Emotionally Mature",
          "scores": [3, 4, 2, 3, 2]
        },
        {
          "option": "D",
          "description": "Use it to grow and improve",
          "mapping": "Resilient, Growth-Minded",
          "scores": [2, 4, 2, 3, 3]
        }
      ]
    },
    {
      "id": "Q5",
      "question": "If given a vague instruction, what do you do?",
      "trait": ["Collaboration", "Adaptability", "Innovation", "Risk Tolerance", "Execution Speed"],
      "options": [
        {
          "option": "A",
          "description": "Ask for clarity",
          "mapping": "Communicative, Clear Thinker",
          "scores": [3, 4, 2, 2, 3]
        },
        {
          "option": "B",
          "description": "Start anyway and adapt later",
          "mapping": "Action-Taker, Agile",
          "scores": [2, 5, 2, 3, 4]
        },
        {
          "option": "C",
          "description": "Break it into steps",
          "mapping": "Analytical, Experimental",
          "scores": [2, 4, 3, 3, 3]
        },
        {
          "option": "D",
          "description": "Consult peers",
          "mapping": "Collaborative, Peer-Oriented",
          "scores": [4, 4, 1, 2, 3]
        }
      ]
    },
    {
      "id": "Q8",
      "question": "If offered a challenging role with slightly lower pay, what do you do?",
      "trait": ["Collaboration", "Adaptability", "Innovation", "Risk Tolerance", "Execution Speed"],
      "options": [
        {
          "option": "A",
          "description": "Weigh growth vs lifestyle",
          "mapping": "Balanced Thinker",
          "scores": [1, 3, 3, 3, 2]
        },
        {
          "option": "B",
          "description": "Choose growth with backup plans",
          "mapping": "Strategist, Growth-Oriented",
          "scores": [2, 3, 3, 4, 3]
        },
        {
          "option": "C",
          "description": "Negotiate for other benefits",
          "mapping": "Assertive, Negotiator",
          "scores": [2, 2, 2, 3, 3]
        },
        {
          "option": "D",
          "description": "Accept for long-term alignment",
          "mapping": "Purpose-Driven Visionary",
          "scores": [2, 3, 4, 4, 3]
        }
      ]
    },
    {
      "id": "Q9",
      "question": "If you saw a peer making frequent mistakes, what do you do?",
      "trait": ["Collaboration", "Adaptability", "Innovation", "Risk Tolerance", "Execution Speed"],
      "options": [
        {
          "option": "A",
          "description": "Gently help them",
          "mapping": "Empathetic, Soft Communicator",
          "scores": [5, 3, 1, 3, 2]
        },
        {
          "option": "B",
          "description": "Cover once, then let it be",
          "mapping": "Peace-Keeper, Avoider",
          "scores": [2, 2, 1, 2, 2]
        },
        {
          "option": "C",
          "description": "Report it diplomatically",
          "mapping": "Responsible Reporter",
          "scores": [2, 2, 1, 3, 3]
        },
        {
          "option": "D",
          "description": "Talk directly but respectfully",
          "mapping": "Direct but Respectful Communicator",
          "scores": [4, 3, 2, 3, 3]
        }
      ]
    }
  ]
}

export { questions }