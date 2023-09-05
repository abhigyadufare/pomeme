"use server";

import { revalidatePath } from "next/cache";
import Pomeme from "../models/pomeme.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";

interface Params {
  text: string;
  author: string;
  communityId: string | null;
  path: string;
}

export async function createPomeme({
  text,
  author,
  communityId,
  path,
}: Params) {
  try {
    connectToDB();

    const createdPomeme = await Pomeme.create({
      text,
      author,
      community: null,
    });

    // Update user model
    await User.findByIdAndUpdate(author, {
      $push: { pomemes: createdPomeme._id },
    });

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Error creating pomeme: ${error.message}`);
  }
}

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  connectToDB();

  //Calculate the number of posts to skip
  const skipAmount = (pageNumber - 1) * pageSize;

  // Fetch the posts that have no parents (top-level pomemes...)
  const postsQuery = Pomeme.find({ parentId: { $in: [null, undefined] } })
    .sort({ createdAt: "desc" })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({ path: "author", model: User })
    .populate({
      path: "children",
      populate: {
        path: "author",
        model: User,
        select: "_id name parentId image",
      },
    });

  const totalPostsCount = await Pomeme.countDocuments({
    parentId: { $in: [null, undefined] },
  });

  const posts = await postsQuery.exec();

  const isNext = totalPostsCount > skipAmount + posts.length;

  return { posts, isNext };
}

export async function fetchPomemeById(id: string) {
  connectToDB();

  try {
    const pomeme = await Pomeme.findById(id)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      })
      .populate({
        path: "children",
        populate: [
          {
            path: "author",
            model: User,
            select: "_id id name parentId image",
          },
          {
            path: "children",
            model: Pomeme,
            populate: {
              path: "author",
              model: User,
              select: "_id id name parentId image",
            },
          },
        ],
      })
      .exec();

    return pomeme;
  } catch (error: any) {
    throw new Error(`Error fetching thread: ${error.message}`);
  }
}

export async function addCommentToPomeme(
  pomemeId: string,
  commentText: string,
  userId: string,
  path: string
) {
  connectToDB();

  try {
    //Find the original Pomeme by its ID
    const originalPomeme = await Pomeme.findById(pomemeId);

    if (!originalPomeme) {
      throw new Error("Pomeme not found");
    }

    //Create a new Pomeme with the comment text
    const commentPomeme = new Pomeme({
      text: commentText,
      author: userId,
      parentId: pomemeId,
    });

    //Save the new pomeme
    const savedCommentPomeme = await commentPomeme.save();

    //Update the original pomeme to include the new comment
    originalPomeme.children.push(savedCommentPomeme._id);

    //Save the original Pomeme
    await originalPomeme.save();

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Error adding comment to pomeme: ${error.message}`);
  }
}
