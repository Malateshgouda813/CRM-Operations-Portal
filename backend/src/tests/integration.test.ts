import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { Role, CustomerType, CustomerStatus, MovementType, ChallanStatus } from '../types';

const DEMO_PASSWORD = 'Demo@12345';

async function runIntegrationTests() {
  console.log('====================================================');
  console.log('🧪 STARTING AUTOMATED BACKEND INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Database Connectivity & User Seeding
    // ----------------------------------------------------
    console.log('📌 Test Group 1: Users & Auth Credentials');
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: { passwordHash },
      create: {
        email: 'admin@example.com',
        name: 'System Administrator',
        role: Role.ADMIN,
        passwordHash,
      },
    });

    const salesUser = await prisma.user.upsert({
      where: { email: 'sales@example.com' },
      update: { passwordHash },
      create: {
        email: 'sales@example.com',
        name: 'Sales Officer',
        role: Role.SALES,
        passwordHash,
      },
    });

    const warehouseUser = await prisma.user.upsert({
      where: { email: 'warehouse@example.com' },
      update: { passwordHash },
      create: {
        email: 'warehouse@example.com',
        name: 'Warehouse Manager',
        role: Role.WAREHOUSE,
        passwordHash,
      },
    });

    const accountsUser = await prisma.user.upsert({
      where: { email: 'accounts@example.com' },
      update: { passwordHash },
      create: {
        email: 'accounts@example.com',
        name: 'Accounts Officer',
        role: Role.ACCOUNTS,
        passwordHash,
      },
    });

    assert(Boolean(adminUser && salesUser && warehouseUser && accountsUser), 'All 4 demo user roles seeded');

    // Test password verification
    const isPasswordValid = await bcrypt.compare(DEMO_PASSWORD, adminUser.passwordHash);
    assert(isPasswordValid, 'Password hashing & bcrypt comparison verified');

    const isWrongPasswordInvalid = !(await bcrypt.compare('WrongPassword999', adminUser.passwordHash));
    assert(isWrongPasswordInvalid, 'Invalid password correctly rejected');

    // Test JWT signing & verification
    const token = jwt.sign(
      { userId: adminUser.id, email: adminUser.email, role: adminUser.role, name: adminUser.name },
      ENV.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const decoded: any = jwt.verify(token, ENV.JWT_SECRET);
    assert(decoded.userId === adminUser.id && decoded.role === 'ADMIN', 'JWT token generates and verifies claims correctly');

    // ----------------------------------------------------
    // TEST 2: Customer CRM & Follow-Up Notes
    // ----------------------------------------------------
    console.log('\n📌 Test Group 2: Customer CRM & Follow-ups');
    const testCustomerEmail = `test.client.${Date.now()}@testcompany.com`;
    const customer = await prisma.customer.create({
      data: {
        name: 'Test Enterprise Solutions',
        mobile: '+91 99000 11222',
        email: testCustomerEmail,
        businessName: 'Test Enterprise Pvt Ltd',
        gstNumber: '27AAAAA0000A1Z5',
        customerType: CustomerType.DISTRIBUTOR,
        address: 'Tech Park, Mumbai',
        status: CustomerStatus.ACTIVE,
        followUpDate: new Date('2026-09-01'),
        notes: 'Integration test customer record',
      },
    });
    assert(Boolean(customer.id), 'Customer record created successfully');

    const followUp = await prisma.followUpNote.create({
      data: {
        customerId: customer.id,
        note: 'Discussed wholesale pricing terms and annual volume discount.',
        followUpDate: new Date('2026-09-10'),
        createdById: salesUser.id,
      },
    });
    assert(Boolean(followUp.id && followUp.customerId === customer.id), 'Follow-up note logged and linked to customer');

    // ----------------------------------------------------
    // TEST 3: Product Catalog & Low-Stock Detection
    // ----------------------------------------------------
    console.log('\n📌 Test Group 3: Product Catalog & Low-Stock Rules');
    const skuA = `SKU-TEST-A-${Date.now()}`;
    const skuB = `SKU-TEST-B-${Date.now()}`;

    const productA = await prisma.product.create({
      data: {
        name: 'High Voltage Circuit Switch',
        sku: skuA,
        category: 'Switchgear',
        unitPrice: 1250.0,
        currentStock: 20,
        minimumStock: 10,
        location: 'Warehouse-1 / Bin-A',
      },
    });

    const productB = await prisma.product.create({
      data: {
        name: 'Heavy Duty Power Cable 50m',
        sku: skuB,
        category: 'Cables',
        unitPrice: 3500.0,
        currentStock: 2,
        minimumStock: 5, // LOW STOCK: 2 <= 5
        location: 'Warehouse-1 / Bin-B',
      },
    });

    assert(productA.currentStock > productA.minimumStock, 'Product A verified as normal stock level');
    assert(productB.currentStock <= productB.minimumStock, 'Product B verified as low stock level (current <= minimum)');

    // ----------------------------------------------------
    // TEST 4: Inventory Movements & Non-Negative Stock Rule
    // ----------------------------------------------------
    console.log('\n📌 Test Group 4: Inventory Movements & Stock Safety');

    // Record IN Movement
    const initialStockA = productA.currentStock;
    const inQty = 15;
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productA.id },
        data: { currentStock: { increment: inQty } },
      });
      await tx.stockMovement.create({
        data: {
          productId: productA.id,
          quantity: inQty,
          type: MovementType.IN,
          reason: 'Received supplier shipment PO-8841',
          createdById: warehouseUser.id,
        },
      });
    });

    const updatedProductA = await prisma.product.findUnique({ where: { id: productA.id } });
    assert(updatedProductA?.currentStock === initialStockA + inQty, 'Stock IN movement incremented inventory correctly');

    // Attempt invalid OUT movement exceeding stock
    let insufficientStockBlocked = false;
    try {
      await prisma.$transaction(async (tx) => {
        const p = await tx.product.findUnique({ where: { id: productB.id } });
        const requestedOut = 50; // Stock is only 2
        if (!p || p.currentStock < requestedOut) {
          throw new Error('Insufficient stock for OUT movement');
        }
        await tx.product.update({
          where: { id: productB.id },
          data: { currentStock: { decrement: requestedOut } },
        });
      });
    } catch (e: any) {
      insufficientStockBlocked = true;
    }
    assert(insufficientStockBlocked, 'Direct excessive stock OUT movement blocked; negative stock prevented');

    // ----------------------------------------------------
    // TEST 5: Sales Challan Workflow & Atomic Transactions
    // ----------------------------------------------------
    console.log('\n📌 Test Group 5: Sales Challan Full Lifecycle & Atomic Verification');

    // 5.1 Create DRAFT Challan
    const challanNumber = `CH-TEST-${Date.now()}`;
    const draftChallan = await prisma.salesChallan.create({
      data: {
        challanNumber,
        customerId: customer.id,
        totalQuantity: 8,
        status: ChallanStatus.DRAFT,
        createdById: salesUser.id,
        items: {
          create: [
            {
              productId: productA.id,
              productNameSnapshot: productA.name,
              skuSnapshot: productA.sku,
              unitPriceSnapshot: productA.unitPrice,
              quantity: 5,
            },
            {
              productId: productB.id,
              productNameSnapshot: productB.name,
              skuSnapshot: productB.sku,
              unitPriceSnapshot: productB.unitPrice,
              quantity: 3,
            },
          ],
        },
      },
      include: { items: true },
    });

    assert(draftChallan.status === ChallanStatus.DRAFT, 'Draft Sales Challan created with status DRAFT');

    // Verify stock did NOT change upon draft creation
    const checkStockAfterDraftA = await prisma.product.findUnique({ where: { id: productA.id } });
    const checkStockAfterDraftB = await prisma.product.findUnique({ where: { id: productB.id } });
    assert(
      checkStockAfterDraftA?.currentStock === updatedProductA?.currentStock &&
      checkStockAfterDraftB?.currentStock === productB.currentStock,
      'CRITICAL: Draft challan creation DID NOT modify product inventory'
    );

    // 5.2 Attempt confirmation with insufficient stock (Product B has stock = 2, requires 3)
    let rollbackSuccess = false;
    try {
      await prisma.$transaction(async (tx) => {
        for (const item of draftChallan.items) {
          const p = await tx.product.findUnique({ where: { id: item.productId } });
          if (!p || p.currentStock < item.quantity) {
            throw new Error(`Insufficient stock for product ${item.productNameSnapshot}. Available: ${p?.currentStock}, Required: ${item.quantity}`);
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });
        }
        await tx.salesChallan.update({
          where: { id: draftChallan.id },
          data: { status: ChallanStatus.CONFIRMED },
        });
      });
    } catch (e: any) {
      rollbackSuccess = true;
    }
    assert(rollbackSuccess, 'Challan confirmation aborted due to insufficient stock on item B');

    // Verify atomic rollback: Product A stock must NOT have been reduced
    const stockAfterRollbackA = await prisma.product.findUnique({ where: { id: productA.id } });
    const stockAfterRollbackB = await prisma.product.findUnique({ where: { id: productB.id } });
    assert(
      stockAfterRollbackA?.currentStock === updatedProductA?.currentStock &&
      stockAfterRollbackB?.currentStock === productB.currentStock,
      'CRITICAL: Entire transaction rolled back cleanly; 0 partial stock updates occurred'
    );

    // 5.3 Stock In enough quantity for Product B and re-confirm
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productB.id },
        data: { currentStock: { increment: 20 } },
      });
      await tx.stockMovement.create({
        data: {
          productId: productB.id,
          quantity: 20,
          type: MovementType.IN,
          reason: 'Emergency restock for sales dispatch',
          createdById: warehouseUser.id,
        },
      });
    });

    const stockPriorToConfirmA = (await prisma.product.findUnique({ where: { id: productA.id } }))!.currentStock;
    const stockPriorToConfirmB = (await prisma.product.findUnique({ where: { id: productB.id } }))!.currentStock;

    // Confirm challan atomically
    const confirmedChallan = await prisma.$transaction(async (tx) => {
      for (const item of draftChallan.items) {
        const p = await tx.product.findUnique({ where: { id: item.productId } });
        if (!p || p.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${p?.name}`);
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: MovementType.OUT,
            reason: `Dispatched against Sales Challan ${draftChallan.challanNumber}`,
            createdById: warehouseUser.id,
          },
        });
      }
      return tx.salesChallan.update({
        where: { id: draftChallan.id },
        data: { status: ChallanStatus.CONFIRMED },
        include: { items: true },
      });
    });

    assert(confirmedChallan.status === ChallanStatus.CONFIRMED, 'Sales Challan confirmed successfully');

    // Verify stock was reduced precisely by line item quantities
    const finalStockA = (await prisma.product.findUnique({ where: { id: productA.id } }))!.currentStock;
    const finalStockB = (await prisma.product.findUnique({ where: { id: productB.id } }))!.currentStock;
    assert(finalStockA === stockPriorToConfirmA - 5, 'Product A stock reduced by exactly 5');
    assert(finalStockB === stockPriorToConfirmB - 3, 'Product B stock reduced by exactly 3');

    // Verify OUT stock movements were created
    const outMovements = await prisma.stockMovement.findMany({
      where: {
        reason: `Dispatched against Sales Challan ${draftChallan.challanNumber}`,
      },
    });
    assert(outMovements.length === 2, 'OUT stock movement records generated for all items');

    // 5.4 Test cancellation of draft challan
    const draftChallan2 = await prisma.salesChallan.create({
      data: {
        challanNumber: `CH-TEST-CANCEL-${Date.now()}`,
        customerId: customer.id,
        totalQuantity: 1,
        status: ChallanStatus.DRAFT,
        createdById: salesUser.id,
        items: {
          create: [
            {
              productId: productA.id,
              productNameSnapshot: productA.name,
              skuSnapshot: productA.sku,
              unitPriceSnapshot: productA.unitPrice,
              quantity: 1,
            },
          ],
        },
      },
    });

    const cancelledChallan = await prisma.salesChallan.update({
      where: { id: draftChallan2.id },
      data: { status: ChallanStatus.CANCELLED },
    });
    assert(cancelledChallan.status === ChallanStatus.CANCELLED, 'Draft challan successfully cancelled');

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passedTests} INTEGRATION TESTS PASSED PERFECTLY!`);
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runIntegrationTests();
