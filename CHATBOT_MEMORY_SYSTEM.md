# Chatbot Memory System
**Date:** 2026-06-17
**Version:** 2.0-draft
**Scope:** Session and persistent memory architecture

---

## 1. Design Principles

1. **Privacy First** — Never store PII, company names, or specific emission data
2. **Encrypted by Default** — All persistent storage uses AES-GCM
3. **Minimal Data** — Store only what's needed for personalization
4. **User Control** — Clear memory on demand, auto-expire old data
5. **No Cross-Tracking** — Memory is per-device, not cross-browser

---

## 2. Memory Layers

```
┌─────────────────────────────────────────┐
│  LAYER 3: Persistent Memory (90 days)   │
│  encryptedStorage — long-term patterns   │
│  topics, quiz scores, usage stats       │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  LAYER 2: Session Memory (current tab)  │
│  JavaScript variable — conversation     │
│  last 10 exchanges, calculator state    │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  LAYER 1: Context Memory (per message)  │
│  Current message + previous 2 turns     │
│  Used for follow-up understanding       │
└─────────────────────────────────────────┘
```

---

## 3. Layer 1: Context Memory

### Purpose
Enable follow-up questions and contextual understanding within a conversation.

### Data Structure
```javascript
const contextMemory = {
  previousTurns: [
    { role: 'user', text: 'What is Scope 3?', timestamp: 1234567890 },
    { role: 'ai', text: 'Scope 3 encompasses...', timestamp: 1234567891 }
  ],
  currentTopic: 'scope-3',
  userIntent: 'educational',
  confidence: 0.95
};
```

### Rules
- Keep last **3 turns** (user + AI pairs)
- Expire after **5 minutes** of inactivity
- Reset on page reload
- Used for pronoun resolution ("it", "that", "those")

### Example Flow

```
User: "What is Scope 3?"
Bot: [Explains Scope 3]

User: "How do I calculate it?"
Bot: [Understands "it" = Scope 3, explains calculation]

User: "Why is mine so high?"
Bot: [Understands context, asks if calculator data available]
```

---

## 4. Layer 2: Session Memory

### Purpose
Maintain conversation continuity for the current browsing session.

### Data Structure
```javascript
const sessionMemory = {
  sessionId: 'sess_abc123',
  startedAt: Date.now(),
  messages: [], // All messages this session
  topicsDiscussed: new Set(),
  calculatorInteracted: false,
  calculatorData: null, // Anonymized
  pdfGenerated: false,
  academyClicks: [],
  quizStarted: false,
  quizCompleted: false,
  leadQualification: {
    asked: false,
    companySize: null,     // 'small' | 'medium' | 'large' | null
    industry: null,        // string or null
    reportingFramework: null, // 'csrd' | 'sec' | 'tcfd' | null
    maturityLevel: null    // 'beginner' | 'intermediate' | 'advanced' | null
  }
};
```

### Storage
- **Location:** JavaScript variable (not localStorage)
- **Lifetime:** Tab session (lost on close)
- **Size limit:** ~100 messages, then truncate oldest

### Calculator Data Handling

```javascript
// Store anonymized calculator data for contextual responses
function storeCalculatorContext(data) {
  sessionMemory.calculatorData = {
    totalEmissions: data.total,           // number
    scopeSplit: {                          // percentages
      s1: data.scope1 / data.total,
      s2: data.scope2 / data.total,
      s3: data.scope3 / data.total
    },
    topCategory: findTopCategory(data),    // string
    intensity: data.total / data.revenue   // number or null
  };
  // NEVER store: companyName, revenue, employeeCount
}
```

---

## 5. Layer 3: Persistent Memory

### Purpose
Learn user preferences over time for better recommendations.

### Data Structure
```javascript
const persistentMemory = {
  version: '2.0',
  lastUpdated: Date.now(),
  
  // Topic preferences (frequency count)
  topicPreferences: {
    'carbon-accounting': 5,
    'esg-reporting': 2,
    'energy': 1,
    'regulations': 3
  },
  
  // Content engagement
  contentEngagement: {
    academyArticlesRead: [
      { path: '/carbon-accounting/scope-3-emissions/', date: '2026-06-15' }
    ],
    quizzesTaken: [
      { quiz: 'carbon-readiness', score: 75, date: '2026-06-15' }
    ],
    pdfsGenerated: 3
  },
  
  // Skill level estimation
  skillLevel: {
    carbonAccounting: 'intermediate',  // beginner | intermediate | advanced
    esgReporting: 'beginner',
    energyEconomics: 'beginner'
  },
  
  // Lead qualification (soft, anonymous)
  qualification: {
    companySizeHint: null,      // inferred from questions
    industryHint: null,         // inferred from questions
    reportingInterest: [],      // ['csrd', 'sec', 'tcfd']
    maturityHint: null          // inferred from quiz scores
  }
};
```

### Storage
- **Location:** `encryptedStorage` (AES-GCM)
- **Key:** `terrnix_chatbot_memory`
- **Lifetime:** 90 days, then auto-clear
- **Size limit:** 50KB

### Update Rules

```javascript
function updateMemory(event, data) {
  switch(event) {
    case 'message_sent':
      incrementTopicPreference(detectTopic(data.text));
      break;
    case 'academy_click':
      recordAcademyView(data.path);
      break;
    case 'quiz_completed':
      updateSkillLevel(data.quiz, data.score);
      break;
    case 'calculator_used':
      incrementCalculatorUsage();
      break;
    case 'pdf_generated':
      incrementPdfCount();
      break;
  }
  
  // Save every 5 events or on page unload
  if (shouldSave()) {
    saveToEncryptedStorage();
  }
}
```

---

## 6. Memory for Response Personalization

### Topic Preference Ranking

```javascript
function getTopTopics(n = 3) {
  return Object.entries(persistentMemory.topicPreferences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([topic]) => topic);
}

// Usage: "Based on your interest in carbon accounting..."
```

### Skill Level Adaptation

```javascript
function adaptResponseDetail(topic, baseResponse) {
  const level = persistentMemory.skillLevel[topic] || 'beginner';
  
  if (level === 'advanced') {
    return baseResponse.advanced || baseResponse;
  } else if (level === 'intermediate') {
    return baseResponse.intermediate || baseResponse;
  }
  return baseResponse.beginner || baseResponse;
}

// Beginner: Definitions, analogies, simple examples
// Intermediate: Technical details, frameworks, comparisons
// Advanced: Edge cases, latest research, regulatory nuances
```

### Follow-up Suggestions

```javascript
function generateFollowUp(topic, userIntent) {
  const suggestions = {
    'scope-3': [
      "How do I collect supplier data?",
      "What are typical Scope 3 hotspots?",
      "How does SBTi require Scope 3?"
    ],
    'csrd': [
      "Does CSRD apply to my company?",
      "What is double materiality?",
      "When is my reporting deadline?"
    ]
  };
  
  return suggestions[topic] || genericSuggestions;
}
```

---

## 7. Privacy & Security

### Prohibited Data (NEVER Store)

| Category | Examples |
|----------|----------|
| PII | Names, emails, phone numbers, addresses |
| Company identifiers | Company names, registration numbers |
| Financial data | Revenue, exact employee count, specific emission values |
| Credentials | Passwords, API keys, tokens |
| Location | GPS coordinates, precise addresses |

### Allowed Data

| Category | Examples |
|----------|----------|
| Topic preferences | "carbon-accounting: 5 mentions" |
| Skill estimates | "intermediate in carbon accounting" |
| Engagement counts | "3 PDFs generated", "2 quizzes taken" |
| Content views | "read /scope-3-guide/" |
| Anonymous patterns | "asks about regulations frequently" |

### Encryption

```javascript
// All persistent memory encrypted via storageCrypto.js
async function saveMemory() {
  const data = JSON.stringify(persistentMemory);
  await encryptedStorage.setItem('terrnix_chatbot_memory', data);
}

async function loadMemory() {
  const data = await encryptedStorage.getItem('terrnix_chatbot_memory');
  if (data) {
    persistentMemory = JSON.parse(data);
  }
}
```

### Auto-Expiration

```javascript
function checkExpiration() {
  const age = Date.now() - persistentMemory.lastUpdated;
  const MAX_AGE = 90 * 24 * 60 * 60 * 1000; // 90 days
  
  if (age > MAX_AGE) {
    persistentMemory = createEmptyMemory();
    saveMemory();
  }
}
```

---

## 8. Memory API

```javascript
class ChatbotMemory {
  // Context (Layer 1)
  getContext() { return contextMemory; }
  addToContext(turn) { /* add turn, keep last 3 */ }
  clearContext() { contextMemory = emptyContext(); }
  
  // Session (Layer 2)
  getSession() { return sessionMemory; }
  addMessage(role, text) { /* add to session */ }
  setCalculatorContext(data) { /* anonymize and store */ }
  getCalculatorContext() { return sessionMemory.calculatorData; }
  
  // Persistent (Layer 3)
  async load() { /* from encryptedStorage */ }
  async save() { /* to encryptedStorage */ }
  recordTopic(topic) { /* increment preference */ }
  recordAcademyClick(path) { /* track engagement */ }
  recordQuizScore(quiz, score) { /* update skill level */ }
  getRecommendations() { /* based on preferences */ }
  
  // Utility
  clearAll() { /* wipe all layers */ }
  exportAnonymous() { /* for analytics, no PII */ }
}
```

---

## 9. Integration with Response Framework

```javascript
function generateResponse(userMessage) {
  // 1. Detect intent and topic
  const intent = detectIntent(userMessage);
  const topic = detectTopic(userMessage);
  
  // 2. Check context for follow-ups
  const context = memory.getContext();
  const isFollowUp = checkIfFollowUp(userMessage, context);
  
  // 3. Get base response from knowledge base
  let response = knowledgeBase.getResponse(intent, topic);
  
  // 4. Adapt to skill level
  response = adaptResponseDetail(topic, response);
  
  // 5. Add personalization
  const topTopics = memory.getTopTopics(2);
  if (topTopics.includes(topic)) {
    response = "Since you've been exploring " + topic + "... " + response;
  }
  
  // 6. Add follow-up suggestions
  const suggestions = generateFollowUp(topic, intent);
  
  // 7. Update memory
  memory.addToContext({role: 'user', text: userMessage});
  memory.addToContext({role: 'ai', text: response});
  memory.recordTopic(topic);
  
  return { text: response, suggestions };
}
```

---

## 10. Testing Memory System

### Test Cases

| Test | Expected Behavior |
|------|-------------------|
| User asks "What is Scope 3?" then "How do I calculate it?" | Bot understands "it" refers to Scope 3 |
| User uses calculator, then asks "Why is my total so high?" | Bot references calculator data anonymously |
| User returns after 7 days | Previous topic preferences still available |
| User clears chat | Session memory reset, persistent memory retained |
| User asks about CSRD 5 times | CSRD added to top topics, skill level updated |
| 90 days pass | Memory auto-cleared |

---

*Document Version: 2.0-draft*
*Next: CHATBOT_TEST_CASES.md*
