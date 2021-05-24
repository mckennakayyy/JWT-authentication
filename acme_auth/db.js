const Sequelize = require('sequelize');
const { STRING } = Sequelize;
const config = {
  logging: false,
};
const JWT = require('jsonwebtoken');
const SECRET = process.env.JWT;
const bcrypt = require('bcrypt');

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/acme_db',
  config
);

const User = conn.define('user', {
  username: STRING,
  password: STRING,
});

User.byToken = async (token) => {
  try {
    const userInfo = await JWT.verify(token, SECRET);
    console.log("userInfo", userInfo)
    if (userInfo) {
      const user = await User.findByPk(userInfo.id);
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  console.log("authenticate")
  const user = await User.findOne({
    where: {
      username
    }
  })
  console.log("user", user)
  const hash = user.password
  const verified = await bcrypt.compare(password, hash)
  if (user && verified) {
    return user.id;
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

// User.prototype.verifyPassword = function (password) {
//   return password === this.password;
// };

User.beforeCreate((user, options) => {

  return bcrypt.hash(user.password, 10)
      .then(hash => {
          user.password = hash;
      })
      .catch(err => { 
          throw new Error(); 
      });
});


// User.beforeCreate(async function(user) {
//   console.log("beforeCreate")
//   const salt = 10;
//   await bcrypt.hash(user.password, salt, function(error, hash) {
//     try {
//       console.log("hash", hash)
//       console.log("password", user.password)
//      user.password = hash
     
//      console.log("after", user.password)
//     } catch (error) { console.error("oops") }
//   })
// })

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw' },
    { username: 'moe', password: 'moe_pw' },
    { username: 'larry', password: 'larry_pw' },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
  },
};
