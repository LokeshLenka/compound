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

      <Button
        type="submit"
        className="w-full min-h-10 font-mono tracking-widest"
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        {mode === "signin" ? "ENTER SYSTEM" : "AWAKEN"}
      </Button>
    </form>
  );
}

function LoginCard() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="grid size-12 place-items-center rounded border border-primary/30 bg-primary/10 text-primary shadow-[0_0_18px_rgba(168,85,247,0.35)]">
          <span className="font-mono text-xl">◈</span>
        </div>
        <div>
          <h1 className="font-rajdhani text-3xl font-bold tracking-[0.18em] text-primary text-glow">
            SYSTEM
          </h1>
          <p className="font-mono text-[0.68rem] tracking-[0.18em] text-primary/70">
            AWAKEN — BECOME A HUNTER
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Daily quests, gates & shadows — your Hunter System.
          </p>
        </div>
      </div>

      <Card className="w-full">
        <CardContent className="pt-6">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 gap-1 rounded-md p-1 bg-muted/40 border border-primary/10">
              <TabsTrigger
                value="signin"
                className="rounded-md font-mono text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                SIGN IN
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-md font-mono text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                AWAKEN
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
