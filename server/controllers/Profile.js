const { default: mongoose } = require("mongoose");
const CourseProgress = require("../models/CourseProgress");
const Profile = require("../models/Profile"); // Import the Profile model
const User = require("../models/User"); // Import the User model
const Course = require("../models/Course");

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
