import { AuthForm } from "./auth-form";
import { AuthHashHandler } from "./auth-hash-handler";

export default function AuthPage() {
  return (
    <div className="relative w-full max-w-md">
      <AuthHashHandler />
      <AuthForm />
    </div>
  );
}
