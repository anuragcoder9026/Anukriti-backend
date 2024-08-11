import { Router } from "express";

import { PostCoverImage, addLibrary, allSeriesTitle, checkLibrary, deleteDraft, deletePost, fetchPostInfo, getAllPost, getAllSeries, getCategory, getDraft, getPostRating, getSeriesCategory, nextPost, postAuth, publishPost, saveDeaft, seriesChapter, seriesContent } from "../controller/postController.js";

import { upload } from "../middleware/multer.js";
import { checkLike, checkRating, deleteLike, deleteReview, getAllReview, getComment,searchPostsByTitleAndGenre, setComments, setLike, setRating } from "../controller/reviewController.js";

const router=Router();
router.route("/publish-post").post(upload.single('coverImage'),publishPost);
router.route("/post-cover-img").post(upload.single('postCover'),PostCoverImage)
router.route("/save-draft").post(saveDeaft);
router.route("/get-draft").get(getDraft);
router.route("/delete-draft/:draftId").delete(deleteDraft);
router.route("/library/:postId").post(addLibrary);
router.route("/get-post-by-query").get(searchPostsByTitleAndGenre);
router.route("/content-info").get(fetchPostInfo);
router.route("/auth-post").get(postAuth);
router.route("/get-all-post").get(getAllPost);
router.route("/get-all-series").get(getAllSeries);
router.route("/check-library").get(checkLibrary);
router.route("/delete-post/:postId").delete(deletePost);
router.route("/get-series-title").get(allSeriesTitle);
router.route("/series-chapters/:postId").get(seriesChapter);
router.route("/series-content/:seriesId").get(seriesContent);
router.route("/read-next/:postId").get(nextPost);
router.route("/get-category/:category").get(getCategory);
router.route("/get-series-category/:category").get(getSeriesCategory);
router.route("/set-rating").post(setRating);
router.route("/set-comment").post(setComments);
router.route("/set-like").post(setLike);
router.route("/delete-like").post(deleteLike);
router.route("/check-like").get(checkLike);
router.route("/delete-review").delete(deleteReview);
router.route("/get-all-review").get(getAllReview);
router.route("/check-rating").get(checkRating);
router.route("/get-comment").get(getComment);
router.route("/get-rating").get(getPostRating);
export default router;
