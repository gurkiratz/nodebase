# Workflow nodes and connections
_Exported on 1/17/2026 at 16:54:05 EST from Cursor (2.3.41)_

---

**User**

i really want to understand the workflow. mainly its nodes and connections and relations. like fromXX, toXX, output, input.

---

**Cursor**

I'll explore the schema and related code to explain the workflow data model to you.

Let me also check the editor component to see how React Flow uses these.

Now I have a clear picture. Let me explain the workflow data model to you.

## Workflow Data Model

### Overview

Your workflow system has **3 main entities**:

1. **Workflow** - The container/canvas
2. **Node** - Individual blocks on the canvas
3. **Connection** - The arrows/edges linking nodes together

---

### 1. Workflow

```80:91:prisma/schema.prisma
model Workflow {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  nodes Node[]
  connections Connection[]

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

A workflow is simply a named container that holds nodes and connections, owned by a user.

---

### 2. Node

```99:114:prisma/schema.prisma
model Node {
  id        String   @id @default(cuid())
  workflowId String
  workflow Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  name String
  type NodeType
  positions Json
  data Json @default("{}")

  outputConnections Connection[] @relation("FromNode")
  inputConnections Connection[] @relation("ToNode")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Each node has:
- **type** - What kind of node it is (`INITIAL`, `MANUAL_TRIGGER`, `HTTP_REQUEST`)
- **positions** - JSON with `{x, y}` coordinates on the canvas
- **data** - Arbitrary JSON for node-specific configuration
- **outputConnections** - All connections *leaving* this node (where this node is the source)
- **inputConnections** - All connections *entering* this node (where this node is the target)

---

### 3. Connection (the key part you're asking about)

```116:133:prisma/schema.prisma
model Connection {
  id        String   @id @default(cuid())
  workflowId String
  workflow Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  fromNodeId String
  fromNode Node @relation("FromNode", fields: [fromNodeId], references: [id], onDelete: Cascade)
  toNodeId String
  toNode Node @relation("ToNode", fields: [toNodeId], references: [id], onDelete: Cascade)

  fromOutput String @default("main")
  toInput String @default("main")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([fromNodeId, toNodeId, fromOutput, toInput])
}
```

This is where the relationships happen:

| Field | Meaning |
|-------|---------|
| `fromNodeId` | The **source** node (where the arrow starts) |
| `toNodeId` | The **target** node (where the arrow ends) |
| `fromOutput` | Which **output handle** on the source node (defaults to `"main"`) |
| `toInput` | Which **input handle** on the target node (defaults to `"main"`) |

---

### Visual Representation

```
┌──────────────┐                      ┌──────────────┐
│   Node A     │                      │   Node B     │
│              │                      │              │
│       (main) ●──────Connection──────● (main)       │
│      output  │                      │  input       │
└──────────────┘                      └──────────────┘
        ↑                                    ↑
   fromNodeId                           toNodeId
   fromOutput="main"                    toInput="main"
```

---

### Handles: Why `fromOutput` and `toInput`?

Nodes can have **multiple input/output ports** (called "handles" in React Flow). For example:

- A conditional node might have two outputs: `"true"` and `"false"`
- A merge node might have multiple inputs: `"input1"`, `"input2"`

The `fromOutput`/`toInput` fields allow you to specify *which* handle the connection attaches to. Currently your nodes default to `"main"` for a single input/output.

---

### Mapping to React Flow

When data is fetched, it transforms to React Flow format:

```136:142:src/features/workflows/server/routers.ts
      const edges: Edge[] = workflow.connections.map((connection) => ({
        id: connection.id,
        source: connection.fromNodeId,
        target: connection.toNodeId,
        sourceHandle: connection.fromOutput,
        targetHandle: connection.toInput,
      }));
```

| Database (Connection) | React Flow (Edge) |
|-----------------------|-------------------|
| `fromNodeId` | `source` |
| `toNodeId` | `target` |
| `fromOutput` | `sourceHandle` |
| `toInput` | `targetHandle` |

---

### Summary

- **Connection** is an edge between two nodes
- **fromNodeId/toNodeId** = which nodes are connected
- **fromOutput/toInput** = which specific handles (ports) on those nodes
- A node can have many `outputConnections` (going out) and many `inputConnections` (coming in)

---

**User**

so are we storing all this info in database as well. like for a workflow, its nodes, connections/edges. and we are returning this info in the router as well.

---

**Cursor**

Yes, exactly. Everything is persisted in the database and returned through the router.

### What's Stored in the Database

| Table | What it stores |
|-------|----------------|
| `Workflow` | id, name, userId, timestamps |
| `Node` | id, workflowId, type, name, positions (x,y), data (JSON config) |
| `Connection` | id, workflowId, fromNodeId, toNodeId, fromOutput, toInput |

### How It's Fetched (getOne)

```119:150:src/features/workflows/server/routers.ts
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
        include: { nodes: true, connections: true },
      });

      // Transform the server nodes to react-flow compatible nodes
      const nodes: Node[] = workflow.nodes.map((node) => {
        return {
          id: node.id,
          type: node.type,
          position: node.positions as { x: number; y: number },
          data: (node.data as Record<string, unknown>) || {},
        };
      });

      // Transform the server connections to react-flow compatible edges
      const edges: Edge[] = workflow.connections.map((connection) => ({
        id: connection.id,
        source: connection.fromNodeId,
        target: connection.toNodeId,
        sourceHandle: connection.fromOutput,
        targetHandle: connection.toInput,
      }));

      return {
        id: workflow.id,
        name: workflow.name,
        nodes,
        edges,
      };
    }),
```

The `include: { nodes: true, connections: true }` tells Prisma to JOIN and fetch the related nodes and connections in one query.

### How It's Saved (update)

```69:105:src/features/workflows/server/routers.ts
      return await prisma.$transaction(async (tx) => {
        // Deleting existing nodes and connections (cascade deletes connections)
        await tx.node.deleteMany({
          where: { workflowId: id },
        });

        // Create nodes
        await tx.node.createMany({
          data: nodes.map((node) => ({
            id: node.id,
            workflowId: id,
            name: node.type || "unknown",
            type: node.type as NodeType,
            positions: node.positions,
            data: node.data || {},
          })),
        });

        // Create connections
        await tx.connection.createMany({
          data: edges.map((edge) => ({
            workflowId: id,
            fromNodeId: edge.source,
            toNodeId: edge.target,
            fromOutput: edge.sourceHandle || "main",
            toInput: edge.targetHandle || "main",
          })),
        });
        // ...
      });
```

When saving, it does a "delete all and recreate" approach inside a transaction:
1. Delete all existing nodes (connections cascade delete automatically)
2. Create all nodes from the React Flow state
3. Create all connections from the React Flow edges

### The Flow

```
┌─────────────────┐         ┌──────────────┐         ┌───────────────┐
│   PostgreSQL    │ ──────► │   Router     │ ──────► │  React Flow   │
│   (Database)    │         │  (getOne)    │         │   (Editor)    │
│                 │         │              │         │               │
│  - Workflow     │         │  Transform:  │         │  - nodes[]    │
│  - Node[]       │         │  DB → RF     │         │  - edges[]    │
│  - Connection[] │         │              │         │               │
└─────────────────┘         └──────────────┘         └───────────────┘

┌───────────────┐         ┌──────────────┐         ┌─────────────────┐
│  React Flow   │ ──────► │   Router     │ ──────► │   PostgreSQL    │
│   (Editor)    │         │  (update)    │         │   (Database)    │
│               │         │              │         │                 │
│  - nodes[]    │         │  Transform:  │         │  - Node[]       │
│  - edges[]    │         │  RF → DB     │         │  - Connection[] │
└───────────────┘         └──────────────┘         └─────────────────┘
```

So yes — the database is the source of truth, and the router transforms between database format and React Flow format in both directions.

