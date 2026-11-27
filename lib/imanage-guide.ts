// classification: PUBLIC
// Grok Bot (Crack Bot), 2026-11-27, why: Google suggests "connect claude to imanage", "imanage mcp setup",
// "imanage mcp claude", "imanage mcp url" and "imanage mcp tools", and the site had only the iManage Work listing,
// which has no step-by-step setup. Every line below was read today (2026-11-27) on iManage's own help pages listed in
// IMANAGE_GUIDE_SOURCES. The page and its FAQPage schema both render from these strings.

export const IMANAGE_GUIDE_CHECKED = '2026-11-27'

const USER = 'https://docs.imanage.com/ai/mcpserver-user-help/en-US'
const ADMIN = 'https://docs.imanage.com/ai/mcpserver-admin-help/en-US'

export const IMANAGE_GUIDE_SOURCES = [
  { label: 'iManage: Adding MCP connectors for Claude', url: `${USER}/Adding_MCP_connectors_for_Claude.html` },
  { label: 'iManage: Adding iManage connectors for MCP-enabled clients', url: `${USER}/Adding_iManage_connectors_for_MCP-enabled_clients.html` },
  { label: 'iManage: Adding MCP connectors for ChatGPT', url: `${USER}/Adding_MCP_connectors_for_ChatGPT.html` },
  { label: 'iManage: Tools available for each MCP connector', url: `${USER}/Tools_available_for_each_MCP_connector.html` },
  { label: 'iManage: Tools for iManage Work connector', url: `${USER}/Tools_for_iManage_Work_connector.html` },
  { label: 'iManage admin help: Adding the iManage MCP application in iManage Control Center', url: `${ADMIN}/Adding_the_iManage_MCP_application_in_iManage_Control_Center.html` },
  { label: 'iManage admin help: Configuring MCP settings', url: `${ADMIN}/Configuring_MCP_settings.html` },
] as const

export const IMANAGE_GUIDE_LEAD =
  'To connect Claude to iManage Work, an iManage administrator first adds two MCP applications in iManage Control Center. Then you open Claude’s connector directory, choose iManage Work, sign in with your iManage account and select Authorize. The connector starts with read permissions only.'

/** The administrator's part, from the admin help page. */
export const IMANAGE_ADMIN_STEPS = [
  'Sign in to iManage Control Center with admin credentials.',
  'In the left pane, select Settings > Applications, then + Add Application, and search for MCP.',
  'Add iManage MCP Control Center Extension. Under Access, choose All users or name specific users. Without it, the MCP Settings page does not appear.',
  'Add iManage MCP Service. Turn on Allow Refresh Token under Authentication (the expiry is 7 days by default), then choose who has access. This list controls which users can sign in through iManage MCP Server.',
  'Open MCP Settings, accept iManage’s disclaimer, then choose which MCP clients may connect and which tools each access policy allows.',
] as const

/** The user's part in Claude, from "Adding MCP connectors for Claude". */
export const IMANAGE_CLAUDE_STEPS = [
  'In Claude, open the connector settings, from the chat or from your profile settings, and open the list of available connectors. On Team and Enterprise plans an administrator must enable the connector for the organization first.',
  'Search for iManage Work and select it.',
  'Select Connect. Claude sends you to the iManage Work sign-in page.',
  'Sign in with your iManage Work credentials. Only read permissions are offered, and they are selected by default. Select Authorize.',
  'The iManage Work connector is now active in your conversations.',
] as const

/** Connector addresses as iManage prints them. They are MCP endpoints, not web pages, so the page shows them as text. */
export const IMANAGE_CONNECTORS = [
  { name: 'iManage Work', use: 'Documents, workspaces and folders in iManage Work.', url: 'https://cloudimanage.com/mcp/work' },
  { name: 'iManage MCP Search', use: 'Plain-language search across iManage Work content.', url: 'https://cloudimanage.com/mcp/search' },
  { name: 'iManage Insight+', use: 'Knowledge management and finding experts in the firm.', url: 'https://cloudimanage.com/mcp/insightplus' },
  { name: 'iManage Tracker', use: 'Tasks and checklists in iManage workspaces.', url: 'https://cloudimanage.com/mcp/tracker' },
] as const

export const IMANAGE_WORK_READ_TOOLS = [
  'search', 'search_workspaces', 'search_folders', 'fetch', 'get_container_children', 'get_recent_documents',
  'get_recent_workspaces', 'get_document_profile', 'get_document_versions', 'get_rows_from_csv_document',
  'get_workspace_profile', 'get_workspace_templates', 'get_libraries', 'get_user_information', 'list_actions',
] as const

export const IMANAGE_WORK_WRITE_TOOLS = [
  'create_workspace', 'create_folder', 'create_document_relation', 'update_document_profile', 'update_workspace',
  'move_document', 'upload_document',
] as const

export const IMANAGE_GUIDE_FAQS = [
  {
    q: 'What is the iManage MCP server URL?',
    a: 'iManage lists one address per connector: https://cloudimanage.com/mcp/work, /mcp/search, /mcp/insightplus and /mcp/tracker. If your firm uses a custom iManage subdomain, put it in front with a dot, for example https://ajubalaw.cloudimanage.com/mcp/work. Ask your iManage administrator which form your firm uses.',
  },
  {
    q: 'Do I need a paid Claude plan to connect iManage?',
    a: 'iManage says adding an iManage connector by URL, as a custom connector, needs a paid Claude subscription. Its steps for adding iManage Work from Claude’s connector directory do not name a plan, but on Team and Enterprise plans an administrator must enable that connector for the organization.',
  },
  {
    q: 'Why can’t Claude connect to iManage?',
    a: 'iManage says the connector cannot connect unless the iManage MCP Control Center Extension and iManage MCP Service applications are added in iManage Control Center. Your account must be on the MCP Service access list, and a client the administrator has not allowed is flagged for review. Ask your iManage administrator to check all three.',
  },
  {
    q: 'What tools does the iManage Work connector give Claude?',
    a: 'Read tools search, browse and fetch documents, folders and workspaces, and show document profiles and version history. iManage also documents write tools that create workspaces and folders, update profiles, and move or upload documents. Only read tools are available by default; your administrator decides which tools each client may use.',
  },
  {
    q: 'Can I add iManage Search, Insight+ and Tracker too?',
    a: 'Yes, as custom connectors. Add each one by its own URL and sign in with your iManage credentials when asked. iManage says to repeat the steps for each connector you want. In ChatGPT, these three are available only as custom connectors.',
  },
] as const
