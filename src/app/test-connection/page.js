 import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TestConnectionPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Authentication Required</h1>
        <p>Please sign in to test your connection.</p>
        <a href="/login">Go to Login</a>
      </main>
    );
  }

  const { error: databaseError } = await supabase
    .from("habits")
    .select("id")
    .limit(1);

  return (
    <main
      style={{
        padding: 32,
        fontFamily: "Arial, sans-serif",
        background: "#08090d",
        color: "#f4f4f5",
        minHeight: "100vh",
      }}
    >
      <h1>PHT-APP Connection Test</h1>

      <p>Authentication: Connected</p>

      <p>
        Account: {user.email}
      </p>

      {databaseError ? (
        <>
          <h2>Database Test Failed</h2>
          <pre>{databaseError.message}</pre>
        </>
      ) : (
        <h2>Database Connection Successful!</h2>
      )}
    </main>
  );
}
