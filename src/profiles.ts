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
  installScript: string;        // shell command to run to install (or URL if not installable)
  installable: boolean;         // true = AdvTerm can install it; false = show URL only
  slashCommands: SlashCommand[];
  usage?: UsageConfig;
}

// ── Claude Code ──────────────────────────────────────────────────────────────

export const CLAUDE_PROFILE: ProfileDef = {
  id: 'claude',
  name: 'Claude Code',
  launchCommand: 'claude',
  installCommand: 'claude',
  authFilePath: '~/.claude/.credentials.json',
  installScript: 'npm install -g @anthropic-ai/claude-code',
  installable: true,
  slashCommands: [
    { cmd: '/help',        desc: 'Show available commands' },
    { cmd: '/clear',       desc: 'Clear conversation history' },
    { cmd: '/compact',     desc: 'Compact conversation to save context' },
    { cmd: '/status',      desc: 'Show account & session status' },
    { cmd: '/usage',       desc: 'Show token usage & limits' },
    { cmd: '/cost',        desc: 'Show session cost' },
    { cmd: '/memory',      desc: 'Manage memory files' },
    { cmd: '/model',       desc: 'Switch AI model' },
    { cmd: '/config',      desc: 'Open configuration' },
    { cmd: '/init',        desc: 'Initialize project CLAUDE.md' },
    { cmd: '/review',      desc: 'Review current diff' },
    { cmd: '/pr-comments', desc: 'View PR review comments' },
    { cmd: '/permissions', desc: 'Manage tool permissions' },
    { cmd: '/doctor',      desc: 'Run health checks' },
    { cmd: '/vim',         desc: 'Toggle vim keybindings' },
    { cmd: '/terminal',    desc: 'Open terminal in Claude' },
    { cmd: '/login',       desc: 'Log in to Claude' },
    { cmd: '/logout',      desc: 'Log out of Claude' },
    { cmd: '/exit',        desc: 'Exit Claude Code' },
  ],
  usage: {
    program: 'claude',
    args: ['-p', '/usage'],
    sessionRegex: /Current session:\s*(\d+)%\s*used[^·]*·\s*resets\s*(.+?)(?:\n|$)/,
    weekRegex:    /Current week[^:]*:\s*(\d+)%\s*used[^·]*·\s*resets\s*(.+?)(?:\n|$)/,
  },
};

// ── Antigravity CLI (Google — replaces Gemini CLI June 18 2026) ──────────────

export const ANTIGRAVITY_PROFILE: ProfileDef = {
  id: 'antigravity',
  name: 'Antigravity',
  launchCommand: 'antigravity',
  installCommand: 'antigravity',
  authFilePath: '~/.gemini/antigravity/installation_id',
  installScript: 'npm install -g @google/antigravity-cli',
  installable: true,
  slashCommands: [
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
  ],
};

// ── OpenCode ──────────────────────────────────────────────────────────────────

export const OPENCODE_PROFILE: ProfileDef = {
  id: 'opencode',
  name: 'OpenCode',
  launchCommand: 'opencode',
  installCommand: 'opencode',
  authFilePath: '~/.local/share/opencode/auth.json',
  installScript: 'curl -fsSL https://opencode.ai/install | bash',
  installable: true,
  slashCommands: [
    { cmd: '/help',    desc: 'Show available commands' },
    { cmd: '/model',   desc: 'Switch AI model' },
    { cmd: '/clear',   desc: 'Clear session' },
    { cmd: '/compact', desc: 'Compact conversation' },
    { cmd: '/share',   desc: 'Share session' },
    { cmd: '/export',  desc: 'Export session data' },
    { cmd: '/exit',    desc: 'Exit OpenCode' },
  ],
};

// ── Codex CLI (OpenAI) ────────────────────────────────────────────────────────

export const CODEX_PROFILE: ProfileDef = {
  id: 'codex',
  name: 'Codex CLI',
  launchCommand: 'codex',
  installCommand: 'codex',
  installScript: 'npm install -g @openai/codex',
  installable: true,
  slashCommands: [
    { cmd: '/help',    desc: 'Show available commands' },
    { cmd: '/clear',   desc: 'Clear conversation' },
    { cmd: '/model',   desc: 'Switch AI model' },
    { cmd: '/login',   desc: 'Log in to OpenAI' },
    { cmd: '/logout',  desc: 'Log out' },
    { cmd: '/doctor',  desc: 'Run health checks' },
    { cmd: '/mcp',     desc: 'Manage MCP servers' },
    { cmd: '/exit',    desc: 'Exit Codex CLI' },
  ],
};

// ── Aider ─────────────────────────────────────────────────────────────────────

export const AIDER_PROFILE: ProfileDef = {
  id: 'aider',
  name: 'Aider',
  launchCommand: 'aider',
  installCommand: 'aider',
  authFilePath: '~/.aider.conf.yml',
  installScript: 'pip install aider-chat',
  installable: true,
  slashCommands: [
    { cmd: '/add',       desc: 'Add files to context' },
    { cmd: '/drop',      desc: 'Remove files from context' },
    { cmd: '/ls',        desc: 'List files in context' },
    { cmd: '/diff',      desc: 'Show last diff' },
    { cmd: '/commit',    desc: 'Commit changes' },
    { cmd: '/undo',      desc: 'Undo last commit' },
    { cmd: '/clear',     desc: 'Clear conversation' },
    { cmd: '/model',     desc: 'Switch AI model' },
    { cmd: '/architect', desc: 'Switch to architect mode' },
    { cmd: '/ask',       desc: 'Ask without editing' },
    { cmd: '/code',      desc: 'Request code changes' },
    { cmd: '/run',       desc: 'Run a shell command' },
    { cmd: '/map',       desc: 'Show repo map' },
    { cmd: '/tokens',    desc: 'Show token usage' },
    { cmd: '/help',      desc: 'Show available commands' },
    { cmd: '/exit',      desc: 'Exit Aider' },
  ],
};

// ── Plandex ───────────────────────────────────────────────────────────────────

export const PLANDEX_PROFILE: ProfileDef = {
  id: 'plandex',
  name: 'Plandex',
  launchCommand: 'plandex',
  installCommand: 'plandex',
  authFilePath: '~/.plandex-home',
  installScript: 'curl -sL https://plandex.ai/install.sh | bash',
  installable: true,
  slashCommands: [
    { cmd: 'tell',    desc: 'Tell Plandex what to do' },
    { cmd: 'apply',   desc: 'Apply pending changes' },
    { cmd: 'diff',    desc: 'Show pending diff' },
    { cmd: 'rewind',  desc: 'Rewind to previous state' },
    { cmd: 'reject',  desc: 'Reject pending changes' },
    { cmd: 'status',  desc: 'Show plan status' },
    { cmd: 'log',     desc: 'Show plan history' },
    { cmd: 'help',    desc: 'Show help' },
  ],
};

// ── Goose (Block) ─────────────────────────────────────────────────────────────

export const GOOSE_PROFILE: ProfileDef = {
  id: 'goose',
  name: 'Goose',
  launchCommand: 'goose',
  installCommand: 'goose',
  installScript: 'curl -fsSL https://github.com/block/goose/releases/latest/download/install.sh | bash',
  installable: true,
  slashCommands: [
    { cmd: '/help',     desc: 'Show available commands' },
    { cmd: '/clear',    desc: 'Clear conversation' },
    { cmd: '/exit',     desc: 'Exit Goose' },
    { cmd: '/provider', desc: 'Switch AI provider' },
    { cmd: '/model',    desc: 'Switch AI model' },
    { cmd: '/toolkit',  desc: 'Manage toolkits' },
  ],
};

// ── Registry ──────────────────────────────────────────────────────────────────

export const PROFILES: Record<string, ProfileDef> = {
  claude:      CLAUDE_PROFILE,
  antigravity: ANTIGRAVITY_PROFILE,
  opencode:    OPENCODE_PROFILE,
  codex:       CODEX_PROFILE,
  aider:       AIDER_PROFILE,
  plandex:     PLANDEX_PROFILE,
  goose:       GOOSE_PROFILE,
};
