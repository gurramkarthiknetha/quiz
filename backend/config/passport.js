const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { User, ROLES, APPROVAL_STATUS } = require("../models");

/**
 * Configure Passport.js with Google OAuth 2.0 Strategy
 * This handles authentication via Google and user creation/lookup
 */

const configurePassport = () => {
  // Serialize user for session (store user ID in session)
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from session (retrieve user from database)
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Configure Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ["profile", "email"],
        // Enable PKCE for additional security
        state: true,
        // Pass request to callback to access session
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // Extract email from profile
          const email =
            profile.emails && profile.emails[0]
              ? profile.emails[0].value
              : null;

          if (!email) {
            return done(new Error("No email found in Google profile"), null);
          }

          // Check if user already exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // Update last login and return existing user
            user.lastLoginAt = new Date();
            await user.save();
            return done(null, user);
          }

          // Check if user exists with this email (from regular registration)
          user = await User.findOne({ email });

          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.authProvider = "google";
            user.isEmailVerified = true;
            user.lastLoginAt = new Date();
            if (!user.avatar && profile.photos && profile.photos[0]) {
              user.avatar = profile.photos[0].value;
            }
            await user.save();
            return done(null, user);
          }

          // Check if email is in admin list
          const isAdminEmail = User.isAdminEmail(email);
          
          // Get role from session (set before OAuth redirect) or default to student
          const pendingRole = req.session?.pendingRole;
          
          // Determine role - admin emails get admin role, otherwise use selected role
          let role;
          if (isAdminEmail) {
            role = ROLES.ADMIN;
          } else if (pendingRole === 'faculty') {
            role = ROLES.FACULTY;
          } else {
            role = ROLES.STUDENT;
          }
          
          // Clear pending role from session
          if (req.session?.pendingRole) {
            delete req.session.pendingRole;
          }
          
          // Determine approval status
          const approvalStatus = User.getInitialApprovalStatus(role);

          // Create new user
          const newUser = await User.create({
            name: profile.displayName,
            email: email,
            googleId: profile.id,
            authProvider: "google",
            avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : "",
            role: role,
            approvalStatus: approvalStatus,
            isEmailVerified: true, // Google emails are verified
            lastLoginAt: new Date(),
          });

          return done(null, newUser);
        } catch (error) {
          console.error("Google OAuth Error:", error);
          return done(error, null);
        }
      }
    )
  );

  return passport;
};

module.exports = configurePassport;
