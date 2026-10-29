#!/usr/bin/env node
/**
 * AgriFair Secure Admin Provisioning CLI
 * Securely provisions the first administrator or promotes an existing authorized user.
 * 
 * Usage:
 *   node scripts/provision-admin.js list
 *   node scripts/provision-admin.js promote <email>
 *   node scripts/provision-admin.js create <email> <name> <phone> <password>
 */

const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const AuditLog = require('../src/models/AuditLog');

const printUsage = () => {
  console.log(`
AgriFair Secure Admin Provisioning Tool
======================================
Usage:
  node scripts/provision-admin.js list
    List all provisioned administrators (safe view without hashes)

  node scripts/provision-admin.js promote <email>
    Promotes an existing user to the admin role securely

  node scripts/provision-admin.js create <email> <name> <phone> <password>
    Creates a new administrative user with strict password validation

Rules:
  - Password must be at least 8 characters long, contain uppercase, lowercase, number, and special character.
  - Never run with hardcoded default credentials.
  - No client registration endpoint can grant admin privileges.
`);
};

const validatePasswordComplexity = (password) => {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number.';
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return 'Password must contain at least one special character.';
  }
  return null;
};

const main = async () => {
  const args = process.argv.slice(2);
  const command = (args[0] || '').toLowerCase();

  if (!['list', 'promote', 'create'].includes(command)) {
    printUsage();
    process.exit(1);
  }

  const conn = await connectDB();

  try {
    if (command === 'list') {
      const admins = await User.find({ role: 'admin' })
        .select('name email phone status createdAt')
        .lean();

      console.log(`\nFound ${admins.length} registered administrator(s):`);
      if (admins.length === 0) {
        console.log('  No administrators currently provisioned.');
      } else {
        admins.forEach((admin, idx) => {
          console.log(`  [${idx + 1}] ${admin.name} (${admin.email}) - Status: ${admin.status} - Created: ${new Date(admin.createdAt).toISOString()}`);
        });
      }
      console.log('');
    } else if (command === 'promote') {
      const email = (args[1] || '').toLowerCase().trim();
      if (!email) {
        console.error('Error: Please provide the email of the user to promote.');
        process.exit(1);
      }

      const user = await User.findOne({ email });
      if (!user) {
        console.error(`Error: User with email '${email}' was not found in the database.`);
        process.exit(1);
      }

      if (user.role === 'admin') {
        console.log(`Notice: User '${email}' is already an administrator.`);
        process.exit(0);
      }

      const previousRole = user.role;
      user.role = 'admin';
      await user.save();

      // Log in AuditLog
      await AuditLog.create({
        actor: user._id,
        actorEmail: user.email,
        action: 'admin_provisioned_cli',
        targetType: 'User',
        targetId: user._id.toString(),
        details: {
          method: 'cli_promote',
          previousRole,
          newRole: 'admin',
          note: 'User promoted to administrator via secure CLI provisioning script'
        },
        ip: '127.0.0.1 (CLI)'
      });

      console.log(`\n Success: User '${user.name}' (${user.email}) has been successfully promoted from '${previousRole}' to 'admin'.`);
    } else if (command === 'create') {
      const email = (args[1] || '').toLowerCase().trim();
      const name = (args[2] || '').trim();
      const phone = (args[3] || '').trim();
      const password = args[4] || '';

      if (!email || !name || !phone || !password) {
        console.error('Error: All arguments required: <email> <name> <phone> <password>');
        process.exit(1);
      }

      const passError = validatePasswordComplexity(password);
      if (passError) {
        console.error(`Error: ${passError}`);
        process.exit(1);
      }

      const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
      if (existingUser) {
        console.error(`Error: A user with this email or phone already exists.`);
        process.exit(1);
      }

      const newAdmin = await User.create({
        name,
        email,
        phone,
        password,
        role: 'admin',
        isEmailVerified: true,
        status: 'active'
      });

      await AuditLog.create({
        actor: newAdmin._id,
        actorEmail: newAdmin.email,
        action: 'admin_created_cli',
        targetType: 'User',
        targetId: newAdmin._id.toString(),
        details: {
          method: 'cli_create',
          note: 'New administrator account provisioned via secure CLI script'
        },
        ip: '127.0.0.1 (CLI)'
      });

      console.log(`\n Success: Administrator '${name}' (${email}) has been securely provisioned.`);
    }
  } catch (error) {
    console.error('CLI Provisioning Error:', error.message);
    process.exit(1);
  } finally {
    await conn.disconnect();
  }
};

main();
