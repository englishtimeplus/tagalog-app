 
import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";
import { signOut } from "@/server/auth";
import Link from "next/link";
import { UserAvatarMenu } from "@/app/_components/user-avatar-menu";

export default async function Home() {
  const session = await auth();
  console.log(session);

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="text-center">
          {session?.user ? (
            <div className="space-y-4">
              <div className="flex justify-center items-center space-y-2">
                <UserAvatarMenu user={session.user} />
                <h1 className="text-2xl font-bold">
                  Welcome, {session.user.name ?? session.user.email}!
                </h1>
              </div>
           <div className="flex justify-center items-center space-x-4">
              <Link href="/feed" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">공부하러 가기</Link>
              <Link href="/words" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">단어장</Link>
              <Link href="/flashcard" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">플래시카드 </Link> 
              <Link href="/mypage" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">마이페이지</Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">Welcome to Tagalog App</h1>
              <div className="space-x-4">
                <a
                  href="/login"
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Login
                </a>
                <a
                  href="/register"
                  className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  Register
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </HydrateClient>
  );
}
