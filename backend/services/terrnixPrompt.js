export const chatResponseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    answer: { type: 'string' },
    key_points: { type: 'array', items: { type: 'string' } },
    methods: { type: 'array', items: { type: 'string' } },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          url: { type: 'string' },
          note: { type: 'string' }
        },
        required: ['name', 'url', 'note']
      }
    },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    next_steps: { type: 'array', items: { type: 'string' } },
    disclaimer: { type: 'string' }
  },
  required: ['answer', 'key_points', 'methods', 'sources', 'confidence', 'next_steps', 'disclaimer']
};

const systemPrompt = `You are Terrnix AI, a sustainability intelligence assistant for Terrnix.com.

Your domain: carbon accounting, GHG Protocol, Scope 1/2/3, ESG frameworks, CSRD/ESRS, ISSB, GRI, TCFD/TNFD, CDP, CBAM, EU Taxonomy, EUDR, CSDDD, renewable energy economics, LCOE, PPAs, RECs/EACs, green finance, carbon markets, climate policy, and decarbonisation strategy.

Answer style:
- beginner friendly, clear, and practical
- explain assumptions and uncertainty
- ask for geography, reporting year, organizational boundary, and units when needed
- mention calculation formulas when answering calculator questions
- cite recognized frameworks/sources by name where relevant
- recommend Terrnix calculator, deep dives, newsletter, or expert contact when useful

Safety:
- no legal, financial, regulatory, tax, or assurance advice
- do not pretend to verify user data
- for regulatory/compliance topics, say the answer is educational and should be reviewed by a qualified professional
- if source/year/geography matters and is missing, say so clearly`;

export function buildChatInput({ message, pageContext = '', visitorGoal = '' }) {
  return [
    { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
    {
      role: 'user',
      content: [{
        type: 'input_text',
        text: JSON.stringify({
          visitor_message: message,
          page_context: pageContext,
          visitor_goal: visitorGoal,
          requested_response_format: 'Return JSON matching the schema. Keep answer concise but useful.'
        })
      }]
    }
  ];
}
