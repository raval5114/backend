const Role = require("../models/role.model");
const Privilege = require("../models/privilege.model");

class RoleService {
  async getAllRoles() {
    return await Role.find();
  }

  async getRoleById(roleId) {
    const role = await Role.findOne({
      roleId,
    });

    if (!role) {
      throw new Error("Role not found");
    }

    return role;
  }

  async createRole(roleName) {
    const existingRole = await Role.findOne({
      roleName: roleName.toLowerCase(),
    });

    if (existingRole) {
      throw new Error("Role already exists");
    }

    const roleId =
      `ROLE_${roleName}`
        .toUpperCase()
        .replace(/\s+/g, "_");

    return await Role.create({
      roleId,
      roleName: roleName.toLowerCase(),
      privilegesId: [],
      isSystemRole: false,
    });
  }

  async deleteRole(roleId) {
    const role = await Role.findOne({
      roleId,
    });

    if (!role) {
      throw new Error("Role not found");
    }

    if (role.isSystemRole) {
      throw new Error(
        "System roles cannot be deleted"
      );
    }

    await Role.deleteOne({
      roleId,
    });

    return true;
  }

  async grantPrivilege(roleId, privilegeId) {
    const role = await Role.findOne({
      roleId,
    });

    if (!role) {
      throw new Error("Role not found");
    }

    const privilege = await Privilege.findOne({
      privilegeId,
    });

    if (!privilege) {
      throw new Error("Privilege not found");
    }

    if (role.privilegesId.includes(privilegeId)) {
      throw new Error(
        "Privilege already assigned to role"
      );
    }

    role.privilegesId.push(privilegeId);

    await role.save();

    return role;
  }

  async revokePrivilege(roleId, privilegeId) {
    const role = await Role.findOne({
      roleId,
    });

    if (!role) {
      throw new Error("Role not found");
    }

    if (role.isSystemRole) {
      throw new Error(
        "System role privileges cannot be modified"
      );
    }

    role.privilegesId =
      role.privilegesId.filter(
        (id) => id !== privilegeId
      );

    await role.save();

    return role;
  }
}

module.exports = RoleService;