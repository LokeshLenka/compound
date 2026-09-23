"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { profileKeys, fetchProfile } from "@/lib/supabase/fetchers"
import type { Profile } from "@/lib/types"

export { profileKeys }

export function useProfile() {
  const q = useQuery({
    queryKey: profileKeys.all,
    queryFn: () => fetchProfile(getSupabaseBrowserClient()),
  })
  return q
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Pick<Profile, "full_name" | "theme">>) => {
      const { data, error } = await getSupabaseBrowserClient()
        .from("profiles")
        .update(patch)
        .eq("id", (await getSupabaseBrowserClient().auth.getUser()).data.user!.id)
        .select()
        .single()
      if (error) throw error
      return data as Profile
    },
    onSuccess: (p) => qc.setQueryData(["profile"], p),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ current, next }: { current: string; next: string }) => {
      const supabase = getSupabaseBrowserClient()
      const check = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user!.email!,
        password: current,
      })
      if (check.error) throw new Error("Current password is incorrect")
      const { error } = await supabase.auth.updateUser({ password: next })
      if (error) throw error
    },
    onSuccess: async () => {
      await getSupabaseBrowserClient().auth.signOut()
    },
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: async () => {
      const { error } = await getSupabaseBrowserClient().functions.invoke(
        "delete-account",
        { method: "POST" },
      )
      if (error) throw error
    },
    onSuccess: async () => {
      qc.clear()
      await getSupabaseBrowserClient().auth.signOut()
      router.push("/login")
      router.refresh()
    },
  })
}