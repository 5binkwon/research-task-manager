import type { BadgeTone } from '../components/ui/Badge'
import type { DueTone } from './format'
import type { ProjectStatus, TaskPriority, TaskStatus } from './data/types'

export const TASK_STATUS_TONE: Record<TaskStatus, BadgeTone> = {
  todo: 'neutral',
  in_progress: 'blue',
  blocked: 'red',
  done: 'green',
}

export const TASK_PRIORITY_TONE: Record<TaskPriority, BadgeTone> = {
  low: 'neutral',
  medium: 'neutral',
  high: 'amber',
  urgent: 'red',
}

export const PROJECT_STATUS_TONE: Record<ProjectStatus, BadgeTone> = {
  active: 'blue',
  on_hold: 'amber',
  completed: 'green',
  archived: 'neutral',
}

export const DUE_TONE: Record<DueTone, BadgeTone> = {
  overdue: 'red',
  soon: 'amber',
  normal: 'neutral',
}
