import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const initialAgentTypes = [
  {
    name: "Developer",
    description: "Full-stack software development, code generation, architecture design, debugging, and technical implementation",
    icon: "Code",
    capabilities: JSON.stringify(["coding", "debugging", "architecture", "testing", "deployment", "code_review"]),
    color: "#3b82f6"
  },
  {
    name: "DevOps",
    description: "Infrastructure automation, CI/CD pipelines, deployment strategies, monitoring, scaling, and system optimization",
    icon: "Server",
    capabilities: JSON.stringify(["infrastructure", "automation", "monitoring", "scaling", "security", "optimization"]),
    color: "#8b5cf6"
  },
  {
    name: "Accountant",
    description: "Financial analysis, bookkeeping, tax optimization, audit support, and financial planning",
    icon: "Calculator",
    capabilities: JSON.stringify(["accounting", "tax", "audit", "financial_analysis", "reporting", "compliance"]),
    color: "#10b981"
  },
  {
    name: "Game Designer",
    description: "Game mechanics, level design, narrative development, balance testing, and player experience optimization",
    icon: "Gamepad2",
    capabilities: JSON.stringify(["game_mechanics", "level_design", "narrative", "balancing", "ux_design", "prototyping"]),
    color: "#f59e0b"
  },
  {
    name: "Politician",
    description: "Policy analysis, governance strategy, public communication, ethical decision-making, and democratic processes",
    icon: "Users",
    capabilities: JSON.stringify(["policy_analysis", "governance", "communication", "ethics", "strategy", "diplomacy"]),
    color: "#ef4444"
  },
  {
    name: "Lawyer",
    description: "Legal research, contract analysis, compliance checking, case strategy, and regulatory guidance",
    icon: "Scale",
    capabilities: JSON.stringify(["legal_research", "contracts", "compliance", "litigation", "advisory", "documentation"]),
    color: "#6366f1"
  },
  {
    name: "Doctor",
    description: "Medical consultation, diagnosis support, treatment planning, health monitoring, and patient care guidance",
    icon: "Stethoscope",
    capabilities: JSON.stringify(["diagnosis", "treatment", "consultation", "monitoring", "research", "preventive_care"]),
    color: "#ec4899"
  },
  {
    name: "Mechanical Engineer",
    description: "CAD design, structural analysis, manufacturing optimization, simulation, and mechanical systems development",
    icon: "Cog",
    capabilities: JSON.stringify(["cad_design", "analysis", "simulation", "manufacturing", "optimization", "prototyping"]),
    color: "#14b8a6"
  },
  {
    name: "Psychotherapist",
    description: "Mental health support, cognitive behavioral therapy, emotional intelligence, counseling, and wellness guidance",
    icon: "Brain",
    capabilities: JSON.stringify(["therapy", "counseling", "assessment", "treatment_planning", "crisis_intervention", "wellness"]),
    color: "#a855f7"
  },
  {
    name: "Tutor",
    description: "Personalized education across all subjects, adaptive learning, skill assessment, and knowledge transfer",
    icon: "GraduationCap",
    capabilities: JSON.stringify(["teaching", "assessment", "curriculum", "mentoring", "research", "adaptive_learning"]),
    color: "#06b6d4"
  }
];

async function seed() {
  console.log("Seeding agent types...");
  
  for (const agentType of initialAgentTypes) {
    try {
      await connection.execute(
        `INSERT INTO agentTypes (name, description, icon, capabilities, color) 
         VALUES (?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE description = VALUES(description), icon = VALUES(icon), capabilities = VALUES(capabilities), color = VALUES(color)`,
        [agentType.name, agentType.description, agentType.icon, agentType.capabilities, agentType.color]
      );
      console.log(`✓ Seeded: ${agentType.name}`);
    } catch (error) {
      console.error(`✗ Failed to seed ${agentType.name}:`, error.message);
    }
  }
  
  console.log("Seeding complete!");
  await connection.end();
  process.exit(0);
}

seed();
