import PomemeCard from "@/components/cards/PomemeCard";
import Comment from "@/components/forms/Comment";
import { fetchPomemeById } from "@/lib/actions/pomeme.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

const Page = async ({ params }: { params: { id: string } }) => {
  if (!params.id) return null;

  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const pomeme = await fetchPomemeById(params.id);

  return (
    <section className="relative">
      <div>
        <PomemeCard
          key={pomeme._id}
          id={pomeme._id}
          currentUserId={user?.id || ""}
          parentId={pomeme.parentId}
          content={pomeme.text}
          author={pomeme.author}
          community={pomeme.community}
          createdAt={pomeme.createdAt}
          comments={pomeme.children}
        />
      </div>

      <div className="mt-7">
        <Comment
          pomemeId={pomeme.id}
          currentUserImg={user.imageUrl}
          currentUserId={JSON.stringify(userInfo._id)}
        />
      </div>

      <div className="mt-10">
        {pomeme.children.map((childItem: any) => (
          <PomemeCard
            key={childItem._id}
            id={childItem._id}
            currentUserId={user?.id || ""}
            parentId={childItem.parentId}
            content={childItem.text}
            author={childItem.author}
            community={childItem.community}
            createdAt={childItem.createdAt}
            comments={childItem.children}
            isComment
          />
        ))}
      </div>
    </section>
  );
};

export default Page;
