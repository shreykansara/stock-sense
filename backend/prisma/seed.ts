import { PrismaClient, LocationType, OperationType, OperationStatus, UserRole, PartnerType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting StockSense database seeding...");

  // 1. Seed Default Users (Authentication team can attach passwords/hashes to these records)
  const managerUser = await prisma.user.upsert({
    where: { email: "shrey@stocksense.local" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      email: "shrey@stocksense.local",
      name: "Shrey Kansara",
      role: UserRole.INVENTORY_MANAGER,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "staff@stocksense.local" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      email: "staff@stocksense.local",
      name: "Warehouse Operator",
      role: UserRole.WAREHOUSE_STAFF,
    },
  });

  console.log("✅ Users seeded:", managerUser.name, staffUser.name);

  // 2. Seed Virtual Locations (Global external counterpart locations)
  const virtualLocations = [
    { name: "Vendors", shortCode: "VENDORS", type: LocationType.VENDOR },
    { name: "Customers", shortCode: "CUSTOMERS", type: LocationType.CUSTOMER },
    { name: "Inventory Loss", shortCode: "INVENTORY-LOSS", type: LocationType.INVENTORY_LOSS },
    { name: "Production Floor", shortCode: "PRODUCTION", type: LocationType.PRODUCTION },
  ];

  const virtualMap: Record<string, string> = {};
  for (const vLoc of virtualLocations) {
    let loc = await prisma.location.findFirst({
      where: { type: vLoc.type, warehouseId: null },
    });
    if (!loc) {
      loc = await prisma.location.create({
        data: {
          name: vLoc.name,
          shortCode: vLoc.shortCode,
          type: vLoc.type,
          warehouseId: null,
        },
      });
    }
    virtualMap[vLoc.type] = loc.id;
  }
  console.log("✅ Virtual locations verified:", Object.keys(virtualMap).join(", "));

  // 3. Seed Warehouses & Physical Locations
  const warehouse1 = await prisma.warehouse.upsert({
    where: { shortCode: "WH" },
    update: {},
    create: {
      name: "Main Warehouse",
      shortCode: "WH",
      address: "100 Industrial Parkway, Sector 12",
    },
  });

  const whStockLoc = await prisma.location.upsert({
    where: {
      warehouseId_shortCode: {
        warehouseId: warehouse1.id,
        shortCode: "STOCK",
      },
    },
    update: {},
    create: {
      name: "WH / Stock",
      shortCode: "STOCK",
      type: LocationType.INTERNAL,
      warehouseId: warehouse1.id,
    },
  });

  const whRackA = await prisma.location.upsert({
    where: {
      warehouseId_shortCode: {
        warehouseId: warehouse1.id,
        shortCode: "RACK-A",
      },
    },
    update: {},
    create: {
      name: "WH / Zone A / Rack 1",
      shortCode: "RACK-A",
      type: LocationType.INTERNAL,
      warehouseId: warehouse1.id,
    },
  });

  const whRackB = await prisma.location.upsert({
    where: {
      warehouseId_shortCode: {
        warehouseId: warehouse1.id,
        shortCode: "RACK-B",
      },
    },
    update: {},
    create: {
      name: "WH / Zone B / Rack 2",
      shortCode: "RACK-B",
      type: LocationType.INTERNAL,
      warehouseId: warehouse1.id,
    },
  });

  const whProdRack = await prisma.location.upsert({
    where: {
      warehouseId_shortCode: {
        warehouseId: warehouse1.id,
        shortCode: "PROD-RACK",
      },
    },
    update: {},
    create: {
      name: "WH / Production Rack",
      shortCode: "PROD-RACK",
      type: LocationType.INTERNAL,
      warehouseId: warehouse1.id,
    },
  });

  console.log("✅ Warehouses and physical locations created for:", warehouse1.name);

  // 4. Seed Categories
  const catFurniture = await prisma.category.upsert({
    where: { name: "Furniture" },
    update: {},
    create: { name: "Furniture", description: "Office desks, chairs, tables, and cabinets" },
  });

  const catRawMaterials = await prisma.category.upsert({
    where: { name: "Raw Materials" },
    update: {},
    create: { name: "Raw Materials", description: "Metals, steel rods, wood planks, fasteners" },
  });

  // 5. Seed Products
  const productsData = [
    {
      sku: "DESK-001",
      name: "Executive Desk",
      categoryId: catFurniture.id,
      uom: "Units",
      perUnitCost: 3000,
      minReorderQty: 10,
      initialQty: 50,
    },
    {
      sku: "TABLE-001",
      name: "Conference Table",
      categoryId: catFurniture.id,
      uom: "Units",
      perUnitCost: 5000,
      minReorderQty: 5,
      initialQty: 20,
    },
    {
      sku: "CHAIR-001",
      name: "Ergonomic Mesh Chair",
      categoryId: catFurniture.id,
      uom: "Units",
      perUnitCost: 1200,
      minReorderQty: 15,
      initialQty: 40,
    },
    {
      sku: "STEEL-ROD-10",
      name: "Steel Rods 10mm",
      categoryId: catRawMaterials.id,
      uom: "kg",
      perUnitCost: 85,
      minReorderQty: 50,
      initialQty: 150,
    },
  ];

  const productMap: Record<string, string> = {};

  for (const p of productsData) {
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        categoryId: p.categoryId,
        uom: p.uom,
        perUnitCost: new Decimal(p.perUnitCost),
        minReorderQty: new Decimal(p.minReorderQty),
      },
    });

    productMap[p.sku] = prod.id;

    // Seed stock quants in WH / Stock
    await prisma.stockQuant.upsert({
      where: {
        productId_locationId: {
          productId: prod.id,
          locationId: whStockLoc.id,
        },
      },
      update: { quantity: new Decimal(p.initialQty) },
      create: {
        productId: prod.id,
        locationId: whStockLoc.id,
        quantity: new Decimal(p.initialQty),
      },
    });
  }
  console.log("✅ Products and stock quants seeded:", Object.keys(productMap).join(", "));

  // 6. Seed Partners
  const partnerAzure = await prisma.partner.upsert({
    where: { id: "10000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "10000000-0000-0000-0000-000000000001",
      name: "Azure Interior",
      email: "procurement@azureinterior.com",
      phone: "+1 555-0199",
      address: "450 Broadway, Suite 800, New York, NY",
      type: PartnerType.CUSTOMER,
    },
  });

  const partnerSteelCorp = await prisma.partner.upsert({
    where: { id: "10000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "10000000-0000-0000-0000-000000000002",
      name: "Steel Corp Global",
      email: "orders@steelcorpglobal.com",
      phone: "+1 555-0245",
      address: "88 Industrial Port Road, Seattle, WA",
      type: PartnerType.VENDOR,
    },
  });

  // 7. Seed Sample Operations (Receipt, Delivery, Transfer, Adjustment)
  // Operation 1: Past Receipt (DONE)
  const opReceipt = await prisma.stockOperation.upsert({
    where: { referenceNo: "WH/IN/0001" },
    update: {},
    create: {
      referenceNo: "WH/IN/0001",
      type: OperationType.RECEIPT,
      status: OperationStatus.DONE,
      warehouseId: warehouse1.id,
      partnerId: partnerSteelCorp.id,
      responsibleUserId: staffUser.id,
      scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      notes: "Received vendor batch shipment",
    },
  });

  const moveReceipt = await prisma.stockMove.create({
    data: {
      operationId: opReceipt.id,
      productId: productMap["STEEL-ROD-10"],
      sourceLocationId: virtualMap[LocationType.VENDOR],
      destLocationId: whStockLoc.id,
      qtyDemanded: new Decimal(100),
      qtyDone: new Decimal(100),
      status: OperationStatus.DONE,
    },
  });

  await prisma.stockLedger.create({
    data: {
      moveId: moveReceipt.id,
      productId: productMap["STEEL-ROD-10"],
      fromLocationId: virtualMap[LocationType.VENDOR],
      toLocationId: whStockLoc.id,
      quantity: new Decimal(100),
      referenceNo: "WH/IN/0001",
      userId: staffUser.id,
      notes: "Vendor Receipt: Steel Corp Global",
    },
  });

  // Operation 2: Delivery Order (WAITING / READY)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const opDelivery = await prisma.stockOperation.upsert({
    where: { referenceNo: "WH/OUT/0001" },
    update: {},
    create: {
      referenceNo: "WH/OUT/0001",
      type: OperationType.DELIVERY,
      status: OperationStatus.READY,
      warehouseId: warehouse1.id,
      partnerId: partnerAzure.id,
      responsibleUserId: managerUser.id,
      scheduledDate: tomorrow,
      notes: "Customer sales order fulfillment for Azure Interior",
    },
  });

  await prisma.stockMove.create({
    data: {
      operationId: opDelivery.id,
      productId: productMap["DESK-001"],
      sourceLocationId: whStockLoc.id,
      destLocationId: virtualMap[LocationType.CUSTOMER],
      qtyDemanded: new Decimal(5),
      qtyDone: new Decimal(0),
      status: OperationStatus.READY,
    },
  });

  // Operation 3: Internal Transfer to Production Rack (DONE)
  const opInternal = await prisma.stockOperation.upsert({
    where: { referenceNo: "WH/INT/0001" },
    update: {},
    create: {
      referenceNo: "WH/INT/0001",
      type: OperationType.INTERNAL,
      status: OperationStatus.DONE,
      warehouseId: warehouse1.id,
      responsibleUserId: staffUser.id,
      scheduledDate: new Date(),
      notes: "Staged raw steel to production rack",
    },
  });

  const moveInternal = await prisma.stockMove.create({
    data: {
      operationId: opInternal.id,
      productId: productMap["STEEL-ROD-10"],
      sourceLocationId: whStockLoc.id,
      destLocationId: whProdRack.id,
      qtyDemanded: new Decimal(30),
      qtyDone: new Decimal(30),
      status: OperationStatus.DONE,
    },
  });

  await prisma.stockLedger.create({
    data: {
      moveId: moveInternal.id,
      productId: productMap["STEEL-ROD-10"],
      fromLocationId: whStockLoc.id,
      toLocationId: whProdRack.id,
      quantity: new Decimal(30),
      referenceNo: "WH/INT/0001",
      userId: staffUser.id,
      notes: "Internal Transfer to Production Floor",
    },
  });

  // Update sequences table to start from next numbers
  await prisma.sequence.upsert({
    where: {
      warehouseCode_operationType: {
        warehouseCode: "WH",
        operationType: OperationType.RECEIPT,
      },
    },
    update: { nextNumber: 2 },
    create: { warehouseCode: "WH", operationType: OperationType.RECEIPT, nextNumber: 2 },
  });

  await prisma.sequence.upsert({
    where: {
      warehouseCode_operationType: {
        warehouseCode: "WH",
        operationType: OperationType.DELIVERY,
      },
    },
    update: { nextNumber: 2 },
    create: { warehouseCode: "WH", operationType: OperationType.DELIVERY, nextNumber: 2 },
  });

  await prisma.sequence.upsert({
    where: {
      warehouseCode_operationType: {
        warehouseCode: "WH",
        operationType: OperationType.INTERNAL,
      },
    },
    update: { nextNumber: 2 },
    create: { warehouseCode: "WH", operationType: OperationType.INTERNAL, nextNumber: 2 },
  });

  console.log("\n🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
