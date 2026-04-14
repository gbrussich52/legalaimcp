-- Seed initial curated listings across all 7 categories
-- These are real legal AI tools and MCP integrations

INSERT INTO listings (name, slug, tagline, description, category, mcp_repo_url, mcp_install_command, external_url, pricing_model, pricing_details, tags, featured, verified, source, status, creator_name, creator_url) VALUES

-- ═══════════════════════════════════════════
-- DOCUMENT PROCESSING (4 listings)
-- ═══════════════════════════════════════════
(
  'Luminance',
  'luminance',
  'AI-powered contract review and negotiation platform for legal teams.',
  'Luminance uses large language models trained specifically on legal data to review, analyze, and negotiate contracts at scale. The platform can identify key clauses, flag risks, and suggest redlines across thousands of documents simultaneously. Used by over 700 law firms and corporate legal departments worldwide. Luminance''s AI understands 80+ languages and can process documents in seconds that would take lawyers hours to review manually.',
  'document_processing',
  NULL,
  NULL,
  'https://www.luminance.com',
  'contact',
  'Enterprise pricing — contact for demo',
  ARRAY['contract-review', 'ai-negotiation', 'due-diligence', 'enterprise'],
  TRUE, TRUE, 'curated', 'published',
  'Luminance Technologies', 'https://www.luminance.com'
),
(
  'Ironclad',
  'ironclad',
  'AI contract lifecycle management — draft, negotiate, sign, and manage contracts.',
  'Ironclad is a contract lifecycle management platform that uses AI to streamline the entire contract process. Their AI Assistant can draft contracts from natural language instructions, extract key terms from existing agreements, and flag deviations from standard playbooks. Integrates with Salesforce, Slack, and major e-signature platforms. Particularly strong for high-volume commercial contracts and procurement agreements.',
  'document_processing',
  NULL,
  NULL,
  'https://ironcladapp.com',
  'paid',
  'Starts at $5,000/year for small teams',
  ARRAY['contract-management', 'clm', 'workflow', 'e-signature'],
  TRUE, TRUE, 'curated', 'published',
  'Ironclad Inc.', 'https://ironcladapp.com'
),
(
  'Kira Systems',
  'kira-systems',
  'Machine learning contract analysis for due diligence and lease abstraction.',
  'Kira Systems (now part of Litera) uses proprietary machine learning models trained on millions of legal documents to automatically identify and extract clauses, provisions, and data points from contracts. Excels at due diligence review, lease abstraction, and regulatory compliance document analysis. Supports 100+ built-in extraction models and allows firms to train custom models for their specific clause libraries.',
  'document_processing',
  NULL,
  NULL,
  'https://kirasystems.com',
  'contact',
  'Enterprise pricing — volume-based',
  ARRAY['contract-analysis', 'due-diligence', 'machine-learning', 'lease-abstraction'],
  FALSE, TRUE, 'curated', 'published',
  'Litera / Kira Systems', 'https://kirasystems.com'
),
(
  'Gavel',
  'gavel',
  'No-code document automation for law firms — generate legal documents from questionnaires.',
  'Gavel (formerly Documate) lets lawyers build interactive questionnaires that generate complete legal documents, court forms, and letters. No coding required — the template builder uses a visual interface to map questions to document fields. Supports conditional logic, calculations, and multi-document generation from a single interview. Popular with legal aid organizations and solo practitioners for client intake automation.',
  'document_processing',
  NULL,
  NULL,
  'https://www.gavel.io',
  'freemium',
  'Free tier for up to 3 templates; paid plans from $99/month',
  ARRAY['document-automation', 'no-code', 'forms', 'client-intake'],
  FALSE, FALSE, 'curated', 'published',
  'Gavel', 'https://www.gavel.io'
),

-- ═══════════════════════════════════════════
-- CASE MANAGEMENT (3 listings)
-- ═══════════════════════════════════════════
(
  'Clio',
  'clio',
  'Cloud-based legal practice management with AI-powered workflows and billing.',
  'Clio is the leading cloud-based legal practice management platform, used by over 150,000 legal professionals. Their AI features include automatic time capture, smart billing suggestions, and workflow automation. Clio Duo, their AI assistant, can draft client communications, summarize case files, and surface relevant precedents. Deep integrations with court filing systems, accounting tools, and communication platforms make it a central hub for modern law practice.',
  'case_management',
  NULL,
  NULL,
  'https://www.clio.com',
  'paid',
  'From $39/user/month (EasyStart) to $129/user/month (Complete)',
  ARRAY['practice-management', 'billing', 'time-tracking', 'cloud'],
  TRUE, TRUE, 'curated', 'published',
  'Clio (Themis Solutions)', 'https://www.clio.com'
),
(
  'Smokeball',
  'smokeball',
  'AI-assisted practice management built for small law firms — automatic time tracking and document management.',
  'Smokeball is a practice management platform designed specifically for small law firms. Its standout feature is automatic time recording — the software tracks every activity (emails, calls, document edits) and logs billable time without lawyers needing to manually enter it. The AI-powered document management system auto-tags and organizes files. Integrates with Microsoft 365, court systems, and accounting platforms.',
  'case_management',
  NULL,
  NULL,
  'https://www.smokeball.com',
  'paid',
  'From $29/user/month',
  ARRAY['small-firm', 'auto-time-tracking', 'document-management', 'microsoft-365'],
  FALSE, TRUE, 'curated', 'published',
  'Smokeball', 'https://www.smokeball.com'
),
(
  'Lex Machina',
  'lex-machina',
  'Legal analytics platform — AI-driven insights on judges, attorneys, parties, and case outcomes.',
  'Lex Machina (a LexisNexis company) provides data-driven litigation analytics. Their AI analyzes millions of court records to surface insights about judge behavior, opposing counsel track records, case timing, damages awarded, and litigation trends. Helps attorneys develop case strategy based on empirical data rather than intuition. Covers patent, antitrust, securities, employment, and commercial litigation.',
  'case_management',
  NULL,
  NULL,
  'https://lexmachina.com',
  'paid',
  'Subscription-based — contact for pricing',
  ARRAY['litigation-analytics', 'judge-analytics', 'data-driven', 'strategy'],
  FALSE, TRUE, 'curated', 'published',
  'LexisNexis / Lex Machina', 'https://lexmachina.com'
),

-- ═══════════════════════════════════════════
-- CLIENT COMMUNICATION (2 listings)
-- ═══════════════════════════════════════════
(
  'Lawdroid',
  'lawdroid',
  'AI chatbot builder for law firms — automate client intake, FAQs, and lead qualification.',
  'LawDroid provides AI-powered chatbots specifically designed for law firms. The platform lets attorneys build conversational interfaces that handle initial client intake, answer common legal questions, qualify leads, and schedule consultations — all without coding. Chatbots can be embedded on firm websites, social media, and messaging platforms. Built-in compliance features ensure client confidentiality is maintained throughout automated interactions.',
  'client_communication',
  NULL,
  NULL,
  'https://lawdroid.com',
  'freemium',
  'Free for 1 bot; Professional from $99/month',
  ARRAY['chatbot', 'client-intake', 'lead-qualification', 'automation'],
  FALSE, FALSE, 'curated', 'published',
  'LawDroid', 'https://lawdroid.com'
),
(
  'Smith.ai',
  'smith-ai',
  'AI-powered virtual receptionist and chat service for law firms — 24/7 client communication.',
  'Smith.ai combines AI and human receptionists to handle inbound calls, website chats, and appointment scheduling for law firms around the clock. Their AI handles initial screening and common questions, escalating to human operators for complex situations. Integrates with Clio, MyCase, Lawmatics, and most legal CRMs. The platform captures lead information, qualifies potential clients based on your criteria, and books consultations directly into your calendar.',
  'client_communication',
  NULL,
  NULL,
  'https://smith.ai',
  'paid',
  'From $292.50/month for 30 calls',
  ARRAY['virtual-receptionist', 'call-handling', '24-7', 'lead-capture'],
  TRUE, TRUE, 'curated', 'published',
  'Smith.ai', 'https://smith.ai'
),

-- ═══════════════════════════════════════════
-- LEGAL RESEARCH (3 listings)
-- ═══════════════════════════════════════════
(
  'Harvey AI',
  'harvey-ai',
  'Generative AI platform built for legal professionals — research, draft, and analyze with domain-specific AI.',
  'Harvey is a generative AI platform purpose-built for law firms. Trained on legal-specific datasets and fine-tuned with feedback from elite law firms, Harvey can conduct legal research, draft memos, analyze contracts, and prepare regulatory filings. The platform understands legal reasoning, citation formats, and jurisdictional nuances. Used by firms including Allen & Overy (A&O Shearman), PwC, and major corporate legal departments. Harvey emphasizes accuracy and auditability in its outputs.',
  'legal_research',
  NULL,
  NULL,
  'https://www.harvey.ai',
  'contact',
  'Enterprise pricing — firm-wide licensing',
  ARRAY['generative-ai', 'legal-research', 'drafting', 'enterprise'],
  TRUE, TRUE, 'curated', 'published',
  'Harvey AI', 'https://www.harvey.ai'
),
(
  'CoCounsel by Thomson Reuters',
  'cocounsel',
  'AI legal assistant powered by GPT — search case law, summarize documents, draft correspondence.',
  'CoCounsel (originally from CaseText, acquired by Thomson Reuters) is an AI legal assistant that integrates with Westlaw and other Thomson Reuters research tools. It can search and analyze case law, summarize lengthy documents, review contracts for specific provisions, prepare deposition outlines, and draft legal correspondence. The AI is designed to cite sources and flag when it lacks confidence in an answer. Included with Westlaw Precision subscriptions.',
  'legal_research',
  NULL,
  NULL,
  'https://casetext.com/cocounsel',
  'paid',
  'Included with Westlaw Precision; standalone plans available',
  ARRAY['legal-research', 'case-law', 'document-summary', 'westlaw'],
  TRUE, TRUE, 'curated', 'published',
  'Thomson Reuters', 'https://www.thomsonreuters.com'
),
(
  'vLex Vincent AI',
  'vlex-vincent',
  'AI-powered legal research across 130+ jurisdictions — case law, legislation, and secondary sources.',
  'vLex Vincent is an AI legal research assistant that searches across vLex''s database of over 100 million legal documents spanning 130+ jurisdictions. Vincent can find relevant case law, analyze legal questions across multiple jurisdictions simultaneously, and generate research memos with proper citations. Particularly strong for international and comparative law research. The AI ranks results by relevance and explains why each case or statute matters to your query.',
  'legal_research',
  NULL,
  NULL,
  'https://vlex.com/vincent-ai',
  'paid',
  'From $99/month for solo practitioners',
  ARRAY['multi-jurisdiction', 'case-law', 'international-law', 'ai-research'],
  FALSE, TRUE, 'curated', 'published',
  'vLex', 'https://vlex.com'
),

-- ═══════════════════════════════════════════
-- BILLING & TIME (2 listings)
-- ═══════════════════════════════════════════
(
  'TimeSolv',
  'timesolv',
  'Cloud-based legal billing with AI-powered time entry suggestions and invoice automation.',
  'TimeSolv is a legal billing platform that uses AI to suggest time entries based on calendar events, emails, and document activity. The platform generates professional invoices, tracks trust accounts (IOLTA), and provides financial reporting dashboards. AI features include automatic narrative suggestions for time entries, duplicate detection, and billing rate optimization recommendations. Integrates with Clio, QuickBooks, and major legal practice management tools.',
  'billing_time',
  NULL,
  NULL,
  'https://www.timesolv.com',
  'paid',
  'From $34.95/user/month',
  ARRAY['billing', 'time-tracking', 'invoicing', 'trust-accounting'],
  FALSE, FALSE, 'curated', 'published',
  'TimeSolv', 'https://www.timesolv.com'
),
(
  'Billing AI by Checkbox',
  'billing-ai-checkbox',
  'AI-powered legal billing review — flag billing guideline violations before submission.',
  'Checkbox''s Billing AI automatically reviews legal invoices against client billing guidelines before they are submitted. The AI catches common violations — block billing, excessive hours, unauthorized tasks, rate discrepancies, and vague descriptions — that would otherwise result in write-offs or client disputes. Reduces billing rejections by up to 70% according to Checkbox. Works as a review layer on top of existing billing systems.',
  'billing_time',
  NULL,
  NULL,
  'https://www.checkbox.ai/billing',
  'contact',
  'Enterprise pricing — contact for demo',
  ARRAY['billing-review', 'compliance', 'guidelines', 'write-off-reduction'],
  FALSE, FALSE, 'curated', 'published',
  'Checkbox AI', 'https://www.checkbox.ai'
),

-- ═══════════════════════════════════════════
-- COMPLIANCE (2 listings)
-- ═══════════════════════════════════════════
(
  'Relativity',
  'relativity',
  'AI-powered eDiscovery and compliance platform — find, review, and produce relevant documents at scale.',
  'Relativity is the industry-standard eDiscovery platform used by law firms, corporations, and government agencies. Their AI-powered analytics (aiR for Review) can classify documents, identify privileged material, detect key concepts, and prioritize the most relevant documents for human review. Processes millions of documents, emails, chat messages, and multimedia files. The platform supports the entire EDRM workflow from data collection through production. Available as cloud (RelativityOne) or on-premises.',
  'compliance',
  NULL,
  NULL,
  'https://www.relativity.com',
  'paid',
  'Volume-based pricing — starts around $18/GB/month',
  ARRAY['ediscovery', 'document-review', 'ai-classification', 'privilege-review'],
  FALSE, TRUE, 'curated', 'published',
  'Relativity', 'https://www.relativity.com'
),
(
  'Diligent Compliance',
  'diligent-compliance',
  'AI-driven regulatory compliance monitoring — track regulatory changes and assess impact on your practice.',
  'Diligent provides AI-powered compliance management tools that monitor regulatory changes across jurisdictions and automatically assess their impact on your organization or clients. The platform tracks obligations, generates compliance reports, and alerts teams to upcoming deadlines. Particularly useful for firms advising financial services, healthcare, and energy clients where regulatory landscapes shift constantly. The AI connects regulatory changes to specific client obligations and internal policies.',
  'compliance',
  NULL,
  NULL,
  'https://www.diligent.com',
  'contact',
  'Enterprise pricing — contact for demo',
  ARRAY['regulatory-monitoring', 'compliance-tracking', 'risk-assessment', 'obligations'],
  FALSE, FALSE, 'curated', 'published',
  'Diligent Corporation', 'https://www.diligent.com'
),

-- ═══════════════════════════════════════════
-- GENERAL (2 listings)
-- ═══════════════════════════════════════════
(
  'Anthropic Claude for Legal',
  'claude-legal',
  'General-purpose AI assistant with strong legal reasoning — research, drafting, analysis, and summarization.',
  'Claude by Anthropic is a general-purpose AI assistant that excels at legal tasks thanks to its strong reasoning capabilities and long context window (up to 200K tokens). Law firms use Claude for drafting memos, analyzing lengthy contracts, summarizing depositions, and conducting preliminary legal research. The extended context window means it can process entire case files or multi-hundred-page contracts in a single conversation. Available via API for custom integrations or through the Claude.ai interface.',
  'general',
  NULL,
  NULL,
  'https://www.anthropic.com/claude',
  'freemium',
  'Free tier available; Pro from $20/month; Team $30/user/month; API usage-based',
  ARRAY['general-ai', 'long-context', 'drafting', 'research', 'analysis'],
  FALSE, TRUE, 'curated', 'published',
  'Anthropic', 'https://www.anthropic.com'
),
(
  'Supabase Legal MCP Server',
  'supabase-legal-mcp',
  'Open-source MCP server template for connecting AI assistants to legal databases on Supabase.',
  'An open-source MCP (Model Context Protocol) server template designed for law firms running their data on Supabase. Provides AI assistants with secure, read-only access to case records, client data, document metadata, and billing information stored in PostgreSQL. Includes Row Level Security integration so the AI only sees data the authenticated user is authorized to access. Template includes common legal data schemas and can be customized for any firm''s database structure.',
  'general',
  'https://github.com/supabase-community/supabase-mcp',
  'npx @anthropic-ai/create-mcp supabase-legal',
  'https://github.com/supabase-community/supabase-mcp',
  'free',
  'Open source — MIT license',
  ARRAY['mcp-server', 'open-source', 'supabase', 'database', 'self-hosted'],
  FALSE, FALSE, 'curated', 'published',
  'Supabase Community', 'https://supabase.com'
);
