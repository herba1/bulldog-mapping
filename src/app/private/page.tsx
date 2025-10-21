import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { logout } from "../login/actions";

export default async function PrivatePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <>
      <p>Hello {data.user.email} </p>
      <form>
        <button className="bg-red-400" formAction={logout}>
          Log Out
        </button>
      </form>
    </>
  );
}
