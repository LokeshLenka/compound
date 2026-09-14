"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const authSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type AuthForm = z.infer<typeof authSchema>;

function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: AuthForm) {
    setServerError(null);
    const supabase = getSupabaseBrowserClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) return setServerError(error.message);
      router.push(next);
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      ...values,
      options: {
        emailRedirectTo: `${location.origin}/dashboard`,
        data: { full_name: values.email.split("@")[0] },
      },
    });
    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        return setServerError(
          "That email is already registered — try signing in instead.",
        );
      }
      return setServerError(error.message);
    }
    if (data.session) {
      router.push(next);
      router.refresh();
    } else {
      setSentEmail(true);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${mode}-email`}>Email</Label>
        <Input
          id={`${mode}-email`}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register("email")}
          className="min-h-10"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${mode}-password`}>Password</Label>
        <Input
          id={`${mode}-password`}
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          {...register("password")}
          className="min-h-10"
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {serverError && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}
      {sentEmail && (
        <p className="rounded-2xl border bg-muted px-3 py-2 text-sm">
          Check your inbox to confirm your email, then sign in.
        </p>
      )}

      <Button type="submit" className="w-full min-h-10" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        {mode === "signin" ? "Sign in" : "Create account"}
      </Button>
    </form>
  );
}

function LoginCard() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Compound
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Habits, tasks, notes &amp; diary in one private place.
          </p>
        </div>
      </div>

      <Card className="w-full border-border/60">
        <CardContent className="pt-6">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 gap-1 rounded-full p-1">
              <TabsTrigger value="signin" className="rounded-full">
                Sign in
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full">
                Create account
              </TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-5">
              <AuthForm mode="signin" />
            </TabsContent>
            <TabsContent value="signup" className="mt-5">
              <AuthForm mode="signup" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        Your data stays private to your account.
        <br />
        Built for the long game — daily streaks, quiet notes, one journal.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh flex-1 items-center justify-center p-4">
      <Suspense fallback={null}>
        <LoginCard />
      </Suspense>
    </main>
  );
}
