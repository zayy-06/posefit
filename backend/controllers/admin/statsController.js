const UserModel = require("../../models/userModel");

const getStats = async (req, res) => {
  try {
    const totalUsers = await UserModel.countDocuments({
      role: "USER",
    });

    const activeToday = await UserModel.countDocuments({
      role: "USER",
      updatedAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    const newUsers = await UserModel.countDocuments({
      role: "USER",
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    });

    const totalProfessionals = await UserModel.countDocuments({
      role: "PROFESSIONAL",
    });

    const verifiedUsers = await UserModel.countDocuments({
      role: "USER",
      isVerified: true,
    });

    const conversionRate =
      totalUsers > 0
        ? Math.round((verifiedUsers / totalUsers) * 100)
        : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeToday,
        newUsers,
        totalProfessionals,
        conversionRate: `${conversionRate}%`,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching dashboard stats",
    });
  }
};

module.exports = getStats;