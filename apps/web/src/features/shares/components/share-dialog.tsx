import { useEffect, useState } from 'react'
import {
  ChevronDownIcon,
  CopyIcon,
  GlobeIcon,
  LockIcon,
  XIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Input } from '@/shared/ui/input'
import { Skeleton } from '@/shared/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { getApiErrorMessage } from '@/lib/api-error'
import { SHARE_RESOURCE_TYPE, type ShareTarget } from '@/types/share'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'
import { SHARE_ERRORS } from '../constants/share.errors'
import { useResourceShares } from '../hooks/use-resource-shares'
import { useShareMutations } from '../hooks/use-share-mutations'

type ShareDialogProps = {
  target: ShareTarget | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareDialog({ target, open, onOpenChange }: ShareDialogProps) {
  const shares = useResourceShares(
    target?.resourceType,
    target?.resourceId,
    open && Boolean(target),
  )
  const mutations = useShareMutations(target?.resourceType, target?.resourceId)
  const currentUser = useCurrentUser(open)
  const [emailInput, setEmailInput] = useState('')

  useEffect(() => {
    if (!open) {
      setEmailInput('')
    }
  }, [open])

  const publicLink = shares.data?.publicLink
  const shareUrl =
    publicLink?.enabled && publicLink.token
      ? `${window.location.origin}/share/${publicLink.token}`
      : null

  async function handleInvite() {
    const emails = parseEmails(emailInput)
    if (emails.length === 0) {
      toast.error('Add at least one email address')
      return
    }
    await mutations.invite.mutateAsync(emails)
    setEmailInput('')
  }

  async function handleCopy() {
    if (!shareUrl) {
      return
    }
    await copyText(shareUrl)
  }

  async function handleCopyInviteUrl() {
    const url = inviteeUrl(target)
    if (!url) {
      return
    }
    await copyText(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share {target?.name ?? 'item'}</DialogTitle>
          <DialogDescription>
            Invite people who already have an account, or turn on a view-only
            link.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={emailInput}
            onChange={(event) => setEmailInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleInvite()
              }
            }}
            placeholder="Add emails, separated by commas"
            autoComplete="off"
          />
          <Button
            type="button"
            onClick={() => void handleInvite()}
            disabled={mutations.invite.isPending || !emailInput.trim()}
          >
            Share
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!target}
            onClick={() => void handleCopyInviteUrl()}
          >
            <CopyIcon />
            Copy URL
          </Button>
        </div>

        {shares.isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : shares.isError ? (
          <p className="text-sm text-muted-foreground">
            {getApiErrorMessage(shares.error, SHARE_ERRORS.LOAD_FAILED)}
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                People with access
              </p>
              <ul className="space-y-1">
                {currentUser.data ? (
                  <li className="flex items-center gap-2 rounded-lg px-1 py-1.5">
                    <PersonAvatar
                      name={currentUser.data.displayName}
                      email={currentUser.data.email}
                      avatarUrl={currentUser.data.avatarUrl}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {currentUser.data.displayName ?? currentUser.data.email}{' '}
                        <span className="font-normal text-muted-foreground">
                          (you)
                        </span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Owner
                      </p>
                    </div>
                  </li>
                ) : null}
                {shares.data?.users.map((user) => (
                  <li
                    key={user.id}
                    className="flex items-center gap-2 rounded-lg px-1 py-1.5"
                  >
                    <PersonAvatar
                      name={user.displayName}
                      email={user.email}
                      avatarUrl={user.avatarUrl}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {user.displayName ?? user.email}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email} · Viewer
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${user.email ?? 'person'}`}
                      disabled={mutations.revoke.isPending}
                      onClick={() => mutations.revoke.mutate(user.id)}
                    >
                      <XIcon />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground">
                General access
              </p>
              <div className="flex items-start gap-2">
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  {publicLink?.enabled ? (
                    <GlobeIcon className="size-4" />
                  ) : (
                    <LockIcon className="size-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between"
                        disabled={mutations.setLink.isPending}
                      >
                        {publicLink?.enabled
                          ? 'Anyone with the link'
                          : 'Restricted'}
                        <ChevronDownIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      <DropdownMenuRadioGroup
                        value={publicLink?.enabled ? 'anyone' : 'restricted'}
                        onValueChange={(value) => {
                          const enabled = value === 'anyone'
                          if (enabled === Boolean(publicLink?.enabled)) {
                            return
                          }
                          void mutations.setLink.mutateAsync(enabled)
                        }}
                      >
                        <DropdownMenuRadioItem value="restricted">
                          Restricted
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="anyone">
                          Anyone with the link
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="text-xs text-muted-foreground">
                    {publicLink?.enabled
                      ? 'Anyone on the internet with the link can view. No sign-in required.'
                      : 'Only people you add can open this. Public links are turned off.'}
                  </p>
                  {shareUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => void handleCopy()}
                    >
                      <CopyIcon />
                      Copy link
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function PersonAvatar({
  name,
  email,
  avatarUrl,
}: {
  name: string | null
  email: string | null
  avatarUrl: string | null
}) {
  const label = (name ?? email ?? '?').slice(0, 1).toUpperCase()

  return (
    <Avatar size="sm">
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
      <AvatarFallback>{label}</AvatarFallback>
    </Avatar>
  )
}

function parseEmails(value: string) {
  const unique = new Set<string>()
  for (const part of value.split(/[\s,;]+/)) {
    const email = part.trim().toLowerCase()
    if (email.includes('@')) {
      unique.add(email)
    }
  }
  return [...unique]
}

function inviteeUrl(target: ShareTarget | null) {
  if (!target) {
    return null
  }

  if (target.resourceType === SHARE_RESOURCE_TYPE.FOLDER) {
    return `${window.location.origin}/folders/${target.resourceId}`
  }

  return `${window.location.origin}${window.location.pathname}`
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success('Link copied')
  } catch {
    toast.error(SHARE_ERRORS.COPY_FAILED)
  }
}
