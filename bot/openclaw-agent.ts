import { execSync } from 'child_process';

const TIMEOUT = 25; // seconds

export function openclawAgent(systemPrompt: string, userMessage: string): string {
  // Combine system + user into a single message for openclaw agent
  const fullMessage = `<system_instructions>\n${systemPrompt}\n</system_instructions>\n\nUser message: ${userMessage}`;
  
  // Escape for shell
  const escaped = fullMessage.replace(/'/g, "'\\''");
  
  try {
    const result = execSync(
      `openclaw agent --session-id whatsbot-agent --message '${escaped}' --timeout ${TIMEOUT}`,
      { 
        timeout: (TIMEOUT + 5) * 1000,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );
    return result.trim();
  } catch (err: any) {
    console.error('[OpenClaw Agent] Error:', err.message?.slice(0, 200));
    return '';
  }
}
