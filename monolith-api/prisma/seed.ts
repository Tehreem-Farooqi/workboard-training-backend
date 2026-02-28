import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Organizations
  const org1 = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
    },
  });

  const org2 = await prisma.organization.upsert({
    where: { slug: 'tech-innovators' },
    update: {},
    create: {
      name: 'Tech Innovators',
      slug: 'tech-innovators',
    },
  });

  console.log('✅ Organizations created');

  // Create Users
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      organizationId: org1.id,
    },
  });

  const moderatorUser = await prisma.user.upsert({
    where: { email: 'moderator@acme.com' },
    update: {},
    create: {
      email: 'moderator@acme.com',
      passwordHash,
      firstName: 'Moderator',
      lastName: 'User',
      role: UserRole.MODERATOR,
      organizationId: org1.id,
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@acme.com' },
    update: {},
    create: {
      email: 'user@acme.com',
      passwordHash,
      firstName: 'Regular',
      lastName: 'User',
      role: UserRole.USER,
      organizationId: org1.id,
    },
  });

  const techUser = await prisma.user.upsert({
    where: { email: 'user@techinnovators.com' },
    update: {},
    create: {
      email: 'user@techinnovators.com',
      passwordHash,
      firstName: 'Tech',
      lastName: 'User',
      role: UserRole.USER,
      organizationId: org2.id,
    },
  });

  console.log('✅ Users created');

  // Create Sample Events
  await prisma.event.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Annual Tech Conference 2026',
      description: 'Join us for the biggest tech conference of the year!',
      location: 'San Francisco, CA',
      startDate: new Date('2026-06-15T09:00:00Z'),
      endDate: new Date('2026-06-17T18:00:00Z'),
      status: 'APPROVED',
      organizationId: org1.id,
      createdById: adminUser.id,
    },
  });

  await prisma.event.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      title: 'Team Building Workshop',
      description: 'A fun day of team building activities',
      location: 'Office',
      startDate: new Date('2026-03-20T10:00:00Z'),
      endDate: new Date('2026-03-20T16:00:00Z'),
      status: 'SUBMITTED',
      organizationId: org1.id,
      createdById: regularUser.id,
    },
  });

  await prisma.event.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      title: 'Innovation Summit',
      description: 'Exploring the future of technology',
      location: 'Virtual',
      startDate: new Date('2026-04-10T14:00:00Z'),
      endDate: new Date('2026-04-10T17:00:00Z'),
      status: 'DRAFT',
      organizationId: org2.id,
      createdById: techUser.id,
    },
  });

  console.log('✅ Events created');

  console.log('\n📊 Seed Summary:');
  console.log(`Organizations: ${await prisma.organization.count()}`);
  console.log(`Users: ${await prisma.user.count()}`);
  console.log(`Events: ${await prisma.event.count()}`);

  console.log('\n🔐 Test Credentials:');
  console.log('Admin: admin@acme.com / Password123!');
  console.log('Moderator: moderator@acme.com / Password123!');
  console.log('User: user@acme.com / Password123!');
  console.log('Tech User: user@techinnovators.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
