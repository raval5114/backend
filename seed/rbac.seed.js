const Role = require("../models/role.model");
const Privilege = require("../models/privilege.model");

const privileges = [
  {
    privilegeId: 1,
    privilegeName: "USER_READ",
    description: "View users",
    isSystemPrivilege: true,
  },
  {
    privilegeId: 2,
    privilegeName: "USER_ROLE_ASSIGN",
    description: "Assign roles to users",
    isSystemPrivilege: true,
  },
  {
    privilegeId: 3,
    privilegeName: "USER_ROLE_REVOKE",
    description: "Revoke user roles",
    isSystemPrivilege: true,
  },
  {
    privilegeId: 4,
    privilegeName: "USER_STATUS_UPDATE",
    description: "Activate or deactivate users",
    isSystemPrivilege: true,
  },
  {
    privilegeId: 5,
    privilegeName: "ROLE_READ",
    description: "View roles",
    isSystemPrivilege: true,
  },
  {
    privilegeId: 6,
    privilegeName: "ROLE_CREATE",
    description: "Create roles",
    isSystemPrivilege: true,
  },
  {
    privilegeId: 7,
    privilegeName: "ROLE_DELETE",
    description: "Delete roles",
    isSystemPrivilege: true,
  },
  {
    privilegeId: 8,
    privilegeName: "ROLE_PRIVILEGE_GRANT",
    description: "Grant privileges to roles",
    isSystemPrivilege: true,
  },
  {
    privilegeId: 9,
    privilegeName: "ROLE_PRIVILEGE_REVOKE",
    description: "Revoke privileges from roles",
    isSystemPrivilege: true,
  },
  {
    privilegeId: 10,
    privilegeName: "PRIVILEGE_READ",
    description: "View privileges",
    isSystemPrivilege: true,
  },
  {
    privilegeId: 11,
    privilegeName: "PRIVILEGE_CREATE",
    description: "Create privileges",
    isSystemPrivilege: true,
  },
  {
    privilegeId: 12,
    privilegeName: "PRIVILEGE_DELETE",
    description: "Delete privileges",
    isSystemPrivilege: true,
  },

  // Player permissions
  {
    privilegeId: 20,
    privilegeName: "PLAYER_READ",
    description: "View players",
    isSystemPrivilege: true,
  },
  {
    privilegeId: 21,
    privilegeName: "PLAYER_UPDATE",
    description: "Update player data",
    isSystemPrivilege: true,
  },
  {
    privilegeId: 22,
    privilegeName: "PLAYER_DELETE",
    description: "Delete player",
    isSystemPrivilege: true,
  },
];

const roles = [
  {
    roleId: "ROLE_ADMIN",
    roleName: "admin",

    privilegesId: privileges.map(
      (privilege) => privilege.privilegeId
    ),

    isSystemRole: true,
  },

  {
    roleId: "ROLE_PLAYER",
    roleName: "player",

    privilegesId: [
      20,
      21,
    ],

    isSystemRole: true,
  },

  {
    roleId: "ROLE_COACH",
    roleName: "coach",

    privilegesId: [
      20,
      21,
    ],

    isSystemRole: true,
  },
];

const seedRBAC = async () => {
  try {
    for (const privilege of privileges) {
      await Privilege.updateOne(
        {
          privilegeId: privilege.privilegeId,
        },
        {
          $set: privilege,
        },
        {
          upsert: true,
        }
      );
    }

    for (const role of roles) {
      await Role.updateOne(
        {
          roleId: role.roleId,
        },
        {
          $set: role,
        },
        {
          upsert: true,
        }
      );
    }

    console.log(
      "RBAC data seeded successfully"
    );
  } catch (error) {
    console.error(
      "RBAC seed failed:",
      error.message
    );
  }
};

module.exports = seedRBAC;