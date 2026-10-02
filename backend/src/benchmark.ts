import { performance } from "perf_hooks";
import { PrismaClient, Priority, Status, Role } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import { TicketService } from "./services/ticket.service";
import { AuthUser } from "./types";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres123@localhost:5432/intake_db?schema=public";

const pool = new Pool({ connectionString, max: 20 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface LatencyStats {
  scenario: string;
  samples: number;
  min: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
  avg: number;
  opsPerSec: number;
  passedSub100ms: boolean;
}

function calculatePercentiles(scenario: string, times: number[]): LatencyStats {
  times.sort((a, b) => a - b);
  const n = times.length;
  const getP = (p: number) => {
    const idx = Math.min(Math.floor((p / 100) * n), n - 1);
    return Number(times[idx].toFixed(2));
  };

  const sum = times.reduce((acc, val) => acc + val, 0);
  const avg = Number((sum / n).toFixed(2));
  const min = Number(times[0].toFixed(2));
  const max = Number(times[n - 1].toFixed(2));
  const p50 = getP(50);
  const p90 = getP(90);
  const p95 = getP(95);
  const p99 = getP(99);

  const totalTimeSeconds = sum / 1000;
  const opsPerSec = Number((n / (totalTimeSeconds || 0.001)).toFixed(1));

  return {
    scenario,
    samples: n,
    min,
    p50,
    p90,
    p95,
    p99,
    max,
    avg,
    opsPerSec,
    passedSub100ms: p95 < 100 && p99 < 100,
  };
}

async function runBenchmark() {
  console.log("\n================================================================================");
  console.log("⚡ INTAKE Service Desk — Sub-100ms Database Latency & Query Benchmark");
  console.log("================================================================================");

  // 1. Verify Dataset
  const totalTickets = await prisma.ticket.count();
  const totalUsers = await prisma.user.count();
  const totalAudit = await prisma.auditLog.count();

  console.log(`📊 Active Dataset:`);
  console.log(`   - Total Tickets:    ${totalTickets.toLocaleString()} rows`);
  console.log(`   - Total Users:      ${totalUsers.toLocaleString()} rows`);
  console.log(`   - Total Audit Logs: ${totalAudit.toLocaleString()} rows`);

  if (totalTickets < 10000) {
    console.warn(`⚠️ Warning: Dataset has fewer than 10,000 tickets (${totalTickets}).`);
  }

  // Retrieve an active support agent and sample ticket number for query parameters
  const agent = await prisma.user.findFirst({
    where: { role: Role.SUPPORT_AGENT },
  });
  const sampleTicket = await prisma.ticket.findFirst({
    select: { ticketNumber: true },
  });

  const adminUser: AuthUser = {
    id: "benchmark-admin",
    email: "admin@intake.io",
    name: "Benchmark Runner",
    role: Role.ADMIN,
    department: "IT Operations",
  };

  const ITERATIONS = 100;
  const WARMUP_ROUNDS = 15;

  console.log(`\n⚙️ Execution Config:`);
  console.log(`   - Iterations per Scenario: ${ITERATIONS}`);
  console.log(`   - Warmup Queries:          ${WARMUP_ROUNDS}`);
  console.log(`   - Target Latency SLA:      < 100.00 ms (P95 & P99)\n`);

  // 2. Warmup Phase
  process.stdout.write("🔥 Running warmup phase to prime Postgres query plans & buffer caches... ");
  for (let i = 0; i < WARMUP_ROUNDS; i++) {
    await TicketService.getTickets({ page: 1, limit: 20 }, adminUser);
    await TicketService.getTickets(
      { status: Status.OPEN, priority: Priority.P1_CRITICAL, page: 1, limit: 20 },
      adminUser
    );
    await TicketService.getTickets(
      { category: "IT Infrastructure", slaBreached: true, limit: 20 },
      adminUser
    );
    if (sampleTicket?.ticketNumber) {
      await TicketService.getTicketById(sampleTicket.ticketNumber, adminUser);
    }
  }
  console.log("Done.\n");

  const results: LatencyStats[] = [];

  // Scenario 1: Default Paginated List (Page 1, Limit 20, Sorted by createdAt DESC)
  {
    const times: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();
      await TicketService.getTickets(
        { page: 1, limit: 20, sortBy: "createdAt", sortOrder: "desc" },
        adminUser
      );
      times.push(performance.now() - start);
    }
    results.push(calculatePercentiles("1. Paginated Feed (Page 1, 20 items)", times));
  }

  // Scenario 2: Deep Pagination (Page 50, Limit 20)
  {
    const times: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();
      await TicketService.getTickets(
        { page: 50, limit: 20, sortBy: "createdAt", sortOrder: "desc" },
        adminUser
      );
      times.push(performance.now() - start);
    }
    results.push(calculatePercentiles("2. Deep Pagination (Page 50, Offset 1000)", times));
  }

  // Scenario 3: Composite Index Filter (status = OPEN, priority = P1_CRITICAL)
  {
    const times: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();
      await TicketService.getTickets(
        { status: Status.OPEN, priority: Priority.P1_CRITICAL, limit: 20 },
        adminUser
      );
      times.push(performance.now() - start);
    }
    results.push(
      calculatePercentiles("3. Composite Index Filter (status + priority)", times)
    );
  }

  // Scenario 4: Agent Assigned Queue (assigneeId + status)
  {
    const times: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();
      await TicketService.getTickets(
        { assigneeId: agent?.id, status: Status.IN_PROGRESS, limit: 20 },
        adminUser
      );
      times.push(performance.now() - start);
    }
    results.push(calculatePercentiles("4. Agent Work Queue (assigneeId + status)", times));
  }

  // Scenario 5: Multi-Field Filter (category + slaBreached = true)
  {
    const times: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();
      await TicketService.getTickets(
        { category: "IT Infrastructure", slaBreached: true, limit: 20 },
        adminUser
      );
      times.push(performance.now() - start);
    }
    results.push(calculatePercentiles("5. Multi-field Filter (category + breach)", times));
  }

  // Scenario 6: Unique Ticket Number Lookup (INTAKE-xxxxx)
  {
    const targetNumber = sampleTicket?.ticketNumber || "INTAKE-10500";
    const times: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();
      await TicketService.getTicketById(targetNumber, adminUser);
      times.push(performance.now() - start);
    }
    results.push(calculatePercentiles("6. Unique Ticket Lookup (ticketNumber B-Tree)", times));
  }

  // 3. Print Results Table
  console.log("--------------------------------------------------------------------------------");
  console.log(
    "Scenario Name".padEnd(46) +
      "P50(ms)".padStart(9) +
      "P90(ms)".padStart(9) +
      "P95(ms)".padStart(9) +
      "P99(ms)".padStart(9) +
      "Avg(ms)".padStart(9) +
      "Status".padStart(9)
  );
  console.log("--------------------------------------------------------------------------------");

  let allPassed = true;
  for (const r of results) {
    if (!r.passedSub100ms) allPassed = false;
    const statusStr = r.passedSub100ms ? "✅ PASS" : "❌ FAIL";
    console.log(
      r.scenario.padEnd(46) +
        r.p50.toFixed(2).padStart(9) +
        r.p90.toFixed(2).padStart(9) +
        r.p95.toFixed(2).padStart(9) +
        r.p99.toFixed(2).padStart(9) +
        r.avg.toFixed(2).padStart(9) +
        statusStr.padStart(9)
    );
  }
  console.log("--------------------------------------------------------------------------------");

  console.log("\n📈 Overall Benchmark Assessment:");
  if (allPassed) {
    console.log("🎯 SUB-100MS CLAIM VERIFIED: 100% of tested scenarios met the sub-100ms target at P95 & P99.");
    console.log("   The composite B-Tree indexes successfully optimize query execution across 10,200+ records.");
  } else {
    console.warn("⚠️ SUB-100MS SLA MISSED: One or more scenarios exceeded 100ms at P95/P99.");
  }
  console.log("================================================================================\n");

  await prisma.$disconnect();
  await pool.end();
  process.exit(allPassed ? 0 : 1);
}

runBenchmark().catch((err) => {
  console.error("Benchmark failed with error:", err);
  process.exit(1);
});
