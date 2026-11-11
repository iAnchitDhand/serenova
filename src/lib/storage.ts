export type MoodLevel = 1 | 2 | 3 | 4 | 5

export interface MoodEntry {
  id: string
  timestamp: number
  mood: MoodLevel
  transcript: string
  aiResponse: string
  moodLabel: string
}

export interface BreathingSession {
  id: string
  timestamp: number
  durationSeconds: number
  type: 'box' | '478' | 'calm'
}

export interface PomodoroSession {
  id: string
  timestamp: number
  workMinutes: number
  breakMinutes: number
  cycleCount: number
}

const MOOD_KEY = 'serenova_moods'
const BREATHING_KEY = 'serenova_breathing'
const POMODORO_KEY = 'serenova_pomodoro'

export function saveMoodEntry(entry: MoodEntry): void {
  const existing = getMoodEntries()
  existing.unshift(entry)
  // Keep last 90 entries
  const trimmed = existing.slice(0, 90)
  try {
    localStorage.setItem(MOOD_KEY, JSON.stringify(trimmed))
  } catch {
    // Storage full — ignore
  }
}

export function getMoodEntries(): MoodEntry[] {
  try {
    const raw = localStorage.getItem(MOOD_KEY)
    if (!raw) return []
    return JSON.parse(raw) as MoodEntry[]
  } catch {
    return []
  }
}

export function saveBreathingSession(session: BreathingSession): void {
  const existing = getBreathingSessions()
  existing.unshift(session)
  const trimmed = existing.slice(0, 30)
  try {
    localStorage.setItem(BREATHING_KEY, JSON.stringify(trimmed))
  } catch { }
}

export function getBreathingSessions(): BreathingSession[] {
  try {
    const raw = localStorage.getItem(BREATHING_KEY)
    if (!raw) return []
    return JSON.parse(raw) as BreathingSession[]
  } catch {
    return []
  }
}

export function savePomodoroSession(session: PomodoroSession): void {
  const existing = getPomodoroSessions()
  existing.unshift(session)
  const trimmed = existing.slice(0, 60)
  try {
    localStorage.setItem(POMODORO_KEY, JSON.stringify(trimmed))
  } catch { }
}

export function getPomodoroSessions(): PomodoroSession[] {
  try {
    const raw = localStorage.getItem(POMODORO_KEY)
    if (!raw) return []
    return JSON.parse(raw) as PomodoroSession[]
  } catch {
    return []
  }
}

export const MOOD_LABELS: Record<MoodLevel, string> = {
  1: 'Struggling',
  2: 'Low',
  3: 'Okay',
  4: 'Good',
  5: 'Wonderful',
}

export const MOOD_COLORS: Record<MoodLevel, string> = {
  1: '#c4736a',
  2: '#d4a53a',
  3: '#8aafc8',
  4: '#6a9160',
  5: '#4a6741',
}

export const MOOD_EMOJIS: Record<MoodLevel, string> = {
  1: '🌧',
  2: '🌥',
  3: '⛅',
  4: '🌤',
  5: '☀️',
}

/** Infer mood from LLM response sentiment (simple heuristic) */
export function inferMoodFromText(text: string): MoodLevel {
  const lower = text.toLowerCase()
  const negativeStrong = ['hopeless', 'devastated', 'broken', 'can\'t go on', 'worthless', 'terrible', 'awful', 'horrible', 'miserable', 'crying', 'crisis']
  const negative = ['sad', 'anxious', 'stressed', 'worried', 'tired', 'exhausted', 'down', 'difficult', 'hard', 'struggling']
  const neutral = ['okay', 'alright', 'fine', 'neutral', 'mixed', 'unsure', 'uncertain']
  const positive = ['good', 'happy', 'hopeful', 'calm', 'better', 'relieved', 'grateful']
  const positiveStrong = ['great', 'wonderful', 'amazing', 'joyful', 'excited', 'fantastic', 'excellent', 'love', 'thriving']

  if (negativeStrong.some(w => lower.includes(w))) return 1
  if (negative.some(w => lower.includes(w))) return 2
  if (positiveStrong.some(w => lower.includes(w))) return 5
  if (positive.some(w => lower.includes(w))) return 4
  if (neutral.some(w => lower.includes(w))) return 3
  return 3
}

export function formatDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function getWeeklyMoodAverage(entries: MoodEntry[]): number {
  const week = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recent = entries.filter(e => e.timestamp > week)
  if (recent.length === 0) return 0
  return recent.reduce((sum, e) => sum + e.mood, 0) / recent.length
}