import { login, signup } from "./actions";
import { loginWithGoogle } from "./actions";

export default function LoginPage() {
  return (
    <>
      <form>
        <label htmlFor="email">Email:</label>
        <input id="email" name="email" type="email" required />
        <label htmlFor="password">Password:</label>
        <input id="password" name="password" type="password" required />
        <button formAction={login}>Log in</button>
        <button formAction={signup}>Sign up</button>
      </form>
      <form>
        <button className="px-6 py-4 text-white outline-1 outline-neutral-400 bg-blue-400" formAction={loginWithGoogle}>Sign in with google</button>
      </form>
    </>
  );
}
