const { default: mongoose } = require("mongoose");
const CourseProgress = require("../models/CourseProgress");
const Profile = require("../models/Profile"); // Import the Profile model
const User = require("../models/User"); // Import the User model
const Course = require("../models/Course");
const { uploadImageToCloudinary } = require("../utils/imageUploader");


// Function to update the profile
exports.updateProfile = async (req, res) => {
  try {
    // Destructure and set default values for the fields from the request body
    const {
      firstName = "",
      lastName = "",
      dateOfBirth = "",
      about = "",
      contactNumber = "",
      gender = "",
    } = req.body;

    // Get the user ID from the request (assumed to be set by authentication middleware)
    const id = req.user.id;

    // Find the user details by ID
    const userDetails = await User.findById(id);

    // Find the profile associated with the user
    const profile = await Profile.findById(userDetails.additionalDetails);

    // Update the user's first and last name
    const user = await User.findByIdAndUpdate(id, {
      firstName,
      lastName,
    });

    // Save the updated user details
    await user.save();

    // Update the profile fields with the new values
    profile.dateOfBirth = dateOfBirth;
    profile.about = about;
    profile.contactNumber = contactNumber;
    profile.gender = gender;

    // Save the updated profile
    await profile.save();

    // Find the updated user details and populate the additionalDetails field
    const updatedUserDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();

    // Return a success response with the updated user details
    return res.json({
      success: true,
      message: "Profile updated successfully",
      updatedUserDetails,
    });
  } catch (error) {
    // Log any error that occurs
    console.log(error);
    // Return a server error response
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    // Extract the user's ID from the request object
    const id = req.user.id;
    console.log(id); // Log the user ID for debugging purposes

    // Find the user by their ID in the User collection
    const user = await User.findById({ _id: id });

    // If the user is not found, return a 404 status with an error message
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete the associated profile using the additionalDetails field in the user document
    await Profile.findByIdAndDelete({
      _id: new mongoose.Types.ObjectId(user.additionalDetails),
    });

    // Iterate over the user's courses and remove the user from the studentsEnroled array for each course
    for (const courseId of user.courses) {
      await Course.findByIdAndUpdate(
        courseId,
        { $pull: { studentsEnroled: id } }, // Remove the user ID from the studentsEnroled array
        { new: true } // Return the updated document
      );
    }

    // Delete the user from the User collection
    await User.findByIdAndDelete({ _id: id });

    // Send a success response indicating the user was deleted successfully
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });

    // Delete all course progress documents associated with the user
    await CourseProgress.deleteMany({ userId: id });
  } catch (error) {
    console.log(error); // Log any errors that occur

    // Send a 500 status with an error message if deletion was unsuccessful
    res
      .status(500)
      .json({ success: false, message: "User Cannot be deleted successfully" });
  }
};

exports.getAllUserDetails = async (req, res) => {
  try {
    // Extract the user's ID from the request object
    const id = req.user.id;

    // Find the user by their ID and populate the additionalDetails field
    const userDetails = await User.findById(id)
      .populate("additionalDetails") // Populate the additionalDetails field with related document data
      .exec(); // Execute the query

    console.log(userDetails); // Log the user details for debugging purposes

    // Send a success response with the user data
    res.status(200).json({
      success: true,
      message: "User Data fetched successfully",
      data: userDetails,
    });
  } catch (error) {
    // If an error occurs, send a 500 status with the error message
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateDisplayPicture = async (req, res) => {
  try {
    const displayPicture = req.files.displayPicture;
    const userId = req.user.id;
    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );
    console.log(image);
    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    );
    res.send({
      success: true,
      message: `Image Updated successfully`,
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getEnrolledCourses = async (req, res) => {
  try {
    // Extract user ID from the request object
    const userId = req.user.id;

    // Find the user details including the enrolled courses and nested population of course contents and subsections
    let userDetails = await User.findOne({
      _id: userId,
    })
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        },
      })
      .exec();

    // Convert mongoose document to plain JavaScript object
    userDetails = userDetails.toObject();

    // Initialize variable to store the total number of subsections
    var SubsectionLength = 0;

    // Loop through each course the user is enrolled in
    for (var i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0; // Initialize total duration for the course
      SubsectionLength = 0; // Reset subsection length counter for each course

      // Loop through each content section of the current course
      for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        // Calculate the total duration by summing up the time duration of each subsection
        totalDurationInSeconds += userDetails.courses[i].courseContent[
          j
        ].subSection.reduce(
          (acc, curr) => acc + parseInt(curr.timeDuration),
          0
        );

        // Convert total duration in seconds to a human-readable format and store it in the course object
        userDetails.courses[i].totalDuration = convertSecondsToDuration(
          totalDurationInSeconds
        );

        // Increment subsection length counter
        SubsectionLength +=
          userDetails.courses[i].courseContent[j].subSection.length;
      }

      // Find the progress count for the current course
      let courseProgressCount = await CourseProgress.findOne({
        courseID: userDetails.courses[i]._id,
        userId: userId,
      });

      // Get the number of completed videos for the current course
      courseProgressCount = courseProgressCount?.completedVideos.length;

      // Calculate progress percentage and handle cases with zero subsections
      if (SubsectionLength === 0) {
        userDetails.courses[i].progressPercentage = 100; // If no subsections, progress is 100%
      } else {
        // Calculate progress percentage with two decimal precision
        const multiplier = Math.pow(10, 2);
        userDetails.courses[i].progressPercentage =
          Math.round(
            (courseProgressCount / SubsectionLength) * 100 * multiplier
          ) / multiplier;
      }
    }

    // Check if user details were not found
    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userDetails}`,
      });
    }

    // Send the user's courses data in the response
    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    });
  } catch (error) {
    // Handle any errors that occur during execution
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
