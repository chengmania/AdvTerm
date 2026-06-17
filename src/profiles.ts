// AdvTerm — AI tool profile definitions
// Author: chengmania KC3SMW
// Adding a new AI tool = add a new entry here. No other code changes needed.

export interface SlashCommand {
  cmd: string;
  desc: string;
}

export interface UsageConfig {
  program: string;
  args: string[];
  sessionRegex: RegExp;
  weekRegex: RegExp;
}

export interface ProfileDef {
  id: string;
  name: string;
  launchCommand: string;
  installCommand: string;       // binary checked with `which`
  authFilePath?: string;        // file whose existence = authenticated
  installInstructions: string;  // command the user runs to install this tool
  slashCommands: SlashCommand[];
  usage?: UsageConfig;
}

// ── Claude Code ──────────────────────────────────────────────────────────────

const CLAUDE_COMMANDS: SlashCommand[] = [
  { cmd: '/help',          desc: 'Show available commands' },
  { cmd: '/clear',         desc: 'Clear conversation history' },
  { cmd: '/compact',       desc: 'Compact conversation to save context' },
  { cmd: '/status',        desc: 'Show account & session status' },
  { cmd: '/usage',         desc: 'Show token usage & limits' },
  { cmd: '/cost',          desc: 'Show session cost' },
  { cmd: '/memory',        desc: 'Manage memory files' },
  { cmd: '/model',         desc: 'Switch AI model' },
  { cmd: '/config',        desc: 'Open configuration' },
  { cmd: '/init',          desc: 'Initialize project CLAUDE.md' },
  { cmd: '/review',        desc: 'Review current diff' },
  { cmd: '/pr-comments',   desc: 'View PR review comments' },
  { cmd: '/permissions',   desc: 'Manage tool permissions' },
  { cmd: '/doctor',        desc: 'Run health checks' },
  { cmd: '/vim',           desc: 'Toggle vim keybindings' },
  { cmd: '/terminal',      desc: 'Open terminal in Claude' },
  { cmd: '/login',         desc: 'Log in to Claude' },
  { cmd: '/logout',        desc: 'Log out of Claude' },
  { cmd: '/exit',          desc: 'Exit Claude Code' },
];

export const CLAUDE_PROFILE: ProfileDef = {
  id: 'claude',
  name: 'Claude Code',
  launchCommand: 'claude',
  installCommand: 'claude',
  authFilePath: '~/.claude/.credentials.json',
  installInstructions: 'npm install -g @anthropic-ai/claude-code',
  slashCommands: CLAUDE_COMMANDS,
  usage: {
    program: 'claude',
    args: ['-p', '/usage'],
    sessionRegex: /Current session:\s*(\d+)%\s*used[^·]*·\s*resets\s*(.+?)(?:\n|$)/,
    weekRegex:    /Current week[^:]*:\s*(\d+)%\s*used[^·]*·\s*resets\s*(.+?)(?:\n|$)/,
  },
};

// ── Antigravity CLI (Google — replaces Gemini CLI as of June 18 2026) ────────

const ANTIGRAVITY_COMMANDS: SlashCommand[] = [
  { cmd: '/help',       desc: 'Show available commands' },
  { cmd: '/clear',      desc: 'Clear conversation history' },
  { cmd: '/model',      desc: 'Switch AI model' },
  { cmd: '/tools',      desc: 'List available tools' },
  { cmd: '/memory',     desc: 'Manage memory' },
  { cmd: '/theme',      desc: 'Change color theme' },
  { cmd: '/stats',      desc: 'Show session statistics' },
  { cmd: '/about',      desc: 'About Antigravity CLI' },
  { cmd: '/mcp',        desc: 'Manage MCP servers' },
  { cmd: '/extensions', desc: 'Manage extensions' },
  { cmd: '/chat',       desc: 'Switch chat mode' },
  { cmd: '/quit',       desc: 'Exit Antigravity CLI' },
];

export const ANTIGRAVITY_PROFILE: ProfileDef = {
  id: 'antigravity',
  name: 'Antigravity',
  launchCommand: 'antigravity',
  installCommand: 'antigravity',
  authFilePath: '~/.gemini/antigravity/installation_id',
  installInstructions: 'See https://antigravity.google/product/antigravity-cli',
  slashCommands: ANTIGRAVITY_COMMANDS,
};

// ── OpenCode ──────────────────────────────────────────────────────────────────

const OPENCODE_COMMANDS: SlashCommand[] = [
  { cmd: '/help',    desc: 'Show available commands' },
  { cmd: '/model',   desc: 'Switch AI model' },
  { cmd: '/clear',   desc: 'Clear session' },
  { cmd: '/compact', desc: 'Compact conversation' },
  { cmd: '/share',   desc: 'Share session' },
  { cmd: '/export',  desc: 'Export session data' },
  { cmd: '/exit',    desc: 'Exit OpenCode' },
];

export const OPENCODE_PROFILE: ProfileDef = {
  id: 'opencode',
  name: 'OpenCode',
  launchCommand: 'opencode',
  installCommand: 'opencode',
  authFilePath: '~/.local/share/opencode/auth.json',
  installInstructions: 'curl -fsSL https://opencode.ai/install | bash',
  slashCommands: OPENCODE_COMMANDS,
};

// ── Registry ──────────────────────────────────────────────────────────────────

export const PROFILES: Record<string, ProfileDef> = {
  claude:      CLAUDE_PROFILE,
  antigravity: ANTIGRAVITY_PROFILE,
  opencode:    OPENCODE_PROFILE,
};
