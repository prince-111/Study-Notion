// Helper function to convert total seconds to a human-readable duration format
function convertSecondsToDuration(totalSeconds) {
  // Calculate the number of hours
  const hours = Math.floor(totalSeconds / 3600);
  // Calculate the number of minutes remaining after hours are accounted for
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  // Calculate the number of seconds remaining after hours and minutes are accounted for
  const seconds = Math.floor((totalSeconds % 3600) % 60);

  // Return the duration in hours and minutes if hours are greater than 0
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
    // Return the duration in minutes and seconds if hours are 0 but minutes are greater than 0
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
    // Return the duration in seconds if both hours and minutes are 0
  } else {
    return `${seconds}s`;
  }
}

// Export the convertSecondsToDuration function to make it available for other modules
module.exports = {
  convertSecondsToDuration,
};
