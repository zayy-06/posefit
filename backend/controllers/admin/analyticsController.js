const UserModel = require("../../models/userModel");

const getAnalytics = async (req, res) => {
  try {
    const dates = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().slice(0, 10));
    }

    const startOfRange = new Date();
    startOfRange.setDate(startOfRange.getDate() - 6);
    startOfRange.setHours(0, 0, 0, 0);

    // Daily registrations for the last 7 days
    const userStats = await UserModel.aggregate([
      {
        $match: {
          role: "USER",
          createdAt: {
            $gte: startOfRange,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const statsMap = {};

    userStats.forEach((stat) => {
      statsMap[stat._id] = stat.count;
    });

    const analyticsData = dates.map((date) => {
      const dateObject = new Date(date);

      const label = dateObject.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      return {
        date: label,
        registrations: statsMap[date] || 0,
      };
    });

    return res.status(200).json({
      success: true,
      data: analyticsData,
    });
  } catch (error) {
    console.error("Error fetching admin analytics:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching analytics data",
    });
  }
};

module.exports = getAnalytics;