const Category = require("../models/Category");

// Helper function to get a random integer
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const CategorysDetails = await Category.create({
      name: name,
      description: description,
    });
    console.log(CategorysDetails);
    return res.status(200).json({
      success: true,
      message: "Categorys Created Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: true,
      message: error.message,
    });
  }
};

exports.showAllCategories = async (req, res) => {
  try {
    const allCategorys = await Category.find();
    res.status(200).json({
      success: true,
      data: allCategorys,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.categoryPageDetails = async (req, res) => {
  try {
    // Extract the categoryId from the request body
    const { categoryId } = req.body;

    // Fetch the selected category and its courses with their ratings and reviews
    const selectedCategory = await Category.findById(categoryId)
      .populate({
        path: "courses",
        match: { status: "Published" }, // Only include published courses
        populate: "ratingAndReviews", // Populate ratings and reviews for each course
      })
      .exec();

    console.log("SELECTED COURSE", selectedCategory);

    // Handle the case when the category is not found
    if (!selectedCategory) {
      console.log("Category not found.");
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Handle the case when there are no courses in the selected category
    if (selectedCategory.courses.length === 0) {
      console.log("No courses found for the selected category.");
      return res.status(404).json({
        success: false,
        message: "No courses found for the selected category.",
      });
    }

    // Fetch all categories except the selected one
    const categoriesExceptSelected = await Category.find({
      _id: { $ne: categoryId },
    });

    // Select a random category from the remaining categories
    let differentCategory = await Category.findOne(
      categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
        ._id
    )
      .populate({
        path: "courses",
        match: { status: "Published" }, // Only include published courses
      })
      .exec();

    // Fetch all categories and their published courses
    const allCategories = await Category.find()
      .populate({
        path: "courses",
        match: { status: "Published" }, // Only include published courses
      })
      .exec();

    // Flatten the array of courses from all categories
    const allCourses = allCategories.flatMap(category => category.courses);

    // Sort courses by the number of times they have been sold in descending order
    // and select the top 10 selling courses
    const mostSellingCourses = allCourses
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    // Respond with the data including selected category, a different category,
    // and the top 10 selling courses
    res.status(200).json({
      success: true,
      data: {
        selectedCategory,
        differentCategory,
        mostSellingCourses,
      },
    });
  } catch (error) {
    // Handle any errors that occur during the process
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};