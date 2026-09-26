export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "StockSense Inventory Management API",
    version: "1.0.0",
    description:
      "Enterprise Double-Entry Inventory Engine API for StockSense. Handles multi-warehouse receipts, delivery orders, internal transfers, cycle count adjustments, and the immutable stock ledger.",
    contact: {
      name: "StockSense Backend Team",
    },
  },
  servers: [
    {
      url: "http://localhost:4000/api",
      description: "Local Development Server",
    },
  ],
  tags: [
    { name: "Dashboard", description: "Real-time KPI metrics and operational cards" },
    { name: "Operations", description: "Receipts, Deliveries, and Internal Transfers lifecycle" },
    { name: "Adjustments", description: "Physical count reconciliation and discrepancy ledger" },
    { name: "Products", description: "Product catalog, UoM, pricing, and stock levels" },
    { name: "Ledger", description: "Forensic move history and immutable stock audit log" },
    { name: "Warehouses", description: "Warehouses and physical storage hierarchies" },
    { name: "Locations", description: "Internal and virtual location catalog" },
    { name: "Partners", description: "Suppliers/Vendors and Customers" },
  ],
  paths: {
    "/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Get aggregated operational KPIs",
        description: "Returns Total Products in Stock, Low/Out of Stock count, Pending Receipts (late/scheduled), Pending Deliveries (waiting/late), and Scheduled Transfers.",
        responses: {
          200: { description: "Aggregated KPIs" },
        },
      },
    },
    "/operations": {
      get: {
        tags: ["Operations"],
        summary: "List stock operations",
        parameters: [
          { name: "type", in: "query", schema: { type: "string", enum: ["RECEIPT", "DELIVERY", "INTERNAL", "ADJUSTMENT"] } },
          { name: "status", in: "query", schema: { type: "string", enum: ["DRAFT", "WAITING", "READY", "DONE", "CANCELED"] } },
          { name: "warehouseId", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "List of operations" } },
      },
      post: {
        tags: ["Operations"],
        summary: "Create a new stock operation in DRAFT state",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type", "warehouseId", "moves"],
                properties: {
                  type: { type: "string", enum: ["RECEIPT", "DELIVERY", "INTERNAL"] },
                  warehouseId: { type: "string", format: "uuid" },
                  partnerId: { type: "string", format: "uuid" },
                  scheduledDate: { type: "string", format: "date-time" },
                  notes: { type: "string" },
                  moves: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["productId", "qtyDemanded"],
                      properties: {
                        productId: { type: "string", format: "uuid" },
                        qtyDemanded: { type: "number", example: 10 },
                        sourceLocationId: { type: "string", format: "uuid" },
                        destLocationId: { type: "string", format: "uuid" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Operation created in DRAFT" } },
      },
    },
    "/operations/{id}/check-availability": {
      post: {
        tags: ["Operations"],
        summary: "Check stock availability (Transitions DRAFT/WAITING -> READY or WAITING)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Availability check result with shortages if any" } },
      },
    },
    "/operations/{id}/validate": {
      post: {
        tags: ["Operations"],
        summary: "Validate and execute operation atomically (READY -> DONE)",
        description: "Executes double-entry balance updates, row-level locks, commits ledger entries, and evaluates automatic low-stock reorder triggers.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Stock transferred and ledger written" } },
      },
    },
    "/operations/{id}/cancel": {
      post: {
        tags: ["Operations"],
        summary: "Cancel an operation",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Operation canceled" } },
      },
    },
    "/adjustments": {
      post: {
        tags: ["Adjustments"],
        summary: "Reconcile physical inventory count discrepancy",
        description: "Calculates difference Delta = Counted - Recorded and automatically validates compensating moves with virtual Inventory Loss location.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId", "locationId", "countedQty"],
                properties: {
                  productId: { type: "string", format: "uuid" },
                  locationId: { type: "string", format: "uuid" },
                  countedQty: { type: "number", example: 45 },
                  reason: { type: "string", example: "Damaged during handling" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Stock adjusted and ledger reconciled" } },
      },
    },
    "/ledger": {
      get: {
        tags: ["Ledger"],
        summary: "Query Move History and Immutable Audit Ledger",
        parameters: [
          { name: "productId", in: "query", schema: { type: "string" } },
          { name: "referenceNo", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "dateFrom", in: "query", schema: { type: "string" } },
          { name: "dateTo", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "Audit trail entries with directional color flags" } },
      },
    },
    "/products": {
      get: {
        tags: ["Products"],
        summary: "List products with On-Hand, Reserved, and Free-to-Use metrics",
        responses: { 200: { description: "List of products" } },
      },
      post: {
        tags: ["Products"],
        summary: "Create product",
        responses: { 201: { description: "Product created" } },
      },
    },
  },
};
