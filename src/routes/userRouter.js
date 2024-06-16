import { Router } from "express";
import { SignUp,cookieAuth,LogIn,LogOut, getProfile, followUser, checkFollow, getFollow, setProfile, setAbout, updatePassword, UserProfileImage, UserCoverImage,} from "../controller/userController.js";
import { upload } from "../middleware/multer.js";
import { checkRating, deleteReview, getAllReview, setComments, setRating } from "../controller/reviewController.js";

const router=Router();

router.route("/user-profile-img").post(upload.single('userProfile'),UserProfileImage)
router.route("/user-cover-img").post(upload.single('userCover'),UserCoverImage)
router.route("/signup").post(SignUp);
router.route("/check-auth").get(cookieAuth);
router.route("/login").post(LogIn);
router.route("/set-profile").put(setProfile);
router.route("/set-about").put(setAbout);
router.route("/update-password").put(updatePassword);
router.route("/follow").post(followUser);
router.route("/check-follow").get(checkFollow);
// router.route("/set-rating").post(setRating);
// router.route("/set-comment").post(setComments);
// router.route("/delete-review").delete(deleteReview);
// router.route("/get-all-review").get(getAllReview);
// router.route("/check-rating").get(checkRating);
router.route("/logout").get(LogOut);
router.route("/get-profile/:username").get(getProfile);
router.route("/get-follow/:id").get(getFollow);
export default router;