const Profile = require("../models/Profile"); // Import the Profile model
const User = require("../models/User"); // Import the User model

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
