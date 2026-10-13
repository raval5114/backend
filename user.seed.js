const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("./models/user.model.js");

dotenv.config();

const users = [
  // =========================
  // ADMINS
  // =========================

  {
    userId: "USR000",
    username: "Hari Rawal",
    email: "hariraval81@gmail.com",
    mobileNo: "9574035114",
    password: "Admin@123",
    roleId: "ROLE_ADMIN",
    isActive: true,
  },
  {
    userId: "USR001",
    username: "Shivangi Raval",
    email: "shivangiraval@gmail.com",
    mobileNo: "7567072470",
    password: "Admin@123",
    roleId: "ROLE_ADMIN",
    isActive: true,
  },{
    userId: "USR002",
    username: "Kashyap Raval",
    email: "kashyapraval@gmail.com",
    mobileNo: "9773184384",
    password: "Admin@123",
    roleId: "ROLE_ADMIN",
    isActive: true,
  }
  ,
  // =========================
  // COACHES
  // =========================

  {
    userId: "USR003",
    username: "coach_aryan",
    email: "aryan.coach@fitlink.com",
    mobileNo: "9876500003",
    password: "Coach@123",
    roleId: "ROLE_COACH",
    isActive: true,
  },
  {
    userId: "USR004",
    username: "coach_rohit",
    email: "rohit.coach@fitlink.com",
    mobileNo: "9876500004",
    password: "Coach@123",
    roleId: "ROLE_COACH",
    isActive: true,
  },
  {
    userId: "USR005",
    username: "coach_vikram",
    email: "vikram.coach@fitlink.com",
    mobileNo: "9876500005",
    password: "Coach@123",
    roleId: "ROLE_COACH",
    isActive: true,
  },
  {
    userId: "USR006",
    username: "coach_raj",
    email: "raj.coach@fitlink.com",
    mobileNo: "9876500006",
    password: "Coach@123",
    roleId: "ROLE_COACH",
    isActive: true,
  },
  {
    userId: "USR007",
    username: "coach_karan",
    email: "karan.coach@fitlink.com",
    mobileNo: "9876500007",
    password: "Coach@123",
    roleId: "ROLE_COACH",
    isActive: true,
  },
  {
    userId: "USR008",
    username: "coach_amit",
    email: "amit.coach@fitlink.com",
    mobileNo: "9876500008",
    password: "Coach@123",
    roleId: "ROLE_COACH",
    isActive: true,
  },
  {
    userId: "USR009",
    username: "coach_sahil",
    email: "sahil.coach@fitlink.com",
    mobileNo: "9876500009",
    password: "Coach@123",
    roleId: "ROLE_COACH",
    isActive: true,
  },
  {
    userId: "USR010",
    username: "coach_neha",
    email: "neha.coach@fitlink.com",
    mobileNo: "9876500010",
    password: "Coach@123",
    roleId: "ROLE_COACH",
    isActive: true,
  },

  // =========================
  // PLAYERS
  // =========================

  {
    userId: "USR011",
    username: "player_rahul",
    email: "rahul.player@fitlink.com",
    mobileNo: "9876500011",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR012",
    username: "player_aarav",
    email: "aarav.player@fitlink.com",
    mobileNo: "9876500012",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR013",
    username: "player_virat",
    email: "virat.player@fitlink.com",
    mobileNo: "9876500013",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR014",
    username: "player_rohan",
    email: "rohan.player@fitlink.com",
    mobileNo: "9876500014",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR015",
    username: "player_krish",
    email: "krish.player@fitlink.com",
    mobileNo: "9876500015",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR016",
    username: "player_aryan",
    email: "aryan.player@fitlink.com",
    mobileNo: "9876500016",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR017",
    username: "player_dev",
    email: "dev.player@fitlink.com",
    mobileNo: "9876500017",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR018",
    username: "player_dhruv",
    email: "dhruv.player@fitlink.com",
    mobileNo: "9876500018",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR019",
    username: "player_yash",
    email: "yash.player@fitlink.com",
    mobileNo: "9876500019",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR020",
    username: "player_ishan",
    email: "ishan.player@fitlink.com",
    mobileNo: "9876500020",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR021",
    username: "player_manav",
    email: "manav.player@fitlink.com",
    mobileNo: "9876500021",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR022",
    username: "player_ved",
    email: "ved.player@fitlink.com",
    mobileNo: "9876500022",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR023",
    username: "player_ayush",
    email: "ayush.player@fitlink.com",
    mobileNo: "9876500023",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR024",
    username: "player_atharv",
    email: "atharv.player@fitlink.com",
    mobileNo: "9876500024",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR025",
    username: "player_hardik",
    email: "hardik.player@fitlink.com",
    mobileNo: "9876500025",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR026",
    username: "player_karan",
    email: "karan.player@fitlink.com",
    mobileNo: "9876500026",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR027",
    username: "player_sahil",
    email: "sahil.player@fitlink.com",
    mobileNo: "9876500027",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR028",
    username: "player_raj",
    email: "raj.player@fitlink.com",
    mobileNo: "9876500028",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR029",
    username: "player_om",
    email: "om.player@fitlink.com",
    mobileNo: "9876500029",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR030",
    username: "player_krunal",
    email: "krunal.player@fitlink.com",
    mobileNo: "9876500030",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR031",
    username: "player_nirav",
    email: "nirav.player@fitlink.com",
    mobileNo: "9876500031",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR032",
    username: "player_mehul",
    email: "mehul.player@fitlink.com",
    mobileNo: "9876500032",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR033",
    username: "player_jenil",
    email: "jenil.player@fitlink.com",
    mobileNo: "9876500033",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR034",
    username: "player_parth",
    email: "parth.player@fitlink.com",
    mobileNo: "9876500034",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR035",
    username: "player_himanshu",
    email: "himanshu.player@fitlink.com",
    mobileNo: "9876500035",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR036",
    username: "player_mihir",
    email: "mihir.player@fitlink.com",
    mobileNo: "9876500036",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR037",
    username: "player_tanmay",
    email: "tanmay.player@fitlink.com",
    mobileNo: "9876500037",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR038",
    username: "player_shrey",
    email: "shrey.player@fitlink.com",
    mobileNo: "9876500038",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR039",
    username: "player_anmol",
    email: "anmol.player@fitlink.com",
    mobileNo: "9876500039",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
  {
    userId: "USR040",
    username: "player_smit",
    email: "smit.player@fitlink.com",
    mobileNo: "9876500040",
    password: "Player@123",
    roleId: "ROLE_PLAYER",
    isActive: true,
  },
];
const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    // Optional: clear existing users before seeding
    await User.deleteMany({});

    const usersWithHashedPasswords = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 12);

        return {
          userId: user.userId,
          username: user.username,
          email: user.email,
          mobileNo: user.mobileNo,
          password: hashedPassword,
          roleId: user.roleId,
          tokenVersion: 0,
          refreshToken: null,
          isActive: user.isActive,
        };
      })
    );

    const createdUsers = await User.insertMany(usersWithHashedPasswords);

    console.log(`Successfully seeded ${createdUsers.length} users`);

    console.log("\nTest credentials:");
    console.log("----------------------------------------");

    users.forEach((user) => {
      console.log(
        `${user.roleId.padEnd(12)} | ${user.email.padEnd(30)} | ${user.password}`
      );
    });

    console.log("----------------------------------------");

    await mongoose.connection.close();

    console.log("MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding users:");
    console.error(error);

    await mongoose.connection.close();
    process.exit(1);
  }
};

seedUsers();