const User = require("../models/User");
const Category = require("../models/Category");
const uploadImageToCloudinary = require("../models/imageUploader");
const Course = require("../models/Course");
const { convertSecondsToDuration } = require("../utils/secToDuration");

// Function to create a new course
exports.createCourse = async (req, res) => {
  try {
    // Get user ID from request object
    const userId = req.user.id;

    // Get all required fields from request body
    let {
      courseName,
      courseDescription,
      whatYouWillLearn,
      price,
      tag: _tag,
      category,
      status,
      instructions: _instructions,
    } = req.body;
    // Get thumbnail image from request files
    const thumbnail = req.files.thumbnailImage;

    // Convert the tag and instructions from stringified Array to Array
    const tag = JSON.parse(_tag);
    const instructions = JSON.parse(_instructions);

    console.log("tag", tag);
    console.log("instructions", instructions);

    // Check if any of the required fields are missing
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !tag.length ||
      !thumbnail ||
      !category ||
      !instructions.length
    ) {
      return res.status(400).json({
        success: false,
        message: "All Fields are Mandatory",
      });
    }
    if (!status || status === undefined) {
      status = "Draft";
    }
    // Check if the user is an instructor
    const instructorDetails = await User.findById(userId, {
      accountType: "Instructor",
    });

    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: "Instructor Details Not Found",
      });
    }

    // Check if the tag given is valid
    const categoryDetails = await Category.findById(category);
    if (!categoryDetails) {
      return res.status(404).json({
        success: false,
        message: "Category Details Not Found",
      });
    }
    // Upload the Thumbnail to Cloudinary
    const thumbnailImage = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );
    console.log(thumbnailImage);
    // Create a new course with the given details
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn: whatYouWillLearn,
      price,
      tag,
      category: categoryDetails._id,
      thumbnail: thumbnailImage.secure_url,
      status: status,
      instructions,
    });

    // Add the new course to the User Schema of the Instructor
    await User.findByIdAndUpdate(
      {
        _id: instructorDetails._id,
      },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );
    // Add the new course to the Categories
    const categoryDetails2 = await Category.findByIdAndUpdate(
      { _id: category },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );
    console.log("HEREEEEEEEE", categoryDetails2);
    // Return the new course and a success message
    res.status(200).json({
      success: true,
      data: newCourse,
      message: "Course Created Successfully",
    });
  } catch (error) {
    // Handle any errors that occur during the creation of the course
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create course",
      error: error.message,
    });
  }
};

// Get Course List
exports.getAllCourses = async (req, res) => {
  try {
    // Fetch all courses that have a status of "Published"
    const allCourses = await Course.find(
      { status: "Published" }, // Filter condition: only "Published" courses
      {
        // Fields to be included in the result
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReviews: true,
        studentsEnrolled: true,
      }
    )
      // Populate the "instructor" field with related data
      .populate("instructor")
      // Execute the query
      .exec();

    // Return the fetched courses as a JSON response with a success status
    return res.status(200).json({
      success: true,
      data: allCourses,
    });
  } catch (error) {
    // Log any error that occurs during the process
    console.log(error);
    // Return a 404 status with an error message in case of failure
    return res.status(404).json({
      success: false,
      message: `Can't Fetch Course Data`,
      error: error.message,
    });
  }
};

// Get One Single Course Details
exports.getCourseDetails = async (req, res) => {
  try {
    // Destructure courseId from the request body
    const { courseId } = req.body;

    // Find a course by its ID
    const courseDetails = await Course.findOne({
      _id: courseId, // Filter condition: course ID
    })
      // Populate the "instructor" field and its nested "additionalDetails"
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      // Populate the "category" field
      .populate("category")
      // Populate the "ratingAndReviews" field
      .populate("ratingAndReviews")
      // Populate the "courseContent" field and its nested "subSection"
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      // Execute the query
      .exec();

    // Debugging: Log course details and courseId to the console (commented out)
    // console.log(
    //   "###################################### course details : ",
    //   courseDetails,
    //   courseId
    // );

    // Check if course details are not found or if the result is empty
    if (!courseDetails || !courseDetails.length) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      });
    }

    // Check if the course status is "Draft"
    if (courseDetails.status === "Draft") {
      return res.status(403).json({
        success: false,
        message: `Accessing a draft course is forbidden`,
      });
    }

    // Return the fetched course details as a JSON response with a success status
    return res.status(200).json({
      success: true,
      data: courseDetails,
    });
  } catch (error) {
    // Return a 500 status with an error message in case of failure
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Exporting the getCourseDetails function as an asynchronous function
exports.getCourseDetails = async (req, res) => {
  try {
    // Extracting courseId from the request body
    const { courseId } = req.body;

    // Finding the course details by courseId and populating related fields
    const courseDetails = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor", // Populating instructor field
        populate: {
          path: "additionalDetails", // Populating nested additionalDetails field within instructor
        },
      })
      .populate("category") // Populating category field
      .populate("ratingAndReviews") // Populating ratingAndReviews field
      .populate({
        path: "courseContent", // Populating courseContent field
        populate: {
          path: "subSection", // Populating nested subSection field within courseContent
          select: "-videoUrl", // Excluding videoUrl field from subSection
        },
      })
      .exec(); // Executing the query

    // Checking if courseDetails is not found
    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      });
    }

    // Commented out check for draft status
    // if (courseDetails.status === "Draft") {
    //   return res.status(403).json({
    //     success: false,
    //     message: `Accessing a draft course is forbidden`,
    //   });
    // }

    // Initializing totalDurationInSeconds to accumulate the duration of all subSections
    let totalDurationInSeconds = 0;
    courseDetails.courseContent.forEach(content => {
      content.subSection.forEach(subSection => {
        // Converting subSection timeDuration to seconds and adding to totalDurationInSeconds
        const timeDurationInSeconds = parseInt(subSection.timeDuration);
        totalDurationInSeconds += timeDurationInSeconds;
      });
    });

    // Converting the total duration from seconds to a human-readable format
    const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

    // Sending a successful response with courseDetails and totalDuration
    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
      },
    });
  } catch (error) {
    // Handling any errors that occur during the process
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Edit Course Details
exports.editCourse = async (req, res) => {
  try {
    // Extracting courseId and updates from the request body
    const { courseId } = req.body;
    const updates = req.body;

    // Finding the course by courseId
    const course = await Course.findById(courseId);

    // Checking if course is not found
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // If Thumbnail Image is found in the request, update it
    if (req.files) {
      console.log("thumbnail update");
      const thumbnail = req.files.thumbnailImage;
      const thumbnailImage = await uploadImageToCloudinary(
        thumbnail,
        process.env.FOLDER_NAME
      );
      course.thumbnail = thumbnailImage.secure_url;
    }

    // Update only the fields that are present in the request body
    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        // Parse JSON strings for specific fields
        if (key === "tag" || key === "instructions") {
          course[key] = JSON.parse(updates[key]);
        } else {
          course[key] = updates[key];
        }
      }
    }

    // Save the updated course
    await course.save();

    // Find the updated course with populated fields
    const updatedCourse = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor", // Populate instructor field
        populate: {
          path: "additionalDetails", // Populate nested additionalDetails field within instructor
        },
      })
      .populate("category") // Populate category field
      .populate("ratingAndReviews") // Populate ratingAndReviews field
      .populate({
        path: "courseContent", // Populate courseContent field
        populate: {
          path: "subSection", // Populate nested subSection field within courseContent
        },
      })
      .exec();

    // Send a successful response with the updated course details
    res.json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    // Log the error and send a 500 response in case of an error
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
