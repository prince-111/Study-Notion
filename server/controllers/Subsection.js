// Import necessary modules
const Section = require("../models/Section");


// Create a new sub-section for a given section
exports.createSubSection = async (req, res) => {
  try {
    // Extract necessary information from the request body
    const { sectionId, title, description } = req.body;
    const video = req.files.video;

    // Check if all necessary fields are provided
    if (!sectionId || !title || !description || !video) {
      return res
        .status(404)
        .json({ success: false, message: "All Fields are Required" });
    }
    console.log(video);

    // Update the corresponding section with the newly created sub-section
    const updatedSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
    //   { $push: { subSection: SubSectionDetails._id } },
      { new: true }
    ).populate("subSection");

    // Return the updated section in the response
    return res.status(200).json({ success: true, data: updatedSection });
  } catch (error) {
    // Handle any errors that may occur during the process
    console.error("Error creating new sub-section:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
