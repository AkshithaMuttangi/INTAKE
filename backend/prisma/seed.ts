import { PrismaClient, Role, Priority, Status, AuditAction } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres123@localhost:5432/intake_db?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log("🚀 Starting enterprise seed process for INTAKE Service Desk...");
  const startTime = Date.now();

  // 1. Clean existing records in reverse dependency order
  console.log("🧹 Cleaning existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const saltRounds = 10;
  const commonPasswordHash = await bcrypt.hash("Password123!", saltRounds);

  // 2. Seed Default Users
  console.log("👤 Creating enterprise roles (Admin, Team Lead, Agents, End Users)...");
  
  const admin = await prisma.user.create({
    data: {
      email: "admin@intake.io",
      passwordHash: commonPasswordHash,
      name: "System Administrator",
      role: Role.ADMIN,
      department: "IT Operations",
    },
  });

  const teamLead = await prisma.user.create({
    data: {
      email: "lead@intake.io",
      passwordHash: commonPasswordHash,
      name: "Sarah Jenkins (Lead)",
      role: Role.TEAM_LEAD,
      department: "IT Infrastructure",
    },
  });

  const agentUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: "agent1@intake.io",
        passwordHash: commonPasswordHash,
        name: "Alex Morgan (Infra)",
        role: Role.SUPPORT_AGENT,
        department: "IT Infrastructure",
      },
    }),
    prisma.user.create({
      data: {
        email: "agent2@intake.io",
        passwordHash: commonPasswordHash,
        name: "David Chen (Network)",
        role: Role.SUPPORT_AGENT,
        department: "Network Engineering",
      },
    }),
    prisma.user.create({
      data: {
        email: "agent3@intake.io",
        passwordHash: commonPasswordHash,
        name: "Elena Rostova (SecOps)",
        role: Role.SUPPORT_AGENT,
        department: "Security & Access",
      },
    }),
    prisma.user.create({
      data: {
        email: "agent4@intake.io",
        passwordHash: commonPasswordHash,
        name: "Marcus Brody (Workplace)",
        role: Role.SUPPORT_AGENT,
        department: "Workplace Services",
      },
    }),
    prisma.user.create({
      data: {
        email: "agent5@intake.io",
        passwordHash: commonPasswordHash,
        name: "Priya Patel (DevOps)",
        role: Role.SUPPORT_AGENT,
        department: "DevOps & Cloud",
      },
    }),
  ]);

  const endUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: "user1@intake.io",
        passwordHash: commonPasswordHash,
        name: "Michael Scott",
        role: Role.END_USER,
        department: "Sales & Marketing",
      },
    }),
    prisma.user.create({
      data: {
        email: "user2@intake.io",
        passwordHash: commonPasswordHash,
        name: "Jim Halpert",
        role: Role.END_USER,
        department: "Sales & Marketing",
      },
    }),
    prisma.user.create({
      data: {
        email: "user3@intake.io",
        passwordHash: commonPasswordHash,
        name: "Pam Beesly",
        role: Role.END_USER,
        department: "Product & Design",
      },
    }),
    prisma.user.create({
      data: {
        email: "user4@intake.io",
        passwordHash: commonPasswordHash,
        name: "Dwight Schrute",
        role: Role.END_USER,
        department: "Logistics & Ops",
      },
    }),
    prisma.user.create({
      data: {
        email: "user5@intake.io",
        passwordHash: commonPasswordHash,
        name: "Angela Martin",
        role: Role.END_USER,
        department: "Finance & Accounting",
      },
    }),
  ]);

  console.log(`✅ Seeded ${1 + 1 + agentUsers.length + endUsers.length} enterprise users.`);

  // 3. Generate 10,200 realistic tickets with SLA calculation
  const TOTAL_TICKETS = 10200;
  console.log(`🎫 Generating ${TOTAL_TICKETS} enterprise tickets with composite indexing...`);

  const categories = [
    "IT Infrastructure",
    "Security & Access",
    "Network Engineering",
    "DevOps & Cloud",
    "Workplace Services",
    "Database & Storage",
  ];

  const titleTemplates = [
    "VPN gateway certificate validation failure in region {loc}",
    "Single Sign-On SAML assertion timeout with Okta IDP",
    "PostgreSQL read replica replication lag exceeding 500ms on cluster {id}",
    "Production Kubernetes pod OOMKilled in namespace {ns}",
    "Zero-day security CVE patch application for Linux fleet",
    "Corporate 802.1X wireless authentication handshake errors",
    "AWS IAM role policy audit flagged excessive permissions",
    "Jira data center volume utilization exceeded 85% threshold",
    "Redis cache cluster memory eviction policy threshold breach",
    "Domain controller Kerberos ticket renewal failure in subnet {id}",
    "Customer portal TLS certificate automated renewal failed",
    "CI/CD pipeline runner queue depth exceeding auto-scaling limits",
    "NFS mount stale file handle error on analytics storage array",
    "Zscaler client connector disconnects during video conferencing",
    "Elasticsearch cluster status yellow: unassigned shards in cluster {id}",
  ];

  const descriptions = [
    "Automated monitoring reported recurring anomalies during off-peak synchronization. Investigating network logs and service mesh telemetry.",
    "User reported unexpected disconnects and access denials when attempting authentication from corporate remote devices.",
    "High latency alerts triggered in Datadog. Request queue has reached maximum thread pool capacity. Immediate mitigation required.",
    "Hardware diagnostics indicate degraded SSD performance on primary storage controller. Vendor support ticket logged.",
    "Security compliance scan identified outdated cryptographic cipher suites. Scheduled for immediate remediation during maintenance window.",
  ];

  const agentIds = agentUsers.map((a) => a.id);
  const endUserIds = endUsers.map((u) => u.id);

  const priorities: Priority[] = [
    Priority.P1_CRITICAL,
    Priority.P2_HIGH,
    Priority.P3_MEDIUM,
    Priority.P4_LOW,
  ];

  // SLA Resolution Targets in Hours: P1=4h, P2=8h, P3=24h, P4=48h
  // SLA Response Targets in Hours: P1=1h, P2=2h, P3=4h, P4=8h
  const slaTargetHours: Record<Priority, { response: number; resolve: number }> = {
    [Priority.P1_CRITICAL]: { response: 1, resolve: 4 },
    [Priority.P2_HIGH]: { response: 2, resolve: 8 },
    [Priority.P3_MEDIUM]: { response: 4, resolve: 24 },
    [Priority.P4_LOW]: { response: 8, resolve: 48 },
  };

  const statuses: Status[] = [
    Status.OPEN,
    Status.IN_PROGRESS,
    Status.PENDING_CUSTOMER,
    Status.RESOLVED,
    Status.CLOSED,
  ];

  const now = new Date();
  const sixMonthsAgoMs = now.getTime() - 180 * 24 * 3600 * 1000;

  const BATCH_SIZE = 1000;
  let createdCount = 0;

  // We will build batches of tickets and corresponding audit logs
  for (let b = 0; b < Math.ceil(TOTAL_TICKETS / BATCH_SIZE); b++) {
    const batchTickets = [];
    const currentBatchLimit = Math.min(BATCH_SIZE, TOTAL_TICKETS - createdCount);

    for (let i = 0; i < currentBatchLimit; i++) {
      const ticketNum = createdCount + i + 1001; // e.g. INTAKE-1001 to INTAKE-11200
      const ticketNumber = `INTAKE-${ticketNum}`;

      // Pick priority with distribution: P1=10%, P2=25%, P3=45%, P4=20%
      const randP = Math.random();
      const priority =
        randP < 0.1
          ? Priority.P1_CRITICAL
          : randP < 0.35
          ? Priority.P2_HIGH
          : randP < 0.8
          ? Priority.P3_MEDIUM
          : Priority.P4_LOW;

      // Status distribution: OPEN=20%, IN_PROGRESS=25%, PENDING_CUSTOMER=10%, RESOLVED=30%, CLOSED=15%
      const randS = Math.random();
      const status =
        randS < 0.2
          ? Status.OPEN
          : randS < 0.45
          ? Status.IN_PROGRESS
          : randS < 0.55
          ? Status.PENDING_CUSTOMER
          : randS < 0.85
          ? Status.RESOLVED
          : Status.CLOSED;

      // Realistic creation timestamp over last 180 days
      const createdTimeMs = sixMonthsAgoMs + Math.random() * (now.getTime() - sixMonthsAgoMs);
      const createdAt = new Date(createdTimeMs);

      const target = slaTargetHours[priority];
      const responseDueAt = new Date(createdTimeMs + target.response * 3600 * 1000);
      const resolveDueAt = new Date(createdTimeMs + target.resolve * 3600 * 1000);

      // Determine resolvedAt and slaBreached
      let resolvedAt: Date | null = null;
      let slaBreached = false;

      if (status === Status.RESOLVED || status === Status.CLOSED) {
        // Some tickets resolved on time, some late
        const resolvedDelayHours = Math.random() < 0.85 ? target.resolve * 0.7 : target.resolve * 1.5;
        const resolvedTimeMs = createdTimeMs + resolvedDelayHours * 3600 * 1000;
        resolvedAt = new Date(Math.min(resolvedTimeMs, now.getTime()));
        if (resolvedAt.getTime() > resolveDueAt.getTime()) {
          slaBreached = true;
        }
      } else {
        // For active tickets, if current time > resolveDueAt, it is breached
        if (now.getTime() > resolveDueAt.getTime()) {
          slaBreached = true;
        }
      }

      // Assignee: 15% of OPEN tickets unassigned; others assigned to support agents
      const assigneeId =
        status === Status.OPEN && Math.random() < 0.25
          ? null
          : agentIds[Math.floor(Math.random() * agentIds.length)];

      const creatorId = endUserIds[Math.floor(Math.random() * endUserIds.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];

      const titleTemplate = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
      const title = titleTemplate
        .replace("{loc}", ["US-East", "US-West", "EU-Central", "AP-South"][Math.floor(Math.random() * 4)])
        .replace("{id}", String(Math.floor(Math.random() * 900 + 100)))
        .replace("{ns}", ["payments", "auth", "gateway", "analytics"][Math.floor(Math.random() * 4)]);

      const description = descriptions[Math.floor(Math.random() * descriptions.length)];

      batchTickets.push({
        id: `ticket-seed-${ticketNum}`,
        ticketNumber,
        title,
        description,
        priority,
        status,
        category,
        creatorId,
        assigneeId,
        slaBreached,
        responseDueAt,
        resolveDueAt,
        resolvedAt,
        createdAt,
        updatedAt: resolvedAt || createdAt,
      });
    }

    // Insert tickets in bulk
    await prisma.ticket.createMany({
      data: batchTickets,
      skipDuplicates: true,
    });

    createdCount += batchTickets.length;
    process.stdout.write(`  ... seeded ${createdCount}/${TOTAL_TICKETS} tickets\r`);
  }

  console.log(`\n✅ Finished bulk ticket creation: ${createdCount} tickets in database.`);

  // 4. Seed Audit Logs for sample of tickets to demonstrate full immutable traceability
  console.log("📜 Generating realistic immutable audit trails for tickets...");
  const sampleTickets = await prisma.ticket.findMany({
    take: 1200,
    orderBy: { createdAt: "desc" },
  });

  const auditLogBatch = [];
  for (const t of sampleTickets) {
    // Initial creation log
    auditLogBatch.push({
      ticketId: t.id,
      performedById: t.creatorId,
      action: AuditAction.TICKET_CREATED,
      oldValue: null,
      newValue: `Ticket created with priority ${t.priority} and category ${t.category}`,
      timestamp: t.createdAt,
    });

    if (t.assigneeId) {
      auditLogBatch.push({
        ticketId: t.id,
        performedById: teamLead.id,
        action: AuditAction.REASSIGNMENT,
        oldValue: "Unassigned",
        newValue: `Assigned to agent ID: ${t.assigneeId}`,
        timestamp: new Date(t.createdAt.getTime() + 15 * 60 * 1000),
      });
    }

    if (t.status !== Status.OPEN) {
      auditLogBatch.push({
        ticketId: t.id,
        performedById: t.assigneeId || admin.id,
        action: AuditAction.STATUS_CHANGE,
        oldValue: Status.OPEN,
        newValue: t.status,
        timestamp: new Date(t.createdAt.getTime() + 45 * 60 * 1000),
      });
    }
  }

  // Insert audit logs in chunks
  for (let i = 0; i < auditLogBatch.length; i += 1000) {
    await prisma.auditLog.createMany({
      data: auditLogBatch.slice(i, i + 1000),
    });
  }
  console.log(`✅ Seeded ${auditLogBatch.length} immutable audit logs.`);

  // 5. Seed sample comments
  console.log("💬 Generating sample ticket conversation comments...");
  const recentTickets = sampleTickets.slice(0, 100);
  const commentsBatch = [];
  for (const t of recentTickets) {
    commentsBatch.push({
      ticketId: t.id,
      authorId: t.creatorId,
      content: "Hello team, attaching relevant diagnostic logs. Please review urgently.",
      isInternalOnly: false,
      createdAt: new Date(t.createdAt.getTime() + 10 * 60 * 1000),
    });

    if (t.assigneeId) {
      commentsBatch.push({
        ticketId: t.id,
        authorId: t.assigneeId,
        content: "Investigating the issue. Root cause analysis underway with network infrastructure team.",
        isInternalOnly: false,
        createdAt: new Date(t.createdAt.getTime() + 30 * 60 * 1000),
      });

      // Internal note
      commentsBatch.push({
        ticketId: t.id,
        authorId: t.assigneeId,
        content: "Internal note: upstream gateway returned HTTP 504. Checking circuit breaker configuration.",
        isInternalOnly: true,
        createdAt: new Date(t.createdAt.getTime() + 35 * 60 * 1000),
      });
    }
  }

  await prisma.comment.createMany({
    data: commentsBatch,
  });
  console.log(`✅ Seeded ${commentsBatch.length} comments.`);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`🎉 Seeding completed successfully in ${durationSec}s!`);
}

seed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
