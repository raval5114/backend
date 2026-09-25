const Role = require("../models/role.model");
const Privilege = require("../models/privilege.model");

const authorize = (requiredPrivilege) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "AUTHENTICATION_REQUIRED",
          message: "Authentication required",
        });
      }

      const role = await Role.findOne({
        roleId: req.user.roleId,
      });

      if (!role) {
        return res.status(403).json({
          success: false,
          error: "ROLE_NOT_FOUND",
          message: "User role does not exist",
        });
      }

      // Admin can access everything
      if (role.roleName === "admin") {
        req.userRole = role;
        return next();
      }

      const privilege = await Privilege.findOne({
        privilegeName: requiredPrivilege,
      });

      if (!privilege) {
        return res.status(500).json({
          success: false,
          error: "PRIVILEGE_NOT_FOUND",
          message: "Required privilege is not configured",
        });
      }

      const hasPrivilege =
        role.privilegesId.includes(
          privilege.privilegeId
        );

      if (!hasPrivilege) {
        return res.status(403).json({
          success: false,
          error: "ROLE_VIOLATION",
          message:
            "Your role does not have permission to perform this operation",
        });
      }

      req.userRole = role;
      req.userPrivilege = privilege;

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "AUTHORIZATION_ERROR",
        message: error.message,
      });
    }
  };
};

module.exports = authorize;