import { redirect } from "next/navigation";

export default function HomePage() {
  // Automatically redirect to login page
  // This will redirect any access to the root path to /login
  redirect("/login");
}
