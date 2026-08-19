import type { User } from '@/types/user'

export function getUserDisplayName(user: User) {
  return user.displayName?.trim() || user.email
}

export function getUserInitials(user: User) {
  const name = user.displayName?.trim()

  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }

  return user.email.slice(0, 2).toUpperCase()
}
