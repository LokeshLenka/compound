"use client"

import { Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LogOut as LogOutIcon } from "lucide-react"
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useDeleteAccount,
} from "@/features/settings/use-profile"
import { profileSchema, type ProfileFormValues } from "@/lib/schemas"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { QuickAdd } from "@/components/quick-add"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"

function ProfileForm() {
  const { data: profile, isLoading } = useProfile()
  const update = useUpdateProfile()
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: { full_name: profile?.full_name ?? "", theme: "system" },
  })

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />
  }

  async function onSubmit(values: ProfileFormValues) {
    await update.mutateAsync({ full_name: values.full_name })
    router.refresh()
    toast.success("Profile updated")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full-name">Full name</Label>
        <Input id="full-name" placeholder="Your name" {...register("full_name")} />
        {errors.full_name && (
          <p className="text-sm text-destructive">{errors.full_name.message}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={!isDirty || update.isPending}>
          Save
        </Button>
        {update.isPending && <span className="text-sm text-muted-foreground">Saving…</span>}
      </div>
    </form>
  )
}

function SessionSection() {
  const router = useRouter()

  async function signOut() {
    await getSupabaseBrowserClient().auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session</CardTitle>
        <CardDescription>Sign out of the app on this device.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={signOut}>
          <LogOutIcon className="size-4" /> Sign out
        </Button>
      </CardContent>
    </Card>
  )
}

function PasswordForm() {
  const change = useChangePassword()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (next !== confirm) {
      toast.error("New passwords do not match")
      return
    }
    try {
      await change.mutateAsync({ current, next })
      toast.success("Password changed — sign in again with your new password")
      setCurrent("")
      setNext("")
      setConfirm("")
      getSupabaseBrowserClient().auth.signOut()
      window.location.pathname = "/login"
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password")
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="current">Current password</Label>
          <Input
            id="current"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new">New password</Label>
          <Input
            id="new"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm new</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={change.isPending || !current || !next || !confirm}>
        Change password
      </Button>
    </form>
  )
}

function DangerZone() {
  const del = useDeleteAccount()
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive">Delete account…</Button>} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your profile, habits, tasks, notes and diary entries.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel render={<Button variant="outline">Cancel</Button>} />
          <AlertDialogAction
            render={
              <Button variant="destructive" disabled={del.isPending} onClick={() => del.mutate()}>
                {del.isPending ? "Deleting…" : "Yes, delete everything"}
              </Button>
            }
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Settings"
        actions={<QuickAdd />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your display name and email.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-24 w-full" />}>
            <ProfileForm />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Verify your current password, then set a new one (at least 8 characters).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <SessionSection />

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>Permanently remove your account and all data.</CardDescription>
        </CardHeader>
        <CardContent>
          <DangerZone />
        </CardContent>
      </Card>
    </div>
  )
}